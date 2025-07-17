// src/services/messages.service.ts

import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';
import { securityService } from './security.service';
import { messageSchemas } from '@/utils/validation/schemas';
import { sanitizeStrict, sanitizeHtml } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
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

// Validation schemas for messages service
const sendMessageSchema = z.object({
  sender: z.string().min(1).max(50),
  receiver: z.string().min(1).max(50),
  content: messageSchemas.messageContent,
  type: z.enum(['normal', 'customRequest', 'image', 'tip']).optional(),
  meta: z.object({
    id: z.string().optional(),
    title: z.string().max(100).optional(),
    price: z.number().positive().max(10000).optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    message: z.string().max(500).optional(),
    imageUrl: z.string().url().optional(),
    tipAmount: z.number().positive().max(500).optional(),
  }).optional(),
  attachments: z.array(z.object({
    id: z.string(),
    type: z.enum(['image', 'file']),
    url: z.string(),
    name: z.string().optional(),
    size: z.number().optional(),
    mimeType: z.string().optional(),
  })).optional(),
});

const blockUserSchema = z.object({
  blocker: z.string().min(1).max(50),
  blocked: z.string().min(1).max(50),
});

const reportUserSchema = z.object({
  reporter: z.string().min(1).max(50),
  reportee: z.string().min(1).max(50),
  reason: z.string().max(500).optional(),
  category: z.enum(['harassment', 'spam', 'inappropriate_content', 'scam', 'other']).optional(),
});

