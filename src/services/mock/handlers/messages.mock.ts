// src/services/mock/handlers/messages.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { Message, MessageThread, MessageAttachment } from '@/services/messages.service';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { messageSchemas } from '@/utils/validation/schemas';
import { securityService } from '@/services/security.service';
import { z } from 'zod';

// Validation schemas
const sendMessageSchema = z.object({
  sender: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  receiver: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  content: z.string().min(1).max(1000),
  type: z.enum(['normal', 'customRequest', 'tip', 'image']).optional().default('normal'),
  meta: z.record(z.any()).optional(),
  attachments: z.array(z.string().url()).max(5).optional()
});

const markReadSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  otherParty: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/)
});

const blockUserSchema = z.object({
  blocker: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  blocked: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/)
});

const reportUserSchema = z.object({
  reporter: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  reportee: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  reason: z.string().min(10).max(500),
  messages: z.array(z.string()).max(10).optional(),
  category: z.enum(['spam', 'harassment', 'inappropriate', 'scam', 'other']).optional()
});

// Helper to get conversation key
function getConversationKey(userA: string, userB: string): string {
  const sanitizedA = sanitizeUsername(userA) || userA;
  const sanitizedB = sanitizeUsername(userB) || userB;
  return [sanitizedA, sanitizedB].sort().join('-');
}

// Helper to convert URL strings to MessageAttachment objects
function createMessageAttachment(url: string): MessageAttachment {
  // Determine type based on URL or file extension
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const isImage = imageExtensions.some(ext => url.toLowerCase().includes(ext));
  
  return {
    id: uuidv4(),
    url: url,
    type: isImage ? 'image' : 'file',
    name: url.split('/').pop() || 'attachment',
    size: Math.floor(Math.random() * 1000000) + 100000, // Mock size between 100KB and 1MB
    mimeType: isImage ? 'image/jpeg' : 'application/octet-stream'
  };
}

// Generate mock message with sanitized content
function generateMockMessage(sender: string, receiver: string, index: number): Message {
  const messages = [
    'Hi there! I love your listings.',
    'Thanks for your purchase!',
    'When will this be shipped?',
    'I just sent the package today.',
    'Could you do a custom order?',
    'Sure! What did you have in mind?',
    'The quality is amazing!',
    'Thank you so much! 💕',
  ];
  
  return {
    id: uuidv4(),
    sender: sanitizeUsername(sender) || sender,
    receiver: sanitizeUsername(receiver) || receiver,
    content: sanitizeStrict(messages[index % messages.length]) || messages[index % messages.length],
    date: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
    isRead: Math.random() > 0.3,
    read: Math.random() > 0.3,
    type: 'normal',
  };
}

