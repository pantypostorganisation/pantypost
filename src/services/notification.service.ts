// src/services/notification.service.ts
import { apiClient } from './api.config';
import { securityService, sanitize } from './security.service';
import type { 
  Notification, 
  NotificationResponse, 
  NotificationPaginationResponse 
} from '@/types/notification';

class NotificationService {
  private static instance: NotificationService;
  private cachedNotifications: Map<string, { data: Notification[]; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds cache

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Get active notifications - NO localStorage
  async getActiveNotifications(limit: number = 50): Promise<NotificationResponse> {
    try {
      const cacheKey = `active_${limit}`;
      const cached = this.getCachedNotifications(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await apiClient.call<Notification[]>(
        `/notifications/active?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success && response.data) {
        const sanitizedNotifications = this.sanitizeNotifications(response.data);
        this.setCachedNotifications(cacheKey, sanitizedNotifications);
        return { success: true, data: sanitizedNotifications };
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error fetching active notifications:', error);
      // Return empty array on error, NO localStorage fallback
      return { success: false, error: 'Failed to fetch notifications', data: [] };
    }
  }

  // Get cleared notifications - NO localStorage
  async getClearedNotifications(limit: number = 50): Promise<NotificationResponse> {
    try {
      const cacheKey = `cleared_${limit}`;
      const cached = this.getCachedNotifications(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await apiClient.call<Notification[]>(
        `/notifications/cleared?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success && response.data) {
        const sanitizedNotifications = this.sanitizeNotifications(response.data);
        this.setCachedNotifications(cacheKey, sanitizedNotifications);
        return { success: true, data: sanitizedNotifications };
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error fetching cleared notifications:', error);
      // Return empty array on error, NO localStorage fallback
      return { success: false, error: 'Failed to fetch notifications', data: [] };
    }
  }

  async getAllNotifications(page: number = 1, limit: number = 100): Promise<NotificationPaginationResponse> {
    try {
      const response = await apiClient.call<any>(
        `/notifications/all?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success && response.data) {
        const sanitizedData = {
          ...response.data,
          notifications: this.sanitizeNotifications(response.data.notifications || [])
        };
        
        return { success: true, data: sanitizedData };
      }

      return response as NotificationPaginationResponse;
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      return {
        success: false,
        error: 'Failed to fetch notifications'
      };
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.call<{ count: number }>(
        `/notifications/unread-count`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success && response.data) {
        return response.data.count || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    try {
      const sanitizedId = sanitize.strict(notificationId);
      
      const response = await apiClient.call<Notification>(
        `/notifications/${sanitizedId}/read`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success) {
        this.invalidateCache();
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: 'Failed to mark notification as read'
      };
    }
  }

  async markAllAsRead(): Promise<NotificationResponse> {
    try {
      const response = await apiClient.call<any>(
        `/notifications/read-all`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success) {
        this.invalidateCache();
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return {
        success: false,
        error: 'Failed to mark all notifications as read'
      };
    }
  }

  async clearNotification(notificationId: string): Promise<NotificationResponse> {
    try {
      const sanitizedId = sanitize.strict(notificationId);
      
      const response = await apiClient.call<Notification>(
        `/notifications/${sanitizedId}/clear`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success) {
        this.invalidateCache();
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error clearing notification:', error);
      return {
        success: false,
        error: 'Failed to clear notification'
      };
    }
  }

  async clearAll(): Promise<NotificationResponse> {
    try {
      const response = await apiClient.call<any>(
        `/notifications/clear-all`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success) {
        this.invalidateCache();
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      return {
        success: false,
        error: 'Failed to clear all notifications'
      };
    }
  }

  async restoreNotification(notificationId: string): Promise<NotificationResponse> {
    try {
      const sanitizedId = sanitize.strict(notificationId);
      
      const response = await apiClient.call<Notification>(
        `/notifications/${sanitizedId}/restore`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success) {
        this.invalidateCache();
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error restoring notification:', error);
      return {
        success: false,
        error: 'Failed to restore notification'
      };
    }
  }

  async deleteNotification(notificationId: string): Promise<NotificationResponse> {
    try {
      const sanitizedId = sanitize.strict(notificationId);
      
      const response = await apiClient.call<any>(
        `/notifications/${sanitizedId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success) {
        this.invalidateCache();
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        error: 'Failed to delete notification'
      };
    }
  }

  async deleteAllCleared(): Promise<NotificationResponse> {
    try {
      const response = await apiClient.call<any>(
        `/notifications/cleared/all`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success) {
        this.invalidateCache();
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error deleting cleared notifications:', error);
      return {
        success: false,
        error: 'Failed to delete cleared notifications'
      };
    }
  }

  async getNotificationsByType(type: string, limit: number = 50): Promise<NotificationResponse> {
    try {
      const sanitizedType = sanitize.strict(type);
      
      const response = await apiClient.call<Notification[]>(
        `/notifications/type/${sanitizedType}?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success && response.data) {
        const sanitizedNotifications = this.sanitizeNotifications(response.data);
        return { success: true, data: sanitizedNotifications };
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error fetching notifications by type:', error);
      return {
        success: false,
        error: 'Failed to fetch notifications'
      };
    }
  }

  async searchNotifications(params: {
    q?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<NotificationResponse> {
    try {
      const sanitizedParams = {
        q: params.q ? sanitize.strict(params.q) : undefined,
        type: params.type ? sanitize.strict(params.type) : undefined,
        startDate: params.startDate,
        endDate: params.endDate,
        limit: params.limit || 50
      };

      const queryString = new URLSearchParams(
        Object.entries(sanitizedParams).filter(([_, v]) => v !== undefined) as [string, string][]
      ).toString();

      const response = await apiClient.call<Notification[]>(
        `/notifications/search?${queryString}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success && response.data) {
        const sanitizedNotifications = this.sanitizeNotifications(response.data);
        return { success: true, data: sanitizedNotifications };
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error searching notifications:', error);
      return {
        success: false,
        error: 'Failed to search notifications'
      };
    }
  }

  // Create notification (send to backend)
  async createNotification(notification: Partial<Notification>): Promise<NotificationResponse> {
    try {
      const response = await apiClient.call<Notification>(
        `/notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient: notification.recipient,
            type: notification.type || 'system',
            title: notification.title || 'Notification',
            message: notification.message || '',
            priority: notification.priority || 'normal',
            data: notification.data
          })
        }
      );

      if (response.success) {
        this.invalidateCache();
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        error: 'Failed to create notification'
      };
    }
  }

  // Helper methods
  private sanitizeNotifications(notifications: Notification[]): Notification[] {
    return notifications.map(n => ({
      ...n,
      id: n._id || n.id,
      title: sanitize.strict(n.title),
      message: sanitize.strict(n.message),
      recipient: sanitize.username(n.recipient)
    }));
  }

  private getCachedNotifications(key: string): Notification[] | null {
    const cached = this.cachedNotifications.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedNotifications(key: string, data: Notification[]): void {
    this.cachedNotifications.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private invalidateCache(): void {
    this.cachedNotifications.clear();
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export type { Notification, NotificationResponse, NotificationPaginationResponse };