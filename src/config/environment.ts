// src/config/environment.ts

/**
 * Environment Configuration Module
 * Centralizes all environment-specific settings with type safety
 */

// Environment types
export type Environment = 'development' | 'staging' | 'production';

// Get current environment with fallback
export const getEnvironment = (): Environment => {
  const env = process.env.NODE_ENV;
  
  // Check if we're in staging by looking at the APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  if (appUrl.includes('staging')) return 'staging';
  
  // Otherwise use NODE_ENV
  if (env === 'production') return 'production';
  return 'development';
};

// Environment checks
export const isDevelopment = () => getEnvironment() === 'development';
export const isStaging = () => getEnvironment() === 'staging';
export const isProduction = () => getEnvironment() === 'production';

// Export environment constants for compatibility
export const ENV = getEnvironment();
export const IS_PRODUCTION = isProduction();
export const IS_DEVELOPMENT = isDevelopment();
export const IS_TEST = process.env.NODE_ENV === 'test';

// Type-safe environment variable getter
function getEnvVar(key: string, defaultValue?: string): string {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env[key] || defaultValue || '';
  }
  // Client-side - only NEXT_PUBLIC_ variables
  return (process.env[key] || defaultValue || '');
}

// Boolean environment variable getter
function getEnvBool(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Number environment variable getter
function getEnvNumber(key: string, defaultValue: number): number {
  const value = getEnvVar(key);
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

// Application configuration
export const appConfig = {
  name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'PantyPost'),
  version: getEnvVar('NEXT_PUBLIC_APP_VERSION', '2.0.0'),
  description: 'Premium marketplace for intimate apparel',
  url: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  environment: getEnvironment(),
  supportEmail: 'support@pantypost.com',
  contactEmail: 'contact@pantypost.com',
  social: {
    twitter: '@pantypost',
    instagram: '@pantypost',
    tiktok: '@pantypost',
  },
} as const;

// API configuration
export const apiConfig = {
  baseUrl: getEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:5000/api'),
  timeout: getEnvNumber('NEXT_PUBLIC_API_TIMEOUT', 30000),
  retryAttempts: getEnvNumber('NEXT_PUBLIC_API_RETRY_ATTEMPTS', 3),
  retryDelay: 1000,
  
  // Feature flags for gradual backend migration
  features: {
    useAuth: getEnvBool('NEXT_PUBLIC_USE_API_AUTH', true),
    useListings: getEnvBool('NEXT_PUBLIC_USE_API_LISTINGS', true),
    useOrders: getEnvBool('NEXT_PUBLIC_USE_API_ORDERS', true),
    useMessages: getEnvBool('NEXT_PUBLIC_USE_API_MESSAGES', true),
    useWallet: getEnvBool('NEXT_PUBLIC_USE_API_WALLET', true),
    useUsers: getEnvBool('NEXT_PUBLIC_USE_API_USERS', true),
    useMockApi: getEnvBool('NEXT_PUBLIC_USE_MOCK_API', false),
  },
} as const;

// Mock API configuration
export const mockConfig = {
  scenario: getEnvVar('NEXT_PUBLIC_MOCK_SCENARIO', 'REALISTIC'),
  logRequests: getEnvBool('NEXT_PUBLIC_MOCK_LOG_REQUESTS', isDevelopment()),
  persistState: getEnvBool('NEXT_PUBLIC_MOCK_PERSIST_STATE', true),
  seedData: getEnvBool('NEXT_PUBLIC_MOCK_SEED_DATA', true),
} as const;

// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: getEnvVar('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'dkb1nvu8g'),
  uploadPreset: getEnvVar('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'pantypost'),
  apiKey: getEnvVar('NEXT_PUBLIC_CLOUDINARY_API_KEY', ''),
  apiSecret: getEnvVar('CLOUDINARY_API_SECRET', ''),
  folders: {
    profiles: 'pantypost/profiles',
    listings: 'pantypost/listings',
    verification: 'pantypost/verification',
    messages: 'pantypost/messages',
    reviews: 'pantypost/reviews',
  },
  transformations: {
    thumbnail: 'c_thumb,w_150,h_150',
    profile: 'c_fill,w_200,h_200',
    listing: 'c_fill,w_400,h_400',
    message: 'c_limit,w_800,h_800',
  },
} as const;

// Security configuration
export const securityConfig = {
  enableSecurityHeaders: getEnvBool('NEXT_PUBLIC_ENABLE_SECURITY_HEADERS', isProduction()),
  enableRateLimiting: getEnvBool('NEXT_PUBLIC_ENABLE_RATE_LIMITING', isProduction()),
  maxRequestsPerMinute: getEnvNumber('NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE', 60),
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  passwordMinLength: 8,
  requireStrongPassword: true,
  csrfEnabled: true,
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },
} as const;

