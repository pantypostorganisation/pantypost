// src/types/guards.ts

/**
 * Runtime type guards for type safety
 */

import { 
  UserRole, 
  OrderStatus, 
  ListingStatus, 
  CommonVerificationStatus,
  USER_ROLES,
  ORDER_STATUS,
  LISTING_STATUS,
  VERIFICATION_STATUS,
} from './common';
import { User } from '@/context/AuthContext';
import { Listing } from '@/context/ListingContext';
import { Order } from '@/context/WalletContext.enhanced';
import { Result } from './type-utils';

// Basic type guards
export const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value);
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === 'boolean';
};

export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

export const isArray = <T = unknown>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const isNull = (value: unknown): value is null => {
  return value === null;
};

export const isUndefined = (value: unknown): value is undefined => {
  return value === undefined;
};

export const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return value == null;
};

export const isDefined = <T>(value: T | undefined): value is T => {
  return value !== undefined;
};

export const isNotNull = <T>(value: T | null): value is T => {
  return value !== null;
};

// Date guards
export const isDate = (value: unknown): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const isValidDateString = (value: unknown): value is string => {
  return isString(value) && !isNaN(Date.parse(value));
};

// Email guard
export const isEmail = (value: unknown): value is string => {
  return isString(value) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

// URL guard
export const isUrl = (value: unknown): value is string => {
  if (!isString(value)) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

// UUID guard
export const isUuid = (value: unknown): value is string => {
  return isString(value) && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

// Role guards
export const isUserRole = (value: unknown): value is UserRole => {
  return isString(value) && Object.values(USER_ROLES).includes(value as UserRole);
};

export const isBuyer = (user: User | null): boolean => {
  return user?.role === USER_ROLES.BUYER;
};

export const isSeller = (user: User | null): boolean => {
  return user?.role === USER_ROLES.SELLER;
};

export const isAdmin = (user: User | null): boolean => {
  return user?.role === USER_ROLES.ADMIN;
};

// Status guards
export const isOrderStatus = (value: unknown): value is OrderStatus => {
  return isString(value) && Object.values(ORDER_STATUS).includes(value as OrderStatus);
};

export const isListingStatus = (value: unknown): value is ListingStatus => {
  return isString(value) && Object.values(LISTING_STATUS).includes(value as ListingStatus);
};

export const isCommonVerificationStatus = (value: unknown): value is CommonVerificationStatus => {
  return isString(value) && Object.values(VERIFICATION_STATUS).includes(value as CommonVerificationStatus);
};

// Entity guards
export const isUser = (value: unknown): value is User => {
  if (!isObject(value)) return false;
  const user = value as any;
  return (
    isString(user.id) &&
    isString(user.username) &&
    isUserRole(user.role) &&
    isBoolean(user.isVerified) &&
    isString(user.verificationStatus) &&
    isString(user.createdAt) &&
    isString(user.lastActive)
  );
};

export const isListing = (value: unknown): value is Listing => {
  if (!isObject(value)) return false;
  const listing = value as any;
  return (
    isString(listing.id) &&
    isString(listing.title) &&
    isString(listing.description) &&
    isNumber(listing.price) &&
    isNumber(listing.markedUpPrice) &&
    isArray(listing.imageUrls) &&
    isString(listing.date) &&
    isString(listing.seller)
  );
};

export const isOrder = (value: unknown): value is Order => {
  if (!isObject(value)) return false;
  const order = value as any;
  return (
    isString(order.id) &&
    isString(order.title) &&
    isString(order.description) &&
    isNumber(order.price) &&
    isNumber(order.markedUpPrice) &&
    isString(order.date) &&
    isString(order.seller) &&
    isString(order.buyer)
  );
};

// Premium/Subscription guards
export const isPremiumListing = (listing: Listing): boolean => {
  return listing.isPremium === true;
};

export const isAuctionListing = (listing: Listing): boolean => {
  return listing.auction?.isAuction === true;
};

export const isActiveAuction = (listing: Listing): boolean => {
  return isAuctionListing(listing) && listing.auction?.status === 'active';
};

export const isVerifiedUser = (user: User | null): boolean => {
  return user?.isVerified === true || user?.verificationStatus === 'verified';
};

// Array guards
export const isNonEmptyArray = <T>(value: unknown): value is T[] => {
  return isArray(value) && value.length > 0;
};

export const isArrayOf = <T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] => {
  return isArray(value) && value.every(itemGuard);
};

// Composite guards
export const hasRequiredFields = <T extends Record<string, unknown>>(
  obj: unknown,
  fields: (keyof T)[]
): obj is T => {
  if (!isObject(obj)) return false;
  return fields.every(field => field in obj && !isNullOrUndefined(obj[field as string]));
};

// API Response guards
export const isApiError = (error: unknown): error is { message: string; code?: string } => {
  return isObject(error) && isString((error as any).message);
};

export const isApiResponse = <T>(
  response: unknown,
  dataGuard?: (data: unknown) => data is T
): response is { success: boolean; data?: T; error?: any } => {
  if (!isObject(response)) return false;
  const res = response as any;
  if (!isBoolean(res.success)) return false;
  if (res.success && dataGuard && !dataGuard(res.data)) return false;
  return true;
};

// Safe parsing functions
export const safeParseInt = (value: unknown, defaultValue: number = 0): number => {
  if (isNumber(value)) return Math.floor(value);
  if (isString(value)) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

export const safeParseFloat = (value: unknown, defaultValue: number = 0): number => {
  if (isNumber(value)) return value;
  if (isString(value)) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

export const safeParseJSON = <T>(value: string, defaultValue: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return defaultValue;
  }
};

// Assert functions (throw if not valid)
export function assertDefined<T>(
  value: T | undefined,
  message = 'Value is undefined'
): asserts value is T {
  if (isUndefined(value)) {
    throw new Error(message);
  }
}

export function assertNotNull<T>(
  value: T | null,
  message = 'Value is null'
): asserts value is T {
  if (isNull(value)) {
    throw new Error(message);
  }
}

export function assertString(
  value: unknown,
  message = 'Value is not a string'
): asserts value is string {
  if (!isString(value)) {
    throw new Error(message);
  }
}

export function assertNumber(
  value: unknown,
  message = 'Value is not a number'
): asserts value is number {
  if (!isNumber(value)) {
    throw new Error(message);
  }
}
