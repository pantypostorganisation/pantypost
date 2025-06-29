// src/services/index.ts

/**
 * Central export point for all services
 * This makes it easy to import services throughout the app
 */

// Export all service instances
export { authService } from './auth.service';
export { listingsService } from './listings.service';
export { messagesService } from './messages.service';
export { ordersService } from './orders.service';
export { storageService } from './storage.service';
export { usersService } from './users.service';
export { walletService } from './wallet.service';

// Export types from services
export type {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  UsernameCheckResponse,
} from './auth.service';

export type {
  CreateListingRequest,
  UpdateListingRequest,
  ListingSearchParams,
  ListingViewUpdate,
} from './listings.service';

export type {
  Message,
  MessageThread,
  SendMessageRequest,
  BlockUserRequest,
  ReportUserRequest,
} from './messages.service';

export type {
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  OrderSearchParams,
} from './orders.service';

export type {
  UserProfile,
  UpdateProfileRequest,
  VerificationRequest,
  VerificationUpdateRequest,
  UserSearchParams,
  BanRequest,
} from './users.service';

export type {
  WalletBalance,
  Transaction,
  DepositRequest,
  WithdrawalRequest,
  TransferRequest,
  AdminActionRequest,
} from './wallet.service';

// Export API configuration
export {
  API_BASE_URL,
  FEATURES,
  API_ENDPOINTS,
  REQUEST_CONFIG,
  buildApiUrl,
  type ApiError,
  type ApiResponse,
} from './api.config';