(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/security.service.ts
__turbopack_context__.s({
    "sanitize": ()=>sanitize,
    "securityService": ()=>securityService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/validation.ts [app-client] (ecmascript)");
;
;
;
;
;
;
/**
 * Comprehensive security service for the application
 */ class SecurityService {
    /**
   * Validate and sanitize user input
   */ validateAndSanitize(data, schema, sanitizers) {
        try {
            // First sanitize if sanitizers provided
            let processedData = data;
            if (sanitizers && typeof data === 'object' && data !== null) {
                processedData = {
                    ...data
                };
                for (const [key, sanitizer] of Object.entries(sanitizers)){
                    if (key in processedData && typeof sanitizer === 'function') {
                        processedData[key] = sanitizer(processedData[key]);
                    }
                }
            }
            // Then validate
            const validated = schema.parse(processedData);
            return {
                success: true,
                data: validated
            };
        } catch (error) {
            if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
                const errors = {};
                error.errors.forEach((err)=>{
                    const path = err.path.join('.');
                    errors[path] = err.message;
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
    /**
   * Check rate limit for an action
   */ checkRateLimit(action, identifier) {
        const config = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"][action];
        const result = this.rateLimiter.check(action, {
            ...config,
            identifier
        });
        if (!result.allowed) {
            return {
                allowed: false,
                message: "Too many attempts. Please wait ".concat(result.waitTime, " seconds."),
                resetTime: result.resetTime
            };
        }
        return {
            allowed: true
        };
    }
    /**
   * Sanitize content for safe display
   */ sanitizeForDisplay(content, options) {
        const { allowHtml = false, allowMarkdown = false, maxLength } = options || {};
        let sanitized = content;
        if (maxLength && sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength) + '...';
        }
        if (allowMarkdown) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeMarkdown"](sanitized);
        }
        if (allowHtml) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeHtml"](sanitized);
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"](sanitized);
    }
    /**
   * Validate file upload
   */ validateFileUpload(file) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        var _file_name_split_pop;
        const { maxSize = 5 * 1024 * 1024, allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp'
        ], allowedExtensions = [
            'jpg',
            'jpeg',
            'png',
            'webp'
        ] } = options;
        // Check file size
        if (file.size > maxSize) {
            return {
                valid: false,
                error: "File size must be less than ".concat(Math.round(maxSize / 1024 / 1024), "MB")
            };
        }
        // Check MIME type
        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: "File type not allowed. Allowed types: ".concat(allowedTypes.join(', '))
            };
        }
        // Check extension
        const extension = (_file_name_split_pop = file.name.split('.').pop()) === null || _file_name_split_pop === void 0 ? void 0 : _file_name_split_pop.toLowerCase();
        if (!extension || !allowedExtensions.includes(extension)) {
            return {
                valid: false,
                error: "File extension not allowed. Allowed extensions: ".concat(allowedExtensions.join(', '))
            };
        }
        // Additional security: check if file content matches declared type
        // This would require reading file headers in production
        return {
            valid: true
        };
    }
    /**
   * Generate CSRF token
   */ generateCSRFToken() {
        return this.csrfManager.generateToken();
    }
    /**
   * Validate CSRF token
   */ validateCSRFToken(token) {
        return this.csrfManager.validateToken(token);
    }
    /**
   * Sanitize object for API request
   */ sanitizeForAPI(data) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeObject"](data, {
            maxDepth: 5,
            keySanitizer: (key)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"](key),
            valueSanitizer: (value)=>{
                if (typeof value === 'string') {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"](value);
                }
                return value;
            }
        });
    }
    /**
   * Validate and sanitize search query
   */ sanitizeSearchQuery(query) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeSearchQuery"](query);
    }
    /**
   * Validate financial amount
   */ validateAmount(amount) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const { min = 0.01, max = 10000, allowDecimals = true } = options;
        const sanitized = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"](amount);
        if (sanitized < min) {
            return {
                valid: false,
                error: "Amount must be at least $".concat(min)
            };
        }
        if (sanitized > max) {
            return {
                valid: false,
                error: "Amount cannot exceed $".concat(max)
            };
        }
        if (!allowDecimals && sanitized % 1 !== 0) {
            return {
                valid: false,
                error: 'Amount must be a whole number'
            };
        }
        return {
            valid: true,
            value: sanitized
        };
    }
    /**
   * Check content for potential security issues
   */ checkContentSecurity(content) {
        const issues = [];
        // Check for script tags
        if (/<script[^>]*>.*?<\/script>/gi.test(content)) {
            issues.push('Script tags detected');
        }
        // Check for event handlers
        if (/on\w+\s*=/gi.test(content)) {
            issues.push('Event handlers detected');
        }
        // Check for iframes
        if (/<iframe/gi.test(content)) {
            issues.push('Iframe detected');
        }
        // Check for javascript: URLs
        if (/javascript:/gi.test(content)) {
            issues.push('JavaScript URL detected');
        }
        // Check for SQL-like patterns
        if (/\b(union|select|insert|update|delete|drop)\b.*\b(from|into|where)\b/gi.test(content)) {
            issues.push('SQL-like pattern detected');
        }
        return {
            safe: issues.length === 0,
            issues
        };
    }
    /**
   * Create secure headers for API requests
   */ getSecureHeaders() {
        const headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Content-Type-Options': 'nosniff'
        };
        const csrfToken = this.csrfManager.getToken();
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
        return headers;
    }
    /**
   * Validate password against common vulnerabilities
   */ checkPasswordVulnerabilities(password, userData) {
        const warnings = [];
        // Check against common passwords
        const commonPasswords = [
            'password',
            '12345678',
            'qwerty',
            'abc123',
            'password123',
            'admin',
            'letmein',
            'welcome',
            'monkey',
            '1234567890'
        ];
        if (commonPasswords.some((common)=>password.toLowerCase().includes(common))) {
            warnings.push('Password contains common patterns');
        }
        // Check if password contains username or email
        if ((userData === null || userData === void 0 ? void 0 : userData.username) && password.toLowerCase().includes(userData.username.toLowerCase())) {
            warnings.push('Password should not contain your username');
        }
        if (userData === null || userData === void 0 ? void 0 : userData.email) {
            const emailPart = userData.email.split('@')[0];
            if (password.toLowerCase().includes(emailPart.toLowerCase())) {
                warnings.push('Password should not contain parts of your email');
            }
        }
        // Check for repeated characters
        if (/(.)\1{3,}/.test(password)) {
            warnings.push('Password contains too many repeated characters');
        }
        // Check for sequential characters
        if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
            warnings.push('Password contains sequential characters');
        }
        return {
            secure: warnings.length === 0,
            warnings
        };
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "csrfManager", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "rateLimiter", void 0);
        this.csrfManager = new __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CSRFTokenManager"]();
        this.rateLimiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])();
    }
}
const securityService = new SecurityService();
;
const sanitize = {
    html: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeHtml"],
    strict: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"],
    email: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeEmail"],
    username: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"],
    url: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"],
    fileName: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeFileName"],
    number: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeNumber"],
    currency: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"],
    searchQuery: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeSearchQuery"],
    markdown: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeMarkdown"]
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/validation.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
}),
"[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/api.config.ts
/**
 * API Configuration Module
 * Centralizes all API-related configuration and provides environment-based settings
 */ __turbopack_context__.s({
    "API_BASE_URL": ()=>API_BASE_URL,
    "API_ENDPOINTS": ()=>API_ENDPOINTS,
    "AUTH_TOKEN_KEY": ()=>AUTH_TOKEN_KEY,
    "FEATURES": ()=>FEATURES,
    "REFRESH_TOKEN_KEY": ()=>REFRESH_TOKEN_KEY,
    "REQUEST_CONFIG": ()=>REQUEST_CONFIG,
    "apiCall": ()=>apiCall,
    "apiCallWithRetry": ()=>apiCallWithRetry,
    "apiClient": ()=>apiClient,
    "buildApiUrl": ()=>buildApiUrl,
    "checkApiHealth": ()=>checkApiHealth,
    "getDefaultHeaders": ()=>getDefaultHeaders,
    "isProduction": ()=>isProduction
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/environment.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
;
;
;
;
;
;
const isProduction = !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDevelopment"])();
const API_BASE_URL = ("TURBOPACK compile-time value", "http://localhost:5000") || 'http://localhost:5000';
const FEATURES = {
    USE_API_AUTH: ("TURBOPACK compile-time value", "true") !== 'false',
    USE_API_LISTINGS: ("TURBOPACK compile-time value", "true") !== 'false',
    USE_API_ORDERS: ("TURBOPACK compile-time value", "true") !== 'false',
    USE_API_MESSAGES: ("TURBOPACK compile-time value", "true") !== 'false',
    USE_API_WALLET: ("TURBOPACK compile-time value", "true") !== 'false',
    USE_API_USERS: ("TURBOPACK compile-time value", "true") !== 'false',
    USE_API_BANS: ("TURBOPACK compile-time value", "true") !== 'false',
    USE_API_REPORTS: ("TURBOPACK compile-time value", "true") !== 'false',
    USE_MOCK_API: false
};
const API_ENDPOINTS = {
    // Auth endpoints
    AUTH: {
        LOGIN: '/auth/login',
        SIGNUP: '/auth/signup',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        ME: '/auth/me',
        VERIFY_USERNAME: '/auth/verify-username',
        // Password reset endpoints
        FORGOT_PASSWORD: '/auth/forgot-password',
        VERIFY_RESET_TOKEN: '/auth/verify-reset-token',
        RESET_PASSWORD: '/auth/reset-password'
    },
    // User endpoints
    USERS: {
        PROFILE: '/users/:username/profile',
        UPDATE_PROFILE: '/users/:username/profile',
        VERIFICATION: '/users/:username/verification',
        SETTINGS: '/users/:username/settings',
        LIST: '/users'
    },
    // Listing endpoints
    LISTINGS: {
        LIST: '/listings',
        CREATE: '/listings',
        GET: '/listings/:id',
        UPDATE: '/listings/:id',
        DELETE: '/listings/:id',
        BY_SELLER: '/listings/seller/:username',
        VIEWS: '/listings/:id/views',
        SEARCH: '/listings/search',
        POPULAR_TAGS: '/listings/popular-tags',
        STATS: '/listings/stats',
        BID: '/listings/:id/bid',
        END_AUCTION: '/listings/:id/end-auction'
    },
    // Order endpoints
    ORDERS: {
        LIST: '/orders',
        CREATE: '/orders',
        GET: '/orders/:id',
        UPDATE_STATUS: '/orders/:id/status',
        BY_BUYER: '/orders/buyer/:username',
        BY_SELLER: '/orders/seller/:username',
        SHIPPING: '/orders/:id/shipping',
        UPDATE_ADDRESS: '/orders/:id/address'
    },
    // Message endpoints
    MESSAGES: {
        THREADS: '/messages/threads',
        THREAD: '/messages/threads/:threadId',
        SEND: '/messages/send',
        MARK_READ: '/messages/mark-read',
        BLOCK_USER: '/messages/block',
        UNBLOCK_USER: '/messages/unblock',
        REPORT: '/messages/report',
        TIP: '/messages/tip',
        CUSTOM_REQUEST: '/messages/custom-request'
    },
    // Wallet endpoints
    WALLET: {
        BALANCE: '/wallet/balance/:username',
        DEPOSIT: '/wallet/deposit',
        WITHDRAW: '/wallet/withdraw',
        TRANSACTIONS: '/wallet/transactions/:username',
        ADMIN_ACTIONS: '/wallet/admin-actions',
        TRANSFER: '/wallet/transfer'
    },
    // Subscription endpoints
    SUBSCRIPTIONS: {
        LIST: '/subscriptions/:username',
        SUBSCRIBE: '/subscriptions/subscribe',
        UNSUBSCRIBE: '/subscriptions/unsubscribe',
        CHECK: '/subscriptions/check'
    },
    // Review endpoints
    REVIEWS: {
        LIST: '/reviews',
        CREATE: '/reviews',
        GET: '/reviews/:id',
        UPDATE: '/reviews/:id',
        DELETE: '/reviews/:id',
        BY_SELLER: '/reviews/seller/:username',
        BY_BUYER: '/reviews/buyer/:username',
        BY_ORDER: '/reviews/order/:orderId',
        RESPONSE: '/reviews/:reviewId/response',
        FLAG: '/reviews/:reviewId/flag'
    },
    // Upload endpoints
    UPLOAD: {
        IMAGE: '/upload/image',
        PROFILE: '/upload/profile',
        VERIFICATION: '/upload/verification'
    },
    // Custom request endpoints
    REQUESTS: {
        LIST: '/requests',
        CREATE: '/requests',
        UPDATE: '/requests/:id',
        RESPOND: '/requests/:id/respond',
        BY_USER: '/requests/user/:username'
    }
};
const REQUEST_CONFIG = {
    TIMEOUT: parseInt(("TURBOPACK compile-time value", "30000") || '30000'),
    RETRY_ATTEMPTS: parseInt(("TURBOPACK compile-time value", "3") || '3'),
    RETRY_DELAY: 1000,
    MAX_REQUEST_SIZE: 5 * 1024 * 1024,
    MAX_URL_LENGTH: 2048,
    MAX_HEADER_SIZE: 8192
};
const getDefaultHeaders = ()=>{
    const headers = {
        'Content-Type': 'application/json',
        'X-Client-Version': (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(("TURBOPACK compile-time value", "1.0.0") || '1.0.0'),
        'X-App-Name': (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(("TURBOPACK compile-time value", "PantyPost") || 'PantyPost'),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'X-Request-ID': generateRequestId()
    };
    // Add CSRF token if available
    try {
        const csrfToken = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].generateCSRFToken();
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
    } catch (error) {
        // securityService might not be available in all contexts
        console.warn('Could not generate CSRF token:', error);
    }
    return headers;
};
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const buildApiUrl = (endpoint, params)=>{
    console.log('[buildApiUrl] Called with:', {
        endpoint,
        params
    });
    // If endpoint is already a full URL (for direct calls), return it
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
        console.log('[buildApiUrl] Endpoint is already a full URL, returning as-is');
        return endpoint;
    }
    let url = endpoint;
    // Find all parameters that need to be replaced in the URL
    const requiredParams = (endpoint.match(/:(\w+)/g) || []).map((p)=>p.substring(1));
    console.log('[buildApiUrl] Required params in endpoint:', requiredParams);
    // If URL has parameters that need to be replaced
    if (requiredParams.length > 0) {
        // Check if params object was provided
        if (!params) {
            console.error('[buildApiUrl] ERROR: No params object provided for endpoint:', endpoint);
            console.error('[buildApiUrl] Required params:', requiredParams);
            throw new Error("Missing required URL parameters for endpoint: ".concat(endpoint, ". Required: ").concat(requiredParams.join(', ')));
        }
        // Check each required parameter
        for (const param of requiredParams){
            const value = params[param];
            // Check if parameter exists and is not empty
            if (value === undefined || value === null || value === '') {
                console.error("[buildApiUrl] ERROR: Missing required parameter: ".concat(param));
                console.error('[buildApiUrl] Endpoint:', endpoint);
                console.error('[buildApiUrl] Provided params:', params);
                console.error('[buildApiUrl] Required params:', requiredParams);
                throw new Error("Missing required URL parameter: ".concat(param, " for endpoint: ").concat(endpoint));
            }
            // Log the parameter being replaced
            console.log("[buildApiUrl] Replacing :".concat(param, ' with "').concat(value, '"'));
        }
        // Replace all parameters in the URL
        Object.entries(params).forEach((param)=>{
            let [key, value] = param;
            // Skip if value is undefined or null
            if (value === undefined || value === null) {
                console.warn("[buildApiUrl] Skipping undefined/null parameter: ".concat(key));
                return;
            }
            // Validate parameter key (no special characters that could break URLs)
            const sanitizedKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(key);
            if (sanitizedKey !== key) {
                console.error("[buildApiUrl] Invalid parameter key: ".concat(key));
                throw new Error("Invalid parameter key: ".concat(key));
            }
            // Convert value to string and sanitize
            const stringValue = String(value).trim();
            if (stringValue === '') {
                console.warn("[buildApiUrl] Empty parameter value for key: ".concat(key));
                return;
            }
            // Sanitize and encode parameter value
            const sanitizedValue = encodeURIComponent((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(stringValue));
            // Check for path traversal attempts
            if (sanitizedValue.includes('..') || sanitizedValue.includes('//')) {
                console.error("[buildApiUrl] Invalid parameter value (possible path traversal): ".concat(value));
                throw new Error("Invalid parameter value: ".concat(value));
            }
            // Replace the parameter in the URL
            const placeholder = ":".concat(key);
            if (url.includes(placeholder)) {
                url = url.replace(placeholder, sanitizedValue);
                console.log("[buildApiUrl] Replaced ".concat(placeholder, " -> ").concat(sanitizedValue));
            }
        });
    }
    // Check if all parameters were replaced
    const unreplacedParams = url.match(/:(\w+)/g);
    if (unreplacedParams && unreplacedParams.length > 0) {
        console.error('[buildApiUrl] ERROR: Unreplaced parameters found:', unreplacedParams);
        console.error('[buildApiUrl] Final URL:', url);
        console.error('[buildApiUrl] Original endpoint:', endpoint);
        console.error('[buildApiUrl] Provided params:', params);
        throw new Error("Missing required URL parameters: ".concat(unreplacedParams.join(', ')));
    }
    // Build full URL with base URL
    if ("TURBOPACK compile-time truthy", 1) {
        // Ensure API_BASE_URL doesn't end with a slash
        const baseUrl = API_BASE_URL.replace(/\/$/, '');
        // FIX: Check if baseUrl already contains /api path
        // If it does, don't add it again
        const hasApiPath = baseUrl.endsWith('/api') || baseUrl.includes('/api/');
        // Build the full URL (only add /api if not already present)
        const fullUrl = hasApiPath ? "".concat(baseUrl).concat(url) : "".concat(baseUrl, "/api").concat(url);
        // Sanitize the final URL
        const sanitizedUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(fullUrl);
        if (!sanitizedUrl) {
            console.error('[buildApiUrl] ERROR: Failed to sanitize URL:', fullUrl);
            throw new Error('Invalid API URL');
        }
        // Check URL length
        if (sanitizedUrl.length > REQUEST_CONFIG.MAX_URL_LENGTH) {
            console.error('[buildApiUrl] ERROR: URL too long:', sanitizedUrl.length);
            throw new Error('URL too long');
        }
        console.log('[buildApiUrl] SUCCESS: Built URL:', sanitizedUrl);
        return sanitizedUrl;
    }
    //TURBOPACK unreachable
    ;
};
// Generate unique request ID
function generateRequestId() {
    return "req_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
}
// Create a more robust API client with security
class ApiClient {
    static getInstance() {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient();
        }
        return ApiClient.instance;
    }
    /**
   * Cancel a specific request
   */ cancelRequest(key) {
        const controller = this.abortControllers.get(key);
        if (controller) {
            controller.abort();
            this.abortControllers.delete(key);
        }
        this.pendingRequests.delete(key);
    }
    /**
   * Cancel all pending requests
   */ cancelAllRequests() {
        this.abortControllers.forEach((controller)=>controller.abort());
        this.abortControllers.clear();
        this.pendingRequests.clear();
    }
    /**
   * Check rate limit
   */ checkRateLimit() {
        if ("TURBOPACK compile-time truthy", 1) return {
            allowed: true
        };
        //TURBOPACK unreachable
        ;
    }
    /**
   * Validate request options
   */ validateRequestOptions(options) {
        // Validate request method
        const allowedMethods = [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS'
        ];
        if (options.method && !allowedMethods.includes(options.method.toUpperCase())) {
            throw new Error('Invalid request method');
        }
        // Validate request body size
        if (options.body) {
            const bodySize = typeof options.body === 'string' ? new Blob([
                options.body
            ]).size : 0;
            if (bodySize > REQUEST_CONFIG.MAX_REQUEST_SIZE) {
                throw new Error('Request body too large');
            }
            // Validate JSON structure if content type is JSON
            if (typeof options.body === 'string' && options.headers && options.headers['Content-Type'] === 'application/json') {
                try {
                    JSON.parse(options.body);
                } catch (e) {
                    throw new Error('Invalid JSON in request body');
                }
            }
        }
        // Validate headers
        if (options.headers) {
            const headers = options.headers;
            let totalHeaderSize = 0;
            Object.entries(headers).forEach((param)=>{
                let [key, value] = param;
                // Prevent header injection
                if (key.includes('\n') || key.includes('\r') || value.includes('\n') || value.includes('\r')) {
                    throw new Error('Invalid header format');
                }
                // Check header size
                totalHeaderSize += key.length + value.length + 4; // +4 for ': ' and '\r\n'
                // Validate header names
                if (!/^[a-zA-Z0-9\-]+$/.test(key)) {
                    throw new Error("Invalid header name: ".concat(key));
                }
            });
            if (totalHeaderSize > REQUEST_CONFIG.MAX_HEADER_SIZE) {
                throw new Error('Headers too large');
            }
        }
    }
    /**
   * Sanitize response data
   */ sanitizeResponse(data) {
        // Basic sanitization for common attack vectors
        if (typeof data === 'string') {
            // Check for potential XSS in string responses
            try {
                const sanitized = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].sanitizeForDisplay(data, {
                    allowHtml: false,
                    allowMarkdown: false
                });
                return sanitized;
            } catch (error) {
                console.warn('Could not sanitize string response:', error);
                return data;
            }
        }
        if (typeof data === 'object' && data !== null) {
            // Sanitize object responses
            try {
                return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].sanitizeForAPI(data);
            } catch (error) {
                console.warn('Could not sanitize object response:', error);
                return data;
            }
        }
        return data;
    }
    /**
   * Validate response
   */ validateResponse(response) {
        // Check for suspicious response headers
        const suspiciousHeaders = [
            'X-Powered-By',
            'Server'
        ];
        suspiciousHeaders.forEach((header)=>{
            if (response.headers.has(header)) {
                console.warn("Suspicious header detected: ".concat(header));
            }
        });
        // Validate content type
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html') && !response.url.includes('.html')) {
            console.warn('Unexpected HTML response');
        }
    }
    /**
   * Get auth token from storage
   */ getAuthToken() {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        try {
            // Try sessionStorage first (where AuthContext stores tokens)
            const authTokens = sessionStorage.getItem('auth_tokens');
            if (authTokens) {
                const parsed = JSON.parse(authTokens);
                return parsed.token;
            }
            // Fallback to localStorage
            return localStorage.getItem('auth_token');
        } catch (error) {
            console.warn('Failed to get auth token:', error);
            return null;
        }
    }
    /**
   * Make an API call with abort capability and security
   */ async call(endpoint) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, requestKey = arguments.length > 2 ? arguments[2] : void 0;
        const requestId = generateRequestId();
        const startTime = Date.now();
        console.log('[ApiClient.call] Starting request:', {
            endpoint,
            method: options.method || 'GET',
            requestId
        });
        // Check for duplicate requests
        if (requestKey && this.pendingRequests.has(requestKey)) {
            console.warn('[ApiClient.call] Duplicate request detected:', requestKey);
            return {
                success: false,
                error: {
                    message: 'Request already in progress',
                    code: 'DUPLICATE_REQUEST'
                },
                meta: {
                    requestId
                }
            };
        }
        if (requestKey) {
            this.pendingRequests.add(requestKey);
        }
        // Check rate limit
        const rateLimitResult = this.checkRateLimit();
        if (!rateLimitResult.allowed) {
            this.pendingRequests.delete(requestKey || '');
            console.warn('[ApiClient.call] Rate limit exceeded');
            return {
                success: false,
                error: {
                    message: "Rate limit exceeded. Please wait ".concat(rateLimitResult.waitTime, " seconds."),
                    code: 'RATE_LIMIT_EXCEEDED'
                },
                meta: {
                    requestId
                }
            };
        }
        // Validate request options
        try {
            this.validateRequestOptions(options);
        } catch (error) {
            this.pendingRequests.delete(requestKey || '');
            console.error('[ApiClient.call] Invalid request options:', error);
            return {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Invalid request',
                    code: 'VALIDATION_ERROR'
                },
                meta: {
                    requestId
                }
            };
        }
        // Cancel previous request with same key if exists
        if (requestKey) {
            this.cancelRequest(requestKey);
        }
        // Create new abort controller
        const abortController = new AbortController();
        if (requestKey) {
            this.abortControllers.set(requestKey, abortController);
        }
        // Set timeout
        const timeoutId = setTimeout(()=>{
            console.warn('[ApiClient.call] Request timeout:', endpoint);
            abortController.abort();
        }, REQUEST_CONFIG.TIMEOUT);
        try {
            // Handle URL - if it's already a full URL, use it directly, otherwise build it
            let url;
            if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
                // Already a full URL (from buildApiUrl or direct call)
                url = endpoint;
                console.log('[ApiClient.call] Using full URL:', url);
            } else if (endpoint.startsWith('/')) {
                // Relative endpoint, build full URL
                url = buildApiUrl(endpoint);
                console.log('[ApiClient.call] Built URL from endpoint:', url);
            } else {
                // Invalid endpoint format
                console.error('[ApiClient.call] Invalid endpoint format:', endpoint);
                throw new Error('Invalid endpoint format - must start with / or be a full URL');
            }
            const token = this.getAuthToken();
            const headers = {
                ...getDefaultHeaders(),
                ...options.headers || {}
            };
            if (token) {
                headers['Authorization'] = "Bearer ".concat(token);
            }
            // Add request ID to headers
            headers['X-Request-ID'] = requestId;
            console.log("[ApiClient.call] Making request to: ".concat(url));
            console.log("[ApiClient.call] Method: ".concat(options.method || 'GET'));
            const response = await fetch(url, {
                ...options,
                headers,
                signal: abortController.signal,
                credentials: 'same-origin',
                mode: 'cors',
                redirect: 'follow'
            });
            clearTimeout(timeoutId);
            // Remove from active requests
            if (requestKey) {
                this.abortControllers.delete(requestKey);
                this.pendingRequests.delete(requestKey);
            }
            // Validate response
            this.validateResponse(response);
            let data;
            // Parse response based on content type
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Handle non-JSON responses
                const text = await response.text();
                console.warn('[ApiClient.call] Non-JSON response:', text);
                return {
                    success: false,
                    error: {
                        message: 'Invalid response format',
                        code: 'INVALID_CONTENT_TYPE'
                    },
                    meta: {
                        requestId
                    }
                };
            }
            const elapsed = Date.now() - startTime;
            console.log("[ApiClient.call] Response [".concat(response.status, "] in ").concat(elapsed, "ms:"), data);
            if (!response.ok) {
                // Log error for monitoring
                console.error("[ApiClient.call] API Error [".concat(response.status, "]:"), data.error || data);
                return {
                    success: false,
                    error: data.error || {
                        message: data.message || 'An error occurred',
                        code: String(response.status)
                    },
                    meta: {
                        requestId
                    }
                };
            }
            // Handle backend response format
            if (data.success !== undefined) {
                // Backend returns { success, data, error } format
                if (data.success) {
                    const sanitizedData = this.sanitizeResponse(data.data);
                    return {
                        success: true,
                        data: sanitizedData,
                        meta: {
                            ...data.meta,
                            requestId
                        }
                    };
                } else {
                    return {
                        success: false,
                        error: data.error || {
                            message: 'Unknown error'
                        },
                        meta: {
                            requestId
                        }
                    };
                }
            } else {
                // Backend returns data directly
                const sanitizedData = this.sanitizeResponse(data);
                return {
                    success: true,
                    data: sanitizedData,
                    meta: {
                        requestId
                    }
                };
            }
        } catch (error) {
            clearTimeout(timeoutId);
            // Remove from active requests
            if (requestKey) {
                this.abortControllers.delete(requestKey);
                this.pendingRequests.delete(requestKey);
            }
            // Handle abort errors
            if (error instanceof Error && error.name === 'AbortError') {
                console.warn('[ApiClient.call] Request aborted:', endpoint);
                return {
                    success: false,
                    error: {
                        message: 'Request timeout or cancelled',
                        code: 'REQUEST_ABORTED'
                    },
                    meta: {
                        requestId
                    }
                };
            }
            console.error('[ApiClient.call] API call error:', error);
            // Check for network errors
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                return {
                    success: false,
                    error: {
                        message: 'Network error. Please check your connection.',
                        code: 'NETWORK_ERROR'
                    },
                    meta: {
                        requestId
                    }
                };
            }
            return {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error occurred',
                    code: 'UNKNOWN_ERROR'
                },
                meta: {
                    requestId
                }
            };
        }
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "abortControllers", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "requestCount", 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "requestWindowStart", Date.now());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "pendingRequests", new Set());
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(ApiClient, "instance", void 0);
const apiClient = ApiClient.getInstance();
async function apiCall(endpoint) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    return apiClient.call(endpoint, options);
}
async function apiCallWithRetry(endpoint) {
    let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, maxRetries = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : REQUEST_CONFIG.RETRY_ATTEMPTS;
    let lastError;
    for(let i = 0; i < maxRetries; i++){
        const result = await apiCall(endpoint, options);
        if (result.success) {
            return result;
        }
        lastError = result.error;
        // Don't retry on client errors (4xx), rate limits, or validation errors
        if ((lastError === null || lastError === void 0 ? void 0 : lastError.code) && (lastError.code.startsWith('4') || lastError.code === 'RATE_LIMIT_EXCEEDED' || lastError.code === 'VALIDATION_ERROR' || lastError.code === 'DUPLICATE_REQUEST')) {
            return result;
        }
        // Exponential backoff with jitter
        if (i < maxRetries - 1) {
            const baseDelay = Math.min(REQUEST_CONFIG.RETRY_DELAY * Math.pow(2, i), 10000);
            const jitter = Math.random() * 0.3 * baseDelay; // 30% jitter
            const delay = baseDelay + jitter;
            await new Promise((resolve)=>setTimeout(resolve, delay));
        }
    }
    return {
        success: false,
        error: lastError || {
            message: 'Max retries exceeded',
            code: 'MAX_RETRIES'
        }
    };
}
async function checkApiHealth() {
    try {
        var _response_data;
        const response = await apiCall('/health', {
            method: 'GET'
        });
        return response.success && ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.status) === 'ok';
    } catch (e) {
        return false;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/environment.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
}),
"[project]/src/services/storage.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/storage.service.ts
__turbopack_context__.s({
    "StorageService": ()=>StorageService,
    "storageService": ()=>storageService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
;
;
;
;
;
// Constants for security limits
const STORAGE_LIMITS = {
    MAX_KEY_LENGTH: 100,
    MAX_VALUE_SIZE: 1 * 1024 * 1024,
    MAX_TOTAL_SIZE: 5 * 1024 * 1024,
    MAX_KEYS: 1000,
    MAX_BATCH_SIZE: 50,
    ALLOWED_KEY_PATTERN: /^[a-zA-Z0-9_-]+$/,
    RESERVED_PREFIXES: [
        'system_',
        'internal_'
    ],
    // Allow these specific system keys that the app uses
    ALLOWED_SYSTEM_KEYS: [
        '__walletMockDataCleared__',
        '__lastSyncTime__',
        '__initialized__',
        'currentUser',
        'session_fingerprint',
        'auth_token',
        'refresh_token',
        'auth_token_data',
        'panty_custom_requests'
    ]
};
// Validation schemas
const storageKeySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Key cannot be empty').max(STORAGE_LIMITS.MAX_KEY_LENGTH, "Key cannot exceed ".concat(STORAGE_LIMITS.MAX_KEY_LENGTH, " characters")).regex(STORAGE_LIMITS.ALLOWED_KEY_PATTERN, 'Key contains invalid characters').refine((key)=>{
    // Allow specific system keys
    if (STORAGE_LIMITS.ALLOWED_SYSTEM_KEYS.includes(key)) {
        return true;
    }
    // Otherwise check for reserved prefixes
    return !STORAGE_LIMITS.RESERVED_PREFIXES.some((prefix)=>key.startsWith(prefix));
}, {
    message: 'Key uses reserved prefix'
});
class StorageService {
    /**
   * Validate storage key
   */ validateKey(key) {
        const result = storageKeySchema.safeParse(key);
        if (!result.success) {
            var _result_error_errors_;
            throw new Error("Invalid storage key: ".concat((_result_error_errors_ = result.error.errors[0]) === null || _result_error_errors_ === void 0 ? void 0 : _result_error_errors_.message));
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(result.data);
    }
    /**
   * Check if value size is within limits
   */ validateValueSize(value) {
        const serialized = JSON.stringify(value);
        if (serialized.length > STORAGE_LIMITS.MAX_VALUE_SIZE) {
            throw new Error("Value size exceeds limit of ".concat(STORAGE_LIMITS.MAX_VALUE_SIZE / 1024, "KB"));
        }
    }
    /**
   * Check storage quota before writing
   */ async checkStorageQuota() {
        const info = await this.getStorageInfo();
        if (info.percentage > 90) {
            throw new Error('Storage quota exceeded (90% full)');
        }
    }
    /**
   * Check if this is an auth-related operation
   */ isAuthOperation(key) {
        const authKeys = [
            'currentUser',
            'auth_token',
            'refresh_token',
            'auth_token_data',
            'session_fingerprint'
        ];
        return authKeys.includes(key);
    }
    /**
   * Check rate limit for auth operations (more lenient)
   */ checkAuthRateLimit() {
        const now = Date.now();
        // Reset counter every minute
        if (now - StorageService.authOperationResetTime > 60000) {
            StorageService.authOperationCount = 0;
            StorageService.authOperationResetTime = now;
        }
        // Allow up to 500 auth operations per minute for testing
        if (StorageService.authOperationCount >= 500) {
            return false;
        }
        StorageService.authOperationCount++;
        return true;
    }
    /**
   * Execute a function with retry logic
   */ async withRetry(operation) {
        let maxRetries = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 3, delay = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 100;
        let lastError = null;
        for(let i = 0; i < maxRetries; i++){
            try {
                return operation();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    await new Promise((resolve)=>setTimeout(resolve, delay * Math.pow(2, i)));
                }
            }
        }
        throw lastError || new Error('Operation failed after retries');
    }
    /**
   * Process queued operations sequentially
   */ async processQueue() {
        if (StorageService.isProcessingQueue || StorageService.operationQueue.length === 0) {
            return;
        }
        StorageService.isProcessingQueue = true;
        while(StorageService.operationQueue.length > 0){
            const operation = StorageService.operationQueue.shift();
            if (operation) {
                try {
                    await operation();
                } catch (error) {
                    console.error('Queue operation failed:', error);
                }
            }
        }
        StorageService.isProcessingQueue = false;
    }
    /**
   * Queue an operation to prevent race conditions
   */ async queueOperation(operation, key) {
        // For auth operations, use more lenient rate limiting
        if (key && this.isAuthOperation(key)) {
            if (!this.checkAuthRateLimit()) {
                throw new Error('Auth operation rate limit exceeded. Please wait a moment.');
            }
        } else {
            // Check rate limit for non-auth storage operations
            const rateLimitResult = this.rateLimiter.check('API_CALL', {
                ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].API_CALL,
                maxAttempts: 1000,
                windowMs: 60 * 1000 // 1 minute window
            });
            if (!rateLimitResult.allowed) {
                throw new Error("Rate limit exceeded. Please wait ".concat(rateLimitResult.waitTime, " seconds."));
            }
        }
        return new Promise((resolve, reject)=>{
            StorageService.operationQueue.push(async ()=>{
                try {
                    const result = await operation();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });
            // Start processing queue if not already processing
            this.processQueue();
        });
    }
    /**
   * Get item from storage with validation
   */ async getItem(key, defaultValue) {
        try {
            // Validate key
            const validatedKey = this.validateKey(key);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_MOCK_API) {
                await new Promise((resolve)=>setTimeout(resolve, 50));
            }
            const item = await this.withRetry(()=>localStorage.getItem(validatedKey));
            if (item === null) {
                return defaultValue;
            }
            try {
                const parsed = JSON.parse(item);
                // Sanitize the retrieved data
                const sanitized = this.sanitizeStoredData(parsed);
                // Validate the parsed data matches expected type structure
                if (this.isValidData(sanitized, defaultValue)) {
                    return sanitized;
                } else {
                    console.warn('Invalid data structure for key "'.concat(validatedKey, '", using default'));
                    return defaultValue;
                }
            } catch (parseError) {
                console.error('Error parsing item "'.concat(validatedKey, '":'), parseError);
                // Try to parse as number for backward compatibility
                if (typeof defaultValue === 'number' && !isNaN(Number(item))) {
                    return Number(item);
                }
                return defaultValue;
            }
        } catch (error) {
            console.error('Error getting item "'.concat(key, '" from storage:'), error);
            return defaultValue;
        }
    }
    /**
   * Set item in storage with queuing
   */ async setItem(key, value) {
        return this.queueOperation(async ()=>{
            try {
                // Validate key
                const validatedKey = this.validateKey(key);
                // Validate value size
                this.validateValueSize(value);
                // Check storage quota
                await this.checkStorageQuota();
                if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_MOCK_API) {
                    await new Promise((resolve)=>setTimeout(resolve, 50));
                }
                const serialized = JSON.stringify(value);
                await this.withRetry(()=>{
                    localStorage.setItem(validatedKey, serialized);
                    // Verify write was successful
                    const verification = localStorage.getItem(validatedKey);
                    if (verification !== serialized) {
                        throw new Error('Storage write verification failed');
                    }
                });
                return true;
            } catch (error) {
                console.error('Error setting item "'.concat(key, '" in storage:'), error);
                return false;
            }
        }, key);
    }
    /**
   * Remove item from storage
   */ async removeItem(key) {
        return this.queueOperation(async ()=>{
            try {
                // Validate key
                const validatedKey = this.validateKey(key);
                if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_MOCK_API) {
                    await new Promise((resolve)=>setTimeout(resolve, 20));
                }
                await this.withRetry(()=>localStorage.removeItem(validatedKey));
                return true;
            } catch (error) {
                console.error('Error removing item "'.concat(key, '" from storage:'), error);
                return false;
            }
        }, key);
    }
    /**
   * Begin a transaction for atomic operations
   */ beginTransaction() {
        if (StorageService.transactionInProgress) {
            throw new Error('Another transaction is already in progress');
        }
        StorageService.transactionInProgress = true;
        return {
            operations: [],
            backup: new Map()
        };
    }
    /**
   * Commit a transaction atomically
   */ async commitTransaction(transaction) {
        try {
            // Validate all operations first
            for (const op of transaction.operations){
                this.validateKey(op.key);
                if (op.type === 'set' && op.value !== undefined) {
                    this.validateValueSize(op.value);
                }
            }
            // Check storage quota
            await this.checkStorageQuota();
            // Backup current values
            for (const op of transaction.operations){
                if (op.type === 'set' || op.type === 'remove') {
                    const currentValue = localStorage.getItem(op.key);
                    transaction.backup.set(op.key, currentValue);
                }
            }
            // Execute all operations
            for (const op of transaction.operations){
                if (op.type === 'set') {
                    localStorage.setItem(op.key, JSON.stringify(op.value));
                } else if (op.type === 'remove') {
                    localStorage.removeItem(op.key);
                }
            }
            return true;
        } catch (error) {
            // Rollback on error
            console.error('Transaction failed, rolling back:', error);
            await this.rollbackTransaction(transaction);
            return false;
        } finally{
            StorageService.transactionInProgress = false;
        }
    }
    /**
   * Rollback a transaction
   */ async rollbackTransaction(transaction) {
        try {
            for (const [key, value] of transaction.backup.entries()){
                if (value === null) {
                    localStorage.removeItem(key);
                } else {
                    localStorage.setItem(key, value);
                }
            }
        } catch (error) {
            console.error('Rollback failed:', error);
        }
    }
    /**
   * Update specific fields of an object in storage atomically
   */ async updateItem(key, updates) {
        return this.queueOperation(async ()=>{
            try {
                // Validate key
                const validatedKey = this.validateKey(key);
                const current = await this.getItem(validatedKey, null);
                if (current === null) {
                    return await this.setItem(validatedKey, updates);
                }
                const updated = {
                    ...current,
                    ...updates
                };
                return await this.setItem(validatedKey, updated);
            } catch (error) {
                console.error('Error updating item "'.concat(key, '" in storage:'), error);
                return false;
            }
        }, key);
    }
    /**
   * Get all keys matching a pattern
   */ async getKeys(pattern) {
        try {
            // Validate and sanitize pattern to prevent regex injection
            const sanitizedPattern = pattern ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(pattern).substring(0, 50) : undefined;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_MOCK_API) {
                await new Promise((resolve)=>setTimeout(resolve, 20));
            }
            const keys = [];
            const totalKeys = localStorage.length;
            // Limit the number of keys to prevent DoS
            if (totalKeys > STORAGE_LIMITS.MAX_KEYS) {
                console.warn("Storage contains ".concat(totalKeys, " keys, limiting to ").concat(STORAGE_LIMITS.MAX_KEYS));
            }
            for(let i = 0; i < Math.min(totalKeys, STORAGE_LIMITS.MAX_KEYS); i++){
                const key = localStorage.key(i);
                if (key && (!sanitizedPattern || key.includes(sanitizedPattern))) {
                    // Only return keys that pass validation
                    try {
                        this.validateKey(key);
                        keys.push(key);
                    } catch (e) {
                    // Skip invalid keys
                    }
                }
            }
            return keys;
        } catch (error) {
            console.error('Error getting keys from storage:', error);
            return [];
        }
    }
    /**
   * Check if key exists
   */ async hasKey(key) {
        try {
            // Validate key
            const validatedKey = this.validateKey(key);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_MOCK_API) {
                await new Promise((resolve)=>setTimeout(resolve, 10));
            }
            return localStorage.getItem(validatedKey) !== null;
        } catch (error) {
            console.error('Error checking if key "'.concat(key, '" exists:'), error);
            return false;
        }
    }
    /**
   * Clear all storage
   */ async clear(preserveKeys) {
        return this.queueOperation(async ()=>{
            try {
                // Validate preserve keys
                const validatedPreserveKeys = preserveKeys === null || preserveKeys === void 0 ? void 0 : preserveKeys.map((key)=>this.validateKey(key));
                if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_MOCK_API) {
                    await new Promise((resolve)=>setTimeout(resolve, 100));
                }
                if (validatedPreserveKeys && validatedPreserveKeys.length > 0) {
                    // Preserve specified keys
                    const preserved = {};
                    for (const key of validatedPreserveKeys){
                        const value = localStorage.getItem(key);
                        if (value !== null) {
                            preserved[key] = value;
                        }
                    }
                    localStorage.clear();
                    // Restore preserved keys
                    for (const [key, value] of Object.entries(preserved)){
                        localStorage.setItem(key, value);
                    }
                } else {
                    localStorage.clear();
                }
                return true;
            } catch (error) {
                console.error('Error clearing storage:', error);
                return false;
            }
        });
    }
    /**
   * Get storage size information
   */ async getStorageInfo() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage || 0,
                    quota: estimate.quota || 0,
                    percentage: estimate.quota ? (estimate.usage || 0) / estimate.quota * 100 : 0
                };
            }
            // Fallback calculation
            let totalSize = 0;
            let keyCount = 0;
            for(let i = 0; i < localStorage.length && i < STORAGE_LIMITS.MAX_KEYS; i++){
                const key = localStorage.key(i);
                if (key) {
                    totalSize += key.length + (localStorage.getItem(key) || '').length;
                    keyCount++;
                }
            }
            return {
                used: totalSize,
                quota: STORAGE_LIMITS.MAX_TOTAL_SIZE,
                percentage: totalSize / STORAGE_LIMITS.MAX_TOTAL_SIZE * 100
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return {
                used: 0,
                quota: 0,
                percentage: 0
            };
        }
    }
    /**
   * Batch set multiple items atomically
   */ async batchSet(items) {
        // Limit batch size to prevent DoS
        if (items.length > STORAGE_LIMITS.MAX_BATCH_SIZE) {
            throw new Error("Batch size exceeds limit of ".concat(STORAGE_LIMITS.MAX_BATCH_SIZE, " items"));
        }
        const transaction = this.beginTransaction();
        for (const item of items){
            transaction.operations.push({
                type: 'set',
                key: item.key,
                value: item.value
            });
        }
        return this.commitTransaction(transaction);
    }
    /**
   * Validate data structure matches expected type
   */ isValidData(data, defaultValue) {
        // If default is null, accept any non-null value
        if (defaultValue === null) {
            return data !== null && data !== undefined;
        }
        // For primitive types (string, number, boolean), just check type
        const primitiveTypes = [
            'string',
            'number',
            'boolean'
        ];
        if (primitiveTypes.includes(typeof defaultValue)) {
            return typeof data === typeof defaultValue;
        }
        // Array validation
        if (Array.isArray(defaultValue)) {
            return Array.isArray(data);
        }
        // Object validation
        if (typeof defaultValue === 'object') {
            if (data === null || typeof data !== 'object') {
                return false;
            }
            // Check if critical keys exist
            const defaultKeys = Object.keys(defaultValue);
            // Allow data to have more keys than default (for backward compatibility)
            // but it must have at least the default keys
            for (const key of defaultKeys){
                if (!(key in data)) {
                    return false;
                }
            }
        }
        return true;
    }
    /**
   * Sanitize data retrieved from storage
   */ sanitizeStoredData(data) {
        if (data === null || data === undefined) {
            return data;
        }
        if (typeof data === 'string') {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(data);
        }
        if (typeof data === 'object') {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeObject"])(data, {
                maxDepth: 10,
                keySanitizer: (key)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(key),
                valueSanitizer: (value)=>{
                    if (typeof value === 'string') {
                        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(value);
                    }
                    return value;
                }
            });
        }
        return data;
    }
    /**
   * Export all wallet data for backup
   */ async exportWalletData() {
        // Check rate limit for export operations
        const rateLimitResult = this.rateLimiter.check('API_CALL', {
            maxAttempts: 5,
            windowMs: 60 * 60 * 1000 // 5 exports per hour
        });
        if (!rateLimitResult.allowed) {
            throw new Error("Export rate limit exceeded. Please wait ".concat(rateLimitResult.waitTime, " seconds."));
        }
        const walletKeys = await this.getKeys('wallet_');
        const data = {};
        // Limit export size
        let exportSize = 0;
        const maxExportSize = 2 * 1024 * 1024; // 2MB limit for exports
        for (const key of walletKeys){
            const value = await this.getItem(key, null);
            if (value !== null) {
                const serialized = JSON.stringify(value);
                exportSize += serialized.length;
                if (exportSize > maxExportSize) {
                    throw new Error('Export size exceeds 2MB limit');
                }
                data[key] = value;
            }
        }
        return data;
    }
    /**
   * Import wallet data from backup
   */ async importWalletData(data) {
        try {
            // Validate import data structure
            if (!data || typeof data !== 'object') {
                throw new Error('Invalid import data format');
            }
            // Check rate limit for import operations
            const rateLimitResult = this.rateLimiter.check('API_CALL', {
                maxAttempts: 3,
                windowMs: 60 * 60 * 1000 // 3 imports per hour
            });
            if (!rateLimitResult.allowed) {
                throw new Error("Import rate limit exceeded. Please wait ".concat(rateLimitResult.waitTime, " seconds."));
            }
            // Validate and sanitize all keys and values
            const items = [];
            for (const [key, value] of Object.entries(data)){
                // Only allow wallet_ prefixed keys
                if (!key.startsWith('wallet_')) {
                    console.warn("Skipping non-wallet key during import: ".concat(key));
                    continue;
                }
                try {
                    const validatedKey = this.validateKey(key);
                    const sanitizedValue = this.sanitizeStoredData(value);
                    items.push({
                        key: validatedKey,
                        value: sanitizedValue
                    });
                } catch (error) {
                    console.error('Failed to import key "'.concat(key, '":'), error);
                }
            }
            if (items.length === 0) {
                throw new Error('No valid data to import');
            }
            return await this.batchSet(items);
        } catch (error) {
            console.error('Error importing wallet data:', error);
            return false;
        }
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "rateLimiter", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])());
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(StorageService, "transactionInProgress", false);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(StorageService, "operationQueue", []);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(StorageService, "isProcessingQueue", false);
// Track auth-related operations separately with more lenient limits
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(StorageService, "authOperationCount", 0);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(StorageService, "authOperationResetTime", 0);
const storageService = new StorageService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/auth.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/auth.service.ts
__turbopack_context__.s({
    "AuthService": ()=>AuthService,
    "authService": ()=>authService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
;
;
;
class AuthService {
    /**
   * Initialize fetch interceptor for auth headers
   */ initializeInterceptor() {
        const originalFetch = window.fetch;
        window.fetch = async (input, init)=>{
            const token = await this.getValidToken();
            if (token && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"]) {
                const url = typeof input === 'string' ? input : input.toString();
                if (url.startsWith(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"])) {
                    init = init || {};
                    init.headers = {
                        ...init.headers,
                        'Authorization': "Bearer ".concat(token)
                    };
                }
            }
            const response = await originalFetch(input, init);
            // Handle 401 responses
            if (response.status === 401) {
                if (!this.isRefreshing) {
                    this.isRefreshing = true;
                    try {
                        const refreshResult = await this.refreshToken();
                        if (refreshResult.success && refreshResult.data) {
                            await this.storeTokens(refreshResult.data.token, refreshResult.data.refreshToken);
                            this.refreshSubscribers.forEach((callback)=>callback(refreshResult.data.token));
                            this.refreshSubscribers = [];
                            if (init === null || init === void 0 ? void 0 : init.headers) {
                                init.headers['Authorization'] = "Bearer ".concat(refreshResult.data.token);
                            }
                            return originalFetch(input, init);
                        } else {
                            await this.logout();
                            window.location.href = '/login';
                        }
                    } finally{
                        this.isRefreshing = false;
                    }
                } else {
                    return new Promise((resolve)=>{
                        this.refreshSubscribers.push((token)=>{
                            if (init === null || init === void 0 ? void 0 : init.headers) {
                                init.headers['Authorization'] = "Bearer ".concat(token);
                            }
                            resolve(originalFetch(input, init));
                        });
                    });
                }
            }
            return response;
        };
    }
    /**
   * Get valid token from storage
   */ async getValidToken() {
        const token = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AUTH_TOKEN_KEY"], null);
        return token;
    }
    /**
   * Store tokens securely
   */ async storeTokens(token, refreshToken) {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AUTH_TOKEN_KEY"], token);
        if (refreshToken) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["REFRESH_TOKEN_KEY"], refreshToken);
        }
    }
    /**
   * Initialize session persistence
   */ async initializeSessionPersistence() {
        try {
            const token = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AUTH_TOKEN_KEY"], null);
            const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('currentUser', null);
            if (token && user) {
                const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].AUTH.ME);
                if (result.success && result.data) {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('currentUser', result.data);
                    this.setupTokenRefreshTimer();
                } else {
                    await this.clearAuthState();
                }
            }
        } catch (error) {
            console.error('Session persistence error:', error);
        }
    }
    /**
   * Set up automatic token refresh
   */ setupTokenRefreshTimer() {
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
        }
        this.tokenRefreshTimer = setTimeout(async ()=>{
            const result = await this.refreshToken();
            if (result.success) {
                this.setupTokenRefreshTimer();
            }
        }, this.TOKEN_REFRESH_INTERVAL);
    }
    /**
   * Clear authentication state
   */ async clearAuthState() {
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].removeItem('currentUser');
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].removeItem(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AUTH_TOKEN_KEY"]);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].removeItem(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["REFRESH_TOKEN_KEY"]);
        if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer);
            this.tokenRefreshTimer = null;
        }
    }
    /**
   * Login user
   */ async login(request) {
        try {
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].AUTH.LOGIN, {
                method: 'POST',
                body: JSON.stringify({
                    username: request.username,
                    password: request.password,
                    role: request.role
                })
            });
            if (response.success && response.data) {
                if (response.data.token) {
                    await this.storeTokens(response.data.token, response.data.refreshToken);
                }
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('currentUser', response.data.user);
                this.setupTokenRefreshTimer();
            }
            return response;
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: {
                    message: 'Login failed. Please try again.'
                }
            };
        }
    }
    /**
   * Sign up new user
   */ async signup(request) {
        try {
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].AUTH.SIGNUP, {
                method: 'POST',
                body: JSON.stringify(request)
            });
            if (response.success && response.data) {
                if (response.data.token) {
                    await this.storeTokens(response.data.token, response.data.refreshToken);
                }
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('currentUser', response.data.user);
                this.setupTokenRefreshTimer();
            }
            return response;
        } catch (error) {
            console.error('Signup error:', error);
            return {
                success: false,
                error: {
                    message: 'Signup failed. Please try again.'
                }
            };
        }
    }
    /**
   * Logout current user
   */ async logout() {
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].AUTH.LOGOUT, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Logout API error:', error);
        }
        await this.clearAuthState();
        return {
            success: true
        };
    }
    /**
   * Get current authenticated user
   */ async getCurrentUser() {
        try {
            const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('currentUser', null);
            if (!user) {
                return {
                    success: true,
                    data: null
                };
            }
            const token = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AUTH_TOKEN_KEY"], null);
            if (!token) {
                return {
                    success: true,
                    data: null
                };
            }
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].AUTH.ME);
            if (response.success && response.data) {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('currentUser', response.data);
                return response;
            }
            return {
                success: true,
                data: user
            };
        } catch (error) {
            console.error('Get current user error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get current user'
                }
            };
        }
    }
    /**
   * Update current user
   */ async updateCurrentUser(updates) {
        try {
            const currentUserResult = await this.getCurrentUser();
            if (!currentUserResult.success || !currentUserResult.data) {
                return {
                    success: false,
                    error: {
                        message: 'No user to update'
                    }
                };
            }
            const currentUser = currentUserResult.data;
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].USERS.UPDATE_PROFILE, {
                username: currentUser.username
            }), {
                method: 'PATCH',
                body: JSON.stringify(updates)
            });
            if (response.success && response.data) {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('currentUser', response.data);
            }
            return response;
        } catch (error) {
            console.error('Update user error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to update user'
                }
            };
        }
    }
    /**
   * Check if username is available
   */ async checkUsername(username) {
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].AUTH.VERIFY_USERNAME, "?username=").concat(encodeURIComponent(username)));
        } catch (error) {
            console.error('Check username error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to check username availability'
                }
            };
        }
    }
    /**
   * Refresh authentication token
   */ async refreshToken() {
        try {
            const refreshToken = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["REFRESH_TOKEN_KEY"], null);
            if (!refreshToken) {
                return {
                    success: false,
                    error: {
                        message: 'No refresh token available'
                    }
                };
            }
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].AUTH.REFRESH, {
                method: 'POST',
                body: JSON.stringify({
                    refreshToken
                })
            });
            if (response.success && response.data) {
                await this.storeTokens(response.data.token, response.data.refreshToken);
            }
            return response;
        } catch (error) {
            console.error('Refresh token error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to refresh token'
                }
            };
        }
    }
    /**
   * Check if user is authenticated
   */ async isAuthenticated() {
        const token = await this.getValidToken();
        return !!token;
    }
    /**
   * Get stored auth token
   */ async getAuthToken() {
        return this.getValidToken();
    }
    /**
   * Request password reset
   */ async forgotPassword(email) {
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].AUTH.FORGOT_PASSWORD, {
                method: 'POST',
                body: JSON.stringify({
                    email
                })
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to process password reset request. Please try again.'
                }
            };
        }
    }
    /**
   * Reset password with token
   */ async resetPassword(token, newPassword) {
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].AUTH.RESET_PASSWORD, {
                method: 'POST',
                body: JSON.stringify({
                    token,
                    newPassword
                })
            });
        } catch (error) {
            console.error('Reset password error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to reset password. Please try again.'
                }
            };
        }
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "tokenRefreshTimer", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "isRefreshing", false);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "refreshSubscribers", []);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "TOKEN_REFRESH_INTERVAL", 25 * 60 * 1000); // 25 minutes
        if ("TURBOPACK compile-time truthy", 1) {
            this.initializeInterceptor();
            this.initializeSessionPersistence();
        }
    }
}
const authService = new AuthService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/users.service.enhanced.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/users.service.enhanced.ts
__turbopack_context__.s({
    "EnhancedUsersService": ()=>EnhancedUsersService,
    "enhancedUsersService": ()=>enhancedUsersService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/users.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
// Cache configuration
const CACHE_CONFIG = {
    USER_TTL: 5 * 60 * 1000,
    PROFILE_TTL: 3 * 60 * 1000,
    LIST_TTL: 60 * 1000
};
// Security limits
const SECURITY_LIMITS = {
    MAX_BATCH_SIZE: 100,
    MAX_QUERY_LENGTH: 100,
    MAX_PAGE_SIZE: 100,
    MAX_ACTIVITY_HISTORY: 1000,
    MAX_GALLERY_IMAGES: 20,
    MAX_FILE_SIZE: 5 * 1024 * 1024
};
// Custom validator for profile picture URLs that accepts placeholders
const profilePicValidator = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine((val)=>{
    // Accept null/empty
    if (!val || val === '') return true;
    // Accept placeholder URLs
    if (val.includes('placeholder')) return true;
    // Accept relative URLs from backend
    if (val.startsWith('/uploads/')) return true;
    // Validate standard URLs
    try {
        const url = new URL(val);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
        return false;
    }
}, {
    message: 'Invalid profile picture URL'
});
// Custom validator for gallery images
const galleryImageValidator = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().refine((val)=>{
    // Accept relative URLs from backend
    if (val.startsWith('/uploads/')) return true;
    // Validate standard URLs
    try {
        const url = new URL(val);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (e) {
        return false;
    }
}, {
    message: 'Invalid gallery image URL'
});
// Validation schemas (local to this file)
const userSearchSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    query: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(SECURITY_LIMITS.MAX_QUERY_LENGTH).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional(),
    role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'buyer',
        'seller',
        'admin'
    ]).optional(),
    verified: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    tier: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'Tease',
        'Flirt',
        'Obsession',
        'Desire',
        'Goddess'
    ]).optional(),
    minRating: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(5).optional(),
    hasListings: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    isActive: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    sortBy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'username',
        'joinDate',
        'rating',
        'sales',
        'lastActive'
    ]).optional(),
    sortOrder: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'asc',
        'desc'
    ]).optional(),
    page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).optional(),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(SECURITY_LIMITS.MAX_PAGE_SIZE).optional()
});
const userProfileUpdateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    bio: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional(),
    profilePic: profilePicValidator.nullable().optional(),
    // Always KEEP this as string; convert numbers to string before sending
    subscriptionPrice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    galleryImages: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(galleryImageValidator).max(SECURITY_LIMITS.MAX_GALLERY_IMAGES).optional(),
    socialLinks: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        twitter: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"]).optional(),
        instagram: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"]).optional(),
        tiktok: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"]).optional(),
        website: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"]).optional()
    }).optional()
});
const userPreferencesSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    notifications: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        messages: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        orders: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        promotions: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        newsletters: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
    }).partial(),
    privacy: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        showOnlineStatus: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        allowDirectMessages: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
        profileVisibility: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'public',
            'subscribers',
            'private'
        ])
    }).partial(),
    language: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(10),
    currency: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(10),
    timezone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(50)
}).partial();
const verificationRequestSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    codePhoto: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    idFront: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    idBack: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    passport: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
    code: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(20).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional(),
    submittedAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime().optional()
});
const activitySchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    userId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"]),
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'login',
        'profile_update',
        'listing_created',
        'order_placed',
        'message_sent'
    ]),
    details: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).optional(),
    ipAddress: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    userAgent: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
