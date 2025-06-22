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
  type?: 'normal' | 'customRequest' | 'image';
  meta?: {
    id?: string;
    title?: string;
    price?: number;
    tags?: string[];
    message?: string;
    imageUrl?: string;
  };
}

export interface MessageThread {
  id: string;
  participants: [string, string];
  messages: Message[];
  lastMessage: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface SendMessageRequest {
  sender: string;
  receiver: string;
  content: string;
  type?: 'normal' | 'customRequest' | 'image';
  meta?: Message['meta'];
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
}

/**
 * Messages Service
 * Handles all messaging operations
 */
export class MessagesService {
  /**
   * Get all message threads for a user
   */
  async getThreads(username: string): Promise<ApiResponse<MessageThread[]>> {
    try {
      if (FEATURES.USE_API_MESSAGES) {
        return await apiCall<MessageThread[]>(
          `${API_ENDPOINTS.MESSAGES.THREADS}?username=${encodeURIComponent(username)}`
        );
      }

      // LocalStorage implementation
      const messages = await this.getAllMessages();
      const threads: { [key: string]: MessageThread } = {};

      // Group messages into threads
      for (const [conversationKey, messageList] of Object.entries(messages)) {
        if (conversationKey.includes(username)) {
          const participants = conversationKey.split('-') as [string, string];
          const otherParty = participants.find(p => p !== username) || '';
          
          if (messageList.length > 0) {
            threads[conversationKey] = {
              id: conversationKey,
              participants,
              messages: messageList,
              lastMessage: messageList[messageList.length - 1],
              unreadCount: messageList.filter(
                m => m.receiver === username && !m.isRead && !m.read
              ).length,
              updatedAt: messageList[messageList.length - 1].date,
            };
          }
        }
      }

      // Sort threads by last message date
      const sortedThreads = Object.values(threads).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

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

      // LocalStorage implementation
      const messages = await this.getAllMessages();
      const threadMessages = messages[threadId] || [];

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
      };

      if (!messages[conversationKey]) {
        messages[conversationKey] = [];
      }
      
      messages[conversationKey].push(newMessage);
      await storageService.setItem('panty_messages', messages);

      // Update notifications if needed
      if (request.type !== 'customRequest') {
        await this.updateMessageNotifications(request.receiver, request.sender, request.content);
      }

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
          if (msg.receiver === username) {
            return { ...msg, isRead: true, read: true };
          }
          return msg;
        });
        
        await storageService.setItem('panty_messages', messages);
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
      const blocks = await storageService.getItem<string[]>(
        `blocked_users_${request.blocker}`,
        []
      );
      
      if (!blocks.includes(request.blocked)) {
        blocks.push(request.blocked);
        await storageService.setItem(`blocked_users_${request.blocker}`, blocks);
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
      const blocks = await storageService.getItem<string[]>(
        `blocked_users_${request.blocker}`,
        []
      );
      
      const filtered = blocks.filter(u => u !== request.blocked);
      await storageService.setItem(`blocked_users_${request.blocker}`, filtered);

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
      const blocks = await storageService.getItem<string[]>(
        `blocked_users_${blocker}`,
        []
      );
      return blocks.includes(blocked);
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
      const reports = await storageService.getItem<any[]>('panty_reports', []);
      
      const newReport = {
        id: uuidv4(),
        reporter: request.reporter,
        reportee: request.reportee,
        reason: request.reason,
        messages: request.messages || [],
        date: new Date().toISOString(),
        processed: false,
      };
      
      reports.push(newReport);
      await storageService.setItem('panty_reports', reports);

      // Mark as reported
      const reportedUsers = await storageService.getItem<string[]>(
        `reported_users_${request.reporter}`,
        []
      );
      
      if (!reportedUsers.includes(request.reportee)) {
        reportedUsers.push(request.reportee);
        await storageService.setItem(
          `reported_users_${request.reporter}`,
          reportedUsers
        );
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
      const reportedUsers = await storageService.getItem<string[]>(
        `reported_users_${reporter}`,
        []
      );
      return reportedUsers.includes(reportee);
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
      const notifications = await storageService.getItem<any>(
        'message_notifications',
        {}
      );
      
      if (!notifications[seller]) {
        notifications[seller] = [];
      }
      
      const existingIndex = notifications[seller].findIndex(
        (n: any) => n.buyer === buyer
      );
      
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
      
      await storageService.setItem('message_notifications', notifications);
    } catch (error) {
      console.error('Update message notifications error:', error);
    }
  }

  private async clearMessageNotifications(
    seller: string,
    buyer: string
  ): Promise<void> {
    try {
      const notifications = await storageService.getItem<any>(
        'message_notifications',
        {}
      );
      
      if (notifications[seller]) {
        notifications[seller] = notifications[seller].filter(
          (n: any) => n.buyer !== buyer
        );
        
        if (notifications[seller].length === 0) {
          delete notifications[seller];
        }
        
        await storageService.setItem('message_notifications', notifications);
      }
    } catch (error) {
      console.error('Clear message notifications error:', error);
    }
  }
}

// Export singleton instance
export const messagesService = new MessagesService();