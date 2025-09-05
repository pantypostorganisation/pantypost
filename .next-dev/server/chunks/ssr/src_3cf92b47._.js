module.exports = {

"[project]/src/config/environment.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/config/environment.ts
/**
 * Environment Configuration Module
 * Centralizes all environment-specific settings with type safety
 */ // Environment types
__turbopack_context__.s({
    "API_ENDPOINTS": ()=>API_ENDPOINTS,
    "ENV": ()=>ENV,
    "FEATURES": ()=>FEATURES,
    "IS_DEVELOPMENT": ()=>IS_DEVELOPMENT,
    "IS_PRODUCTION": ()=>IS_PRODUCTION,
    "IS_TEST": ()=>IS_TEST,
    "analyticsConfig": ()=>analyticsConfig,
    "apiConfig": ()=>apiConfig,
    "appConfig": ()=>appConfig,
    "buildApiUrl": ()=>buildApiUrl,
    "cacheConfig": ()=>cacheConfig,
    "cloudinaryConfig": ()=>cloudinaryConfig,
    "debugConfig": ()=>debugConfig,
    "errorReportingConfig": ()=>errorReportingConfig,
    "features": ()=>features,
    "getAllConfig": ()=>getAllConfig,
    "getEnvironment": ()=>getEnvironment,
    "isDevelopment": ()=>isDevelopment,
    "isProduction": ()=>isProduction,
    "isStaging": ()=>isStaging,
    "limits": ()=>limits,
    "mockConfig": ()=>mockConfig,
    "notificationConfig": ()=>notificationConfig,
    "paginationConfig": ()=>paginationConfig,
    "paymentConfig": ()=>paymentConfig,
    "performanceConfig": ()=>performanceConfig,
    "securityConfig": ()=>securityConfig,
    "tierConfig": ()=>tierConfig,
    "uploadConfig": ()=>uploadConfig,
    "validateConfiguration": ()=>validateConfiguration,
    "validateEnvironment": ()=>validateEnvironment,
    "websocketConfig": ()=>websocketConfig
});
const getEnvironment = ()=>{
    const env = ("TURBOPACK compile-time value", "development");
    // Check if we're in staging by looking at the APP_URL
    const appUrl = ("TURBOPACK compile-time value", "http://localhost:3000") || '';
    if (appUrl.includes('staging')) return 'staging';
    // Otherwise use NODE_ENV
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return 'development';
};
const isDevelopment = ()=>getEnvironment() === 'development';
const isStaging = ()=>getEnvironment() === 'staging';
const isProduction = ()=>getEnvironment() === 'production';
const ENV = getEnvironment();
const IS_PRODUCTION = isProduction();
const IS_DEVELOPMENT = isDevelopment();
const IS_TEST = ("TURBOPACK compile-time value", "development") === 'test';
// Type-safe environment variable getter
function getEnvVar(key, defaultValue) {
    if ("TURBOPACK compile-time truthy", 1) {
        // Server-side
        return process.env[key] || defaultValue || '';
    }
    //TURBOPACK unreachable
    ;
}
// Boolean environment variable getter
function getEnvBool(key, defaultValue = false) {
    const value = getEnvVar(key);
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
}
// Number environment variable getter
function getEnvNumber(key, defaultValue) {
    const value = getEnvVar(key);
    if (!value) return defaultValue;
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
}
const debugConfig = {
    enabled: getEnvBool('NEXT_PUBLIC_DEBUG', isDevelopment()),
    logWebSocket: getEnvBool('NEXT_PUBLIC_DEBUG_WEBSOCKET', false),
    logWallet: getEnvBool('NEXT_PUBLIC_DEBUG_WALLET', false),
    logApi: getEnvBool('NEXT_PUBLIC_DEBUG_API', false),
    logAuth: getEnvBool('NEXT_PUBLIC_DEBUG_AUTH', false),
    verboseErrors: getEnvBool('NEXT_PUBLIC_VERBOSE_ERRORS', isDevelopment())
};
const appConfig = {
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
        tiktok: '@pantypost'
    }
};
const apiConfig = {
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
        useMockApi: getEnvBool('NEXT_PUBLIC_USE_MOCK_API', false)
    }
};
const mockConfig = {
    scenario: getEnvVar('NEXT_PUBLIC_MOCK_SCENARIO', 'REALISTIC'),
    logRequests: getEnvBool('NEXT_PUBLIC_MOCK_LOG_REQUESTS', isDevelopment()),
    persistState: getEnvBool('NEXT_PUBLIC_MOCK_PERSIST_STATE', true),
    seedData: getEnvBool('NEXT_PUBLIC_MOCK_SEED_DATA', true)
};
const cloudinaryConfig = {
    cloudName: getEnvVar('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'dkb1nvu8g'),
    uploadPreset: getEnvVar('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'pantypost'),
    apiKey: getEnvVar('NEXT_PUBLIC_CLOUDINARY_API_KEY', ''),
    apiSecret: getEnvVar('CLOUDINARY_API_SECRET', ''),
    folders: {
        profiles: 'pantypost/profiles',
        listings: 'pantypost/listings',
        verification: 'pantypost/verification',
        messages: 'pantypost/messages',
        reviews: 'pantypost/reviews'
    },
    transformations: {
        thumbnail: 'c_thumb,w_150,h_150',
        profile: 'c_fill,w_200,h_200',
        listing: 'c_fill,w_400,h_400',
        message: 'c_limit,w_800,h_800'
    }
};
const securityConfig = {
    enableSecurityHeaders: getEnvBool('NEXT_PUBLIC_ENABLE_SECURITY_HEADERS', isProduction()),
    enableRateLimiting: getEnvBool('NEXT_PUBLIC_ENABLE_RATE_LIMITING', isProduction()),
    maxRequestsPerMinute: getEnvNumber('NEXT_PUBLIC_MAX_REQUESTS_PER_MINUTE', 60),
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,
    sessionTimeout: 24 * 60 * 60 * 1000,
    passwordMinLength: 8,
    requireStrongPassword: true,
    csrfEnabled: true,
    rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000,
        maxRequests: 100
    }
};
const analyticsConfig = {
    enabled: getEnvBool('NEXT_PUBLIC_ENABLE_ANALYTICS', isProduction()),
    analyticsId: getEnvVar('NEXT_PUBLIC_ANALYTICS_ID', ''),
    googleAnalyticsId: getEnvVar('NEXT_PUBLIC_GA_ID', ''),
    mixpanelToken: getEnvVar('NEXT_PUBLIC_MIXPANEL_TOKEN', ''),
    hotjarId: getEnvVar('NEXT_PUBLIC_HOTJAR_ID', ''),
    sentryDsn: getEnvVar('NEXT_PUBLIC_SENTRY_DSN', '')
};
const errorReportingConfig = {
    enabled: getEnvBool('NEXT_PUBLIC_ENABLE_ERROR_REPORTING', !isDevelopment()),
    sentryDsn: getEnvVar('NEXT_PUBLIC_SENTRY_DSN', '')
};
const features = {
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
    multiLanguage: getEnvBool('NEXT_PUBLIC_ENABLE_MULTI_LANGUAGE', false)
};
const FEATURES = {
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
    ENABLE_SCREEN_READER_SUPPORT: features.screenReaderSupport
};
const limits = {
    maxListingImages: getEnvNumber('NEXT_PUBLIC_MAX_LISTING_IMAGES', 10),
    maxGalleryImages: getEnvNumber('NEXT_PUBLIC_MAX_GALLERY_IMAGES', 20),
    maxMessageLength: getEnvNumber('NEXT_PUBLIC_MAX_MESSAGE_LENGTH', 1000),
    maxFileSizeMB: getEnvNumber('NEXT_PUBLIC_MAX_FILE_SIZE_MB', 10),
    minWithdrawalAmount: getEnvNumber('NEXT_PUBLIC_MIN_WITHDRAWAL_AMOUNT', 20),
    platformFeePercentage: getEnvNumber('NEXT_PUBLIC_PLATFORM_FEE_PERCENTAGE', 10)
};
const websocketConfig = {
    enabled: true,
    url: getEnvVar('NEXT_PUBLIC_WS_URL', 'ws://localhost:5000'),
    path: getEnvVar('NEXT_PUBLIC_WS_PATH', '/socket.io'),
    reconnectAttempts: 5,
    reconnectInterval: 3000,
    heartbeatInterval: 30000,
    debug: getEnvBool('NEXT_PUBLIC_DEBUG_WEBSOCKET', false)
};
const cacheConfig = {
    enabled: getEnvBool('NEXT_PUBLIC_ENABLE_CACHE', true),
    ttlSeconds: getEnvNumber('NEXT_PUBLIC_CACHE_TTL_SECONDS', 300),
    ttl: {
        default: 5 * 60 * 1000,
        user: 10 * 60 * 1000,
        listing: 2 * 60 * 1000,
        message: 1 * 60 * 1000,
        order: 5 * 60 * 1000,
        wallet: 30 * 1000,
        adminBalance: 5 * 1000,
        adminActions: 10 * 1000
    }
};
const uploadConfig = {
    maxFileSize: limits.maxFileSizeMB * 1024 * 1024,
    maxFiles: 10,
    acceptedImageTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif'
    ],
    acceptedVideoTypes: [
        'video/mp4',
        'video/webm'
    ],
    acceptedDocumentTypes: [
        'application/pdf'
    ]
};
const paginationConfig = {
    defaultPageSize: 20,
    pageSizeOptions: [
        10,
        20,
        50,
        100
    ],
    maxPageSize: 100
};
const notificationConfig = {
    enabled: features.notifications,
    sound: true,
    vibrate: true,
    desktop: true,
    email: true,
    sms: false,
    push: true
};
const paymentConfig = {
    currency: 'USD',
    minimumAmount: 1,
    maximumAmount: 10000,
    platformFee: limits.platformFeePercentage / 100,
    processingFee: 0.03,
    withdrawalMinimum: limits.minWithdrawalAmount,
    withdrawalMaximum: 5000,
    paymentMethods: [
        'wallet',
        'card',
        'paypal'
    ]
};
const tierConfig = {
    enabled: features.tierSystem,
    tiers: {
        'Tease': {
            minSales: 0,
            commission: 0.20
        },
        'Tempt': {
            minSales: 10,
            commission: 0.18
        },
        'Seduce': {
            minSales: 25,
            commission: 0.15
        },
        'Enchant': {
            minSales: 50,
            commission: 0.12
        },
        'Goddess': {
            minSales: 100,
            commission: 0.10
        }
    }
};
const performanceConfig = {
    debounceDelay: getEnvNumber('NEXT_PUBLIC_DEBOUNCE_DELAY', 300),
    throttleDelay: getEnvNumber('NEXT_PUBLIC_THROTTLE_DELAY', 1000),
    balanceUpdateDebounce: getEnvNumber('NEXT_PUBLIC_BALANCE_UPDATE_DEBOUNCE', 1000),
    maxConcurrentRequests: getEnvNumber('NEXT_PUBLIC_MAX_CONCURRENT_REQUESTS', 5),
    enableMemoization: getEnvBool('NEXT_PUBLIC_ENABLE_MEMOIZATION', true),
    enableLazyLoading: getEnvBool('NEXT_PUBLIC_ENABLE_LAZY_LOADING', true)
};
const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/auth/login',
        SIGNUP: '/auth/signup',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        VERIFY: '/auth/verify',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password'
    },
    // Users
    USERS: {
        LIST: '/users',
        GET: '/users/:id',
        UPDATE: '/users/:id',
        DELETE: '/users/:id',
        PROFILE: '/users/profile',
        UPLOAD_AVATAR: '/users/avatar',
        VERIFY_SELLER: '/users/verify-seller'
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
        BY_SELLER: '/listings/seller/:username'
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
        UNREAD_COUNT: '/messages/unread-count'
    },
    // Orders
    ORDERS: {
        LIST: '/orders',
        GET: '/orders/:id',
        CREATE: '/orders',
        UPDATE_STATUS: '/orders/:id/status',
        CANCEL: '/orders/:id/cancel',
        DISPUTE: '/orders/:id/dispute'
    },
    // Wallet - ENHANCED WITH ADMIN ENDPOINTS
    WALLET: {
        BALANCE: '/wallet/balance',
        TRANSACTIONS: '/wallet/transactions',
        DEPOSIT: '/wallet/deposit',
        WITHDRAW: '/wallet/withdraw',
        TRANSFER: '/wallet/transfer',
        ADMIN_PLATFORM_BALANCE: '/wallet/admin-platform-balance',
        ADMIN_ACTIONS: '/admin/actions',
        ADMIN_ANALYTICS: '/wallet/admin/analytics',
        PLATFORM_TRANSACTIONS: '/wallet/platform-transactions'
    },
    // Reviews
    REVIEWS: {
        LIST: '/reviews',
        GET: '/reviews/:id',
        CREATE: '/reviews',
        UPDATE: '/reviews/:id',
        DELETE: '/reviews/:id',
        BY_LISTING: '/reviews/listing/:listingId',
        BY_SELLER: '/reviews/seller/:username'
    },
    // Subscriptions
    SUBSCRIPTIONS: {
        LIST: '/subscriptions',
        GET: '/subscriptions/:id',
        CREATE: '/subscriptions',
        CANCEL: '/subscriptions/:id/cancel',
        REACTIVATE: '/subscriptions/:id/reactivate'
    },
    // Upload
    UPLOAD: {
        IMAGE: '/upload/image',
        VIDEO: '/upload/video',
        DOCUMENT: '/upload/document',
        DELETE: '/upload/delete'
    },
    // Tiers
    TIERS: {
        INFO: '/tiers/info',
        UPDATE: '/tiers/update',
        STATS: '/tiers/stats'
    },
    // Tips - ADDED FOR TIP FUNCTIONALITY
    TIPS: {
        SEND: '/tips/send',
        HISTORY: '/tips/history'
    }
};
const buildApiUrl = (endpoint, params)=>{
    let url = endpoint;
    // Replace path parameters
    if (params) {
        Object.entries(params).forEach(([key, value])=>{
            url = url.replace(`:${key}`, value);
        });
    }
    // Prepend base URL if not already included
    if (!url.startsWith('http')) {
        url = `${apiConfig.baseUrl}${url}`;
    }
    return url;
};
function validateConfiguration() {
    const errors = [];
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
        errors
    };
}
const validateEnvironment = ()=>{
    const validation = validateConfiguration();
    if (!validation.valid && isProduction()) {
        console.warn('[Environment] Configuration validation errors:', validation.errors);
    }
};
function getAllConfig() {
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
        debug: debugConfig,
        performance: performanceConfig
    };
}
// Log configuration in development
if (isDevelopment() && "undefined" !== 'undefined') //TURBOPACK unreachable
;
// Initialize environment validation
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
}),
"[project]/src/utils/validation/schemas.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/utils/validation/schemas.ts
__turbopack_context__.s({
    "addressSchemas": ()=>addressSchemas,
    "adminSchemas": ()=>adminSchemas,
    "authSchemas": ()=>authSchemas,
    "fileSchemas": ()=>fileSchemas,
    "financialSchemas": ()=>financialSchemas,
    "listingSchemas": ()=>listingSchemas,
    "messageSchemas": ()=>messageSchemas,
    "profileSchemas": ()=>profileSchemas,
    "searchSchemas": ()=>searchSchemas,
    "validateField": ()=>validateField,
    "validateSchema": ()=>validateSchema
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-ssr] (ecmascript) <export * as z>");
;
/**
 * Common validation patterns and constraints
 */ const PATTERNS = {
    username: /^[a-zA-Z0-9_-]{3,30}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    // Password: minimum 8 chars, at least 1 uppercase, 1 lowercase, 1 number
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    // Allow letters, numbers, spaces, and common punctuation
    safeText: /^[a-zA-Z0-9\s\-.,!?'"()]+$/,
    // Price pattern: positive numbers with up to 2 decimal places
    price: /^\d+(\.\d{1,2})?$/,
    // Phone number pattern (international format)
    phone: /^\+?[\d\s-()]+$/,
    // Alphanumeric with spaces
    alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/
};
/**
 * Common string sanitizers and transformers
 */ const sanitizers = {
    trim: (val)=>val.trim(),
    lowercase: (val)=>val.toLowerCase(),
    uppercase: (val)=>val.toUpperCase(),
    removeHtml: (val)=>val.replace(/<[^>]*>/g, ''),
    normalizeSpaces: (val)=>val.replace(/\s+/g, ' ').trim()
};
const authSchemas = {
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters').regex(PATTERNS.username, 'Username can only contain letters, numbers, underscores, and hyphens').transform(sanitizers.lowercase).refine((val)=>![
            'admin',
            'root',
            'system',
            'pantypost'
        ].includes(val), 'This username is reserved'),
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Email is required').email('Invalid email address').transform(sanitizers.lowercase).refine((val)=>!val.includes('+'), 'Email aliases with + are not allowed'),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long').regex(PATTERNS.password, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    confirmPassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Please confirm your password'),
    loginSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Username is required').transform(sanitizers.lowercase),
        password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Password is required')
    }),
    signupSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be at most 30 characters').regex(PATTERNS.username, 'Username can only contain letters, numbers, underscores, and hyphens').transform(sanitizers.lowercase),
        email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Email is required').email('Invalid email address').transform(sanitizers.lowercase),
        password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, 'Password must be at least 8 characters').regex(PATTERNS.password, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
        confirmPassword: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Please confirm your password'),
        role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'buyer',
            'seller'
        ], {
            required_error: 'Please select a role'
        }).nullable(),
        termsAccepted: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().refine((val)=>val === true, 'You must agree to the terms'),
        ageVerified: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().refine((val)=>val === true, 'You must confirm you are 18 or older')
    }).refine((data)=>data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: [
            'confirmPassword'
        ]
    })
};
const profileSchemas = {
    displayName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name must be at most 50 characters').transform(sanitizers.normalizeSpaces).refine((val)=>!/<[^>]*>/.test(val), 'Display name cannot contain HTML'),
    bio: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500, 'Bio must be at most 500 characters').transform(sanitizers.normalizeSpaces).optional(),
    location: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(100, 'Location must be at most 100 characters').transform(sanitizers.normalizeSpaces).optional(),
    socialLinks: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        twitter: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('Invalid Twitter URL').optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('')),
        instagram: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('Invalid Instagram URL').optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('')),
        onlyfans: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('Invalid OnlyFans URL').optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(''))
    }).optional(),
    profileUpdateSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        displayName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, 'Display name must be at least 2 characters').max(50, 'Display name must be at most 50 characters').transform(sanitizers.normalizeSpaces),
        bio: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500, 'Bio must be at most 500 characters').transform(sanitizers.normalizeSpaces).optional(),
        location: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(100, 'Location must be at most 100 characters').transform(sanitizers.normalizeSpaces).optional(),
        avatarUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('Invalid avatar URL').optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(''))
    })
};
const listingSchemas = {
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be at most 100 characters').transform(sanitizers.normalizeSpaces).refine((val)=>!/<[^>]*>/.test(val), 'Title cannot contain HTML'),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be at most 2000 characters').transform(sanitizers.normalizeSpaces).refine((val)=>!/<[^>]*>/.test(val), 'Description cannot contain HTML'),
    price: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(PATTERNS.price, 'Invalid price format').transform((val)=>parseFloat(val)).refine((val)=>val >= 0.01, 'Price must be at least $0.01').refine((val)=>val <= 10000, 'Price cannot exceed $10,000'),
    category: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'panties',
        'bras',
        'lingerie',
        'socks',
        'other'
    ], {
        required_error: 'Please select a category'
    }),
    condition: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'new',
        'worn_once',
        'well_worn'
    ], {
        required_error: 'Please select condition'
    }),
    size: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'xs',
        's',
        'm',
        'l',
        'xl',
        'xxl',
        'other'
    ], {
        required_error: 'Please select a size'
    }),
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(30, 'Tag is too long')).max(10, 'Maximum 10 tags allowed').transform((tags)=>tags.map((tag)=>sanitizers.normalizeSpaces(tag))).optional(),
    wearDuration: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0, 'Wear duration cannot be negative').max(30, 'Wear duration cannot exceed 30 days').optional(),
    images: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url('Invalid image URL')).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
    createListingSchema: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be at most 100 characters').transform(sanitizers.normalizeSpaces),
        description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be at most 2000 characters').transform(sanitizers.normalizeSpaces),
        price: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive('Price must be positive').min(0.01, 'Price must be at least $0.01').max(10000, 'Price cannot exceed $10,000'),
        category: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'panties',
            'bras',
            'lingerie',
            'socks',
            'other'
        ]),
        condition: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'new',
            'worn_once',
            'well_worn'
        ]),
        size: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'xs',
            's',
            'm',
            'l',
            'xl',
            'xxl',
            'other'
        ]),
        tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string()).optional(),
        wearDuration: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional(),
        images: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url()).min(1, 'At least one image is required'),
        listingType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'regular',
            'auction'
        ]).default('regular'),
        auctionEndDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime().optional(),
        startingBid: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().optional()
    })
};
const messageSchemas = {
    messageContent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Message cannot be empty').max(1000, 'Message is too long').transform(sanitizers.normalizeSpaces).refine((val)=>!/<script[^>]*>.*?<\/script>/gi.test(val), 'Message cannot contain scripts'),
    customRequest: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be at most 100 characters').transform(sanitizers.normalizeSpaces),
        description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(20, 'Description must be at least 20 characters').max(500, 'Description must be at most 500 characters').transform(sanitizers.normalizeSpaces),
        price: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive('Price must be positive').min(5, 'Minimum price is $5').max(1000, 'Maximum price is $1,000')
    }),
    tipAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive('Tip amount must be positive').min(1, 'Minimum tip is $1').max(500, 'Maximum tip is $500')
};
const financialSchemas = {
    amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format').transform((val)=>parseFloat(val)).refine((val)=>val > 0, 'Amount must be positive').refine((val)=>val <= 10000, 'Amount cannot exceed $10,000'),
    withdrawAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive('Amount must be positive').min(10, 'Minimum withdrawal is $20').refine((val)=>Math.round(val * 100) / 100 === val, 'Amount must have at most 2 decimal places'),
    depositAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive('Amount must be positive').min(5, 'Minimum deposit is $5').max(5000, 'Maximum deposit is $5,000').refine((val)=>Math.round(val * 100) / 100 === val, 'Amount must have at most 2 decimal places'),
    bankAccount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        accountHolder: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, 'Account holder name is required').max(100, 'Account holder name is too long').transform(sanitizers.normalizeSpaces),
        accountNumber: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(8, 'Account number must be at least 8 characters').max(20, 'Account number is too long').regex(/^\d+$/, 'Account number must contain only digits'),
        routingNumber: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().length(9, 'Routing number must be exactly 9 digits').regex(/^\d{9}$/, 'Invalid routing number format'),
        bankName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, 'Bank name is required').max(100, 'Bank name is too long').transform(sanitizers.normalizeSpaces)
    }),
    paymentMethod: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'credit_card',
        'debit_card',
        'bank_transfer',
        'wallet_balance'
    ], {
        required_error: 'Please select a payment method'
    })
};
const addressSchemas = {
    shippingAddress: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        fullName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, 'Full name is required').max(100, 'Full name is too long').transform(sanitizers.normalizeSpaces),
        streetAddress: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(5, 'Street address is required').max(200, 'Street address is too long').transform(sanitizers.normalizeSpaces),
        apartment: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(50, 'Apartment/Suite is too long').transform(sanitizers.normalizeSpaces).optional(),
        city: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, 'City is required').max(100, 'City is too long').transform(sanitizers.normalizeSpaces),
        state: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, 'State/Province is required').max(100, 'State/Province is too long').transform(sanitizers.normalizeSpaces),
        zipCode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, 'ZIP/Postal code is required').max(20, 'ZIP/Postal code is too long').regex(/^[A-Z0-9\s-]+$/i, 'Invalid ZIP/Postal code format'),
        country: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, 'Country is required').max(100, 'Country is too long').transform(sanitizers.normalizeSpaces),
        phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10, 'Phone number is required').max(20, 'Phone number is too long').regex(PATTERNS.phone, 'Invalid phone number format').optional()
    })
};
const searchSchemas = {
    searchQuery: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(100, 'Search query is too long').transform(sanitizers.normalizeSpaces).refine((val)=>!/<[^>]*>/.test(val), 'Search query cannot contain HTML'),
    priceRange: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        min: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0, 'Minimum price cannot be negative').optional(),
        max: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive('Maximum price must be positive').optional()
    }).refine((data)=>{
        if (data.min !== undefined && data.max !== undefined) {
            return data.min <= data.max;
        }
        return true;
    }, {
        message: 'Minimum price cannot be greater than maximum price'
    }),
    sortBy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'newest',
        'oldest',
        'price_low',
        'price_high',
        'popular'
    ], {
        required_error: 'Invalid sort option'
    }).default('newest')
};
const adminSchemas = {
    banUser: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        userId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'User ID is required'),
        reason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10, 'Ban reason must be at least 10 characters').max(500, 'Ban reason is too long').transform(sanitizers.normalizeSpaces),
        duration: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            '1_day',
            '7_days',
            '30_days',
            'permanent'
        ], {
            required_error: 'Please select ban duration'
        })
    }),
    reportAction: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        action: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'dismiss',
            'warn',
            'ban',
            'delete_content'
        ], {
            required_error: 'Please select an action'
        }),
        notes: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10, 'Notes must be at least 10 characters').max(500, 'Notes are too long').transform(sanitizers.normalizeSpaces)
    })
};
const fileSchemas = {
    imageUpload: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        file: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File, {
            message: 'Please select a file'
        }).refine((file)=>file.size <= 5 * 1024 * 1024, 'File size must be less than 5MB').refine((file)=>[
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/webp'
            ].includes(file.type), 'Only JPEG, PNG, and WebP images are allowed')
    }),
    documentUpload: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        file: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].instanceof(File, {
            message: 'Please select a file'
        }).refine((file)=>file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB').refine((file)=>[
                'image/jpeg',
                'image/jpg',
                'image/png',
                'application/pdf'
            ].includes(file.type), 'Only JPEG, PNG, and PDF files are allowed')
    })
};
function validateSchema(schema, data) {
    try {
        const validatedData = schema.parse(data);
        return {
            success: true,
            data: validatedData
        };
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
            const errors = {};
            error.errors.forEach((err)=>{
                if (err.path.length > 0) {
                    errors[err.path.join('.')] = err.message;
                }
            });
            return {
                success: false,
                errors
            };
        }
        return {
            success: false,
            errors: {
                general: 'Validation failed'
            }
        };
    }
}
function validateField(schema, fieldName, value) {
    try {
        const fieldSchema = schema.shape[fieldName];
        if (fieldSchema) {
            fieldSchema.parse(value);
        }
        return undefined;
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
            return error.errors[0]?.message;
        }
        return 'Validation failed';
    }
}
}),
"[project]/src/utils/security/sanitization.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/utils/security/sanitization.ts
__turbopack_context__.s({
    "addCurrency": ()=>addCurrency,
    "escapeHtml": ()=>escapeHtml,
    "generateCSPNonce": ()=>generateCSPNonce,
    "multiplyCurrency": ()=>multiplyCurrency,
    "sanitizeAttribute": ()=>sanitizeAttribute,
    "sanitizeCurrency": ()=>sanitizeCurrency,
    "sanitizeEmail": ()=>sanitizeEmail,
    "sanitizeFileName": ()=>sanitizeFileName,
    "sanitizeHtml": ()=>sanitizeHtml,
    "sanitizeImageDataUrl": ()=>sanitizeImageDataUrl,
    "sanitizeJson": ()=>sanitizeJson,
    "sanitizeMarkdown": ()=>sanitizeMarkdown,
    "sanitizeNumber": ()=>sanitizeNumber,
    "sanitizeObject": ()=>sanitizeObject,
    "sanitizeSearchQuery": ()=>sanitizeSearchQuery,
    "sanitizeSqlInput": ()=>sanitizeSqlInput,
    "sanitizeStrict": ()=>sanitizeStrict,
    "sanitizeStringArray": ()=>sanitizeStringArray,
    "sanitizeUrl": ()=>sanitizeUrl,
    "sanitizeUsername": ()=>sanitizeUsername,
    "subtractCurrency": ()=>subtractCurrency
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dompurify$2f$dist$2f$purify$2e$es$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dompurify/dist/purify.es.mjs [app-ssr] (ecmascript)");
;
/**
 * Configuration for DOMPurify to prevent XSS attacks
 */ const DOMPURIFY_CONFIG = {
    ALLOWED_TAGS: [
        'b',
        'i',
        'em',
        'strong',
        'br',
        'p',
        'span'
    ],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false
};
/**
 * Strict configuration - no HTML allowed at all
 */ const STRICT_CONFIG = {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
};
function sanitizeHtml(dirty) {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }
    // Use DOMPurify with our config
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Fallback for server-side (removes all HTML)
    return dirty.replace(/<[^>]*>/g, '');
}
function sanitizeStrict(dirty) {
    if (!dirty || typeof dirty !== 'string') {
        return '';
    }
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return dirty.replace(/<[^>]*>/g, '');
}
function sanitizeAttribute(value) {
    if (!value || typeof value !== 'string') {
        return '';
    }
    return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\//g, '&#x2F;');
}
function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') {
        return '';
    }
    const trimmedUrl = url.trim().toLowerCase();
    // Allow safe image data URLs
    if (trimmedUrl.startsWith('data:')) {
        // Only allow image data URLs with safe formats
        const safeImageDataUrlPattern = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/i;
        if (safeImageDataUrlPattern.test(url)) {
            return url; // Return original URL to preserve base64 data
        }
        return ''; // Block other data URLs
    }
    // Block other dangerous protocols
    const dangerousProtocols = [
        'javascript:',
        'vbscript:',
        'file:',
        'about:'
    ];
    for (const protocol of dangerousProtocols){
        if (trimmedUrl.startsWith(protocol)) {
            return '';
        }
    }
    // Allow only http, https, and relative URLs
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('/') && !trimmedUrl.startsWith('#')) {
        return '';
    }
    return encodeURI(url);
}
function sanitizeFileName(fileName) {
    if (!fileName || typeof fileName !== 'string') {
        return '';
    }
    // Remove path components
    const baseName = fileName.split(/[/\\]/).pop() || '';
    // Remove dangerous characters
    return baseName.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.{2,}/g, '_').substring(0, 255); // Limit length
}
function sanitizeSearchQuery(query) {
    if (!query || typeof query !== 'string') {
        return '';
    }
    return query.replace(/[<>\"'`;(){}]/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim().substring(0, 100); // Limit length
}
function sanitizeUsername(username) {
    if (!username || typeof username !== 'string') {
        return '';
    }
    // Convert to lowercase
    let sanitized = username.toLowerCase();
    // Remove any non-alphanumeric characters except underscores and hyphens
    sanitized = sanitized.replace(/[^a-z0-9_-]/g, '');
    // Remove leading/trailing underscores or hyphens
    sanitized = sanitized.replace(/^[_-]+|[_-]+$/g, '');
    // Limit length
    const MAX_USERNAME_LENGTH = 30;
    if (sanitized.length > MAX_USERNAME_LENGTH) {
        sanitized = sanitized.substring(0, MAX_USERNAME_LENGTH);
    }
    return sanitized;
}
function sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
        return '';
    }
    // Convert to lowercase and trim
    let sanitized = email.toLowerCase().trim();
    // Remove dangerous characters while keeping valid email chars
    sanitized = sanitized.replace(/[<>\"'`;(){}]/g, '');
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
        return '';
    }
    return sanitized;
}
function sanitizeNumber(input, min = 0, max = Number.MAX_SAFE_INTEGER, decimals = 2) {
    let num;
    if (typeof input === 'string') {
        // Remove non-numeric characters except . and -
        const cleaned = input.replace(/[^0-9.-]/g, '');
        num = parseFloat(cleaned);
    } else {
        num = input;
    }
    // Check if valid number
    if (isNaN(num) || !isFinite(num)) {
        return min;
    }
    // Apply bounds
    if (num < min) return min;
    if (num > max) return max;
    // Round to specified decimals
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
}
function sanitizeCurrency(amount) {
    let num;
    if (typeof amount === 'string') {
        // Remove non-numeric characters except . and -
        const cleaned = amount.replace(/[^0-9.-]/g, '');
        num = parseFloat(cleaned);
    } else {
        num = amount;
    }
    // Check if valid number
    if (isNaN(num) || !isFinite(num)) {
        return 0;
    }
    // Apply bounds
    if (num < 0) return 0;
    if (num > 1000000) return 1000000;
    // FIXED: Round to 2 decimal places using proper technique to avoid floating point issues
    return Math.round(num * 100) / 100;
}
function addCurrency(a, b) {
    return Math.round((a + b) * 100) / 100;
}
function subtractCurrency(a, b) {
    return Math.round((a - b) * 100) / 100;
}
function multiplyCurrency(amount, multiplier) {
    return Math.round(amount * multiplier * 100) / 100;
}
function sanitizeStringArray(arr, maxItems = 50, itemSanitizer = sanitizeStrict) {
    if (!Array.isArray(arr)) {
        return [];
    }
    return arr.slice(0, maxItems).map(itemSanitizer).filter((item)=>item.length > 0);
}
function sanitizeObject(obj, options = {}) {
    const { maxDepth = 5, allowedKeys, keySanitizer = sanitizeStrict, valueSanitizer = (v)=>typeof v === 'string' ? sanitizeStrict(v) : v } = options;
    function sanitizeRecursive(input, depth) {
        if (depth > maxDepth) {
            return null;
        }
        if (input === null || input === undefined) {
            return input;
        }
        if (typeof input === 'string') {
            return valueSanitizer(input);
        }
        if (typeof input === 'number' || typeof input === 'boolean') {
            return input;
        }
        if (Array.isArray(input)) {
            return input.map((item)=>sanitizeRecursive(item, depth + 1));
        }
        if (typeof input === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(input)){
                // Skip prototype properties
                if (!input.hasOwnProperty(key)) continue;
                // Skip dangerous keys
                if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                    continue;
                }
                // Apply key allowlist if provided
                if (allowedKeys && !allowedKeys.includes(key)) {
                    continue;
                }
                const sanitizedKey = keySanitizer(key);
                if (sanitizedKey) {
                    sanitized[sanitizedKey] = sanitizeRecursive(value, depth + 1);
                }
            }
            return sanitized;
        }
        return null;
    }
    return sanitizeRecursive(obj, 0);
}
function sanitizeJson(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
        return null;
    }
    try {
        // Remove any non-JSON characters
        const cleaned = jsonString.trim();
        // Basic validation
        if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
            return null;
        }
        const parsed = JSON.parse(cleaned);
        return sanitizeObject(parsed);
    } catch  {
        return null;
    }
}
function sanitizeSqlInput(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }
    return input.replace(/['";\\]/g, '') // Remove quotes and escape characters
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comments
    .replace(/\*\//g, '').replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '') // Remove SQL keywords
    .trim();
}
function generateCSPNonce() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Fallback for server-side
    return Math.random().toString(36).substring(2, 15);
}
function sanitizeImageDataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') {
        return null;
    }
    // Check if it's a valid data URL
    const dataUrlRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;
    if (!dataUrlRegex.test(dataUrl)) {
        return null;
    }
    // Limit size (e.g., 5MB)
    const maxSize = 5 * 1024 * 1024 * 1.37; // Base64 is ~37% larger
    if (dataUrl.length > maxSize) {
        return null;
    }
    return dataUrl;
}
function escapeHtml(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    return text.replace(/[&<>"'/]/g, (char)=>map[char] || char);
}
function sanitizeMarkdown(markdown) {
    if (!markdown || typeof markdown !== 'string') {
        return '';
    }
    // First, escape HTML to prevent XSS
    let safe = escapeHtml(markdown);
    // Then allow specific markdown patterns
    // Bold: **text** or __text__
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/__(.+?)__/g, '<strong>$1</strong>');
    // Italic: *text* or _text_
    safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>');
    safe = safe.replace(/_(.+?)_/g, '<em>$1</em>');
    // Line breaks
    safe = safe.replace(/\n/g, '<br>');
    return safe;
}
}),
"[project]/src/utils/security/rate-limiter.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/utils/security/rate-limiter.ts
/**
 * Client-side rate limiting implementation
 * Helps prevent spam and abuse of forms/API calls
 */ __turbopack_context__.s({
    "ActionRateLimiter": ()=>ActionRateLimiter,
    "RATE_LIMITS": ()=>RATE_LIMITS,
    "formatWaitTime": ()=>formatWaitTime,
    "getRateLimitMessage": ()=>getRateLimitMessage,
    "getRateLimiter": ()=>getRateLimiter,
    "rateLimit": ()=>rateLimit,
    "useRateLimit": ()=>useRateLimit,
    "withRateLimit": ()=>withRateLimit
});
class ActionRateLimiter {
    limits = new Map();
    storageKey = 'rate_limits';
    constructor(){
        this.loadFromStorage();
        this.cleanupExpired();
    }
    /**
   * Check if an action is allowed
   */ check(action, config) {
        const key = this.getKey(action, config.identifier);
        const now = Date.now();
        const entry = this.limits.get(key);
        // Clean up old entries periodically
        if (Math.random() < 0.1) {
            this.cleanupExpired();
        }
        // Check if blocked
        if (entry?.blockedUntil && entry.blockedUntil > now) {
            const waitTime = Math.ceil((entry.blockedUntil - now) / 1000);
            return {
                allowed: false,
                remainingAttempts: 0,
                resetTime: new Date(entry.blockedUntil),
                waitTime
            };
        }
        // No entry or window expired
        if (!entry || now - entry.firstAttemptTime > config.windowMs) {
            this.limits.set(key, {
                attempts: 1,
                firstAttemptTime: now
            });
            this.saveToStorage();
            return {
                allowed: true,
                remainingAttempts: config.maxAttempts - 1,
                resetTime: new Date(now + config.windowMs)
            };
        }
        // Within window
        if (entry.attempts >= config.maxAttempts) {
            // Use custom block duration or default to a reasonable time
            const blockDuration = config.blockDuration || Math.min(config.windowMs, 60 * 60 * 1000); // Max 1 hour default
            entry.blockedUntil = now + blockDuration;
            this.saveToStorage();
            return {
                allowed: false,
                remainingAttempts: 0,
                resetTime: new Date(entry.blockedUntil),
                waitTime: Math.ceil(blockDuration / 1000)
            };
        }
        // Increment attempts
        entry.attempts++;
        this.saveToStorage();
        return {
            allowed: true,
            remainingAttempts: config.maxAttempts - entry.attempts,
            resetTime: new Date(entry.firstAttemptTime + config.windowMs)
        };
    }
    /**
   * Reset rate limit for specific action
   */ reset(action, identifier) {
        const key = this.getKey(action, identifier);
        this.limits.delete(key);
        this.saveToStorage();
    }
    /**
   * Get key for rate limit entry
   */ getKey(action, identifier) {
        return identifier ? `${action}:${identifier}` : action;
    }
    /**
   * Load rate limits from localStorage
   */ loadFromStorage() {
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    }
    /**
   * Save rate limits to localStorage
   */ saveToStorage() {
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    }
    /**
   * Clean up expired entries
   */ cleanupExpired() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        this.limits.forEach((entry, key)=>{
            if (now - entry.firstAttemptTime > maxAge) {
                this.limits.delete(key);
            }
        });
        this.saveToStorage();
    }
}
const RATE_LIMITS = {
    // Authentication - INCREASED FOR TESTING
    LOGIN: {
        maxAttempts: 300,
        windowMs: 30 * 60 * 1000,
        blockDuration: 30 * 60 * 1000
    },
    SIGNUP: {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000,
        blockDuration: 60 * 60 * 1000
    },
    PASSWORD_RESET: {
        maxAttempts: 3,
        windowMs: 60 * 60 * 1000,
        blockDuration: 60 * 60 * 1000
    },
    // User actions
    MESSAGE_SEND: {
        maxAttempts: 30,
        windowMs: 60 * 1000,
        blockDuration: 5 * 60 * 1000
    },
    LISTING_CREATE: {
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000,
        blockDuration: 60 * 60 * 1000
    },
    CUSTOM_REQUEST: {
        maxAttempts: 5,
        windowMs: 60 * 60 * 1000,
        blockDuration: 60 * 60 * 1000
    },
    // Financial - More reasonable block times
    WITHDRAWAL: {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000,
        blockDuration: 60 * 60 * 1000
    },
    DEPOSIT: {
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000,
        blockDuration: 30 * 60 * 1000
    },
    TIP: {
        maxAttempts: 20,
        windowMs: 60 * 60 * 1000,
        blockDuration: 30 * 60 * 1000
    },
    // Search/Browse
    SEARCH: {
        maxAttempts: 60,
        windowMs: 60 * 1000,
        blockDuration: 5 * 60 * 1000
    },
    API_CALL: {
        maxAttempts: 100,
        windowMs: 60 * 1000,
        blockDuration: 5 * 60 * 1000
    },
    // File uploads
    IMAGE_UPLOAD: {
        maxAttempts: 20,
        windowMs: 60 * 60 * 1000,
        blockDuration: 30 * 60 * 1000
    },
    DOCUMENT_UPLOAD: {
        maxAttempts: 5,
        windowMs: 60 * 60 * 1000,
        blockDuration: 60 * 60 * 1000
    },
    // Admin actions
    BAN_USER: {
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000,
        blockDuration: 60 * 60 * 1000
    },
    REPORT_ACTION: {
        maxAttempts: 20,
        windowMs: 60 * 60 * 1000,
        blockDuration: 30 * 60 * 1000
    }
};
/**
 * Global rate limiter instance
 */ let rateLimiterInstance = null;