// Analytics configuration
export const analyticsConfig = {
  enabled: getEnvBool('NEXT_PUBLIC_ENABLE_ANALYTICS', isProduction()),
  analyticsId: getEnvVar('NEXT_PUBLIC_ANALYTICS_ID', ''),
  googleAnalyticsId: getEnvVar('NEXT_PUBLIC_GA_ID', ''),
  mixpanelToken: getEnvVar('NEXT_PUBLIC_MIXPANEL_TOKEN', ''),
  hotjarId: getEnvVar('NEXT_PUBLIC_HOTJAR_ID', ''),
  sentryDsn: getEnvVar('NEXT_PUBLIC_SENTRY_DSN', ''),
} as const;

// Error reporting configuration
export const errorReportingConfig = {
  enabled: getEnvBool('NEXT_PUBLIC_ENABLE_ERROR_REPORTING', !isDevelopment()),
  sentryDsn: getEnvVar('NEXT_PUBLIC_SENTRY_DSN', ''),
} as const;

// Feature toggles - Combined old and new features
export const features = {
  subscriptions: getEnvBool('NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS', true),
  auctions: getEnvBool('NEXT_PUBLIC_ENABLE_AUCTIONS', true),
  customRequests: getEnvBool('NEXT_PUBLIC_ENABLE_CUSTOM_REQUESTS', true),
  adminPanel: getEnvBool('NEXT_PUBLIC_ENABLE_ADMIN_PANEL', true),
  sellerVerification: getEnvBool('NEXT_PUBLIC_ENABLE_SELLER_VERIFICATION', true),
  websocket: getEnvBool('NEXT_PUBLIC_ENABLE_WEBSOCKET', true),
  notifications: getEnvBool('NEXT_PUBLIC_ENABLE_NOTIFICATIONS', true),
  pwa: getEnvBool('NEXT_PUBLIC_ENABLE_PWA', true),
  offlineMode: getEnvBool('NEXT_PUBLIC_ENABLE_OFFLINE_MODE', true),
  imageOptimization: getEnvBool('NEXT_PUBLIC_ENABLE_IMAGE_OPTIMIZATION', true),
  lazyLoading: getEnvBool('NEXT_PUBLIC_ENABLE_LAZY_LOADING', true),
  virtualScrolling: getEnvBool('NEXT_PUBLIC_ENABLE_VIRTUAL_SCROLLING', true),
  infiniteScroll: getEnvBool('NEXT_PUBLIC_ENABLE_INFINITE_SCROLL', true),
  tierSystem: getEnvBool('NEXT_PUBLIC_ENABLE_TIER_SYSTEM', true),
  buyerProtection: getEnvBool('NEXT_PUBLIC_ENABLE_BUYER_PROTECTION', true),
  disputeResolution: getEnvBool('NEXT_PUBLIC_ENABLE_DISPUTE_RESOLUTION', true),
  darkMode: getEnvBool('NEXT_PUBLIC_ENABLE_DARK_MODE', true),
  accessibility: getEnvBool('NEXT_PUBLIC_ENABLE_ACCESSIBILITY', true),
  keyboardNavigation: getEnvBool('NEXT_PUBLIC_ENABLE_KEYBOARD_NAVIGATION', true),
  screenReaderSupport: getEnvBool('NEXT_PUBLIC_ENABLE_SCREEN_READER_SUPPORT', true),
  sellerAnalytics: getEnvBool('NEXT_PUBLIC_ENABLE_SELLER_ANALYTICS', true),
  performanceMonitoring: getEnvBool('NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING', isProduction()),
  errorTracking: getEnvBool('NEXT_PUBLIC_ENABLE_ERROR_TRACKING', isProduction()),
  multiLanguage: getEnvBool('NEXT_PUBLIC_ENABLE_MULTI_LANGUAGE', false),
} as const;