/**
 * Helpers – enforce string types for storage & profile fields
 */ function toStringSafe(val) {
    let fallback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : '';
    if (val === undefined || val === null) return fallback;
    return String(val);
}
function toPriceString(val) {
    // normalize numbers or strings into a valid price string; caller ensures regex match if needed
    if (typeof val === 'number') return String(val);
    return toStringSafe(val, '0');
}
function sanitizeUrlOrUndefined(url) {
    const s = typeof url === 'string' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(url) : null;
    return s || undefined;
}
function sanitizeUrlOrNull(url) {
    // Special handling for placeholder URLs
    if (typeof url === 'string' && url.includes('placeholder')) {
        return url;
    }
    const s = typeof url === 'string' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(url) : null;
    return s || null;
}
class EnhancedUsersService {
    // Clear cache methods
    clearUserCache(username) {
        if (username) {
            this.userCache.delete(username);
            this.profileCache.delete(username);
        } else {
            this.userCache.clear();
            this.profileCache.clear();
        }
        this.listCache.clear();
    }
    /**
   * Get user with caching and deduplication
   */ async getUser(username) {
        try {
            // Validate username
            if (!username || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(username)) {
                console.error('[EnhancedUsersService.getUser] Invalid username:', username);
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].INVALID_USERNAME,
                        message: 'Invalid username format',
                        field: 'username'
                    }
                };
            }
            // Sanitize username
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            console.log('[EnhancedUsersService.getUser] Getting user:', sanitizedUsername);
            // Check cache first
            const cached = this.userCache.get(sanitizedUsername);
            if (cached && cached.expiresAt > Date.now()) {
                console.log('[EnhancedUsersService.getUser] Returning cached user');
                return {
                    success: true,
                    data: cached.data
                };
            }
            // Check for pending request
            const pendingKey = "user:".concat(sanitizedUsername);
            if (this.pendingRequests.has(pendingKey)) {
                console.log('[EnhancedUsersService.getUser] Awaiting pending request');
                return await this.pendingRequests.get(pendingKey);
            }
            // Create new request
            const request = this._fetchUser(sanitizedUsername);
            this.pendingRequests.set(pendingKey, request);
            try {
                const result = await request;
                this.pendingRequests.delete(pendingKey);
                return result;
            } catch (error) {
                this.pendingRequests.delete(pendingKey);
                throw error;
            }
        } catch (error) {
            console.error('[EnhancedUsersService.getUser] Error:', error);
            return {
                success: false,
                error: {
                    code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].NETWORK_ERROR,
                    message: 'Failed to get user'
                }
            };
        }
    }
    async _fetchUser(username) {
        console.log('[EnhancedUsersService._fetchUser] Fetching user:', username);
        if (!username) {
            console.error('[EnhancedUsersService._fetchUser] Username is empty');
            return {
                success: false,
                error: {
                    code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].INVALID_USERNAME,
                    message: 'Username is required'
                }
            };
        }
        if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
            // Build URL directly to avoid parameter issues
            const url = "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/users/").concat(encodeURIComponent(username), "/profile");
            console.log('[EnhancedUsersService._fetchUser] API URL:', url);
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(url);
            if (response.success && response.data) {
                // Sanitize user data
                const sanitizedUser = this.sanitizeUserData(response.data);
                // Cache the result
                this.userCache.set(username, {
                    data: sanitizedUser,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + CACHE_CONFIG.USER_TTL
                });
                return {
                    ...response,
                    data: sanitizedUser
                };
            }
            return response;
        }
        // LocalStorage implementation
        const allUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('all_users_v2', {});
        const user = allUsers[username] || null;
        if (user) {
            // Sanitize user data
            const sanitizedUser = this.sanitizeUserData(user);
            // Cache the result
            this.userCache.set(username, {
                data: sanitizedUser,
                timestamp: Date.now(),
                expiresAt: Date.now() + CACHE_CONFIG.USER_TTL
            });
            return {
                success: true,
                data: sanitizedUser
            };
        }
        return {
            success: true,
            data: null
        };
    }
    /**
   * Get users with advanced filtering and caching
   */ async getUsers(params) {
        try {
            // Validate and sanitize params
            let validatedParams;
            if (params) {
                const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(userSearchSchema, params);
                if (!validation.success) {
                    return {
                        success: false,
                        error: {
                            code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                            message: 'Invalid search parameters'
                        }
                    };
                }
                validatedParams = validation.data;
            }
            // Create cache key from params
            const cacheKey = "users:".concat(JSON.stringify(validatedParams || {}));
            const cached = this.listCache.get(cacheKey);
            if (cached && cached.expiresAt > Date.now()) {
                return {
                    success: true,
                    data: cached.data
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const queryParams = new URLSearchParams();
                if (validatedParams) {
                    Object.entries(validatedParams).forEach((param)=>{
                        let [key, value] = param;
                        if (value !== undefined) {
                            queryParams.append(key, String(value));
                        }
                    });
                }
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].USERS.LIST, "?").concat(queryParams.toString()));
                if (response.success && response.data) {
                    // Handle both response formats
                    let sanitizedResponse;
                    if (Array.isArray(response.data)) {
                        // Backend returns array directly
                        const sanitizedUsers = response.data.map((u)=>this.sanitizeUserData(u));
                        sanitizedResponse = {
                            users: sanitizedUsers,
                            total: sanitizedUsers.length,
                            page: (validatedParams === null || validatedParams === void 0 ? void 0 : validatedParams.page) || 1,
                            totalPages: 1
                        };
                    } else {
                        var _response_data_users;
                        // Backend returns UsersResponse object
                        const sanitizedUsers = ((_response_data_users = response.data.users) === null || _response_data_users === void 0 ? void 0 : _response_data_users.map((u)=>this.sanitizeUserData(u))) || [];
                        sanitizedResponse = {
                            ...response.data,
                            users: sanitizedUsers
                        };
                    }
                    // Cache the result
                    this.listCache.set(cacheKey, {
                        data: sanitizedResponse,
                        expiresAt: Date.now() + CACHE_CONFIG.LIST_TTL
                    });
                    return {
                        success: true,
                        data: sanitizedResponse,
                        error: response.error,
                        meta: response.meta
                    };
                }
                return {
                    success: false,
                    error: response.error || {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].NETWORK_ERROR,
                        message: 'Failed to get users'
                    }
                };
            }
            // LocalStorage implementation with advanced filtering
            const allUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('all_users_v2', {});
            let filteredUsers = Object.entries(allUsers);
            // Apply filters
            if (validatedParams) {
                if (validatedParams.query) {
                    const query = validatedParams.query.toLowerCase();
                    filteredUsers = filteredUsers.filter((param)=>{
                        let [username, u] = param;
                        var _u_bio, _u_email;
                        return username.toLowerCase().includes(query) || ((_u_bio = u.bio) === null || _u_bio === void 0 ? void 0 : _u_bio.toLowerCase().includes(query)) || ((_u_email = u.email) === null || _u_email === void 0 ? void 0 : _u_email.toLowerCase().includes(query));
                    });
                }
                if (validatedParams.role) {
                    filteredUsers = filteredUsers.filter((param)=>{
                        let [_, u] = param;
                        return u.role === validatedParams.role;
                    });
                }
                if (validatedParams.verified !== undefined) {
                    filteredUsers = filteredUsers.filter((param)=>{
                        let [_, u] = param;
                        return u.verificationStatus === 'verified' === validatedParams.verified;
                    });
                }
                if (validatedParams.tier) {
                    filteredUsers = filteredUsers.filter((param)=>{
                        let [_, u] = param;
                        return u.tier === validatedParams.tier;
                    });
                }
                if (validatedParams.minRating !== undefined) {
                    filteredUsers = filteredUsers.filter((param)=>{
                        let [_, u] = param;
                        return (u.rating || 0) >= validatedParams.minRating;
                    });
                }
                if (validatedParams.isActive !== undefined) {
                    const dayAgo = new Date();
                    dayAgo.setDate(dayAgo.getDate() - 1);
                    filteredUsers = filteredUsers.filter((param)=>{
                        let [_, u] = param;
                        const lastActive = new Date(u.lastActive || u.createdAt);
                        return validatedParams.isActive ? lastActive > dayAgo : lastActive <= dayAgo;
                    });
                }
                // Sorting
                if (validatedParams.sortBy) {
                    filteredUsers.sort((param, param1)=>{
                        let [aUsername, a] = param, [bUsername, b] = param1;
                        let compareValue = 0;
                        switch(validatedParams.sortBy){
                            case 'username':
                                compareValue = aUsername.localeCompare(bUsername);
                                break;
                            case 'joinDate':
                                compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                                break;
                            case 'rating':
                                compareValue = (a.rating || 0) - (b.rating || 0);
                                break;
                            case 'sales':
                                compareValue = (a.totalSales || 0) - (b.totalSales || 0);
                                break;
                            case 'lastActive':
                                compareValue = new Date(a.lastActive || a.createdAt).getTime() - new Date(b.lastActive || b.createdAt).getTime();
                                break;
                        }
                        return validatedParams.sortOrder === 'desc' ? -compareValue : compareValue;
                    });
                }
            }
            // Pagination
            const page = (validatedParams === null || validatedParams === void 0 ? void 0 : validatedParams.page) || 1;
            const limit = (validatedParams === null || validatedParams === void 0 ? void 0 : validatedParams.limit) || 50;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
            const users = paginatedUsers.map((param)=>{
                let [_, u] = param;
                return this.sanitizeUserData(u);
            });
            const result = {
                users,
                total: filteredUsers.length,
                page,
                totalPages: Math.ceil(filteredUsers.length / limit)
            };
            // Cache the result
            this.listCache.set(cacheKey, {
                data: result,
                expiresAt: Date.now() + CACHE_CONFIG.LIST_TTL
            });
            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error('Get users error:', error);
            return {
                success: false,
                error: {
                    code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].NETWORK_ERROR,
                    message: 'Failed to get users'
                }
            };
        }
    }
    /**
   * Get user profile with caching and validation
   */ async getUserProfile(username) {
        try {
            console.log('[EnhancedUsersService.getUserProfile] Getting profile for:', username);
            // Validate username
            if (!username || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(username)) {
                console.error('[EnhancedUsersService.getUserProfile] Invalid username:', username);
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].INVALID_USERNAME,
                        message: 'Invalid username format',
                        field: 'username'
                    }
                };
            }
            // Sanitize username
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            // Check cache
            const cached = this.profileCache.get(sanitizedUsername);
            if (cached && cached.expiresAt > Date.now()) {
                const userResult = await this.getUser(sanitizedUsername);
                if (userResult.success && userResult.data) {
                    return {
                        success: true,
                        data: {
                            profile: cached.data,
                            user: userResult.data
                        }
                    };
                }
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                // Build the full profile URL directly
                const fullUrl = "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/users/").concat(encodeURIComponent(sanitizedUsername), "/profile/full");
                console.log('[EnhancedUsersService.getUserProfile] API URL:', fullUrl);
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(fullUrl);
                if (response.success && response.data) {
                    let profileData;
                    let userData;
                    // Accept both { profile, user } and user-only shapes
                    if (response.data.profile !== undefined && response.data.user !== undefined) {
                        profileData = this.sanitizeProfileData(response.data.profile);
                        userData = response.data.user;
                    } else if (response.data.username) {
                        userData = response.data;
                        var _profilePic, _ref, _subscriptionPrice;
                        profileData = this.sanitizeProfileData({
                            bio: response.data.bio || '',
                            profilePic: (_ref = (_profilePic = response.data.profilePic) !== null && _profilePic !== void 0 ? _profilePic : response.data.profilePicture) !== null && _ref !== void 0 ? _ref : null,
                            subscriptionPrice: toPriceString((_subscriptionPrice = response.data.subscriptionPrice) !== null && _subscriptionPrice !== void 0 ? _subscriptionPrice : '0'),
                            galleryImages: response.data.galleryImages || []
                        });
                    } else {
                        // Unexpected format: coerce to empty profile
                        console.warn('[EnhancedUsersService.getUserProfile] Unexpected response format:', response.data);
                        profileData = this.sanitizeProfileData({
                            bio: '',
                            profilePic: null,
                            subscriptionPrice: '0',
                            galleryImages: []
                        });
                        userData = response.data;
                    }
                    // Cache the profile
                    this.profileCache.set(sanitizedUsername, {
                        data: profileData,
                        timestamp: Date.now(),
                        expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL
                    });
                    return {
                        success: true,
                        data: {
                            profile: profileData,
                            user: userData
                        }
                    };
                }
                return response;
            }
            // LocalStorage implementation
            const userResult = await this.getUser(sanitizedUsername);
            if (!userResult.success || !userResult.data) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].USER_NOT_FOUND,
                        message: 'User not found'
                    }
                };
            }
            const profilesData = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('user_profiles', {});
            let profile = profilesData[sanitizedUsername];
            if (!profile) {
                // Legacy storage fallback
                const bio = sessionStorage.getItem("profile_bio_".concat(sanitizedUsername)) || '';
                const profilePic = sessionStorage.getItem("profile_pic_".concat(sanitizedUsername));
                const subscriptionPrice = sessionStorage.getItem("subscription_price_".concat(sanitizedUsername)) || '0';
                const galleryData = localStorage.getItem("profile_gallery_".concat(sanitizedUsername));
                const galleryImages = galleryData ? JSON.parse(galleryData) : [];
                profile = {
                    bio,
                    profilePic: profilePic !== null && profilePic !== void 0 ? profilePic : null,
                    subscriptionPrice: toPriceString(subscriptionPrice),
                    galleryImages
                };
            }
            // Sanitize profile data
            const sanitizedProfile = this.sanitizeProfileData(profile);
            // Calculate profile completeness
            const completeness = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calculateProfileCompleteness"])(userResult.data, sanitizedProfile);
            sanitizedProfile.completeness = completeness;
            // Cache the profile
            this.profileCache.set(sanitizedUsername, {
                data: sanitizedProfile,
                timestamp: Date.now(),
                expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL
            });
            return {
                success: true,
                data: {
                    profile: sanitizedProfile,
                    user: userResult.data
                }
            };
        } catch (error) {
            console.error('[EnhancedUsersService.getUserProfile] Error:', error);
            return {
                success: false,
                error: {
                    code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].NETWORK_ERROR,
                    message: 'Failed to get user profile'
                }
            };
        }
    }
    /**
   * Update user profile with validation and optimistic updates
   */ async updateUserProfile(username, updates) {
        try {
            // Rate limit
            const rateLimitResult = this.rateLimiter.check("profile_update_".concat(username), {
                maxAttempts: 10,
                windowMs: 60 * 60 * 1000
            });
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                        message: "Too many updates. Please wait ".concat(rateLimitResult.waitTime, " seconds.")
                    }
                };
            }
            // Validate username
            if (!username || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(username)) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].INVALID_USERNAME,
                        message: 'Invalid username format',
                        field: 'username'
                    }
                };
            }
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            // PRE-NORMALIZE: coerce price to string if caller passed number
            const normalizedUpdates = {
                ...updates,
                subscriptionPrice: updates.subscriptionPrice !== undefined ? toPriceString(updates.subscriptionPrice) : undefined
            };
            // Validate and sanitize updates
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(userProfileUpdateSchema, normalizedUpdates);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                        message: Object.values(validation.errors || {})[0] || 'Invalid profile data'
                    }
                };
            }
            const sanitizedUpdates = validation.data;
            // Additional validation
            if (sanitizedUpdates.bio !== undefined && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidBio"])(sanitizedUpdates.bio)) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                        message: 'Bio is too long (max 500 characters)',
                        field: 'bio'
                    }
                };
            }
            if (sanitizedUpdates.subscriptionPrice !== undefined && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidSubscriptionPrice"])(sanitizedUpdates.subscriptionPrice)) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                        message: 'Invalid subscription price',
                        field: 'subscriptionPrice'
                    }
                };
            }
            // Optimistic update
            const currentProfile = this.profileCache.get(sanitizedUsername);
            if (currentProfile) {
                var _sanitizedUpdates_subscriptionPrice;
                const optimisticProfile = {
                    ...currentProfile.data,
                    ...sanitizedUpdates,
                    subscriptionPrice: (_sanitizedUpdates_subscriptionPrice = sanitizedUpdates.subscriptionPrice) !== null && _sanitizedUpdates_subscriptionPrice !== void 0 ? _sanitizedUpdates_subscriptionPrice : currentProfile.data.subscriptionPrice
                };
                this.profileCache.set(sanitizedUsername, {
                    data: optimisticProfile,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL
                });
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const url = "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/users/").concat(encodeURIComponent(sanitizedUsername), "/profile");
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(url, {
                    method: 'PATCH',
                    body: JSON.stringify(sanitizedUpdates)
                });
                if (!response.success) {
                    // Revert optimistic update
                    if (currentProfile) {
                        this.profileCache.set(sanitizedUsername, currentProfile);
                    } else {
                        this.profileCache.delete(sanitizedUsername);
                    }
                    return response;
                }
                if (response.data) {
                    const sanitizedProfile = this.sanitizeProfileData(response.data);
                    this.profileCache.set(sanitizedUsername, {
                        data: sanitizedProfile,
                        timestamp: Date.now(),
                        expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL
                    });
                    return {
                        ...response,
                        data: sanitizedProfile
                    };
                }
                return response;
            }
            // LocalStorage implementation
            const profilesData = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('user_profiles', {});
            const currentData = profilesData[sanitizedUsername] || {
                bio: '',
                profilePic: null,
                subscriptionPrice: '0',
                galleryImages: []
            };
            var _sanitizedUpdates_subscriptionPrice1, _ref;
            const updatedProfile = {
                ...currentData,
                ...sanitizedUpdates,
                subscriptionPrice: toPriceString((_ref = (_sanitizedUpdates_subscriptionPrice1 = sanitizedUpdates.subscriptionPrice) !== null && _sanitizedUpdates_subscriptionPrice1 !== void 0 ? _sanitizedUpdates_subscriptionPrice1 : currentData.subscriptionPrice) !== null && _ref !== void 0 ? _ref : '0'),
                lastUpdated: new Date().toISOString()
            };
            profilesData[sanitizedUsername] = updatedProfile;
            const success = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('user_profiles', profilesData);
            if (success) {
                // Legacy storage for backward compatibility
                if (sanitizedUpdates.bio !== undefined) {
                    sessionStorage.setItem("profile_bio_".concat(sanitizedUsername), toStringSafe(sanitizedUpdates.bio, ''));
                }
                if (sanitizedUpdates.profilePic !== undefined) {
                    if (sanitizedUpdates.profilePic) {
                        sessionStorage.setItem("profile_pic_".concat(sanitizedUsername), toStringSafe(sanitizedUpdates.profilePic, ''));
                    } else {
                        sessionStorage.removeItem("profile_pic_".concat(sanitizedUsername));
                    }
                }
                if (sanitizedUpdates.subscriptionPrice !== undefined) {
                    sessionStorage.setItem("subscription_price_".concat(sanitizedUsername), toPriceString(sanitizedUpdates.subscriptionPrice));
                }
                if (sanitizedUpdates.galleryImages !== undefined) {
                    localStorage.setItem("profile_gallery_".concat(sanitizedUsername), JSON.stringify(sanitizedUpdates.galleryImages || []));
                }
                // Update user bio in all_users_v2 if needed
                if (sanitizedUpdates.bio !== undefined) {
                    const allUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('all_users_v2', {});
                    if (allUsers[sanitizedUsername]) {
                        allUsers[sanitizedUsername].bio = sanitizedUpdates.bio;
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('all_users_v2', allUsers);
                        // Clear user cache
                        this.userCache.delete(sanitizedUsername);
                    }
                }
                // Update cache
                this.profileCache.set(sanitizedUsername, {
                    data: updatedProfile,
                    timestamp: Date.now(),
                    expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL
                });
                return {
                    success: true,
                    data: updatedProfile
                };
            } else {
                // Revert optimistic update
                if (currentProfile) {
                    this.profileCache.set(sanitizedUsername, currentProfile);
                } else {
                    this.profileCache.delete(sanitizedUsername);
                }
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].PROFILE_UPDATE_FAILED,
                        message: 'Failed to update profile'
                    }
                };
            }
        } catch (error) {
            console.error('Update user profile error:', error);
            // Revert optimistic update on error
            this.profileCache.delete(username);
            return {
                success: false,
                error: {
                    code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].NETWORK_ERROR,
                    message: 'Failed to update profile'
                }
            };
        }
    }
    /**
   * Get user preferences
   */ async getUserPreferences(username) {
        try {
            console.log('[EnhancedUsersService.getUserPreferences] Getting preferences for:', username);
            // Validate username
            if (!username || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(username)) {
                console.error('[EnhancedUsersService.getUserPreferences] Invalid username:', username);
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].INVALID_USERNAME,
                        message: 'Invalid username format'
                    }
                };
            }
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            const defaultPreferences = {
                notifications: {
                    messages: true,
                    orders: true,
                    promotions: false,
                    newsletters: false
                },
                privacy: {
                    showOnlineStatus: true,
                    allowDirectMessages: true,
                    profileVisibility: 'public'
                },
                language: 'en',
                currency: 'USD',
                timezone: 'UTC'
            };
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                var _response_error, _response_error1;
                const preferencesUrl = "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/users/").concat(encodeURIComponent(sanitizedUsername), "/settings/preferences");
                console.log('[EnhancedUsersService.getUserPreferences] API URL:', preferencesUrl);
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(preferencesUrl);
                // If endpoint doesn't exist (404), return default preferences
                if (!response.success && (((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.code) === '404' || ((_response_error1 = response.error) === null || _response_error1 === void 0 ? void 0 : _response_error1.code) === 'INVALID_CONTENT_TYPE')) {
                    console.log('[EnhancedUsersService.getUserPreferences] Endpoint not found, using defaults');
                    return {
                        success: true,
                        data: defaultPreferences
                    };
                }
                return response;
            }
            // LocalStorage implementation
            const preferencesData = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('user_preferences', {});
            const preferences = preferencesData[sanitizedUsername] || defaultPreferences;
            return {
                success: true,
                data: preferences
            };
        } catch (error) {
            console.error('[EnhancedUsersService.getUserPreferences] Error:', error);
            // Return default preferences on error
            return {
                success: true,
                data: {
                    notifications: {
                        messages: true,
                        orders: true,
                        promotions: false,
                        newsletters: false
                    },
                    privacy: {
                        showOnlineStatus: true,
                        allowDirectMessages: true,
                        profileVisibility: 'public'
                    },
                    language: 'en',
                    currency: 'USD',
                    timezone: 'UTC'
                }
            };
        }
    }
    /**
   * Update user preferences
   */ async updateUserPreferences(username, updates) {
        try {
            // Validate username
            if (!username || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(username)) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].INVALID_USERNAME,
                        message: 'Invalid username format'
                    }
                };
            }
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            // Validate preferences
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(userPreferencesSchema, updates);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                        message: 'Invalid preferences data'
                    }
                };
            }
            const sanitizedUpdates = validation.data;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const preferencesUrl = "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/users/").concat(encodeURIComponent(sanitizedUsername), "/settings/preferences");
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(preferencesUrl, {
                    method: 'PATCH',
                    body: JSON.stringify(sanitizedUpdates)
                });
            }
            // LocalStorage implementation
            const preferencesData = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('user_preferences', {});
            const currentPreferences = preferencesData[sanitizedUsername] || {
                notifications: {
                    messages: true,
                    orders: true,
                    promotions: false,
                    newsletters: false
                },
                privacy: {
                    showOnlineStatus: true,
                    allowDirectMessages: true,
                    profileVisibility: 'public'
                },
                language: 'en',
                currency: 'USD',
                timezone: 'UTC'
            };
            const updatedPreferences = {
                ...currentPreferences,
                ...sanitizedUpdates,
                notifications: {
                    ...currentPreferences.notifications,
                    ...sanitizedUpdates.notifications || {}
                },
                privacy: {
                    ...currentPreferences.privacy,
                    ...sanitizedUpdates.privacy || {}
                }
            };
            preferencesData[sanitizedUsername] = updatedPreferences;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('user_preferences', preferencesData);
            return {
                success: true,
                data: updatedPreferences
            };
        } catch (error) {
            console.error('Update user preferences error:', error);
            return {
                success: false,
                error: {
                    code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].NETWORK_ERROR,
                    message: 'Failed to update preferences'
                }
            };
        }
    }
    /**
   * Track user activity
   */ async trackActivity(activity) {
        try {
            // Validate activity data
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(activitySchema, activity);
            if (!validation.success) {
                return {
                    success: true
                }; // Silently fail for activity tracking
            }
            const sanitizedActivity = validation.data;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                var _response_error, _response_error1;
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/users/activity', {
                    method: 'POST',
                    body: JSON.stringify(sanitizedActivity)
                });
                // Silently fail if endpoint doesn't exist
                if (!response.success && (((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.code) === '404' || ((_response_error1 = response.error) === null || _response_error1 === void 0 ? void 0 : _response_error1.code) === 'INVALID_CONTENT_TYPE')) {
                    return {
                        success: true
                    };
                }
                return response;
            }
            // LocalStorage implementation
            const activities = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('user_activities', []);
            const newActivity = {
                ...sanitizedActivity,
                id: "activity_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
                timestamp: new Date().toISOString()
            };
            activities.push(newActivity);
            // Keep only last N activities
            if (activities.length > SECURITY_LIMITS.MAX_ACTIVITY_HISTORY) {
                activities.splice(0, activities.length - SECURITY_LIMITS.MAX_ACTIVITY_HISTORY);
            }
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('user_activities', activities);
            return {
                success: true
            };
        } catch (error) {
            console.error('Track activity error:', error);
            // Don't return error for activity tracking failures
            return {
                success: true
            };
        }
    }
    /**
   * Get user activity history
   */ async getUserActivity(username) {
        let limit = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 50;
        try {
            // Validate username
            if (!username || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(username)) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].INVALID_USERNAME,
                        message: 'Invalid username format'
                    }
                };
            }
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            const sanitizedLimit = Math.min(Math.max(1, limit), SECURITY_LIMITS.MAX_PAGE_SIZE);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const activityUrl = "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/users/").concat(encodeURIComponent(sanitizedUsername), "/profile/activity?limit=").concat(sanitizedLimit);
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(activityUrl);
            }
            // LocalStorage implementation
            const activities = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('user_activities', []);
            const userActivities = activities.filter((a)=>a.userId === sanitizedUsername).sort((a, b)=>new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, sanitizedLimit);
            return {
                success: true,
                data: userActivities
            };
        } catch (error) {
            console.error('Get user activity error:', error);
            return {
                success: false,
                error: {
                    code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].NETWORK_ERROR,
                    message: 'Failed to get activity history'
                }
            };
        }
    }
    /**
   * Batch update users (admin only)
   */ async batchUpdateUsers(updates) {
        try {
            // Rate limit
            const rateLimitResult = this.rateLimiter.check('batch_update', {
                maxAttempts: 5,
                windowMs: 60 * 60 * 1000
            });
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                        message: "Too many batch updates. Please wait ".concat(rateLimitResult.waitTime, " seconds.")
                    }
                };
            }
            // Limit batch size
            if (updates.length > SECURITY_LIMITS.MAX_BATCH_SIZE) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                        message: "Batch size exceeds limit of ".concat(SECURITY_LIMITS.MAX_BATCH_SIZE)
                    }
                };
            }
            // Validate all updates
            const validatedUpdates = [];
            for (const update of updates){
                if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(update.username)) {
                    continue;
                }
                const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(update.username);
                const sanitizedUpdates = this.sanitizeUserData(update.updates);
                validatedUpdates.push({
                    username: sanitizedUsername,
                    updates: sanitizedUpdates
                });
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/users/batch-update', {
                    method: 'POST',
                    body: JSON.stringify({
                        updates: validatedUpdates
                    })
                });
            }
            // LocalStorage implementation
            const allUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('all_users_v2', {});
            const result = {
                succeeded: [],
                failed: []
            };
            for (const update of validatedUpdates){
                try {
                    if (allUsers[update.username]) {
                        allUsers[update.username] = {
                            ...allUsers[update.username],
                            ...update.updates
                        };
                        result.succeeded.push(update.username);
                        // Clear cache for updated user
                        this.clearUserCache(update.username);
                    } else {
                        result.failed.push({
                            username: update.username,
                            error: 'User not found'
                        });
                    }
                } catch (error) {
                    result.failed.push({
                        username: update.username,
                        error: (error === null || error === void 0 ? void 0 : error.message) || 'Update failed'
                    });
                }
            }
            if (result.succeeded.length > 0) {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('all_users_v2', allUsers);
            }
            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error('Batch update users error:', error);
            return {
                success: false,
                error: {
                    code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].NETWORK_ERROR,
                    message: 'Failed to batch update users'
                }
            };
        }
    }
    /**
   * Request verification with file validation
   */ async requestVerification(username, docs) {
        try {
            // Rate limit
            const rateLimitResult = this.rateLimiter.check("verification_".concat(username), {
                maxAttempts: 3,
                windowMs: 24 * 60 * 60 * 1000
            });
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                        message: "Too many verification requests. Please wait ".concat(rateLimitResult.waitTime, " seconds.")
                    }
                };
            }
            // Validate username
            if (!username || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(username)) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].INVALID_USERNAME,
                        message: 'Invalid username format'
                    }
                };
            }
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            // Validate verification request
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(verificationRequestSchema, docs);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                        message: 'Invalid verification data'
                    }
                };
            }
            const sanitizedDocs = validation.data;
            // Validate required documents
            if (!sanitizedDocs.codePhoto || !sanitizedDocs.code) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                        message: 'Code photo and verification code are required'
                    }
                };
            }
            if (!sanitizedDocs.idFront && !sanitizedDocs.passport) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VALIDATION_ERROR,
                        message: 'Either ID front or passport is required'
                    }
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const url = "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/users/").concat(encodeURIComponent(sanitizedUsername), "/verification");
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(url, {
                    method: 'POST',
                    body: JSON.stringify(sanitizedDocs)
                });
            }
            // LocalStorage implementation
            const allUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('all_users_v2', {});
            if (allUsers[sanitizedUsername]) {
                allUsers[sanitizedUsername].verificationStatus = 'pending';
                allUsers[sanitizedUsername].verificationRequestedAt = new Date().toISOString();
                allUsers[sanitizedUsername].verificationDocs = sanitizedDocs;
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('all_users_v2', allUsers);
                // Clear user cache
                this.userCache.delete(sanitizedUsername);
            }
            // Store verification request
            const verificationRequests = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_verification_requests', {});
            verificationRequests[sanitizedUsername] = {
                ...sanitizedDocs,
                requestedAt: new Date().toISOString(),
                status: 'pending'
            };
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_verification_requests', verificationRequests);
            // Track activity
            await this.trackActivity({
                userId: sanitizedUsername,
                type: 'profile_update',
                details: {
                    action: 'verification_requested'
                }
            });
            return {
                success: true
            };
        } catch (error) {
            console.error('Request verification error:', error);
            return {
                success: false,
                error: {
                    code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].VERIFICATION_FAILED,
                    message: 'Failed to request verification'
                }
            };
        }
    }
    /**
   * Get subscription status with caching
   */ async getSubscriptionStatus(buyer, seller) {
        try {
            // Validate usernames
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(buyer) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(seller)) {
                return {
                    success: false,
                    error: {
                        code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].INVALID_USERNAME,
                        message: 'Invalid username format'
                    }
                };
            }
            const sanitizedBuyer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(buyer);
            const sanitizedSeller = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(seller);
            const cacheKey = "sub:".concat(sanitizedBuyer, ":").concat(sanitizedSeller);
            const cached = this.listCache.get(cacheKey);
            if (cached && cached.expiresAt > Date.now()) {
                return {
                    success: true,
                    data: cached.data
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].SUBSCRIPTIONS.CHECK, "?buyer=").concat(sanitizedBuyer, "&seller=").concat(sanitizedSeller));
                if (response.success && response.data) {
                    this.listCache.set(cacheKey, {
                        data: response.data,
                        expiresAt: Date.now() + CACHE_CONFIG.LIST_TTL
                    });
                }
                return response;
            }
            // LocalStorage implementation
            const subscriptions = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('user_subscriptions', {});
            const buyerSubs = subscriptions[sanitizedBuyer] || [];
            const subscription = buyerSubs.find((sub)=>sub.seller === sanitizedSeller) || null;
            if (subscription) {
                this.listCache.set(cacheKey, {
                    data: subscription,
                    expiresAt: Date.now() + CACHE_CONFIG.LIST_TTL
                });
            }
            return {
                success: true,
                data: subscription
            };
        } catch (error) {
            console.error('Get subscription status error:', error);
            return {
                success: false,
                error: {
                    code: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserErrorCode"].NETWORK_ERROR,
                    message: 'Failed to get subscription status'
                }
            };
        }
    }
    /**
   * Clear all caches
   */ clearCache() {
        this.userCache.clear();
        this.profileCache.clear();
        this.listCache.clear();
    }
    /**
   * Sanitize user data
   */ sanitizeUserData(user) {
        return {
            ...user,
            username: (user === null || user === void 0 ? void 0 : user.username) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(user.username) : '',
            email: (user === null || user === void 0 ? void 0 : user.email) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeEmail"])(user.email) : undefined,
            bio: (user === null || user === void 0 ? void 0 : user.bio) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(user.bio) : undefined,
            banReason: (user === null || user === void 0 ? void 0 : user.banReason) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(user.banReason) : undefined,
            verificationRejectionReason: (user === null || user === void 0 ? void 0 : user.verificationRejectionReason) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(user.verificationRejectionReason) : undefined
        };
    }
    /**
   * Sanitize profile data (guarantees subscriptionPrice is a string)
   */ sanitizeProfileData(profile) {
        // Handle undefined or null profile
        const p = profile || {};
        var _p_profilePic, _ref;
        const rawPic = (_ref = (_p_profilePic = p.profilePic) !== null && _p_profilePic !== void 0 ? _p_profilePic : p.profilePicture) !== null && _ref !== void 0 ? _ref : null;
        const profilePic = sanitizeUrlOrNull(rawPic);
        var _p_subscriptionPrice;
        const priceStr = toPriceString((_p_subscriptionPrice = p.subscriptionPrice) !== null && _p_subscriptionPrice !== void 0 ? _p_subscriptionPrice : '0');
        const galleryImages = Array.isArray(p.galleryImages) ? p.galleryImages.map((u)=>typeof u === 'string' ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(u) : null).filter(Boolean) : [];
        const socialLinks = p.socialLinks ? {
            twitter: sanitizeUrlOrUndefined(p.socialLinks.twitter),
            instagram: sanitizeUrlOrUndefined(p.socialLinks.instagram),
            tiktok: sanitizeUrlOrUndefined(p.socialLinks.tiktok),
            website: sanitizeUrlOrUndefined(p.socialLinks.website)
        } : undefined;
        return {
            bio: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(p.bio || ''),
            profilePic,
            subscriptionPrice: priceStr,
            galleryImages,
            socialLinks,
            completeness: p.completeness,
            lastUpdated: p.lastUpdated,
            preferences: p.preferences,
            stats: p.stats
        };
    // NOTE: UserProfile typing is satisfied: subscriptionPrice is string, others match optional fields.
    }
    constructor(){
        // In-memory caches
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "userCache", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "profileCache", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "listCache", new Map());
        // Request deduplication
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "pendingRequests", new Map());
        // Rate limiter
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "rateLimiter", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])());
    }
}
const enhancedUsersService = new EnhancedUsersService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/users.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/users.service.ts
__turbopack_context__.s({
    "UsersService": ()=>UsersService,
    "usersService": ()=>usersService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/users.service.enhanced.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/users.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
// ---------- Helpers to normalize API data for UI ----------
/** Base host for non-API assets (e.g., /uploads/*). */ const BASE_HOST = (()=>{
    try {
        // API_BASE_URL can be "http://localhost:5000" or "http://localhost:5000/api"
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"].replace(/\/api\/?$/, '').replace(/\/$/, '');
    } catch (e) {
        return 'http://localhost:5000';
    }
})();
/** Make a URL absolute if it's relative like "/uploads/xyz.jpg" */ function toAbsoluteUrl(path) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path; // already absolute
    const normalized = path.startsWith('/') ? path : "/".concat(path);
    return "".concat(BASE_HOST).concat(normalized);
}
/** Normalize subscription price (string|number|null|undefined) -> number */ function toPriceNumber(value) {
    if (typeof value === 'number' && isFinite(value)) return value;
    if (typeof value === 'string') {
        const n = parseFloat(value);
        return isFinite(n) && !Number.isNaN(n) ? n : 0;
    }
    return 0;
}
// Validation schemas
const verificationUpdateSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'pending',
        'verified',
        'rejected',
        'unverified'
    ]),
    rejectionReason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional(),
    adminUsername: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"]).optional()
});
const banRequestSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"]),
    reason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10).max(500).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    duration: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().positive().max(365).optional(),
    adminUsername: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])
});
class UsersService {
    /**
   * Get all users
   */ async getUsers(params) {
        try {
            var _result_data;
            const enhancedParams = {
                ...params,
                sortBy: 'username',
                sortOrder: 'asc'
            };
            const result = await this.enhanced.getUsers(enhancedParams);
            if (!result.success) {
                return result;
            }
            const usersMap = {};
            if ((_result_data = result.data) === null || _result_data === void 0 ? void 0 : _result_data.users) {
                result.data.users.forEach((user)=>{
                    usersMap[user.username] = user;
                });
            }
            return {
                success: true,
                data: usersMap
            };
        } catch (error) {
            console.error('Get users error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get users'
                }
            };
        }
    }
    /**
   * Get user by username
   */ async getUser(username) {
        return this.enhanced.getUser(username);
    }
    /**
   * Get user profile data (PUBLIC profile)
   * - Ensure price is number
   * - Ensure images are absolute URLs so they display on the seller profile page
   */ async getUserProfile(username) {
        try {
            const result = await this.enhanced.getUserProfile(username);
            if (!result.success) {
                return result;
            }
            if (!result.data) {
                return {
                    success: true,
                    data: null
                };
            }
            const raw = result.data.profile;
            const profile = {
                bio: raw.bio,
                profilePic: toAbsoluteUrl(raw.profilePic),
                subscriptionPrice: toPriceNumber(raw.subscriptionPrice),
                lastUpdated: raw.lastUpdated,
                galleryImages: Array.isArray(raw.galleryImages) ? raw.galleryImages.map((p)=>toAbsoluteUrl(p)).filter(Boolean) : undefined
            };
            return {
                success: true,
                data: profile
            };
        } catch (error) {
            console.error('Get user profile error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get user profile'
                }
            };
        }
    }
    /**
   * Update user profile
   * - Normalize the returned data to UI shapes (number price + absolute URLs)
   */ async updateUserProfile(username, updates) {
        try {
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(username)) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid username format'
                    }
                };
            }
            if (updates.bio !== undefined && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidBio"])(updates.bio)) {
                return {
                    success: false,
                    error: {
                        message: 'Bio is too long (max 500 characters)'
                    }
                };
            }
            if (updates.subscriptionPrice !== undefined && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidSubscriptionPrice"])(updates.subscriptionPrice)) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid subscription price'
                    }
                };
            }
            const result = await this.enhanced.updateUserProfile(username, updates);
            if (!result.success) {
                return result;
            }
            const raw = result.data;
            const profile = {
                bio: raw.bio,
                profilePic: toAbsoluteUrl(raw.profilePic),
                subscriptionPrice: toPriceNumber(raw.subscriptionPrice),
                lastUpdated: raw.lastUpdated,
                galleryImages: Array.isArray(raw.galleryImages) ? raw.galleryImages.map((p)=>toAbsoluteUrl(p)).filter(Boolean) : undefined
            };
            return {
                success: true,
                data: profile
            };
        } catch (error) {
            console.error('Update user profile error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to update user profile'
                }
            };
        }
    }
    /**
   * Request verification
   */ async requestVerification(username, docs) {
        return this.enhanced.requestVerification(username, docs);
    }
    /**
   * Update verification status (admin only)
   */ async updateVerificationStatus(username, update) {
        try {
            const rateLimitResult = this.rateLimiter.check('REPORT_ACTION', {
                ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].REPORT_ACTION,
                identifier: update.adminUsername
            });
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        message: "Rate limit exceeded. Please wait ".concat(rateLimitResult.waitTime, " seconds.")
                    }
                };
            }
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(username)) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid username format'
                    }
                };
            }
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(verificationUpdateSchema, update);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        message: Object.values(validation.errors || {})[0] || 'Invalid update data'
                    }
                };
            }
            const sanitizedUpdate = validation.data;
            const enhancedUpdate = {
                ...sanitizedUpdate,
                reviewedAt: new Date().toISOString()
            };
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].USERS.VERIFICATION, {
                    username: sanitizedUsername
                }), {
                    method: 'PATCH',
                    body: JSON.stringify(enhancedUpdate)
                });
            }
            // LocalStorage implementation
            const allUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('all_users_v2', {});
            if (allUsers[sanitizedUsername]) {
                allUsers[sanitizedUsername].verificationStatus = sanitizedUpdate.status;
                allUsers[sanitizedUsername].isVerified = sanitizedUpdate.status === 'verified';
                if (sanitizedUpdate.status === 'rejected' && sanitizedUpdate.rejectionReason) {
                    allUsers[sanitizedUsername].verificationRejectionReason = sanitizedUpdate.rejectionReason;
                }
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('all_users_v2', allUsers);
                // Clear cache
                this.enhanced.clearCache();
            }
            // Update verification request
            const verificationRequests = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_verification_requests', {});
            if (verificationRequests[sanitizedUsername]) {
                verificationRequests[sanitizedUsername].status = sanitizedUpdate.status;
                verificationRequests[sanitizedUsername].reviewedAt = new Date().toISOString();
                verificationRequests[sanitizedUsername].reviewedBy = sanitizedUpdate.adminUsername;
                if (sanitizedUpdate.rejectionReason) {
                    verificationRequests[sanitizedUsername].rejectionReason = sanitizedUpdate.rejectionReason;
                }
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_verification_requests', verificationRequests);
            }
            // Track activity
            await this.enhanced.trackActivity({
                userId: sanitizedUpdate.adminUsername || 'admin',
                type: 'profile_update',
                details: {
                    action: 'verification_status_updated',
                    targetUser: sanitizedUsername,
                    newStatus: sanitizedUpdate.status
                }
            });
            return {
                success: true
            };
        } catch (error) {
            console.error('Update verification status error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to update verification status'
                }
            };
        }
    }
    /**
   * Ban user
   */ async banUser(request) {
        try {
            const rateLimitResult = this.rateLimiter.check('BAN_USER', {
                ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].BAN_USER,
                identifier: request.adminUsername
            });
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        message: "Rate limit exceeded. Please wait ".concat(rateLimitResult.waitTime, " seconds.")
                    }
                };
            }
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(banRequestSchema, request);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        message: Object.values(validation.errors || {})[0] || 'Invalid ban request'
                    }
                };
            }
            const sanitizedRequest = validation.data;
            const enhancedRequest = {
                ...sanitizedRequest,
                evidence: []
            };
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].USERS.LIST, "/").concat(sanitizedRequest.username, "/ban"), {
                    method: 'POST',
                    body: JSON.stringify(enhancedRequest)
                });
            }
            // LocalStorage implementation
            const allUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('all_users_v2', {});
            if (allUsers[sanitizedRequest.username]) {
                allUsers[sanitizedRequest.username].isBanned = true;
                allUsers[sanitizedRequest.username].banReason = sanitizedRequest.reason;
                if (sanitizedRequest.duration) {
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + sanitizedRequest.duration);
                    allUsers[sanitizedRequest.username].banExpiresAt = expiresAt.toISOString();
                }
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('all_users_v2', allUsers);
                // Clear cache
                this.enhanced.clearCache();
            }
            // Store ban log
            const banLogs = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('ban_logs', []);
            banLogs.push({
                username: sanitizedRequest.username,
                reason: sanitizedRequest.reason,
                duration: sanitizedRequest.duration,
                bannedBy: sanitizedRequest.adminUsername,
                bannedAt: new Date().toISOString()
            });
            if (banLogs.length > 1000) {
                banLogs.splice(0, banLogs.length - 1000);
            }
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('ban_logs', banLogs);
            // Track activity
            await this.enhanced.trackActivity({
                userId: sanitizedRequest.adminUsername,
                type: 'profile_update',
                details: {
                    action: 'user_banned',
                    targetUser: sanitizedRequest.username,
                    reason: sanitizedRequest.reason,
                    duration: sanitizedRequest.duration
                }
            });
            return {
                success: true
            };
        } catch (error) {
            console.error('Ban user error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to ban user'
                }
            };
        }
    }
    /**
   * Unban user
   */ async unbanUser(username, adminUsername) {
        try {
            const rateLimitResult = this.rateLimiter.check('BAN_USER', {
                ...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].BAN_USER,
                identifier: adminUsername
            });
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        message: "Rate limit exceeded. Please wait ".concat(rateLimitResult.waitTime, " seconds.")
                    }
                };
            }
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(username) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(adminUsername)) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid username format'
                    }
                };
            }
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            const sanitizedAdminUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(adminUsername);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].USERS.LIST, "/").concat(sanitizedUsername, "/unban"), {
                    method: 'POST',
                    body: JSON.stringify({
                        adminUsername: sanitizedAdminUsername
                    })
                });
            }
            // LocalStorage implementation
            const allUsers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('all_users_v2', {});
            if (allUsers[sanitizedUsername]) {
                allUsers[sanitizedUsername].isBanned = false;
                delete allUsers[sanitizedUsername].banReason;
                delete allUsers[sanitizedUsername].banExpiresAt;
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('all_users_v2', allUsers);
                // Clear cache
                this.enhanced.clearCache();
            }
            // Update ban log
            const banLogs = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('ban_logs', []);
            banLogs.push({
                username: sanitizedUsername,
                action: 'unban',
                unbannedBy: sanitizedAdminUsername,
                unbannedAt: new Date().toISOString()
            });
            if (banLogs.length > 1000) {
                banLogs.splice(0, banLogs.length - 1000);
            }
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('ban_logs', banLogs);
            // Track activity
            await this.enhanced.trackActivity({
                userId: sanitizedAdminUsername,
                type: 'profile_update',
                details: {
                    action: 'user_unbanned',
                    targetUser: sanitizedUsername
                }
            });
            return {
                success: true
            };
        } catch (error) {
            console.error('Unban user error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to unban user'
                }
            };
        }
    }
    /**
   * Get subscription info for a seller
   * (kept as-is; callers can coerce price if needed)
   */ async getSubscriptionInfo(seller, buyer) {
        try {
            if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(seller) || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$users$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isValidUsername"])(buyer)) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid username format'
                    }
                };
            }
            const subResult = await this.enhanced.getSubscriptionStatus(buyer, seller);
            if (!subResult.success) {
                return subResult;
            }
            if (!subResult.data) {
                var _profileResult_data;
                const profileResult = await this.getUserProfile(seller);
                var _profileResult_data_subscriptionPrice;
                const price = (_profileResult_data_subscriptionPrice = (_profileResult_data = profileResult.data) === null || _profileResult_data === void 0 ? void 0 : _profileResult_data.subscriptionPrice) !== null && _profileResult_data_subscriptionPrice !== void 0 ? _profileResult_data_subscriptionPrice : 0;
                return {
                    success: true,
                    data: {
                        isSubscribed: false,
                        price: String(price)
                    }
                };
            }
            return {
                success: true,
                data: {
                    isSubscribed: subResult.data.status === 'active',
                    price: subResult.data.price,
                    subscribedAt: subResult.data.subscribedAt
                }
            };
        } catch (error) {
            console.error('Get subscription info error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get subscription info'
                }
            };
        }
    }
    // New enhanced methods - exposed for gradual adoption
    async getUserPreferences(username) {
        return this.enhanced.getUserPreferences(username);
    }
    async updateUserPreferences(username, updates) {
        return this.enhanced.updateUserPreferences(username, updates);
    }
    async trackActivity(activity) {
        return this.enhanced.trackActivity(activity);
    }
    async getUserActivity(username, limit) {
        return this.enhanced.getUserActivity(username, limit);
    }
    async batchUpdateUsers(updates) {
        return this.enhanced.batchUpdateUsers(updates);
    }
    clearCache() {
        this.enhanced.clearCache();
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "enhanced", __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$enhanced$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["enhancedUsersService"]);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "rateLimiter", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])());
    }
}
const usersService = new UsersService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/ban.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/ban.service.ts
__turbopack_context__.s({
    "banService": ()=>banService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
;
;
class BanService {
    // Create a ban
    async createBan(data) {
        console.log('[BanService] Creating ban:', data);
        // Only use API if feature is enabled
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_BANS) {
            console.log('[BanService] API bans disabled, returning success for localStorage-only operation');
            return {
                success: true
            };
        }
        try {
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/admin/bans"), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    isPermanent: data.duration === 'permanent'
                })
            });
            console.log('[BanService] Ban response:', response);
            return response;
        } catch (error) {
            console.error('[BanService] Error creating ban:', error);
            // Don't throw - let the context handle localStorage fallback
            return {
                success: false,
                error
            };
        }
    }
    // Get all bans (admin only)
    async getBans(params) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_BANS) {
            // Return data from localStorage
            const bans = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_user_bans', []);
            return {
                success: true,
                data: {
                    bans
                }
            };
        }
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach((param)=>{
                let [key, value] = param;
                if (value !== undefined) {
                    queryParams.append(key, String(value));
                }
            });
        }
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/admin/bans".concat(queryParams.toString() ? "?".concat(queryParams.toString()) : ''), {
                method: 'GET'
            });
        } catch (error) {
            console.error('[BanService] Error fetching bans:', error);
            return {
                success: false,
                error
            };
        }
    }
    // Lift/unban
    async unbanUser(username, reason) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_BANS) {
            return {
                success: true
            };
        }
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/admin/bans/:username/unban', {
                username
            }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    reason
                })
            });
        } catch (error) {
            console.error('[BanService] Error unbanning user:', error);
            return {
                success: false,
                error
            };
        }
    }
    // Get ban stats
    async getBanStats() {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_BANS) {
            const bans = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_user_bans', []);
            const activeBans = bans.filter((b)=>b.active);
            return {
                success: true,
                data: {
                    totalActiveBans: activeBans.length,
                    permanentBans: activeBans.filter((b)=>b.isPermanent || b.banType === 'permanent').length,
                    temporaryBans: activeBans.filter((b)=>!b.isPermanent && b.banType !== 'permanent').length,
                    pendingAppeals: activeBans.filter((b)=>b.appealStatus === 'pending').length,
                    bansLast24h: bans.filter((b)=>{
                        const banDate = new Date(b.createdAt || b.startTime);
                        return Date.now() - banDate.getTime() < 24 * 60 * 60 * 1000;
                    }).length
                }
            };
        }
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/admin/bans/stats', {
                method: 'GET'
            });
        } catch (error) {
            console.error('[BanService] Error fetching ban stats:', error);
            return {
                success: false,
                error
            };
        }
    }
    // Submit appeal
    async submitAppeal(banId, appealText, evidence) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_BANS) {
            return {
                success: true
            };
        }
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/admin/bans/:id/appeal', {
                id: banId
            }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    appealText,
                    evidence
                })
            });
        } catch (error) {
            console.error('[BanService] Error submitting appeal:', error);
            return {
                success: false,
                error
            };
        }
    }
    // Review appeal (admin)
    async reviewAppeal(banId, decision, notes) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_BANS) {
            return {
                success: true
            };
        }
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/admin/bans/:id/appeal/review', {
                id: banId
            }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    decision,
                    notes
                })
            });
        } catch (error) {
            console.error('[BanService] Error reviewing appeal:', error);
            return {
                success: false,
                error
            };
        }
    }
}
const banService = new BanService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/reports.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/reports.service.ts
__turbopack_context__.s({
    "reportsService": ()=>reportsService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
;
;
class ReportsService {
    async submitReport(data) {
        console.log('[ReportsService] Submitting report:', data);
        // Check if API reports are enabled
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_REPORTS) {
            console.log('[ReportsService] API reports disabled, saving to localStorage only');
            // Save to localStorage as fallback
            const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
            const newReport = {
                id: "report_".concat(Date.now()),
                reporter: 'current_user',
                reportee: data.reportedUser,
                date: new Date().toISOString(),
                category: data.reportType,
                severity: data.severity || 'medium',
                adminNotes: data.description,
                processed: false
            };
            reports.push(newReport);
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_report_logs', reports);
            return {
                success: true,
                data: newReport
            };
        }
        try {
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/reports/submit"), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (response.success) {
                var _response_data, _response_data1;
                console.log('[ReportsService] Report submitted successfully');
                // Also save to localStorage for immediate UI updates
                const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
                const newReport = {
                    id: ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.reportId) || ((_response_data1 = response.data) === null || _response_data1 === void 0 ? void 0 : _response_data1.id) || "report_".concat(Date.now()),
                    reporter: 'current_user',
                    reportee: data.reportedUser,
                    date: new Date().toISOString(),
                    category: data.reportType,
                    severity: data.severity || 'medium',
                    adminNotes: data.description,
                    processed: false
                };
                reports.push(newReport);
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_report_logs', reports);
            }
            return response;
        } catch (error) {
            console.error('[ReportsService] Error submitting report:', error);
            // Fallback to localStorage on error
            const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
            const newReport = {
                id: "report_".concat(Date.now()),
                reporter: 'current_user',
                reportee: data.reportedUser,
                date: new Date().toISOString(),
                category: data.reportType,
                severity: data.severity || 'medium',
                adminNotes: data.description,
                processed: false
            };
            reports.push(newReport);
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_report_logs', reports);
            return {
                success: true,
                data: newReport
            };
        }
    }
    async getReports(params) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_REPORTS) {
            const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
            return {
                success: true,
                data: {
                    reports
                }
            };
        }
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach((param)=>{
                let [key, value] = param;
                if (value !== undefined) {
                    queryParams.append(key, String(value));
                }
            });
        }
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/reports?").concat(queryParams.toString()), {
                method: 'GET'
            });
        } catch (error) {
            console.error('[ReportsService] Error fetching reports:', error);
            const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
            return {
                success: true,
                data: {
                    reports
                }
            };
        }
    }
    async getReportById(id) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_REPORTS) {
            const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
            const report = reports.find((r)=>r.id === id);
            return {
                success: !!report,
                data: report
            };
        }
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/reports/:id', {
                id
            }), {
                method: 'GET'
            });
        } catch (error) {
            console.error('[ReportsService] Error fetching report:', error);
            return {
                success: false,
                error
            };
        }
    }
    async updateReport(id, updates) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_REPORTS) {
            const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
            const index = reports.findIndex((r)=>r.id === id);
            if (index !== -1) {
                reports[index] = {
                    ...reports[index],
                    ...updates
                };
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_report_logs', reports);
                return {
                    success: true,
                    data: reports[index]
                };
            }
            return {
                success: false,
                error: 'Report not found'
            };
        }
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/reports/:id', {
                id
            }), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
        } catch (error) {
            console.error('[ReportsService] Error updating report:', error);
            return {
                success: false,
                error
            };
        }
    }
    async processReport(id, data) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_REPORTS) {
            const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
            const index = reports.findIndex((r)=>r.id === id);
            if (index !== -1) {
                reports[index] = {
                    ...reports[index],
                    processed: true,
                    processedAt: new Date().toISOString(),
                    banApplied: data.action === 'ban'
                };
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_report_logs', reports);
                return {
                    success: true,
                    data: reports[index]
                };
            }
            return {
                success: false,
                error: 'Report not found'
            };
        }
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/reports/:id/process', {
                id
            }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('[ReportsService] Error processing report:', error);
            return {
                success: false,
                error
            };
        }
    }
    async getReportStats() {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_REPORTS) {
            const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
            const stats = {
                total: reports.length,
                pending: reports.filter((r)=>!r.processed).length,
                resolved: reports.filter((r)=>r.processed).length,
                withBans: reports.filter((r)=>r.banApplied).length
            };
            return {
                success: true,
                data: stats
            };
        }
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_BASE_URL"], "/api/reports/stats"), {
                method: 'GET'
            });
        } catch (error) {
            console.error('[ReportsService] Error fetching stats:', error);
            return {
                success: false,
                error
            };
        }
    }
    async getUserReports(username) {
        let includeResolved = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_REPORTS) {
            const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
            const userReports = reports.filter((r)=>r.reportee === username && (includeResolved || !r.processed));
            return {
                success: true,
                data: {
                    reports: userReports
                }
            };
        }
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/reports/user/:username', {
                username
            }) + "?includeResolved=".concat(includeResolved), {
                method: 'GET'
            });
        } catch (error) {
            console.error('[ReportsService] Error fetching user reports:', error);
            return {
                success: false,
                error
            };
        }
    }
}
const reportsService = new ReportsService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/wallet.validation.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/wallet.validation.ts
__turbopack_context__.s({
    "WalletReconciliation": ()=>WalletReconciliation,
    "WalletValidation": ()=>WalletValidation
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/common.ts [app-client] (ecmascript)");
;
;
class WalletValidation {
    /**
   * Validate money amount
   */ static validateAmount(amount) {
        let min = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.LIMITS.MIN_TRANSACTION, max = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : this.LIMITS.MAX_TRANSACTION;
        if (amount < min) {
            return {
                valid: false,
                error: "Amount must be at least ".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].format(min))
            };
        }
        if (amount > max) {
            return {
                valid: false,
                error: "Amount cannot exceed ".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].format(max))
            };
        }
        // Check for integer cents
        if (!Number.isInteger(amount)) {
            return {
                valid: false,
                error: 'Invalid money amount'
            };
        }
        return {
            valid: true
        };
    }
    /**
   * Calculate platform fee
   */ static calculatePlatformFee(amount) {
        let feePercent = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.FEES.PLATFORM_PERCENT;
        const fee = Math.floor(amount * feePercent);
        const netAmount = amount - fee;
        return {
            fee,
            netAmount,
            grossAmount: amount
        };
    }
    /**
   * Calculate tier credit bonus
   */ static calculateTierCredit(amount, tierPercent) {
        return Math.floor(amount * tierPercent);
    }
    /**
   * Validate withdrawal limits
   */ static async validateWithdrawalLimits(userId, amount, transactions) {
        // Get today's withdrawals
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaysWithdrawals = transactions.filter((t)=>{
            const tDate = new Date(t.createdAt);
            return t.type === 'withdrawal' && t.from === userId && t.status === 'completed' && tDate >= today;
        });
        const totalWithdrawnToday = todaysWithdrawals.reduce((sum, t)=>sum + t.amount, 0);
        const remainingLimit = this.LIMITS.DAILY_WITHDRAWAL_LIMIT - totalWithdrawnToday;
        if (amount > remainingLimit) {
            return {
                valid: false,
                error: "Daily withdrawal limit exceeded. Remaining: ".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].format(remainingLimit)),
                remainingLimit
            };
        }
        return {
            valid: true,
            remainingLimit
        };
    }
    /**
   * Validate deposit limits
   */ static async validateDepositLimits(userId, amount, transactions) {
        // Get today's deposits
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaysDeposits = transactions.filter((t)=>{
            const tDate = new Date(t.createdAt);
            return t.type === 'deposit' && t.to === userId && t.status === 'completed' && tDate >= today;
        });
        const totalDepositedToday = todaysDeposits.reduce((sum, t)=>sum + t.amount, 0);
        const remainingLimit = this.LIMITS.DAILY_DEPOSIT_LIMIT - totalDepositedToday;
        if (amount > remainingLimit) {
            return {
                valid: false,
                error: "Daily deposit limit exceeded. Remaining: ".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].format(remainingLimit)),
                remainingLimit
            };
        }
        return {
            valid: true,
            remainingLimit
        };
    }
    /**
   * Check for suspicious activity
   */ static detectSuspiciousActivity(userId, transactions) {
        const reasons = [];
        let riskScore = 0;
        // Get user's recent transactions
        const userTransactions = transactions.filter((t)=>(t.from === userId || t.to === userId) && t.status === 'completed');
        // Check for rapid transactions
        const recentTransactions = userTransactions.filter((t)=>{
            const age = Date.now() - new Date(t.createdAt).getTime();
            return age < 3600000; // Last hour
        });
        if (recentTransactions.length > 10) {
            reasons.push('High transaction frequency');
            riskScore += 30;
        }
        // Check for large transactions
        const largeTransactions = userTransactions.filter((t)=>t.amount > __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(1000));
        if (largeTransactions.length > 5) {
            reasons.push('Multiple large transactions');
            riskScore += 25;
        }
        // Check for failed transactions
        const failedTransactions = transactions.filter((t)=>(t.from === userId || t.to === userId) && t.status === 'failed');
        const failureRate = failedTransactions.length / Math.max(userTransactions.length, 1);
        if (failureRate > 0.3) {
            reasons.push('High failure rate');
            riskScore += 20;
        }
        // Check for round-trip transactions
        const roundTrips = this.detectRoundTrips(userId, transactions);
        if (roundTrips.length > 0) {
            reasons.push('Potential money cycling detected');
            riskScore += 40;
        }
        return {
            suspicious: riskScore >= 50,
            reasons,
            riskScore
        };
    }
    /**
   * Detect round-trip transactions (potential money laundering)
   */ static detectRoundTrips(userId, transactions) {
        const roundTrips = [];
        const outgoing = transactions.filter((t)=>t.from === userId && t.status === 'completed');
        const incoming = transactions.filter((t)=>t.to === userId && t.status === 'completed');
        for (const out of outgoing){
            const matchingReturn = incoming.find((inc)=>{
                const timeDiff = Math.abs(new Date(inc.createdAt).getTime() - new Date(out.createdAt).getTime());
                return inc.from === out.to && Math.abs(inc.amount - out.amount) < __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(10) && timeDiff < 86400000 // 24 hours
                ;
            });
            if (matchingReturn) {
                roundTrips.push(out, matchingReturn);
            }
        }
        return roundTrips;
    }
    /**
   * Validate bank account details
   */ static validateBankAccount(accountDetails) {
        const errors = [];
        if (!accountDetails) {
            errors.push('Bank account details required');
            return {
                valid: false,
                errors
            };
        }
        // Handle both string and object types
        if (typeof accountDetails === 'string') {
            // If it's a string ID, minimal validation
            if (!accountDetails.trim()) {
                errors.push('Bank account ID cannot be empty');
            }
            return {
                valid: errors.length === 0,
                errors
            };
        }
        // Object validation
        if (!accountDetails.accountNumber) {
            errors.push('Account number required');
        }
        if (!accountDetails.routingNumber) {
            errors.push('Routing number required');
        }
        if (!accountDetails.accountHolderName) {
            errors.push('Account holder name required');
        }
        // Validate routing number format (US)
        if (accountDetails.routingNumber && !/^\d{9}$/.test(accountDetails.routingNumber)) {
            errors.push('Invalid routing number format');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
   * Calculate transaction fees
   */ static calculateTransactionFees(amount, type, metadata) {
        let baseFee = 0;
        let additionalFees = 0;
        switch(type){
            case 'purchase':
            case 'sale':
                baseFee = Math.floor(amount * this.FEES.PLATFORM_PERCENT);
                break;
            case 'subscription':
                baseFee = Math.floor(amount * this.FEES.SUBSCRIPTION_PERCENT);
                break;
            case 'withdrawal':
                baseFee = this.FEES.WITHDRAWAL_FLAT;
                // Add rush fee if applicable
                if ((metadata === null || metadata === void 0 ? void 0 : metadata.paymentMethod) === 'rush') {
                    additionalFees = Math.floor(amount * this.FEES.RUSH_WITHDRAWAL_PERCENT);
                }
                break;
            case 'tip':
                // No fees on tips
                baseFee = 0;
                break;
        }
        // Add international fee if applicable
        if (metadata === null || metadata === void 0 ? void 0 : metadata.bankAccount) {
            const bankAccount = typeof metadata.bankAccount === 'object' ? metadata.bankAccount : null;
            if ((bankAccount === null || bankAccount === void 0 ? void 0 : bankAccount.country) && bankAccount.country !== 'US') {
                additionalFees = additionalFees + Math.floor(amount * this.FEES.INTERNATIONAL_PERCENT);
            }
        }
        const totalFee = baseFee + additionalFees;
        const netAmount = amount - totalFee;
        return {
            baseFee,
            additionalFees,
            totalFee,
            netAmount
        };
    }
    /**
   * Format transaction for display
   */ static formatTransactionForDisplay(transaction) {
        const isCredit = transaction.type === 'deposit' || transaction.type === 'sale' || transaction.type === 'tip' && transaction.to !== undefined || transaction.type === 'admin_credit' || transaction.type === 'tier_credit' || transaction.type === 'refund' && transaction.to !== undefined;
        const typeMap = {
            deposit: 'Deposit',
            withdrawal: 'Withdrawal',
            purchase: 'Purchase',
            sale: 'Sale',
            tip: 'Tip',
            subscription: 'Subscription',
            admin_credit: 'Admin Credit',
            admin_debit: 'Admin Debit',
            refund: 'Refund',
            fee: 'Platform Fee',
            tier_credit: 'Tier Bonus'
        };
        const statusColorMap = {
            pending: 'text-yellow-500',
            completed: 'text-green-500',
            failed: 'text-red-500',
            cancelled: 'text-gray-500'
        };
        return {
            displayAmount: "".concat(isCredit ? '+' : '-').concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].format(transaction.amount)),
            displayType: typeMap[transaction.type] || transaction.type,
            displayStatus: transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1),
            displayDate: new Date(transaction.createdAt).toLocaleString(),
            displayDescription: transaction.description,
            isCredit: isCredit,
            statusColor: statusColorMap[transaction.status]
        };
    }
    /**
   * Validate refund eligibility
   */ static validateRefundEligibility(originalTransaction, refundAmount) {
        // Check if transaction can be refunded
        if (originalTransaction.type !== 'purchase' && originalTransaction.type !== 'sale') {
            return {
                eligible: false,
                reason: 'Only purchases can be refunded',
                maxRefundable: 0
            };
        }
        if (originalTransaction.status !== 'completed') {
            return {
                eligible: false,
                reason: 'Only completed transactions can be refunded',
                maxRefundable: 0
            };
        }
        if (originalTransaction.reversedBy) {
            return {
                eligible: false,
                reason: 'Transaction already refunded',
                maxRefundable: 0
            };
        }
        // Check refund window (30 days)
        const transactionAge = Date.now() - new Date(originalTransaction.createdAt).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (transactionAge > thirtyDays) {
            return {
                eligible: false,
                reason: 'Refund window expired (30 days)',
                maxRefundable: 0
            };
        }
        // Check refund amount
        if (refundAmount > originalTransaction.amount) {
            return {
                eligible: false,
                reason: 'Refund amount exceeds original transaction',
                maxRefundable: originalTransaction.amount
            };
        }
        return {
            eligible: true,
            maxRefundable: originalTransaction.amount
        };
    }
}
// Financial limits
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(WalletValidation, "LIMITS", {
    MIN_TRANSACTION: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(0.01),
    MAX_TRANSACTION: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(50000),
    MIN_DEPOSIT: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(1),
    MAX_DEPOSIT: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(10000),
    MIN_WITHDRAWAL: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(10),
    MAX_WITHDRAWAL: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(5000),
    MIN_TIP: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(1),
    MAX_TIP: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(500),
    DAILY_DEPOSIT_LIMIT: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(50000),
    DAILY_WITHDRAWAL_LIMIT: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(10000)
});
// Fee structure
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(WalletValidation, "FEES", {
    PLATFORM_PERCENT: 0.10,
    SUBSCRIPTION_PERCENT: 0.25,
    WITHDRAWAL_FLAT: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(0),
    INTERNATIONAL_PERCENT: 0.03,
    RUSH_WITHDRAWAL_PERCENT: 0.05
});
class WalletReconciliation {
    /**
   * Reconcile wallet balances with transaction history
   */ static async reconcileBalance(userId, role, transactions, currentBalance) {
        let credits = 0;
        let debits = 0;
        let pendingCredits = 0;
        let pendingDebits = 0;
        for (const transaction of transactions){
            // Credits
            if (transaction.to === userId && transaction.toRole === role) {
                if (transaction.status === 'completed') {
                    credits += transaction.amount;
                } else if (transaction.status === 'pending') {
                    pendingCredits += transaction.amount;
                }
            }
            // Debits
            if (transaction.from === userId && transaction.fromRole === role) {
                if (transaction.status === 'completed') {
                    debits += transaction.amount;
                } else if (transaction.status === 'pending') {
                    pendingDebits += transaction.amount;
                }
            }
        }
        const calculatedBalance = credits - debits;
        const discrepancy = currentBalance - calculatedBalance;
        return {
            calculatedBalance,
            discrepancy,
            isReconciled: discrepancy === 0,
            details: {
                credits: credits,
                debits: debits,
                pendingCredits: pendingCredits,
                pendingDebits: pendingDebits
            }
        };
    }
    /**
   * Generate financial report
   */ static generateFinancialReport(transactions, startDate, endDate) {
        const filtered = transactions.filter((t)=>{
            const date = new Date(t.createdAt);
            return date >= startDate && date <= endDate && t.status === 'completed';
        });
        const breakdown = {};
        let totalRevenue = 0;
        let totalFees = 0;
        let totalWithdrawals = 0;
        let totalDeposits = 0;
        for (const transaction of filtered){
            // Update breakdown
            if (!breakdown[transaction.type]) {
                breakdown[transaction.type] = {
                    count: 0,
                    total: 0
                };
            }
            breakdown[transaction.type].count++;
            breakdown[transaction.type].total = breakdown[transaction.type].total + transaction.amount;
            // Calculate totals
            switch(transaction.type){
                case 'deposit':
                    totalDeposits += transaction.amount;
                    break;
                case 'withdrawal':
                    totalWithdrawals += transaction.amount;
                    break;
                case 'fee':
                    totalFees += transaction.amount;
                    totalRevenue += transaction.amount;
                    break;
                case 'purchase':
                case 'sale':
                    var _transaction_metadata;
                    if ((_transaction_metadata = transaction.metadata) === null || _transaction_metadata === void 0 ? void 0 : _transaction_metadata.platformFee) {
                        totalFees += transaction.metadata.platformFee;
                        totalRevenue += transaction.metadata.platformFee;
                    }
                    break;
            }
        }
        const netIncome = totalRevenue - totalWithdrawals;
        const averageTransactionSize = filtered.length > 0 ? Math.floor(filtered.reduce((sum, t)=>sum + t.amount, 0) / filtered.length) : 0;
        return {
            totalRevenue: totalRevenue,
            totalFees: totalFees,
            totalWithdrawals: totalWithdrawals,
            totalDeposits: totalDeposits,
            netIncome,
            transactionCount: filtered.length,
            averageTransactionSize,
            breakdown
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/wallet.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/wallet.service.ts
__turbopack_context__.s({
    "WalletService": ()=>WalletService,
    "default": ()=>__TURBOPACK__default__export__,
    "walletService": ()=>walletService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/common.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/wallet.validation.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
;
;
;
;
;
class WalletService {
    static getInstance() {
        if (!WalletService.instance) {
            WalletService.instance = new WalletService();
        }
        return WalletService.instance;
    }
    /**
   * Get wallet balance
   */ async getBalance(username) {
        try {
            // For admin users, always get platform wallet
            if (this.isAdminUser(username)) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/wallet/admin-platform-balance');
            }
            const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/wallet/balance/:username', {
                username
            });
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(url);
        } catch (error) {
            console.error('[WalletService] Get balance error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get balance'
                }
            };
        }
    }
    /**
   * Make a deposit
   */ async deposit(request) {
        try {
            // Validate amount using Money type for precision
            const moneyAmount = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(request.amount);
            const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].validateAmount(moneyAmount, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].LIMITS.MIN_DEPOSIT, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].LIMITS.MAX_DEPOSIT);
            if (!validation.valid) {
                return {
                    success: false,
                    error: {
                        message: validation.error || 'Invalid amount'
                    }
                };
            }
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/wallet/deposit', {
                method: 'POST',
                body: JSON.stringify(request)
            });
        } catch (error) {
            console.error('[WalletService] Deposit error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to process deposit'
                }
            };
        }
    }
    /**
   * Make a withdrawal
   */ async withdraw(request) {
        try {
            // Validate amount using Money type
            const moneyAmount = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(request.amount);
            const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].validateAmount(moneyAmount, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].LIMITS.MIN_WITHDRAWAL, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].LIMITS.MAX_WITHDRAWAL);
            if (!validation.valid) {
                return {
                    success: false,
                    error: {
                        message: validation.error || 'Invalid amount'
                    }
                };
            }
            // Validate bank account if provided
            if (request.accountDetails) {
                const accountValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].validateBankAccount(request.accountDetails);
                if (!accountValidation.valid) {
                    return {
                        success: false,
                        error: {
                            message: accountValidation.errors.join(', ')
                        }
                    };
                }
            }
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/wallet/withdraw', {
                method: 'POST',
                body: JSON.stringify(request)
            });
        } catch (error) {
            console.error('[WalletService] Withdrawal error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to process withdrawal'
                }
            };
        }
    }
    /**
   * Process admin action (credit/debit)
   */ async processAdminAction(request) {
        try {
            // Validate inputs
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(request.username);
            if (!sanitizedUsername) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid username'
                    }
                };
            }
            const sanitizedAmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(request.amount);
            if (sanitizedAmount <= 0) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid amount'
                    }
                };
            }
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/wallet/admin-actions', {
                method: 'POST',
                body: JSON.stringify({
                    ...request,
                    username: sanitizedUsername,
                    amount: sanitizedAmount
                })
            });
        } catch (error) {
            console.error('[WalletService] Admin action error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to process admin action'
                }
            };
        }
    }
    /**
   * Get transaction history
   */ async getTransactions(username, filters) {
        try {
            // For admin users, use platform
            const queryUsername = this.isAdminUser(username) ? 'platform' : username;
            const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/wallet/transactions/:username', {
                username: queryUsername
            });
            // Build query string
            const params = new URLSearchParams();
            if (filters) {
                Object.entries(filters).forEach((param)=>{
                    let [key, value] = param;
                    if (value !== undefined) {
                        params.append(key, String(value));
                    }
                });
            }
            const finalUrl = params.toString() ? "".concat(url, "?").concat(params) : url;
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(finalUrl);
        } catch (error) {
            console.error('[WalletService] Get transactions error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get transactions'
                }
            };
        }
    }
    /**
   * Get admin analytics
   */ async getAdminAnalytics() {
        let timeFilter = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'all';
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/wallet/admin/analytics?timeFilter=".concat(timeFilter));
        } catch (error) {
            console.error('[WalletService] Get analytics error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get analytics'
                }
            };
        }
    }
    /**
   * Get platform transactions (admin only)
   */ async getPlatformTransactions() {
        let limit = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 100, page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
        try {
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/wallet/platform-transactions?limit=".concat(limit, "&page=").concat(page));
        } catch (error) {
            console.error('[WalletService] Get platform transactions error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get platform transactions'
                }
            };
        }
    }
    /**
   * Process admin withdrawal from platform wallet
   */ async processAdminWithdrawal(amount, notes) {
        try {
            // Validate amount
            const moneyAmount = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(amount);
            const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].validateAmount(moneyAmount, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].LIMITS.MIN_WITHDRAWAL, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].LIMITS.MAX_WITHDRAWAL);
            if (!validation.valid) {
                return {
                    success: false,
                    error: {
                        message: validation.error || 'Invalid amount'
                    }
                };
            }
            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/wallet/admin-withdraw', {
                method: 'POST',
                body: JSON.stringify({
                    amount,
                    accountDetails: {
                        accountNumber: '****9999',
                        accountType: 'business'
                    },
                    notes
                })
            });
        } catch (error) {
            console.error('[WalletService] Admin withdrawal error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to process admin withdrawal'
                }
            };
        }
    }
    /**
   * Check for suspicious activity
   */ async checkSuspiciousActivity(username) {
        try {
            const response = await this.getTransactions(username);
            if (!response.success || !response.data) {
                return {
                    suspicious: false,
                    reasons: [],
                    riskScore: 0
                };
            }
            // Convert API transactions to validation Transaction type
            const transactions = response.data.map((t)=>({
                    ...t,
                    amount: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(t.amount),
                    from: t.from ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserId"])(t.from) : undefined,
                    to: t.to ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserId"])(t.to) : undefined
                }));
            return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].detectSuspiciousActivity((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserId"])(username), transactions);
        } catch (error) {
            console.error('[WalletService] Check suspicious activity error:', error);
            return {
                suspicious: false,
                reasons: [],
                riskScore: 0
            };
        }
    }
    /**
   * Format transaction for display
   */ formatTransaction(transaction) {
        // Convert to Money type for formatting
        const moneyAmount = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(transaction.amount);
        const formatted = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].formatTransactionForDisplay({
            ...transaction,
            amount: moneyAmount,
            from: transaction.from ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserId"])(transaction.from) : undefined,
            to: transaction.to ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserId"])(transaction.to) : undefined
        });
        return {
            displayAmount: formatted.displayAmount,
            displayType: formatted.displayType,
            displayStatus: formatted.displayStatus,
            displayDate: formatted.displayDate,
            isCredit: formatted.isCredit,
            statusColor: formatted.statusColor
        };
    }
    /**
   * Calculate fees for a transaction
   */ calculateFees(amount, type) {
        const moneyAmount = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].fromDollars(amount);
        const fees = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WalletValidation"].calculateTransactionFees(moneyAmount, type);
        return {
            platformFee: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].toDollars(fees.totalFee),
            netAmount: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$common$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Money"].toDollars(fees.netAmount)
        };
    }
    /**
   * Helper to check if user is admin
   */ isAdminUser(username) {
        return username === 'oakley' || username === 'gerome' || username === 'platform' || username === 'admin';
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(WalletService, "instance", void 0);
const walletService = WalletService.getInstance();
const __TURBOPACK__default__export__ = walletService;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/listings.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/listings.service.ts
__turbopack_context__.s({
    "ListingsService": ()=>ListingsService,
    "listingsService": ()=>listingsService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
;
;
;
;
;
;
;
;
;
// Reference for mount checking
let mountedRef = {
    current: true
};
if ("TURBOPACK compile-time truthy", 1) {
    window.addEventListener('beforeunload', ()=>{
        mountedRef.current = false;
    });
}
// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const VIEW_CACHE_DURATION = 30 * 1000; // 30 seconds
// Create a custom schema for listing creation that handles number conversion properly
const createListingValidationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingSchemas"].title,
    description: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingSchemas"].description,
    price: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().min(0.01).max(10000),
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingSchemas"].tags.optional(),
    seller: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authSchemas"].username,
    hoursWorn: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(720).optional()
});
/**
 * Convert backend listing format to frontend format with isLocked support
 */ function convertBackendToFrontend(backendListing) {
    var _backendListing_auction;
    // Handle both _id and id fields
    const listingId = backendListing._id || backendListing.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])();
    const frontendListing = {
        id: listingId,
        title: backendListing.title,
        description: backendListing.description,
        price: backendListing.price || 0,
        markedUpPrice: backendListing.markedUpPrice || Math.round((backendListing.price || 0) * 1.1 * 100) / 100,
        imageUrls: backendListing.imageUrls || [],
        date: backendListing.createdAt,
        seller: backendListing.seller,
        isVerified: backendListing.isVerified || false,
        isPremium: backendListing.isPremium || false,
        isLocked: backendListing.isLocked || false,
        tags: backendListing.tags || [],
        hoursWorn: backendListing.hoursWorn,
        views: backendListing.views || 0
    };
    // Convert auction data if present with reserve price support
    if ((_backendListing_auction = backendListing.auction) === null || _backendListing_auction === void 0 ? void 0 : _backendListing_auction.isAuction) {
        frontendListing.auction = {
            isAuction: true,
            startingPrice: Math.floor(backendListing.auction.startingPrice || 0),
            reservePrice: backendListing.auction.reservePrice ? Math.floor(backendListing.auction.reservePrice) : undefined,
            endTime: backendListing.auction.endTime,
            bids: backendListing.auction.bids.map((bid)=>({
                    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    bidder: bid.bidder,
                    amount: Math.floor(bid.amount || 0),
                    date: bid.date
                })),
            // Always floor the currentBid to remove any decimals
            highestBid: backendListing.auction.currentBid > 0 ? Math.floor(backendListing.auction.currentBid) : undefined,
            highestBidder: backendListing.auction.highestBidder,
            status: backendListing.auction.status === 'active' ? 'active' : backendListing.auction.status === 'ended' ? 'ended' : backendListing.auction.status === 'reserve_not_met' ? 'reserve_not_met' : 'cancelled',
            minimumIncrement: Math.floor(backendListing.auction.bidIncrement || 1)
        };
    }
    return frontendListing;
}
/**
 * Convert frontend listing format to backend format for creation
 */ function convertFrontendToBackend(frontendListing) {
    const backendListing = {
        title: frontendListing.title,
        description: frontendListing.description,
        imageUrls: frontendListing.imageUrls,
        seller: frontendListing.seller,
        isVerified: frontendListing.isVerified,
        isPremium: frontendListing.isPremium,
        tags: frontendListing.tags,
        hoursWorn: frontendListing.hoursWorn
    };
    // Handle auction vs regular listing with reserve price
    if (frontendListing.auction) {
        backendListing.isAuction = true;
        backendListing.startingPrice = frontendListing.auction.startingPrice;
        backendListing.reservePrice = frontendListing.auction.reservePrice;
        backendListing.endTime = frontendListing.auction.endTime;
    } else {
        backendListing.price = frontendListing.price;
    }
    return backendListing;
}
class ListingsService {
    /**
   * Get all listings with optional filtering
   */ async getListings(params) {
        try {
            console.log('[ListingsService] Getting listings with params:', params);
            // Sanitize search params if provided
            if (params) {
                if (params.query) {
                    params.query = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].searchQuery(params.query);
                }
                if (params.seller) {
                    params.seller = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(params.seller);
                }
                if (params.tags) {
                    params.tags = params.tags.map((tag)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(tag));
                }
                if (params.minPrice !== undefined) {
                    params.minPrice = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].number(params.minPrice, 0, 10000);
                }
                if (params.maxPrice !== undefined) {
                    params.maxPrice = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].number(params.maxPrice, 0, 10000);
                }
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                console.log('[ListingsService] Using backend API for listings');
                const queryParams = new URLSearchParams();
                if (params) {
                    // Map frontend params to backend params
                    if (params.query) queryParams.append('search', params.query);
                    if (params.seller) queryParams.append('seller', params.seller);
                    if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
                    if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
                    if (params.tags) queryParams.append('tags', params.tags.join(','));
                    if (params.isPremium !== undefined) queryParams.append('isPremium', params.isPremium.toString());
                    if (params.isAuction !== undefined) queryParams.append('isAuction', params.isAuction.toString());
                    if (params.sortBy) {
                        const sortMap = {
                            'date': 'date',
                            'price': 'price',
                            'views': 'views',
                            'endingSoon': 'date' // Backend doesn't have endingSoon, use date
                        };
                        queryParams.append('sort', sortMap[params.sortBy] || 'date');
                    }
                    if (params.sortOrder) queryParams.append('order', params.sortOrder);
                    if (params.page !== undefined) queryParams.append('page', (params.page + 1).toString()); // Frontend is 0-based
                    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
                }
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings?".concat(queryParams.toString()));
                if (response.success) {
                    var _response_data, _response_data1;
                    // Handle both direct array response and nested data structure
                    const listings = ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.data) || response.data || [];
                    const convertedListings = listings.map(convertBackendToFrontend);
                    console.log('[ListingsService] Converted backend listings:', convertedListings.length);
                    // Update cache only if no filters
                    if (!params) {
                        this.listingsCache = {
                            data: convertedListings,
                            timestamp: Date.now()
                        };
                    }
                    return {
                        success: true,
                        data: convertedListings,
                        meta: ((_response_data1 = response.data) === null || _response_data1 === void 0 ? void 0 : _response_data1.meta) || response.meta
                    };
                } else {
                    var _response_error;
                    throw new Error(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to fetch listings from backend');
                }
            }
            // Fallback to localStorage implementation
            console.log('[ListingsService] Using localStorage fallback');
            // Check cache first - but ONLY if no params are provided
            const now = Date.now();
            if (!params && this.listingsCache.data && now - this.listingsCache.timestamp < CACHE_DURATION) {
                console.log('[ListingsService] Returning cached listings:', this.listingsCache.data.length);
                return {
                    success: true,
                    data: this.listingsCache.data
                };
            }
            // LocalStorage implementation
            const listings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listings', []);
            console.log('[ListingsService] Found listings in storage:', listings.length);
            if (listings.length === 0) {
                console.warn('[ListingsService] No listings found in storage! Check if listings are being created properly.');
            }
            // Update cache only if no filters
            if (!params) {
                this.listingsCache = {
                    data: listings,
                    timestamp: now
                };
            }
            let filteredListings = [
                ...listings
            ];
            // Apply filters (same as before)
            if (params) {
                const beforeFilterCount = filteredListings.length;
                // Active filter (not ended auctions)
                if (params.isActive !== undefined && params.isActive === true) {
                    filteredListings = filteredListings.filter((listing)=>{
                        // For non-auction listings, always consider them active
                        if (!listing.auction) return true;
                        // For auction listings, check end time
                        const now = new Date();
                        const endTime = new Date(listing.auction.endTime);
                        const isActive = endTime > now;
                        return isActive;
                    });
                    console.log("[ListingsService] Active filter: ".concat(beforeFilterCount, " -> ").concat(filteredListings.length));
                }
                if (params.query) {
                    const beforeQueryCount = filteredListings.length;
                    const query = params.query.toLowerCase();
                    filteredListings = filteredListings.filter((listing)=>{
                        var _listing_tags;
                        return listing.title.toLowerCase().includes(query) || listing.description.toLowerCase().includes(query) || ((_listing_tags = listing.tags) === null || _listing_tags === void 0 ? void 0 : _listing_tags.some((tag)=>tag.toLowerCase().includes(query))) || listing.seller.toLowerCase().includes(query);
                    });
                    console.log('[ListingsService] Query filter "'.concat(params.query, '": ').concat(beforeQueryCount, " -> ").concat(filteredListings.length));
                }
                if (params.seller) {
                    const beforeSellerCount = filteredListings.length;
                    filteredListings = filteredListings.filter((listing)=>listing.seller === params.seller);
                    console.log('[ListingsService] Seller filter "'.concat(params.seller, '": ').concat(beforeSellerCount, " -> ").concat(filteredListings.length));
                }
                if (params.minPrice !== undefined) {
                    const beforeMinPriceCount = filteredListings.length;
                    filteredListings = filteredListings.filter((listing)=>{
                        var _listing_auction;
                        const price = ((_listing_auction = listing.auction) === null || _listing_auction === void 0 ? void 0 : _listing_auction.highestBid) || listing.price;
                        return price >= params.minPrice;
                    });
                    console.log("[ListingsService] Min price filter ".concat(params.minPrice, ": ").concat(beforeMinPriceCount, " -> ").concat(filteredListings.length));
                }
                if (params.maxPrice !== undefined) {
                    const beforeMaxPriceCount = filteredListings.length;
                    filteredListings = filteredListings.filter((listing)=>{
                        var _listing_auction;
                        const price = ((_listing_auction = listing.auction) === null || _listing_auction === void 0 ? void 0 : _listing_auction.highestBid) || listing.price;
                        return price <= params.maxPrice;
                    });
                    console.log("[ListingsService] Max price filter ".concat(params.maxPrice, ": ").concat(beforeMaxPriceCount, " -> ").concat(filteredListings.length));
                }
                if (params.tags && params.tags.length > 0) {
                    const beforeTagsCount = filteredListings.length;
                    filteredListings = filteredListings.filter((listing)=>{
                        var _listing_tags;
                        return (_listing_tags = listing.tags) === null || _listing_tags === void 0 ? void 0 : _listing_tags.some((tag)=>params.tags.includes(tag));
                    });
                    console.log("[ListingsService] Tags filter: ".concat(beforeTagsCount, " -> ").concat(filteredListings.length));
                }
                if (params.isPremium !== undefined) {
                    const beforePremiumCount = filteredListings.length;
                    filteredListings = filteredListings.filter((listing)=>listing.isPremium === params.isPremium);
                    console.log("[ListingsService] Premium filter ".concat(params.isPremium, ": ").concat(beforePremiumCount, " -> ").concat(filteredListings.length));
                }
                if (params.isAuction !== undefined) {
                    const beforeAuctionCount = filteredListings.length;
                    filteredListings = filteredListings.filter((listing)=>params.isAuction ? !!listing.auction : !listing.auction);
                    console.log("[ListingsService] Auction filter ".concat(params.isAuction, ": ").concat(beforeAuctionCount, " -> ").concat(filteredListings.length));
                }
                // Sorting
                if (params.sortBy) {
                    console.log("[ListingsService] Sorting by ".concat(params.sortBy, " ").concat(params.sortOrder || 'asc'));
                    filteredListings.sort((a, b)=>{
                        let compareValue = 0;
                        switch(params.sortBy){
                            case 'date':
                                compareValue = new Date(b.date).getTime() - new Date(a.date).getTime();
                                break;
                            case 'price':
                                var _a_auction, _b_auction;
                                const aPrice = ((_a_auction = a.auction) === null || _a_auction === void 0 ? void 0 : _a_auction.highestBid) || a.price;
                                const bPrice = ((_b_auction = b.auction) === null || _b_auction === void 0 ? void 0 : _b_auction.highestBid) || b.price;
                                compareValue = aPrice - bPrice;
                                break;
                            case 'views':
                                // Would need to load views data for each listing
                                compareValue = 0;
                                break;
                            case 'endingSoon':
                                // Sort auctions by end time, non-auctions last
                                if (a.auction && b.auction) {
                                    compareValue = new Date(a.auction.endTime).getTime() - new Date(b.auction.endTime).getTime();
                                } else if (a.auction) {
                                    compareValue = -1;
                                } else if (b.auction) {
                                    compareValue = 1;
                                }
                                break;
                        }
                        return params.sortOrder === 'desc' ? -compareValue : compareValue;
                    });
                }
                // Pagination - only if explicitly requested
                if (params.page !== undefined && params.limit) {
                    const start = params.page * params.limit;
                    const end = start + params.limit;
                    console.log("[ListingsService] Paginating: page ".concat(params.page, ", limit ").concat(params.limit, ", showing ").concat(start, "-").concat(end, " of ").concat(filteredListings.length));
                    return {
                        success: true,
                        data: filteredListings.slice(start, end),
                        meta: {
                            page: params.page,
                            totalPages: Math.ceil(filteredListings.length / params.limit),
                            totalItems: filteredListings.length
                        }
                    };
                }
            }
            console.log('[ListingsService] Returning listings:', filteredListings.length);
            return {
                success: true,
                data: filteredListings,
                meta: {
                    totalItems: filteredListings.length
                }
            };
        } catch (error) {
            console.error('[ListingsService] Get listings error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get listings'
                }
            };
        }
    }
    /**
   * Get single listing by ID with premium access checking
   */ async getListing(id) {
        try {
            // Sanitize ID
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(id);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                console.log('[ListingsService] Fetching listing from backend:', sanitizedId);
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(sanitizedId));
                if (!mountedRef.current) return {
                    success: false,
                    error: {
                        message: 'Component unmounted'
                    }
                };
                if (response.success && response.data) {
                    var _response_data;
                    // Handle both direct data and nested data structure
                    const listingData = response.data.data || response.data;
                    const convertedListing = convertBackendToFrontend(listingData);
                    // Check for premiumAccess in the response data
                    const responseAsAny = response;
                    var _response_data_premiumAccess;
                    const premiumAccess = (_response_data_premiumAccess = (_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.premiumAccess) !== null && _response_data_premiumAccess !== void 0 ? _response_data_premiumAccess : responseAsAny.premiumAccess;
                    if (premiumAccess !== undefined) {
                        console.log('[ListingsService] Premium access for listing:', premiumAccess);
                    }
                    return {
                        success: true,
                        data: convertedListing,
                        meta: {
                            premiumAccess
                        }
                    };
                } else {
                    return {
                        success: true,
                        data: null
                    };
                }
            }
            // Try cache first
            if (this.listingsCache.data) {
                const cachedListing = this.listingsCache.data.find((l)=>l.id === sanitizedId);
                if (cachedListing) {
                    return {
                        success: true,
                        data: cachedListing
                    };
                }
            }
            // LocalStorage implementation
            const listings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listings', []);
            const listing = listings.find((l)=>l.id === sanitizedId);
            return {
                success: true,
                data: listing || null
            };
        } catch (error) {
            var _error_message;
            console.error('Get listing error:', error);
            // Handle 403 errors for premium content
            if (error.status === 403 || ((_error_message = error.message) === null || _error_message === void 0 ? void 0 : _error_message.includes('subscribe'))) {
                return {
                    success: false,
                    error: {
                        message: error.message || 'Premium content - subscription required',
                        requiresSubscription: true,
                        seller: error.seller
                    }
                };
            }
            return {
                success: false,
                error: {
                    message: 'Failed to get listing'
                }
            };
        }
    }
    /**
   * Get listings by seller
   */ async getListingsBySeller(username) {
        try {
            // Sanitize username
            const sanitizedUsername = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(username);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings?seller=".concat(sanitizedUsername));
                if (response.success) {
                    var _response_data, _response_data1;
                    // Handle both direct array response and nested data structure
                    const listings = ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.data) || response.data || [];
                    const convertedListings = listings.map(convertBackendToFrontend);
                    return {
                        success: true,
                        data: convertedListings,
                        meta: ((_response_data1 = response.data) === null || _response_data1 === void 0 ? void 0 : _response_data1.meta) || response.meta
                    };
                }
                return {
                    success: false,
                    error: response.error || {
                        message: 'Failed to get seller listings'
                    }
                };
            }
            // LocalStorage implementation
            return this.getListings({
                seller: sanitizedUsername
            });
        } catch (error) {
            console.error('Get listings by seller error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get seller listings'
                }
            };
        }
    }
    /**
   * Create new listing with reserve price support
   */ async createListing(request) {
        try {
            console.log('[ListingsService] Creating listing:', request);
            // Check rate limit
            const rateLimiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])();
            const rateLimit = rateLimiter.check('LISTING_CREATE', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].LISTING_CREATE);
            if (!rateLimit.allowed) {
                return {
                    success: false,
                    error: {
                        message: "Rate limit exceeded. Please wait ".concat(rateLimit.waitTime, " seconds.")
                    }
                };
            }
            // Ensure proper number types for validation
            const validationData = {
                title: request.title,
                description: request.description,
                price: typeof request.price === 'string' ? parseFloat(request.price) : request.price,
                seller: request.seller,
                tags: request.tags,
                hoursWorn: request.hoursWorn ? typeof request.hoursWorn === 'string' ? parseInt(request.hoursWorn) : request.hoursWorn : undefined
            };
            // Validate and sanitize the request
            const validation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAndSanitize(validationData, createListingValidationSchema, {
                title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict,
                description: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict,
                seller: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username,
                tags: (tags)=>tags ? tags.map((tag)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(tag)) : undefined
            });
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid listing data',
                        details: validation.errors
                    }
                };
            }
            const sanitizedData = validation.data;
            // Validate image URLs
            for (const imageUrl of request.imageUrls){
                const sanitizedUrl = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].url(imageUrl);
                if (!sanitizedUrl) {
                    return {
                        success: false,
                        error: {
                            message: 'Invalid image URL provided'
                        }
                    };
                }
            }
            // Validate reserve price if auction
            if (request.auction) {
                if (request.auction.reservePrice && request.auction.reservePrice < request.auction.startingPrice) {
                    return {
                        success: false,
                        error: {
                            message: 'Reserve price must be at least the starting price'
                        }
                    };
                }
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                console.log('[ListingsService] Creating listing via backend API');
                const backendRequest = convertFrontendToBackend({
                    ...sanitizedData,
                    imageUrls: request.imageUrls,
                    isVerified: request.isVerified,
                    isPremium: request.isPremium,
                    auction: request.auction
                });
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/listings', {
                    method: 'POST',
                    body: JSON.stringify(backendRequest)
                });
                console.log('[ListingsService] Backend response:', response);
                if (response.success && response.data) {
                    const convertedListing = convertBackendToFrontend(response.data);
                    // Invalidate cache
                    this.invalidateCache();
                    return {
                        success: true,
                        data: convertedListing
                    };
                } else {
                    var _response_error;
                    throw new Error(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Backend API error');
                }
            }
            // LocalStorage implementation (fallback)
            const listings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listings', []);
            console.log('[ListingsService] Current listings count before create:', listings.length);
            const newListing = {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                title: sanitizedData.title,
                description: sanitizedData.description,
                price: sanitizedData.price,
                markedUpPrice: Math.round(sanitizedData.price * 1.1 * 100) / 100,
                imageUrls: request.imageUrls || [],
                date: new Date().toISOString(),
                seller: sanitizedData.seller,
                isVerified: request.isVerified || false,
                isPremium: request.isPremium || false,
                tags: sanitizedData.tags || [],
                hoursWorn: sanitizedData.hoursWorn,
                views: 0,
                auction: request.auction ? {
                    isAuction: true,
                    startingPrice: request.auction.startingPrice,
                    reservePrice: request.auction.reservePrice,
                    endTime: request.auction.endTime,
                    bids: [],
                    highestBid: undefined,
                    highestBidder: undefined,
                    status: 'active'
                } : undefined
            };
            console.log('[ListingsService] New listing object:', newListing);
            listings.push(newListing);
            const saveResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('listings', listings);
            if (!saveResult) {
                throw new Error('Failed to save listings to storage');
            }
            // Verify the save
            const verifyListings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listings', []);
            console.log('[ListingsService] Verified listings count after save:', verifyListings.length);
            // Check if our listing is in the saved data
            const savedListing = verifyListings.find((l)=>l.id === newListing.id);
            if (!savedListing) {
                throw new Error('Listing was not properly saved to storage');
            }
            // Invalidate cache
            this.invalidateCache();
            return {
                success: true,
                data: newListing
            };
        } catch (error) {
            console.error('[ListingsService] Create listing error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to create listing: ' + error.message
                }
            };
        }
    }
    /**
   * Update existing listing
   */ async updateListing(id, updates) {
        try {
            // Sanitize ID
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(id);
            // Sanitize updates
            const sanitizedUpdates = {};
            if (updates.title !== undefined) {
                sanitizedUpdates.title = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(updates.title);
            }
            if (updates.description !== undefined) {
                sanitizedUpdates.description = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(updates.description);
            }
            if (updates.price !== undefined) {
                sanitizedUpdates.price = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].number(updates.price, 0.01, 10000);
            }
            if (updates.tags !== undefined) {
                sanitizedUpdates.tags = updates.tags.map((tag)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(tag));
            }
            if (updates.hoursWorn !== undefined) {
                sanitizedUpdates.hoursWorn = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].number(updates.hoursWorn, 0, 30);
            }
            if (updates.imageUrls !== undefined) {
                // Validate image URLs
                for (const imageUrl of updates.imageUrls){
                    const sanitizedUrl = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].url(imageUrl);
                    if (!sanitizedUrl) {
                        return {
                            success: false,
                            error: {
                                message: 'Invalid image URL provided'
                            }
                        };
                    }
                }
                sanitizedUpdates.imageUrls = updates.imageUrls;
            }
            if (updates.isPremium !== undefined) {
                sanitizedUpdates.isPremium = updates.isPremium;
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                console.log('[ListingsService] Updating listing via backend API:', sanitizedId);
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(sanitizedId), {
                    method: 'PATCH',
                    body: JSON.stringify(sanitizedUpdates)
                });
                if (response.success && response.data) {
                    const convertedListing = convertBackendToFrontend(response.data);
                    // Invalidate cache
                    this.invalidateCache();
                    return {
                        success: true,
                        data: convertedListing
                    };
                } else {
                    var _response_error;
                    throw new Error(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Backend API error');
                }
            }
            // LocalStorage implementation
            const listings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listings', []);
            const index = listings.findIndex((l)=>l.id === sanitizedId);
            if (index === -1) {
                return {
                    success: false,
                    error: {
                        message: 'Listing not found'
                    }
                };
            }
            const updatedListing = {
                ...listings[index],
                ...sanitizedUpdates,
                markedUpPrice: sanitizedUpdates.price ? Math.round(sanitizedUpdates.price * 1.1 * 100) / 100 : listings[index].markedUpPrice
            };
            listings[index] = updatedListing;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('listings', listings);
            // Invalidate cache
            this.invalidateCache();
            return {
                success: true,
                data: updatedListing
            };
        } catch (error) {
            console.error('Update listing error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to update listing'
                }
            };
        }
    }
    /**
   * Delete listing - Enhanced with event broadcasting
   */ async deleteListing(id) {
        try {
            console.log('[ListingsService] Deleting listing:', id);
            // Sanitize ID
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(id);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                console.log('[ListingsService] Deleting listing via backend API:', sanitizedId);
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(sanitizedId), {
                    method: 'DELETE'
                });
                if (response.success) {
                    // Invalidate cache
                    this.invalidateCache();
                    // Trigger a custom event to notify other components
                    if ("TURBOPACK compile-time truthy", 1) {
                        window.dispatchEvent(new CustomEvent('listingDeleted', {
                            detail: {
                                listingId: sanitizedId
                            }
                        }));
                    }
                    return {
                        success: true
                    };
                } else {
                    var _response_error;
                    throw new Error(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Backend API error');
                }
            }
            // LocalStorage implementation
            const listings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listings', []);
            const beforeCount = listings.length;
            const filtered = listings.filter((l)=>l.id !== sanitizedId);
            const afterCount = filtered.length;
            console.log("[ListingsService] Delete listing: ".concat(beforeCount, " -> ").concat(afterCount, " listings"));
            if (beforeCount === afterCount) {
                console.warn("[ListingsService] Listing ".concat(sanitizedId, " was not found in storage"));
            }
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('listings', filtered);
            // Invalidate all caches
            this.invalidateCache();
            // Clear browse cache specifically
            if ("TURBOPACK compile-time truthy", 1) {
                try {
                    localStorage.removeItem('browse_listings_cache');
                    console.log('[ListingsService] Cleared browse listings cache');
                } catch (e) {
                    console.warn('Failed to clear browse cache:', e);
                }
            }
            // Trigger a custom event to notify other components
            if ("TURBOPACK compile-time truthy", 1) {
                window.dispatchEvent(new CustomEvent('listingDeleted', {
                    detail: {
                        listingId: sanitizedId
                    }
                }));
                // Also trigger storage event manually for cross-tab sync
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'listings',
                    newValue: JSON.stringify(filtered),
                    url: window.location.href
                }));
            }
            return {
                success: true
            };
        } catch (error) {
            console.error('[ListingsService] Delete listing error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to delete listing'
                }
            };
        }
    }
    /**
   * Bulk update listings
   */ async bulkUpdateListings(request) {
        try {
            // Sanitize listing IDs
            const sanitizedIds = request.listingIds.map((id)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(id));
            // Sanitize updates (same as updateListing)
            const sanitizedUpdates = {};
            if (request.updates.title !== undefined) {
                sanitizedUpdates.title = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(request.updates.title);
            }
            if (request.updates.description !== undefined) {
                sanitizedUpdates.description = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(request.updates.description);
            }
            if (request.updates.price !== undefined) {
                sanitizedUpdates.price = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].number(request.updates.price, 0.01, 10000);
            }
            if (request.updates.tags !== undefined) {
                sanitizedUpdates.tags = request.updates.tags.map((tag)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(tag));
            }
            if (request.updates.hoursWorn !== undefined) {
                sanitizedUpdates.hoursWorn = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].number(request.updates.hoursWorn, 0, 30);
            }
            if (request.updates.isPremium !== undefined) {
                sanitizedUpdates.isPremium = request.updates.isPremium;
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/bulk", {
                    method: 'PATCH',
                    body: JSON.stringify({
                        listingIds: sanitizedIds,
                        updates: sanitizedUpdates
                    })
                });
            }
            // LocalStorage implementation
            const listings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listings', []);
            const updatedListings = [];
            listings.forEach((listing, index)=>{
                if (sanitizedIds.includes(listing.id)) {
                    const updatedListing = {
                        ...listing,
                        ...sanitizedUpdates,
                        markedUpPrice: sanitizedUpdates.price ? Math.round(sanitizedUpdates.price * 1.1 * 100) / 100 : listing.markedUpPrice
                    };
                    listings[index] = updatedListing;
                    updatedListings.push(updatedListing);
                }
            });
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('listings', listings);
            // Invalidate cache
            this.invalidateCache();
            return {
                success: true,
                data: updatedListings
            };
        } catch (error) {
            console.error('Bulk update error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to bulk update listings'
                }
            };
        }
    }
    /**
   * Place bid on auction listing with premium checking
   */ async placeBid(listingId, bidder, amount) {
        try {
            // Sanitize inputs
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(listingId);
            const sanitizedBidder = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(bidder);
            const sanitizedAmount = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].currency(amount);
            // Validate amount
            if (sanitizedAmount < 0.01 || sanitizedAmount > 10000) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid bid amount'
                    }
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                console.log('[ListingsService] Placing bid via backend API:', sanitizedId, sanitizedAmount);
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(sanitizedId, "/bid"), {
                    method: 'POST',
                    body: JSON.stringify({
                        amount: sanitizedAmount
                    })
                });
                if (response.success && response.data) {
                    const convertedListing = convertBackendToFrontend(response.data);
                    // Invalidate cache
                    this.invalidateCache();
                    return {
                        success: true,
                        data: convertedListing
                    };
                } else {
                    var _response_error, _response_error1;
                    // Handle premium content errors
                    if ((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.requiresSubscription) {
                        return {
                            success: false,
                            error: {
                                message: response.error.message || 'Premium content - subscription required',
                                requiresSubscription: true,
                                seller: response.error.seller
                            }
                        };
                    }
                    return {
                        success: false,
                        error: {
                            message: ((_response_error1 = response.error) === null || _response_error1 === void 0 ? void 0 : _response_error1.message) || 'Failed to place bid'
                        }
                    };
                }
            }
            // LocalStorage implementation
            const listings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listings', []);
            const listing = listings.find((l)=>l.id === sanitizedId);
            if (!listing || !listing.auction) {
                return {
                    success: false,
                    error: {
                        message: 'Auction not found'
                    }
                };
            }
            if (listing.auction.status !== 'active') {
                return {
                    success: false,
                    error: {
                        message: 'Auction is not active'
                    }
                };
            }
            // Check if auction has ended
            const now = new Date();
            const endTime = new Date(listing.auction.endTime);
            if (endTime <= now) {
                return {
                    success: false,
                    error: {
                        message: 'Auction has ended'
                    }
                };
            }
            // Proper bid validation logic
            const currentHighestBid = listing.auction.highestBid || 0;
            const startingPrice = listing.auction.startingPrice;
            if (currentHighestBid === 0) {
                // First bid - must be at least starting price (allow equal)
                if (sanitizedAmount < startingPrice) {
                    return {
                        success: false,
                        error: {
                            message: "Minimum bid is $".concat(startingPrice.toFixed(2))
                        }
                    };
                }
            } else {
                // Subsequent bids - must be higher than current highest bid
                if (sanitizedAmount <= currentHighestBid) {
                    return {
                        success: false,
                        error: {
                            message: "Bid must be higher than $".concat(currentHighestBid.toFixed(2))
                        }
                    };
                }
            }
            const newBid = {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                bidder: sanitizedBidder,
                amount: sanitizedAmount,
                date: new Date().toISOString()
            };
            listing.auction.bids.push(newBid);
            listing.auction.highestBid = sanitizedAmount;
            listing.auction.highestBidder = sanitizedBidder;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('listings', listings);
            // Invalidate cache
            this.invalidateCache();
            return {
                success: true,
                data: listing
            };
        } catch (error) {
            var _error_message;
            console.error('Place bid error:', error);
            // Handle 403 errors for premium content
            if (error.status === 403 || ((_error_message = error.message) === null || _error_message === void 0 ? void 0 : _error_message.includes('subscribe'))) {
                return {
                    success: false,
                    error: {
                        message: error.message || 'Premium content - subscription required',
                        requiresSubscription: true,
                        seller: error.seller
                    }
                };
            }
            return {
                success: false,
                error: {
                    message: 'Failed to place bid'
                }
            };
        }
    }
    /**
   * Cancel auction
   */ async cancelAuction(listingId) {
        try {
            // Sanitize ID
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(listingId);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(sanitizedId, "/cancel-auction"), {
                    method: 'POST'
                });
                if (response.success && response.data) {
                    const convertedListing = convertBackendToFrontend(response.data);
                    // Invalidate cache
                    this.invalidateCache();
                    return {
                        success: true,
                        data: convertedListing
                    };
                } else {
                    var _response_error;
                    throw new Error(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Backend API error');
                }
            }
            // LocalStorage implementation
            const listings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listings', []);
            const listing = listings.find((l)=>l.id === sanitizedId);
            if (!listing || !listing.auction) {
                return {
                    success: false,
                    error: {
                        message: 'Auction not found'
                    }
                };
            }
            listing.auction.status = 'cancelled';
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('listings', listings);
            // Invalidate cache
            this.invalidateCache();
            return {
                success: true,
                data: listing
            };
        } catch (error) {
            console.error('Cancel auction error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to cancel auction'
                }
            };
        }
    }
    /**
   * End auction - trigger backend processing
   */ async endAuction(listingId) {
        try {
            // Sanitize ID
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(listingId);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                console.log('[ListingsService] Ending auction via backend:', sanitizedId);
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(sanitizedId, "/end-auction"), {
                    method: 'POST'
                });
                if (response.success) {
                    // Invalidate cache to force refresh
                    this.invalidateCache();
                    return {
                        success: true,
                        data: response.data
                    };
                } else {
                    var _response_error;
                    return {
                        success: false,
                        error: {
                            message: ((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to end auction'
                        }
                    };
                }
            }
            // LocalStorage fallback - just mark as ended
            const listings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listings', []);
            const listing = listings.find((l)=>l.id === sanitizedId);
            if (!listing || !listing.auction) {
                return {
                    success: false,
                    error: {
                        message: 'Auction not found'
                    }
                };
            }
            // Check if reserve is met
            const reserveMet = !listing.auction.reservePrice || listing.auction.highestBid && listing.auction.highestBid >= listing.auction.reservePrice;
            listing.auction.status = reserveMet ? 'ended' : 'reserve_not_met';
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('listings', listings);
            // Invalidate cache
            this.invalidateCache();
            return {
                success: true,
                data: {
                    status: listing.auction.status,
                    reserveMet,
                    highestBid: listing.auction.highestBid,
                    highestBidder: listing.auction.highestBidder
                }
            };
        } catch (error) {
            console.error('End auction error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to end auction'
                }
            };
        }
    }
    /**
   * Update listing views
   */ async updateViews(update) {
        try {
            // Sanitize inputs
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(update.listingId);
            const sanitizedViewerId = update.viewerId ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(update.viewerId) : undefined;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(sanitizedId, "/views"), {
                    method: 'POST',
                    body: JSON.stringify({
                        viewerId: sanitizedViewerId
                    })
                });
            }
            // LocalStorage implementation
            const viewsData = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listing_views', {});
            viewsData[sanitizedId] = (viewsData[sanitizedId] || 0) + 1;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('listing_views', viewsData);
            // Invalidate view cache for this listing
            this.viewsCache.delete(sanitizedId);
            return {
                success: true
            };
        } catch (error) {
            console.error('Update views error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to update views'
                }
            };
        }
    }
    /**
   * Get listing views with caching
   */ async getListingViews(listingId) {
        try {
            // Sanitize ID
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(listingId);
            // Check cache first
            const cached = this.viewsCache.get(sanitizedId);
            const now = Date.now();
            if (cached && now - cached.timestamp < VIEW_CACHE_DURATION) {
                return {
                    success: true,
                    data: cached.count
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(sanitizedId, "/views"));
                if (response.success && response.data) {
                    const viewCount = response.data.views || 0;
                    this.viewsCache.set(sanitizedId, {
                        count: viewCount,
                        timestamp: now
                    });
                    return {
                        success: true,
                        data: viewCount
                    };
                }
            }
            // LocalStorage implementation
            const viewsData = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listing_views', {});
            const count = viewsData[sanitizedId] || 0;
            this.viewsCache.set(sanitizedId, {
                count,
                timestamp: now
            });
            return {
                success: true,
                data: count
            };
        } catch (error) {
            console.error('Get listing views error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get listing views'
                }
            };
        }
    }
    /**
   * Get popular tags
   */ async getPopularTags() {
        let limit = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 20;
        try {
            // Sanitize limit
            const sanitizedLimit = Math.min(Math.max(1, limit), 50);
            // Check cache first
            const now = Date.now();
            if (this.popularTagsCache.data && now - this.popularTagsCache.timestamp < CACHE_DURATION) {
                return {
                    success: true,
                    data: this.popularTagsCache.data.slice(0, sanitizedLimit)
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/popular-tags?limit=".concat(sanitizedLimit));
                if (response.success && response.data) {
                    // Cache the result
                    this.popularTagsCache = {
                        data: response.data,
                        timestamp: now
                    };
                    return response;
                }
            }
            // LocalStorage implementation
            const listings = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listings', []);
            const tagCounts = new Map();
            listings.forEach((listing)=>{
                var _listing_tags;
                (_listing_tags = listing.tags) === null || _listing_tags === void 0 ? void 0 : _listing_tags.forEach((tag)=>{
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                });
            });
            const popularTags = Array.from(tagCounts.entries()).map((param)=>{
                let [tag, count] = param;
                return {
                    tag,
                    count
                };
            }).sort((a, b)=>b.count - a.count).slice(0, sanitizedLimit);
            // Update cache
            this.popularTagsCache = {
                data: popularTags,
                timestamp: now
            };
            return {
                success: true,
                data: popularTags
            };
        } catch (error) {
            console.error('Get popular tags error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get popular tags'
                }
            };
        }
    }
    /**
   * Draft Management
   */ /**
   * Save listing draft
   */ async saveDraft(draft) {
        try {
            // Create a sanitized copy, checking each property exists
            const sanitizedDraft = {
                ...draft
            };
            // The ListingDraft type should have these properties, but let's handle them safely
            const draftAsAny = draft;
            if (draftAsAny.title) {
                sanitizedDraft.title = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(draftAsAny.title);
            }
            if (draftAsAny.description) {
                sanitizedDraft.description = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(draftAsAny.description);
            }
            if (draftAsAny.seller) {
                sanitizedDraft.seller = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(draftAsAny.seller);
            }
            if (draftAsAny.tags) {
                sanitizedDraft.tags = draftAsAny.tags.map((tag)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(tag));
            }
            const drafts = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listing_drafts', []);
            const existingIndex = drafts.findIndex((d)=>d.id === sanitizedDraft.id);
            if (existingIndex >= 0) {
                drafts[existingIndex] = {
                    ...sanitizedDraft,
                    lastModified: new Date().toISOString()
                };
            } else {
                drafts.push({
                    ...sanitizedDraft,
                    lastModified: new Date().toISOString()
                });
            }
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('listing_drafts', drafts);
            return {
                success: true,
                data: sanitizedDraft
            };
        } catch (error) {
            console.error('Save draft error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to save draft'
                }
            };
        }
    }
    /**
   * Get all drafts for a seller
   */ async getDrafts(seller) {
        try {
            // Sanitize seller
            const sanitizedSeller = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(seller);
            const drafts = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listing_drafts', []);
            const sellerDrafts = drafts.filter((d)=>d.seller === sanitizedSeller);
            return {
                success: true,
                data: sellerDrafts
            };
        } catch (error) {
            console.error('Get drafts error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get drafts'
                }
            };
        }
    }
    /**
   * Delete draft
   */ async deleteDraft(draftId) {
        try {
            // Sanitize ID
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(draftId);
            const drafts = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('listing_drafts', []);
            const filtered = drafts.filter((d)=>d.id !== sanitizedId);
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('listing_drafts', filtered);
            return {
                success: true
            };
        } catch (error) {
            console.error('Delete draft error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to delete draft'
                }
            };
        }
    }
    /**
   * Upload image to Cloudinary
   */ async uploadImage(file) {
        try {
            // Check rate limit
            const rateLimiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])();
            const rateLimit = rateLimiter.check('IMAGE_UPLOAD', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].IMAGE_UPLOAD);
            if (!rateLimit.allowed) {
                return {
                    success: false,
                    error: {
                        message: "Rate limit exceeded. Please wait ".concat(rateLimit.waitTime, " seconds.")
                    }
                };
            }
            // Validate file
            const fileValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateFileUpload(file, {
                maxSize: 5 * 1024 * 1024,
                allowedTypes: [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/webp'
                ],
                allowedExtensions: [
                    'jpg',
                    'jpeg',
                    'png',
                    'webp'
                ]
            });
            if (!fileValidation.valid) {
                return {
                    success: false,
                    error: {
                        message: fileValidation.error
                    }
                };
            }
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', ("TURBOPACK compile-time value", "pantypost_upload") || '');
            const response = await fetch("https://api.cloudinary.com/v1_1/".concat(("TURBOPACK compile-time value", "ddanxxkwz"), "/image/upload"), {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                throw new Error('Upload failed');
            }
            const data = await response.json();
            return {
                success: true,
                data: data.secure_url
            };
        } catch (error) {
            console.error('Upload image error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to upload image'
                }
            };
        }
    }
    /**
   * Delete image from Cloudinary
   */ async deleteImage(imageUrl) {
        try {
            // Sanitize URL
            const sanitizedUrl = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].url(imageUrl);
            if (!sanitizedUrl) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid image URL'
                    }
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_LISTINGS) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/images/delete", {
                    method: 'DELETE',
                    body: JSON.stringify({
                        imageUrl: sanitizedUrl
                    })
                });
            }
            // For now, we can't delete from Cloudinary without backend
            // Just return success to allow UI to continue
            return {
                success: true
            };
        } catch (error) {
            console.error('Delete image error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to delete image'
                }
            };
        }
    }
    /**
   * Invalidate cache
   */ invalidateCache() {
        console.log('[ListingsService] Invalidating cache');
        this.listingsCache = {
            data: null,
            timestamp: 0
        };
        this.popularTagsCache = {
            data: null,
            timestamp: 0
        };
    }
    /**
   * Clear all caches
   */ clearCache() {
        console.log('[ListingsService] Clearing all caches');
        this.invalidateCache();
        this.viewsCache.clear();
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "listingsCache", {
            data: null,
            timestamp: 0
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "viewsCache", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "popularTagsCache", {
            data: null,
            timestamp: 0
        });
    }
}
const listingsService = new ListingsService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/orders.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/orders.service.ts
__turbopack_context__.s({
    "OrdersService": ()=>OrdersService,
    "ordersService": ()=>ordersService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
;
;
// Custom delivery address schema that matches the interface
const deliveryAddressSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    fullName: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2).max(100).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    addressLine1: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(5).max(200).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    addressLine2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(200).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional(),
    city: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2).max(100).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    state: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2).max(100).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    postalCode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(20).regex(/^[A-Z0-9\s-]+$/i).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    country: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2).max(100).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    specialInstructions: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional()
});
// Validation schemas
const createOrderSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(200).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(2000).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    price: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().min(0.01).max(100000),
    markedUpPrice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().min(0.01).max(100000),
    imageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional().or(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('')).transform((url)=>url ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(url) : undefined),
    seller: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"]),
    buyer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"]),
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])).max(20).optional(),
    wearTime: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(50).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional(),
    wasAuction: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    finalBid: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().optional(),
    deliveryAddress: deliveryAddressSchema.optional(),
    tierCreditAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).optional(),
    isCustomRequest: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    originalRequestId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().uuid().optional(),
    listingId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(100).optional(),
    listingTitle: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(200).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional(),
    quantity: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().positive().max(100).optional(),
    shippingStatus: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'pending',
        'processing',
        'shipped',
        'pending-auction'
    ]).optional()
}).refine((data)=>{
    // Ensure markedUpPrice is >= price
    return data.markedUpPrice >= data.price;
}, {
    message: 'Marked up price must be greater than or equal to base price',
    path: [
        'markedUpPrice'
    ]
});
// NEW: Validation schema for custom request conversion
const customRequestOrderSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    requestId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(100),
    title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(200).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(2000).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    price: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().min(0.01).max(100000),
    seller: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"]),
    buyer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"]),
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])).max(20).optional(),
    deliveryAddress: deliveryAddressSchema.optional()
});
const updateOrderStatusSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    shippingStatus: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'pending',
        'processing',
        'shipped',
        'pending-auction'
    ]),
    trackingNumber: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(100).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional(),
    shippedDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime().optional()
});
const orderSearchSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    buyer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"]).optional(),
    seller: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"]).optional(),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'pending',
        'processing',
        'shipped'
    ]).optional(),
    fromDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime().optional(),
    toDate: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().datetime().optional(),
    page: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(0).optional(),
    limit: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(100).optional()
});
class OrdersService {
    /**
   * Get all orders with caching - accepts OrderSearchParams instead of boolean
   */ async getOrders(params) {
        try {
            // Validate search params
            let validatedParams;
            if (params) {
                const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(orderSearchSchema, params);
                if (!validation.success) {
                    return {
                        success: false,
                        error: {
                            message: 'Invalid search parameters'
                        }
                    };
                }
                validatedParams = validation.data;
            }
            // Check cache first
            const paramsString = JSON.stringify(validatedParams || {});
            const now = Date.now();
            if (this.ordersListCache.data && this.ordersListCache.params === paramsString && now - this.ordersListCache.timestamp < this.CACHE_DURATION) {
                return {
                    success: true,
                    data: this.ordersListCache.data
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_ORDERS) {
                const queryParams = new URLSearchParams();
                if (validatedParams) {
                    Object.entries(validatedParams).forEach((param)=>{
                        let [key, value] = param;
                        if (value !== undefined) {
                            queryParams.append(key, String(value));
                        }
                    });
                }
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].ORDERS.LIST, "?").concat(queryParams.toString()));
                if (response.success && response.data) {
                    // Sanitize order data
                    const sanitizedOrders = response.data.map((order)=>this.sanitizeOrderData(order));
                    // Update cache
                    this.ordersListCache = {
                        data: sanitizedOrders,
                        timestamp: now,
                        params: paramsString
                    };
                    return {
                        ...response,
                        data: sanitizedOrders
                    };
                }
                return response;
            }
            // LocalStorage implementation
            let orderHistory = await this.getOrderHistoryFromStorage();
            // Apply filters
            if (validatedParams) {
                if (validatedParams.buyer) {
                    orderHistory = orderHistory.filter((order)=>order.buyer === validatedParams.buyer);
                }
                if (validatedParams.seller) {
                    orderHistory = orderHistory.filter((order)=>order.seller === validatedParams.seller);
                }
                if (validatedParams.status) {
                    orderHistory = orderHistory.filter((order)=>order.shippingStatus === validatedParams.status);
                }
                if (validatedParams.fromDate) {
                    orderHistory = orderHistory.filter((order)=>new Date(order.date) >= new Date(validatedParams.fromDate));
                }
                if (validatedParams.toDate) {
                    orderHistory = orderHistory.filter((order)=>new Date(order.date) <= new Date(validatedParams.toDate));
                }
                // Pagination
                if (validatedParams.page !== undefined && validatedParams.limit) {
                    const start = validatedParams.page * validatedParams.limit;
                    const end = start + validatedParams.limit;
                    const paginatedData = orderHistory.slice(start, end);
                    return {
                        success: true,
                        data: paginatedData,
                        meta: {
                            page: validatedParams.page,
                            totalPages: Math.ceil(orderHistory.length / validatedParams.limit),
                            totalItems: orderHistory.length
                        }
                    };
                }
            }
            // Update cache
            this.ordersListCache = {
                data: orderHistory,
                timestamp: now,
                params: paramsString
            };
            return {
                success: true,
                data: orderHistory
            };
        } catch (error) {
            console.error('Get orders error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get orders'
                }
            };
        }
    }
    /**
   * Get single order by ID with caching
   */ async getOrder(id) {
        try {
            // Validate ID
            if (!id || typeof id !== 'string' || id.length > 100) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid order ID'
                    }
                };
            }
            // Check cache first
            const cached = this.orderCache.get(id);
            const now = Date.now();
            if (cached && now - cached.timestamp < this.CACHE_DURATION) {
                return {
                    success: true,
                    data: cached.order
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_ORDERS) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].ORDERS.GET, {
                    id
                }));
                if (response.success && response.data) {
                    const sanitizedOrder = this.sanitizeOrderData(response.data);
                    // Update cache
                    this.orderCache.set(id, {
                        order: sanitizedOrder,
                        timestamp: now
                    });
                    return {
                        ...response,
                        data: sanitizedOrder
                    };
                }
                return response;
            }
            // LocalStorage implementation
            const orderHistory = await this.getOrderHistoryFromStorage();
            const order = orderHistory.find((o)=>o.id === id);
            if (order) {
                const sanitizedOrder = this.sanitizeOrderData(order);
                // Update cache
                this.orderCache.set(id, {
                    order: sanitizedOrder,
                    timestamp: now
                });
                return {
                    success: true,
                    data: sanitizedOrder
                };
            }
            return {
                success: true,
                data: null
            };
        } catch (error) {
            console.error('Get order error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get order'
                }
            };
        }
    }
    /**
   * Get orders by buyer
   */ async getOrdersByBuyer(username) {
        try {
            // Validate username
            const validatedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            if (!validatedUsername || validatedUsername.length < 3 || validatedUsername.length > 30) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid username'
                    }
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_ORDERS) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].ORDERS.BY_BUYER, {
                    username: validatedUsername
                }));
            }
            return this.getOrders({
                buyer: validatedUsername
            });
        } catch (error) {
            console.error('Get orders by buyer error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get buyer orders'
                }
            };
        }
    }
    /**
   * Get orders by seller
   */ async getOrdersBySeller(username) {
        try {
            // Validate username
            const validatedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            if (!validatedUsername || validatedUsername.length < 3 || validatedUsername.length > 30) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid username'
                    }
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_ORDERS) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].ORDERS.BY_SELLER, {
                    username: validatedUsername
                }));
            }
            return this.getOrders({
                seller: validatedUsername
            });
        } catch (error) {
            console.error('Get orders by seller error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get seller orders'
                }
            };
        }
    }
    /**
   * Create new order
   */ async createOrder(request) {
        try {
            // Check rate limit
            const rateLimitResult = this.rateLimiter.check("order_create_".concat(request.buyer), {
                maxAttempts: 20,
                windowMs: 60 * 60 * 1000
            } // 20 orders per hour
            );
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        message: "Too many orders. Please wait ".concat(rateLimitResult.waitTime, " seconds.")
                    }
                };
            }
            // Validate and sanitize request
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(createOrderSchema, request);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        message: Object.values(validation.errors || {})[0] || 'Invalid order data'
                    }
                };
            }
            const sanitizedRequest = validation.data;
            // Additional content security check
            const contentCheck = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].checkContentSecurity("".concat(sanitizedRequest.title, " ").concat(sanitizedRequest.description));
            if (!contentCheck.safe) {
                return {
                    success: false,
                    error: {
                        message: 'Order contains prohibited content'
                    }
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_ORDERS) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].ORDERS.CREATE, {
                    method: 'POST',
                    body: JSON.stringify(sanitizedRequest)
                });
                if (response.success) {
                    this.invalidateCache();
                }
                return response;
            }
            // LocalStorage implementation
            const orderHistory = await this.getOrderHistoryFromStorage();
            const newOrder = {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                title: sanitizedRequest.title,
                description: sanitizedRequest.description,
                price: sanitizedRequest.price,
                markedUpPrice: sanitizedRequest.markedUpPrice,
                imageUrl: sanitizedRequest.imageUrl,
                date: new Date().toISOString(),
                seller: sanitizedRequest.seller,
                buyer: sanitizedRequest.buyer,
                tags: sanitizedRequest.tags,
                wearTime: sanitizedRequest.wearTime,
                wasAuction: sanitizedRequest.wasAuction,
                finalBid: sanitizedRequest.finalBid,
                deliveryAddress: sanitizedRequest.deliveryAddress,
                shippingStatus: sanitizedRequest.shippingStatus || 'pending',
                tierCreditAmount: sanitizedRequest.tierCreditAmount,
                isCustomRequest: sanitizedRequest.isCustomRequest,
                originalRequestId: sanitizedRequest.originalRequestId,
                listingId: sanitizedRequest.listingId,
                listingTitle: sanitizedRequest.listingTitle,
                quantity: sanitizedRequest.quantity
            };
            orderHistory.push(newOrder);
            // CRITICAL FIX: Save immediately to storage to ensure data is persisted
            await this.saveOrderHistoryToStorage(orderHistory);
            // CRITICAL FIX: Invalidate cache immediately so next read gets fresh data
            this.invalidateCache();
            console.log('[OrdersService] Order created and saved:', {
                orderId: newOrder.id,
                buyer: newOrder.buyer,
                listingId: newOrder.listingId,
                shippingStatus: newOrder.shippingStatus
            });
            return {
                success: true,
                data: newOrder
            };
        } catch (error) {
            console.error('Create order error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to create order'
                }
            };
        }
    }
    /**
   * NEW: Create order from custom request
   */ async createOrderFromCustomRequest(request) {
        try {
            // Check rate limit
            const rateLimitResult = this.rateLimiter.check("custom_request_order_".concat(request.buyer), {
                maxAttempts: 10,
                windowMs: 60 * 60 * 1000
            } // 10 custom request orders per hour
            );
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        message: "Too many custom request orders. Please wait ".concat(rateLimitResult.waitTime, " seconds.")
                    }
                };
            }
            // Validate and sanitize request
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(customRequestOrderSchema, request);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        message: Object.values(validation.errors || {})[0] || 'Invalid custom request data'
                    }
                };
            }
            const sanitizedRequest = validation.data;
            // Additional content security check
            const contentCheck = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].checkContentSecurity("".concat(sanitizedRequest.title, " ").concat(sanitizedRequest.description));
            if (!contentCheck.safe) {
                return {
                    success: false,
                    error: {
                        message: 'Custom request contains prohibited content'
                    }
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_ORDERS) {
                // Use the new custom request endpoint
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/api/orders/custom-request', {
                    method: 'POST',
                    body: JSON.stringify(sanitizedRequest)
                });
                if (response.success) {
                    this.invalidateCache();
                    // Mark the custom request as paid in localStorage
                    try {
                        const requests = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_custom_requests', []);
                        const updatedRequests = requests.map((req)=>{
                            var _response_data;
                            return req.id === sanitizedRequest.requestId ? {
                                ...req,
                                status: 'paid',
                                paid: true,
                                orderId: (_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.id
                            } : req;
                        });
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_custom_requests', updatedRequests);
                    } catch (error) {
                        console.error('Failed to update custom request status:', error);
                    }
                }
                return response;
            }
            // LocalStorage fallback implementation
            const orderHistory = await this.getOrderHistoryFromStorage();
            const newOrder = {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                title: sanitizedRequest.title,
                description: sanitizedRequest.description,
                price: sanitizedRequest.price,
                markedUpPrice: Math.round(sanitizedRequest.price * 1.1 * 100) / 100,
                imageUrl: '/api/placeholder/400/300',
                date: new Date().toISOString(),
                seller: sanitizedRequest.seller,
                buyer: sanitizedRequest.buyer,
                tags: sanitizedRequest.tags,
                deliveryAddress: sanitizedRequest.deliveryAddress,
                shippingStatus: 'pending',
                isCustomRequest: true,
                originalRequestId: sanitizedRequest.requestId
            };
            orderHistory.push(newOrder);
            await this.saveOrderHistoryToStorage(orderHistory);
            this.invalidateCache();
            // Mark the custom request as paid in localStorage
            try {
                const requests = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_custom_requests', []);
                const updatedRequests = requests.map((req)=>req.id === sanitizedRequest.requestId ? {
                        ...req,
                        status: 'paid',
                        paid: true,
                        orderId: newOrder.id
                    } : req);
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_custom_requests', updatedRequests);
            } catch (error) {
                console.error('Failed to update custom request status:', error);
            }
            console.log('[OrdersService] Custom request order created:', {
                orderId: newOrder.id,
                requestId: sanitizedRequest.requestId,
                buyer: newOrder.buyer,
                seller: newOrder.seller
            });
            return {
                success: true,
                data: newOrder
            };
        } catch (error) {
            console.error('Create custom request order error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to create order from custom request'
                }
            };
        }
    }
    /**
   * Update order status
   */ async updateOrderStatus(id, update) {
        try {
            // Validate ID
            if (!id || typeof id !== 'string' || id.length > 100) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid order ID'
                    }
                };
            }
            // For backward compatibility, accept both forms
            const statusUpdate = update.shippingStatus ? {
                shippingStatus: update.shippingStatus
            } : update;
            // Validate and sanitize update
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(updateOrderStatusSchema, statusUpdate);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid status update data'
                    }
                };
            }
            const sanitizedUpdate = validation.data;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_ORDERS) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].ORDERS.UPDATE_STATUS, {
                    id
                }), {
                    method: 'PATCH',
                    body: JSON.stringify(sanitizedUpdate)
                });
                if (response.success) {
                    this.invalidateCache();
                }
                return response;
            }
            // LocalStorage implementation
            const orderHistory = await this.getOrderHistoryFromStorage();
            const orderIndex = orderHistory.findIndex((o)=>o.id === id);
            if (orderIndex === -1) {
                return {
                    success: false,
                    error: {
                        message: 'Order not found'
                    }
                };
            }
            // Update the order with all properties from update
            orderHistory[orderIndex] = {
                ...orderHistory[orderIndex],
                ...update
            };
            await this.saveOrderHistoryToStorage(orderHistory);
            // Invalidate cache
            this.invalidateCache();
            return {
                success: true,
                data: orderHistory[orderIndex]
            };
        } catch (error) {
            console.error('Update order status error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to update order status'
                }
            };
        }
    }
    /**
   * Update order delivery address
   */ async updateOrderAddress(id, address) {
        try {
            // Validate ID
            if (!id || typeof id !== 'string' || id.length > 100) {
                console.error('[OrdersService] Invalid order ID');
                return false;
            }
            // Validate and sanitize address
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(deliveryAddressSchema, address);
            if (!validation.success) {
                console.error('[OrdersService] Invalid address:', validation.errors);
                return false;
            }
            const sanitizedAddress = validation.data;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_ORDERS) {
                // Call the new dedicated endpoint for address updates
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].ORDERS.GET, {
                    id
                }), "/address"), {
                    method: 'PUT',
                    body: JSON.stringify({
                        deliveryAddress: sanitizedAddress
                    })
                });
                if (response.success) {
                    this.invalidateCache();
                    console.log('[OrdersService] Address updated via API');
                    return true;
                }
                console.error('[OrdersService] API address update failed:', response.error);
                return false;
            }
            // LocalStorage implementation
            const orderHistory = await this.getOrderHistoryFromStorage();
            const orderIndex = orderHistory.findIndex((o)=>o.id === id);
            if (orderIndex === -1) {
                console.error('[OrdersService] Order not found');
                return false;
            }
            orderHistory[orderIndex] = {
                ...orderHistory[orderIndex],
                deliveryAddress: sanitizedAddress
            };
            await this.saveOrderHistoryToStorage(orderHistory);
            // Invalidate cache
            this.invalidateCache();
            console.log('[OrdersService] Address updated in localStorage');
            return true;
        } catch (error) {
            console.error('[OrdersService] Update order address error:', error);
            return false;
        }
    }
    /**
   * Get order statistics
   */ async getOrderStats(username, role) {
        // Validate username
        const validatedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
        if (!validatedUsername) {
            return {
                totalOrders: 0,
                totalAmount: 0,
                pendingOrders: 0,
                shippedOrders: 0,
                averageOrderValue: 0
            };
        }
        const params = role === 'buyer' ? {
            buyer: validatedUsername
        } : {
            seller: validatedUsername
        };
        const result = await this.getOrders(params);
        if (!result.success || !result.data) {
            return {
                totalOrders: 0,
                totalAmount: 0,
                pendingOrders: 0,
                shippedOrders: 0,
                averageOrderValue: 0
            };
        }
        const orders = result.data;
        const totalAmount = orders.reduce((sum, order)=>sum + (order.markedUpPrice || order.price), 0);
        return {
            totalOrders: orders.length,
            totalAmount,
            pendingOrders: orders.filter((o)=>!o.shippingStatus || o.shippingStatus === 'pending').length,
            shippedOrders: orders.filter((o)=>o.shippingStatus === 'shipped').length,
            averageOrderValue: orders.length > 0 ? totalAmount / orders.length : 0
        };
    }
    /**
   * Batch update order statuses
   */ async batchUpdateOrderStatuses(orderIds, status) {
        const successful = [];
        const failed = [];
        // Validate order IDs
        const validOrderIds = orderIds.filter((id)=>id && typeof id === 'string' && id.length <= 100);
        for (const orderId of validOrderIds){
            const result = await this.updateOrderStatus(orderId, {
                shippingStatus: status
            });
            if (result.success) {
                successful.push(orderId);
            } else {
                failed.push(orderId);
            }
        }
        return {
            successful,
            failed
        };
    }
    /**
   * Export orders to CSV with security
   */ async exportOrdersToCSV(params) {
        const result = await this.getOrders(params);
        if (!result.success || !result.data) {
            throw new Error('Failed to fetch orders for export');
        }
        const orders = result.data;
        const headers = [
            'Order ID',
            'Date',
            'Buyer',
            'Seller',
            'Title',
            'Price',
            'Marked Up Price',
            'Status',
            'Type'
        ];
        // Sanitize data for CSV to prevent injection
        const sanitizeForCSV = (value)=>{
            const str = String(value);
            // Remove any formula injection attempts
            if (/^[=+\-@]/.test(str)) {
                return "'".concat(str);
            }
            // Escape quotes
            return str.replace(/"/g, '""');
        };
        const rows = orders.map((order)=>[
                sanitizeForCSV(order.id),
                sanitizeForCSV(new Date(order.date).toLocaleDateString()),
                sanitizeForCSV(order.buyer),
                sanitizeForCSV(order.seller),
                sanitizeForCSV(order.title),
                sanitizeForCSV(order.price.toFixed(2)),
                sanitizeForCSV(order.markedUpPrice.toFixed(2)),
                sanitizeForCSV(order.shippingStatus || 'pending'),
                sanitizeForCSV(order.wasAuction ? 'Auction' : order.isCustomRequest ? 'Custom' : 'Direct')
            ]);
        const csv = [
            headers.map((h)=>'"'.concat(h, '"')).join(','),
            ...rows.map((row)=>row.map((cell)=>'"'.concat(cell, '"')).join(','))
        ].join('\n');
        return csv;
    }
    /**
   * Generate idempotency key for order
   */ generateIdempotencyKey(buyer, seller, listingId) {
        const sanitizedBuyer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(buyer);
        const sanitizedSeller = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(seller);
        const sanitizedListingId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(listingId);
        return "order_".concat(sanitizedBuyer, "_").concat(sanitizedSeller, "_").concat(sanitizedListingId, "_").concat(Date.now());
    }
    /**
   * Check if order exists (for idempotency)
   */ async checkOrderExists(idempotencyKey) {
        try {
            const processedOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('processed_orders', []);
            return processedOrders.includes(idempotencyKey);
        } catch (error) {
            console.error('Check order exists error:', error);
            return false;
        }
    }
    /**
   * Mark order as processed (for idempotency)
   */ async markOrderProcessed(idempotencyKey) {
        try {
            const processedOrders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('processed_orders', []);
            processedOrders.push(idempotencyKey);
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('processed_orders', processedOrders);
        } catch (error) {
            console.error('Mark order processed error:', error);
        }
    }
    /**
   * Clear cache
   */ clearCache() {
        this.orderCache.clear();
        this.invalidateCache();
    }
    /**
   * Add this method to force clear cache and sync
   */ async forceSync() {
        this.clearCache();
        // Force a storage event to trigger updates in other contexts
        const orders = await this.getOrderHistoryFromStorage();
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'wallet_orders',
            newValue: JSON.stringify(orders),
            url: window.location.href
        }));
    }
    /**
   * Invalidate list cache
   */ invalidateCache() {
        this.ordersListCache = {
            data: null,
            timestamp: 0,
            params: ''
        };
    }
    /**
   * Sanitize order data
   */ sanitizeOrderData(order) {
        var _order_tags;
        return {
            ...order,
            title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(order.title),
            description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(order.description),
            seller: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(order.seller),
            buyer: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(order.buyer),
            price: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(order.price),
            markedUpPrice: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(order.markedUpPrice),
            imageUrl: order.imageUrl ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUrl"])(order.imageUrl) : undefined,
            tags: (_order_tags = order.tags) === null || _order_tags === void 0 ? void 0 : _order_tags.map((tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag)),
            wearTime: order.wearTime ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(order.wearTime) : undefined,
            listingTitle: order.listingTitle ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(order.listingTitle) : undefined,
            finalBid: order.finalBid ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(order.finalBid) : undefined,
            tierCreditAmount: order.tierCreditAmount ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(order.tierCreditAmount) : undefined
        };
    }
    // Helper methods for localStorage
    async getOrderHistoryFromStorage() {
        // FIXED: Use the same key as WalletContext: 'wallet_orders'
        const orders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('wallet_orders', []);
        // Sanitize all orders when loading from storage
        return orders.map((order)=>this.sanitizeOrderData(order));
    }
    async saveOrderHistoryToStorage(orders) {
        // Sanitize before saving
        const sanitizedOrders = orders.map((order)=>this.sanitizeOrderData(order));
        // FIXED: Use the same key as WalletContext: 'wallet_orders'
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('wallet_orders', sanitizedOrders);
    }
    constructor(){
        // Cache configuration
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "orderCache", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "ordersListCache", {
            data: null,
            timestamp: 0,
            params: ''
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "CACHE_DURATION", 5 * 60 * 1000); // 5 minutes
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "rateLimiter", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])());
    }
}
const ordersService = new OrdersService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/messages.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/messages.service.ts
__turbopack_context__.s({
    "MessagesService": ()=>MessagesService,
    "messagesService": ()=>messagesService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
;
;
;
;
;
;
;
;
;
// Validation schemas
const sendMessageSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    sender: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    receiver: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    content: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messageSchemas"].messageContent,
    type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'normal',
        'customRequest',
        'image',
        'tip'
    ]).optional(),
    meta: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
        title: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(100).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional(),
        price: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().max(10000).optional(),
        tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])).max(10).optional(),
        message: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional(),
        imageUrl: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().url().optional(),
        tipAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().max(500).optional()
    }).optional(),
    attachments: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
            'image',
            'file'
        ]),
        url: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
        name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(255).optional(),
        size: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().optional(),
        mimeType: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
    })).max(10).optional()
});
const blockUserSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    blocker: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    blocked: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])
});
const reportUserSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    reporter: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    reportee: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(30).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]),
    reason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).transform(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"]).optional(),
    messages: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()).optional(),
    category: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'harassment',
        'spam',
        'inappropriate_content',
        'scam',
        'other'
    ]).optional()
});
class MessagesService {
    /**
   * Initialize the service
   */ async initialize() {
        try {
            // Pre-load message data into cache
            const messages = await this.getAllMessages();
            for (const [key, msgs] of Object.entries(messages)){
                this.messageCache.set(key, msgs);
            }
        } catch (error) {
            console.error('Failed to initialize messages service:', error);
        }
    }
    /**
   * Get all message threads for a user
   */ async getThreads(username, role) {
        try {
            // Validate and sanitize username
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(username);
            if (!sanitizedUsername || sanitizedUsername.length > 30) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid username'
                    }
                };
            }
            // Check rate limit
            const rateLimitResult = this.rateLimiter.check('API_CALL', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].API_CALL);
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        message: "Rate limit exceeded. Please wait ".concat(rateLimitResult.waitTime, " seconds.")
                    }
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_MESSAGES) {
                const url = "".concat(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].MESSAGES.THREADS, "?username=").concat(encodeURIComponent(sanitizedUsername)).concat(role ? "&role=".concat(role) : '');
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(url);
            }
            // LocalStorage implementation with caching
            const cacheKey = "threads_".concat(sanitizedUsername, "_").concat(role || 'all');
            const cached = this.threadCache.get(cacheKey);
            if (cached && this.isCacheValid(cached.updatedAt)) {
                return {
                    success: true,
                    data: [
                        cached
                    ]
                };
            }
            const messages = await this.getAllMessages();
            const threads = {};
            // Group messages into threads
            for (const [conversationKey, messageList] of Object.entries(messages)){
                if (conversationKey.includes(sanitizedUsername)) {
                    const participants = conversationKey.split('-');
                    const otherParty = participants.find((p)=>p !== sanitizedUsername) || '';
                    // Filter by role if specified
                    if (role && messageList.length > 0) {
                        const isRelevantThread = await this.isThreadRelevantForRole(sanitizedUsername, otherParty, role);
                        if (!isRelevantThread) continue;
                    }
                    if (messageList.length > 0) {
                        const threadId = conversationKey;
                        const blockedBy = await this.getBlockedStatus(participants[0], participants[1]);
                        threads[threadId] = {
                            id: threadId,
                            participants,
                            messages: messageList,
                            lastMessage: messageList[messageList.length - 1],
                            unreadCount: messageList.filter((m)=>m.receiver === sanitizedUsername && !m.isRead && !m.read).length,
                            updatedAt: messageList[messageList.length - 1].date,
                            blockedBy,
                            metadata: await this.getThreadMetadata(threadId)
                        };
                    }
                }
            }
            // Sort threads by last message date
            const sortedThreads = Object.values(threads).sort((a, b)=>new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            // Update cache
            sortedThreads.forEach((thread)=>{
                this.threadCache.set(thread.id, thread);
            });
            return {
                success: true,
                data: sortedThreads
            };
        } catch (error) {
            console.error('Get threads error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get message threads'
                }
            };
        }
    }
    /**
   * Get messages between two users
   */ async getThread(userA, userB) {
        try {
            // Validate and sanitize usernames
            const sanitizedUserA = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(userA);
            const sanitizedUserB = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(userB);
            if (!sanitizedUserA || !sanitizedUserB || sanitizedUserA.length > 30 || sanitizedUserB.length > 30) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid usernames'
                    }
                };
            }
            const threadId = this.getConversationKey(sanitizedUserA, sanitizedUserB);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_MESSAGES) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].MESSAGES.THREAD, {
                    threadId
                }));
            }
            // Check cache first
            const cached = this.messageCache.get(threadId);
            if (cached) {
                return {
                    success: true,
                    data: cached
                };
            }
            // LocalStorage implementation
            const messages = await this.getAllMessages();
            const threadMessages = messages[threadId] || [];
            // Update cache
            this.messageCache.set(threadId, threadMessages);
            return {
                success: true,
                data: threadMessages
            };
        } catch (error) {
            console.error('Get thread error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to get message thread'
                }
            };
        }
    }
    /**
   * Send a message
   */ async sendMessage(request) {
        try {
            // Validate and sanitize request
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(sendMessageSchema, request);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        message: Object.values(validation.errors || {})[0] || 'Invalid message data'
                    }
                };
            }
            const sanitizedRequest = validation.data;
            // Check rate limit for message sending
            const rateLimitResult = this.rateLimiter.check("message_send_".concat(sanitizedRequest.sender), __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].MESSAGE_SEND);
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        message: "Too many messages. Please wait ".concat(rateLimitResult.waitTime, " seconds.")
                    }
                };
            }
            // Additional content security check
            const contentCheck = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].checkContentSecurity(sanitizedRequest.content);
            if (!contentCheck.safe) {
                return {
                    success: false,
                    error: {
                        message: 'Message contains prohibited content'
                    }
                };
            }
            const conversationKey = this.getConversationKey(sanitizedRequest.sender, sanitizedRequest.receiver);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_MESSAGES) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].MESSAGES.SEND, {
                    method: 'POST',
                    body: JSON.stringify(sanitizedRequest)
                });
                if (response.success && response.data) {
                    // Update local cache
                    const messages = await this.getAllMessages();
                    if (!messages[conversationKey]) {
                        messages[conversationKey] = [];
                    }
                    messages[conversationKey].push(response.data);
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', messages);
                    // Update cache
                    this.messageCache.set(conversationKey, messages[conversationKey]);
                    // Notify listeners
                    this.notifyMessageListeners(conversationKey, response.data);
                }
                return response;
            }
            // LocalStorage implementation
            const messages = await this.getAllMessages();
            const newMessage = {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                sender: sanitizedRequest.sender,
                receiver: sanitizedRequest.receiver,
                content: sanitizedRequest.content,
                date: new Date().toISOString(),
                isRead: false,
                read: false,
                type: sanitizedRequest.type || 'normal',
                meta: sanitizedRequest.meta,
                attachments: sanitizedRequest.attachments,
                threadId: conversationKey
            };
            if (!messages[conversationKey]) {
                messages[conversationKey] = [];
            }
            messages[conversationKey].push(newMessage);
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', messages);
            // Update cache
            this.messageCache.set(conversationKey, [
                ...this.messageCache.get(conversationKey) || [],
                newMessage
            ]);
            // Update notifications if needed
            if (sanitizedRequest.type !== 'customRequest') {
                await this.updateMessageNotifications(sanitizedRequest.receiver, sanitizedRequest.sender, sanitizedRequest.content);
            }
            // Notify listeners (preparation for real-time)
            this.notifyMessageListeners(conversationKey, newMessage);
            return {
                success: true,
                data: newMessage
            };
        } catch (error) {
            console.error('Send message error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to send message'
                }
            };
        }
    }
    /**
   * Send a custom request
   */ async sendCustomRequest(buyer, seller, requestData) {
        // Validate custom request data
        const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest, {
            title: requestData.title,
            description: requestData.description,
            price: requestData.price
        });
        if (!validation.success) {
            return {
                success: false,
                error: {
                    message: Object.values(validation.errors || {})[0] || 'Invalid request data'
                }
            };
        }
        const sanitizedData = validation.data;
        // Sanitize tags
        const sanitizedTags = requestData.tags.slice(0, 10).map((tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag).substring(0, 30)).filter((tag)=>tag.length > 0);
        const request = {
            sender: buyer,
            receiver: seller,
            content: "📦 Custom Request: ".concat(sanitizedData.title, " - $").concat(sanitizedData.price),
            type: 'customRequest',
            meta: {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                title: sanitizedData.title,
                price: sanitizedData.price,
                tags: sanitizedTags,
                message: sanitizedData.description
            }
        };
        return this.sendMessage(request);
    }
    /**
   * Mark messages as read - FIXED VERSION
   */ async markMessagesAsRead(username, otherParty) {
        try {
            // Validate and sanitize usernames
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(username);
            const sanitizedOtherParty = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(otherParty);
            if (!sanitizedUsername || !sanitizedOtherParty || sanitizedUsername.length > 30 || sanitizedOtherParty.length > 30) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid usernames'
                    }
                };
            }
            const conversationKey = this.getConversationKey(sanitizedUsername, sanitizedOtherParty);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_MESSAGES) {
                // Get messages first to get their IDs
                const messages = await this.getAllMessages();
                const threadMessages = messages[conversationKey] || [];
                // Get IDs of unread messages where current user is receiver
                const messageIds = threadMessages.filter((msg)=>msg.receiver === sanitizedUsername && !msg.isRead && !msg.read).map((msg)=>msg.id).filter((id)=>id !== undefined);
                if (messageIds.length === 0) {
                    return {
                        success: true
                    }; // No messages to mark as read
                }
                // Send the messageIds array that backend expects
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].MESSAGES.MARK_READ, {
                    method: 'POST',
                    body: JSON.stringify({
                        messageIds
                    })
                });
                if (response.success) {
                    // Update local storage after successful API call
                    const updatedMessages = await this.getAllMessages();
                    if (updatedMessages[conversationKey]) {
                        updatedMessages[conversationKey] = updatedMessages[conversationKey].map((msg)=>{
                            if (msg.receiver === sanitizedUsername && msg.sender === sanitizedOtherParty) {
                                return {
                                    ...msg,
                                    isRead: true,
                                    read: true
                                };
                            }
                            return msg;
                        });
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', updatedMessages);
                        this.messageCache.set(conversationKey, updatedMessages[conversationKey]);
                    }
                    // Clear notifications
                    await this.clearMessageNotifications(sanitizedUsername, sanitizedOtherParty);
                }
                return response;
            }
            // LocalStorage implementation
            const messages = await this.getAllMessages();
            if (messages[conversationKey]) {
                messages[conversationKey] = messages[conversationKey].map((msg)=>{
                    if (msg.receiver === sanitizedUsername && msg.sender === sanitizedOtherParty) {
                        return {
                            ...msg,
                            isRead: true,
                            read: true
                        };
                    }
                    return msg;
                });
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', messages);
                // Update cache
                this.messageCache.set(conversationKey, messages[conversationKey]);
            }
            // Clear notifications
            await this.clearMessageNotifications(sanitizedUsername, sanitizedOtherParty);
            return {
                success: true
            };
        } catch (error) {
            console.error('Mark messages as read error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to mark messages as read'
                }
            };
        }
    }
    /**
   * Block a user
   */ async blockUser(request) {
        try {
            // Validate and sanitize request
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(blockUserSchema, request);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid block request'
                    }
                };
            }
            const sanitizedRequest = validation.data;
            // Check rate limit
            const rateLimitResult = this.rateLimiter.check("block_user_".concat(sanitizedRequest.blocker), {
                maxAttempts: 10,
                windowMs: 60 * 60 * 1000
            } // 10 blocks per hour
            );
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        message: 'Too many block attempts. Please try again later.'
                    }
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_MESSAGES) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].MESSAGES.BLOCK_USER, {
                    method: 'POST',
                    body: JSON.stringify(sanitizedRequest)
                });
            }
            // LocalStorage implementation
            const blocked = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_blocked', {});
            if (!blocked[sanitizedRequest.blocker]) {
                blocked[sanitizedRequest.blocker] = [];
            }
            if (!blocked[sanitizedRequest.blocker].includes(sanitizedRequest.blocked)) {
                blocked[sanitizedRequest.blocker].push(sanitizedRequest.blocked);
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_blocked', blocked);
            }
            return {
                success: true
            };
        } catch (error) {
            console.error('Block user error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to block user'
                }
            };
        }
    }
    /**
   * Unblock a user
   */ async unblockUser(request) {
        try {
            // Validate and sanitize request
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(blockUserSchema, request);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        message: 'Invalid unblock request'
                    }
                };
            }
            const sanitizedRequest = validation.data;
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_MESSAGES) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].MESSAGES.UNBLOCK_USER, {
                    method: 'POST',
                    body: JSON.stringify(sanitizedRequest)
                });
            }
            // LocalStorage implementation
            const blocked = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_blocked', {});
            if (blocked[sanitizedRequest.blocker]) {
                blocked[sanitizedRequest.blocker] = blocked[sanitizedRequest.blocker].filter((u)=>u !== sanitizedRequest.blocked);
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_blocked', blocked);
            }
            return {
                success: true
            };
        } catch (error) {
            console.error('Unblock user error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to unblock user'
                }
            };
        }
    }
    /**
   * Check if user is blocked
   */ async isBlocked(blocker, blocked) {
        try {
            var _blocks_sanitizedBlocker;
            // Sanitize usernames
            const sanitizedBlocker = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(blocker);
            const sanitizedBlocked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(blocked);
            if (!sanitizedBlocker || !sanitizedBlocked) {
                return false;
            }
            const blocks = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_blocked', {});
            return ((_blocks_sanitizedBlocker = blocks[sanitizedBlocker]) === null || _blocks_sanitizedBlocker === void 0 ? void 0 : _blocks_sanitizedBlocker.includes(sanitizedBlocked)) || false;
        } catch (error) {
            console.error('Check blocked error:', error);
            return false;
        }
    }
    /**
   * Report a user
   */ async reportUser(request) {
        try {
            // Validate and sanitize request
            const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateSchema"])(reportUserSchema, request);
            if (!validation.success) {
                return {
                    success: false,
                    error: {
                        message: Object.values(validation.errors || {})[0] || 'Invalid report'
                    }
                };
            }
            const sanitizedRequest = validation.data;
            // Check rate limit for reporting
            const rateLimitResult = this.rateLimiter.check("report_user_".concat(sanitizedRequest.reporter), {
                maxAttempts: 5,
                windowMs: 24 * 60 * 60 * 1000
            } // 5 reports per day
            );
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        message: 'Too many reports. Please try again tomorrow.'
                    }
                };
            }
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_MESSAGES) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].MESSAGES.REPORT, {
                    method: 'POST',
                    body: JSON.stringify(sanitizedRequest)
                });
            }
            // LocalStorage implementation
            const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
            const newReport = {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                reporter: sanitizedRequest.reporter,
                reportee: sanitizedRequest.reportee,
                reason: sanitizedRequest.reason,
                messages: sanitizedRequest.messages || [],
                date: new Date().toISOString(),
                processed: false,
                category: sanitizedRequest.category || 'other'
            };
            reports.push(newReport);
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_report_logs', reports);
            // Mark as reported
            const reported = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_reported', {});
            if (!reported[sanitizedRequest.reporter]) {
                reported[sanitizedRequest.reporter] = [];
            }
            if (!reported[sanitizedRequest.reporter].includes(sanitizedRequest.reportee)) {
                reported[sanitizedRequest.reporter].push(sanitizedRequest.reportee);
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_reported', reported);
            }
            return {
                success: true
            };
        } catch (error) {
            console.error('Report user error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to report user'
                }
            };
        }
    }
    /**
   * Check if user has been reported
   */ async hasReported(reporter, reportee) {
        try {
            var _reported_sanitizedReporter;
            // Sanitize usernames
            const sanitizedReporter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reporter);
            const sanitizedReportee = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reportee);
            if (!sanitizedReporter || !sanitizedReportee) {
                return false;
            }
            const reported = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_reported', {});
            return ((_reported_sanitizedReporter = reported[sanitizedReporter]) === null || _reported_sanitizedReporter === void 0 ? void 0 : _reported_sanitizedReporter.includes(sanitizedReportee)) || false;
        } catch (error) {
            console.error('Check reported error:', error);
            return false;
        }
    }
    /**
   * Get unread message count for a user
   */ async getUnreadCount(username) {
        try {
            // Sanitize username
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(username);
            if (!sanitizedUsername) {
                return 0;
            }
            const threads = await this.getThreads(sanitizedUsername);
            if (!threads.success || !threads.data) return 0;
            return threads.data.reduce((total, thread)=>total + thread.unreadCount, 0);
        } catch (error) {
            console.error('Get unread count error:', error);
            return 0;
        }
    }
    /**
   * Get message notifications for a user
   */ async getMessageNotifications(username) {
        try {
            // Sanitize username
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(username);
            if (!sanitizedUsername) {
                return [];
            }
            const notifications = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_message_notifications', {});
            return notifications[sanitizedUsername] || [];
        } catch (error) {
            console.error('Get message notifications error:', error);
            return [];
        }
    }
    /**
   * Clear message notifications
   */ async clearMessageNotifications(seller, buyer) {
        try {
            // Sanitize usernames
            const sanitizedSeller = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(seller);
            const sanitizedBuyer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(buyer);
            if (!sanitizedSeller || !sanitizedBuyer) {
                return;
            }
            const notifications = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_message_notifications', {});
            if (notifications[sanitizedSeller]) {
                notifications[sanitizedSeller] = notifications[sanitizedSeller].filter((n)=>n.buyer !== sanitizedBuyer);
                if (notifications[sanitizedSeller].length === 0) {
                    delete notifications[sanitizedSeller];
                }
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_message_notifications', notifications);
            }
        } catch (error) {
            console.error('Clear message notifications error:', error);
        }
    }
    /**
   * Subscribe to message updates (preparation for WebSocket)
   */ subscribeToThread(threadId, callback) {
        // Sanitize thread ID
        const sanitizedThreadId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(threadId);
        if (!sanitizedThreadId) {
            return ()=>{};
        }
        if (!this.messageListeners.has(sanitizedThreadId)) {
            this.messageListeners.set(sanitizedThreadId, new Set());
        }
        this.messageListeners.get(sanitizedThreadId).add(callback);
        // Return unsubscribe function
        return ()=>{
            const listeners = this.messageListeners.get(sanitizedThreadId);
            if (listeners) {
                listeners.delete(callback);
                if (listeners.size === 0) {
                    this.messageListeners.delete(sanitizedThreadId);
                }
            }
        };
    }
    /**
   * Upload attachment (preparation for file handling)
   */ async uploadAttachment(file) {
        try {
            // Validate file
            const fileValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateFileUpload(file, {
                maxSize: 5 * 1024 * 1024,
                allowedTypes: [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/webp',
                    'application/pdf'
                ],
                allowedExtensions: [
                    'jpg',
                    'jpeg',
                    'png',
                    'webp',
                    'pdf'
                ]
            });
            if (!fileValidation.valid) {
                return {
                    success: false,
                    error: {
                        message: fileValidation.error || 'Invalid file'
                    }
                };
            }
            // Check rate limit for uploads
            const rateLimitResult = this.rateLimiter.check('IMAGE_UPLOAD', __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].IMAGE_UPLOAD);
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    error: {
                        message: "Upload limit exceeded. Please wait ".concat(rateLimitResult.waitTime, " seconds.")
                    }
                };
            }
            // For now, convert to base64 for localStorage
            return new Promise((resolve, reject)=>{
                const reader = new FileReader();
                reader.onload = (e)=>{
                    var _e_target;
                    const attachment = {
                        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                        type: file.type.startsWith('image/') ? 'image' : 'file',
                        url: (_e_target = e.target) === null || _e_target === void 0 ? void 0 : _e_target.result,
                        name: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].sanitizeForDisplay(file.name, {
                            maxLength: 255
                        }),
                        size: file.size,
                        mimeType: file.type
                    };
                    resolve({
                        success: true,
                        data: attachment
                    });
                };
                reader.onerror = ()=>{
                    reject({
                        success: false,
                        error: {
                            message: 'Failed to read file'
                        }
                    });
                };
                reader.readAsDataURL(file);
            });
        } catch (error) {
            console.error('Upload attachment error:', error);
            return {
                success: false,
                error: {
                    message: 'Failed to upload attachment'
                }
            };
        }
    }
    // Helper methods
    getConversationKey(userA, userB) {
        // Sanitize before creating key
        const sanitizedUserA = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(userA);
        const sanitizedUserB = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(userB);
        return [
            sanitizedUserA,
            sanitizedUserB
        ].sort().join('-');
    }
    async getAllMessages() {
        const messages = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_messages', {});
        // Sanitize all messages when loading from storage
        const sanitized = {};
        for (const [key, msgs] of Object.entries(messages)){
            sanitized[key] = msgs.map((msg)=>({
                    ...msg,
                    content: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].sanitizeForDisplay(msg.content, {
                        allowHtml: false,
                        maxLength: 1000
                    })
                }));
        }
        return sanitized;
    }
    async updateMessageNotifications(seller, buyer, content) {
        try {
            const sanitizedSeller = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(seller);
            const sanitizedBuyer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(buyer);
            const sanitizedContent = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].sanitizeForDisplay(content, {
                allowHtml: false,
                maxLength: 50
            });
            const notifications = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_message_notifications', {});
            if (!notifications[sanitizedSeller]) {
                notifications[sanitizedSeller] = [];
            }
            const existingIndex = notifications[sanitizedSeller].findIndex((n)=>n.buyer === sanitizedBuyer);
            if (existingIndex >= 0) {
                notifications[sanitizedSeller][existingIndex] = {
                    buyer: sanitizedBuyer,
                    messageCount: notifications[sanitizedSeller][existingIndex].messageCount + 1,
                    lastMessage: sanitizedContent + (content.length > 50 ? '...' : ''),
                    timestamp: new Date().toISOString()
                };
            } else {
                notifications[sanitizedSeller].push({
                    buyer: sanitizedBuyer,
                    messageCount: 1,
                    lastMessage: sanitizedContent + (content.length > 50 ? '...' : ''),
                    timestamp: new Date().toISOString()
                });
            }
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_message_notifications', notifications);
        } catch (error) {
            console.error('Update message notifications error:', error);
        }
    }
    async isThreadRelevantForRole(username, otherParty, role) {
        try {
            const users = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_users', {});
            const otherUser = users[otherParty];
            if (!otherUser) return true; // Include if we don't know the other user's role
            if (role === 'seller') {
                // Seller sees conversations with buyers
                return otherUser.role === 'buyer';
            } else {
                // Buyer sees conversations with sellers
                return otherUser.role === 'seller' || otherUser.role === 'admin';
            }
        } catch (error) {
            console.error('Error checking thread relevance:', error);
            return true;
        }
    }
    async getBlockedStatus(userA, userB) {
        const blockedBy = [];
        if (await this.isBlocked(userA, userB)) {
            blockedBy.push(userA);
        }
        if (await this.isBlocked(userB, userA)) {
            blockedBy.push(userB);
        }
        return blockedBy;
    }
    async getThreadMetadata(threadId) {
        try {
            const metadata = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('thread_metadata', {});
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeObject"])(metadata[threadId] || {});
        } catch (error) {
            return {};
        }
    }
    isCacheValid(updatedAt) {
        // Cache is valid for 5 minutes
        const cacheTime = 5 * 60 * 1000;
        return new Date().getTime() - new Date(updatedAt).getTime() < cacheTime;
    }
    notifyMessageListeners(threadId, message) {
        const listeners = this.messageListeners.get(threadId);
        if (listeners) {
            listeners.forEach((callback)=>callback(message));
        }
    }
    /**
   * Prepare for WebSocket connection (to be implemented with Socket.io later)
   */ prepareWebSocket() {
        // This will be implemented when integrating Socket.io
        this.wsReady = false;
    }
    /**
   * Check if WebSocket is ready
   */ isWebSocketReady() {
        return this.wsReady;
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "messageCache", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "threadCache", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "wsReady", false);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "messageListeners", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "rateLimiter", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])());
    }
}
const messagesService = new MessagesService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/reviews.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/reviews.service.ts
__turbopack_context__.s({
    "ReviewsService": ()=>ReviewsService,
    "reviewsService": ()=>reviewsService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
;
;
;
;
// Validation schemas
const createReviewSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    orderId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1, 'Order ID is required'),
    rating: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(5),
    comment: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10, 'Review must be at least 10 characters').max(500, 'Review must be less than 500 characters'),
    asDescribed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    fastShipping: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional(),
    wouldBuyAgain: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().optional()
});
const sellerResponseSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    response: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10, 'Response must be at least 10 characters').max(500, 'Response must be less than 500 characters')
});
class ReviewsService {
    static getInstance() {
        if (!ReviewsService.instance) {
            ReviewsService.instance = new ReviewsService();
        }
        return ReviewsService.instance;
    }
    /**
   * Get reviews for a seller with pagination and stats
   */ async getSellerReviews(username) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1, limit = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 20;
        try {
            console.log('[ReviewsService] Getting reviews for seller:', username);
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(username);
            const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].REVIEWS.BY_SELLER, {
                username: sanitizedUsername
            });
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(url, "?page=").concat(page, "&limit=").concat(limit), {
                method: 'GET'
            });
            if (response.success && response.data) {
                // Sanitize review comments
                response.data.reviews = response.data.reviews.map((review)=>({
                        ...review,
                        comment: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(review.comment),
                        sellerResponse: review.sellerResponse ? {
                            ...review.sellerResponse,
                            text: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(review.sellerResponse.text)
                        } : undefined
                    }));
            }
            return response;
        } catch (error) {
            console.error('[ReviewsService] Error getting seller reviews:', error);
            return {
                success: false,
                error: {
                    code: 'FETCH_ERROR',
                    message: 'Failed to fetch reviews'
                }
            };
        }
    }
    /**
   * Check if an order has been reviewed
   */ async checkOrderReview(orderId) {
        try {
            console.log('[ReviewsService] Checking review for order:', orderId);
            const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/reviews/order/:orderId', {
                orderId
            });
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(url, {
                method: 'GET'
            });
            return response;
        } catch (error) {
            console.error('[ReviewsService] Error checking order review:', error);
            return {
                success: false,
                error: {
                    code: 'FETCH_ERROR',
                    message: 'Failed to check order review'
                }
            };
        }
    }
    /**
   * Create a new review
   */ async createReview(request) {
        try {
            console.log('[ReviewsService] Creating review:', request);
            // Validate request
            const validationResult = createReviewSchema.safeParse(request);
            if (!validationResult.success) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validationResult.error.errors[0].message
                    }
                };
            }
            // Sanitize inputs
            const sanitizedRequest = {
                ...validationResult.data,
                comment: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(validationResult.data.comment)
            };
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["API_ENDPOINTS"].REVIEWS.CREATE, {
                method: 'POST',
                body: JSON.stringify(sanitizedRequest)
            });
            return response;
        } catch (error) {
            console.error('[ReviewsService] Error creating review:', error);
            return {
                success: false,
                error: {
                    code: 'CREATE_ERROR',
                    message: 'Failed to create review'
                }
            };
        }
    }
    /**
   * Add seller response to a review
   */ async addSellerResponse(reviewId, request) {
        try {
            console.log('[ReviewsService] Adding seller response to review:', reviewId);
            // Validate request
            const validationResult = sellerResponseSchema.safeParse(request);
            if (!validationResult.success) {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: validationResult.error.errors[0].message
                    }
                };
            }
            // Sanitize response text
            const sanitizedRequest = {
                response: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(validationResult.data.response)
            };
            const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/reviews/:reviewId/response', {
                reviewId
            });
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(url, {
                method: 'POST',
                body: JSON.stringify(sanitizedRequest)
            });
            return response;
        } catch (error) {
            console.error('[ReviewsService] Error adding seller response:', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_ERROR',
                    message: 'Failed to add seller response'
                }
            };
        }
    }
    /**
   * Flag a review for moderation
   */ async flagReview(reviewId, reason) {
        try {
            console.log('[ReviewsService] Flagging review:', reviewId);
            const sanitizedReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reason);
            const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/reviews/:reviewId/flag', {
                reviewId
            });
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(url, {
                method: 'POST',
                body: JSON.stringify({
                    reason: sanitizedReason
                })
            });
            return response;
        } catch (error) {
            console.error('[ReviewsService] Error flagging review:', error);
            return {
                success: false,
                error: {
                    code: 'FLAG_ERROR',
                    message: 'Failed to flag review'
                }
            };
        }
    }
    /**
   * Get reviews by buyer
   */ async getBuyerReviews(username) {
        let page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1, limit = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 20;
        try {
            console.log('[ReviewsService] Getting reviews by buyer:', username);
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(username);
            const url = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildApiUrl"])('/reviews/buyer/:username', {
                username: sanitizedUsername
            });
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("".concat(url, "?page=").concat(page, "&limit=").concat(limit), {
                method: 'GET'
            });
            if (response.success && response.data) {
                // Sanitize review comments
                response.data.reviews = response.data.reviews.map((review)=>({
                        ...review,
                        comment: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(review.comment),
                        sellerResponse: review.sellerResponse ? {
                            ...review.sellerResponse,
                            text: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(review.sellerResponse.text)
                        } : undefined
                    }));
            }
            return response;
        } catch (error) {
            console.error('[ReviewsService] Error getting buyer reviews:', error);
            return {
                success: false,
                error: {
                    code: 'FETCH_ERROR',
                    message: 'Failed to fetch buyer reviews'
                }
            };
        }
    }
    /**
   * Calculate average rating from reviews
   */ calculateAverageRating(reviews) {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, review)=>acc + review.rating, 0);
        return Math.round(sum / reviews.length * 10) / 10; // Round to 1 decimal
    }
    /**
   * Get rating distribution
   */ getRatingDistribution(reviews) {
        const stats = {
            avgRating: this.calculateAverageRating(reviews),
            totalReviews: reviews.length,
            fiveStars: 0,
            fourStars: 0,
            threeStars: 0,
            twoStars: 0,
            oneStars: 0
        };
        reviews.forEach((review)=>{
            switch(review.rating){
                case 5:
                    stats.fiveStars++;
                    break;
                case 4:
                    stats.fourStars++;
                    break;
                case 3:
                    stats.threeStars++;
                    break;
                case 2:
                    stats.twoStars++;
                    break;
                case 1:
                    stats.oneStars++;
                    break;
            }
        });
        return stats;
    }
    constructor(){}
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(ReviewsService, "instance", void 0);
const reviewsService = ReviewsService.getInstance();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/tip.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/tip.service.ts
__turbopack_context__.s({
    "tipService": ()=>tipService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
;
;
;
// Validation schemas
const tipAmountSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(1).max(500);
const tipMessageSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(500).optional();
class TipService {
    /**
   * Send a tip to a seller
   */ async sendTip(recipientUsername, amount, message) {
        try {
            // Validate inputs
            const validatedAmount = tipAmountSchema.parse(amount);
            const sanitizedRecipient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(recipientUsername);
            const sanitizedMessage = message ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(message) : undefined;
            if (sanitizedMessage) {
                tipMessageSchema.parse(sanitizedMessage);
            }
            // Use the API client to make the request to the backend
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call('/tips/send', {
                method: 'POST',
                body: JSON.stringify({
                    amount: validatedAmount,
                    recipientUsername: sanitizedRecipient,
                    message: sanitizedMessage
                })
            });
            if (response.success) {
                var _response_data, _response_data_transaction, _response_data1;
                return {
                    success: true,
                    message: ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.message) || "Successfully sent $".concat(validatedAmount.toFixed(2), " tip"),
                    transactionId: (_response_data1 = response.data) === null || _response_data1 === void 0 ? void 0 : (_response_data_transaction = _response_data1.transaction) === null || _response_data_transaction === void 0 ? void 0 : _response_data_transaction.id
                };
            } else {
                var _response_error;
                return {
                    success: false,
                    message: ((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || (typeof response.error === 'string' ? response.error : 'Failed to send tip')
                };
            }
        } catch (error) {
            console.error('[TipService] Error sending tip:', error);
            if (error instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].ZodError) {
                return {
                    success: false,
                    message: 'Invalid tip amount or message'
                };
            }
            return {
                success: false,
                message: 'Failed to send tip. Please try again.'
            };
        }
    }
    /**
   * Get tips received by a seller
   */ async getReceivedTips(username, options) {
        try {
            const params = new URLSearchParams();
            if (username) {
                params.append('username', (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(username));
            }
            if (options === null || options === void 0 ? void 0 : options.startDate) {
                params.append('startDate', options.startDate.toISOString());
            }
            if (options === null || options === void 0 ? void 0 : options.endDate) {
                params.append('endDate', options.endDate.toISOString());
            }
            if (options === null || options === void 0 ? void 0 : options.limit) {
                params.append('limit', Math.min(options.limit, 100).toString());
            }
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/tips/received?".concat(params), {
                method: 'GET'
            });
            if (response.success && response.data) {
                return response.data.data || {
                    tips: [],
                    total: 0,
                    count: 0
                };
            }
            return {
                tips: [],
                total: 0,
                count: 0
            };
        } catch (error) {
            console.error('[TipService] Error fetching received tips:', error);
            return {
                tips: [],
                total: 0,
                count: 0
            };
        }
    }
    /**
   * Get tips sent by a buyer
   */ async getSentTips(options) {
        try {
            const params = new URLSearchParams();
            if (options === null || options === void 0 ? void 0 : options.startDate) {
                params.append('startDate', options.startDate.toISOString());
            }
            if (options === null || options === void 0 ? void 0 : options.endDate) {
                params.append('endDate', options.endDate.toISOString());
            }
            if (options === null || options === void 0 ? void 0 : options.limit) {
                params.append('limit', Math.min(options.limit, 100).toString());
            }
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/tips/sent?".concat(params), {
                method: 'GET'
            });
            if (response.success && response.data) {
                return response.data.data || {
                    tips: [],
                    total: 0,
                    count: 0
                };
            }
            return {
                tips: [],
                total: 0,
                count: 0
            };
        } catch (error) {
            console.error('[TipService] Error fetching sent tips:', error);
            return {
                tips: [],
                total: 0,
                count: 0
            };
        }
    }
    /**
   * Get tip statistics for a seller
   */ async getTipStats(username) {
        try {
            const sanitizedUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(username);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/tips/stats/".concat(sanitizedUsername), {
                method: 'GET'
            });
            if (response.success && response.data) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('[TipService] Error fetching tip stats:', error);
            return null;
        }
    }
}
const tipService = new TipService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/app-initializer.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/app-initializer.ts
__turbopack_context__.s({
    "AppInitializer": ()=>AppInitializer,
    "appInitializer": ()=>appInitializer
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$ordersMigration$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/ordersMigration.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/environment.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
;
;
;
;
;
;
;
class AppInitializer {
    static getInstance() {
        if (!AppInitializer.instance) {
            AppInitializer.instance = new AppInitializer();
        }
        return AppInitializer.instance;
    }
    /**
   * Initialize the application with security checks
   */ async initialize() {
        // Check rate limit for initialization
        const rateLimitCheck = this.rateLimiter.check('APP_INIT', {
            maxAttempts: 5,
            windowMs: 5 * 60 * 1000 // 5 minutes
        });
        if (!rateLimitCheck.allowed) {
            return {
                success: false,
                errors: [
                    "Initialization rate limit exceeded. Please wait ".concat(rateLimitCheck.waitTime, " seconds.")
                ],
                warnings: []
            };
        }
        // If already initializing, return the existing promise
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        // If already initialized, return success
        if (this.initialized) {
            return {
                success: true,
                errors: [],
                warnings: []
            };
        }
        // Check max attempts
        if (this.initAttempts >= this.MAX_INIT_ATTEMPTS) {
            return {
                success: false,
                errors: [
                    'Maximum initialization attempts exceeded'
                ],
                warnings: []
            };
        }
        this.initAttempts++;
        // Start initialization
        this.initializationPromise = this.performInitialization();
        const result = await this.initializationPromise;
        if (result.success) {
            this.initialized = true;
        }
        return result;
    }
    async performInitialization() {
        const errors = [];
        const warnings = [];
        try {
            console.log('[AppInitializer] Starting application initialization...');
            // 0. Security checks first
            try {
                await this.performSecurityChecks();
            } catch (error) {
                errors.push("Security check failed: ".concat(this.sanitizeError(error)));
                return {
                    success: false,
                    errors,
                    warnings
                }; // Critical - stop initialization
            }
            // 1. Initialize CSRF protection
            try {
                console.log('[AppInitializer] Initializing CSRF protection...');
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].generateCSRFToken();
            } catch (error) {
                errors.push("CSRF initialization failed: ".concat(this.sanitizeError(error)));
            }
            // 2. Validate environment configuration
            try {
                console.log('[AppInitializer] Validating environment configuration...');
                const validation = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["validateConfiguration"])();
                if (!validation.valid) {
                    validation.errors.forEach((error)=>warnings.push("Configuration: ".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(error))));
                }
                // Log configuration in development (sanitized)
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDevelopment"])()) {
                    const config = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAllConfig"])();
                    console.log('[AppInitializer] Environment configuration:', this.sanitizeConfig(config));
                }
            } catch (error) {
                warnings.push("Configuration validation warning: ".concat(this.sanitizeError(error)));
            }
            // 3. Initialize storage service with security
            try {
                console.log('[AppInitializer] Initializing storage service...');
                await this.initializeStorage();
            } catch (error) {
                errors.push("Storage initialization failed: ".concat(this.sanitizeError(error)));
            }
            // 4. Backend API is now the primary data source
            console.log('[AppInitializer] Using backend API for all data operations');
            // 5. Initialize auth service
            try {
                console.log('[AppInitializer] Initializing auth service...');
            // Auth service initializes on first use
            } catch (error) {
                errors.push("Auth initialization failed: ".concat(this.sanitizeError(error)));
            }
            // 6. REMOVED: Wallet service no longer needs initialization
            // The wallet service now makes direct API calls and doesn't need initialization
            console.log('[AppInitializer] Wallet service will fetch data from API on demand');
            // 7. Clean up corrupted local data before migration
            try {
                console.log('[AppInitializer] Cleaning up corrupted data...');
                await this.cleanupCorruptedData();
            } catch (error) {
                warnings.push("Data cleanup warning: ".concat(this.sanitizeError(error)));
            }
            // 8. Run orders migration with validation
            try {
                console.log('[AppInitializer] Running orders migration...');
                await this.runSecureMigration();
            } catch (error) {
                warnings.push("Orders migration warning: ".concat(this.sanitizeError(error)));
            }
            // 9. Perform data integrity checks
            try {
                console.log('[AppInitializer] Checking data integrity...');
                await this.checkDataIntegrity();
            } catch (error) {
                warnings.push("Data integrity check warning: ".concat(this.sanitizeError(error)));
            }
            // 10. Clean up old data securely
            try {
                console.log('[AppInitializer] Cleaning up old data...');
                await this.cleanupOldData();
            } catch (error) {
                warnings.push("Cleanup warning: ".concat(this.sanitizeError(error)));
            }
            // Log results
            if (errors.length > 0) {
                console.error('[AppInitializer] Initialization errors:', errors);
            }
            if (warnings.length > 0) {
                console.warn('[AppInitializer] Initialization warnings:', warnings);
            }
            console.log('[AppInitializer] Initialization complete');
            return {
                success: errors.length === 0,
                errors,
                warnings
            };
        } catch (error) {
            console.error('[AppInitializer] Fatal initialization error:', error);
            errors.push("Fatal error: ".concat(this.sanitizeError(error)));
            return {
                success: false,
                errors,
                warnings
            };
        }
    }
    /**
   * Perform initial security checks
   */ async performSecurityChecks() {
        // Check for secure context (HTTPS in production)
        if ("TURBOPACK compile-time truthy", 1) {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.');
            // Only enforce HTTPS if not in development AND not on localhost
            if (window.location.protocol === 'http:' && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDevelopment"])() && !isLocalhost) {
                throw new Error('Application must be served over HTTPS in production');
            }
            // Check for critical browser features
            if (!window.crypto || !window.crypto.getRandomValues) {
                throw new Error('Web Crypto API not available');
            }
            // Check for Content Security Policy
            const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            if (!cspMeta && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDevelopment"])() && !isLocalhost) {
                console.warn('[AppInitializer] Content Security Policy not found');
            }
            // Check for secure cookies support
            if (!navigator.cookieEnabled) {
                console.warn('[AppInitializer] Cookies are disabled - some features may not work');
            }
        }
    }
    /**
   * Initialize storage with security checks
   */ async initializeStorage() {
        // Check if localStorage is available
        if ("object" === 'undefined' || !window.localStorage) {
            throw new Error('localStorage is not available');
        }
        // Test storage access with quota check
        const testKey = '__storage_test__';
        const testValue = 'x'.repeat(1024); // 1KB test
        try {
            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            if (retrieved !== testValue) {
                throw new Error('Storage integrity check failed');
            }
            localStorage.removeItem(testKey);
        } catch (error) {
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded');
            }
            throw new Error('localStorage is not accessible');
        }
        // Check for storage tampering
        try {
            const integrityCheck = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('__integrity_check__', null);
            if (integrityCheck && !this.validateIntegrityCheck(integrityCheck)) {
                console.warn('[AppInitializer] Storage integrity check failed - possible tampering');
            }
        } catch (error) {
            console.warn('[AppInitializer] Could not verify storage integrity');
        }
    }
    /**
   * Validate storage integrity check
   */ validateIntegrityCheck(check) {
        try {
            // Simple validation - in production, use cryptographic signatures
            return typeof check === 'string' && check.length === 64;
        } catch (e) {
            return false;
        }
    }
    /**
   * Clean up corrupted wallet data
   */ async cleanupCorruptedData() {
        const keysToCheck = [
            'wallet_buyers',
            'wallet_sellers',
            'wallet_admin',
            'wallet_orders'
        ];
        for (const key of keysToCheck){
            try {
                const rawValue = localStorage.getItem(key);
                // Check for corrupted data patterns
                if (rawValue && (rawValue.includes('xxxxxxxxxx') || rawValue === 'undefined')) {
                    console.warn("[AppInitializer] Removing corrupted data for ".concat(key));
                    // Set to appropriate default based on key type
                    if (key === 'wallet_admin') {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(key, '0');
                    } else if (key === 'wallet_orders') {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(key, []);
                    } else {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(key, {});
                    }
                }
            } catch (error) {
                console.error("[AppInitializer] Error cleaning ".concat(key, ":"), error);
            }
        }
        // Fix wallet_admin format specifically
        try {
            const adminBalance = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('wallet_admin', null);
            // If it's already a valid number string, we're good
            if (adminBalance !== null && !isNaN(parseFloat(adminBalance))) {
                return;
            }
            // Check enhanced format
            const enhancedBalance = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('wallet_admin_enhanced', null);
            if (enhancedBalance !== null && !isNaN(parseInt(enhancedBalance))) {
                // Convert from cents to dollars and save as string
                const balanceInDollars = parseInt(enhancedBalance) / 100;
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('wallet_admin', balanceInDollars.toString());
                return;
            }
            // Default to 0 if no valid balance found
            console.warn('[AppInitializer] Setting admin balance to default 0');
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('wallet_admin', '0');
        } catch (error) {
            console.error('[AppInitializer] Error fixing admin balance:', error);
        }
    }
    /**
   * Run migration with data validation
   */ async runSecureMigration() {
        // Validate migration data before running
        const orderData = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('wallet_orders', null);
        if (orderData) {
            // Enhanced validation using security service
            const contentCheck = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].checkContentSecurity(JSON.stringify(orderData));
            if (!contentCheck.safe) {
                throw new Error("Unsafe order data detected: ".concat(contentCheck.issues.join(', ')));
            }
            // Basic structure validation
            if (typeof orderData !== 'object' || Array.isArray(orderData)) {
                throw new Error('Invalid order data structure');
            }
            // Check data size to prevent DoS
            const dataSize = JSON.stringify(orderData).length;
            if (dataSize > 10 * 1024 * 1024) {
                throw new Error('Order data exceeds size limit');
            }
        }
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$ordersMigration$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["runOrdersMigration"])();
    }
    /**
   * Check data integrity with security validation
   */ async checkDataIntegrity() {
        // Check for critical data
        const criticalKeys = [
            'wallet_buyers',
            'wallet_sellers',
            'wallet_admin',
            'wallet_orders'
        ];
        // No longer skip for mock mode since we're not using mocks
        for (const key of criticalKeys){
            try {
                const data = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(key, null);
                if (data === null) {
                    console.warn("[AppInitializer] Missing critical data: ".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(key)));
                } else {
                    // Special handling for wallet_admin which can be a string (legacy) or number
                    if (key === 'wallet_admin') {
                        // Accept string, number, or enhanced format
                        if (typeof data !== 'string' && typeof data !== 'number') {
                            console.error("[AppInitializer] Invalid data structure for ".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(key)));
                        }
                    } else if (typeof data !== 'object') {
                        // Other keys should be objects
                        console.error("[AppInitializer] Invalid data structure for ".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(key)));
                    } else {
                        // Check for data corruption using security service
                        const sanitized = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].sanitizeForAPI(data);
                        if (Object.keys(sanitized).length === 0 && Object.keys(data).length > 0) {
                            console.error("[AppInitializer] Possible data corruption in ".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(key)));
                        }
                    }
                }
            } catch (error) {
                console.error("[AppInitializer] Error checking ".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(key), ":"), this.sanitizeError(error));
            }
        }
    }
    /**
   * Clean up old data with secure deletion
   */ async cleanupOldData() {
        // Define keys that should be removed (deprecated)
        const deprecatedKeys = [
            'old_wallet_data',
            'temp_listings',
            '__test_data__',
            // Add mock-related keys to cleanup
            'mock_api_state',
            'mock_api_requests',
            'mock_api_responses'
        ];
        // Validate each key before removal
        const safeDeprecatedKeys = deprecatedKeys.filter((key)=>typeof key === 'string' && key.length < 100).map((key)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(key));
        for (const key of safeDeprecatedKeys){
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].removeItem(key);
            } catch (error) {
                console.warn("[AppInitializer] Failed to remove deprecated key ".concat(key, ":"), error);
            }
        }
        // Clean up old session data (older than 30 days)
        try {
            const allKeys = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getKeys('session_');
            const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
            for (const key of allKeys.slice(0, 100)){
                const sessionData = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(key, null);
                if (sessionData && typeof sessionData === 'object' && 'timestamp' in sessionData && typeof sessionData.timestamp === 'number') {
                    if (sessionData.timestamp < thirtyDaysAgo) {
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].removeItem(key);
                    }
                }
            }
        } catch (error) {
            console.warn('[AppInitializer] Session cleanup error:', error);
        }
        // Clean up expired auth tokens
        try {
            const authData = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('auth_data', null);
            if (authData && authData.expiresAt) {
                const expiresAt = new Date(authData.expiresAt).getTime();
                if (!isNaN(expiresAt) && expiresAt < Date.now()) {
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].removeItem('auth_data');
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].removeItem('auth_token');
                    console.log('[AppInitializer] Cleaned up expired auth tokens');
                }
            }
        } catch (error) {
            console.warn('[AppInitializer] Auth cleanup error:', error);
        }
    }
    /**
   * Sanitize error messages for logging
   */ sanitizeError(error) {
        if (error instanceof Error) {
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(error.message.substring(0, 200)); // Limit length
        }
        return 'Unknown error';
    }
    /**
   * Sanitize configuration object for logging
   */ sanitizeConfig(config) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].sanitizeForAPI(config);
    }
    /**
   * Reset the initialization state
   * Useful for testing or forcing re-initialization
   */ reset() {
        if (this.initialized && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isDevelopment"])()) {
            console.warn('[AppInitializer] Reset called in production environment');
            // Rate limit resets in production
            const resetCheck = this.rateLimiter.check('APP_RESET', {
                maxAttempts: 3,
                windowMs: 60 * 60 * 1000 // 1 hour
            });
            if (!resetCheck.allowed) {
                throw new Error('Reset rate limit exceeded');
            }
        }
        this.initialized = false;
        this.initializationPromise = null;
        this.initAttempts = 0;
    }
    /**
   * Check if the app is initialized
   */ isInitialized() {
        return this.initialized;
    }
    /**
   * Get initialization status with details
   */ getStatus() {
        // Always return mock as disabled
        return {
            initialized: this.initialized,
            mockApiEnabled: false,
            mockScenario: undefined,
            attempts: this.initAttempts
        };
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "initialized", false);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "initializationPromise", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "MAX_INIT_ATTEMPTS", 3);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "initAttempts", 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "rateLimiter", (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])());
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(AppInitializer, "instance", void 0);
const appInitializer = AppInitializer.getInstance();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/index.ts [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/index.ts
/**
 * Central service exports
 * Import services from here throughout the application
 */ // Storage service - foundation for all data persistence
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
// Auth service - authentication and authorization
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/auth.service.ts [app-client] (ecmascript)");
// Users service - user management and profiles
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/users.service.ts [app-client] (ecmascript)");
// Ban service - ban management
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/ban.service.ts [app-client] (ecmascript)");
// Reports service - report management
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reports$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/reports.service.ts [app-client] (ecmascript)");
// Wallet service - financial operations
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/wallet.service.ts [app-client] (ecmascript)");
// Listings service - marketplace listings
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/listings.service.ts [app-client] (ecmascript)");
// Orders service - order management
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orders$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/orders.service.ts [app-client] (ecmascript)");
// Messages service - messaging functionality
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/messages.service.ts [app-client] (ecmascript)");
// Reviews service - review management
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reviews$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/reviews.service.ts [app-client] (ecmascript)");
// Tip service - tipping functionality
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tip$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/tip.service.ts [app-client] (ecmascript)");
// Security service - validation, sanitization, and security features
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
// App initializer - application startup
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$app$2d$initializer$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/app-initializer.ts [app-client] (ecmascript)");
// Re-export validation schemas for easy access
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
// Re-export security utilities
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/validation.ts [app-client] (ecmascript)");
// Export feature flags for conditional logic
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
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
;
;
;
;
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/auth.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/users.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/ban.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reports$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/reports.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$wallet$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/wallet.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/listings.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$orders$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/orders.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/messages.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reviews$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/reviews.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$tip$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/tip.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$app$2d$initializer$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/app-initializer.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$validation$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/validation.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <locals>");
}),
"[project]/src/services/websocket.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/websocket.service.ts
__turbopack_context__.s({
    "createWebSocketService": ()=>createWebSocketService,
    "default": ()=>__TURBOPACK__default__export__,
    "destroyWebSocketService": ()=>destroyWebSocketService,
    "getWebSocketService": ()=>getWebSocketService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/websocket.ts [app-client] (ecmascript)");
;
;
;
class WebSocketService {
    // Connect to WebSocket server
    connect() {
        if (this.state === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].CONNECTED || this.state === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].CONNECTING) {
            return;
        }
        console.log('[WebSocket] Connecting to:', this.options.url);
        this.setState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].CONNECTING);
        // Create Socket.IO connection
        this.socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])(this.options.url, {
            auth: this.options.auth,
            transports: [
                'websocket',
                'polling'
            ],
            reconnection: false
        });
        // Set up Socket.IO event listeners
        this.socket.on('connect', ()=>{
            var _this_socket, _this_socket1;
            console.log('[WebSocket] Connected with ID:', (_this_socket = this.socket) === null || _this_socket === void 0 ? void 0 : _this_socket.id);
            this.setState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].CONNECTED);
            this.reconnectAttempts = 0;
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].CONNECT, {
                connected: true,
                id: (_this_socket1 = this.socket) === null || _this_socket1 === void 0 ? void 0 : _this_socket1.id
            });
        });
        this.socket.on('disconnect', (reason)=>{
            console.log('[WebSocket] Disconnected:', reason);
            this.setState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].DISCONNECTED);
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].DISCONNECT, {
                connected: false,
                reason
            });
            // Attempt reconnection if enabled and not a manual disconnect
            if (this.options.reconnect && reason !== 'io client disconnect') {
                this.attemptReconnect();
            }
        });
        this.socket.on('connect_error', (error)=>{
            console.error('[WebSocket] Connection error:', error.message);
            this.setState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].ERROR);
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].ERROR, {
                message: error.message,
                type: error.type || 'connection_error'
            });
        });
        // Listen for custom events from backend
        this.setupEventListeners();
    }
    // Set up listeners for all custom events
    setupEventListeners() {
        if (!this.socket) return;
        // Connection confirmation (custom event from your backend)
        this.socket.on('connected', (data)=>{
            console.log('[WebSocket] Connection confirmed:', data);
        });
        // Message events
        this.socket.on('message:new', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].MESSAGE_NEW, data);
            this.emit('message:new', data);
        });
        this.socket.on('message:typing', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].MESSAGE_TYPING, data);
            this.emit('message:typing', data);
        });
        this.socket.on('message:read', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].MESSAGE_READ, data);
            this.emit('message:read', data);
        });
        // Order events
        this.socket.on('order:new', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].ORDER_NEW, data);
            this.emit('order:new', data);
        });
        this.socket.on('order:created', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].ORDER_NEW, data);
            this.emit('order:created', data);
        });
        this.socket.on('order:status_change', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].ORDER_STATUS_CHANGE, data);
            this.emit('order:status_change', data);
        });
        // Wallet events
        this.socket.on('wallet:balance_update', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].WALLET_BALANCE_UPDATE, data);
            this.emit('wallet:balance_update', data);
        });
        this.socket.on('wallet:transaction', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].WALLET_TRANSACTION, data);
            this.emit('wallet:transaction', data);
        });
        // Auction events
        this.socket.on('auction:bid', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].AUCTION_BID, data);
            this.emit('auction:bid', data);
        });
        this.socket.on('auction:outbid', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].AUCTION_OUTBID, data);
            this.emit('auction:outbid', data);
        });
        this.socket.on('auction:ended', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].AUCTION_ENDED, data);
            this.emit('auction:ended', data);
        });
        // FIXED: User status events - handle all three event types properly
        this.socket.on('user:online', (data)=>{
            console.log('[WebSocket] Processing user:online event:', data);
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_ONLINE, data);
            this.emit('user:online', data);
        });
        this.socket.on('user:offline', (data)=>{
            console.log('[WebSocket] Processing user:offline event:', data);
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_OFFLINE, data);
            this.emit('user:offline', data);
        });
        this.socket.on('user:status', (data)=>{
            console.log('[WebSocket] Processing user:status event:', data);
            this.emit('user:status', data);
            // Also emit as online/offline based on the status
            if (data.isOnline) {
                this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_ONLINE, data);
                this.emit('user:online', data);
            } else {
                this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_OFFLINE, data);
                this.emit('user:offline', data);
            }
        });
        // Notification events
        this.socket.on('notification:new', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].NOTIFICATION_NEW, data);
            this.emit('notification:new', data);
        });
        // Subscription events
        this.socket.on('subscription:new', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].SUBSCRIPTION_NEW, data);
            this.emit('subscription:new', data);
        });
        this.socket.on('subscription:cancelled', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].SUBSCRIPTION_CANCELLED, data);
            this.emit('subscription:cancelled', data);
        });
        // Listing events
        this.socket.on('listing:new', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].LISTING_NEW, data);
            this.emit('listing:new', data);
        });
        this.socket.on('listing:sold', (data)=>{
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].LISTING_SOLD, data);
            this.emit('listing:sold', data);
        });
        // Thread events
        this.socket.on('thread:user_viewing', (data)=>{
            this.emit('thread:user_viewing', data);
        });
        // Users online list
        this.socket.on('users:online_list', (data)=>{
            this.emit('users:online_list', data);
        });
        // Generic event listener for debugging
        this.socket.onAny(function(eventName) {
            for(var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
                args[_key - 1] = arguments[_key];
            }
            console.log('[WebSocket] Received event:', eventName, args);
        });
    }
    // Disconnect from WebSocket server
    disconnect() {
        console.log('[WebSocket] Disconnecting...');
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.setState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].DISCONNECTED);
    }
    // Subscribe to WebSocket events (fixed to accept string events too)
    on(event, handler) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event).add(handler);
        // Return unsubscribe function
        return ()=>{
            const handlers = this.handlers.get(event);
            if (handlers) {
                handlers.delete(handler);
                if (handlers.size === 0) {
                    this.handlers.delete(event);
                }
            }
        };
    }
    // Emit event to all handlers (fixed to accept string events too)
    emit(event, data) {
        const handlers = this.handlers.get(event);
        if (handlers) {
            handlers.forEach((handler)=>{
                try {
                    handler(data);
                } catch (error) {
                    console.error("[WebSocket] Error in handler for ".concat(event, ":"), error);
                }
            });
        }
    }
    // Send message through WebSocket
    send(event, data) {
        if (!this.socket || this.state !== __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].CONNECTED) {
            console.warn('[WebSocket] Not connected, cannot send:', event);
            return;
        }
        // Send through Socket.IO
        this.socket.emit(event, data);
        console.log('[WebSocket] Sent event:', event, data);
    }
    // Get current connection state
    getState() {
        return this.state;
    }
    // Check if connected
    isConnected() {
        return this.state === __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].CONNECTED;
    }
    // Set connection state
    setState(newState) {
        this.state = newState;
        console.log("[WebSocket] State changed to: ".concat(newState));
    }
    // Attempt to reconnect
    attemptReconnect() {
        if (!this.options.reconnect || this.reconnectAttempts >= this.options.reconnectAttempts) {
            console.error('[WebSocket] Max reconnection attempts reached');
            this.setState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].ERROR);
            this.emit(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].ERROR, {
                message: 'Max reconnection attempts reached'
            });
            return;
        }
        this.reconnectAttempts++;
        this.setState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].RECONNECTING);
        console.log("[WebSocket] Reconnecting... (attempt ".concat(this.reconnectAttempts, ")"));
        this.reconnectTimer = setTimeout(()=>{
            this.connect();
        }, this.options.reconnectDelay);
    }
    // Clean up resources
    destroy() {
        this.disconnect();
        this.handlers.clear();
    }
    constructor(options = {}){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "state", __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].DISCONNECTED);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "options", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "handlers", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "socket", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "reconnectTimer", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "reconnectAttempts", 0);
        var _options_autoConnect, _options_reconnect, _options_reconnectAttempts, _options_reconnectDelay;
        this.options = {
            url: options.url || '',
            autoConnect: (_options_autoConnect = options.autoConnect) !== null && _options_autoConnect !== void 0 ? _options_autoConnect : true,
            reconnect: (_options_reconnect = options.reconnect) !== null && _options_reconnect !== void 0 ? _options_reconnect : true,
            reconnectAttempts: (_options_reconnectAttempts = options.reconnectAttempts) !== null && _options_reconnectAttempts !== void 0 ? _options_reconnectAttempts : 5,
            reconnectDelay: (_options_reconnectDelay = options.reconnectDelay) !== null && _options_reconnectDelay !== void 0 ? _options_reconnectDelay : 3000,
            auth: options.auth || {}
        };
        if (this.options.autoConnect) {
            this.connect();
        }
    }
}
// Create singleton instance
let instance = null;
const createWebSocketService = (options)=>{
    if (!instance) {
        instance = new WebSocketService(options);
    }
    return instance;
};
const getWebSocketService = ()=>{
    return instance;
};
const destroyWebSocketService = ()=>{
    if (instance) {
        instance.destroy();
        instance = null;
    }
};
const __TURBOPACK__default__export__ = WebSocketService;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/favorites.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/favorites.service.ts
__turbopack_context__.s({
    "favoritesService": ()=>favoritesService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
;
;
;
class FavoritesService {
    async getFavorites(username) {
        try {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/favorites');
                return {
                    success: response.success,
                    data: response.data,
                    error: response.error,
                    meta: response.meta
                };
            }
            // LocalStorage fallback
            const storageKey = "".concat(this.STORAGE_KEY_PREFIX).concat(username);
            const favorites = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(storageKey, []);
            return {
                success: true,
                data: favorites,
                meta: {
                    total: favorites.length
                }
            };
        } catch (error) {
            console.error('Get favorites error:', error);
            return {
                success: false,
                error: {
                    code: 'FETCH_ERROR',
                    message: 'Failed to get favorites'
                }
            };
        }
    }
    async checkFavorite(sellerId) {
        try {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                var _response_data;
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/favorites/check/".concat(sellerId));
                return {
                    success: response.success,
                    isFavorited: ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.isFavorited) || false
                };
            }
            // LocalStorage fallback handled by context
            return {
                success: true,
                isFavorited: false
            };
        } catch (error) {
            console.error('Check favorite error:', error);
            return {
                success: false,
                isFavorited: false
            };
        }
    }
    async addFavorite(favorite) {
        try {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/favorites', {
                    method: 'POST',
                    body: JSON.stringify({
                        sellerId: favorite.sellerId,
                        sellerUsername: favorite.sellerUsername,
                        profilePicture: favorite.profilePicture,
                        tier: favorite.tier,
                        isVerified: favorite.isVerified
                    })
                });
                return response;
            }
            // LocalStorage fallback handled by context
            return {
                success: true
            };
        } catch (error) {
            console.error('Add favorite error:', error);
            return {
                success: false,
                error: {
                    code: 'ADD_ERROR',
                    message: 'Failed to add favorite'
                }
            };
        }
    }
    async removeFavorite(sellerId) {
        try {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/favorites/".concat(sellerId), {
                    method: 'DELETE'
                });
                return response;
            }
            // LocalStorage fallback handled by context
            return {
                success: true
            };
        } catch (error) {
            console.error('Remove favorite error:', error);
            return {
                success: false,
                error: {
                    code: 'REMOVE_ERROR',
                    message: 'Failed to remove favorite'
                }
            };
        }
    }
    async getFavoritesStats(username) {
        try {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])('/favorites/stats');
            }
            // LocalStorage stats
            const storageKey = "".concat(this.STORAGE_KEY_PREFIX).concat(username);
            const favorites = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(storageKey, []);
            const byTier = favorites.reduce((acc, fav)=>{
                const tier = fav.tier || 'Unknown';
                acc[tier] = (acc[tier] || 0) + 1;
                return acc;
            }, {});
            return {
                success: true,
                data: {
                    total: favorites.length,
                    byTier: Object.entries(byTier).map((param)=>{
                        let [tier, count] = param;
                        return {
                            _id: tier,
                            count
                        };
                    }),
                    recentlyAdded: favorites.slice(0, 5)
                }
            };
        } catch (error) {
            console.error('Get favorites stats error:', error);
            return {
                success: false,
                error: {
                    code: 'STATS_ERROR',
                    message: 'Failed to get favorites stats'
                }
            };
        }
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "STORAGE_KEY_PREFIX", 'favorites_');
    }
}
const favoritesService = new FavoritesService();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/services/notification.service.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/services/notification.service.ts
__turbopack_context__.s({
    "notificationService": ()=>notificationService
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
;
;
;
;
class NotificationService {
    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
    // Get active notifications
    async getActiveNotifications() {
        let limit = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 50;
        try {
            const cacheKey = "active_".concat(limit);
            const cached = this.getCachedNotifications(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: cached
                };
            }
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/active?limit=".concat(limit), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success && response.data) {
                const sanitizedNotifications = this.sanitizeNotifications(response.data);
                this.setCachedNotifications(cacheKey, sanitizedNotifications);
                // Store in local storage for offline access
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('active_notifications', sanitizedNotifications);
                return {
                    success: true,
                    data: sanitizedNotifications
                };
            }
            return response;
        } catch (error) {
            console.error('Error fetching active notifications:', error);
            // Try to return cached data on error
            const cached = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('active_notifications', []);
            return {
                success: true,
                data: cached
            };
        }
    }
    // Get cleared notifications
    async getClearedNotifications() {
        let limit = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 50;
        try {
            const cacheKey = "cleared_".concat(limit);
            const cached = this.getCachedNotifications(cacheKey);
            if (cached) {
                return {
                    success: true,
                    data: cached
                };
            }
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/cleared?limit=".concat(limit), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success && response.data) {
                const sanitizedNotifications = this.sanitizeNotifications(response.data);
                this.setCachedNotifications(cacheKey, sanitizedNotifications);
                // Store in local storage
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('cleared_notifications', sanitizedNotifications);
                return {
                    success: true,
                    data: sanitizedNotifications
                };
            }
            return response;
        } catch (error) {
            console.error('Error fetching cleared notifications:', error);
            // Try to return cached data on error
            const cached = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('cleared_notifications', []);
            return {
                success: true,
                data: cached
            };
        }
    }
    // Get all notifications with pagination
    async getAllNotifications() {
        let page = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 1, limit = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 100;
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/all?page=".concat(page, "&limit=").concat(limit), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success && response.data) {
                const sanitizedData = {
                    ...response.data,
                    notifications: this.sanitizeNotifications(response.data.notifications || [])
                };
                return {
                    success: true,
                    data: sanitizedData
                };
            }
            return response;
        } catch (error) {
            console.error('Error fetching all notifications:', error);
            return {
                success: false,
                error: 'Failed to fetch notifications'
            };
        }
    }
    // Get unread count
    async getUnreadCount() {
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/unread-count", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success && response.data) {
                return response.data.count || 0;
            }
            return 0;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    }
    // Mark notification as read
    async markAsRead(notificationId) {
        try {
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(notificationId);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/".concat(sanitizedId, "/read"), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success) {
                this.invalidateCache();
            }
            return response;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return {
                success: false,
                error: 'Failed to mark notification as read'
            };
        }
    }
    // Mark all notifications as read
    async markAllAsRead() {
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/read-all", {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success) {
                this.invalidateCache();
            }
            return response;
        } catch (error) {
            console.error('Error marking all as read:', error);
            return {
                success: false,
                error: 'Failed to mark all notifications as read'
            };
        }
    }
    // Clear notification
    async clearNotification(notificationId) {
        try {
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(notificationId);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/".concat(sanitizedId, "/clear"), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success) {
                this.invalidateCache();
                // Update local storage
                const active = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('active_notifications', []);
                const updated = active.filter((n)=>(n._id || n.id) !== sanitizedId);
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('active_notifications', updated);
            }
            return response;
        } catch (error) {
            console.error('Error clearing notification:', error);
            return {
                success: false,
                error: 'Failed to clear notification'
            };
        }
    }
    // Clear all notifications
    async clearAll() {
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/clear-all", {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success) {
                this.invalidateCache();
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].removeItem('active_notifications');
            }
            return response;
        } catch (error) {
            console.error('Error clearing all notifications:', error);
            return {
                success: false,
                error: 'Failed to clear all notifications'
            };
        }
    }
    // Restore notification
    async restoreNotification(notificationId) {
        try {
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(notificationId);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/".concat(sanitizedId, "/restore"), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success) {
                this.invalidateCache();
            }
            return response;
        } catch (error) {
            console.error('Error restoring notification:', error);
            return {
                success: false,
                error: 'Failed to restore notification'
            };
        }
    }
    // Delete notification
    async deleteNotification(notificationId) {
        try {
            const sanitizedId = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(notificationId);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/".concat(sanitizedId), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success) {
                this.invalidateCache();
                // Update local storage
                const cleared = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('cleared_notifications', []);
                const updated = cleared.filter((n)=>(n._id || n.id) !== sanitizedId);
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('cleared_notifications', updated);
            }
            return response;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return {
                success: false,
                error: 'Failed to delete notification'
            };
        }
    }
    // Delete all cleared notifications
    async deleteAllCleared() {
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/cleared/all", {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success) {
                this.invalidateCache();
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].removeItem('cleared_notifications');
            }
            return response;
        } catch (error) {
            console.error('Error deleting cleared notifications:', error);
            return {
                success: false,
                error: 'Failed to delete cleared notifications'
            };
        }
    }
    // Get notifications by type
    async getNotificationsByType(type) {
        let limit = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 50;
        try {
            const sanitizedType = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(type);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/type/".concat(sanitizedType, "?limit=").concat(limit), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success && response.data) {
                const sanitizedNotifications = this.sanitizeNotifications(response.data);
                return {
                    success: true,
                    data: sanitizedNotifications
                };
            }
            return response;
        } catch (error) {
            console.error('Error fetching notifications by type:', error);
            return {
                success: false,
                error: 'Failed to fetch notifications'
            };
        }
    }
    // Search notifications
    async searchNotifications(params) {
        try {
            const sanitizedParams = {
                q: params.q ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(params.q) : undefined,
                type: params.type ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(params.type) : undefined,
                startDate: params.startDate,
                endDate: params.endDate,
                limit: params.limit || 50
            };
            const queryString = new URLSearchParams(Object.entries(sanitizedParams).filter((param)=>{
                let [_, v] = param;
                return v !== undefined;
            })).toString();
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiClient"].call("/notifications/search?".concat(queryString), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success && response.data) {
                const sanitizedNotifications = this.sanitizeNotifications(response.data);
                return {
                    success: true,
                    data: sanitizedNotifications
                };
            }
            return response;
        } catch (error) {
            console.error('Error searching notifications:', error);
            return {
                success: false,
                error: 'Failed to search notifications'
            };
        }
    }
    // Helper methods
    sanitizeNotifications(notifications) {
        return notifications.map((n)=>({
                ...n,
                id: n._id || n.id,
                title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(n.title),
                message: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(n.message),
                recipient: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(n.recipient)
            }));
    }
    getCachedNotifications(key) {
        const cached = this.cachedNotifications.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }
    setCachedNotifications(key, data) {
        this.cachedNotifications.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    invalidateCache() {
        this.cachedNotifications.clear();
    }
    // Create local notification (for legacy support)
    async createLocalNotification(recipient, message) {
        let type = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'system';
        try {
            const notifications = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('local_notifications', {});
            const newNotification = {
                id: "local_".concat(Date.now(), "_").concat(Math.random()),
                recipient: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(recipient),
                type: type,
                title: 'Notification',
                message: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(message),
                read: false,
                cleared: false,
                createdAt: new Date().toISOString(),
                priority: 'normal'
            };
            if (!notifications[recipient]) {
                notifications[recipient] = [];
            }
            notifications[recipient].unshift(newNotification);
            // Keep only last 100 notifications per user
            notifications[recipient] = notifications[recipient].slice(0, 100);
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('local_notifications', notifications);
            // Fire event for UI updates
            if ("TURBOPACK compile-time truthy", 1) {
                window.dispatchEvent(new CustomEvent('notification:new', {
                    detail: newNotification
                }));
            }
        } catch (error) {
            console.error('Error creating local notification:', error);
        }
    }
    // Sync local notifications with backend
    async syncNotifications() {
        try {
            // Get remote notifications
            const remoteResponse = await this.getActiveNotifications(100);
            if (!remoteResponse.success || !remoteResponse.data) return;
            const remoteNotifications = Array.isArray(remoteResponse.data) ? remoteResponse.data : [];
            // Get local notifications
            const localNotifications = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('local_notifications', {});
            // Merge and deduplicate
            // This is a simplified sync - in production you'd want more sophisticated conflict resolution
            const merged = {};
            // Add remote notifications
            remoteNotifications.forEach((n)=>{
                if (!merged[n.recipient]) {
                    merged[n.recipient] = [];
                }
                merged[n.recipient].push(n);
            });
            // Add local notifications that don't exist remotely
            Object.entries(localNotifications).forEach((param)=>{
                let [recipient, notifications] = param;
                if (!merged[recipient]) {
                    merged[recipient] = [];
                }
                notifications.forEach((localNotif)=>{
                    if (localNotif.id.startsWith('local_')) {
                        // This is a local-only notification, keep it
                        merged[recipient].push(localNotif);
                    }
                });
            });
            // Sort by date and limit
            Object.keys(merged).forEach((recipient)=>{
                merged[recipient] = merged[recipient].sort((a, b)=>new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);
            });
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('local_notifications', merged);
        } catch (error) {
            console.error('Error syncing notifications:', error);
        }
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "cachedNotifications", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "cacheTimeout", 30000); // 30 seconds cache
    }
}
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(NotificationService, "instance", void 0);
const notificationService = NotificationService.getInstance();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_services_d9780a76._.js.map