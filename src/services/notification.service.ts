// src/services/notification.service.ts
import { apiClient } from './api.config';
import { storageService } from './storage.service';
import { securityService, sanitize } from './security.service';
import { v4 as uuidv4 } from 'uuid';
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

  // Get active notifications
  async getActiveNotifications(limit: number = 50): Promise<NotificationResponse> {
    try {
      const cacheKey = `active_${limit}`;
      const cached = this.getCachedNotifications(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await apiClient.call<Notification[]>(
        `/notifications/active?limit=${limit}`, // Fixed: removed /api prefix
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
        
        // Store in local storage for offline access
        await storageService.setItem('active_notifications', sanitizedNotifications);
        
        return { success: true, data: sanitizedNotifications };
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error fetching active notifications:', error);
      
      // Try to return cached data on error
      const cached = await storageService.getItem<Notification[]>('active_notifications', []);
      return { success: true, data: cached };
    }
  }

  // Get cleared notifications
  async getClearedNotifications(limit: number = 50): Promise<NotificationResponse> {
    try {
      const cacheKey = `cleared_${limit}`;
      const cached = this.getCachedNotifications(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await apiClient.call<Notification[]>(
        `/notifications/cleared?limit=${limit}`, // Fixed: removed /api prefix
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
        
        // Store in local storage
        await storageService.setItem('cleared_notifications', sanitizedNotifications);
        
        return { success: true, data: sanitizedNotifications };
      }

      return response as NotificationResponse;
    } catch (error) {
      console.error('Error fetching cleared notifications:', error);
      
      // Try to return cached data on error
      const cached = await storageService.getItem<Notification[]>('cleared_notifications', []);
      return { success: true, data: cached };
    }
  }

  // Get all notifications with pagination
  async getAllNotifications(page: number = 1, limit: number = 100): Promise<NotificationPaginationResponse> {
    try {
      const response = await apiClient.call<any>(
        `/notifications/all?page=${page}&limit=${limit}`, // Fixed: removed /api prefix
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

  // Get unread count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.call<{ count: number }>(
        `/notifications/unread-count`, // Fixed: removed /api prefix
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

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    try {
      const sanitizedId = sanitize.strict(notificationId);
      
      const response = await apiClient.call<Notification>(
        `/notifications/${sanitizedId}/read`, // Fixed: removed /api prefix
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

  // Mark all notifications as read
  async markAllAsRead(): Promise<NotificationResponse> {
    try {
      const response = await apiClient.call<any>(
        `/notifications/read-all`, // Fixed: removed /api prefix
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

  // Clear notification
  async clearNotification(notificationId: string): Promise<NotificationResponse> {
    try {
      const sanitizedId = sanitize.strict(notificationId);
      
      const response = await apiClient.call<Notification>(
        `/notifications/${sanitizedId}/clear`, // Fixed: removed /api prefix
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success) {
        this.invalidateCache();
        
        // Update local storage
        const active = await storageService.getItem<Notification[]>('active_notifications', []);
        const updated = active.filter(n => (n._id || n.id) !== sanitizedId);
        await storageService.setItem('active_notifications', updated);
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

  // Clear all notifications
  async clearAll(): Promise<NotificationResponse> {
    try {
      const response = await apiClient.call<any>(
        `/notifications/clear-all`, // Fixed: removed /api prefix
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success) {
        this.invalidateCache();
        await storageService.removeItem('active_notifications');
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

  // Restore notification
  async restoreNotification(notificationId: string): Promise<NotificationResponse> {
    try {
      const sanitizedId = sanitize.strict(notificationId);
      
      const response = await apiClient.call<Notification>(
        `/notifications/${sanitizedId}/restore`, // Fixed: removed /api prefix
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

  // Delete notification
  async deleteNotification(notificationId: string): Promise<NotificationResponse> {
    try {
      const sanitizedId = sanitize.strict(notificationId);
      
      const response = await apiClient.call<any>(
        `/notifications/${sanitizedId}`, // Fixed: removed /api prefix
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success) {
        this.invalidateCache();
        
        // Update local storage
        const cleared = await storageService.getItem<Notification[]>('cleared_notifications', []);
        const updated = cleared.filter(n => (n._id || n.id) !== sanitizedId);
        await storageService.setItem('cleared_notifications', updated);
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

  // Delete all cleared notifications
  async deleteAllCleared(): Promise<NotificationResponse> {
    try {
      const response = await apiClient.call<any>(
        `/notifications/cleared/all`, // Fixed: removed /api prefix
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.success) {
        this.invalidateCache();
        await storageService.removeItem('cleared_notifications');
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

  // Get notifications by type
  async getNotificationsByType(type: string, limit: number = 50): Promise<NotificationResponse> {
    try {
      const sanitizedType = sanitize.strict(type);
      
      const response = await apiClient.call<Notification[]>(
        `/notifications/type/${sanitizedType}?limit=${limit}`, // Fixed: removed /api prefix
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

  // Search notifications
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
        `/notifications/search?${queryString}`, // Fixed: removed /api prefix
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

  // Create local notification (for legacy support)
  async createLocalNotification(recipient: string, message: string, type: string = 'system'): Promise<void> {
    try {
      const notifications = await storageService.getItem<Record<string, Notification[]>>('local_notifications', {});
      
      const newNotification: Notification = {
        id: `local_${Date.now()}_${Math.random()}`,
        recipient: sanitize.username(recipient),
        type: type as any,
        title: 'Notification',
        message: sanitize.strict(message),
        read: false,
        cleared: false,
        createdAt: new Date().toISOString(),
        priority: 'normal'
      };

      if (!notifications[recipient]) {
        notifications[recipient] = [];
      }

      notifications[recipient].unshift(newNotification);
      
      // Keep only last 100 notifications per user
      notifications[recipient] = notifications[recipient].slice(0, 100);
      
      await storageService.setItem('local_notifications', notifications);
      
      // Fire event for UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notification:new', {
          detail: newNotification
        }));
      }
    } catch (error) {
      console.error('Error creating local notification:', error);
    }
  }

  // Sync local notifications with backend
  async syncNotifications(): Promise<void> {
    try {
      // Get remote notifications
      const remoteResponse = await this.getActiveNotifications(100);
      if (!remoteResponse.success || !remoteResponse.data) return;

      const remoteNotifications = Array.isArray(remoteResponse.data) ? remoteResponse.data : [];

      // Get local notifications
      const localNotifications = await storageService.getItem<Record<string, Notification[]>>('local_notifications', {});
      
      // Merge and deduplicate
      // This is a simplified sync - in production you'd want more sophisticated conflict resolution
      const merged: Record<string, Notification[]> = {};
      
      // Add remote notifications
      remoteNotifications.forEach(n => {
        if (!merged[n.recipient]) {
          merged[n.recipient] = [];
        }
        merged[n.recipient].push(n);
      });

      // Add local notifications that don't exist remotely
      Object.entries(localNotifications).forEach(([recipient, notifications]) => {
        if (!merged[recipient]) {
          merged[recipient] = [];
        }
        
        notifications.forEach(localNotif => {
          if (localNotif.id.startsWith('local_')) {
            // This is a local-only notification, keep it
            merged[recipient].push(localNotif);
          }
        });
      });

      // Sort by date and limit
      Object.keys(merged).forEach(recipient => {
        merged[recipient] = merged[recipient]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 100);
      });

      await storageService.setItem('local_notifications', merged);
    } catch (error) {
      console.error('Error syncing notifications:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export type { Notification, NotificationResponse, NotificationPaginationResponse };