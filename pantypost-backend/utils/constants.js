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

/* ====================================================================
   PLANNED FEES AND PAYOUT SCHEDULE -- NOT YET IMPLEMENTED
   Decided 2 September 2026. Nothing here is wired up; this block
   exists so the numbers and the reasoning behind them survive until
   the payments work is done.

   -------------------------------------------------------------------
   1. DEPOSIT FEE -- 5%
   -------------------------------------------------------------------
   Charged when a buyer funds their wallet, matching what FeetFinder
   does. Note this stacks with the existing 10% checkout markup, so a
   buyer funding $100 receives $95 of balance and then pays the markup
   on top when they buy. Effective buyer cost lands around 15%, which
   is at the upper end of what buyers tolerate before they notice.
   Revisit if deposit-to-purchase conversion drops.

   ** BLOCKING QUESTION FOR SEGPAY **
   Do NOT implement this until Segpay confirm whether they already
   apply a processing fee to the buyer at deposit. If they do, charging
   ours on top would double-charge the buyer for the same transaction.
   Ask: "Is the 7.5% charged entirely to us as the merchant, or is any
   portion passed to the buyer at checkout?"

   -------------------------------------------------------------------
   2. SELLER PAYOUT SCHEDULE
   -------------------------------------------------------------------
   Automatic payouts run FORTNIGHTLY by default. Sellers may nominate
   weekly or monthly instead.

   Fortnightly rather than monthly because the competition (OnlyFans,
   FeetFinder) pays weekly, and being both newer and slower to pay is a
   hard sell to a seller deciding where to list. Fortnightly is the
   compromise: frequent enough not to be a disadvantage, infrequent
   enough to keep transfer costs sane.

   Payout cost per seller, for reference (Paxum, Aug 2026 schedule):
     Paxum-to-Paxum ....... $1.00 flat
     Local bank transfer .. 1%, min $5.00
     International wire ... 1%, min $50.00
   The gap is the reason to push sellers toward Paxum accounts: the
   same payment costs $1 or $50 depending purely on the method.

   -------------------------------------------------------------------
   3. OFF-SCHEDULE WITHDRAWALS
   -------------------------------------------------------------------
   A seller can request a payout at any time outside their schedule:
     Minimum ....... $50
     Fee ........... $2, taken from wallet balance

   The $50 floor keeps the fee proportionate -- $2 on a $20 withdrawal
   is a 10% charge and reads as punitive. The fee covers the transfer
   cost rather than making money.
   ==================================================================== */
const PLANNED_FEES = {
  DEPOSIT_FEE_PERCENTAGE: 5,
  PAYOUT_SCHEDULE_DEFAULT: 'fortnightly',
  PAYOUT_SCHEDULE_OPTIONS: ['weekly', 'fortnightly', 'monthly'],
  OFF_SCHEDULE_WITHDRAWAL_MIN: 50,
  OFF_SCHEDULE_WITHDRAWAL_FEE: 2,
  IMPLEMENTED: false
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
  PLANNED_FEES,
  RATE_LIMITS
};
