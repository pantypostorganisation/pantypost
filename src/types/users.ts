// src/types/users.ts

import { User } from '@/context/AuthContext';

// User-related types
export type UserRole = 'buyer' | 'seller' | 'admin';
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'unverified';
export type SellerTier = 'Tease' | 'Flirt' | 'Obsession' | 'Desire' | 'Goddess';

// Extended user profile with all possible fields
export interface UserProfile {
  bio: string;
  profilePic: string | null;
  profilePicUpdatedAt?: string | null;
  subscriptionPrice: string;
  lastUpdated?: string;
  galleryImages?: string[];
  country?: string | null;
  isLocationPublic?: boolean;
  preferences?: UserPreferences;
  completeness?: ProfileCompleteness;
  socialLinks?: SocialLinks;
  stats?: UserStats;
}

// User preferences
export interface UserPreferences {
  notifications: {
    messages: boolean;
    orders: boolean;
    promotions: boolean;
    newsletters: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    profileVisibility: 'public' | 'subscribers' | 'private';
  };
  language: string;
  currency: string;
  timezone: string;
}

// Profile completeness tracking
export interface ProfileCompleteness {
  percentage: number;
  missingFields: string[];
  suggestions: string[];
}

// Social links
export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
}

// User statistics
export interface UserStats {
  joinedDate: string;
  lastActive: string;
  totalSales?: number;
  totalPurchases?: number;
  averageRating?: number;
  reviewCount?: number;
  subscriberCount?: number;
  listingCount?: number;
  responseTime?: number; // in minutes
}

// Activity tracking
export interface UserActivity {
  id: string;
  userId: string;
  type: 'login' | 'profile_update' | 'listing_created' | 'order_placed' | 'message_sent';
  timestamp: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Search and filter types
export interface UserSearchParams {
  query?: string;
  role?: UserRole;
  verified?: boolean;
  tier?: SellerTier;
  minRating?: number;
  hasListings?: boolean;
  isActive?: boolean;
  sortBy?: 'username' | 'joinDate' | 'rating' | 'sales' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Verification types
export interface VerificationRequest {
  codePhoto?: string;
  idFront?: string;
  idBack?: string;
  passport?: string;
  code?: string;
  submittedAt?: string;
}

export interface VerificationUpdateRequest {
  status: VerificationStatus;
  rejectionReason?: string;
  adminUsername?: string;
  reviewedAt?: string;
}

// Ban management types
export interface BanDetails {
  reason: string;
  bannedBy: string;
  bannedAt: string;
  expiresAt?: string;
  appealStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  appealReason?: string;
  appealedAt?: string;
}

export interface BanRequest {
  username: string;
  reason: string;
  duration?: number; // in days, undefined = permanent
  adminUsername: string;
  evidence?: string[];
}

// Subscription types
export interface SubscriptionInfo {
  seller: string;
  buyer: string;
  price: string;
  subscribedAt: string;
  expiresAt?: string;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled';
}

// Batch operation types
export interface BatchUserUpdate {
  username: string;
  updates: Partial<User>;
}

export interface BatchOperationResult {
  succeeded: string[];
  failed: Array<{
    username: string;
    error: string;
  }>;
}

// Cache types
export interface CachedUser {
  data: User;
  timestamp: number;
  expiresAt: number;
}

export interface CachedUserProfile {
  data: UserProfile;
  timestamp: number;
  expiresAt: number;
}

// Error types
export enum UserErrorCode {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  INVALID_USERNAME = 'INVALID_USERNAME',
  INVALID_ROLE = 'INVALID_ROLE',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  BAN_FAILED = 'BAN_FAILED',
  SUBSCRIPTION_FAILED = 'SUBSCRIPTION_FAILED',
  PROFILE_UPDATE_FAILED = 'PROFILE_UPDATE_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export interface UserError {
  code: UserErrorCode;
  message: string;
  field?: string;
  details?: any;
}

// Validation schemas
export const UserValidation = {
  username: {
    min: 2,
    max: 50,
    pattern: /^[a-zA-Z0-9_-]+$/,
    message: 'Username must be 2-50 characters and contain only letters, numbers, underscores, and hyphens',
  },
  bio: {
    max: 500,
    message: 'Bio must be less than 500 characters',
  },
  subscriptionPrice: {
    min: 0,
    max: 999.99,
    pattern: /^\d+(\.\d{1,2})?$/,
    message: 'Price must be a valid amount between $0 and $999.99',
  },
};

// Response types
export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ProfileResponse {
  profile: UserProfile;
  user: User;
}

// Export helper functions
export function isValidUsername(username: string): boolean {
  return (
    username.length >= UserValidation.username.min &&
    username.length <= UserValidation.username.max &&
    UserValidation.username.pattern.test(username)
  );
}

export function isValidBio(bio: string): boolean {
  return bio.length <= UserValidation.bio.max;
}

export function isValidSubscriptionPrice(price: string): boolean {
  const numPrice = parseFloat(price);
  return (
    UserValidation.subscriptionPrice.pattern.test(price) &&
    numPrice >= UserValidation.subscriptionPrice.min &&
    numPrice <= UserValidation.subscriptionPrice.max
  );
}

export function calculateProfileCompleteness(user: User, profile?: UserProfile): ProfileCompleteness {
  const requiredFields = [
    { field: 'profilePic', label: 'Profile Picture' },
    { field: 'bio', label: 'Bio' },
    { field: 'subscriptionPrice', label: 'Subscription Price' },
  ];

  const missingFields: string[] = [];
  let completedCount = 0;

  // Check user fields
  if (!user.profilePicture) missingFields.push('Profile Picture');
  else completedCount++;

  // Check profile fields
  if (!profile?.bio || profile.bio.length < 50) missingFields.push('Bio (minimum 50 characters)');
  else completedCount++;

  if (!profile?.subscriptionPrice || profile.subscriptionPrice === '0') {
    missingFields.push('Subscription Price');
  } else {
    completedCount++;
  }

  // Additional optional fields that improve profile
  if (user.role === 'seller') {
    if (!user.isVerified) missingFields.push('Verification');
    if (!profile?.galleryImages?.length) missingFields.push('Gallery Images');
  }

  const percentage = Math.round((completedCount / requiredFields.length) * 100);

  const suggestions: string[] = [];
  if (percentage < 100) {
    suggestions.push('Complete your profile to attract more buyers');
    if (!user.isVerified && user.role === 'seller') {
      suggestions.push('Get verified to build trust');
    }
  }

  return {
    percentage,
    missingFields,
    suggestions,
  };
}