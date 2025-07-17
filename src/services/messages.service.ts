// src/services/messages.service.ts

import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';

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

/**
 * Messages Service
 * Handles all messaging operations and prepares for real-time integration
 */
export class MessagesService {
  private messageCache: Map<string, Message[]> = new Map();
  private threadCache: Map<string, MessageThread> = new Map();
  private wsReady: boolean = false;
  private messageListeners: Map<string, Set<(message: Message) => void>> = new Map();

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
      if (FEATURES.USE_API_MESSAGES) {
        const url = `${API_ENDPOINTS.MESSAGES.THREADS}?username=${encodeURIComponent(username)}${role ? `&role=${role}` : ''}`;
        return await apiCall<MessageThread[]>(url);
      }

      // LocalStorage implementation with caching
      const cacheKey = `threads_${username}_${role || 'all'}`;
      const cached = this.threadCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached.updatedAt)) {
        return { success: true, data: [cached] };
      }

      const messages = await this.getAllMessages();
      const threads: { [key: string]: MessageThread } = {};

      // Group messages into threads
      for (const [conversationKey, messageList] of Object.entries(messages)) {
        if (conversationKey.includes(username)) {
          const participants = conversationKey.split('-') as [string, string];
          const otherParty = participants.find(p => p !== username) || '';
          
          // Filter by role if specified
          if (role && messageList.length > 0) {
            const isRelevantThread = await this.isThreadRelevantForRole(username, otherParty, role);
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
                m => m.receiver === username && !m.isRead && !m.read
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
      const threadId = this.getConversationKey(userA, userB);
      
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
      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<Message>(API_ENDPOINTS.MESSAGES.SEND, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      const conversationKey = this.getConversationKey(request.sender, request.receiver);
      const messages = await this.getAllMessages();
      
      const newMessage: Message = {
        id: uuidv4(),
        sender: request.sender,
        receiver: request.receiver,
        content: request.content,
        date: new Date().toISOString(),
        isRead: false,
        read: false,
        type: request.type || 'normal',
        meta: request.meta,
        attachments: request.attachments,
      };

      if (!messages[conversationKey]) {
        messages[conversationKey] = [];
      }
      
      messages[conversationKey].push(newMessage);
      await storageService.setItem('panty_messages', messages);

      // Update cache
      this.messageCache.set(conversationKey, [...(this.messageCache.get(conversationKey) || []), newMessage]);

      // Update notifications if needed
      if (request.type !== 'customRequest') {
        await this.updateMessageNotifications(request.receiver, request.sender, request.content);
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
    const request: SendMessageRequest = {
      sender: buyer,
      receiver: seller,
      content: `📦 Custom Request: ${requestData.title} - $${requestData.price}`,
      type: 'customRequest',
      meta: {
        id: uuidv4(),
        title: requestData.title,
        price: requestData.price,
        tags: requestData.tags,
        message: requestData.description,
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
      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<void>(API_ENDPOINTS.MESSAGES.MARK_READ, {
          method: 'POST',
          body: JSON.stringify({ username, otherParty }),
        });
      }

      // LocalStorage implementation
      const conversationKey = this.getConversationKey(username, otherParty);
      const messages = await this.getAllMessages();
      
      if (messages[conversationKey]) {
        messages[conversationKey] = messages[conversationKey].map(msg => {
          if (msg.receiver === username && msg.sender === otherParty) {
            return { ...msg, isRead: true, read: true };
          }
          return msg;
        });
        
        await storageService.setItem('panty_messages', messages);
        
        // Update cache
        this.messageCache.set(conversationKey, messages[conversationKey]);
      }

      // Clear notifications
      await this.clearMessageNotifications(username, otherParty);

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
      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<void>(API_ENDPOINTS.MESSAGES.BLOCK_USER, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      const blocked = await storageService.getItem<{ [user: string]: string[] }>('panty_blocked', {});
      
      if (!blocked[request.blocker]) {
        blocked[request.blocker] = [];
      }
      
      if (!blocked[request.blocker].includes(request.blocked)) {
        blocked[request.blocker].push(request.blocked);
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
      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<void>(API_ENDPOINTS.MESSAGES.UNBLOCK_USER, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      const blocked = await storageService.getItem<{ [user: string]: string[] }>('panty_blocked', {});
      
      if (blocked[request.blocker]) {
        blocked[request.blocker] = blocked[request.blocker].filter(u => u !== request.blocked);
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
      const blocks = await storageService.getItem<{ [user: string]: string[] }>('panty_blocked', {});
      return blocks[blocker]?.includes(blocked) || false;
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
      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<void>(API_ENDPOINTS.MESSAGES.REPORT, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      const reports = await storageService.getItem<any[]>('panty_report_logs', []);
      
      const newReport = {
        id: uuidv4(),
        reporter: request.reporter,
        reportee: request.reportee,
        reason: request.reason,
        messages: request.messages || [],
        date: new Date().toISOString(),
        processed: false,
        category: request.category || 'other',
      };
      
      reports.push(newReport);
      await storageService.setItem('panty_report_logs', reports);

      // Mark as reported
      const reported = await storageService.getItem<{ [user: string]: string[] }>('panty_reported', {});
      
      if (!reported[request.reporter]) {
        reported[request.reporter] = [];
      }
      
      if (!reported[request.reporter].includes(request.reportee)) {
        reported[request.reporter].push(request.reportee);
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
      const reported = await storageService.getItem<{ [user: string]: string[] }>('panty_reported', {});
      return reported[reporter]?.includes(reportee) || false;
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
      const threads = await this.getThreads(username);
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
      const notifications = await storageService.getItem<{ [seller: string]: MessageNotification[] }>(
        'panty_message_notifications',
        {}
      );
      return notifications[username] || [];
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
      const notifications = await storageService.getItem<{ [seller: string]: MessageNotification[] }>(
        'panty_message_notifications',
        {}
      );
      
      if (notifications[seller]) {
        notifications[seller] = notifications[seller].filter(n => n.buyer !== buyer);
        
        if (notifications[seller].length === 0) {
          delete notifications[seller];
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
    if (!this.messageListeners.has(threadId)) {
      this.messageListeners.set(threadId, new Set());
    }
    
    this.messageListeners.get(threadId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.messageListeners.get(threadId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.messageListeners.delete(threadId);
        }
      }
    };
  }

  /**
   * Upload attachment (preparation for file handling)
   */
  async uploadAttachment(file: File): Promise<ApiResponse<MessageAttachment>> {
    try {
      // For now, convert to base64 for localStorage
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const attachment: MessageAttachment = {
            id: uuidv4(),
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: e.target?.result as string,
            name: file.name,
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
    return [userA, userB].sort().join('-');
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
      const notifications = await storageService.getItem<{ [seller: string]: MessageNotification[] }>(
        'panty_message_notifications',
        {}
      );
      
      if (!notifications[seller]) {
        notifications[seller] = [];
      }
      
      const existingIndex = notifications[seller].findIndex(n => n.buyer === buyer);
      
      if (existingIndex >= 0) {
        notifications[seller][existingIndex] = {
          buyer,
          messageCount: notifications[seller][existingIndex].messageCount + 1,
          lastMessage: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
          timestamp: new Date().toISOString(),
        };
      } else {
        notifications[seller].push({
          buyer,
          messageCount: 1,
          lastMessage: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
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
      return metadata[threadId] || {};
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