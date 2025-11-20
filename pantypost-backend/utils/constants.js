// pantypost-backend/utils/constants.js
// This file contains all the constants used throughout the API
// Based on your API specification document

// Error codes from your API spec
const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
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
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
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

// Seller tiers
const SELLER_TIERS = {
  TEASE: 'Tease',
  TEMPT: 'Tempt',
  INDULGE: 'Indulge',
  CRAVE: 'Crave'
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
  
  // Gallery
  GALLERY_IMAGES_MAX: 20,
  
  // Bio
  BIO_MAX: 500,
  
  // Custom request
  CUSTOM_REQUEST_TITLE_MAX: 100,
  CUSTOM_REQUEST_MESSAGE_MAX: 500
};

// Platform settings
const PLATFORM = {
  FEE_PERCENTAGE: 10, // 10% platform fee
  TIER_CREDIT_PERCENTAGE: 10, // 10% of marked up price difference
};

// Rate limiting (requests per time window)
const RATE_LIMITS = {
  GENERAL: { requests: 100, window: 60 * 1000 }, // 100 per minute
  AUTH: { requests: 10, window: 60 * 60 * 1000 }, // 10 per hour
  MESSAGE_SEND: { requests: 30, window: 60 * 1000 }, // 30 per minute
  WALLET: { requests: 20, window: 60 * 60 * 1000 }, // 20 per hour
  VIEW_COUNT: { requests: 1, window: 60 * 60 * 1000 } // 1 per hour per IP
};

// Export all constants
module.exports = {
  ERROR_CODES,
  ORDER_STATUS,
  USER_ROLES,
  SELLER_TIERS,
  LISTING_STATUS,
  MESSAGE_TYPES,
  TRANSACTION_TYPES,
  LIMITS,
  PLATFORM,
  RATE_LIMITS
};