// src/types/notification.ts
export interface Notification {
  id: string;
  _id?: string;
  recipient: string;
  type: 'sale' | 'bid' | 'subscription' | 'tip' | 'order' | 'auction_end' | 'message' | 'system';
  title: string;
  message: string;
  data?: any;
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
  data?: Notification | Notification[] | any;
  error?: any;
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
  error?: any;
}