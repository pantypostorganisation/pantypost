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
  isVerified: boolean;        // Using backend field name (but we won't display the badge)
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
 * Helper: Resolve API root so we never double-append /api
 * - If NEXT_PUBLIC_API_BASE_URL ends with /api, keep it as-is.
 * - Otherwise, append /api.
 * Examples:
 *  - http://localhost:5000        -> http://localhost:5000/api
 *  - https://api.pantypost.com/api -> https://api.pantypost.com/api
 */
function resolveApiRoot(): string {
  const rawBase = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
  return rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
}

/**
 * Helper: Join API root with a path safely
 * - Strips a leading /api from path to avoid /api/api
 * - Ensures exactly one slash between root and path
 */
function joinApi(root: string, path: string): string {
  const cleanedRoot = root.replace(/\/+$/, '');
  const cleanedPath = `/${(path || '').replace(/^\/+/, '')}`;     // ensure leading slash
  const withoutApi = cleanedPath.startsWith('/api/') ? cleanedPath.slice(4) : cleanedPath; // drop '/api'
  return `${cleanedRoot}${withoutApi}`;
}

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
   * FIXED: Make a direct API call to preserve the profiles in the response
   */
  async getThreads(username: string, role?: 'buyer' | 'seller'): Promise<ThreadsResponse> {
    try {
      // Rate limit
      const rateLimitResult = this.rateLimiter.check('API_CALL', RATE_LIMITS.API_CALL);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Rate limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // Build path from API_ENDPOINTS and query
      const basePath = API_ENDPOINTS.MESSAGES.THREADS || '/messages/threads';
      const urlPath =
        username
          ? `${basePath}?username=${encodeURIComponent(username)}${role ? `&role=${role}` : ''}`
          : basePath;

      const apiRoot = resolveApiRoot();
      const fullUrl = joinApi(apiRoot, urlPath);

      const token = this.getAuthToken();

      console.log('[MessagesService.getThreads] Request URL:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error('[MessagesService.getThreads] Non-OK response:', response.status, errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[MessagesService.getThreads] Full response from backend:', data);

      if (data?.success) {
        return {
          success: true,
          data: data.data || [],
          profiles: data.profiles || {},
        };
      }

      return {
        success: false,
        error: data?.error || { message: 'Failed to get threads' },
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
   * FIXED: Make a direct API call to preserve the profiles in the response
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

      const apiRoot = resolveApiRoot();
      // Prefer API_ENDPOINTS if present, otherwise default
      const basePath = (API_ENDPOINTS?.MESSAGES?.THREADS && API_ENDPOINTS.MESSAGES.THREADS.replace(/\/+$/, '')) || '/messages/threads';
      const urlPath = `${basePath}/${encodeURIComponent(threadId)}`;
      const fullUrl = joinApi(apiRoot, urlPath);

      const token = this.getAuthToken();

      console.log('[MessagesService.getThread] Request URL:', fullUrl);

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error('[MessagesService.getThread] Non-OK response:', response.status, errorBody);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[MessagesService.getThread] Full response from backend:', data);

      if (data?.success) {
        return {
          success: true,
          data: data.data || [],
          profiles: data.profiles || {}
        };
      }

      return {
        success: false,
        error: data?.error || { message: 'Failed to get thread' },
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