/**
 * Messages Service
 * Handles all messaging operations with security and validation
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
      // Sanitize inputs
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      
      if (!sanitizedUsername || sanitizedUsername.length > 50) {
        return {
          success: false,
          error: { message: 'Invalid username' },
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
      // Sanitize inputs
      const sanitizedUserA = sanitizeStrict(userA).toLowerCase();
      const sanitizedUserB = sanitizeStrict(userB).toLowerCase();
      
      if (!sanitizedUserA || !sanitizedUserB || 
          sanitizedUserA.length > 50 || sanitizedUserB.length > 50) {
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
   * Send a message with validation and rate limiting
   */
  async sendMessage(request: SendMessageRequest): Promise<ApiResponse<Message>> {
    try {
      // Validate request
      const validation = securityService.validateAndSanitize(request, sendMessageSchema);
      if (!validation.success || !validation.data) {
        return {
          success: false,
          error: { message: 'Invalid message data', details: validation.errors },
        };
      }

      const validatedRequest = validation.data;

      // Check rate limit
      const rateLimitKey = `message_send_${validatedRequest.sender}`;
      const rateLimitResult = this.rateLimiter.check(rateLimitKey, RATE_LIMITS.MESSAGE_SEND);
      
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Too many messages. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // Additional security checks
      const contentCheck = securityService.checkContentSecurity(validatedRequest.content);
      if (!contentCheck.safe) {
        return {
          success: false,
          error: { message: 'Message contains inappropriate content' },
        };
      }

      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<Message>(API_ENDPOINTS.MESSAGES.SEND, {
          method: 'POST',
          body: JSON.stringify(validatedRequest),
        });
      }

      // LocalStorage implementation
      const conversationKey = this.getConversationKey(
        validatedRequest.sender.toLowerCase(), 
        validatedRequest.receiver.toLowerCase()
      );
      const messages = await this.getAllMessages();
      
      const newMessage: Message = {
        id: uuidv4(),
        sender: validatedRequest.sender.toLowerCase(),
        receiver: validatedRequest.receiver.toLowerCase(),
        content: validatedRequest.content, // Already sanitized by validation
        date: new Date().toISOString(),
        isRead: false,
        read: false,
        type: validatedRequest.type || 'normal',
        meta: validatedRequest.meta,
        attachments: validatedRequest.attachments,
      };

      if (!messages[conversationKey]) {
        messages[conversationKey] = [];
      }
      
      messages[conversationKey].push(newMessage);
      await storageService.setItem('panty_messages', messages);

      // Update cache
      this.messageCache.set(conversationKey, [...(this.messageCache.get(conversationKey) || []), newMessage]);

      // Update notifications if needed
      if (validatedRequest.type !== 'customRequest') {
        await this.updateMessageNotifications(
          validatedRequest.receiver.toLowerCase(), 
          validatedRequest.sender.toLowerCase(), 
          validatedRequest.content
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
   * Send a custom request with validation
   */
  async sendCustomRequest(
    buyer: string,
    seller: string,
    requestData: Omit<CustomRequestData, 'id' | 'date' | 'status'>
  ): Promise<ApiResponse<Message>> {
    // Validate custom request data
    const validation = securityService.validateAndSanitize(requestData, messageSchemas.customRequest);
    if (!validation.success || !validation.data) {
      return {
        success: false,
        error: { message: 'Invalid custom request data', details: validation.errors },
      };
    }

    const validatedData = validation.data;

    const request: SendMessageRequest = {
      sender: buyer,
      receiver: seller,
      content: `📦 Custom Request: ${validatedData.title} - $${validatedData.price}`,
      type: 'customRequest',
      meta: {
        id: uuidv4(),
        title: validatedData.title,
        price: validatedData.price,
        tags: requestData.tags,
        message: validatedData.description,
      },
    };

    return this.sendMessage(request);
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    username: string,
    otherParty: string
  ): Promise<ApiResponse<void>> {
    try {
      // Sanitize inputs
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      const sanitizedOtherParty = sanitizeStrict(otherParty).toLowerCase();
      
      if (!sanitizedUsername || !sanitizedOtherParty ||
          sanitizedUsername.length > 50 || sanitizedOtherParty.length > 50) {
        return {
          success: false,
          error: { message: 'Invalid usernames' },
        };
      }

      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<void>(API_ENDPOINTS.MESSAGES.MARK_READ, {
          method: 'POST',
          body: JSON.stringify({ username: sanitizedUsername, otherParty: sanitizedOtherParty }),
        });
      }

      // LocalStorage implementation
      const conversationKey = this.getConversationKey(sanitizedUsername, sanitizedOtherParty);
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
   * Block a user with validation
   */
  async blockUser(request: BlockUserRequest): Promise<ApiResponse<void>> {
    try {
      // Validate request
      const validation = securityService.validateAndSanitize(request, blockUserSchema);
      if (!validation.success || !validation.data) {
        return {
          success: false,
          error: { message: 'Invalid block request' },
        };
      }

      const validatedRequest = validation.data;

      // Check rate limit
      const rateLimitKey = `block_user_${validatedRequest.blocker}`;
      const rateLimitResult = this.rateLimiter.check(rateLimitKey, {
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000, // 1 hour
      });
      
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Too many block attempts. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<void>(API_ENDPOINTS.MESSAGES.BLOCK_USER, {
          method: 'POST',
          body: JSON.stringify(validatedRequest),
        });
      }

      // LocalStorage implementation
      const blocked = await storageService.getItem<{ [user: string]: string[] }>('panty_blocked', {});
      
      const blockerLower = validatedRequest.blocker.toLowerCase();
      const blockedLower = validatedRequest.blocked.toLowerCase();
      
      if (!blocked[blockerLower]) {
        blocked[blockerLower] = [];
      }
      
      if (!blocked[blockerLower].includes(blockedLower)) {
        blocked[blockerLower].push(blockedLower);
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
   * Unblock a user with validation
   */
  async unblockUser(request: BlockUserRequest): Promise<ApiResponse<void>> {
    try {
      // Validate request
      const validation = securityService.validateAndSanitize(request, blockUserSchema);
      if (!validation.success || !validation.data) {
        return {
          success: false,
          error: { message: 'Invalid unblock request' },
        };
      }

      const validatedRequest = validation.data;

      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<void>(API_ENDPOINTS.MESSAGES.UNBLOCK_USER, {
          method: 'POST',
          body: JSON.stringify(validatedRequest),
        });
      }

      // LocalStorage implementation
      const blocked = await storageService.getItem<{ [user: string]: string[] }>('panty_blocked', {});
      
      const blockerLower = validatedRequest.blocker.toLowerCase();
      const blockedLower = validatedRequest.blocked.toLowerCase();
      
      if (blocked[blockerLower]) {
        blocked[blockerLower] = blocked[blockerLower].filter(u => u !== blockedLower);
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
      const sanitizedBlocker = sanitizeStrict(blocker).toLowerCase();
      const sanitizedBlocked = sanitizeStrict(blocked).toLowerCase();
      
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
   * Report a user with validation
   */
  async reportUser(request: ReportUserRequest): Promise<ApiResponse<void>> {
    try {
      // Validate request
      const validation = securityService.validateAndSanitize(request, reportUserSchema);
      if (!validation.success || !validation.data) {
        return {
          success: false,
          error: { message: 'Invalid report data' },
        };
      }

      const validatedRequest = validation.data;

      // Check rate limit
      const rateLimitKey = `report_user_${validatedRequest.reporter}`;
      const rateLimitResult = this.rateLimiter.check(rateLimitKey, {
        maxAttempts: 5,
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
      });
      
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Too many reports. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<void>(API_ENDPOINTS.MESSAGES.REPORT, {
          method: 'POST',
          body: JSON.stringify(validatedRequest),
        });
      }

      // LocalStorage implementation
      const reports = await storageService.getItem<any[]>('panty_report_logs', []);
      
      const newReport = {
        id: uuidv4(),
        reporter: validatedRequest.reporter.toLowerCase(),
        reportee: validatedRequest.reportee.toLowerCase(),
        reason: validatedRequest.reason,
        messages: request.messages || [],
        date: new Date().toISOString(),
        processed: false,
        category: validatedRequest.category || 'other',
      };
      
      reports.push(newReport);
      await storageService.setItem('panty_report_logs', reports);

      // Mark as reported
      const reported = await storageService.getItem<{ [user: string]: string[] }>('panty_reported', {});
      
      const reporterLower = validatedRequest.reporter.toLowerCase();
      const reporteeLower = validatedRequest.reportee.toLowerCase();
      
      if (!reported[reporterLower]) {
        reported[reporterLower] = [];
      }
      
      if (!reported[reporterLower].includes(reporteeLower)) {
        reported[reporterLower].push(reporteeLower);
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
      const sanitizedReporter = sanitizeStrict(reporter).toLowerCase();
      const sanitizedReportee = sanitizeStrict(reportee).toLowerCase();
      
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
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      if (!sanitizedUsername) return 0;

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
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      if (!sanitizedUsername) return [];

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
      const sanitizedSeller = sanitizeStrict(seller).toLowerCase();
      const sanitizedBuyer = sanitizeStrict(buyer).toLowerCase();
      
      if (!sanitizedSeller || !sanitizedBuyer) return;

      const notifications = await storageService.getItem<{ [seller: string]: MessageNotification[] }>(
        'panty_message_notifications',
        {}
      );
      
      if (notifications[sanitizedSeller]) {
        notifications[sanitizedSeller] = notifications[sanitizedSeller].filter(n => n.buyer !== sanitizedBuyer);
        
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
   * Upload attachment with validation
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

      // Check rate limit
      const rateLimitResult = this.rateLimiter.check('file_upload', {
        maxAttempts: 20,
        windowMs: 60 * 60 * 1000, // 1 hour
      });
      
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Too many uploads. Please wait ${rateLimitResult.waitTime} seconds.` },
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
            name: sanitizeStrict(file.name),
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
    return [userA.toLowerCase(), userB.toLowerCase()].sort().join('-');
  }

  private async getAllMessages(): Promise<{ [key: string]: Message[] }> {
    return await storageService.getItem('panty_messages', {});
  }

  private async updateMessageNotifications(
    seller: string,
    buyer: string,
    content: string
  ): Promise<void> {
    try {
      const sanitizedSeller = seller.toLowerCase();
      const sanitizedBuyer = buyer.toLowerCase();
      const sanitizedContent = sanitizeStrict(content);

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
          lastMessage: sanitizedContent.substring(0, 50) + (sanitizedContent.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString(),
        };
      } else {
        notifications[sanitizedSeller].push({
          buyer: sanitizedBuyer,
          messageCount: 1,
          lastMessage: sanitizedContent.substring(0, 50) + (sanitizedContent.length > 50 ? '...' : ''),
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
      const sanitizedThreadId = sanitizeStrict(threadId);
      const metadata = await storageService.getItem<any>('thread_metadata', {});
      return metadata[sanitizedThreadId] || {};
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