// FEATURES constant for backward compatibility
export const FEATURES = {
  USE_API_AUTH: apiConfig.features.useAuth,
  USE_API_LISTINGS: apiConfig.features.useListings,
  USE_API_MESSAGES: apiConfig.features.useMessages,
  USE_API_ORDERS: apiConfig.features.useOrders,
  USE_API_WALLET: apiConfig.features.useWallet,
  USE_API_REVIEWS: true,
  USE_API_SUBSCRIPTIONS: true,
  USE_API_USERS: apiConfig.features.useUsers,
  USE_MOCK_DATA: apiConfig.features.useMockApi,
  ENABLE_WEBSOCKET: features.websocket,
  ENABLE_NOTIFICATIONS: features.notifications,
  ENABLE_ANALYTICS: analyticsConfig.enabled,
  ENABLE_ERROR_TRACKING: features.errorTracking,
  ENABLE_PERFORMANCE_MONITORING: features.performanceMonitoring,
  ENABLE_PWA: features.pwa,
  ENABLE_OFFLINE_MODE: features.offlineMode,
  ENABLE_IMAGE_OPTIMIZATION: features.imageOptimization,
  ENABLE_LAZY_LOADING: features.lazyLoading,
  ENABLE_VIRTUAL_SCROLLING: features.virtualScrolling,
  ENABLE_INFINITE_SCROLL: features.infiniteScroll,
  ENABLE_AUCTION_SYSTEM: features.auctions,
  ENABLE_TIER_SYSTEM: features.tierSystem,
  ENABLE_VERIFICATION: features.sellerVerification,
  ENABLE_ADMIN_PANEL: features.adminPanel,
  ENABLE_SELLER_ANALYTICS: features.sellerAnalytics,
  ENABLE_BUYER_PROTECTION: features.buyerProtection,
  ENABLE_DISPUTE_RESOLUTION: features.disputeResolution,
  ENABLE_MULTI_LANGUAGE: features.multiLanguage,
  ENABLE_DARK_MODE: features.darkMode,
  ENABLE_ACCESSIBILITY: features.accessibility,
  ENABLE_KEYBOARD_NAVIGATION: features.keyboardNavigation,
  ENABLE_SCREEN_READER_SUPPORT: features.screenReaderSupport,
} as const;

// Application limits
export const limits = {
  maxListingImages: getEnvNumber('NEXT_PUBLIC_MAX_LISTING_IMAGES', 10),
  maxGalleryImages: getEnvNumber('NEXT_PUBLIC_MAX_GALLERY_IMAGES', 20),
  maxMessageLength: getEnvNumber('NEXT_PUBLIC_MAX_MESSAGE_LENGTH', 1000),
  maxFileSizeMB: getEnvNumber('NEXT_PUBLIC_MAX_FILE_SIZE_MB', 10),
  minWithdrawalAmount: getEnvNumber('NEXT_PUBLIC_MIN_WITHDRAWAL_AMOUNT', 20),
  platformFeePercentage: getEnvNumber('NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE', 10),
} as const;

// WebSocket configuration
export const websocketConfig = {
  enabled: true, // Force enable WebSocket
  url: getEnvVar('NEXT_PUBLIC_WS_URL', 'ws://localhost:5000'),
  path: getEnvVar('NEXT_PUBLIC_WS_PATH', '/socket.io'),
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  heartbeatInterval: 30000,
} as const;

// Cache configuration
export const cacheConfig = {
  enabled: getEnvBool('NEXT_PUBLIC_ENABLE_CACHE', true),
  ttlSeconds: getEnvNumber('NEXT_PUBLIC_CACHE_TTL_SECONDS', 300),
  ttl: {
    default: 5 * 60 * 1000, // 5 minutes
    user: 10 * 60 * 1000, // 10 minutes
    listing: 2 * 60 * 1000, // 2 minutes
    message: 1 * 60 * 1000, // 1 minute
    order: 5 * 60 * 1000, // 5 minutes
    wallet: 30 * 1000, // 30 seconds
  },
} as const;

// Upload configuration
export const uploadConfig = {
  maxFileSize: limits.maxFileSizeMB * 1024 * 1024,
  maxFiles: 10,
  acceptedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  acceptedVideoTypes: ['video/mp4', 'video/webm'],
  acceptedDocumentTypes: ['application/pdf'],
} as const;

// Pagination configuration
export const paginationConfig = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  maxPageSize: 100,
} as const;

// Notification configuration
export const notificationConfig = {
  enabled: features.notifications,
  sound: true,
  vibrate: true,
  desktop: true,
  email: true,
  sms: false,
  push: true,
} as const;

// Payment configuration
export const paymentConfig = {
  currency: 'USD',
  minimumAmount: 1,
  maximumAmount: 10000,
  platformFee: limits.platformFeePercentage / 100,
  processingFee: 0.03, // 3%
  withdrawalMinimum: limits.minWithdrawalAmount,
  withdrawalMaximum: 5000,
  paymentMethods: ['wallet', 'card', 'paypal'],
} as const;

