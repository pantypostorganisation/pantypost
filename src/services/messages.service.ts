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

// UPDATED: Use backend field names directly
export interface UserProfile {
  username: string;
  profilePic: string | null;  // Using backend field name
  isVerified: boolean;        // Using backend field name
  bio?: string;
  tier?: string;
  subscriberCount?: number;
}

export interface ThreadsResponse {
  success: boolean;
  data?: MessageThread[];
  profiles?: { [username: string]: UserProfile };
  error?: { message: string };
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
  seller?: string;
  sender?: string;
  recipient?: string;
  message?: string;
  createdAt?: string;
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
 * Handles all messaging operations with backend API only
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
    // No localStorage initialization - backend only
    console.log('Messages service initialized (backend-only mode)');
  }

  /**
   * Get all message threads for a user with profiles
   * FIXED: Properly extract profiles from the response
   */
  async getThreads(username: string, role?: 'buyer' | 'seller'): Promise<ThreadsResponse> {
    try {
      // Check rate limit
      const rateLimitResult = this.rateLimiter.check('API_CALL', RATE_LIMITS.API_CALL);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Rate limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      const url = username 
        ? `${API_ENDPOINTS.MESSAGES.THREADS}?username=${encodeURIComponent(username)}${role ? `&role=${role}` : ''}`
        : API_ENDPOINTS.MESSAGES.THREADS;
        
      console.log('[MessagesService.getThreads] Calling API:', url);
      const response = await apiCall<any>(url);
      console.log('[MessagesService.getThreads] Raw response from apiCall:', response);
      
      if (response.success) {
        // DEBUG: Log what we received
        console.log('[MessagesService.getThreads] response.success is true');
        console.log('[MessagesService.getThreads] response.data type:', typeof response.data);
        console.log('[MessagesService.getThreads] response.data keys:', response.data ? Object.keys(response.data) : 'null');
        
        // The backend sends { success: true, data: [...threads], profiles: {...} }
        // But apiCall() extracts only the 'data' field from backend response
        // So response.data here is just the threads array, not the full response
        
        // We need to check if response.data is the threads array or the full structure
        let threads: MessageThread[] = [];
        let profiles: { [username: string]: UserProfile } = {};
        
        if (Array.isArray(response.data)) {
          // response.data is just the threads array
          // This means profiles were lost during apiCall processing
          console.log('[MessagesService.getThreads] response.data is an array (threads only, no profiles)');
          threads = response.data;
          profiles = {};
          
          // WORKAROUND: Make a direct fetch to get the full response with profiles
          try {
            const token = this.getAuthToken();
            if (token) {
              const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
              const directUrl = `${baseUrl}/api${url}`;
              
              console.log('[MessagesService.getThreads] Making direct fetch to get profiles:', directUrl);
              
              const directResponse = await fetch(directUrl, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (directResponse.ok) {
                const directData = await directResponse.json();
                console.log('[MessagesService.getThreads] Direct fetch response:', directData);
                
                if (directData.success && directData.profiles) {
                  profiles = directData.profiles;
                  console.log('[MessagesService.getThreads] Got profiles from direct fetch:', profiles);
                }
              }
            }
          } catch (error) {
            console.error('[MessagesService.getThreads] Direct fetch failed:', error);
          }
        } else if (response.data && typeof response.data === 'object') {
          // Check if response.data has the full structure
          if ('data' in response.data && 'profiles' in response.data) {
            console.log('[MessagesService.getThreads] Found nested structure with profiles');
            threads = response.data.data;
            profiles = response.data.profiles;
          } else if ('profiles' in response.data) {
            // Profiles at same level as threads?
            console.log('[MessagesService.getThreads] Found profiles at same level');
            profiles = response.data.profiles;
            // Extract threads - might be under a different key
            threads = response.data.threads || response.data.data || [];
          }
        }
        
        console.log('[MessagesService.getThreads] Final result - threads count:', threads.length);
        console.log('[MessagesService.getThreads] Final result - profiles:', profiles);
        
        return {
          success: true,
          data: threads,
          profiles: profiles
        };
      }
      
      return {
        success: false,
        error: response.error || { message: 'Failed to get threads' },
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
   * Get auth token helper
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    try {
      // Check sessionStorage first (where AuthContext stores it)
      const authTokens = sessionStorage.getItem('auth_tokens');
      if (authTokens) {
        const parsed = JSON.parse(authTokens);
        return parsed.token || null;
      }
      
      // Check direct auth_token
      const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      return token;
    } catch {
      return null;
    }
  }

  /**
   * Get messages between two users with profiles
   * FIXED: Properly extract profiles from the response
   */
  async getThread(userA: string, userB: string): Promise<ApiResponse<Message[]> & { profiles?: { [username: string]: UserProfile } }> {
    try {
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
      
      const response = await apiCall<any>(
        buildApiUrl(API_ENDPOINTS.MESSAGES.THREAD, { threadId })
      );
      
      console.log('[MessagesService.getThread] Raw response:', response);
      
      if (response.success && response.data) {
        let messages: Message[] = [];
        let profiles: { [username: string]: UserProfile } = {};
        
        // Similar logic to getThreads
        if (Array.isArray(response.data)) {
          messages = response.data;
          
          // Try direct fetch for profiles
          try {
            const token = this.getAuthToken();
            if (token) {
              const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
              const directUrl = `${baseUrl}/api/messages/threads/${threadId}`;
              
              const directResponse = await fetch(directUrl, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (directResponse.ok) {
                const directData = await directResponse.json();
                if (directData.profiles) {
                  profiles = directData.profiles;
                }
              }
            }
          } catch (error) {
            console.error('[MessagesService.getThread] Direct fetch failed:', error);
          }
        } else if (response.data && typeof response.data === 'object') {
          if ('data' in response.data && 'profiles' in response.data) {
            messages = response.data.data;
            profiles = response.data.profiles;
          }
        }
        
        return {
          success: true,
          data: messages,
          profiles: profiles
        };
      }
      
      return response;
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
      const validation = validateSchema(sendMessageSchema, request);
      if (!validation.success) {
        return {
          success: false,
          error: { message: Object.values(validation.errors || {})[0] || 'Invalid message data' },
        };
      }

      const sanitizedRequest = validation.data!;

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

      const contentCheck = securityService.checkContentSecurity(sanitizedRequest.content);
      if (!contentCheck.safe) {
        return {
          success: false,
          error: { message: 'Message contains prohibited content' },
        };
      }

      const response = await apiCall<Message>(API_ENDPOINTS.MESSAGES.SEND, {
        method: 'POST',
        body: JSON.stringify(sanitizedRequest),
      });

      if (response.success && response.data) {
        const conversationKey = this.getConversationKey(sanitizedRequest.sender, sanitizedRequest.receiver);
        this.notifyMessageListeners(conversationKey, response.data);
      }

      return response;
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
   * Mark messages as read
   */
  async markMessagesAsRead(
    username: string,
    otherParty: string
  ): Promise<ApiResponse<void>> {
    try {
      const sanitizedUsername = sanitizeStrict(username);
      const sanitizedOtherParty = sanitizeStrict(otherParty);
      
      if (!sanitizedUsername || !sanitizedOtherParty || 
          sanitizedUsername.length > 30 || sanitizedOtherParty.length > 30) {
        return {
          success: false,
          error: { message: 'Invalid usernames' },
        };
      }

      const response = await apiCall<void>(API_ENDPOINTS.MESSAGES.MARK_READ, {
        method: 'POST',
        body: JSON.stringify({ 
          username: sanitizedUsername,
          otherParty: sanitizedOtherParty 
        }),
      });

      return response;
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
      const validation = validateSchema(blockUserSchema, request);
      if (!validation.success) {
        return {
          success: false,
          error: { message: 'Invalid block request' },
        };
      }

      const sanitizedRequest = validation.data!;

      const rateLimitResult = this.rateLimiter.check(
        `block_user_${sanitizedRequest.blocker}`,
        { maxAttempts: 10, windowMs: 60 * 60 * 1000 }
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: 'Too many block attempts. Please try again later.' },
        };
      }

      return await apiCall<void>(API_ENDPOINTS.MESSAGES.BLOCK_USER, {
        method: 'POST',
        body: JSON.stringify(sanitizedRequest),
      });
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
      const validation = validateSchema(blockUserSchema, request);
      if (!validation.success) {
        return {
          success: false,
          error: { message: 'Invalid unblock request' },
        };
      }

      const sanitizedRequest = validation.data!;

      return await apiCall<void>(API_ENDPOINTS.MESSAGES.UNBLOCK_USER, {
        method: 'POST',
        body: JSON.stringify(sanitizedRequest),
      });
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
      const sanitizedBlocker = sanitizeStrict(blocker);
      const sanitizedBlocked = sanitizeStrict(blocked);
      
      if (!sanitizedBlocker || !sanitizedBlocked) {
        return false;
      }

      // This would need a backend endpoint to check
      return false;
    } catch (error) {
      console.error('Check blocked error:', error);
      return false;
    }
  }

  /**
   * Report a user
   * Note: This endpoint is not currently used as we use the main reports service instead
   * Keeping it here for completeness but it won't be called
   */
  async reportUser(request: ReportUserRequest): Promise<ApiResponse<void>> {
    try {
      // This method is not actually called anymore
      // We use the reports service directly in MessageContext
      // Keeping this stub for API completeness
      return {
        success: true,
        data: undefined
      };
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
      const sanitizedReporter = sanitizeStrict(reporter);
      const sanitizedReportee = sanitizeStrict(reportee);
      
      if (!sanitizedReporter || !sanitizedReportee) {
        return false;
      }

      // This would need a backend endpoint to check
      return false;
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
      const sanitizedUsername = sanitizeStrict(username);
      if (!sanitizedUsername) {
        return 0;
      }

      const response = await apiCall<{ count: number }>(
        `${API_ENDPOINTS.MESSAGES.THREADS.replace('/threads', '/unread-count')}?username=${encodeURIComponent(sanitizedUsername)}`
      );
      
      return response.success && response.data ? response.data.count : 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(): Promise<ApiResponse<{ [user: string]: string[] }>> {
    try {
      // Use the correct endpoint path
      const response = await apiCall<{ [user: string]: string[] }>(
        `${API_ENDPOINTS.MESSAGES.THREADS.replace('/threads', '/blocked-users')}`
      );
      
      return response.success ? response : { success: true, data: {} };
    } catch (error) {
      console.error('Get blocked users error:', error);
      return { success: true, data: {} };
    }
  }

  /**
   * Get message notifications
   */
  async getMessageNotifications(username: string): Promise<ApiResponse<MessageNotification[]>> {
    try {
      const sanitizedUsername = sanitizeStrict(username);
      if (!sanitizedUsername) {
        return { success: true, data: [] };
      }

      // Use the correct endpoint path
      const response = await apiCall<MessageNotification[]>(
        `${API_ENDPOINTS.MESSAGES.THREADS.replace('/threads', '/notifications')}?username=${encodeURIComponent(sanitizedUsername)}`
      );
      
      return response.success ? response : { success: true, data: [] };
    } catch (error) {
      console.error('Get message notifications error:', error);
      return { success: true, data: [] };
    }
  }

  /**
   * Get unread reports count
   */
  async getUnreadReports(): Promise<ApiResponse<{ count: number }>> {
    try {
      // Use the correct endpoint path
      const response = await apiCall<{ count: number }>(
        `${API_ENDPOINTS.MESSAGES.THREADS.replace('/threads', '/reports/unread-count')}`
      );
      
      return response.success ? response : { success: true, data: { count: 0 } };
    } catch (error) {
      console.error('Get unread reports error:', error);
      return { success: true, data: { count: 0 } };
    }
  }

  /**
   * Clear message notifications
   */
  async clearMessageNotifications(seller: string, buyer: string): Promise<void> {
    try {
      const sanitizedSeller = sanitizeStrict(seller);
      const sanitizedBuyer = sanitizeStrict(buyer);
      
      if (!sanitizedSeller || !sanitizedBuyer) {
        return;
      }

      // Use the correct endpoint path
      await apiCall<void>(`${API_ENDPOINTS.MESSAGES.THREADS.replace('/threads', '/notifications/clear')}`, {
        method: 'POST',
        body: JSON.stringify({
          seller: sanitizedSeller,
          buyer: sanitizedBuyer
        })
      });
    } catch (error) {
      console.error('Clear message notifications error:', error);
    }
  }

  /**
   * Subscribe to message updates
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
   * Upload attachment
   */
  async uploadAttachment(file: File): Promise<ApiResponse<MessageAttachment>> {
    try {
      const fileValidation = securityService.validateFileUpload(file, {
        maxSize: 5 * 1024 * 1024,
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      });

      if (!fileValidation.valid) {
        return {
          success: false,
          error: { message: fileValidation.error || 'Invalid file' },
        };
      }

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

      // For now, return an error as this endpoint doesn't exist yet
      return {
        success: false,
        error: { message: 'File upload not implemented yet' },
      };
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
    const sanitizedUserA = sanitizeStrict(userA);
    const sanitizedUserB = sanitizeStrict(userB);
    return [sanitizedUserA, sanitizedUserB].sort().join('-');
  }

  private notifyMessageListeners(threadId: string, message: Message): void {
    const listeners = this.messageListeners.get(threadId);
    if (listeners) {
      listeners.forEach(callback => callback(message));
    }
  }

  /**
   * Prepare for WebSocket connection
   */
  prepareWebSocket(): void {
    this.wsReady = false;
  }

  /**
   * Check if WebSocket is ready
   */
  isWebSocketReady(): boolean {
    return this.wsReady;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.messageCache.clear();
    this.threadCache.clear();
  }
}

// Export singleton instance
export const messagesService = new MessagesService();