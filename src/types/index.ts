// src/types/index.ts

/**
 * Central type exports
 * Import types from here throughout the application
 */

// Ban types
export type {
  BanType,
  BanReason,
  AppealStatus,
  BanEntry,
  // BanHistory - REMOVED as it doesn't exist
  BanHistoryEntry,
  AppealReview,
  IPBan,
  BanStats,
} from './ban';

// Browse types - Fix naming conflicts by renaming
export type {
  HourRangeOption,
  CategoryCounts,
  DisplayPrice,
  ListingWithProfile,
  BrowseHeaderProps,
  BrowseFiltersProps,
  ListingGridProps,
  PaginationControlsProps,
  // Rename conflicting exports
  FilterOptions as BrowseFilterOptions,
  SellerProfile as BrowseSellerProfile,
  ListingCardProps as BrowseListingCardProps,
  EmptyStateProps as BrowseEmptyStateProps,
} from './browse';

// Browse detail types
export type {
  BidStatus,
  BidHistoryItem,
  DetailState,
  ListingWithDetails,
  DetailHeaderProps,
  ImageGalleryProps,
  ProductInfoProps,
  AuctionSectionProps,
  PurchaseSectionProps,
  SellerProfileProps,
  TrustBadgesProps,
  BidHistoryModalProps,
  AuctionEndedModalProps,
  PurchaseSuccessModalProps,
  StickyPurchaseBarProps,
  PremiumLockMessageProps,
  SellerProfile as BrowseDetailSellerProfile,
} from './browseDetail';

// Dashboard types
export type {
  DashboardStats,
  RecentActivity,
  DashboardHeaderProps,
  StatsGridProps,
  QuickActionsProps,
  RecentActivityProps,
  SubscribedSellersProps,
  FeaturedListingsProps,
  SubscriptionInfo as DashboardSubscriptionInfo,
} from './dashboard';

// Login types
export type {
  LoginState,
  RoleOption,
  ParticleProps,
  ParticleColor,
  FloatingParticleProps,
  LoginHeaderProps,
  UsernameStepProps,
  RoleSelectionStepProps,
  AdminCrownButtonProps,
  LoginFooterProps,
  TrustIndicatorsProps,
} from './login';

// Message types
export type {
  MessageType,
  MessageStats,
  MessageThread,
  Message as AdminMessage,
  UserProfile as MessageUserProfile,
} from './message';

// MyListings types
export type {
  ListingFormState,
  EditingState,
  ListingAnalytics,
  StatsCardProps,
  ListingFormProps,
  ListingLimitMessageProps,
  VerificationBannerProps,
  TipsCardProps,
  RecentSalesProps,
  ListingCardProps as MyListingsCardProps,
} from './myListings';

// Resolved types
export type {
  ResolvedReport,
  ResolvedStats,
  ResolvedHeaderProps,
  ResolvedStatsProps,
  ResolvedFiltersProps,
  ResolvedListProps,
  ResolvedEntryProps,
  BulkActionsProps,
  RestoreModalProps,
  FilterOptions as ResolvedFilterOptions,
  Message as ResolvedMessage,
} from './resolved';

// Signup types
export type {
  SignupFormData,
  FormErrors,
  SignupState,
  SignupHeaderProps,
  UsernameFieldProps,
  EmailFieldProps,
  PasswordFieldProps,
  CountryFieldProps,
  RoleSelectorProps,
  TermsCheckboxesProps,
  SignupFooterProps,
  PasswordStrengthProps,
  UserRole as SignupUserRole,
} from './signup';

// Terms types
export type {
  TermsSection,
  SectionContent,
  ExpandedSectionsState,
} from './terms';

// Users types
export type {
  SellerTier,
  UserPreferences,
  ProfileCompleteness,
  SocialLinks,
  UserStats,
  UserActivity,
  UserSearchParams,
  VerificationRequest,
  VerificationUpdateRequest,
  BanDetails,
  BanRequest,
  BatchUserUpdate,
  CachedUser,
  CachedUserProfile,
  UserErrorCode,
  UserError,
  UsersResponse,
  ProfileResponse,
  UserRole as UsersUserRole,
  VerificationStatus as UsersVerificationStatus,
  UserProfile as UsersUserProfile,
  SubscriptionInfo as UsersSubscriptionInfo,
  BatchOperationResult as UsersBatchOperationResult,
} from './users';

// Export functions separately (not types)
export {
  isValidUsername,
  isValidBio,
  isValidSubscriptionPrice,
  calculateProfileCompleteness,
} from './users';

// Verification types
export type {
  VerificationDocs,
  VerificationUser,
  ImageViewData,
  VerificationStats,
  SortOption,
  VerificationHeaderProps,
  VerificationSearchProps,
  VerificationStatsProps,
  VerificationListProps,
  VerificationCardProps,
  DocumentCardProps,
  ReviewModalProps,
  ImageViewerProps,
  ActionButtonsProps,
} from './verification';

// Wallet types
export type {
} from './wallet';

// Export shared types with proper syntax
export type * from './api';
export type * from './forms';
export type * from './common';
export type * from './guards';
export type * from './type-utils';
