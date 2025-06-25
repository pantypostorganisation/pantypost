// src/types/common.ts

/**
 * Common types used across the application
 */

import { ValueOf } from './type-utils';

// Branded types for type-safe IDs
export type UserId = string & { readonly brand: unique symbol };
export type ListingId = string & { readonly brand: unique symbol };
export type OrderId = string & { readonly brand: unique symbol };
export type MessageId = string & { readonly brand: unique symbol };
export type NotificationId = string & { readonly brand: unique symbol };

// Helper functions to create branded types
export const UserId = (id: string): UserId => id as UserId;
export const ListingId = (id: string): ListingId => id as ListingId;
export const OrderId = (id: string): OrderId => id as OrderId;
export const MessageId = (id: string): MessageId => id as MessageId;
export const NotificationId = (id: string): NotificationId => id as NotificationId;

// Timestamp types
export type ISOTimestamp = string & { readonly brand: unique symbol };
export type UnixTimestamp = number & { readonly brand: unique symbol };

// Money type (in cents to avoid floating point issues)
export type Money = number & { readonly brand: unique symbol };
export const Money = {
  fromDollars: (dollars: number): Money => Math.round(dollars * 100) as Money,
  toDollars: (money: Money): number => money / 100,
  format: (money: Money): string => `$${(money / 100).toFixed(2)}`,
};

// User roles as const
export const USER_ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin',
} as const;

export type UserRole = ValueOf<typeof USER_ROLES>;

// Status types
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export type OrderStatus = ValueOf<typeof ORDER_STATUS>;

export const LISTING_STATUS = {
  ACTIVE: 'active',
  SOLD: 'sold',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export type ListingStatus = ValueOf<typeof LISTING_STATUS>;

// Verification status
export const VERIFICATION_STATUS = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export type CommonVerificationStatus = ValueOf<typeof VERIFICATION_STATUS>;

// Pagination
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Sort options
export interface SortOptions<T = string> {
  field: T;
  order: 'asc' | 'desc';
}

// Filter options
export interface CommonFilterOptions {
  [key: string]: string | number | boolean | string[] | undefined;
}

// Date range
export interface DateRange {
  start: ISOTimestamp;
  end: ISOTimestamp;
}

// Address type
export interface Address {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber?: string;
}

// Image type
export interface Image {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  alt?: string;
}

// Common Notification type (different from existing)
export interface CommonNotification {
  id: NotificationId;
  userId: UserId;
  type: 'order' | 'message' | 'listing' | 'system' | 'promotion';
  title: string;
  message: string;
  read: boolean;
  createdAt: ISOTimestamp;
  metadata?: Record<string, unknown>;
}