function getRateLimiter() {
    if (!rateLimiterInstance) {
        rateLimiterInstance = new ActionRateLimiter();
    }
    return rateLimiterInstance;
}
function rateLimit(action, config) {
    return function(target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function(...args) {
            const limiter = getRateLimiter();
            const result = limiter.check(action, config);
            if (!result.allowed) {
                throw new Error(`Rate limit exceeded. Please wait ${result.waitTime} seconds before trying again.`);
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
function useRateLimit(action, config = RATE_LIMITS.API_CALL) {
    const limiter = getRateLimiter();
    const checkLimit = (identifier)=>{
        return limiter.check(action, {
            ...config,
            identifier
        });
    };
    const resetLimit = (identifier)=>{
        limiter.reset(action, identifier);
    };
    return {
        checkLimit,
        resetLimit
    };
}
async function withRateLimit(action, config, callback) {
    const limiter = getRateLimiter();
    const result = limiter.check(action, config);
    if (!result.allowed) {
        throw new Error(`Rate limit exceeded. Please wait ${result.waitTime} seconds before trying again.`);
    }
    try {
        return await callback();
    } catch (error) {
        // On error, give back one attempt
        limiter.reset(action, config.identifier);
        throw error;
    }
}
function formatWaitTime(seconds) {
    if (seconds < 60) {
        return `${seconds} second${seconds === 1 ? '' : 's'}`;
    }
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'}`;
    }
    const hours = Math.ceil(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours === 1 ? '' : 's'}`;
    }
    const days = Math.ceil(hours / 24);
    return `${days} day${days === 1 ? '' : 's'}`;
}
function getRateLimitMessage(result) {
    if (result.allowed) {
        if (result.remainingAttempts <= 3) {
            return `You have ${result.remainingAttempts} attempt${result.remainingAttempts === 1 ? '' : 's'} remaining.`;
        }
        return '';
    }
    if (result.waitTime) {
        return `Too many attempts. Please wait ${formatWaitTime(result.waitTime)} before trying again.`;
    }
    return 'Rate limit exceeded. Please try again later.';
}
}),
"[project]/src/utils/security/validation.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "CSRFTokenManager": ()=>CSRFTokenManager,
    "RateLimiter": ()=>RateLimiter,
    "debounce": ()=>debounce,
    "hasValidExtension": ()=>hasValidExtension,
    "isFutureDate": ()=>isFutureDate,
    "isValidAge": ()=>isValidAge,
    "isValidBankAccount": ()=>isValidBankAccount,
    "isValidBitcoinAddress": ()=>isValidBitcoinAddress,
    "isValidCreditCard": ()=>isValidCreditCard,
    "isValidEmail": ()=>isValidEmail,
    "isValidEthereumAddress": ()=>isValidEthereumAddress,
    "isValidHexColor": ()=>isValidHexColor,
    "isValidPassword": ()=>isValidPassword,
    "isValidPhoneNumber": ()=>isValidPhoneNumber,
    "isValidPrice": ()=>isValidPrice,
    "isValidRoutingNumber": ()=>isValidRoutingNumber,
    "isValidUUID": ()=>isValidUUID,
    "isValidUrl": ()=>isValidUrl,
    "isValidUsername": ()=>isValidUsername,
    "safeJsonParse": ()=>safeJsonParse,
    "validateFormData": ()=>validateFormData,
    "validateImageFile": ()=>validateImageFile,
    "validatePasswordStrength": ()=>validatePasswordStrength
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-ssr] (ecmascript) <export * as z>");
;
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    return usernameRegex.test(username);
}
function isValidPassword(password) {
    return validatePasswordStrength(password).isValid;
}
function validatePasswordStrength(password) {
    const feedback = [];
    let score = 0;
    if (!password) {
        return {
            isValid: false,
            score: 0,
            feedback: [
                'Password is required'
            ]
        };
    }
    // Length check
    if (password.length >= 8) {
        score++;
    } else {
        feedback.push('Must be at least 8 characters');
    }
    if (password.length >= 12) {
        score++;
    }
    // Uppercase check
    if (/[A-Z]/.test(password)) {
        score++;
    } else {
        feedback.push('Include at least one uppercase letter');
    }
    // Lowercase check
    if (/[a-z]/.test(password)) {
        score++;
    } else {
        feedback.push('Include at least one lowercase letter');
    }
    // Number check
    if (/\d/.test(password)) {
        score++;
    } else {
        feedback.push('Include at least one number');
    }
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score++;
        feedback.push('Great! Contains special characters');
    }
    // Common patterns to avoid
    const commonPatterns = [
        /^12345/,
        /^password/i,
        /^qwerty/i,
        /^abc123/i,
        /^admin/i
    ];
    const hasCommonPattern = commonPatterns.some((pattern)=>pattern.test(password));
    if (hasCommonPattern) {
        score = Math.max(0, score - 2);
        feedback.push('Avoid common patterns');
    }
    const isValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);
    return {
        isValid,
        score: Math.min(5, score),
        feedback: isValid && feedback.length === 0 ? [
            'Strong password!'
        ] : feedback
    };
}
function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return [
            'http:',
            'https:'
        ].includes(urlObj.protocol);
    } catch  {
        return false;
    }
}
function isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}
function isValidCreditCard(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (!/^\d{13,19}$/.test(cleaned)) {
        return false;
    }
    let sum = 0;
    let isEven = false;
    for(let i = cleaned.length - 1; i >= 0; i--){
        let digit = parseInt(cleaned[i], 10);
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        sum += digit;
        isEven = !isEven;
    }
    return sum % 10 === 0;
}
function validateImageFile(file) {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp'
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!file) {
        return {
            isValid: false,
            error: 'No file selected'
        };
    }
    if (!allowedTypes.includes(file.type)) {
        return {
            isValid: false,
            error: 'Only JPEG, PNG, and WebP images are allowed'
        };
    }
    if (file.size > maxSize) {
        return {
            isValid: false,
            error: 'File size must be less than 5MB'
        };
    }
    return {
        isValid: true
    };
}
function isValidPrice(price) {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice) || !isFinite(numPrice)) {
        return false;
    }
    return numPrice >= 0.01 && numPrice <= 10000;
}
function isFutureDate(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj > new Date();
}
function isValidAge(birthDate) {
    const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || monthDiff === 0 && today.getDate() < date.getDate()) {
        return age - 1 >= 18;
    }
    return age >= 18;
}
function isValidBitcoinAddress(address) {
    // Basic Bitcoin address validation (simplified)
    const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
    return btcRegex.test(address);
}
function isValidEthereumAddress(address) {
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
}
function isValidBankAccount(accountNumber) {
    const cleaned = accountNumber.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 17;
}
function isValidRoutingNumber(routingNumber) {
    const cleaned = routingNumber.replace(/\D/g, '');
    if (cleaned.length !== 9) {
        return false;
    }
    // Checksum validation for US routing numbers
    let sum = 0;
    for(let i = 0; i < 9; i += 3){
        sum += parseInt(cleaned[i], 10) * 3;
        sum += parseInt(cleaned[i + 1], 10) * 7;
        sum += parseInt(cleaned[i + 2], 10) * 1;
    }
    return sum % 10 === 0;
}
function isValidHexColor(color) {
    const hexRegex = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
}
function hasValidExtension(filename, allowedExtensions) {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? allowedExtensions.includes(ext) : false;
}
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
class RateLimiter {
    attempts = new Map();
    maxAttempts;
    windowMs;
    constructor(maxAttempts = 5, windowMs = 60000){
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }
    isAllowed(key) {
        const now = Date.now();
        const attempt = this.attempts.get(key);
        if (!attempt) {
            this.attempts.set(key, {
                count: 1,
                firstAttempt: now
            });
            return true;
        }
        if (now - attempt.firstAttempt > this.windowMs) {
            // Reset window
            this.attempts.set(key, {
                count: 1,
                firstAttempt: now
            });
            return true;
        }
        if (attempt.count >= this.maxAttempts) {
            return false;
        }
        attempt.count++;
        return true;
    }
    reset(key) {
        this.attempts.delete(key);
    }
    getRemainingAttempts(key) {
        const attempt = this.attempts.get(key);
        if (!attempt) return this.maxAttempts;
        const now = Date.now();
        if (now - attempt.firstAttempt > this.windowMs) {
            return this.maxAttempts;
        }
        return Math.max(0, this.maxAttempts - attempt.count);
    }
    getResetTime(key) {
        const attempt = this.attempts.get(key);
        if (!attempt) return null;
        return attempt.firstAttempt + this.windowMs;
    }
}
class CSRFTokenManager {
    token = null;
    tokenKey = 'csrf_token';
    generateToken() {
        if ("TURBOPACK compile-time truthy", 1) {
            return '';
        }
        //TURBOPACK unreachable
        ;
        const array = undefined;
        const token = undefined;
    }
    getToken() {
        if (this.token) {
            return this.token;
        }
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return this.token;
    }
    validateToken(token) {
        const storedToken = this.getToken();
        return storedToken !== null && storedToken === token;
    }
    clearToken() {
        this.token = null;
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }
}
function debounce(func, wait) {
    let timeout = null;
    return function executedFunction(...args) {
        const later = ()=>{
            timeout = null;
            func(...args);
        };
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}
function safeJsonParse(json, schema) {
    try {
        const parsed = JSON.parse(json);
        if (schema) {
            const result = schema.safeParse(parsed);
            if (!result.success) {
                return {
                    success: false,
                    error: 'Invalid data format'
                };
            }
            return {
                success: true,
                data: result.data
            };
        }
        return {
            success: true,
            data: parsed
        };
    } catch (error) {
        return {
            success: false,
            error: 'Invalid JSON'
        };
    }
}
async function validateFormData(data, schema) {
    try {
        const validData = await schema.parseAsync(data);
        return {
            isValid: true,
            data: validData
        };
    } catch (error) {
        if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
            const errors = {};
            error.errors.forEach((err)=>{
                const path = err.path.join('.');
                errors[path] = err.message;
            });
            return {
                isValid: false,
                errors
            };
        }
        return {
            isValid: false,
            errors: {
                general: 'Validation failed'
            }
        };
    }
}
}),
"[project]/src/utils/ordersMigration.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/utils/ordersMigration.ts
__turbopack_context__.s({
    "checkOrdersMigrationNeeded": ()=>checkOrdersMigrationNeeded,
    "migrateOrdersToService": ()=>migrateOrdersToService,
    "runOrdersMigration": ()=>runOrdersMigration,
    "syncOrdersWithService": ()=>syncOrdersWithService,
    "validateOrderIntegrity": ()=>validateOrderIntegrity
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orders$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/orders.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/auth.service.ts [app-ssr] (ecmascript)");
;
async function checkOrdersMigrationNeeded() {
    try {
        // Check if migration flag exists
        const migrationFlag = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].getItem('orders_migrated_to_service', false);
        if (migrationFlag) {
            return false; // Already migrated
        }
        // Check if old orders exist in storage
        const oldOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].getItem('wallet_orders', []);
        return oldOrders.length > 0;
    } catch (error) {
        console.error('Error checking orders migration:', error);
        return false;
    }
}
async function migrateOrdersToService() {
    try {
        console.log('[OrdersMigration] Starting orders migration...');
        // CRITICAL FIX: Check if user is authenticated before attempting migration
        const isAuthenticated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].isAuthenticated();
        if (!isAuthenticated) {
            console.log('[OrdersMigration] No authenticated user - skipping API migration');
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('orders_migrated_to_service', true);
            return {
                success: true,
                migratedCount: 0
            };
        }
        // Get existing orders from storage
        const existingOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].getItem('wallet_orders', []);
        if (existingOrders.length === 0) {
            console.log('[OrdersMigration] No orders to migrate');
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('orders_migrated_to_service', true);
            return {
                success: true,
                migratedCount: 0
            };
        }
        console.log(`[OrdersMigration] Found ${existingOrders.length} orders to migrate`);
        let migratedCount = 0;
        const errors = [];
        // Process each order
        for (const order of existingOrders){
            try {
                // Check if order already exists (by ID)
                const existingResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orders$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ordersService"].getOrder(order.id);
                if (existingResult.success && existingResult.data) {
                    console.log(`[OrdersMigration] Order ${order.id} already exists, skipping`);
                    migratedCount++;
                    continue;
                }
                // Create order through service
                const createResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orders$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ordersService"].createOrder({
                    title: order.title,
                    description: order.description,
                    price: order.price,
                    markedUpPrice: order.markedUpPrice,
                    imageUrl: order.imageUrl,
                    seller: order.seller,
                    buyer: order.buyer,
                    tags: order.tags,
                    wearTime: order.wearTime,
                    wasAuction: order.wasAuction,
                    finalBid: order.finalBid,
                    deliveryAddress: order.deliveryAddress,
                    tierCreditAmount: order.tierCreditAmount,
                    isCustomRequest: order.isCustomRequest,
                    originalRequestId: order.originalRequestId,
                    listingId: order.listingId,
                    listingTitle: order.listingTitle,
                    quantity: order.quantity,
                    // Ensure shippingStatus is cast correctly including pending-auction
                    shippingStatus: order.shippingStatus
                });
                if (createResult.success) {
                    migratedCount++;
                    // If the order has a shipping status, update it
                    if (order.shippingStatus && order.shippingStatus !== 'pending') {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orders$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ordersService"].updateOrderStatus(order.id, {
                            shippingStatus: order.shippingStatus
                        });
                    }
                } else {
                    errors.push(`Failed to migrate order ${order.id}: ${createResult.error?.message}`);
                }
            } catch (error) {
                errors.push(`Error migrating order ${order.id}: ${error}`);
            }
        }
        // Log any errors
        if (errors.length > 0) {
            console.error('[OrdersMigration] Migration errors:', errors);
        }
        // Set migration flag
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('orders_migrated_to_service', true);
        console.log(`[OrdersMigration] Migration complete. Migrated ${migratedCount}/${existingOrders.length} orders`);
        return {
            success: errors.length === 0,
            migratedCount
        };
    } catch (error) {
        console.error('[OrdersMigration] Migration failed:', error);
        return {
            success: false,
            migratedCount: 0
        };
    }
}
async function syncOrdersWithService() {
    try {
        // CRITICAL FIX: Check if user is authenticated before attempting sync
        const isAuthenticated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].isAuthenticated();
        if (!isAuthenticated) {
            console.log('[OrdersSync] No authenticated user - skipping API sync');
            return;
        }
        // Get orders from both sources
        const [storageOrders, serviceResult] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].getItem('wallet_orders', []),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orders$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ordersService"].getOrders()
        ]);
        if (!serviceResult.success || !serviceResult.data) {
            console.error('[OrdersSync] Failed to fetch orders from service');
            return;
        }
        const serviceOrders = serviceResult.data;
        // Create a map of service orders for quick lookup
        const serviceOrderMap = new Map(serviceOrders.map((order)=>[
                order.id,
                order
            ]));
        // Check for orders in storage but not in service
        const ordersToAdd = [];
        for (const storageOrder of storageOrders){
            if (!serviceOrderMap.has(storageOrder.id)) {
                ordersToAdd.push(storageOrder);
            }
        }
        // Add missing orders to service
        if (ordersToAdd.length > 0) {
            console.log(`[OrdersSync] Found ${ordersToAdd.length} orders to sync to service`);
            for (const order of ordersToAdd){
                try {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orders$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ordersService"].createOrder({
                        title: order.title,
                        description: order.description,
                        price: order.price,
                        markedUpPrice: order.markedUpPrice,
                        imageUrl: order.imageUrl,
                        seller: order.seller,
                        buyer: order.buyer,
                        tags: order.tags,
                        wearTime: order.wearTime,
                        wasAuction: order.wasAuction,
                        finalBid: order.finalBid,
                        deliveryAddress: order.deliveryAddress,
                        tierCreditAmount: order.tierCreditAmount,
                        isCustomRequest: order.isCustomRequest,
                        originalRequestId: order.originalRequestId,
                        listingId: order.listingId,
                        listingTitle: order.listingTitle,
                        quantity: order.quantity,
                        // Ensure shippingStatus is cast correctly including pending-auction
                        shippingStatus: order.shippingStatus
                    });
                } catch (error) {
                    console.error(`[OrdersSync] Failed to sync order ${order.id}:`, error);
                }
            }
        }
        console.log('[OrdersSync] Sync complete');
    } catch (error) {
        console.error('[OrdersSync] Sync failed:', error);
    }
}
async function validateOrderIntegrity() {
    const issues = [];
    try {
        // CRITICAL FIX: Check if user is authenticated before attempting validation
        const isAuthenticated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].isAuthenticated();
        if (!isAuthenticated) {
            console.log('[OrdersIntegrity] No authenticated user - skipping API validation');
            return {
                valid: true,
                issues: []
            };
        }
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orders$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ordersService"].getOrders();
        if (!result.success || !result.data) {
            issues.push('Failed to fetch orders from service');
            return {
                valid: false,
                issues
            };
        }
        const orders = result.data;
        // Check for duplicate orders
        const orderIds = new Set();
        for (const order of orders){
            if (orderIds.has(order.id)) {
                issues.push(`Duplicate order ID found: ${order.id}`);
            }
            orderIds.add(order.id);
        }
        // Validate required fields
        for (const order of orders){
            if (!order.id) issues.push('Order missing ID');
            if (!order.title) issues.push(`Order ${order.id} missing title`);
            if (!order.seller) issues.push(`Order ${order.id} missing seller`);
            if (!order.buyer) issues.push(`Order ${order.id} missing buyer`);
            if (typeof order.price !== 'number') issues.push(`Order ${order.id} has invalid price`);
            if (!order.date) issues.push(`Order ${order.id} missing date`);
        }
        return {
            valid: issues.length === 0,
            issues
        };
    } catch (error) {
        issues.push(`Validation error: ${error}`);
        return {
            valid: false,
            issues
        };
    }
}
async function runOrdersMigration() {
    try {
        console.log('[OrdersMigration] Checking if migration is needed...');
        // CRITICAL FIX: Check authentication FIRST before any migration logic
        const isAuthenticated = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["authService"].isAuthenticated();
        if (!isAuthenticated) {
            console.log('[OrdersMigration] No authenticated user - skipping all migration activities');
            // Still set the migration flag to prevent future attempts during this session
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('orders_migrated_to_service', true);
            return;
        }
        const needsMigration = await checkOrdersMigrationNeeded();
        if (needsMigration) {
            console.log('[OrdersMigration] Migration needed, starting process...');
            const result = await migrateOrdersToService();
            if (result.success) {
                console.log('[OrdersMigration] Migration successful');
            } else {
                console.error('[OrdersMigration] Migration completed with errors');
            }
        } else {
            console.log('[OrdersMigration] No migration needed');
        }
        // Only run sync and validation if user is authenticated (double-check)
        if (isAuthenticated) {
            // Always run sync to ensure consistency
            await syncOrdersWithService();
            // Validate integrity
            const validation = await validateOrderIntegrity();
            if (!validation.valid) {
                console.error('[OrdersMigration] Integrity issues found:', validation.issues);
            }
        }
    } catch (error) {
        console.error('[OrdersMigration] Migration process failed:', error);
    }
}
}),
"[project]/src/utils/security/permissions.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// Centralized role/permission helpers for the frontend
__turbopack_context__.s({
    "canAccessRole": ()=>canAccessRole,
    "hasRole": ()=>hasRole,
    "isAdmin": ()=>isAdmin
});
function isAdmin(user) {
    return (user?.role ?? null) === 'admin';
}
function hasRole(user, role) {
    return (user?.role ?? null) === role;
}
function canAccessRole(user, requiredRole) {
    const r = user?.role ?? null;
    return r === requiredRole || r === 'admin';
}
}),
"[project]/src/types/users.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/types/users.ts
__turbopack_context__.s({
    "UserErrorCode": ()=>UserErrorCode,
    "UserValidation": ()=>UserValidation,
    "calculateProfileCompleteness": ()=>calculateProfileCompleteness,
    "isValidBio": ()=>isValidBio,
    "isValidSubscriptionPrice": ()=>isValidSubscriptionPrice,
    "isValidUsername": ()=>isValidUsername
});
var UserErrorCode = /*#__PURE__*/ function(UserErrorCode) {
    UserErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    UserErrorCode["PROFILE_NOT_FOUND"] = "PROFILE_NOT_FOUND";
    UserErrorCode["INVALID_USERNAME"] = "INVALID_USERNAME";
    UserErrorCode["INVALID_ROLE"] = "INVALID_ROLE";
    UserErrorCode["VERIFICATION_FAILED"] = "VERIFICATION_FAILED";
    UserErrorCode["BAN_FAILED"] = "BAN_FAILED";
    UserErrorCode["SUBSCRIPTION_FAILED"] = "SUBSCRIPTION_FAILED";
    UserErrorCode["PROFILE_UPDATE_FAILED"] = "PROFILE_UPDATE_FAILED";
    UserErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    UserErrorCode["NETWORK_ERROR"] = "NETWORK_ERROR";
    UserErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    return UserErrorCode;
}({});
const UserValidation = {
    username: {
        min: 2,
        max: 50,
        pattern: /^[a-zA-Z0-9_-]+$/,
        message: 'Username must be 2-50 characters and contain only letters, numbers, underscores, and hyphens'
    },
    bio: {
        max: 500,
        message: 'Bio must be less than 500 characters'
    },
    subscriptionPrice: {
        min: 0,
        max: 999.99,
        pattern: /^\d+(\.\d{1,2})?$/,
        message: 'Price must be a valid amount between $0 and $999.99'
    }
};
function isValidUsername(username) {
    return username.length >= UserValidation.username.min && username.length <= UserValidation.username.max && UserValidation.username.pattern.test(username);
}
function isValidBio(bio) {
    return bio.length <= UserValidation.bio.max;
}
function isValidSubscriptionPrice(price) {
    const numPrice = parseFloat(price);
    return UserValidation.subscriptionPrice.pattern.test(price) && numPrice >= UserValidation.subscriptionPrice.min && numPrice <= UserValidation.subscriptionPrice.max;
}
function calculateProfileCompleteness(user, profile) {
    const requiredFields = [
        {
            field: 'profilePic',
            label: 'Profile Picture'
        },
        {
            field: 'bio',
            label: 'Bio'
        },
        {
            field: 'subscriptionPrice',
            label: 'Subscription Price'
        }
    ];
    const missingFields = [];
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
    const percentage = Math.round(completedCount / requiredFields.length * 100);
    const suggestions = [];
    if (percentage < 100) {
        suggestions.push('Complete your profile to attract more buyers');
        if (!user.isVerified && user.role === 'seller') {
            suggestions.push('Get verified to build trust');
        }
    }
    return {
        percentage,
        missingFields,
        suggestions
    };
}
}),
"[project]/src/types/common.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/types/common.ts
/**
 * Common types used across the application
 */ __turbopack_context__.s({
    "LISTING_STATUS": ()=>LISTING_STATUS,
    "ListingId": ()=>ListingId,
    "MessageId": ()=>MessageId,
    "Money": ()=>Money,
    "NotificationId": ()=>NotificationId,
    "ORDER_STATUS": ()=>ORDER_STATUS,
    "OrderId": ()=>OrderId,
    "USER_ROLES": ()=>USER_ROLES,
    "UserId": ()=>UserId,
    "VERIFICATION_STATUS": ()=>VERIFICATION_STATUS
});
const UserId = (id)=>id;
const ListingId = (id)=>id;
const OrderId = (id)=>id;
const MessageId = (id)=>id;
const NotificationId = (id)=>id;
const Money = {
    fromDollars: (dollars)=>Math.round(dollars * 100),
    toDollars: (money)=>money / 100,
    format: (money)=>`$${(money / 100).toFixed(2)}`
};
const USER_ROLES = {
    BUYER: 'buyer',
    SELLER: 'seller',
    ADMIN: 'admin'
};
const ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded'
};
const LISTING_STATUS = {
    ACTIVE: 'active',
    SOLD: 'sold',
    EXPIRED: 'expired',
    CANCELLED: 'cancelled'
};
const VERIFICATION_STATUS = {
    UNVERIFIED: 'unverified',
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
};
}),
"[project]/src/types/websocket.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/types/websocket.ts
// WebSocket connection states
__turbopack_context__.s({
    "WebSocketEvent": ()=>WebSocketEvent,
    "WebSocketState": ()=>WebSocketState
});
var WebSocketState = /*#__PURE__*/ function(WebSocketState) {
    WebSocketState["CONNECTING"] = "CONNECTING";
    WebSocketState["CONNECTED"] = "CONNECTED";
    WebSocketState["DISCONNECTED"] = "DISCONNECTED";
    WebSocketState["RECONNECTING"] = "RECONNECTING";
    WebSocketState["ERROR"] = "ERROR";
    return WebSocketState;
}({});
var WebSocketEvent = /*#__PURE__*/ function(WebSocketEvent) {
    // Connection events
    WebSocketEvent["CONNECT"] = "connect";
    WebSocketEvent["DISCONNECT"] = "disconnect";
    WebSocketEvent["ERROR"] = "error";
    WebSocketEvent["RECONNECT"] = "reconnect";
    // Message events
    WebSocketEvent["MESSAGE_NEW"] = "message:new";
    WebSocketEvent["MESSAGE_UPDATE"] = "message:update";
    WebSocketEvent["MESSAGE_DELETE"] = "message:delete";
    WebSocketEvent["MESSAGE_TYPING"] = "message:typing";
    WebSocketEvent["MESSAGE_READ"] = "message:read";
    // Order events
    WebSocketEvent["ORDER_NEW"] = "order:new";
    WebSocketEvent["ORDER_UPDATE"] = "order:update";
    WebSocketEvent["ORDER_STATUS_CHANGE"] = "order:status_change";
    // Auction events
    WebSocketEvent["AUCTION_BID"] = "auction:bid";
    WebSocketEvent["AUCTION_OUTBID"] = "auction:outbid";
    WebSocketEvent["AUCTION_ENDING"] = "auction:ending";
    WebSocketEvent["AUCTION_ENDED"] = "auction:ended";
    WebSocketEvent["AUCTION_CANCELLED"] = "auction:cancelled";
    // Notification events
    WebSocketEvent["NOTIFICATION_NEW"] = "notification:new";
    WebSocketEvent["NOTIFICATION_READ"] = "notification:read";
    // User events
    WebSocketEvent["USER_ONLINE"] = "user:online";
    WebSocketEvent["USER_OFFLINE"] = "user:offline";
    WebSocketEvent["USER_UPDATED"] = "user:updated";
    // Wallet events
    WebSocketEvent["WALLET_BALANCE_UPDATE"] = "wallet:balance_update";
    WebSocketEvent["WALLET_TRANSACTION"] = "wallet:transaction";
    // Listing events
    WebSocketEvent["LISTING_NEW"] = "listing:new";
    WebSocketEvent["LISTING_UPDATE"] = "listing:update";
    WebSocketEvent["LISTING_SOLD"] = "listing:sold";
    // Subscription events
    WebSocketEvent["SUBSCRIPTION_NEW"] = "subscription:new";
    WebSocketEvent["SUBSCRIPTION_CANCELLED"] = "subscription:cancelled";
    // Room events
    WebSocketEvent["ROOM_JOIN"] = "room:join";
    WebSocketEvent["ROOM_LEAVE"] = "room:leave";
    // System events
    WebSocketEvent["PING"] = "ping";
    WebSocketEvent["PONG"] = "pong";
    return WebSocketEvent;
}({});
}),
"[project]/src/lib/errorTracking.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/lib/errorTracking.ts
__turbopack_context__.s({
    "errorTracker": ()=>errorTracker
});
class ErrorTracker {
    initialized = false;
    initialize() {
        if (this.initialized || "undefined" === 'undefined') return;
        //TURBOPACK unreachable
        ;
    }
    handleError = (event)=>{
        this.captureError(event.error || new Error(event.message), {
            action: 'window_error',
            metadata: {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            }
        });
    };
    handleRejection = (event)=>{
        this.captureError(new Error(event.reason?.message || 'Unhandled Promise Rejection'), {
            action: 'unhandled_rejection',
            metadata: {
                reason: event.reason
            }
        });
    };
    captureError(error, context) {
        console.error('[ErrorTracker]', error, context);
        // Send to custom endpoint
        if (process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT) {
            fetch(process.env.NEXT_PUBLIC_ERROR_TRACKING_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: error.message,
                    stack: error.stack,
                    context,
                    timestamp: new Date().toISOString(),
                    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
                    url: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : ''
                })
            }).catch(()=>{
            // Fail silently
            });
        }
    }
    captureMessage(message, level = 'info') {
        console.log(`[ErrorTracker:${level}]`, message);
    }
}
const errorTracker = new ErrorTracker();
}),
"[project]/src/hooks/usePerformanceMonitoring.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/hooks/usePerformanceMonitoring.ts
__turbopack_context__.s({
    "usePerformanceMonitoring": ()=>usePerformanceMonitoring
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$web$2d$vitals$2f$dist$2f$web$2d$vitals$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/web-vitals/dist/web-vitals.js [app-ssr] (ecmascript)");
;
;
;
function usePerformanceMonitoring() {
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("undefined" === 'undefined' || !('performance' in window)) return;
        //TURBOPACK unreachable
        ;
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const handleRouteChange = ()=>{
            // Track page navigation performance
            if (window.performance && window.performance.mark) {
                window.performance.mark('route-change-start');
            }
        };
        const handleRouteChangeComplete = ()=>{
            if (window.performance && window.performance.mark && window.performance.measure) {
                window.performance.mark('route-change-end');
                window.performance.measure('route-change', 'route-change-start', 'route-change-end');
                const measure = window.performance.getEntriesByName('route-change')[0];
                if (measure) {
                    sendToAnalytics({
                        name: 'route-change',
                        value: measure.duration,
                        id: 'route-change',
                        delta: measure.duration
                    });
                }
            }
        };
        // Since we're using Next.js App Router, we need to track route changes differently
        handleRouteChange();
        return ()=>{
            handleRouteChangeComplete();
        };
    }, [
        pathname
    ]);
}
function sendToAnalytics(metric) {
    // Send to Google Analytics
    if (window.gtag) {
        window.gtag('event', metric.name, {
            value: Math.round(metric.value),
            metric_id: metric.id,
            metric_value: metric.value,
            metric_delta: metric.delta
        });
    }
    // Send to custom endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
        fetch(`${process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT}/metrics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                metric: metric.name,
                value: metric.value,
                timestamp: new Date().toISOString(),
                page: window.location.pathname
            })
        }).catch(()=>{
        // Fail silently
        });
    }
}
}),
"[project]/src/app/ClientLayout.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/app/ClientLayout.tsx
__turbopack_context__.s({
    "default": ()=>ClientLayout
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Providers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Providers.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Header.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AgeVerificationModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/AgeVerificationModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BanCheck$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/BanCheck.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$MessageNotifications$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/MessageNotifications.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PWAInstall$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/PWAInstall.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$GoogleAnalytics$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/GoogleAnalytics.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$errorTracking$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/errorTracking.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$usePerformanceMonitoring$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/usePerformanceMonitoring.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
;
;
;
// Simple loading component
function LoadingFallback() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-black text-white flex items-center justify-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "animate-spin rounded-full h-8 w-8 border-b-2 border-[#ff950e] mx-auto mb-4"
                }, void 0, false, {
                    fileName: "[project]/src/app/ClientLayout.tsx",
                    lineNumber: 21,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-400",
                    children: "Loading PantyPost..."
                }, void 0, false, {
                    fileName: "[project]/src/app/ClientLayout.tsx",
                    lineNumber: 22,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/ClientLayout.tsx",
            lineNumber: 20,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/ClientLayout.tsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
function ClientLayout({ children }) {
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const hideHeaderRoutes = [
        '/login',
        '/signup',
        '/reset-password',
        '/forgot-password',
        '/verify-reset-code',
        '/reset-password-final'
    ];
    const shouldHideHeader = hideHeaderRoutes.some((route)=>{
        return pathname === route || pathname.startsWith(route + '?') || pathname.startsWith(route + '#');
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setMounted(true);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
            window.addEventListener('load', ()=>{
                navigator.serviceWorker.register('/sw.js').then((registration)=>console.log('SW registered:', registration)).catch((error)=>console.log('SW registration failed:', error));
            });
        }
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$errorTracking$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["errorTracker"].initialize();
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$usePerformanceMonitoring$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePerformanceMonitoring"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) {
            console.log('Current pathname:', pathname);
            console.log('Should hide header:', shouldHideHeader);
        }
    }, [
        pathname,
        shouldHideHeader
    ]);
    if (!mounted) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingFallback, {}, void 0, false, {
            fileName: "[project]/src/app/ClientLayout.tsx",
            lineNumber: 77,
            columnNumber: 12
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$GoogleAnalytics$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GoogleAnalytics"], {}, void 0, false, {
                fileName: "[project]/src/app/ClientLayout.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Providers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Suspense"], {
                        fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingFallback, {}, void 0, false, {
                            fileName: "[project]/src/app/ClientLayout.tsx",
                            lineNumber: 86,
                            columnNumber: 29
                        }, void 0),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "min-h-screen bg-black text-white",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$BanCheck$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                                children: [
                                    !shouldHideHeader && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Header$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                        fileName: "[project]/src/app/ClientLayout.tsx",
                                        lineNumber: 89,
                                        columnNumber: 37
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                                        className: "flex-grow",
                                        children: children
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/ClientLayout.tsx",
                                        lineNumber: 90,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$AgeVerificationModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                        fileName: "[project]/src/app/ClientLayout.tsx",
                                        lineNumber: 93,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$MessageNotifications$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                        fileName: "[project]/src/app/ClientLayout.tsx",
                                        lineNumber: 95,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/ClientLayout.tsx",
                                lineNumber: 88,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/ClientLayout.tsx",
                            lineNumber: 87,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/app/ClientLayout.tsx",
                        lineNumber: 86,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$PWAInstall$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PWAInstall"], {}, void 0, false, {
                        fileName: "[project]/src/app/ClientLayout.tsx",
                        lineNumber: 101,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/ClientLayout.tsx",
                lineNumber: 85,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),

};

//# sourceMappingURL=src_3cf92b47._.js.map