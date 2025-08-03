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
  version: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
  url: getEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  environment: getEnvironment(),
} as const;

// API configuration
export const apiConfig = {
  baseUrl: getEnvVar('NEXT_PUBLIC_API_BASE_URL', ''),
  timeout: getEnvNumber('NEXT_PUBLIC_API_TIMEOUT', 30000),
  retryAttempts: getEnvNumber('NEXT_PUBLIC_API_RETRY_ATTEMPTS', 3),
  
  // Feature flags for gradual backend migration
  features: {
    useAuth: getEnvBool('NEXT_PUBLIC_USE_API_AUTH'),
    useListings: getEnvBool('NEXT_PUBLIC_USE_API_LISTINGS'),
    useOrders: getEnvBool('NEXT_PUBLIC_USE_API_ORDERS'),
    useMessages: getEnvBool('NEXT_PUBLIC_USE_API_MESSAGES'),
    useWallet: getEnvBool('NEXT_PUBLIC_USE_API_WALLET'),
    useUsers: getEnvBool('NEXT_PUBLIC_USE_API_USERS'),
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
  cloudName: getEnvVar('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', ''),
  uploadPreset: getEnvVar('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', ''),
  apiKey: getEnvVar('NEXT_PUBLIC_CLOUDINARY_API_KEY', ''),
} as const;

// Security configuration
export const securityConfig = {
  enableSecurityHeaders: getEnvBool('NEXT_PUBLIC_ENABLE_SECURITY_HEADERS', isProduction()),
  enableRateLimiting: getEnvBool('NEXT_PUBLIC_ENABLE_RATE_LIMITING', isProduction()),
  maxRequestsPerMinute: getEnvNumber('NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE', 60),
} as const;

// Analytics configuration
export const analyticsConfig = {
  enabled: getEnvBool('NEXT_PUBLIC_ENABLE_ANALYTICS', isProduction()),
  analyticsId: getEnvVar('NEXT_PUBLIC_ANALYTICS_ID', ''),
} as const;

// Error reporting configuration
export const errorReportingConfig = {
  enabled: getEnvBool('NEXT_PUBLIC_ENABLE_ERROR_REPORTING', !isDevelopment()),
  sentryDsn: getEnvVar('NEXT_PUBLIC_SENTRY_DSN', ''),
} as const;

// Feature toggles
export const features = {
  subscriptions: getEnvBool('NEXT_PUBLIC_ENABLE_SUBSCRIPTIONS', true),
  auctions: getEnvBool('NEXT_PUBLIC_ENABLE_AUCTIONS', true),
  customRequests: getEnvBool('NEXT_PUBLIC_ENABLE_CUSTOM_REQUESTS', true),
  adminPanel: getEnvBool('NEXT_PUBLIC_ENABLE_ADMIN_PANEL', true),
  sellerVerification: getEnvBool('NEXT_PUBLIC_ENABLE_SELLER_VERIFICATION', true),
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
} as const;

// Cache configuration
export const cacheConfig = {
  enabled: getEnvBool('NEXT_PUBLIC_ENABLE_CACHE', true),
  ttlSeconds: getEnvNumber('NEXT_PUBLIC_CACHE_TTL_SECONDS', 300),
} as const;

// Configuration validation
export function validateConfiguration(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate required configurations
  if (!appConfig.url) {
    errors.push('NEXT_PUBLIC_APP_URL is required');
  }

  // Validate API configuration
  if (!apiConfig.features.useMockApi && !apiConfig.baseUrl) {
    errors.push('NEXT_PUBLIC_API_BASE_URL is required when not using mock API');
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
  };
}

// Log configuration in development
if (isDevelopment() && typeof window !== 'undefined') {
  console.log('[Environment] Current configuration:', getAllConfig());
  
  const validation = validateConfiguration();
  if (!validation.valid) {
    console.warn('[Environment] Configuration validation errors:', validation.errors);
  }
}
