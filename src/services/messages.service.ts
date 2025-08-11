// src/services/messages.service.ts

import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';
import { securityService } from './security.service';
import { sanitizeStrict, sanitizeEmail, sanitizeObject } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { messageSchemas, validateSchema } from '@/utils/validation/schemas';
import { z } from 'zod';

export interface Message {
  id?: string;
  sender: string;
  receiver: string;
  content: string;
  date: string;
  isRead?: boolean;
  read?: boolean;
  type?: 'normal' | 'customRequest' | 'image' | 'tip';
  meta?: {
    id?: string;
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
    tipAmount?: number;
  };
  attachments?: MessageAttachment[];
  threadId?: string;
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface MessageThread {
  id: string;
  participants: [string, string];
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
  blockedBy?: string[];
  metadata?: {
    [key: string]: any;
  };
}

export interface SendMessageRequest {
  sender: string;
  receiver: string;
  content: string;
  type?: 'normal' | 'customRequest' | 'image' | 'tip';
  meta?: Message['meta'];
  attachments?: MessageAttachment[];
}

export interface BlockUserRequest {
  blocker: string;
  blocked: string;
}

export interface ReportUserRequest {
  reporter: string;
  reportee: string;
  reason?: string;
  messages?: Message[];
  category?: 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other';
}

export interface MessageNotification {
  buyer: string;
  messageCount: number;
  lastMessage: string;
  timestamp: string;
}

export interface CustomRequestData {
  id: string;
  buyer: string;
  seller: string;
  title: string;
  description: string;
  price: number;
  tags: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'edited' | 'paid';
  date: string;
  messageThreadId?: string;
  lastModifiedBy?: string;
  originalMessageId?: string;
  paid?: boolean;
}

// Validation schemas
const sendMessageSchema = z.object({
  sender: z.string().min(1).max(30).transform(sanitizeStrict),
  receiver: z.string().min(1).max(30).transform(sanitizeStrict),
  content: messageSchemas.messageContent,
  type: z.enum(['normal', 'customRequest', 'image', 'tip']).optional(),
  meta: z.object({
    id: z.string().optional(),
    title: z.string().max(100).transform(sanitizeStrict).optional(),
    price: z.number().positive().max(10000).optional(),
    tags: z.array(z.string().max(30).transform(sanitizeStrict)).max(10).optional(),
    message: z.string().max(500).transform(sanitizeStrict).optional(),
    imageUrl: z.string().url().optional(),
    tipAmount: z.number().positive().max(500).optional(),
  }).optional(),
  attachments: z.array(z.object({
    id: z.string(),
    type: z.enum(['image', 'file']),
    url: z.string(),
    name: z.string().max(255).optional(),
    size: z.number().positive().optional(),
    mimeType: z.string().optional(),
  })).max(10).optional(),
});

const blockUserSchema = z.object({
  blocker: z.string().min(1).max(30).transform(sanitizeStrict),
  blocked: z.string().min(1).max(30).transform(sanitizeStrict),
});

const reportUserSchema = z.object({
  reporter: z.string().min(1).max(30).transform(sanitizeStrict),
  reportee: z.string().min(1).max(30).transform(sanitizeStrict),
  reason: z.string().max(500).transform(sanitizeStrict).optional(),
  messages: z.array(z.any()).optional(),
  category: z.enum(['harassment', 'spam', 'inappropriate_content', 'scam', 'other']).optional(),
});

/**
 * Messages Service
 * Handles all messaging operations and prepares for real-time integration
 */
export class MessagesService {
  private messageCache: Map<string, Message[]> = new Map();
  private threadCache: Map<string, MessageThread> = new Map();
  private wsReady: boolean = false;
  private messageListeners: Map<string, Set<(message: Message) => void>> = new Map();
  private rateLimiter = getRateLimiter();

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      // Pre-load message data into cache
      const messages = await this.getAllMessages();
      for (const [key, msgs] of Object.entries(messages)) {
        this.messageCache.set(key, msgs);
      }
    } catch (error) {
      console.error('Failed to initialize messages service:', error);
    }
  }

  /**
   * Get all message threads for a user
   */
  async getThreads(username: string, role?: 'buyer' | 'seller'): Promise<ApiResponse<MessageThread[]>> {
    try {
      // Validate and sanitize username
      const sanitizedUsername = sanitizeStrict(username);
      if (!sanitizedUsername || sanitizedUsername.length > 30) {
        return {
          success: false,
          error: { message: 'Invalid username' },
        };
      }

      // Check rate limit
      const rateLimitResult = this.rateLimiter.check('API_CALL', RATE_LIMITS.API_CALL);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Rate limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      if (FEATURES.USE_API_MESSAGES) {
        const url = `${API_ENDPOINTS.MESSAGES.THREADS}?username=${encodeURIComponent(sanitizedUsername)}${role ? `&role=${role}` : ''}`;
        return await apiCall<MessageThread[]>(url);
      }

      // LocalStorage implementation with caching
      const cacheKey = `threads_${sanitizedUsername}_${role || 'all'}`;
      const cached = this.threadCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached.updatedAt)) {
        return { success: true, data: [cached] };
      }

      const messages = await this.getAllMessages();
      const threads: { [key: string]: MessageThread } = {};

      // Group messages into threads
      for (const [conversationKey, messageList] of Object.entries(messages)) {
        if (conversationKey.includes(sanitizedUsername)) {
          const participants = conversationKey.split('-') as [string, string];
          const otherParty = participants.find(p => p !== sanitizedUsername) || '';
          
          // Filter by role if specified
          if (role && messageList.length > 0) {
            const isRelevantThread = await this.isThreadRelevantForRole(sanitizedUsername, otherParty, role);
            if (!isRelevantThread) continue;
          }
          
          if (messageList.length > 0) {
            const threadId = conversationKey;
            const blockedBy = await this.getBlockedStatus(participants[0], participants[1]);
            
            threads[threadId] = {
              id: threadId,
              participants,
              messages: messageList,
              lastMessage: messageList[messageList.length - 1],
              unreadCount: messageList.filter(
                m => m.receiver === sanitizedUsername && !m.isRead && !m.read
              ).length,
              updatedAt: messageList[messageList.length - 1].date,
              blockedBy,
              metadata: await this.getThreadMetadata(threadId),
            };
          }
        }
      }

      // Sort threads by last message date
      const sortedThreads = Object.values(threads).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      // Update cache
      sortedThreads.forEach(thread => {
        this.threadCache.set(thread.id, thread);
      });

      return {
        success: true,
        data: sortedThreads,
      };
    } catch (error) {
      console.error('Get threads error:', error);
      return {
        success: false,
        error: { message: 'Failed to get message threads' },
      };
    }
  }

  /**
   * Get messages between two users
   */
  async getThread(userA: string, userB: string): Promise<ApiResponse<Message[]>> {
    try {
      // Validate and sanitize usernames
      const sanitizedUserA = sanitizeStrict(userA);
      const sanitizedUserB = sanitizeStrict(userB);
      
      if (!sanitizedUserA || !sanitizedUserB || 
          sanitizedUserA.length > 30 || sanitizedUserB.length > 30) {
        return {
          success: false,
          error: { message: 'Invalid usernames' },
        };
      }

      const threadId = this.getConversationKey(sanitizedUserA, sanitizedUserB);
      
      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<Message[]>(
          buildApiUrl(API_ENDPOINTS.MESSAGES.THREAD, { threadId })
        );
      }

      // Check cache first
      const cached = this.messageCache.get(threadId);
      if (cached) {
        return { success: true, data: cached };
      }

      // LocalStorage implementation
      const messages = await this.getAllMessages();
      const threadMessages = messages[threadId] || [];
      
      // Update cache
      this.messageCache.set(threadId, threadMessages);

      return {
        success: true,
        data: threadMessages,
      };
    } catch (error) {
      console.error('Get thread error:', error);
      return {
        success: false,
        error: { message: 'Failed to get message thread' },
      };
    }
  }

  /**
   * Send a message
   */
  async sendMessage(request: SendMessageRequest): Promise<ApiResponse<Message>> {
    try {
      // Validate and sanitize request
      const validation = validateSchema(sendMessageSchema, request);
      if (!validation.success) {
        return {
          success: false,
          error: { message: Object.values(validation.errors || {})[0] || 'Invalid message data' },
        };
      }

      const sanitizedRequest = validation.data!;

      // Check rate limit for message sending
      const rateLimitResult = this.rateLimiter.check(
        `message_send_${sanitizedRequest.sender}`, 
        RATE_LIMITS.MESSAGE_SEND
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Too many messages. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // Additional content security check
      const contentCheck = securityService.checkContentSecurity(sanitizedRequest.content);
      if (!contentCheck.safe) {
        return {
          success: false,
          error: { message: 'Message contains prohibited content' },
        };
      }

      const conversationKey = this.getConversationKey(sanitizedRequest.sender, sanitizedRequest.receiver);

      if (FEATURES.USE_API_MESSAGES) {
        const response = await apiCall<Message>(API_ENDPOINTS.MESSAGES.SEND, {
          method: 'POST',
          body: JSON.stringify(sanitizedRequest),
        });

        if (response.success && response.data) {
          // Update local cache
          const messages = await this.getAllMessages();
          if (!messages[conversationKey]) {
            messages[conversationKey] = [];
          }
          messages[conversationKey].push(response.data);
          await storageService.setItem('panty_messages', messages);
          
          // Update cache
          this.messageCache.set(conversationKey, messages[conversationKey]);
          
          // Notify listeners
          this.notifyMessageListeners(conversationKey, response.data);
        }

        return response;
      }

      // LocalStorage implementation
      const messages = await this.getAllMessages();
      
      const newMessage: Message = {
        id: uuidv4(),
        sender: sanitizedRequest.sender,
        receiver: sanitizedRequest.receiver,
        content: sanitizedRequest.content,
        date: new Date().toISOString(),
        isRead: false,
        read: false,
        type: sanitizedRequest.type || 'normal',
        meta: sanitizedRequest.meta,
        attachments: sanitizedRequest.attachments,
        threadId: conversationKey,
      };

      if (!messages[conversationKey]) {
        messages[conversationKey] = [];
      }
      
      messages[conversationKey].push(newMessage);
      await storageService.setItem('panty_messages', messages);

      // Update cache
      this.messageCache.set(conversationKey, [...(this.messageCache.get(conversationKey) || []), newMessage]);

      // Update notifications if needed
      if (sanitizedRequest.type !== 'customRequest') {
        await this.updateMessageNotifications(
          sanitizedRequest.receiver, 
          sanitizedRequest.sender, 
          sanitizedRequest.content
        );
      }

      // Notify listeners (preparation for real-time)
      this.notifyMessageListeners(conversationKey, newMessage);

      return {
        success: true,
        data: newMessage,
      };
    } catch (error) {
      console.error('Send message error:', error);
      return {
        success: false,
        error: { message: 'Failed to send message' },
      };
    }
  }

  /**
   * Send a custom request
   */
  async sendCustomRequest(
    buyer: string,
    seller: string,
    requestData: Omit<CustomRequestData, 'id' | 'date' | 'status'>
  ): Promise<ApiResponse<Message>> {
    // Validate custom request data
    const validation = validateSchema(messageSchemas.customRequest, {
      title: requestData.title,
      description: requestData.description,
      price: requestData.price,
    });

    if (!validation.success) {
      return {
        success: false,
        error: { message: Object.values(validation.errors || {})[0] || 'Invalid request data' },
      };
    }

    const sanitizedData = validation.data!;

    // Sanitize tags
    const sanitizedTags = requestData.tags
      .slice(0, 10)
      .map(tag => sanitizeStrict(tag).substring(0, 30))
      .filter(tag => tag.length > 0);

    const request: SendMessageRequest = {
      sender: buyer,
      receiver: seller,
      content: `📦 Custom Request: ${sanitizedData.title} - $${sanitizedData.price}`,
      type: 'customRequest',
      meta: {
        id: uuidv4(),
        title: sanitizedData.title,
        price: sanitizedData.price,
        tags: sanitizedTags,
        message: sanitizedData.description,
      },
    };

    return this.sendMessage(request);
  }

  /**
   * Mark messages as read - FIXED VERSION
   */
  async markMessagesAsRead(
    username: string,
    otherParty: string
  ): Promise<ApiResponse<void>> {
    try {
      // Validate and sanitize usernames
      const sanitizedUsername = sanitizeStrict(username);
      const sanitizedOtherParty = sanitizeStrict(otherParty);
      
      if (!sanitizedUsername || !sanitizedOtherParty || 
          sanitizedUsername.length > 30 || sanitizedOtherParty.length > 30) {
        return {
          success: false,
          error: { message: 'Invalid usernames' },
        };
      }

      const conversationKey = this.getConversationKey(sanitizedUsername, sanitizedOtherParty);
      
      if (FEATURES.USE_API_MESSAGES) {
        // Get messages first to get their IDs
        const messages = await this.getAllMessages();
        const threadMessages = messages[conversationKey] || [];
        
        // Get IDs of unread messages where current user is receiver
        const messageIds = threadMessages
          .filter(msg => msg.receiver === sanitizedUsername && !msg.isRead && !msg.read)
          .map(msg => msg.id)
          .filter((id): id is string => id !== undefined);
        
        if (messageIds.length === 0) {
          return { success: true }; // No messages to mark as read
        }
        
        // Send the messageIds array that backend expects
        const response = await apiCall<void>(API_ENDPOINTS.MESSAGES.MARK_READ, {
          method: 'POST',
          body: JSON.stringify({ messageIds }),
        });

        if (response.success) {
          // Update local storage after successful API call
          const updatedMessages = await this.getAllMessages();
          if (updatedMessages[conversationKey]) {
            updatedMessages[conversationKey] = updatedMessages[conversationKey].map(msg => {
              if (msg.receiver === sanitizedUsername && msg.sender === sanitizedOtherParty) {
                return { ...msg, isRead: true, read: true };
              }
              return msg;
            });
            
            await storageService.setItem('panty_messages', updatedMessages);
            this.messageCache.set(conversationKey, updatedMessages[conversationKey]);
          }
          
          // Clear notifications
          await this.clearMessageNotifications(sanitizedUsername, sanitizedOtherParty);
        }

        return response;
      }

      // LocalStorage implementation
      const messages = await this.getAllMessages();
      
      if (messages[conversationKey]) {
        messages[conversationKey] = messages[conversationKey].map(msg => {
          if (msg.receiver === sanitizedUsername && msg.sender === sanitizedOtherParty) {
            return { ...msg, isRead: true, read: true };
          }
          return msg;
        });
        
        await storageService.setItem('panty_messages', messages);
        
        // Update cache
        this.messageCache.set(conversationKey, messages[conversationKey]);
      }

      // Clear notifications
      await this.clearMessageNotifications(sanitizedUsername, sanitizedOtherParty);

      return { success: true };
    } catch (error) {
      console.error('Mark messages as read error:', error);
      return {
        success: false,
        error: { message: 'Failed to mark messages as read' },
      };
    }
  }

  /**
   * Block a user
   */
  async blockUser(request: BlockUserRequest): Promise<ApiResponse<void>> {
    try {
      // Validate and sanitize request
      const validation = validateSchema(blockUserSchema, request);
      if (!validation.success) {
        return {
          success: false,
          error: { message: 'Invalid block request' },
        };
      }

      const sanitizedRequest = validation.data!;

      // Check rate limit
      const rateLimitResult = this.rateLimiter.check(
        `block_user_${sanitizedRequest.blocker}`,
        { maxAttempts: 10, windowMs: 60 * 60 * 1000 } // 10 blocks per hour
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: 'Too many block attempts. Please try again later.' },
        };
      }

      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<void>(API_ENDPOINTS.MESSAGES.BLOCK_USER, {
          method: 'POST',
          body: JSON.stringify(sanitizedRequest),
        });
      }

      // LocalStorage implementation
      const blocked = await storageService.getItem<{ [user: string]: string[] }>('panty_blocked', {});
      
      if (!blocked[sanitizedRequest.blocker]) {
        blocked[sanitizedRequest.blocker] = [];
      }
      
      if (!blocked[sanitizedRequest.blocker].includes(sanitizedRequest.blocked)) {
        blocked[sanitizedRequest.blocker].push(sanitizedRequest.blocked);
        await storageService.setItem('panty_blocked', blocked);
      }

      return { success: true };
    } catch (error) {
      console.error('Block user error:', error);
      return {
        success: false,
        error: { message: 'Failed to block user' },
      };
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(request: BlockUserRequest): Promise<ApiResponse<void>> {
    try {
      // Validate and sanitize request
      const validation = validateSchema(blockUserSchema, request);
      if (!validation.success) {
        return {
          success: false,
          error: { message: 'Invalid unblock request' },
        };
      }

      const sanitizedRequest = validation.data!;

      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<void>(API_ENDPOINTS.MESSAGES.UNBLOCK_USER, {
          method: 'POST',
          body: JSON.stringify(sanitizedRequest),
        });
      }

      // LocalStorage implementation
      const blocked = await storageService.getItem<{ [user: string]: string[] }>('panty_blocked', {});
      
      if (blocked[sanitizedRequest.blocker]) {
        blocked[sanitizedRequest.blocker] = blocked[sanitizedRequest.blocker].filter(
          u => u !== sanitizedRequest.blocked
        );
        await storageService.setItem('panty_blocked', blocked);
      }

      return { success: true };
    } catch (error) {
      console.error('Unblock user error:', error);
      return {
        success: false,
        error: { message: 'Failed to unblock user' },
      };
    }
  }

  /**
   * Check if user is blocked
   */
  async isBlocked(blocker: string, blocked: string): Promise<boolean> {
    try {
      // Sanitize usernames
      const sanitizedBlocker = sanitizeStrict(blocker);
      const sanitizedBlocked = sanitizeStrict(blocked);
      
      if (!sanitizedBlocker || !sanitizedBlocked) {
        return false;
      }

      const blocks = await storageService.getItem<{ [user: string]: string[] }>('panty_blocked', {});
      return blocks[sanitizedBlocker]?.includes(sanitizedBlocked) || false;
    } catch (error) {
      console.error('Check blocked error:', error);
      return false;
    }
  }

  /**
   * Report a user
   */
  async reportUser(request: ReportUserRequest): Promise<ApiResponse<void>> {
    try {
      // Validate and sanitize request
      const validation = validateSchema(reportUserSchema, request);
      if (!validation.success) {
        return {
          success: false,
          error: { message: Object.values(validation.errors || {})[0] || 'Invalid report' },
        };
      }

      const sanitizedRequest = validation.data!;

      // Check rate limit for reporting
      const rateLimitResult = this.rateLimiter.check(
        `report_user_${sanitizedRequest.reporter}`,
        { maxAttempts: 5, windowMs: 24 * 60 * 60 * 1000 } // 5 reports per day
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: 'Too many reports. Please try again tomorrow.' },
        };
      }

      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<void>(API_ENDPOINTS.MESSAGES.REPORT, {
          method: 'POST',
          body: JSON.stringify(sanitizedRequest),
        });
      }

      // LocalStorage implementation
      const reports = await storageService.getItem<any[]>('panty_report_logs', []);
      
      const newReport = {
        id: uuidv4(),
        reporter: sanitizedRequest.reporter,
        reportee: sanitizedRequest.reportee,
        reason: sanitizedRequest.reason,
        messages: sanitizedRequest.messages || [],
        date: new Date().toISOString(),
        processed: false,
        category: sanitizedRequest.category || 'other',
      };
      
      reports.push(newReport);
      await storageService.setItem('panty_report_logs', reports);

      // Mark as reported
      const reported = await storageService.getItem<{ [user: string]: string[] }>('panty_reported', {});
      
      if (!reported[sanitizedRequest.reporter]) {
        reported[sanitizedRequest.reporter] = [];
      }
      
      if (!reported[sanitizedRequest.reporter].includes(sanitizedRequest.reportee)) {
        reported[sanitizedRequest.reporter].push(sanitizedRequest.reportee);
        await storageService.setItem('panty_reported', reported);
      }

      return { success: true };
    } catch (error) {
      console.error('Report user error:', error);
      return {
        success: false,
        error: { message: 'Failed to report user' },
      };
    }
  }

  /**
   * Check if user has been reported
   */
  async hasReported(reporter: string, reportee: string): Promise<boolean> {
    try {
      // Sanitize usernames
      const sanitizedReporter = sanitizeStrict(reporter);
      const sanitizedReportee = sanitizeStrict(reportee);
      
      if (!sanitizedReporter || !sanitizedReportee) {
        return false;
      }

      const reported = await storageService.getItem<{ [user: string]: string[] }>('panty_reported', {});
      return reported[sanitizedReporter]?.includes(sanitizedReportee) || false;
    } catch (error) {
      console.error('Check reported error:', error);
      return false;
    }
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(username: string): Promise<number> {
    try {
      // Sanitize username
      const sanitizedUsername = sanitizeStrict(username);
      if (!sanitizedUsername) {
        return 0;
      }

      const threads = await this.getThreads(sanitizedUsername);
      if (!threads.success || !threads.data) return 0;
      
      return threads.data.reduce((total, thread) => total + thread.unreadCount, 0);
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  /**
   * Get message notifications for a user
   */
  async getMessageNotifications(username: string): Promise<MessageNotification[]> {
    try {
      // Sanitize username
      const sanitizedUsername = sanitizeStrict(username);
      if (!sanitizedUsername) {
        return [];
      }

      const notifications = await storageService.getItem<{ [seller: string]: MessageNotification[] }>(
        'panty_message_notifications',
        {}
      );
      return notifications[sanitizedUsername] || [];
    } catch (error) {
      console.error('Get message notifications error:', error);
      return [];
    }
  }

  /**
   * Clear message notifications
   */
  async clearMessageNotifications(seller: string, buyer: string): Promise<void> {
    try {
      // Sanitize usernames
      const sanitizedSeller = sanitizeStrict(seller);
      const sanitizedBuyer = sanitizeStrict(buyer);
      
      if (!sanitizedSeller || !sanitizedBuyer) {
        return;
      }

      const notifications = await storageService.getItem<{ [seller: string]: MessageNotification[] }>(
        'panty_message_notifications',
        {}
      );
      
      if (notifications[sanitizedSeller]) {
        notifications[sanitizedSeller] = notifications[sanitizedSeller].filter(
          n => n.buyer !== sanitizedBuyer
        );
        
        if (notifications[sanitizedSeller].length === 0) {
          delete notifications[sanitizedSeller];
        }
        
        await storageService.setItem('panty_message_notifications', notifications);
      }
    } catch (error) {
      console.error('Clear message notifications error:', error);
    }
  }

  /**
   * Subscribe to message updates (preparation for WebSocket)
   */
  subscribeToThread(threadId: string, callback: (message: Message) => void): () => void {
    // Sanitize thread ID
    const sanitizedThreadId = sanitizeStrict(threadId);
    if (!sanitizedThreadId) {
      return () => {};
    }

    if (!this.messageListeners.has(sanitizedThreadId)) {
      this.messageListeners.set(sanitizedThreadId, new Set());
    }
    
    this.messageListeners.get(sanitizedThreadId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.messageListeners.get(sanitizedThreadId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.messageListeners.delete(sanitizedThreadId);
        }
      }
    };
  }

  /**
   * Upload attachment (preparation for file handling)
   */
  async uploadAttachment(file: File): Promise<ApiResponse<MessageAttachment>> {
    try {
      // Validate file
      const fileValidation = securityService.validateFileUpload(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      });

      if (!fileValidation.valid) {
        return {
          success: false,
          error: { message: fileValidation.error || 'Invalid file' },
        };
      }

      // Check rate limit for uploads
      const rateLimitResult = this.rateLimiter.check(
        'IMAGE_UPLOAD',
        RATE_LIMITS.IMAGE_UPLOAD
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Upload limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // For now, convert to base64 for localStorage
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const attachment: MessageAttachment = {
            id: uuidv4(),
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: e.target?.result as string,
            name: securityService.sanitizeForDisplay(file.name, { maxLength: 255 }),
            size: file.size,
            mimeType: file.type,
          };
          resolve({ success: true, data: attachment });
        };
        reader.onerror = () => {
          reject({ success: false, error: { message: 'Failed to read file' } });
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Upload attachment error:', error);
      return {
        success: false,
        error: { message: 'Failed to upload attachment' },
      };
    }
  }

  // Helper methods
  private getConversationKey(userA: string, userB: string): string {
    // Sanitize before creating key
    const sanitizedUserA = sanitizeStrict(userA);
    const sanitizedUserB = sanitizeStrict(userB);
    return [sanitizedUserA, sanitizedUserB].sort().join('-');
  }

  private async getAllMessages(): Promise<{ [key: string]: Message[] }> {
    const messages = await storageService.getItem<{ [key: string]: Message[] }>('panty_messages', {});
    
    // Sanitize all messages when loading from storage
    const sanitized: { [key: string]: Message[] } = {};
    for (const [key, msgs] of Object.entries(messages)) {
      sanitized[key] = msgs.map(msg => ({
        ...msg,
        content: securityService.sanitizeForDisplay(msg.content, { 
          allowHtml: false,
          maxLength: 1000 
        }),
      }));
    }
    
    return sanitized;
  }

  private async updateMessageNotifications(
    seller: string,
    buyer: string,
    content: string
  ): Promise<void> {
    try {
      const sanitizedSeller = sanitizeStrict(seller);
      const sanitizedBuyer = sanitizeStrict(buyer);
      const sanitizedContent = securityService.sanitizeForDisplay(content, {
        allowHtml: false,
        maxLength: 50,
      });

      const notifications = await storageService.getItem<{ [seller: string]: MessageNotification[] }>(
        'panty_message_notifications',
        {}
      );
      
      if (!notifications[sanitizedSeller]) {
        notifications[sanitizedSeller] = [];
      }
      
      const existingIndex = notifications[sanitizedSeller].findIndex(n => n.buyer === sanitizedBuyer);
      
      if (existingIndex >= 0) {
        notifications[sanitizedSeller][existingIndex] = {
          buyer: sanitizedBuyer,
          messageCount: notifications[sanitizedSeller][existingIndex].messageCount + 1,
          lastMessage: sanitizedContent + (content.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString(),
        };
      } else {
        notifications[sanitizedSeller].push({
          buyer: sanitizedBuyer,
          messageCount: 1,
          lastMessage: sanitizedContent + (content.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString(),
        });
      }
      
      await storageService.setItem('panty_message_notifications', notifications);
    } catch (error) {
      console.error('Update message notifications error:', error);
    }
  }

  private async isThreadRelevantForRole(
    username: string,
    otherParty: string,
    role: 'buyer' | 'seller'
  ): Promise<boolean> {
    try {
      const users = await storageService.getItem<any>('panty_users', {});
      const otherUser = users[otherParty];
      
      if (!otherUser) return true; // Include if we don't know the other user's role
      
      if (role === 'seller') {
        // Seller sees conversations with buyers
        return otherUser.role === 'buyer';
      } else {
        // Buyer sees conversations with sellers
        return otherUser.role === 'seller' || otherUser.role === 'admin';
      }
    } catch (error) {
      console.error('Error checking thread relevance:', error);
      return true;
    }
  }

  private async getBlockedStatus(userA: string, userB: string): Promise<string[]> {
    const blockedBy: string[] = [];
    
    if (await this.isBlocked(userA, userB)) {
      blockedBy.push(userA);
    }
    if (await this.isBlocked(userB, userA)) {
      blockedBy.push(userB);
    }
    
    return blockedBy;
  }

  private async getThreadMetadata(threadId: string): Promise<{ [key: string]: any }> {
    try {
      const metadata = await storageService.getItem<any>('thread_metadata', {});
      return sanitizeObject(metadata[threadId] || {});
    } catch (error) {
      return {};
    }
  }

  private isCacheValid(updatedAt: string): boolean {
    // Cache is valid for 5 minutes
    const cacheTime = 5 * 60 * 1000;
    return new Date().getTime() - new Date(updatedAt).getTime() < cacheTime;
  }

  private notifyMessageListeners(threadId: string, message: Message): void {
    const listeners = this.messageListeners.get(threadId);
    if (listeners) {
      listeners.forEach(callback => callback(message));
    }
  }

  /**
   * Prepare for WebSocket connection (to be implemented with Socket.io later)
   */
  prepareWebSocket(): void {
    // This will be implemented when integrating Socket.io
    this.wsReady = false;
  }

  /**
   * Check if WebSocket is ready
   */
  isWebSocketReady(): boolean {
    return this.wsReady;
  }
}

// Export singleton instance
export const messagesService = new MessagesService();