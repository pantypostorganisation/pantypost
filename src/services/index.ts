// src/services/index.ts

/**
 * Central service exports
 * Import services from here throughout the application
 */

// Storage service - foundation for all data persistence
export { storageService } from './storage.service';

// Auth service - authentication and authorization
export { authService } from './auth.service';

// Users service - user management and profiles
export { usersService } from './users.service';

// Wallet service - financial operations
export { walletService } from './wallet.service';

// Listings service - marketplace listings
export { listingsService } from './listings.service';

// Orders service - order management
export { ordersService } from './orders.service';

// Messages service - messaging functionality
export { messagesService } from './messages.service';

// Security service - validation, sanitization, and security features
export { securityService, sanitize } from './security.service';

// App initializer - application startup
export { appInitializer } from './app-initializer';

// Re-export validation schemas for easy access
export * as validationSchemas from '@/utils/validation/schemas';

// Re-export security utilities
export { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
export { CSRFTokenManager } from '@/utils/security/validation';

// Re-export types that actually exist
export type { 
  ApiResponse, 
  ApiError
} from './api.config';

export type {
  CreateListingRequest,
  UpdateListingRequest,
  ListingSearchParams,
  ListingViewUpdate,
  BulkUpdateRequest,
  PopularTag
} from './listings.service';

export type {
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  OrderSearchParams,
  DeliveryAddress
} from './orders.service';

export type {
  LoginRequest,
  SignupRequest,
  AuthResponse
} from './auth.service';

export type {
  Transaction,
  WithdrawalRequest
} from './wallet.service';

export type {
  UserProfile,
  UserSearchParams,
  VerificationUpdateRequest,
  BanRequest
} from './users.service';

// Messages service types
export type { 
  Message, 
  MessageThread, 
  SendMessageRequest, 
  BlockUserRequest, 
  ReportUserRequest,
  MessageNotification,
  CustomRequestData,
  MessageAttachment
} from './messages.service';

// Export order types from WalletContext
export type { Order, CustomRequestPurchase, DepositLog } from '@/context/WalletContext';

// Export feature flags for conditional logic
export { FEATURES } from './api.config';