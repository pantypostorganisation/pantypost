// src/services/mock/handlers/messages.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { Message, MessageThread } from '@/services/messages.service';
import { v4 as uuidv4 } from 'uuid';

// Helper to get conversation key
function getConversationKey(userA: string, userB: string): string {
  return [userA, userB].sort().join('-');
}

// Generate mock message
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
    sender,
    receiver,
    content: messages[index % messages.length],
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
    
    const messages = await mockDataStore.get<Record<string, Message[]>>('messages', {});
    const blockedUsers = await mockDataStore.get<Record<string, string[]>>('blockedUsers', {});
    
    const threads: MessageThread[] = [];
    
    // Find all conversations involving the user
    for (const [key, messageList] of Object.entries(messages)) {
      if (key.includes(username) && messageList.length > 0) {
        const [userA, userB] = key.split('-');
        const otherUser = userA === username ? userB : userA;
        
        // Filter by role if specified
        if (role) {
          const users = await mockDataStore.get<Record<string, any>>('users', {});
          const otherUserData = users[otherUser];
          
          if (role === 'buyer' && otherUserData?.role !== 'seller') continue;
          if (role === 'seller' && otherUserData?.role !== 'buyer') continue;
        }
        
        const unreadCount = messageList.filter(
          m => m.receiver === username && !m.isRead && !m.read
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
    
    const { sender, receiver, content, type = 'normal', meta, attachments } = data;
    
    if (!sender || !receiver || !content) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Sender, receiver, and content are required' },
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
      content,
      date: new Date().toISOString(),
      isRead: false,
      read: false,
      type,
      meta,
      attachments,
    };
    
    if (!messages[conversationKey]) {
      messages[conversationKey] = [];
    }
    
    messages[conversationKey].push(newMessage);
    await mockDataStore.set('messages', messages);
    
    // Update notifications
    if (type !== 'customRequest') {
      const notifications = await mockDataStore.get<Record<string, any[]>>('messageNotifications', {});
      
      if (!notifications[receiver]) {
        notifications[receiver] = [];
      }
      
      const existingIndex = notifications[receiver].findIndex(n => n.buyer === sender);
      
      if (existingIndex >= 0) {
        notifications[receiver][existingIndex] = {
          buyer: sender,
          messageCount: notifications[receiver][existingIndex].messageCount + 1,
          lastMessage: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString(),
        };
      } else {
        notifications[receiver].push({
          buyer: sender,
          messageCount: 1,
          lastMessage: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString(),
        });
      }
      
      await mockDataStore.set('messageNotifications', notifications);
    }
    
    return {
      success: true,
      data: newMessage,
    };
  },
  
  // Mark messages as read
  markRead: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const { username, otherParty } = data;
    
    if (!username || !otherParty) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username and otherParty are required' },
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
  },
  
  // Block user
  block: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const { blocker, blocked } = data;
    
    if (!blocker || !blocked) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Blocker and blocked are required' },
      };
    }
    
    const blockedUsers = await mockDataStore.get<Record<string, string[]>>('blockedUsers', {});
    
    if (!blockedUsers[blocker]) {
      blockedUsers[blocker] = [];
    }
    
    if (!blockedUsers[blocker].includes(blocked)) {
      blockedUsers[blocker].push(blocked);
      await mockDataStore.set('blockedUsers', blockedUsers);
    }
    
    return { success: true };
  },
  
  // Unblock user
  unblock: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const { blocker, blocked } = data;
    
    if (!blocker || !blocked) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Blocker and blocked are required' },
      };
    }
    
    const blockedUsers = await mockDataStore.get<Record<string, string[]>>('blockedUsers', {});
    
    if (blockedUsers[blocker]) {
      blockedUsers[blocker] = blockedUsers[blocker].filter(u => u !== blocked);
      await mockDataStore.set('blockedUsers', blockedUsers);
    }
    
    return { success: true };
  },
  
  // Report user
  report: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const { reporter, reportee, reason, messages, category } = data;
    
    if (!reporter || !reportee) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Reporter and reportee are required' },
      };
    }
    
    const reports = await mockDataStore.get<any[]>('reportLogs', []);
    
    const newReport = {
      id: uuidv4(),
      reporter,
      reportee,
      reason,
      messages: messages || [],
      date: new Date().toISOString(),
      processed: false,
      category: category || 'other',
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
  },
} as const;