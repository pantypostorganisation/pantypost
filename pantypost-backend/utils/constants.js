// pantypost-backend/utils/constants.js
// This file contains all the constants used throughout the API
// Based on your API specification document

// Error codes from your API spec
const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  
  // Business logic errors
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  LISTING_LIMIT_EXCEEDED: 'LISTING_LIMIT_EXCEEDED',
  ACTION_NOT_ALLOWED: 'ACTION_NOT_ALLOWED',
  AUCTION_ENDED: 'AUCTION_ENDED',
  BID_TOO_LOW: 'BID_TOO_LOW',
  
  // Profile/User errors
  PROFILE_UPDATE_FAILED: 'PROFILE_UPDATE_FAILED',
  VERIFICATION_FAILED: 'VERIFICATION_FAILED',
  BAN_FAILED: 'BAN_FAILED',
  SUBSCRIPTION_FAILED: 'SUBSCRIPTION_FAILED',
  
  // Gallery errors
  GALLERY_UPDATE_FAILED: 'GALLERY_UPDATE_FAILED',
  GALLERY_LIMIT_EXCEEDED: 'GALLERY_LIMIT_EXCEEDED',
  INVALID_IMAGE_FORMAT: 'INVALID_IMAGE_FORMAT',
  IMAGE_UPLOAD_FAILED: 'IMAGE_UPLOAD_FAILED',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  OPERATION_FAILED: 'OPERATION_FAILED'
};

// Order status values
const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  PENDING_AUCTION: 'pending-auction'
};

// User roles
const USER_ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  ADMIN: 'admin'
};

// Seller tiers - Updated to match your tier system
const SELLER_TIERS = {
  TEASE: 'Tease',
  FLIRT: 'Flirt',        // Previously Tempt
  OBSESSION: 'Obsession', // Previously Indulge
  DESIRE: 'Desire',       // Previously Crave
  GODDESS: 'Goddess'      // New highest tier
};

// Tier levels for calculations
const TIER_LEVELS = {
  TEASE: { minSales: 0, minAmount: 0, credit: 0 },
  FLIRT: { minSales: 10, minAmount: 5000, credit: 0.01 },
  OBSESSION: { minSales: 101, minAmount: 12500, credit: 0.02 },
  DESIRE: { minSales: 251, minAmount: 75000, credit: 0.03 },
  GODDESS: { minSales: 1001, minAmount: 150000, credit: 0.05 }
};

// Verification status
const VERIFICATION_STATUS = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

// Listing status
const LISTING_STATUS = {
  ACTIVE: 'active',
  SOLD: 'sold',
  EXPIRED: 'expired'
};

// Message types
const MESSAGE_TYPES = {
  NORMAL: 'normal',
  CUSTOM_REQUEST: 'customRequest',
  IMAGE: 'image',
  TIP: 'tip'
};

// Transaction types
const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  PURCHASE: 'purchase',
  SALE: 'sale',
  TIP: 'tip',
  SUBSCRIPTION: 'subscription',
  ADMIN_CREDIT: 'admin_credit',
  ADMIN_DEBIT: 'admin_debit',
  REFUND: 'refund',
  FEE: 'fee',
  TIER_CREDIT: 'tier_credit'
};

// Gallery actions
const GALLERY_ACTIONS = {
  ADD: 'add',
  REMOVE: 'remove',
  REPLACE: 'replace',
  CLEAR: 'clear'
};

// Limits from your API spec
const LIMITS = {
  // Username
  USERNAME_MIN: 3,
  USERNAME_MAX: 20,
  
  // Password
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 100,
  
  // Email
  EMAIL_MAX: 100,
  
  // Listing
  LISTING_TITLE_MIN: 3,
  LISTING_TITLE_MAX: 100,
  LISTING_DESCRIPTION_MIN: 10,
  LISTING_DESCRIPTION_MAX: 1000,
  LISTING_PRICE_MIN: 0.01,
  LISTING_PRICE_MAX: 10000,
  LISTING_TAGS_MAX: 10,
  LISTING_TAG_LENGTH_MAX: 20,
  LISTING_IMAGES_MAX: 10,
  LISTING_HOURS_WORN_MAX: 168, // One week
  
  // Messages
  MESSAGE_LENGTH_MAX: 1000,
  
  // Wallet
  WITHDRAWAL_MIN: 20,
  WITHDRAWAL_MAX: 10000,
  DEPOSIT_MIN: 1,
  DEPOSIT_MAX: 5000,
  BALANCE_MAX: 1000000,
  
  // Files
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB in bytes
  
  // Gallery
  GALLERY_IMAGES_MAX: 20,
  GALLERY_IMAGE_SIZE_MB: 10,
  GALLERY_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB in bytes
  
  // Profile
  BIO_MIN: 0,
  BIO_MAX: 500,
  PROFILE_PIC_SIZE_MB: 5,
  PROFILE_PIC_SIZE_BYTES: 5 * 1024 * 1024, // 5MB in bytes
  
  // Subscription
  SUBSCRIPTION_PRICE_MIN: 0.01,
  SUBSCRIPTION_PRICE_MAX: 999.99,
  
  // Custom request
  CUSTOM_REQUEST_TITLE_MAX: 100,
  CUSTOM_REQUEST_MESSAGE_MAX: 500,
  
  // Verification
  VERIFICATION_CODE_LENGTH: 20,
  VERIFICATION_DOCS_MAX: 4, // codePhoto, idFront, idBack, passport
  
  // Reviews
  REVIEW_COMMENT_MIN: 10,
  REVIEW_COMMENT_MAX: 500,
  REVIEW_RATING_MIN: 1,
  REVIEW_RATING_MAX: 5,
  
  // Tips
  TIP_MIN: 0.01,
  TIP_MAX: 9999.99,
  
  // Ban
  BAN_REASON_MIN: 10,
  BAN_REASON_MAX: 500,
  BAN_DURATION_MAX_DAYS: 365
};