export const mockMessageHandlers = {
  // Get threads
  threads: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<MessageThread[]>> => {
    const username = params?.username;
    const role = params?.role;
    
    if (!username) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username is required' },
      };
    }
    
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
      };
    }
    
    const messages = await mockDataStore.get<Record<string, Message[]>>('messages', {});
    const blockedUsers = await mockDataStore.get<Record<string, string[]>>('blockedUsers', {});
    
    const threads: MessageThread[] = [];
    
    // Find all conversations involving the user
    for (const [key, messageList] of Object.entries(messages)) {
      if (key.includes(sanitizedUsername) && messageList.length > 0) {
        const [userA, userB] = key.split('-');
        const otherUser = userA === sanitizedUsername ? userB : userA;
        
        // Filter by role if specified
        if (role && ['buyer', 'seller'].includes(role)) {
          const users = await mockDataStore.get<Record<string, any>>('users', {});
          const otherUserData = users[otherUser];
          
          if (role === 'buyer' && otherUserData?.role !== 'seller') continue;
          if (role === 'seller' && otherUserData?.role !== 'buyer') continue;
        }
        
        const unreadCount = messageList.filter(
          m => m.receiver === sanitizedUsername && !m.isRead && !m.read
        ).length;
        
        const blockedBy: string[] = [];
        if (blockedUsers[userA]?.includes(userB)) blockedBy.push(userA);
        if (blockedUsers[userB]?.includes(userA)) blockedBy.push(userB);
        
        threads.push({
          id: key,
          participants: [userA, userB] as [string, string],
          messages: messageList,
          lastMessage: messageList[messageList.length - 1],
          unreadCount,
          updatedAt: messageList[messageList.length - 1].date,
          blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
        });
      }
    }
    
    // Sort by last message date
    threads.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    
    return {
      success: true,
      data: threads,
    };
  },
  
  // Get single thread
  thread: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Message[]>> => {
    const threadId = params?.threadId;
    
    if (!threadId) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Thread ID is required' },
      };
    }
    
    // Validate thread ID format (should be username-username)
    if (!threadId.match(/^[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]+$/)) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid thread ID format' },
      };
    }
    
    const messages = await mockDataStore.get<Record<string, Message[]>>('messages', {});
    const threadMessages = messages[threadId] || [];
    
    return {
      success: true,
      data: threadMessages,
    };
  },
  
  // Send message
  send: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<Message>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    try {
      const validatedData = sendMessageSchema.parse(data);
      
      // Additional content security check
      const contentCheck = securityService.checkContentSecurity(validatedData.content);
      if (!contentCheck.safe) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Message contains prohibited content' },
        };
      }
      
      // Sanitize usernames
      const sender = sanitizeUsername(validatedData.sender);
      const receiver = sanitizeUsername(validatedData.receiver);
      
      if (!sender || !receiver) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
        };
      }
      
      // Prevent self-messaging
      if (sender === receiver) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Cannot send messages to yourself' },
        };
      }
      
      // Check if blocked
      const blockedUsers = await mockDataStore.get<Record<string, string[]>>('blockedUsers', {});
      if (blockedUsers[receiver]?.includes(sender)) {
        return {
          success: false,
          error: { code: 'USER_BLOCKED', message: 'You cannot send messages to this user' },
        };
      }
      
      const conversationKey = getConversationKey(sender, receiver);
      const messages = await mockDataStore.get<Record<string, Message[]>>('messages', {});
      
      const newMessage: Message = {
        id: uuidv4(),
        sender,
        receiver,
        content: sanitizeStrict(validatedData.content) || '',
        date: new Date().toISOString(),
        isRead: false,
        read: false,
        type: validatedData.type,
        meta: validatedData.meta,
        attachments: validatedData.attachments?.map(url => createMessageAttachment(url)),
      };
      
      if (!messages[conversationKey]) {
        messages[conversationKey] = [];
      }
      
      // Limit messages per conversation
      if (messages[conversationKey].length >= 10000) {
        return {
          success: false,
          error: { code: 'LIMIT_EXCEEDED', message: 'Message limit reached for this conversation' },
        };
      }
      
      messages[conversationKey].push(newMessage);
      await mockDataStore.set('messages', messages);
      
      // Update notifications (excluding customRequest type)
      if (validatedData.type !== 'customRequest') {
        const notifications = await mockDataStore.get<Record<string, any[]>>('messageNotifications', {});
        
        if (!notifications[receiver]) {
          notifications[receiver] = [];
        }
        
        const existingIndex = notifications[receiver].findIndex(n => n.buyer === sender);
        
        if (existingIndex >= 0) {
          notifications[receiver][existingIndex] = {
            buyer: sender,
            messageCount: notifications[receiver][existingIndex].messageCount + 1,
            lastMessage: sanitizeStrict(validatedData.content.substring(0, 50) + (validatedData.content.length > 50 ? '...' : '')) || '',
            timestamp: new Date().toISOString(),
          };
        } else {
          notifications[receiver].push({
            buyer: sender,
            messageCount: 1,
            lastMessage: sanitizeStrict(validatedData.content.substring(0, 50) + (validatedData.content.length > 50 ? '...' : '')) || '',
            timestamp: new Date().toISOString(),
          });
        }
        
        await mockDataStore.set('messageNotifications', notifications);
      }
      
      return {
        success: true,
        data: newMessage,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: sanitizeStrict(error.errors[0].message) || 'Invalid message data' 
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid message data' },
      };
    }
  },
  
  // Mark messages as read
  markRead: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    try {
      const validatedData = markReadSchema.parse(data);
      
      const username = sanitizeUsername(validatedData.username);
      const otherParty = sanitizeUsername(validatedData.otherParty);
      
      if (!username || !otherParty) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
        };
      }
      
      const conversationKey = getConversationKey(username, otherParty);
      const messages = await mockDataStore.get<Record<string, Message[]>>('messages', {});
      
      if (messages[conversationKey]) {
        messages[conversationKey] = messages[conversationKey].map(msg => {
          if (msg.receiver === username && msg.sender === otherParty) {
            return { ...msg, isRead: true, read: true };
          }
          return msg;
        });
        
        await mockDataStore.set('messages', messages);
      }
      
      // Clear notifications
      const notifications = await mockDataStore.get<Record<string, any[]>>('messageNotifications', {});
      if (notifications[username]) {
        notifications[username] = notifications[username].filter(n => n.buyer !== otherParty);
        if (notifications[username].length === 0) {
          delete notifications[username];
        }
        await mockDataStore.set('messageNotifications', notifications);
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request' },
      };
    }
  },
  
  // Block user
  block: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    try {
      const validatedData = blockUserSchema.parse(data);
      
      const blocker = sanitizeUsername(validatedData.blocker);
      const blocked = sanitizeUsername(validatedData.blocked);
      
      if (!blocker || !blocked) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
        };
      }
      
      // Prevent self-blocking
      if (blocker === blocked) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Cannot block yourself' },
        };
      }
      
      const blockedUsers = await mockDataStore.get<Record<string, string[]>>('blockedUsers', {});
      
      if (!blockedUsers[blocker]) {
        blockedUsers[blocker] = [];
      }
      
      // Prevent duplicate blocks
      if (!blockedUsers[blocker].includes(blocked)) {
        // Limit number of blocks per user
        if (blockedUsers[blocker].length >= 1000) {
          return {
            success: false,
            error: { code: 'LIMIT_EXCEEDED', message: 'Block list limit reached' },
          };
        }
        
        blockedUsers[blocker].push(blocked);
        await mockDataStore.set('blockedUsers', blockedUsers);
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request' },
      };
    }
  },
  
  // Unblock user
  unblock: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    try {
      const validatedData = blockUserSchema.parse(data);
      
      const blocker = sanitizeUsername(validatedData.blocker);
      const blocked = sanitizeUsername(validatedData.blocked);
      
      if (!blocker || !blocked) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
        };
      }
      
      const blockedUsers = await mockDataStore.get<Record<string, string[]>>('blockedUsers', {});
      
      if (blockedUsers[blocker]) {
        blockedUsers[blocker] = blockedUsers[blocker].filter(u => u !== blocked);
        await mockDataStore.set('blockedUsers', blockedUsers);
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid request' },
      };
    }
  },
  
  // Report user
  report: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    try {
      const validatedData = reportUserSchema.parse(data);
      
      const reporter = sanitizeUsername(validatedData.reporter);
      const reportee = sanitizeUsername(validatedData.reportee);
      
      if (!reporter || !reportee) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
        };
      }
      
      // Prevent self-reporting
      if (reporter === reportee) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Cannot report yourself' },
        };
      }
      
      // Check content security for reason
      const reasonCheck = securityService.checkContentSecurity(validatedData.reason);
      if (!reasonCheck.safe) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Report reason contains prohibited content' },
        };
      }
      
      const reports = await mockDataStore.get<any[]>('reportLogs', []);
      
      // Prevent spam reports
      const recentReports = reports.filter(r => 
        r.reporter === reporter && 
        new Date(r.date).getTime() > Date.now() - 24 * 60 * 60 * 1000
      );
      
      if (recentReports.length >= 10) {
        return {
          success: false,
          error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many reports in 24 hours' },
        };
      }
      
      const newReport = {
        id: uuidv4(),
        reporter,
        reportee,
        reason: sanitizeStrict(validatedData.reason) || '',
        messages: validatedData.messages?.map(m => sanitizeStrict(m) || '').filter(Boolean) || [],
        date: new Date().toISOString(),
        processed: false,
        category: validatedData.category || 'other',
      };
      
      reports.push(newReport);
      await mockDataStore.set('reportLogs', reports);
      
      // Mark as reported
      const reportedUsers = await mockDataStore.get<Record<string, string[]>>('reportedUsers', {});
      
      if (!reportedUsers[reporter]) {
        reportedUsers[reporter] = [];
      }
      
      if (!reportedUsers[reporter].includes(reportee)) {
        reportedUsers[reporter].push(reportee);
        await mockDataStore.set('reportedUsers', reportedUsers);
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: sanitizeStrict(error.errors[0].message) || 'Invalid report data' 
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid report data' },
      };
    }
  },
} as const;