// Tier configuration
export const tierConfig = {
  enabled: features.tierSystem,
  tiers: {
    'Tease': { minSales: 0, commission: 0.20 },
    'Tempt': { minSales: 10, commission: 0.18 },
    'Seduce': { minSales: 25, commission: 0.15 },
    'Enchant': { minSales: 50, commission: 0.12 },
    'Goddess': { minSales: 100, commission: 0.10 },
  },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Users
  USERS: {
    LIST: '/users',
    GET: '/users/:id',
    UPDATE: '/users/:id',
    DELETE: '/users/:id',
    PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/users/avatar',
    VERIFY_SELLER: '/users/verify-seller',
  },
  
  // Listings
  LISTINGS: {
    LIST: '/listings',
    GET: '/listings/:id',
    CREATE: '/listings',
    UPDATE: '/listings/:id',
    DELETE: '/listings/:id',
    SEARCH: '/listings/search',
    FEATURED: '/listings/featured',
    BY_SELLER: '/listings/seller/:username',
  },
  
  // Messages - FIXED endpoints
  MESSAGES: {
    THREADS: '/messages/threads',
    THREAD: '/messages/threads/:threadId',
    SEND: '/messages/send',
    MARK_READ: '/messages/mark-read',
    BLOCK_USER: '/messages/block',
    UNBLOCK_USER: '/messages/unblock',
    REPORT: '/messages/report',
    UNREAD_COUNT: '/messages/unread-count',
  },
  
  // Orders
  ORDERS: {
    LIST: '/orders',
    GET: '/orders/:id',
    CREATE: '/orders',
    UPDATE_STATUS: '/orders/:id/status',
    CANCEL: '/orders/:id/cancel',
    DISPUTE: '/orders/:id/dispute',
  },
  
  // Wallet
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/wallet/transactions',
    DEPOSIT: '/wallet/deposit',
    WITHDRAW: '/wallet/withdraw',
    TRANSFER: '/wallet/transfer',
  },
  
  // Reviews
  REVIEWS: {
    LIST: '/reviews',
    GET: '/reviews/:id',
    CREATE: '/reviews',
    UPDATE: '/reviews/:id',
    DELETE: '/reviews/:id',
    BY_LISTING: '/reviews/listing/:listingId',
    BY_SELLER: '/reviews/seller/:username',
  },
  
  // Subscriptions
  SUBSCRIPTIONS: {
    LIST: '/subscriptions',
    GET: '/subscriptions/:id',
    CREATE: '/subscriptions',
    CANCEL: '/subscriptions/:id/cancel',
    REACTIVATE: '/subscriptions/:id/reactivate',
  },
  
  // Upload
  UPLOAD: {
    IMAGE: '/upload/image',
    VIDEO: '/upload/video',
    DOCUMENT: '/upload/document',
    DELETE: '/upload/delete',
  },
  
  // Tiers
  TIERS: {
    INFO: '/tiers/info',
    UPDATE: '/tiers/update',
    STATS: '/tiers/stats',
  },
};

// Build API URL helper
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = endpoint;
  
  // Replace path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, value);
    });
  }
  
  // Prepend base URL if not already included
  if (!url.startsWith('http')) {
    url = `${apiConfig.baseUrl}${url}`;
  }
  
  return url;
};

// Configuration validation
export function validateConfiguration(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required configurations
  if (!appConfig.url) {
    errors.push('NEXT_PUBLIC_APP_URL is required');
  }

  // Validate API configuration
  if (!apiConfig.features.useMockApi && !apiConfig.baseUrl) {
    errors.push('NEXT_PUBLIC_API_URL is required when not using mock API');
  }

  // Validate Cloudinary in production
  if (isProduction() && (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset)) {
    errors.push('Cloudinary configuration is required in production');
  }

  // Validate monitoring in production
  if (isProduction() && errorReportingConfig.enabled && !errorReportingConfig.sentryDsn) {
    errors.push('Sentry DSN is required when error reporting is enabled');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Environment validation - backward compatibility
export const validateEnvironment = (): void => {
  const validation = validateConfiguration();
  if (!validation.valid && isProduction()) {
    console.warn('[Environment] Configuration validation errors:', validation.errors);
  }
};

// Export a function to get all configuration for debugging
export function getAllConfig() {
  return {
    app: appConfig,
    api: apiConfig,
    mock: mockConfig,
    cloudinary: cloudinaryConfig,
    security: securityConfig,
    analytics: analyticsConfig,
    errorReporting: errorReportingConfig,
    features,
    limits,
    websocket: websocketConfig,
    cache: cacheConfig,
    upload: uploadConfig,
    pagination: paginationConfig,
    notification: notificationConfig,
    payment: paymentConfig,
    tier: tierConfig,
  };
}

// Log configuration in development
if (isDevelopment() && typeof window !== 'undefined') {
  console.log('[Environment] Current configuration:', getAllConfig());
  console.log('[Environment] API Base URL:', apiConfig.baseUrl);
  
  const validation = validateConfiguration();
  if (!validation.valid) {
    console.warn('[Environment] Configuration validation errors:', validation.errors);
  }
}

// Initialize environment validation
if (typeof window !== 'undefined') {
  validateEnvironment();
}