// Allowed file types
const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  GALLERY: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  PROFILE_PIC: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  VERIFICATION: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/pdf']
};

// File extensions
const ALLOWED_EXTENSIONS = {
  IMAGES: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  GALLERY: ['jpg', 'jpeg', 'png', 'webp'],
  PROFILE_PIC: ['jpg', 'jpeg', 'png', 'webp'],
  VERIFICATION: ['jpg', 'jpeg', 'png', 'webp', 'pdf']
};

// Platform settings
const PLATFORM = {
  FEE_PERCENTAGE: 10, // 10% platform fee
  TIER_CREDIT_PERCENTAGE: 10, // 10% of marked up price difference
  DEFAULT_SUBSCRIPTION_PRICE: 9.99,
  DEFAULT_TIER: 'Tease',
  DEFAULT_CURRENCY: 'USD',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_TIMEZONE: 'UTC'
};

// Rate limiting (requests per time window)
const RATE_LIMITS = {
  GENERAL: { requests: 100, window: 60 * 1000 }, // 100 per minute
  AUTH: { requests: 10, window: 60 * 60 * 1000 }, // 10 per hour
  MESSAGE_SEND: { requests: 30, window: 60 * 1000 }, // 30 per minute
  WALLET: { requests: 20, window: 60 * 60 * 1000 }, // 20 per hour
  VIEW_COUNT: { requests: 1, window: 60 * 60 * 1000 }, // 1 per hour per IP
  PROFILE_UPDATE: { requests: 10, window: 60 * 60 * 1000 }, // 10 per hour
  GALLERY_UPDATE: { requests: 20, window: 60 * 60 * 1000 }, // 20 per hour
  IMAGE_UPLOAD: { requests: 50, window: 60 * 60 * 1000 }, // 50 per hour
  VERIFICATION_REQUEST: { requests: 3, window: 24 * 60 * 60 * 1000 }, // 3 per day
  BAN_USER: { requests: 50, window: 60 * 60 * 1000 }, // 50 per hour
  REPORT_ACTION: { requests: 30, window: 60 * 60 * 1000 } // 30 per hour
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

// Cache TTL (Time To Live) in milliseconds
const CACHE_TTL = {
  USER: 5 * 60 * 1000, // 5 minutes
  PROFILE: 3 * 60 * 1000, // 3 minutes
  GALLERY: 5 * 60 * 1000, // 5 minutes
  LISTINGS: 60 * 1000, // 1 minute
  SUBSCRIPTION: 60 * 1000, // 1 minute
  REVIEWS: 2 * 60 * 1000, // 2 minutes
  TIER_INFO: 10 * 60 * 1000 // 10 minutes
};

// Activity types for tracking
const ACTIVITY_TYPES = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  PROFILE_UPDATE: 'profile_update',
  GALLERY_UPDATE: 'gallery_update',
  LISTING_CREATED: 'listing_created',
  LISTING_UPDATED: 'listing_updated',
  ORDER_PLACED: 'order_placed',
  ORDER_FULFILLED: 'order_fulfilled',
  MESSAGE_SENT: 'message_sent',
  REVIEW_POSTED: 'review_posted',
  TIP_SENT: 'tip_sent',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  VERIFICATION_REQUESTED: 'verification_requested',
  VERIFICATION_APPROVED: 'verification_approved',
  USER_BANNED: 'user_banned',
  USER_UNBANNED: 'user_unbanned'
};

// Sort options
const SORT_OPTIONS = {
  USERNAME: 'username',
  JOIN_DATE: 'joinDate',
  RATING: 'rating',
  SALES: 'sales',
  LAST_ACTIVE: 'lastActive',
  PRICE_LOW_TO_HIGH: 'price_asc',
  PRICE_HIGH_TO_LOW: 'price_desc',
  NEWEST: 'newest',
  OLDEST: 'oldest',
  POPULAR: 'popular'
};

// Sort orders
const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc'
};

// Export all constants
module.exports = {
  ERROR_CODES,
  ORDER_STATUS,
  USER_ROLES,
  SELLER_TIERS,
  TIER_LEVELS,
  VERIFICATION_STATUS,
  LISTING_STATUS,
  MESSAGE_TYPES,
  TRANSACTION_TYPES,
  GALLERY_ACTIONS,
  LIMITS,
  ALLOWED_FILE_TYPES,
  ALLOWED_EXTENSIONS,
  PLATFORM,
  RATE_LIMITS,
  PAGINATION,
  CACHE_TTL,
  ACTIVITY_TYPES,
  SORT_OPTIONS,
  SORT_ORDERS
};