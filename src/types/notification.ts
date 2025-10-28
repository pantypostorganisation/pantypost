// src/types/notification.ts

export interface Notification {
  id: string;
  _id?: string;
  recipient: string;
  type: 'sale' | 'bid' | 'subscription' | 'tip' | 'order' | 'auction_end' | 'message' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  cleared: boolean;
  deleted?: boolean;
  priority?: 'low' | 'normal' | 'high';
  relatedId?: string;
  relatedType?: 'listing' | 'order' | 'user' | 'auction' | 'message';
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification | Notification[] | Record<string, unknown>;
  error?: unknown;
}

export interface NotificationPaginationResponse {
  success: boolean;
  data?: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: unknown;
}