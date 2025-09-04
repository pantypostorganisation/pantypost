(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/context/AuthContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AuthProvider": ()=>AuthProvider,
    "getGlobalAuthToken": ()=>getGlobalAuthToken,
    "useAuth": ()=>useAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/environment.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
;
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
// ==================== SCHEMAS ====================
const LoginPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(60),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'buyer',
        'seller',
        'admin'
    ]).optional()
});
// ==================== HELPERS ====================
function safeNow() {
    try {
        return Date.now();
    } catch (e) {
        return new Date().getTime();
    }
}
/**
 * Safely parse JSON; return null if empty/invalid.
 */ async function safeParseJson(resp) {
    try {
        const text = await resp.text();
        if (!text) return null;
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}
/**
 * Derive absolute expiry from `expiresIn` (seconds or ms).
 * Fallback to defaultMs when not provided.
 */ function deriveExpiry(expiresIn, defaultMs) {
    const now = safeNow();
    if (typeof expiresIn === 'number' && Number.isFinite(expiresIn)) {
        // Heuristic: values <= 24*60*60*100 (i.e., less than 1 day if treated as ms)
        // are likely seconds; multiply by 1000. Otherwise assume ms.
        const asMs = expiresIn < 86_400 ? expiresIn * 1000 : expiresIn;
        return now + asMs;
    }
    return now + defaultMs;
}
// ==================== API CLIENT ====================
class ApiClient {
    /**
   * Build full API URL - handles both relative and absolute endpoints
   */ buildUrl(endpoint) {
        // If endpoint already starts with http/https, return as is
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        // Ensure endpoint starts with /
        const path = endpoint.startsWith('/') ? endpoint : "/".concat(endpoint);
        // If baseURL already ends with /api, don't add it again
        if (this.baseURL.endsWith('/api')) {
            return "".concat(this.baseURL).concat(path);
        }
        // Otherwise, add /api prefix to the path
        return "".concat(this.baseURL, "/api").concat(path);
    }
    async refreshTokens() {
        // Prevent multiple simultaneous refresh attempts
        if (this.refreshPromise) {
            return this.refreshPromise;
        }
        const tokens = this.authContext.getTokens();
        if (!(tokens === null || tokens === void 0 ? void 0 : tokens.refreshToken)) {
            return null;
        }
        this.refreshPromise = (async ()=>{
            try {
                const response = await fetch(this.buildUrl('/auth/refresh'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        refreshToken: tokens.refreshToken
                    })
                });
                // Gracefully parse JSON (may be empty on some implementations)
                const data = await safeParseJson(response);
                if (response.ok && (data === null || data === void 0 ? void 0 : data.success) && (data === null || data === void 0 ? void 0 : data.data)) {
                    var // try both common fields
                    _data_data_expiresIn;
                    const expiresAt = deriveExpiry((_data_data_expiresIn = data.data.expiresIn) !== null && _data_data_expiresIn !== void 0 ? _data_data_expiresIn : data.data.tokenExpiresIn, 30 * 60 * 1000 // fallback 30 minutes
                    );
                    const newTokens = {
                        token: data.data.token,
                        refreshToken: data.data.refreshToken || tokens.refreshToken,
                        expiresAt
                    };
                    this.authContext.setTokens(newTokens);
                    // Fire token update event for WebSocket
                    if ("TURBOPACK compile-time truthy", 1) {
                        window.dispatchEvent(new CustomEvent('auth-token-updated', {
                            detail: {
                                token: newTokens.token
                            }
                        }));
                    }
                    // Call the refresh callback if provided
                    if (this.authContext.onTokenRefresh) {
                        await this.authContext.onTokenRefresh();
                    }
                    return newTokens;
                }
                // If refresh failed, clear tokens
                throw new Error('Invalid refresh response');
            } catch (error) {
                console.error('Token refresh failed:', error);
                this.authContext.setTokens(null);
                if ("TURBOPACK compile-time truthy", 1) {
                    window.dispatchEvent(new CustomEvent('auth-token-cleared'));
                }
                return null;
            } finally{
                this.refreshPromise = null;
            }
        })();
        return this.refreshPromise;
    }
    async getValidToken() {
        const tokens = this.authContext.getTokens();
        if (!tokens) {
            return null;
        }
        // Check if token is expired or about to expire (5 minutes buffer)
        const isExpiringSoon = tokens.expiresAt <= safeNow() + 5 * 60 * 1000;
        if (isExpiringSoon) {
            const newTokens = await this.refreshTokens();
            return (newTokens === null || newTokens === void 0 ? void 0 : newTokens.token) || null;
        }
        return tokens.token;
    }
    async request(endpoint) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const token = await this.getValidToken();
        // Create headers as a plain object first
        const headerObj = {
            'Content-Type': 'application/json'
        };
        // Add existing headers from options
        if (options.headers) {
            const existingHeaders = options.headers instanceof Headers ? Object.fromEntries(options.headers.entries()) : Array.isArray(options.headers) ? Object.fromEntries(options.headers) : options.headers;
            Object.assign(headerObj, existingHeaders);
        }
        // Add auth token if available
        if (token) {
            headerObj['Authorization'] = "Bearer ".concat(token);
        }
        const url = this.buildUrl(endpoint);
        const doFetch = async ()=>{
            var _json_error;
            const resp = await fetch(url, {
                ...options,
                headers: headerObj
            });
            const json = await safeParseJson(resp);
            // If server returns our standard shape, just return it as-is
            if (json && typeof json.success === 'boolean') {
                return json;
            }
            // Otherwise normalize a minimal shape
            if (resp.ok) {
                return {
                    success: true,
                    data: json
                };
            }
            return {
                success: false,
                error: {
                    code: resp.status || 'HTTP_ERROR',
                    message: (json === null || json === void 0 ? void 0 : (_json_error = json.error) === null || _json_error === void 0 ? void 0 : _json_error.message) || resp.statusText || 'Request failed'
                }
            };
        };
        try {
            var _error, _this;
            const result = await doFetch();
            // Handle 401 Unauthorized - try to refresh token once
            if (!result.success && ((_this = result) === null || _this === void 0 ? void 0 : (_error = _this.error) === null || _error === void 0 ? void 0 : _error.code) === 401 && token) {
                const newTokens = await this.refreshTokens();
                if (newTokens) {
                    headerObj['Authorization'] = "Bearer ".concat(newTokens.token);
                    const retry = await doFetch();
                    return retry;
                }
            }
            return result;
        } catch (error) {
            console.error('API request failed:', error);
            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: 'Network request failed'
                }
            };
        }
    }
    // Convenience methods
    get(endpoint, options) {
        return this.request(endpoint, {
            ...options,
            method: 'GET'
        });
    }
    post(endpoint, body, options) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined
        });
    }
    patch(endpoint, body, options) {
        return this.request(endpoint, {
            ...options,
            method: 'PATCH',
            body: body ? JSON.stringify(body) : undefined
        });
    }
    delete(endpoint, options) {
        return this.request(endpoint, {
            ...options,
            method: 'DELETE'
        });
    }
    constructor(baseURL, authContext){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "baseURL", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "authContext", void 0);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "refreshPromise", null);
        this.baseURL = baseURL.replace(/\/+$/, ''); // strip trailing slashes
        this.authContext = authContext;
    }
}
// ==================== AUTH CONTEXT ====================
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Get API base URL from environment config
const API_BASE_URL = (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiConfig"] === null || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiConfig"] === void 0 ? void 0 : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiConfig"].baseUrl) || ("TURBOPACK compile-time value", "http://localhost:5000/api") || 'http://localhost:5000';
// Enhanced Token storage with WebSocket event support
class TokenStorage {
    setTokens(tokens) {
        this.memoryTokens = tokens;
        if ("TURBOPACK compile-time truthy", 1) {
            if (tokens) {
                try {
                    sessionStorage.setItem('auth_tokens', JSON.stringify(tokens));
                    // Fire token update event
                    window.dispatchEvent(new CustomEvent('auth-token-updated', {
                        detail: {
                            token: tokens.token
                        }
                    }));
                } catch (error) {
                    console.error('Failed to store tokens:', error);
                }
            } else {
                sessionStorage.removeItem('auth_tokens');
                // Fire token cleared event
                window.dispatchEvent(new CustomEvent('auth-token-cleared'));
            }
        }
    }
    getTokens() {
        return this.memoryTokens;
    }
    clear() {
        this.memoryTokens = null;
        if ("TURBOPACK compile-time truthy", 1) {
            sessionStorage.removeItem('auth_tokens');
            // Fire token cleared event
            window.dispatchEvent(new CustomEvent('auth-token-cleared'));
        }
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "memoryTokens", null);
        // Try to restore from sessionStorage on initialization
        if ("TURBOPACK compile-time truthy", 1) {
            try {
                const stored = sessionStorage.getItem('auth_tokens');
                if (stored) {
                    var _this_memoryTokens;
                    this.memoryTokens = JSON.parse(stored);
                    // Fire initial token event if we have tokens
                    if ((_this_memoryTokens = this.memoryTokens) === null || _this_memoryTokens === void 0 ? void 0 : _this_memoryTokens.token) {
                        setTimeout(()=>{
                            window.dispatchEvent(new CustomEvent('auth-token-updated', {
                                detail: {
                                    token: this.memoryTokens.token
                                }
                            }));
                        }, 100);
                    }
                }
            } catch (error) {
                console.error('Failed to restore tokens:', error);
            }
        }
    }
}
function AuthProvider(param) {
    let { children } = param;
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isAuthReady, setIsAuthReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    // Token storage instance
    const tokenStorageRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new TokenStorage());
    // API client instance with auth context
    const apiClientRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Refresh session - fetch current user
    const refreshSession = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[refreshSession]": async ()=>{
            const tokens = tokenStorageRef.current.getTokens();
            if (!(tokens === null || tokens === void 0 ? void 0 : tokens.token)) {
                setUser(null);
                return;
            }
            try {
                const response = await apiClientRef.current.get('/auth/me');
                if (response.success && response.data) {
                    setUser(response.data);
                } else {
                    setUser(null);
                    tokenStorageRef.current.clear();
                }
            } catch (error) {
                console.error('Failed to refresh session:', error);
                setUser(null);
                tokenStorageRef.current.clear();
            }
        }
    }["AuthProvider.useCallback[refreshSession]"], []);
    // Initialize API client
    if (!apiClientRef.current) {
        apiClientRef.current = new ApiClient(API_BASE_URL, {
            getTokens: ()=>tokenStorageRef.current.getTokens(),
            setTokens: (tokens)=>tokenStorageRef.current.setTokens(tokens),
            onTokenRefresh: async ()=>{
                // Refresh user data after token refresh
                await refreshSession();
            }
        });
    }
    // Clear error
    const clearError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[clearError]": ()=>{
            setError(null);
        }
    }["AuthProvider.useCallback[clearError]"], []);
    // Get auth token
    const getAuthToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[getAuthToken]": ()=>{
            const tokens = tokenStorageRef.current.getTokens();
            return (tokens === null || tokens === void 0 ? void 0 : tokens.token) || null;
        }
    }["AuthProvider.useCallback[getAuthToken]"], []);
    // Initialize auth state on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const initAuth = {
                "AuthProvider.useEffect.initAuth": async ()=>{
                    console.log('[Auth] Initializing...');
                    console.log('[Auth] API_BASE_URL:', API_BASE_URL);
                    try {
                        await refreshSession();
                    } catch (error) {
                        console.error('[Auth] Init error:', error);
                    } finally{
                        setIsAuthReady(true);
                        console.log('[Auth] Ready');
                    }
                }
            }["AuthProvider.useEffect.initAuth"];
            initAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["AuthProvider.useEffect"], []); // refreshSession is stable here; intentional single-run
    const login = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[login]": async function(username, password) {
            let role = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'buyer';
            console.log('[Auth] Login attempt:', {
                username,
                role,
                hasPassword: !!password
            });
            setLoading(true);
            setError(null);
            try {
                var _response_data;
                // Validate & sanitize inputs
                const parsed = LoginPayloadSchema.safeParse({
                    username,
                    password,
                    role
                });
                if (!parsed.success) {
                    setError('Please enter a valid username and password.');
                    setLoading(false);
                    return false;
                }
                const cleanUsername = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"] ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(parsed.data.username) : parsed.data.username.trim();
                const payload = {
                    username: cleanUsername,
                    password: parsed.data.password,
                    role: parsed.data.role
                };
                // Use the API client which handles URL construction properly
                const response = await apiClientRef.current.post('/auth/login', payload);
                console.log('[Auth] Login response:', {
                    success: response.success,
                    hasUser: !!((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.user)
                });
                if (response.success && response.data) {
                    var // try common fields the backend might send
                    _response_data_expiresIn;
                    // Calculate token expiration (prefer backend hints)
                    const expiresAt = deriveExpiry((_response_data_expiresIn = response.data.expiresIn) !== null && _response_data_expiresIn !== void 0 ? _response_data_expiresIn : response.data.tokenExpiresIn, 7 * 24 * 60 * 60 * 1000 // fallback 7 days
                    );
                    const tokens = {
                        token: response.data.token,
                        refreshToken: response.data.refreshToken,
                        expiresAt
                    };
                    // Store tokens securely (fires auth-token-updated)
                    tokenStorageRef.current.setTokens(tokens);
                    // Set user state
                    setUser(response.data.user);
                    console.log('[Auth] Login successful');
                    setLoading(false);
                    return true;
                } else {
                    var _error, _this;
                    const errorMessage = ((_this = response) === null || _this === void 0 ? void 0 : (_error = _this.error) === null || _error === void 0 ? void 0 : _error.message) || 'Login failed';
                    setError(errorMessage);
                    setLoading(false);
                    return false;
                }
            } catch (error) {
                console.error('[Auth] Login error:', error);
                setError('Network error. Please check your connection and try again.');
                setLoading(false);
                return false;
            }
        }
    }["AuthProvider.useCallback[login]"], []);
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[logout]": async ()=>{
            console.log('[Auth] Logging out...');
            try {
                const token = getAuthToken();
                if (token) {
                    // Even if the server returns 204, our client handles it safely
                    await apiClientRef.current.post('/auth/logout');
                }
            } catch (error) {
                console.error('[Auth] Logout API error:', error);
            }
            // Clear local state regardless of API response (fires auth-token-cleared)
            tokenStorageRef.current.clear();
            setUser(null);
            setError(null);
            // Redirect to login page
            router.push('/login');
            console.log('[Auth] Logout complete');
        }
    }["AuthProvider.useCallback[logout]"], [
        getAuthToken,
        router
    ]);
    // Update user function
    const updateUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[updateUser]": async (updates)=>{
            if (!user) {
                setError('No user to update');
                return;
            }
            try {
                const response = await apiClientRef.current.patch("/users/".concat(user.username, "/profile"), updates);
                if (response.success && response.data) {
                    setUser(response.data);
                } else {
                    var _response_error;
                    setError(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to update user');
                }
            } catch (error) {
                console.error('Update user error:', error);
                setError(error.message || 'Failed to update user');
            }
        }
    }["AuthProvider.useCallback[updateUser]"], [
        user
    ]);
    const contextValue = {
        user,
        isAuthReady,
        login,
        logout,
        updateUser,
        isLoggedIn: !!user,
        loading,
        error,
        clearError,
        refreshSession,
        getAuthToken,
        apiClient: apiClientRef.current,
        token: getAuthToken()
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AuthContext.tsx",
        lineNumber: 656,
        columnNumber: 10
    }, this);
}
_s(AuthProvider, "BHh11CWJcV6yimzqBiAVzHDPq0w=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const getGlobalAuthToken = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const stored = sessionStorage.getItem('auth_tokens');
        if (stored) {
            const tokens = JSON.parse(stored);
            return (tokens === null || tokens === void 0 ? void 0 : tokens.token) || null;
        }
    } catch (error) {
        console.error('Failed to get global auth token:', error);
    }
    return null;
};
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/ToastContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/context/ToastContext.tsx
__turbopack_context__.s({
    "ToastProvider": ()=>ToastProvider,
    "toastApiError": ()=>toastApiError,
    "useToast": ()=>useToast
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-client] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-client] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.js [app-client] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-client] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature();
'use client';
;
;
;
const ToastContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Default durations by type
const DEFAULT_DURATIONS = {
    success: 4000,
    error: 6000,
    info: 5000,
    warning: 5000,
    loading: 0
};
// Toast icons
const TOAST_ICONS = {
    success: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"],
    error: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"],
    info: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"],
    warning: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
    loading: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"]
};
// Toast colors
const TOAST_COLORS = {
    success: {
        bg: 'bg-green-900/20',
        border: 'border-green-700',
        icon: 'text-green-400'
    },
    error: {
        bg: 'bg-red-900/20',
        border: 'border-red-700',
        icon: 'text-red-400'
    },
    info: {
        bg: 'bg-blue-900/20',
        border: 'border-blue-700',
        icon: 'text-blue-400'
    },
    warning: {
        bg: 'bg-yellow-900/20',
        border: 'border-yellow-700',
        icon: 'text-yellow-400'
    },
    loading: {
        bg: 'bg-gray-900/20',
        border: 'border-gray-700',
        icon: 'text-[#ff950e]'
    }
};
function ToastProvider(param) {
    let { children } = param;
    _s();
    const [toasts, setToasts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const timersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    // Generate unique ID
    const generateId = ()=>"toast_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    // Show toast
    const showToast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[showToast]": (toast)=>{
            const id = generateId();
            var _toast_duration, _toast_dismissible;
            const newToast = {
                ...toast,
                id,
                duration: (_toast_duration = toast.duration) !== null && _toast_duration !== void 0 ? _toast_duration : DEFAULT_DURATIONS[toast.type],
                dismissible: (_toast_dismissible = toast.dismissible) !== null && _toast_dismissible !== void 0 ? _toast_dismissible : true
            };
            setToasts({
                "ToastProvider.useCallback[showToast]": (prev)=>[
                        ...prev,
                        newToast
                    ]
            }["ToastProvider.useCallback[showToast]"]);
            // Auto-dismiss if duration is set and not persistent
            if (newToast.duration && !newToast.persistent) {
                const timer = setTimeout({
                    "ToastProvider.useCallback[showToast].timer": ()=>{
                        removeToast(id);
                    }
                }["ToastProvider.useCallback[showToast].timer"], newToast.duration);
                timersRef.current.set(id, timer);
            }
            return id;
        }
    }["ToastProvider.useCallback[showToast]"], []);
    // Update toast
    const updateToast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[updateToast]": (id, updates)=>{
            setToasts({
                "ToastProvider.useCallback[updateToast]": (prev)=>prev.map({
                        "ToastProvider.useCallback[updateToast]": (toast)=>toast.id === id ? {
                                ...toast,
                                ...updates
                            } : toast
                    }["ToastProvider.useCallback[updateToast]"])
            }["ToastProvider.useCallback[updateToast]"]);
            // Handle duration updates
            if (updates.duration !== undefined) {
                const existingTimer = timersRef.current.get(id);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                    timersRef.current.delete(id);
                }
                if (updates.duration && !updates.persistent) {
                    const timer = setTimeout({
                        "ToastProvider.useCallback[updateToast].timer": ()=>{
                            removeToast(id);
                        }
                    }["ToastProvider.useCallback[updateToast].timer"], updates.duration);
                    timersRef.current.set(id, timer);
                }
            }
        }
    }["ToastProvider.useCallback[updateToast]"], []);
    // Remove toast
    const removeToast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[removeToast]": (id)=>{
            // Clear any existing timer
            const timer = timersRef.current.get(id);
            if (timer) {
                clearTimeout(timer);
                timersRef.current.delete(id);
            }
            setToasts({
                "ToastProvider.useCallback[removeToast]": (prev)=>prev.filter({
                        "ToastProvider.useCallback[removeToast]": (toast)=>toast.id !== id
                    }["ToastProvider.useCallback[removeToast]"])
            }["ToastProvider.useCallback[removeToast]"]);
        }
    }["ToastProvider.useCallback[removeToast]"], []);
    // Clear all toasts
    const clearToasts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[clearToasts]": ()=>{
            // Clear all timers
            timersRef.current.forEach({
                "ToastProvider.useCallback[clearToasts]": (timer)=>clearTimeout(timer)
            }["ToastProvider.useCallback[clearToasts]"]);
            timersRef.current.clear();
            setToasts([]);
        }
    }["ToastProvider.useCallback[clearToasts]"], []);
    // Convenience methods
    const success = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[success]": (title, message)=>showToast({
                type: 'success',
                title,
                message
            })
    }["ToastProvider.useCallback[success]"], [
        showToast
    ]);
    const error = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[error]": (title, message)=>showToast({
                type: 'error',
                title,
                message
            })
    }["ToastProvider.useCallback[error]"], [
        showToast
    ]);
    const info = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[info]": (title, message)=>showToast({
                type: 'info',
                title,
                message
            })
    }["ToastProvider.useCallback[info]"], [
        showToast
    ]);
    const warning = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[warning]": (title, message)=>showToast({
                type: 'warning',
                title,
                message
            })
    }["ToastProvider.useCallback[warning]"], [
        showToast
    ]);
    const loading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[loading]": (title, message)=>showToast({
                type: 'loading',
                title,
                message,
                persistent: true
            })
    }["ToastProvider.useCallback[loading]"], [
        showToast
    ]);
    // Promise handler
    const promise = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ToastProvider.useCallback[promise]": async (promise, messages)=>{
            const id = loading(messages.loading);
            try {
                const result = await promise;
                const successMessage = typeof messages.success === 'function' ? messages.success(result) : messages.success;
                updateToast(id, {
                    type: 'success',
                    title: successMessage,
                    message: undefined,
                    duration: DEFAULT_DURATIONS.success,
                    persistent: false
                });
                return result;
            } catch (error) {
                const errorMessage = typeof messages.error === 'function' ? messages.error(error) : messages.error;
                updateToast(id, {
                    type: 'error',
                    title: errorMessage,
                    message: error instanceof Error ? error.message : undefined,
                    duration: DEFAULT_DURATIONS.error,
                    persistent: false
                });
                throw error;
            }
        }
    }["ToastProvider.useCallback[promise]"], [
        loading,
        updateToast
    ]);
    // Cleanup timers on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ToastProvider.useEffect": ()=>{
            return ({
                "ToastProvider.useEffect": ()=>{
                    timersRef.current.forEach({
                        "ToastProvider.useEffect": (timer)=>clearTimeout(timer)
                    }["ToastProvider.useEffect"]);
                    timersRef.current.clear();
                }
            })["ToastProvider.useEffect"];
        }
    }["ToastProvider.useEffect"], []);
    const value = {
        toasts,
        showToast,
        updateToast,
        removeToast,
        clearToasts,
        success,
        error,
        info,
        warning,
        loading,
        promise
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastContext.Provider, {
        value: value,
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastContainer, {}, void 0, false, {
                fileName: "[project]/src/context/ToastContext.tsx",
                lineNumber: 258,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/context/ToastContext.tsx",
        lineNumber: 256,
        columnNumber: 5
    }, this);
}
_s(ToastProvider, "1Mf2Fu1na+hhTIbMIemVGtkqulU=");
_c = ToastProvider;
// Toast Container Component
function ToastContainer() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ToastContext);
    if (!context) return null;
    const { toasts, removeToast } = context;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed top-4 right-4 z-50 pointer-events-none",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
            mode: "popLayout",
            children: toasts.map((toast)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastItem, {
                    toast: toast,
                    onRemove: ()=>removeToast(toast.id)
                }, toast.id, false, {
                    fileName: "[project]/src/context/ToastContext.tsx",
                    lineNumber: 274,
                    columnNumber: 11
                }, this))
        }, void 0, false, {
            fileName: "[project]/src/context/ToastContext.tsx",
            lineNumber: 272,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/context/ToastContext.tsx",
        lineNumber: 271,
        columnNumber: 5
    }, this);
}
_s1(ToastContainer, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
_c1 = ToastContainer;
// Individual Toast Component
function ToastItem(param) {
    let { toast, onRemove } = param;
    const Icon = TOAST_ICONS[toast.type];
    const colors = TOAST_COLORS[toast.type];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            y: -20,
            scale: 0.95
        },
        animate: {
            opacity: 1,
            y: 0,
            scale: 1
        },
        exit: {
            opacity: 0,
            scale: 0.95
        },
        transition: {
            duration: 0.2
        },
        className: "pointer-events-auto mb-3",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "\n        ".concat(colors.bg, " ").concat(colors.border, "\n        border rounded-lg shadow-lg p-4\n        max-w-sm min-w-[300px]\n        backdrop-blur-sm\n      "),
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                        className: "w-5 h-5 ".concat(colors.icon, " flex-shrink-0 ").concat(toast.type === 'loading' ? 'animate-spin' : '')
                    }, void 0, false, {
                        fileName: "[project]/src/context/ToastContext.tsx",
                        lineNumber: 305,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-semibold text-white",
                                children: toast.title
                            }, void 0, false, {
                                fileName: "[project]/src/context/ToastContext.tsx",
                                lineNumber: 310,
                                columnNumber: 13
                            }, this),
                            toast.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-400 mt-1",
                                children: toast.message
                            }, void 0, false, {
                                fileName: "[project]/src/context/ToastContext.tsx",
                                lineNumber: 314,
                                columnNumber: 15
                            }, this),
                            toast.action && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: toast.action.onClick,
                                className: "text-xs text-[#ff950e] hover:text-[#ff7a00] mt-2 font-medium",
                                children: toast.action.label
                            }, void 0, false, {
                                fileName: "[project]/src/context/ToastContext.tsx",
                                lineNumber: 319,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/context/ToastContext.tsx",
                        lineNumber: 309,
                        columnNumber: 11
                    }, this),
                    toast.dismissible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onRemove,
                        className: "text-gray-400 hover:text-white transition-colors",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            className: "w-4 h-4"
                        }, void 0, false, {
                            fileName: "[project]/src/context/ToastContext.tsx",
                            lineNumber: 333,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/context/ToastContext.tsx",
                        lineNumber: 329,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/context/ToastContext.tsx",
                lineNumber: 304,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/context/ToastContext.tsx",
            lineNumber: 298,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/context/ToastContext.tsx",
        lineNumber: 291,
        columnNumber: 5
    }, this);
}
_c2 = ToastItem;
function useToast() {
    _s2();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
_s2(useToast, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
function toastApiError(error) {
    let fallbackMessage = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'An error occurred';
    var _error_response_data_error, _error_response_data, _error_response;
    _s3();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ToastContext);
    if (!context) return;
    let message = fallbackMessage;
    if (error === null || error === void 0 ? void 0 : (_error_response = error.response) === null || _error_response === void 0 ? void 0 : (_error_response_data = _error_response.data) === null || _error_response_data === void 0 ? void 0 : (_error_response_data_error = _error_response_data.error) === null || _error_response_data_error === void 0 ? void 0 : _error_response_data_error.message) {
        message = error.response.data.error.message;
    } else if (error === null || error === void 0 ? void 0 : error.message) {
        message = error.message;
    }
    context.error('Error', message);
}
_s3(toastApiError, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "ToastProvider");
__turbopack_context__.k.register(_c1, "ToastContainer");
__turbopack_context__.k.register(_c2, "ToastItem");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/BanContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "BanProvider": ()=>BanProvider,
    "useBans": ()=>useBans
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/ban.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/users.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/permissions.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
// ================== Constants ==================
const STORAGE_KEYS = {
    BANS: 'panty_user_bans',
    HISTORY: 'panty_ban_history',
    REVIEWS: 'panty_appeal_reviews',
    IP_BANS: 'panty_ip_bans'
};
/**
 * Reserved usernames that should never be bannable (system/service accounts).
 * NOTE: Not human admins; real admin checks use role via isAdmin(user).
 */ const RESERVED_USERNAMES = [
    'system',
    'platform',
    'admin',
    'administrator',
    'moderator',
    'mod'
];
/** Exact-match, case-insensitive protection for reserved accounts */ const isProtectedUsername = (username)=>{
    const clean = (username || '').toLowerCase().trim();
    return RESERVED_USERNAMES.includes(clean);
};
// Ask backend for role (defensive, in case caller doesn’t pass role)
const checkUserRole = async (username)=>{
    try {
        var _result_data;
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].getUser(username);
        if (result.success && ((_result_data = result.data) === null || _result_data === void 0 ? void 0 : _result_data.role)) return result.data.role;
        return null;
    } catch (err) {
        console.error('[BanContext] Error checking user role:', err);
        return null;
    }
};
const BanContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// ================== Validation Schemas ==================
const banReasonSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'harassment',
    'spam',
    'inappropriate_content',
    'scam',
    'underage',
    'payment_fraud',
    'other'
]);
const banDurationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('permanent'),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().max(8760)
]);
const appealTextSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10).max(1000);
const customReasonSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(5).max(500);
const banNotesSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(1000);
// Simple IPv4, conservative; adjust if you need IPv6
const ipAddressSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^(?:\d{1,3}\.){3}\d{1,3}$/);
// ---- Conservative mock data detector/scrubber ----
const isMockString = (val)=>{
    if (!val) return false;
    const v = String(val).trim().toLowerCase();
    const patterns = [
        'spammer',
        'scammer',
        'troublemaker',
        'oldbanner',
        'mock',
        'sample',
        'demo',
        'test',
        'lorem',
        'ipsum',
        'john_doe',
        'jane_doe'
    ];
    return patterns.some((p)=>v.includes(p));
};
const isMockBan = (b)=>{
    return isMockString(b.username) || isMockString(b.bannedBy) || isMockString(b.customReason) || isMockString(b.notes) || b.id && (b.id.startsWith('mock_') || b.id.includes('sample') || b.id.includes('test'));
};
const isMockHistory = (h)=>{
    return isMockString(h.username) || isMockString(h.details) || isMockString(h.adminUsername) || h.id && (h.id.startsWith('mock_') || h.id.includes('sample') || h.id.includes('test'));
};
const scrubMocks = async (bans, history, reviews, ipBans)=>{
    const cleanBans = bans.filter((b)=>!isMockBan(b));
    const cleanHistory = history.filter((h)=>!isMockHistory(h));
    const cleanReviews = reviews.filter((r)=>{
        var _r_reviewId_startsWith, _r_reviewId;
        return !(((_r_reviewId = r.reviewId) === null || _r_reviewId === void 0 ? void 0 : (_r_reviewId_startsWith = _r_reviewId.startsWith) === null || _r_reviewId_startsWith === void 0 ? void 0 : _r_reviewId_startsWith.call(_r_reviewId, 'mock_')) || isMockString(r.reviewerAdmin) || isMockString(r.reviewNotes));
    });
    const cleanIPBans = ipBans.filter((ip)=>{
        var _ip_ipAddress_startsWith, _ip_ipAddress;
        return !(((_ip_ipAddress = ip.ipAddress) === null || _ip_ipAddress === void 0 ? void 0 : (_ip_ipAddress_startsWith = _ip_ipAddress.startsWith) === null || _ip_ipAddress_startsWith === void 0 ? void 0 : _ip_ipAddress_startsWith.call(_ip_ipAddress, '0.0.0')) || isMockString(ip.reason));
    });
    const removed = {
        bans: bans.length - cleanBans.length,
        history: history.length - cleanHistory.length,
        reviews: reviews.length - cleanReviews.length,
        ipBans: ipBans.length - cleanIPBans.length
    };
    if (removed.bans || removed.history || removed.reviews || removed.ipBans) {
        console.warn('[BanContext] Removed mock/dev data from storage:', removed);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.BANS, cleanBans);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.HISTORY, cleanHistory);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.REVIEWS, cleanReviews);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.IP_BANS, cleanIPBans);
    }
    return {
        cleanBans,
        cleanHistory,
        cleanReviews,
        cleanIPBans
    };
};
// --------------------------------------------------
// Image compression for appeal evidence (defensive checks)
const compressImage = (file)=>new Promise((resolve, reject)=>{
        try {
            if (!file || !file.type.startsWith('image/')) {
                return reject(new Error('Invalid file type'));
            }
            // Limit ~5MB files to avoid memory issues
            if (typeof file.size === 'number' && file.size > 5 * 1024 * 1024) {
                console.warn('[BanContext] Evidence file is large; compressing aggressively');
            }
            const reader = new FileReader();
            reader.onload = (event)=>{
                var _event_target;
                const img = new Image();
                img.onload = ()=>{
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxDimension = 800;
                    let { width, height } = img;
                    if (width > height) {
                        if (width > maxDimension) {
                            height = height * maxDimension / width;
                            width = maxDimension;
                        }
                    } else {
                        if (height > maxDimension) {
                            width = width * maxDimension / height;
                            height = maxDimension;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = ()=>reject(new Error('Image load failed'));
                img.src = (_event_target = event.target) === null || _event_target === void 0 ? void 0 : _event_target.result;
            };
            reader.onerror = ()=>reject(new Error('File read failed'));
            reader.readAsDataURL(file);
        } catch (e) {
            reject(e);
        }
    });
const BanProvider = (param)=>{
    let { children } = param;
    _s();
    const [bans, setBans] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [banHistory, setBanHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [appealReviews, setAppealReviews] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [ipBans, setIPBans] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isInitialized, setIsInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    // Track active timers to prevent leaks
    const activeTimers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    // Saving guard
    const isSavingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    // Dev override to allow non-admin actions locally when explicitly enabled
    const canAdminAct = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[canAdminAct]": (action)=>{
            const devBypass = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_ALLOW_LOCAL_BAN === '1';
            if (devBypass && user) {
                console.warn("[BanContext] Dev override enabled for action: ".concat(action, " by ").concat(user.username));
                return true;
            }
            return !!(user && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAdmin"])(user));
        }
    }["BanProvider.useCallback[canAdminAct]"], [
        user
    ]);
    // Force refresh function
    const refreshBanData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[refreshBanData]": async ()=>{
            console.log('[BanContext] Force refreshing ban data...');
            setIsInitialized(false);
            await loadData(true);
        }
    }["BanProvider.useCallback[refreshBanData]"], []);
    // Load from storage using service
    const loadData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[loadData]": async function() {
            let forceRefresh = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            if (isInitialized && !forceRefresh) return;
            try {
                console.log('[BanContext] Loading ban data...', {
                    forceRefresh
                });
                const storedBans = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(STORAGE_KEYS.BANS, []);
                const storedHistory = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(STORAGE_KEYS.HISTORY, []);
                const storedAppealReviews = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(STORAGE_KEYS.REVIEWS, []);
                const storedIPBans = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(STORAGE_KEYS.IP_BANS, []);
                // Scrub any clear mock remnants
                const { cleanBans, cleanHistory, cleanReviews, cleanIPBans } = await scrubMocks(storedBans || [], storedHistory || [], storedAppealReviews || [], storedIPBans || []);
                // Auto-expire any temporary bans already past endTime
                const now = new Date();
                const updatedBans = cleanBans.map({
                    "BanProvider.useCallback[loadData].updatedBans": (ban)=>{
                        if (ban.active && ban.banType === 'temporary' && ban.endTime) {
                            if (now >= new Date(ban.endTime)) {
                                console.log("[BanContext] Auto-expiring ban for ".concat(ban.username));
                                return {
                                    ...ban,
                                    active: false
                                };
                            }
                        }
                        return ban;
                    }
                }["BanProvider.useCallback[loadData].updatedBans"]);
                setBans(updatedBans);
                setBanHistory(cleanHistory);
                setAppealReviews(cleanReviews);
                setIPBans(cleanIPBans);
                // Persist only if any changed
                const anyExpiredChanged = updatedBans.length === cleanBans.length && updatedBans.some({
                    "BanProvider.useCallback[loadData]": (b, i)=>{
                        var _cleanBans_i;
                        return b.active !== ((_cleanBans_i = cleanBans[i]) === null || _cleanBans_i === void 0 ? void 0 : _cleanBans_i.active);
                    }
                }["BanProvider.useCallback[loadData]"]);
                if (anyExpiredChanged) {
                    isSavingRef.current = true;
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.BANS, updatedBans);
                    isSavingRef.current = false;
                }
                // Schedule expiration for active temporary bans
                updatedBans.forEach({
                    "BanProvider.useCallback[loadData]": (ban)=>{
                        if (ban.active && ban.banType === 'temporary' && ban.endTime) {
                            scheduleExpiration(ban);
                        }
                    }
                }["BanProvider.useCallback[loadData]"]);
                console.log('[BanContext] Data loaded:', {
                    activeBans: updatedBans.filter({
                        "BanProvider.useCallback[loadData]": (b)=>b.active
                    }["BanProvider.useCallback[loadData]"]).length,
                    totalBans: updatedBans.length
                });
                setIsInitialized(true);
            } catch (error) {
                console.error('[BanContext] Error loading ban data:', error);
                setIsInitialized(true);
            }
        }
    }["BanProvider.useCallback[loadData]"], [
        isInitialized
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BanProvider.useEffect": ()=>{
            loadData();
        }
    }["BanProvider.useEffect"], [
        loadData
    ]);
    // Persistors (guarded to avoid loops)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BanProvider.useEffect": ()=>{
            if ("object" !== 'undefined' && isInitialized && !isSavingRef.current) {
                isSavingRef.current = true;
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.BANS, bans).finally({
                    "BanProvider.useEffect": ()=>{
                        isSavingRef.current = false;
                    }
                }["BanProvider.useEffect"]);
            }
        }
    }["BanProvider.useEffect"], [
        bans,
        isInitialized
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BanProvider.useEffect": ()=>{
            if ("object" !== 'undefined' && isInitialized && !isSavingRef.current) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.HISTORY, banHistory);
            }
        }
    }["BanProvider.useEffect"], [
        banHistory,
        isInitialized
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BanProvider.useEffect": ()=>{
            if ("object" !== 'undefined' && isInitialized && !isSavingRef.current) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.REVIEWS, appealReviews);
            }
        }
    }["BanProvider.useEffect"], [
        appealReviews,
        isInitialized
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BanProvider.useEffect": ()=>{
            if ("object" !== 'undefined' && isInitialized && !isSavingRef.current) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.IP_BANS, ipBans);
            }
        }
    }["BanProvider.useEffect"], [
        ipBans,
        isInitialized
    ]);
    // Cleanup timers on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BanProvider.useEffect": ()=>{
            return ({
                "BanProvider.useEffect": ()=>{
                    activeTimers.current.forEach({
                        "BanProvider.useEffect": (t)=>clearTimeout(t)
                    }["BanProvider.useEffect"]);
                    activeTimers.current.clear();
                }
            })["BanProvider.useEffect"];
        }
    }["BanProvider.useEffect"], []);
    // ---------- Validation (async because we may look up role) ----------
    const validateBanInput = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[validateBanInput]": async (username, hours, reason, targetUserRole)=>{
            const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            if (!sanitized) return {
                valid: false,
                error: 'Invalid username format'
            };
            // Avoid banning reserved/system accounts
            if (isProtectedUsername(sanitized)) {
                return {
                    valid: false,
                    error: 'This account is protected and cannot be banned'
                };
            }
            // Block admins
            if (targetUserRole === 'admin') {
                return {
                    valid: false,
                    error: 'Admin accounts cannot be banned'
                };
            }
            if (!targetUserRole) {
                const role = await checkUserRole(sanitized);
                if (role === 'admin') return {
                    valid: false,
                    error: 'Admin accounts cannot be banned'
                };
            }
            const dur = banDurationSchema.safeParse(hours);
            if (!dur.success) return {
                valid: false,
                error: 'Invalid ban duration (max 1 year)'
            };
            const reasonOk = banReasonSchema.safeParse(reason);
            if (!reasonOk.success) return {
                valid: false,
                error: 'Invalid ban reason'
            };
            return {
                valid: true
            };
        }
    }["BanProvider.useCallback[validateBanInput]"], []);
    // ---------- History helper ----------
    const addBanHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[addBanHistory]": (action, username, details, adminUsername, metadata)=>{
            const historyEntry = {
                id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
                username: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username,
                action,
                details: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(details),
                timestamp: new Date().toISOString(),
                adminUsername: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(adminUsername) || adminUsername,
                metadata
            };
            setBanHistory({
                "BanProvider.useCallback[addBanHistory]": (prev)=>[
                        ...prev,
                        historyEntry
                    ]
            }["BanProvider.useCallback[addBanHistory]"]);
        }
    }["BanProvider.useCallback[addBanHistory]"], []);
    // ---------- Unban first (used by scheduler) ----------
    const clearExpirationTimer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[clearExpirationTimer]": (banId)=>{
            const t = activeTimers.current.get(banId);
            if (t) {
                clearTimeout(t);
                activeTimers.current.delete(banId);
            }
        }
    }["BanProvider.useCallback[clearExpirationTimer]"], []);
    const unbanUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[unbanUser]": async (username, adminUsername, reason)=>{
            // Admin-only
            if (!canAdminAct('unban')) {
                console.warn('[BanContext] Unban blocked: admin privileges required');
                return false;
            }
            try {
                const cleanUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username;
                const cleanAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(adminUsername || (user === null || user === void 0 ? void 0 : user.username) || 'system');
                const cleanReason = reason ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reason) : 'Ban lifted by admin';
                const banToUnban = bans.find({
                    "BanProvider.useCallback[unbanUser].banToUnban": (b)=>b.username === cleanUsername && b.active
                }["BanProvider.useCallback[unbanUser].banToUnban"]);
                if (!banToUnban) {
                    console.warn('[BanContext] No active ban found for', cleanUsername);
                    return false;
                }
                // stop any scheduled expiration
                clearExpirationTimer(banToUnban.id);
                const updated = bans.map({
                    "BanProvider.useCallback[unbanUser].updated": (b)=>b.id === banToUnban.id ? {
                            ...b,
                            active: false
                        } : b
                }["BanProvider.useCallback[unbanUser].updated"]);
                // Persist first to avoid race
                isSavingRef.current = true;
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.BANS, updated);
                isSavingRef.current = false;
                setBans(updated);
                addBanHistory('unbanned', cleanUsername, cleanReason, cleanAdmin);
                // UI event
                if ("TURBOPACK compile-time truthy", 1) {
                    window.dispatchEvent(new CustomEvent('banUpdated', {
                        detail: {
                            banId: banToUnban.id,
                            username: cleanUsername,
                            action: 'unbanned'
                        }
                    }));
                }
                console.log('[BanContext] User unbanned:', cleanUsername);
                return true;
            } catch (err) {
                console.error('[BanContext] Error unbanning user:', err);
                isSavingRef.current = false;
                return false;
            }
        }
    }["BanProvider.useCallback[unbanUser]"], [
        bans,
        addBanHistory,
        clearExpirationTimer,
        canAdminAct,
        user === null || user === void 0 ? void 0 : user.username
    ]);
    // ---------- Scheduler ----------
    const scheduleExpiration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[scheduleExpiration]": (ban)=>{
            if (ban.banType === 'permanent' || !ban.endTime || !ban.active) return;
            const ms = new Date(ban.endTime).getTime() - Date.now();
            if (ms <= 0) return;
            console.log("[BanContext] Scheduling expiration for ".concat(ban.username, " in ~").concat(Math.round(ms / 60000), " minutes"));
            const t = setTimeout({
                "BanProvider.useCallback[scheduleExpiration].t": async ()=>{
                    console.log("[BanContext] Auto-expiring ban for ".concat(ban.username));
                    await unbanUser(ban.username, 'system', 'Automatic expiration');
                    if ("TURBOPACK compile-time truthy", 1) {
                        window.dispatchEvent(new CustomEvent('banExpired', {
                            detail: {
                                banId: ban.id,
                                username: ban.username
                            }
                        }));
                    }
                    activeTimers.current.delete(ban.id);
                }
            }["BanProvider.useCallback[scheduleExpiration].t"], ms);
            activeTimers.current.set(ban.id, t);
        }
    }["BanProvider.useCallback[scheduleExpiration]"], [
        unbanUser
    ]);
    // ---------- Ban user ----------
    const banUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[banUser]": async function(username, hours, reason, customReason, adminUsername) {
            let reportIds = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : [], notes = arguments.length > 6 ? arguments[6] : void 0, targetUserRole = arguments.length > 7 ? arguments[7] : void 0;
            // Admin-only
            if (!canAdminAct('ban')) {
                console.warn('[BanContext] Ban blocked: admin privileges required');
                if ("TURBOPACK compile-time truthy", 1) {
                    alert('Only admins can ban users.');
                }
                return false;
            }
            console.log('[BanContext] Attempting to ban user:', {
                username,
                hours,
                reason,
                targetUserRole
            });
            const validation = await validateBanInput(username, hours, reason, targetUserRole);
            if (!validation.valid) {
                console.error('[BanContext] Ban validation failed:', validation.error);
                if (validation.error === 'Admin accounts cannot be banned' || validation.error === 'This account is protected and cannot be banned') {
                    if ("TURBOPACK compile-time truthy", 1) alert(validation.error);
                }
                return false;
            }
            // Sanitize inputs
            const cleanUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username;
            const cleanAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(adminUsername || (user === null || user === void 0 ? void 0 : user.username) || 'system');
            const cleanNotes = notes ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(notes) : undefined;
            let cleanCustomReason;
            if (customReason) {
                const cr = customReasonSchema.safeParse(customReason);
                if (!cr.success) {
                    console.error('[BanContext] Custom reason too short/long');
                    return false;
                }
                cleanCustomReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(cr.data);
            }
            // Lock to avoid duplicate bans
            const lockKey = "ban_user_".concat(cleanUsername);
            const existingLock = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(lockKey, null);
            if (existingLock) {
                try {
                    const age = Date.now() - (existingLock.timestamp || 0);
                    if (age < 30_000) {
                        console.warn("[BanContext] Ban already in progress for ".concat(cleanUsername));
                        return false;
                    }
                } catch (e) {
                // ignore bad lock
                }
            }
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(lockKey, {
                timestamp: Date.now(),
                adminUser: cleanAdmin
            });
            try {
                // Already banned?
                const already = bans.find({
                    "BanProvider.useCallback[banUser].already": (b)=>b.username === cleanUsername && b.active
                }["BanProvider.useCallback[banUser].already"]);
                if (already) {
                    console.warn("[BanContext] ".concat(cleanUsername, " is already banned"));
                    return false;
                }
                // Save to DB (best-effort)
                const apiResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["banService"].createBan({
                    username: cleanUsername,
                    reason: cleanCustomReason || reason,
                    customReason: cleanCustomReason,
                    duration: hours,
                    notes: cleanNotes,
                    relatedReportIds: reportIds,
                    bannedBy: cleanAdmin
                });
                if (!apiResponse.success) {
                    console.warn('[BanContext] MongoDB save failed; continuing with local cache', apiResponse.error);
                }
                const now = new Date();
                const banId = Date.now().toString() + Math.random().toString(36).slice(2, 11);
                const end = hours === 'permanent' ? undefined : new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
                const newBan = {
                    id: banId,
                    username: cleanUsername,
                    banType: hours === 'permanent' ? 'permanent' : 'temporary',
                    reason,
                    customReason: cleanCustomReason,
                    startTime: now.toISOString(),
                    endTime: end,
                    remainingHours: hours === 'permanent' ? undefined : hours,
                    bannedBy: cleanAdmin,
                    active: true,
                    appealable: true,
                    notes: cleanNotes,
                    reportIds: reportIds,
                    appealStatus: undefined
                };
                setBans({
                    "BanProvider.useCallback[banUser]": (prev)=>[
                            ...prev,
                            newBan
                        ]
                }["BanProvider.useCallback[banUser]"]);
                if (newBan.banType === 'temporary' && newBan.endTime) {
                    scheduleExpiration(newBan);
                }
                const durationText = hours === 'permanent' ? 'permanently' : "for ".concat(hours, " hours");
                addBanHistory('banned', cleanUsername, "Banned ".concat(durationText, " for ").concat(reason).concat(cleanCustomReason ? ": ".concat(cleanCustomReason) : ''), cleanAdmin, {
                    banId,
                    mongoSaved: apiResponse.success
                });
                console.log('[BanContext] Ban created successfully', {
                    mongoSaved: apiResponse.success
                });
                return true;
            } catch (error) {
                console.error('[BanContext] Error banning user:', error);
                return false;
            } finally{
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].removeItem(lockKey);
            }
        }
    }["BanProvider.useCallback[banUser]"], [
        bans,
        addBanHistory,
        scheduleExpiration,
        validateBanInput,
        canAdminAct,
        user === null || user === void 0 ? void 0 : user.username
    ]);
    // ---------- Appeals ----------
    const submitAppeal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[submitAppeal]": async (username, appealText, evidence)=>{
            try {
                // Allow the banned user themselves OR an admin acting on their behalf
                const requester = user === null || user === void 0 ? void 0 : user.username;
                const isSelf = requester && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(requester) === (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
                if (!isSelf && !canAdminAct('submitAppeal')) {
                    console.warn('[BanContext] Appeal submission blocked: not the user or admin');
                    return false;
                }
                const cleanUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username;
                const appealValidation = appealTextSchema.safeParse(appealText);
                if (!appealValidation.success) {
                    console.error('[BanContext] Invalid appeal text:', appealValidation.error);
                    return false;
                }
                const cleanAppealText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(appealValidation.data);
                let appealEvidence = [];
                if (evidence && evidence.length > 0) {
                    try {
                        // Only first 3 images
                        const trimmed = evidence.slice(0, 3);
                        appealEvidence = await Promise.all(trimmed.map({
                            "BanProvider.useCallback[submitAppeal]": (f)=>compressImage(f)
                        }["BanProvider.useCallback[submitAppeal]"]));
                    } catch (err) {
                        console.error('[BanContext] Evidence processing failed:', err);
                    }
                }
                setBans({
                    "BanProvider.useCallback[submitAppeal]": (prev)=>prev.map({
                            "BanProvider.useCallback[submitAppeal]": (ban)=>ban.username === cleanUsername && ban.active && ban.appealable ? {
                                    ...ban,
                                    appealSubmitted: true,
                                    appealText: cleanAppealText,
                                    appealDate: new Date().toISOString(),
                                    appealStatus: 'pending',
                                    appealEvidence
                                } : ban
                        }["BanProvider.useCallback[submitAppeal]"])
                }["BanProvider.useCallback[submitAppeal]"]);
                addBanHistory('appeal_submitted', cleanUsername, 'Appeal submitted: "'.concat(cleanAppealText.substring(0, 100)).concat(cleanAppealText.length > 100 ? '...' : '', '"'), cleanUsername, {
                    evidenceCount: appealEvidence.length
                });
                return true;
            } catch (err) {
                console.error('[BanContext] Error submitting appeal:', err);
                return false;
            }
        }
    }["BanProvider.useCallback[submitAppeal]"], [
        addBanHistory,
        canAdminAct,
        user === null || user === void 0 ? void 0 : user.username
    ]);
    const reviewAppeal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[reviewAppeal]": (banId, decision, reviewNotes, adminUsername)=>{
            // Admin-only
            if (!canAdminAct('reviewAppeal')) {
                console.warn('[BanContext] Review appeal blocked: admin privileges required');
                return false;
            }
            try {
                const cleanNotes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reviewNotes);
                const cleanAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(adminUsername || (user === null || user === void 0 ? void 0 : user.username) || 'system');
                const review = {
                    reviewId: Date.now().toString() + Math.random().toString(36).slice(2, 11),
                    banId,
                    reviewerAdmin: cleanAdmin,
                    reviewNotes: cleanNotes,
                    decision,
                    reviewDate: new Date().toISOString(),
                    escalationReason: decision === 'escalate' ? cleanNotes : undefined
                };
                setAppealReviews({
                    "BanProvider.useCallback[reviewAppeal]": (prev)=>[
                            ...prev,
                            review
                        ]
                }["BanProvider.useCallback[reviewAppeal]"]);
                const ban = bans.find({
                    "BanProvider.useCallback[reviewAppeal].ban": (b)=>b.id === banId
                }["BanProvider.useCallback[reviewAppeal].ban"]);
                if (!ban) return false;
                if (decision === 'approve') return approveAppeal(banId, cleanAdmin);
                if (decision === 'reject') return rejectAppeal(banId, cleanAdmin, cleanNotes);
                if (decision === 'escalate') return escalateAppeal(banId, cleanAdmin, cleanNotes);
                return true;
            } catch (err) {
                console.error('[BanContext] Error reviewing appeal:', err);
                return false;
            }
        }
    }["BanProvider.useCallback[reviewAppeal]"], [
        bans,
        canAdminAct,
        user === null || user === void 0 ? void 0 : user.username
    ]);
    const approveAppeal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[approveAppeal]": (banId, adminUsername)=>{
            // Admin-only
            if (!canAdminAct('approveAppeal')) return false;
            try {
                const ban = bans.find({
                    "BanProvider.useCallback[approveAppeal].ban": (b)=>b.id === banId
                }["BanProvider.useCallback[approveAppeal].ban"]);
                if (!ban) return false;
                setBans({
                    "BanProvider.useCallback[approveAppeal]": (prev)=>prev.map({
                            "BanProvider.useCallback[approveAppeal]": (b)=>b.id === banId ? {
                                    ...b,
                                    active: false,
                                    appealStatus: 'approved'
                                } : b
                        }["BanProvider.useCallback[approveAppeal]"])
                }["BanProvider.useCallback[approveAppeal]"]);
                clearExpirationTimer(banId);
                addBanHistory('appeal_approved', ban.username, 'Appeal approved and ban lifted', adminUsername);
                return true;
            } catch (err) {
                console.error('[BanContext] Error approving appeal:', err);
                return false;
            }
        }
    }["BanProvider.useCallback[approveAppeal]"], [
        bans,
        addBanHistory,
        clearExpirationTimer,
        canAdminAct
    ]);
    const rejectAppeal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[rejectAppeal]": (banId, adminUsername, reason)=>{
            // Admin-only
            if (!canAdminAct('rejectAppeal')) return false;
            try {
                const ban = bans.find({
                    "BanProvider.useCallback[rejectAppeal].ban": (b)=>b.id === banId
                }["BanProvider.useCallback[rejectAppeal].ban"]);
                if (!ban) return false;
                setBans({
                    "BanProvider.useCallback[rejectAppeal]": (prev)=>prev.map({
                            "BanProvider.useCallback[rejectAppeal]": (b)=>b.id === banId ? {
                                    ...b,
                                    appealSubmitted: false,
                                    appealText: undefined,
                                    appealable: false,
                                    appealStatus: 'rejected'
                                } : b
                        }["BanProvider.useCallback[rejectAppeal]"])
                }["BanProvider.useCallback[rejectAppeal]"]);
                addBanHistory('appeal_rejected', ban.username, reason || 'Appeal rejected', adminUsername);
                return true;
            } catch (err) {
                console.error('[BanContext] Error rejecting appeal:', err);
                return false;
            }
        }
    }["BanProvider.useCallback[rejectAppeal]"], [
        bans,
        addBanHistory,
        canAdminAct
    ]);
    const escalateAppeal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[escalateAppeal]": (banId, adminUsername, escalationReason)=>{
            // Admin-only
            if (!canAdminAct('escalateAppeal')) return false;
            try {
                const ban = bans.find({
                    "BanProvider.useCallback[escalateAppeal].ban": (b)=>b.id === banId
                }["BanProvider.useCallback[escalateAppeal].ban"]);
                if (!ban) return false;
                setBans({
                    "BanProvider.useCallback[escalateAppeal]": (prev)=>prev.map({
                            "BanProvider.useCallback[escalateAppeal]": (b)=>b.id === banId ? {
                                    ...b,
                                    appealStatus: 'escalated'
                                } : b
                        }["BanProvider.useCallback[escalateAppeal]"])
                }["BanProvider.useCallback[escalateAppeal]"]);
                addBanHistory('appeal_escalated', ban.username, "Appeal escalated: ".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(escalationReason)), adminUsername);
                return true;
            } catch (err) {
                console.error('[BanContext] Error escalating appeal:', err);
                return false;
            }
        }
    }["BanProvider.useCallback[escalateAppeal]"], [
        bans,
        addBanHistory,
        canAdminAct
    ]);
    // ---------- IP banning ----------
    const banUserIP = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[banUserIP]": (username, ipAddress, reason)=>{
            // Admin-only
            if (!canAdminAct('banUserIP')) {
                console.warn('[BanContext] IP ban blocked: admin privileges required');
                return false;
            }
            try {
                const cleanUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username;
                const ipValidation = ipAddressSchema.safeParse(ipAddress);
                if (!ipValidation.success) {
                    console.error('[BanContext] Invalid IP address format');
                    return false;
                }
                const cleanReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reason);
                const ipBan = {
                    ipAddress: ipValidation.data,
                    bannedUsernames: [
                        cleanUsername
                    ],
                    banDate: new Date().toISOString(),
                    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    reason: cleanReason
                };
                setIPBans({
                    "BanProvider.useCallback[banUserIP]": (prev)=>{
                        const existing = prev.find({
                            "BanProvider.useCallback[banUserIP].existing": (b)=>b.ipAddress === ipValidation.data
                        }["BanProvider.useCallback[banUserIP].existing"]);
                        if (existing) {
                            return prev.map({
                                "BanProvider.useCallback[banUserIP]": (b)=>b.ipAddress === ipValidation.data ? {
                                        ...b,
                                        bannedUsernames: [
                                            ...new Set([
                                                ...b.bannedUsernames,
                                                cleanUsername
                                            ])
                                        ]
                                    } : b
                            }["BanProvider.useCallback[banUserIP]"]);
                        }
                        return [
                            ...prev,
                            ipBan
                        ];
                    }
                }["BanProvider.useCallback[banUserIP]"]);
                return true;
            } catch (err) {
                console.error('[BanContext] Error banning IP:', err);
                return false;
            }
        }
    }["BanProvider.useCallback[banUserIP]"], [
        canAdminAct
    ]);
    const isIPBanned = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[isIPBanned]": (ipAddress)=>{
            const now = new Date();
            return ipBans.some({
                "BanProvider.useCallback[isIPBanned]": (ban)=>ban.ipAddress === ipAddress && (!ban.expiryDate || new Date(ban.expiryDate) > now)
            }["BanProvider.useCallback[isIPBanned]"]);
        }
    }["BanProvider.useCallback[isIPBanned]"], [
        ipBans
    ]);
    // ---------- Queries ----------
    const isUserBanned = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[isUserBanned]": (username)=>{
            const cleanUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username;
            const activeBan = bans.find({
                "BanProvider.useCallback[isUserBanned].activeBan": (b)=>b.username === cleanUsername && b.active
            }["BanProvider.useCallback[isUserBanned].activeBan"]);
            if (!activeBan) return null;
            if (activeBan.banType === 'temporary' && activeBan.endTime) {
                const now = new Date();
                const end = new Date(activeBan.endTime);
                if (now >= end) {
                    // Auto unban expired
                    unbanUser(cleanUsername, 'system', 'Temporary ban expired');
                    return null;
                }
                const remainingMs = end.getTime() - now.getTime();
                activeBan.remainingHours = Math.max(0, Math.ceil(remainingMs / 3_600_000));
            }
            return activeBan;
        }
    }["BanProvider.useCallback[isUserBanned]"], [
        bans,
        unbanUser
    ]);
    const getBanInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[getBanInfo]": (username)=>{
            return isUserBanned(username);
        }
    }["BanProvider.useCallback[getBanInfo]"], [
        isUserBanned
    ]);
    const getActiveBans = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[getActiveBans]": ()=>{
            const active = bans.filter({
                "BanProvider.useCallback[getActiveBans].active": (b)=>b.active
            }["BanProvider.useCallback[getActiveBans].active"]).map({
                "BanProvider.useCallback[getActiveBans].active": (b)=>{
                    if (b.banType === 'temporary' && b.endTime) {
                        const now = new Date();
                        const end = new Date(b.endTime);
                        const remainingMs = end.getTime() - now.getTime();
                        b.remainingHours = Math.max(0, Math.ceil(remainingMs / 3_600_000));
                    }
                    return b;
                }
            }["BanProvider.useCallback[getActiveBans].active"]);
            console.log('[BanContext] Getting active bans:', {
                total: bans.length,
                active: active.length,
                usernames: active.map({
                    "BanProvider.useCallback[getActiveBans]": (b)=>b.username
                }["BanProvider.useCallback[getActiveBans]"])
            });
            return active;
        }
    }["BanProvider.useCallback[getActiveBans]"], [
        bans
    ]);
    const getExpiredBans = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[getExpiredBans]": ()=>{
            return bans.filter({
                "BanProvider.useCallback[getExpiredBans]": (b)=>!b.active
            }["BanProvider.useCallback[getExpiredBans]"]);
        }
    }["BanProvider.useCallback[getExpiredBans]"], [
        bans
    ]);
    const getUserBanHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[getUserBanHistory]": (username)=>bans.filter({
                "BanProvider.useCallback[getUserBanHistory]": (b)=>b.username === username
            }["BanProvider.useCallback[getUserBanHistory]"])
    }["BanProvider.useCallback[getUserBanHistory]"], [
        bans
    ]);
    const updateExpiredBans = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[updateExpiredBans]": ()=>{
            const now = new Date();
            let changed = false;
            setBans({
                "BanProvider.useCallback[updateExpiredBans]": (prev)=>prev.map({
                        "BanProvider.useCallback[updateExpiredBans]": (b)=>{
                            if (b.active && b.banType === 'temporary' && b.endTime) {
                                if (now >= new Date(b.endTime)) {
                                    clearExpirationTimer(b.id);
                                    changed = true;
                                    addBanHistory('unbanned', b.username, 'Temporary ban expired automatically', 'system');
                                    return {
                                        ...b,
                                        active: false
                                    };
                                }
                            }
                            return b;
                        }
                    }["BanProvider.useCallback[updateExpiredBans]"])
            }["BanProvider.useCallback[updateExpiredBans]"]);
            if (changed) console.log('[BanContext] Expired bans updated');
        }
    }["BanProvider.useCallback[updateExpiredBans]"], [
        addBanHistory,
        clearExpirationTimer
    ]);
    const getBanStats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "BanProvider.useCallback[getBanStats]": ()=>{
            const active = getActiveBans();
            const now = new Date();
            const hours24Ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const bansByReason = {
                harassment: 0,
                spam: 0,
                inappropriate_content: 0,
                scam: 0,
                underage: 0,
                payment_fraud: 0,
                other: 0
            };
            active.forEach({
                "BanProvider.useCallback[getBanStats]": (b)=>{
                    bansByReason[b.reason]++;
                }
            }["BanProvider.useCallback[getBanStats]"]);
            const allAppeals = bans.filter({
                "BanProvider.useCallback[getBanStats].allAppeals": (b)=>b.appealSubmitted
            }["BanProvider.useCallback[getBanStats].allAppeals"]);
            const appealStats = {
                totalAppeals: allAppeals.length,
                pendingAppeals: allAppeals.filter({
                    "BanProvider.useCallback[getBanStats]": (b)=>b.appealStatus === 'pending'
                }["BanProvider.useCallback[getBanStats]"]).length,
                approvedAppeals: banHistory.filter({
                    "BanProvider.useCallback[getBanStats]": (h)=>h.action === 'appeal_approved'
                }["BanProvider.useCallback[getBanStats]"]).length,
                rejectedAppeals: banHistory.filter({
                    "BanProvider.useCallback[getBanStats]": (h)=>h.action === 'appeal_rejected'
                }["BanProvider.useCallback[getBanStats]"]).length
            };
            const stats = {
                totalActiveBans: active.length,
                temporaryBans: active.filter({
                    "BanProvider.useCallback[getBanStats]": (b)=>b.banType === 'temporary'
                }["BanProvider.useCallback[getBanStats]"]).length,
                permanentBans: active.filter({
                    "BanProvider.useCallback[getBanStats]": (b)=>b.banType === 'permanent'
                }["BanProvider.useCallback[getBanStats]"]).length,
                pendingAppeals: active.filter({
                    "BanProvider.useCallback[getBanStats]": (b)=>b.appealSubmitted && b.appealStatus === 'pending'
                }["BanProvider.useCallback[getBanStats]"]).length,
                recentBans24h: bans.filter({
                    "BanProvider.useCallback[getBanStats]": (b)=>new Date(b.startTime) >= hours24Ago
                }["BanProvider.useCallback[getBanStats]"]).length,
                bansByReason,
                appealStats
            };
            console.log('[BanContext] Ban stats:', stats);
            return stats;
        }
    }["BanProvider.useCallback[getBanStats]"], [
        getActiveBans,
        bans,
        banHistory
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BanContext.Provider, {
        value: {
            bans,
            banHistory,
            appealReviews,
            ipBans,
            banUser,
            unbanUser,
            isUserBanned,
            getBanInfo,
            getActiveBans,
            getExpiredBans,
            getUserBanHistory,
            submitAppeal,
            reviewAppeal,
            approveAppeal,
            rejectAppeal,
            escalateAppeal,
            banUserIP,
            isIPBanned,
            updateExpiredBans,
            scheduleExpiration,
            clearExpirationTimer,
            getBanStats,
            validateBanInput,
            refreshBanData
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/BanContext.tsx",
        lineNumber: 1161,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(BanProvider, "iBFImX4DRJ2hMofSNmnnbYZaE+Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = BanProvider;
const useBans = ()=>{
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(BanContext);
    if (!ctx) {
        throw new Error('useBans must be used within a BanProvider');
    }
    return ctx;
};
_s1(useBans, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "BanProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/WebSocketContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/context/WebSocketContext.tsx
__turbopack_context__.s({
    "WebSocketProvider": ()=>WebSocketProvider,
    "useWebSocket": ()=>useWebSocket
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$websocket$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/websocket.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/websocket.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/environment.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
const WebSocketContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const useWebSocket = ()=>{
    _s();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(WebSocketContext);
    // Return null instead of throwing to allow components to handle missing context gracefully
    return context || null;
};
_s(useWebSocket, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const WebSocketProvider = (param)=>{
    let { children } = param;
    _s1();
    const { user, getAuthToken } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [isConnected, setIsConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [connectionState, setConnectionState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].DISCONNECTED);
    const [typingUsers, setTypingUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Map());
    const [onlineUsers, setOnlineUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [notifications, setNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const typingTimers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    const wsService = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$websocket$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getWebSocketService"])());
    const currentToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const hasInitialized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const pendingSubscriptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]); // Store pending subscriptions
    // Listen for auth token events from AuthContext
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WebSocketProvider.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const handleTokenUpdate = {
                "WebSocketProvider.useEffect.handleTokenUpdate": (event)=>{
                    var _event_detail;
                    const newToken = (_event_detail = event.detail) === null || _event_detail === void 0 ? void 0 : _event_detail.token;
                    console.log('[WebSocket] Auth token updated:', !!newToken);
                    if (newToken !== currentToken.current) {
                        currentToken.current = newToken;
                        // Reconnect with new token if we have a user and WebSocket is enabled
                        if (user && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["websocketConfig"].enabled && wsService.current) {
                            console.log('[WebSocket] Reconnecting with new token...');
                            wsService.current.disconnect();
                            setTimeout({
                                "WebSocketProvider.useEffect.handleTokenUpdate": ()=>{
                                    initializeWebSocket();
                                }
                            }["WebSocketProvider.useEffect.handleTokenUpdate"], 1000);
                        }
                    }
                }
            }["WebSocketProvider.useEffect.handleTokenUpdate"];
            const handleTokenClear = {
                "WebSocketProvider.useEffect.handleTokenClear": ()=>{
                    console.log('[WebSocket] Auth token cleared');
                    currentToken.current = null;
                    // Disconnect WebSocket when token is cleared
                    if (wsService.current) {
                        wsService.current.disconnect();
                    }
                    setIsConnected(false);
                    setConnectionState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].DISCONNECTED);
                    setOnlineUsers(new Set());
                    setTypingUsers(new Map());
                }
            }["WebSocketProvider.useEffect.handleTokenClear"];
            // Listen for auth events from AuthContext
            window.addEventListener('auth-token-updated', handleTokenUpdate);
            window.addEventListener('auth-token-cleared', handleTokenClear);
            return ({
                "WebSocketProvider.useEffect": ()=>{
                    window.removeEventListener('auth-token-updated', handleTokenUpdate);
                    window.removeEventListener('auth-token-cleared', handleTokenClear);
                }
            })["WebSocketProvider.useEffect"];
        }
    }["WebSocketProvider.useEffect"], [
        user
    ]);
    // Improved WebSocket initialization
    const initializeWebSocket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[initializeWebSocket]": async ()=>{
            if (!user || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["websocketConfig"].enabled) {
                console.log('[WebSocket] User not available or WebSocket disabled');
                return undefined;
            }
            // Try multiple ways to get the auth token
            let token = currentToken.current;
            if (!token) {
                token = getAuthToken();
            }
            if (!token && "object" !== 'undefined') {
                token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGlobalAuthToken"])();
            }
            if (!token) {
                console.log('[WebSocket] No auth token available');
                return undefined;
            }
            console.log('[WebSocket] Initializing with token:', !!token);
            currentToken.current = token;
            try {
                // Use WebSocket URL from config
                const wsUrl = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["websocketConfig"].url || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["apiConfig"].baseUrl.replace('/api', '').replace('http', 'ws');
                // Create WebSocket service if it doesn't exist
                if (!wsService.current) {
                    wsService.current = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$websocket$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createWebSocketService"])({
                        url: wsUrl,
                        auth: {
                            token
                        },
                        autoConnect: true,
                        reconnect: true,
                        reconnectAttempts: 5,
                        reconnectDelay: 3000
                    });
                }
                // Subscribe to connection events
                const unsubConnect = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].CONNECT, {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubConnect": ()=>{
                        setIsConnected(true);
                        setConnectionState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].CONNECTED);
                        console.log('[WebSocket] Connected');
                        // Process any pending subscriptions
                        if (pendingSubscriptions.current.length > 0) {
                            console.log('[WebSocket] Processing', pendingSubscriptions.current.length, 'pending subscriptions');
                            const pending = [
                                ...pendingSubscriptions.current
                            ];
                            pendingSubscriptions.current = [];
                            pending.forEach({
                                "WebSocketProvider.useCallback[initializeWebSocket].unsubConnect": (param)=>{
                                    let { event, handler } = param;
                                    if (wsService.current) {
                                        wsService.current.on(event, handler);
                                    }
                                }
                            }["WebSocketProvider.useCallback[initializeWebSocket].unsubConnect"]);
                        }
                        // Send initial online status
                        updateOnlineStatus(true);
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubConnect"]);
                const unsubDisconnect = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].DISCONNECT, {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubDisconnect": ()=>{
                        setIsConnected(false);
                        setConnectionState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].DISCONNECTED);
                        setOnlineUsers(new Set());
                        setTypingUsers(new Map());
                        console.log('[WebSocket] Disconnected');
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubDisconnect"]);
                const unsubError = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].ERROR, {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubError": (error)=>{
                        setConnectionState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].ERROR);
                        console.error('[WebSocket] Error:', error);
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubError"]);
                // Subscribe to app events
                const unsubTyping = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].MESSAGE_TYPING, handleTypingUpdate);
                const unsubUserOnline = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_ONLINE, handleUserOnline);
                const unsubUserOffline = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_OFFLINE, handleUserOffline);
                const unsubNotification = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].NOTIFICATION_NEW, handleNewNotification);
                // Subscribe to message events
                const unsubMessageNew = wsService.current.on('message:new', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubMessageNew": (data)=>{
                        console.log('[WebSocket Context] New message received:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('message:new', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubMessageNew"]);
                const unsubMessageRead = wsService.current.on('message:read', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubMessageRead": (data)=>{
                        console.log('[WebSocket Context] Message read event:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('message:read', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubMessageRead"]);
                // Subscribe to order events
                const unsubOrderCreated = wsService.current.on('order:created', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubOrderCreated": (data)=>{
                        console.log('[WebSocket Context] Order created event received:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('order:created', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubOrderCreated"]);
                const unsubOrderNew = wsService.current.on('order:new', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubOrderNew": (data)=>{
                        console.log('[WebSocket Context] Order new event received:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('order:new', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubOrderNew"]);
                // Subscribe to auction events
                const unsubAuctionWon = wsService.current.on('auction:won', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubAuctionWon": (data)=>{
                        console.log('[WebSocket Context] Auction won event received:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('auction:won', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubAuctionWon"]);
                const unsubAuctionEnded = wsService.current.on('auction:ended', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubAuctionEnded": (data)=>{
                        console.log('[WebSocket Context] Auction ended event received:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('auction:ended', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubAuctionEnded"]);
                const unsubListingSold = wsService.current.on('listing:sold', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubListingSold": (data)=>{
                        console.log('[WebSocket Context] Listing sold event received:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('listing:sold', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubListingSold"]);
                // Subscribe to wallet balance updates
                const unsubWalletUpdate = wsService.current.on('wallet:balance_update', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubWalletUpdate": (data)=>{
                        console.log('[WebSocket Context] Wallet balance update:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('wallet:balance_update', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubWalletUpdate"]);
                const unsubWalletTransaction = wsService.current.on('wallet:transaction', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubWalletTransaction": (data)=>{
                        console.log('[WebSocket Context] Wallet transaction:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('wallet:transaction', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubWalletTransaction"]);
                // Subscribe to notification events
                const unsubNotificationNew = wsService.current.on('notification:new', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubNotificationNew": (data)=>{
                        console.log('[WebSocket Context] New notification:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('notification:new', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubNotificationNew"]);
                const unsubNotificationCleared = wsService.current.on('notification:cleared', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubNotificationCleared": (data)=>{
                        console.log('[WebSocket Context] Notification cleared:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('notification:cleared', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubNotificationCleared"]);
                const unsubNotificationAllCleared = wsService.current.on('notification:all_cleared', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubNotificationAllCleared": (data)=>{
                        console.log('[WebSocket Context] All notifications cleared:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('notification:all_cleared', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubNotificationAllCleared"]);
                const unsubNotificationRestored = wsService.current.on('notification:restored', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubNotificationRestored": (data)=>{
                        console.log('[WebSocket Context] Notification restored:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('notification:restored', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubNotificationRestored"]);
                const unsubNotificationDeleted = wsService.current.on('notification:deleted', {
                    "WebSocketProvider.useCallback[initializeWebSocket].unsubNotificationDeleted": (data)=>{
                        console.log('[WebSocket Context] Notification deleted:', data);
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('notification:deleted', {
                                detail: data
                            }));
                        }
                    }
                }["WebSocketProvider.useCallback[initializeWebSocket].unsubNotificationDeleted"]);
                // Connect
                wsService.current.connect();
                // Store cleanup functions
                return ({
                    "WebSocketProvider.useCallback[initializeWebSocket]": ()=>{
                        unsubConnect();
                        unsubDisconnect();
                        unsubError();
                        unsubTyping();
                        unsubUserOnline();
                        unsubUserOffline();
                        unsubNotification();
                        unsubMessageNew();
                        unsubMessageRead();
                        unsubOrderCreated();
                        unsubOrderNew();
                        unsubAuctionWon();
                        unsubAuctionEnded();
                        unsubListingSold();
                        unsubWalletUpdate();
                        unsubWalletTransaction();
                        unsubNotificationNew();
                        unsubNotificationCleared();
                        unsubNotificationAllCleared();
                        unsubNotificationRestored();
                        unsubNotificationDeleted();
                    }
                })["WebSocketProvider.useCallback[initializeWebSocket]"];
            } catch (error) {
                console.error('[WebSocket] Initialization error:', error);
                setConnectionState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketState"].ERROR);
                return undefined;
            }
        }
    }["WebSocketProvider.useCallback[initializeWebSocket]"], [
        user,
        getAuthToken
    ]);
    // Initialize WebSocket connection when user is available
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WebSocketProvider.useEffect": ()=>{
            var _wsService_current;
            let cleanup;
            const init = {
                "WebSocketProvider.useEffect.init": async ()=>{
                    if (!hasInitialized.current && user && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["websocketConfig"].enabled) {
                        hasInitialized.current = true;
                        cleanup = await initializeWebSocket();
                    }
                }
            }["WebSocketProvider.useEffect.init"];
            if (user && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["websocketConfig"].enabled) {
                init();
            } else if ((_wsService_current = wsService.current) === null || _wsService_current === void 0 ? void 0 : _wsService_current.isConnected()) {
                // Disconnect if no user or WebSocket disabled
                wsService.current.disconnect();
                hasInitialized.current = false;
            }
            return ({
                "WebSocketProvider.useEffect": ()=>{
                    cleanup === null || cleanup === void 0 ? void 0 : cleanup();
                    hasInitialized.current = false;
                }
            })["WebSocketProvider.useEffect"];
        }
    }["WebSocketProvider.useEffect"], [
        user,
        initializeWebSocket
    ]);
    // Cleanup on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WebSocketProvider.useEffect": ()=>{
            return ({
                "WebSocketProvider.useEffect": ()=>{
                    var _wsService_current;
                    typingTimers.current.forEach({
                        "WebSocketProvider.useEffect": (timer)=>clearTimeout(timer)
                    }["WebSocketProvider.useEffect"]);
                    if ((_wsService_current = wsService.current) === null || _wsService_current === void 0 ? void 0 : _wsService_current.isConnected()) {
                        wsService.current.disconnect();
                    }
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$websocket$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["destroyWebSocketService"])();
                }
            })["WebSocketProvider.useEffect"];
        }
    }["WebSocketProvider.useEffect"], []);
    // Handle typing updates
    const handleTypingUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[handleTypingUpdate]": (data)=>{
            const key = "".concat(data.conversationId, "-").concat(data.userId);
            if (data.isTyping) {
                setTypingUsers({
                    "WebSocketProvider.useCallback[handleTypingUpdate]": (prev)=>new Map(prev).set(key, data)
                }["WebSocketProvider.useCallback[handleTypingUpdate]"]);
                // Clear existing timer
                const existingTimer = typingTimers.current.get(key);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                }
                // Set new timer to remove typing indicator after 3 seconds
                const timer = setTimeout({
                    "WebSocketProvider.useCallback[handleTypingUpdate].timer": ()=>{
                        setTypingUsers({
                            "WebSocketProvider.useCallback[handleTypingUpdate].timer": (prev)=>{
                                const newMap = new Map(prev);
                                newMap.delete(key);
                                return newMap;
                            }
                        }["WebSocketProvider.useCallback[handleTypingUpdate].timer"]);
                        typingTimers.current.delete(key);
                    }
                }["WebSocketProvider.useCallback[handleTypingUpdate].timer"], 3000);
                typingTimers.current.set(key, timer);
            } else {
                setTypingUsers({
                    "WebSocketProvider.useCallback[handleTypingUpdate]": (prev)=>{
                        const newMap = new Map(prev);
                        newMap.delete(key);
                        return newMap;
                    }
                }["WebSocketProvider.useCallback[handleTypingUpdate]"]);
                const timer = typingTimers.current.get(key);
                if (timer) {
                    clearTimeout(timer);
                    typingTimers.current.delete(key);
                }
            }
        }
    }["WebSocketProvider.useCallback[handleTypingUpdate]"], []);
    // Handle user online
    const handleUserOnline = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[handleUserOnline]": (data)=>{
            setOnlineUsers({
                "WebSocketProvider.useCallback[handleUserOnline]": (prev)=>new Set(prev).add(data.userId)
            }["WebSocketProvider.useCallback[handleUserOnline]"]);
        }
    }["WebSocketProvider.useCallback[handleUserOnline]"], []);
    // Handle user offline
    const handleUserOffline = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[handleUserOffline]": (data)=>{
            setOnlineUsers({
                "WebSocketProvider.useCallback[handleUserOffline]": (prev)=>{
                    const newSet = new Set(prev);
                    newSet.delete(data.userId);
                    return newSet;
                }
            }["WebSocketProvider.useCallback[handleUserOffline]"]);
        }
    }["WebSocketProvider.useCallback[handleUserOffline]"], []);
    // Handle new notification
    const handleNewNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[handleNewNotification]": (notification)=>{
            setNotifications({
                "WebSocketProvider.useCallback[handleNewNotification]": (prev)=>[
                        notification,
                        ...prev
                    ].slice(0, 50)
            }["WebSocketProvider.useCallback[handleNewNotification]"]); // Keep last 50
        }
    }["WebSocketProvider.useCallback[handleNewNotification]"], []);
    // Public methods
    const connect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[connect]": ()=>{
            var _wsService_current;
            if (!currentToken.current) {
                currentToken.current = getAuthToken() || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getGlobalAuthToken"])();
            }
            (_wsService_current = wsService.current) === null || _wsService_current === void 0 ? void 0 : _wsService_current.connect();
        }
    }["WebSocketProvider.useCallback[connect]"], [
        getAuthToken
    ]);
    const disconnect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[disconnect]": ()=>{
            var _wsService_current;
            (_wsService_current = wsService.current) === null || _wsService_current === void 0 ? void 0 : _wsService_current.disconnect();
        }
    }["WebSocketProvider.useCallback[disconnect]"], []);
    // FIXED: Subscribe method that queues subscriptions if service not ready
    const subscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[subscribe]": (event, handler)=>{
            if (!wsService.current) {
                console.log('[WebSocket] Service not initialized - queueing subscription for:', event);
                // Queue the subscription for later
                pendingSubscriptions.current.push({
                    event,
                    handler
                });
                // Return a cleanup function that removes from pending if not yet processed
                return ({
                    "WebSocketProvider.useCallback[subscribe]": ()=>{
                        const index = pendingSubscriptions.current.findIndex({
                            "WebSocketProvider.useCallback[subscribe].index": (sub)=>sub.event === event && sub.handler === handler
                        }["WebSocketProvider.useCallback[subscribe].index"]);
                        if (index !== -1) {
                            pendingSubscriptions.current.splice(index, 1);
                        }
                    }
                })["WebSocketProvider.useCallback[subscribe]"];
            }
            // Service is ready, subscribe immediately
            return wsService.current.on(event, handler);
        }
    }["WebSocketProvider.useCallback[subscribe]"], []);
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[sendMessage]": (event, data)=>{
            var _wsService_current;
            if (!((_wsService_current = wsService.current) === null || _wsService_current === void 0 ? void 0 : _wsService_current.isConnected())) {
                console.warn('[WebSocket] Not connected, cannot send message');
                return;
            }
            wsService.current.send(event, data);
        }
    }["WebSocketProvider.useCallback[sendMessage]"], []);
    const sendTyping = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[sendTyping]": (conversationId, isTyping)=>{
            if (!user) return;
            sendMessage(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].MESSAGE_TYPING, {
                userId: user.id,
                username: user.username,
                conversationId,
                isTyping
            });
        }
    }["WebSocketProvider.useCallback[sendTyping]"], [
        user,
        sendMessage
    ]);
    const updateOnlineStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[updateOnlineStatus]": (isOnline)=>{
            if (!user) return;
            sendMessage(isOnline ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_ONLINE : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_OFFLINE, {
                userId: user.id,
                isOnline
            });
        }
    }["WebSocketProvider.useCallback[updateOnlineStatus]"], [
        user,
        sendMessage
    ]);
    const markNotificationRead = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[markNotificationRead]": (notificationId)=>{
            setNotifications({
                "WebSocketProvider.useCallback[markNotificationRead]": (prev)=>prev.map({
                        "WebSocketProvider.useCallback[markNotificationRead]": (n)=>n.id === notificationId ? {
                                ...n,
                                read: true
                            } : n
                    }["WebSocketProvider.useCallback[markNotificationRead]"])
            }["WebSocketProvider.useCallback[markNotificationRead]"]);
            sendMessage(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].NOTIFICATION_READ, {
                notificationId
            });
        }
    }["WebSocketProvider.useCallback[markNotificationRead]"], [
        sendMessage
    ]);
    const clearNotifications = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WebSocketProvider.useCallback[clearNotifications]": ()=>{
            setNotifications([]);
        }
    }["WebSocketProvider.useCallback[clearNotifications]"], []);
    const value = {
        isConnected,
        connectionState,
        connect,
        disconnect,
        subscribe,
        sendMessage,
        sendTyping,
        typingUsers,
        onlineUsers,
        updateOnlineStatus,
        notifications,
        markNotificationRead,
        clearNotifications
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WebSocketContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/WebSocketContext.tsx",
        lineNumber: 544,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s1(WebSocketProvider, "mqHA1Lgc0oAj5lKyTh5xgbjg0x4=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = WebSocketProvider;
var _c;
__turbopack_context__.k.register(_c, "WebSocketProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/WalletContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/context/WalletContext.tsx
__turbopack_context__.s({
    "WalletContext": ()=>WalletContext,
    "WalletProvider": ()=>WalletProvider,
    "useWallet": ()=>useWallet
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/websocket.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
;
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
// Debug mode helper
const DEBUG_MODE = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_DEBUG === 'true';
const debugLog = function() {
    for(var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++){
        args[_key] = arguments[_key];
    }
    if (DEBUG_MODE) {
        console.log('[WalletContext]', ...args);
    }
};
// Validation schemas for wallet operations
const walletOperationSchemas = {
    transactionAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().min(0.01).max(100000),
    balanceAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(100000),
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
    reason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(500),
    withdrawalAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().min(10).max(10000),
    tipAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().min(1).max(500),
    depositMethod: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'credit_card',
        'bank_transfer',
        'crypto',
        'admin_credit'
    ])
};
// Enhanced deduplication manager with configurable expiry
class DeduplicationManager {
    startCleanup() {
        this.cleanupInterval = setInterval(()=>{
            const now = Date.now();
            const expiredKeys = [];
            this.processedEvents.forEach((timestamp, key)=>{
                if (now - timestamp > this.expiryMs) {
                    expiredKeys.push(key);
                }
            });
            expiredKeys.forEach((key)=>this.processedEvents.delete(key));
        }, 10000); // Cleanup every 10 seconds
    }
    isDuplicate(eventType, data) {
        // Create composite key based on event type
        let key;
        if (eventType === 'balance_update') {
            key = "".concat(eventType, "_").concat(data.username, "_").concat(data.balance || data.newBalance, "_").concat(data.timestamp || Date.now());
        } else if (eventType === 'transaction') {
            key = "".concat(eventType, "_").concat(data.id || data.transactionId, "_").concat(data.from, "_").concat(data.to, "_").concat(data.amount);
        } else if (eventType === 'order_created') {
            key = "".concat(eventType, "_").concat(data.id || data._id, "_").concat(data.buyer, "_").concat(data.seller);
        } else {
            key = "".concat(eventType, "_").concat(JSON.stringify(data));
        }
        if (this.processedEvents.has(key)) {
            return true;
        }
        this.processedEvents.set(key, Date.now());
        return false;
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.processedEvents.clear();
    }
    constructor(expiryMs = 30000){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "processedEvents", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "cleanupInterval", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "expiryMs", void 0);
        this.expiryMs = expiryMs;
        this.startCleanup();
    }
}
// Helper function to check if user is admin
const isAdminUser = (username)=>{
    return username === 'oakley' || username === 'gerome' || username === 'platform' || username === 'admin';
};
// Transaction throttle manager
class ThrottleManager {
    shouldThrottle(key) {
        let minIntervalMs = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 3000;
        const now = Date.now();
        const lastCall = this.lastCallTimes.get(key) || 0;
        if (now - lastCall < minIntervalMs) {
            return true;
        }
        this.lastCallTimes.set(key, now);
        return false;
    }
    clear() {
        this.lastCallTimes.clear();
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "lastCallTimes", new Map());
    }
}
// Transaction lock manager for preventing race conditions
class TransactionLockManager {
    async acquireLock(key, operation) {
        const existingLock = this.locks.get(key);
        if (existingLock) {
            await existingLock;
        }
        let result;
        const lockPromise = operation().then((res)=>{
            result = res;
            return res;
        }).finally(()=>{
            this.locks.delete(key);
        });
        this.locks.set(key, lockPromise);
        await lockPromise;
        return result;
    }
    isLocked(key) {
        return this.locks.has(key);
    }
    constructor(){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "locks", new Map());
    }
}
const WalletContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function WalletProvider(param) {
    let { children } = param;
    _s();
    const { user, getAuthToken, apiClient } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const webSocketContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"])();
    // Extract properties from WebSocket context safely
    const sendMessage = webSocketContext === null || webSocketContext === void 0 ? void 0 : webSocketContext.sendMessage;
    const subscribe = webSocketContext === null || webSocketContext === void 0 ? void 0 : webSocketContext.subscribe;
    const isConnected = (webSocketContext === null || webSocketContext === void 0 ? void 0 : webSocketContext.isConnected) || false;
    // State management - these will be populated from API
    const [buyerBalances, setBuyerBalancesState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [adminBalance, setAdminBalanceState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [sellerBalances, setSellerBalancesState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [orderHistory, setOrderHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [sellerWithdrawals, setSellerWithdrawals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [adminWithdrawals, setAdminWithdrawals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [adminActions, setAdminActions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [depositLogs, setDepositLogs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [addSellerNotification, setAddSellerNotification] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Loading and initialization state
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isInitialized, setIsInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [initializationError, setInitializationError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Refs
    const initializingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    const rateLimiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])());
    const transactionLock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new TransactionLockManager());
    const deduplicationManager = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new DeduplicationManager(30000)); // 30 second expiry
    const throttleManager = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new ThrottleManager());
    // FIX: Add refs to track last fetched data for deduplication
    const lastFiredBalanceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastPlatformBalanceFetch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastAdminActionsFetch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const setAddSellerNotificationCallback = (fn)=>{
        setAddSellerNotification(()=>fn);
    };
    // Cleanup on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletProvider.useEffect": ()=>{
            return ({
                "WalletProvider.useEffect": ()=>{
                    deduplicationManager.current.destroy();
                    throttleManager.current.clear();
                }
            })["WalletProvider.useEffect"];
        }
    }["WalletProvider.useEffect"], []);
    // FIX: Enhanced fireAdminBalanceUpdateEvent with deduplication
    const fireAdminBalanceUpdateEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[fireAdminBalanceUpdateEvent]": (balance)=>{
            if ("TURBOPACK compile-time truthy", 1) {
                // Deduplicate: Don't fire if same balance was fired within 1 second
                const now = Date.now();
                if (lastFiredBalanceRef.current) {
                    const { balance: lastBalance, timestamp: lastTime } = lastFiredBalanceRef.current;
                    if (lastBalance === balance && now - lastTime < 1000) {
                        debugLog('Skipping duplicate admin balance event:', balance);
                        return;
                    }
                }
                debugLog('Firing admin balance update event:', balance);
                lastFiredBalanceRef.current = {
                    balance,
                    timestamp: now
                };
                window.dispatchEvent(new CustomEvent('wallet:admin-balance-updated', {
                    detail: {
                        balance,
                        timestamp: now
                    }
                }));
            }
        }
    }["WalletProvider.useCallback[fireAdminBalanceUpdateEvent]"], []);
    // Helper function to validate amounts
    const validateTransactionAmount = (amount)=>{
        const validation = walletOperationSchemas.transactionAmount.safeParse(amount);
        if (!validation.success) {
            var _validation_error_errors_;
            throw new Error('Invalid transaction amount: ' + ((_validation_error_errors_ = validation.error.errors[0]) === null || _validation_error_errors_ === void 0 ? void 0 : _validation_error_errors_.message));
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(validation.data);
    };
    const validateUsername = (username)=>{
        const validation = walletOperationSchemas.username.safeParse(username);
        if (!validation.success) {
            var _validation_error_errors_;
            throw new Error('Invalid username: ' + ((_validation_error_errors_ = validation.error.errors[0]) === null || _validation_error_errors_ === void 0 ? void 0 : _validation_error_errors_.message));
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(validation.data);
    };
    // Check rate limit
    const checkRateLimit = (operation, identifier)=>{
        const rateLimitConfig = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"][operation] || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RATE_LIMITS"].API_CALL;
        const result = rateLimiter.current.check(operation, {
            ...rateLimitConfig,
            identifier
        });
        if (!result.allowed) {
            throw new Error("Rate limit exceeded. Please wait ".concat(result.waitTime, " seconds before trying again."));
        }
    };
    // CRITICAL FIX: Fetch actual orders from /orders endpoint
    const fetchOrderHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[fetchOrderHistory]": async (username)=>{
            try {
                debugLog('Fetching orders for:', username);
                // Use the orders endpoint with buyer parameter
                const response = await apiClient.get("/orders?buyer=".concat(username));
                debugLog('Orders response:', response);
                if (response.success && response.data) {
                    // The orders should already be in the correct format
                    setOrderHistory(response.data);
                    debugLog('Order history updated:', response.data.length, 'orders');
                }
            } catch (error) {
                console.error('[WalletContext] Failed to fetch order history:', error);
            }
        }
    }["WalletProvider.useCallback[fetchOrderHistory]"], [
        apiClient
    ]);
    // Also fetch transactions for transaction history (keep this separate)
    const fetchTransactionHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[fetchTransactionHistory]": async (username)=>{
            try {
                debugLog('Fetching transactions for:', username);
                // For admin users, fetch platform transactions
                const queryUsername = isAdminUser(username) ? 'platform' : username;
                const response = await apiClient.get("/wallet/transactions/".concat(queryUsername));
                debugLog('Transactions response:', response);
            // Don't try to convert transactions to orders anymore
            // Transactions and orders are separate things
            } catch (error) {
                console.error('[WalletContext] Failed to fetch transaction history:', error);
            }
        }
    }["WalletProvider.useCallback[fetchTransactionHistory]"], [
        apiClient
    ]);
    // CRITICAL FIX: Fetch admin platform wallet balance with proper throttling
    const fetchAdminPlatformBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[fetchAdminPlatformBalance]": async ()=>{
            if (!user || user.role !== 'admin' && !isAdminUser(user.username)) {
                debugLog('Not admin user, skipping platform balance fetch');
                return 0;
            }
            // CRITICAL FIX: Throttle platform balance fetches to prevent infinite loop
            const now = Date.now();
            if (lastPlatformBalanceFetch.current) {
                const { balance: lastBalance, timestamp: lastTime } = lastPlatformBalanceFetch.current;
                // If we fetched within the last 5 seconds, return cached value
                if (now - lastTime < 5000) {
                    debugLog('Returning cached platform balance (throttled):', lastBalance);
                    return lastBalance;
                }
            }
            // Check if we're already fetching to prevent concurrent calls
            const throttleKey = 'admin_platform_balance_fetch';
            if (throttleManager.current.shouldThrottle(throttleKey, 5000)) {
                debugLog('Platform balance fetch throttled, returning current balance:', adminBalance);
                return adminBalance;
            }
            try {
                console.log('[Wallet] Admin requesting unified platform wallet balance...');
                // Always use the unified endpoint
                const response = await apiClient.get('/wallet/admin-platform-balance');
                debugLog('Unified platform balance response:', response);
                if (response.success && response.data) {
                    const balance = response.data.balance || 0;
                    console.log('[Wallet] Unified platform wallet balance:', balance);
                    // Cache the fetched balance
                    lastPlatformBalanceFetch.current = {
                        balance,
                        timestamp: now
                    };
                    // Only update state if balance actually changed
                    if (balance !== adminBalance) {
                        // Set this as THE admin balance for all admin users
                        setAdminBalanceState(balance);
                        // Fire event with deduplication
                        fireAdminBalanceUpdateEvent(balance);
                    } else {
                        debugLog('Balance unchanged, skipping state update');
                    }
                    return balance;
                }
                console.warn('[Wallet] Platform balance fetch failed:', response.error);
                return adminBalance; // Return current balance on failure
            } catch (error) {
                console.error('[Wallet] Error fetching platform balance:', error);
                return adminBalance; // Return current balance on error
            }
        }
    }["WalletProvider.useCallback[fetchAdminPlatformBalance]"], [
        user,
        apiClient,
        fireAdminBalanceUpdateEvent,
        adminBalance
    ]);
    // CRITICAL FIX: Fetch admin actions from API with throttling
    const fetchAdminActions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[fetchAdminActions]": async ()=>{
            if (!user || user.role !== 'admin' && !isAdminUser(user.username)) {
                debugLog('Not admin user, skipping admin actions fetch');
                return;
            }
            // Throttle admin actions fetch to prevent rapid calls
            const now = Date.now();
            if (now - lastAdminActionsFetch.current < 30000) {
                debugLog('Admin actions fetch throttled');
                return;
            }
            try {
                debugLog('Fetching admin actions...');
                lastAdminActionsFetch.current = now;
                const response = await apiClient.get('/admin/actions?limit=100');
                debugLog('Admin actions response:', response);
                if (response.success && response.data) {
                    // Normalize the admin actions data
                    const normalizedActions = response.data.map({
                        "WalletProvider.useCallback[fetchAdminActions].normalizedActions": (action)=>{
                            var _action_metadata, _action_metadata1, _action_metadata2, _action_metadata3, _action_metadata4;
                            return {
                                id: action._id || action.id,
                                _id: action._id || action.id,
                                type: action.type,
                                amount: action.amount,
                                reason: action.reason,
                                date: action.date,
                                metadata: action.metadata || {},
                                targetUser: ((_action_metadata = action.metadata) === null || _action_metadata === void 0 ? void 0 : _action_metadata.seller) || ((_action_metadata1 = action.metadata) === null || _action_metadata1 === void 0 ? void 0 : _action_metadata1.username),
                                username: ((_action_metadata2 = action.metadata) === null || _action_metadata2 === void 0 ? void 0 : _action_metadata2.seller) || ((_action_metadata3 = action.metadata) === null || _action_metadata3 === void 0 ? void 0 : _action_metadata3.username),
                                adminUser: action.adminUser || 'platform',
                                role: (_action_metadata4 = action.metadata) === null || _action_metadata4 === void 0 ? void 0 : _action_metadata4.role
                            };
                        }
                    }["WalletProvider.useCallback[fetchAdminActions].normalizedActions"]);
                    setAdminActions(normalizedActions);
                    debugLog('Admin actions loaded:', normalizedActions.length);
                } else {
                    console.warn('[WalletContext] Admin actions fetch failed:', response.error);
                }
            } catch (error) {
                console.error('[WalletContext] Error fetching admin actions:', error);
            }
        }
    }["WalletProvider.useCallback[fetchAdminActions]"], [
        user,
        apiClient
    ]);
    // FIXED: Define reloadData BEFORE it's used in other functions
    const reloadData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[reloadData]": async ()=>{
            if (isLoading) {
                debugLog('Already loading, skipping reload');
                return;
            }
            setIsLoading(true);
            try {
                // Note: loadAllData will be defined later, so we need to be careful here
                // For now, we'll just set a flag and handle the actual loading later
                debugLog('Reload data requested');
                // For admin users, also refresh admin actions
                if ((user === null || user === void 0 ? void 0 : user.role) === 'admin' || isAdminUser((user === null || user === void 0 ? void 0 : user.username) || '')) {
                    await fetchAdminActions();
                }
            } finally{
                setIsLoading(false);
            }
        }
    }["WalletProvider.useCallback[reloadData]"], [
        isLoading,
        user,
        fetchAdminActions
    ]);
    // WebSocket event handlers
    const handleWalletBalanceUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[handleWalletBalanceUpdate]": (data)=>{
            debugLog('Received wallet:balance_update:', data);
            // Check for duplicate
            if (deduplicationManager.current.isDuplicate('balance_update', data)) {
                debugLog('Skipping duplicate balance update');
                return;
            }
            // Validate incoming data with security service
            try {
                // Sanitize username
                const sanitizedUsername = data.username ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(data.username) : null;
                if (!sanitizedUsername) {
                    console.error('[WalletContext] Invalid username in balance update');
                    return;
                }
                // FIX: Handle different data structures from WebSocket
                let balanceValue;
                // Check if balance is provided directly
                if (typeof data.balance === 'number') {
                    balanceValue = data.balance;
                } else if (typeof data.newBalance === 'number') {
                    balanceValue = data.newBalance;
                } else if (data.data && typeof data.data.balance === 'number') {
                    balanceValue = data.data.balance;
                } else {
                    console.warn('[WalletContext] No valid balance in update data:', data);
                    balanceValue = 0;
                }
                // Validate balance amount
                const balanceValidation = walletOperationSchemas.balanceAmount.safeParse(balanceValue);
                if (!balanceValidation.success) {
                    console.error('[WalletContext] Invalid balance amount:', balanceValidation.error);
                    return;
                }
                const validatedBalance = balanceValidation.data;
                // Process the balance update based on role
                if (data.role === 'admin' || sanitizedUsername === 'platform' || isAdminUser(sanitizedUsername)) {
                    // Admin balance update - only update if value changed
                    if (user && (user.role === 'admin' || isAdminUser(user.username))) {
                        if (adminBalance !== validatedBalance) {
                            debugLog('Updating admin balance to:', validatedBalance);
                            setAdminBalanceState(validatedBalance);
                            // Fire event for admin balance changes with deduplication
                            fireAdminBalanceUpdateEvent(validatedBalance);
                        }
                    }
                } else if (data.role === 'buyer') {
                    // Update buyer balance
                    setBuyerBalancesState({
                        "WalletProvider.useCallback[handleWalletBalanceUpdate]": (prev)=>({
                                ...prev,
                                [sanitizedUsername]: validatedBalance
                            })
                    }["WalletProvider.useCallback[handleWalletBalanceUpdate]"]);
                    // Fire event if current user
                    if (user && user.username === sanitizedUsername) {
                        window.dispatchEvent(new CustomEvent('wallet:buyer-balance-updated', {
                            detail: {
                                balance: validatedBalance,
                                timestamp: Date.now()
                            }
                        }));
                    }
                } else if (data.role === 'seller') {
                    // Update seller balance
                    setSellerBalancesState({
                        "WalletProvider.useCallback[handleWalletBalanceUpdate]": (prev)=>({
                                ...prev,
                                [sanitizedUsername]: validatedBalance
                            })
                    }["WalletProvider.useCallback[handleWalletBalanceUpdate]"]);
                    // Fire event if current user
                    if (user && user.username === sanitizedUsername) {
                        window.dispatchEvent(new CustomEvent('wallet:seller-balance-updated', {
                            detail: {
                                balance: validatedBalance,
                                timestamp: Date.now()
                            }
                        }));
                    }
                }
            } catch (error) {
                console.error('[WalletContext] Error processing balance update:', error);
            }
        }
    }["WalletProvider.useCallback[handleWalletBalanceUpdate]"], [
        user,
        fireAdminBalanceUpdateEvent,
        adminBalance
    ]);
    const handlePlatformBalanceUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[handlePlatformBalanceUpdate]": (data)=>{
            debugLog('Received platform:balance_update:', data);
            // Check for duplicate
            if (deduplicationManager.current.isDuplicate('platform_balance', data)) {
                debugLog('Skipping duplicate platform balance update');
                return;
            }
            // Handle different data structures
            let balanceValue;
            if (typeof data.balance === 'number') {
                balanceValue = data.balance;
            } else if (typeof data.newBalance === 'number') {
                balanceValue = data.newBalance;
            } else if (data.data && typeof data.data.balance === 'number') {
                balanceValue = data.data.balance;
            } else {
                console.warn('[WalletContext] No valid balance in platform update:', data);
                balanceValue = 0;
            }
            // Validate balance
            const balanceValidation = walletOperationSchemas.balanceAmount.safeParse(balanceValue);
            if (!balanceValidation.success) {
                console.error('[WalletContext] Invalid platform balance:', balanceValidation.error);
                return;
            }
            // If current user is admin, update admin balance only if changed
            if (user && (user.role === 'admin' || isAdminUser(user.username))) {
                const newBalance = balanceValidation.data;
                if (adminBalance !== newBalance) {
                    debugLog('Updating platform balance to:', newBalance);
                    setAdminBalanceState(newBalance);
                    // Fire event with deduplication
                    fireAdminBalanceUpdateEvent(newBalance);
                }
            }
        }
    }["WalletProvider.useCallback[handlePlatformBalanceUpdate]"], [
        user,
        fireAdminBalanceUpdateEvent,
        adminBalance
    ]);
    // CRITICAL: Add handler for order:created events
    const handleOrderCreated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[handleOrderCreated]": (data)=>{
            debugLog('Received order:created event:', data);
            // Check for duplicate
            if (deduplicationManager.current.isDuplicate('order_created', data)) {
                debugLog('Skipping duplicate order created event');
                return;
            }
            const order = data.order || data;
            // Check if this order is for the current user
            if (user && (order.buyer === user.username || order.seller === user.username)) {
                // Reload orders to get the new one
                console.log('[WalletContext] New order for current user, refreshing orders');
                fetchOrderHistory(user.username);
            }
        }
    }["WalletProvider.useCallback[handleOrderCreated]"], [
        user,
        fetchOrderHistory
    ]);
    const handleWalletTransaction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[handleWalletTransaction]": async (data)=>{
            debugLog('Received wallet:transaction:', data);
            // Check for duplicate
            if (deduplicationManager.current.isDuplicate('transaction', data)) {
                debugLog('Skipping duplicate transaction');
                return;
            }
            // Validate transaction data
            try {
                // Sanitize usernames if present
                const sanitizedFrom = data.from ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(data.from) : null;
                const sanitizedTo = data.to ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(data.to) : null;
                // Validate amount if present
                if (data.amount !== undefined) {
                    const amountValidation = walletOperationSchemas.transactionAmount.safeParse(data.amount);
                    if (!amountValidation.success) {
                        console.error('[WalletContext] Invalid transaction amount:', amountValidation.error);
                        return;
                    }
                }
                // If transaction involves current user, refresh their data
                if (user && (sanitizedFrom === user.username || sanitizedTo === user.username)) {
                    if (!throttleManager.current.shouldThrottle('user_data_refresh', 5000)) {
                        // Refresh both transactions and orders
                        await fetchTransactionHistory(user.username);
                        await fetchOrderHistory(user.username);
                    } else {
                        debugLog('Throttled user data refresh');
                    }
                }
                // If transaction involves platform and user is admin, refresh admin data
                if ((sanitizedFrom === 'platform' || sanitizedTo === 'platform') && user && (user.role === 'admin' || isAdminUser(user.username))) {
                    if (!throttleManager.current.shouldThrottle('admin_platform_balance', 3000)) {
                        await fetchAdminPlatformBalance();
                        // Also refresh admin actions to get tier credit updates
                        await fetchAdminActions();
                    } else {
                        debugLog('Throttled admin platform balance refresh');
                    }
                }
            } catch (error) {
                console.error('[WalletContext] Error processing transaction:', error);
            }
        }
    }["WalletProvider.useCallback[handleWalletTransaction]"], [
        user,
        fetchTransactionHistory,
        fetchOrderHistory,
        fetchAdminPlatformBalance,
        fetchAdminActions
    ]);
    // Consolidated WebSocket subscriptions
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletProvider.useEffect": ()=>{
            if (!isConnected || !subscribe) return;
            debugLog('Setting up WebSocket subscriptions for wallet updates');
            // Subscribe to wallet:balance_update events
            const unsubBalance = subscribe('wallet:balance_update', handleWalletBalanceUpdate);
            // Subscribe to platform:balance_update events
            const unsubPlatform = subscribe('platform:balance_update', handlePlatformBalanceUpdate);
            // Subscribe to wallet:transaction events
            const unsubTransaction = subscribe('wallet:transaction', handleWalletTransaction);
            // CRITICAL: Subscribe to order:created events
            const unsubOrderCreated = subscribe('order:created', handleOrderCreated);
            // Cleanup subscriptions
            return ({
                "WalletProvider.useEffect": ()=>{
                    unsubBalance();
                    unsubPlatform();
                    unsubTransaction();
                    unsubOrderCreated();
                }
            })["WalletProvider.useEffect"];
        }
    }["WalletProvider.useEffect"], [
        isConnected,
        subscribe,
        handleWalletBalanceUpdate,
        handlePlatformBalanceUpdate,
        handleWalletTransaction,
        handleOrderCreated
    ]);
    // Listen to custom WebSocket balance updates via events (backward compatibility)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletProvider.useEffect": ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            const handleBalanceUpdate = {
                "WalletProvider.useEffect.handleBalanceUpdate": (event)=>{
                    const data = event.detail;
                    debugLog('Received custom balance update event:', data);
                    handleWalletBalanceUpdate(data);
                }
            }["WalletProvider.useEffect.handleBalanceUpdate"];
            const handleTransaction = {
                "WalletProvider.useEffect.handleTransaction": (event)=>{
                    debugLog('Received custom transaction event:', event.detail);
                    handleWalletTransaction(event.detail);
                }
            }["WalletProvider.useEffect.handleTransaction"];
            const handleOrderEvent = {
                "WalletProvider.useEffect.handleOrderEvent": (event)=>{
                    debugLog('Received custom order event:', event.detail);
                    handleOrderCreated(event.detail);
                }
            }["WalletProvider.useEffect.handleOrderEvent"];
            // Listen for custom events from other components
            window.addEventListener('wallet:balance_update', handleBalanceUpdate);
            window.addEventListener('wallet:transaction', handleTransaction);
            window.addEventListener('order:created', handleOrderEvent);
            return ({
                "WalletProvider.useEffect": ()=>{
                    window.removeEventListener('wallet:balance_update', handleBalanceUpdate);
                    window.removeEventListener('wallet:transaction', handleTransaction);
                    window.removeEventListener('order:created', handleOrderEvent);
                }
            })["WalletProvider.useEffect"];
        }
    }["WalletProvider.useEffect"], [
        handleWalletBalanceUpdate,
        handleWalletTransaction,
        handleOrderCreated
    ]);
    // Helper to emit wallet balance updates
    const emitBalanceUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[emitBalanceUpdate]": (username, role, balance)=>{
            if (isConnected && sendMessage) {
                sendMessage(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].WALLET_BALANCE_UPDATE, {
                    username,
                    role,
                    balance,
                    timestamp: Date.now()
                });
            }
        }
    }["WalletProvider.useCallback[emitBalanceUpdate]"], [
        isConnected,
        sendMessage
    ]);
    // Send tip function
    const sendTip = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[sendTip]": async (fromUsername, toUsername, amount, message)=>{
            try {
                var _response_data_transaction, _response_data, _response_data_transaction1, _response_data1;
                checkRateLimit('TIP', fromUsername);
                // Input validation
                if (!fromUsername || !toUsername || amount <= 0) {
                    console.error('[Wallet] Invalid tip parameters');
                    return false;
                }
                // Validate and sanitize inputs
                const validatedFrom = validateUsername(fromUsername);
                const validatedTo = validateUsername(toUsername);
                const validatedAmount = validateTransactionAmount(amount);
                // Additional tip-specific validation
                const tipValidation = walletOperationSchemas.tipAmount.safeParse(validatedAmount);
                if (!tipValidation.success) {
                    console.error('[Wallet] Invalid tip amount:', tipValidation.error);
                    return false;
                }
                // Check balance locally first
                const senderBalance = buyerBalances[validatedFrom] || 0;
                if (senderBalance < validatedAmount) {
                    console.error('[Wallet] Insufficient balance for tip');
                    return false;
                }
                // Send tip to backend
                const response = await apiClient.post('/tips/send', {
                    amount: validatedAmount,
                    recipientUsername: validatedTo,
                    message: message ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(message) : undefined
                });
                if (!response.success) {
                    console.error('[Wallet] Tip failed:', response.error);
                    return false;
                }
                // Update local state optimistically
                setBuyerBalancesState({
                    "WalletProvider.useCallback[sendTip]": (prev)=>({
                            ...prev,
                            [validatedFrom]: prev[validatedFrom] - validatedAmount
                        })
                }["WalletProvider.useCallback[sendTip]"]);
                setSellerBalancesState({
                    "WalletProvider.useCallback[sendTip]": (prev)=>({
                            ...prev,
                            [validatedTo]: (prev[validatedTo] || 0) + validatedAmount
                        })
                }["WalletProvider.useCallback[sendTip]"]);
                // Emit balance updates
                emitBalanceUpdate(validatedFrom, 'buyer', senderBalance - validatedAmount);
                emitBalanceUpdate(validatedTo, 'seller', (sellerBalances[validatedTo] || 0) + validatedAmount);
                // Log the transaction locally
                const tipLog = {
                    id: ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : (_response_data_transaction = _response_data.transaction) === null || _response_data_transaction === void 0 ? void 0 : _response_data_transaction.id) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    username: validatedFrom,
                    amount: validatedAmount,
                    method: 'credit_card',
                    date: new Date().toISOString(),
                    status: 'completed',
                    transactionId: ((_response_data1 = response.data) === null || _response_data1 === void 0 ? void 0 : (_response_data_transaction1 = _response_data1.transaction) === null || _response_data_transaction1 === void 0 ? void 0 : _response_data_transaction1.id) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    notes: "Tip to ".concat(validatedTo)
                };
                setDepositLogs({
                    "WalletProvider.useCallback[sendTip]": (prev)=>[
                            ...prev,
                            tipLog
                        ]
                }["WalletProvider.useCallback[sendTip]"]);
                debugLog("[Wallet] Tip sent: $".concat(validatedAmount, " from ").concat(validatedFrom, " to ").concat(validatedTo));
                return true;
            } catch (error) {
                console.error('[Wallet] Error sending tip:', error);
                return false;
            }
        }
    }["WalletProvider.useCallback[sendTip]"], [
        buyerBalances,
        sellerBalances,
        apiClient,
        emitBalanceUpdate
    ]);
    // Fetch balance from API
    const fetchBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[fetchBalance]": async (username)=>{
            try {
                debugLog('Fetching balance for:', username);
                // For admin users, always fetch platform wallet
                if (isAdminUser(username)) {
                    debugLog('Admin user detected, fetching unified platform wallet');
                    const response = await apiClient.get('/wallet/admin-platform-balance');
                    if (response.success && response.data) {
                        const balance = response.data.balance || 0;
                        debugLog('Unified platform wallet balance:', balance);
                        return balance;
                    }
                    console.warn('[WalletContext] Platform balance fetch failed:', response.error);
                    return 0;
                }
                // For regular users, fetch their individual wallet
                const response = await apiClient.get("/wallet/balance/".concat(username));
                debugLog('Balance response:', response);
                if (response.success && response.data) {
                    return response.data.balance || 0;
                }
                console.warn('[WalletContext] Balance fetch failed:', response.error);
                return 0;
            } catch (error) {
                console.error("[WalletContext] Failed to fetch balance for ".concat(username, ":"), error);
                return 0;
            }
        }
    }["WalletProvider.useCallback[fetchBalance]"], [
        apiClient
    ]);
    // Get platform transactions
    const getPlatformTransactions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[getPlatformTransactions]": async function() {
            let limit = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 100, page = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1;
            if (!user || user.role !== 'admin' && !isAdminUser(user.username)) {
                debugLog('Not admin user, skipping platform transactions fetch');
                return [];
            }
            try {
                debugLog('Fetching platform transactions...');
                const response = await apiClient.get("/wallet/platform-transactions?limit=".concat(limit, "&page=").concat(page));
                debugLog('Platform transactions response:', response);
                if (response.success && response.data) {
                    return response.data;
                }
                console.warn('[WalletContext] Platform transactions fetch failed:', response.error);
                return [];
            } catch (error) {
                console.error('[WalletContext] Error fetching platform transactions:', error);
                return [];
            }
        }
    }["WalletProvider.useCallback[getPlatformTransactions]"], [
        user,
        apiClient
    ]);
    // Fetch complete admin analytics data
    const fetchAdminAnalytics = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[fetchAdminAnalytics]": async function() {
            let timeFilter = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'all';
            if (!user || user.role !== 'admin' && !isAdminUser(user.username)) {
                debugLog('Not admin user, skipping analytics fetch');
                return null;
            }
            try {
                debugLog('Fetching admin analytics data with filter:', timeFilter);
                const response = await apiClient.get("/wallet/admin/analytics?timeFilter=".concat(timeFilter));
                debugLog('Admin analytics response:', response);
                if (response.success && response.data) {
                    const data = response.data;
                    // Update all the state variables with the fetched data
                    // IMPORTANT: Admin balance is the unified platform wallet balance
                    if (data.adminBalance !== adminBalance) {
                        setAdminBalanceState(data.adminBalance);
                        fireAdminBalanceUpdateEvent(data.adminBalance);
                    }
                    setOrderHistory(data.orderHistory);
                    setDepositLogs(data.depositLogs);
                    setSellerWithdrawals(data.sellerWithdrawals);
                    setAdminWithdrawals(data.adminWithdrawals);
                    // If adminActions are included in the response, use them
                    // Otherwise, fetch them separately
                    if (data.adminActions && data.adminActions.length > 0) {
                        setAdminActions(data.adminActions);
                    } else {
                        // Fetch admin actions separately if not included
                        await fetchAdminActions();
                    }
                    // Update wallet balances
                    if (data.wallet) {
                        Object.entries(data.wallet).forEach({
                            "WalletProvider.useCallback[fetchAdminAnalytics]": (param)=>{
                                let [username, balance] = param;
                                if (data.users[username]) {
                                    const userRole = data.users[username].role;
                                    // Skip admin users as they use unified balance
                                    if (userRole === 'admin' || isAdminUser(username)) {
                                        // Don't set individual balances for admin users
                                        return;
                                    } else if (userRole === 'buyer') {
                                        setBuyerBalancesState({
                                            "WalletProvider.useCallback[fetchAdminAnalytics]": (prev)=>({
                                                    ...prev,
                                                    [username]: balance
                                                })
                                        }["WalletProvider.useCallback[fetchAdminAnalytics]"]);
                                    } else if (userRole === 'seller') {
                                        setSellerBalancesState({
                                            "WalletProvider.useCallback[fetchAdminAnalytics]": (prev)=>({
                                                    ...prev,
                                                    [username]: balance
                                                })
                                        }["WalletProvider.useCallback[fetchAdminAnalytics]"]);
                                    }
                                }
                            }
                        }["WalletProvider.useCallback[fetchAdminAnalytics]"]);
                    }
                    debugLog('Analytics data loaded:', {
                        adminBalance: data.adminBalance,
                        orders: data.orderHistory.length,
                        deposits: data.depositLogs.length,
                        adminActions: adminActions.length,
                        summary: data.summary
                    });
                    return data;
                }
                console.warn('[WalletContext] Analytics fetch failed:', response.error);
                return null;
            } catch (error) {
                console.error('[WalletContext] Error fetching analytics:', error);
                return null;
            }
        }
    }["WalletProvider.useCallback[fetchAdminAnalytics]"], [
        user,
        apiClient,
        fireAdminBalanceUpdateEvent,
        fetchAdminActions,
        adminActions.length,
        adminBalance
    ]);
    // Get analytics data with time filter
    const getAnalyticsData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[getAnalyticsData]": async function() {
            let timeFilter = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : 'all';
            if (!user || user.role !== 'admin' && !isAdminUser(user.username)) {
                debugLog('Not admin, cannot get analytics');
                return null;
            }
            return await fetchAdminAnalytics(timeFilter);
        }
    }["WalletProvider.useCallback[getAnalyticsData]"], [
        user,
        fetchAdminAnalytics
    ]);
    // Load all data from API with admin analytics support
    const loadAllData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[loadAllData]": async ()=>{
            if (!user) {
                debugLog('No user, skipping data load');
                return false;
            }
            try {
                debugLog('Loading wallet data from API for user:', user.username);
                // For admin users, always fetch unified platform wallet
                if (user.role === 'admin' || isAdminUser(user.username)) {
                    debugLog('Admin detected - fetching unified platform wallet...');
                    // Fetch unified platform balance
                    const platformBalance = await fetchAdminPlatformBalance();
                    // Fetch admin actions for tier credit tracking
                    await fetchAdminActions();
                    // Also fetch analytics data if needed
                    const analyticsData = await fetchAdminAnalytics('all');
                    if (analyticsData) {
                        // Override the admin balance with unified platform balance
                        if (platformBalance !== adminBalance) {
                            setAdminBalanceState(platformBalance);
                            fireAdminBalanceUpdateEvent(platformBalance);
                        }
                        debugLog('Admin analytics loaded with unified balance:', platformBalance);
                    }
                    return true;
                }
                // For non-admin users, fetch regular wallet data
                const balance = await fetchBalance(user.username);
                debugLog('Fetched balance:', balance, 'for role:', user.role);
                if (user.role === 'buyer') {
                    setBuyerBalancesState({
                        "WalletProvider.useCallback[loadAllData]": (prev)=>({
                                ...prev,
                                [user.username]: balance
                            })
                    }["WalletProvider.useCallback[loadAllData]"]);
                } else if (user.role === 'seller') {
                    setSellerBalancesState({
                        "WalletProvider.useCallback[loadAllData]": (prev)=>({
                                ...prev,
                                [user.username]: balance
                            })
                    }["WalletProvider.useCallback[loadAllData]"]);
                }
                // CRITICAL: Fetch actual orders, not transactions
                await fetchOrderHistory(user.username);
                // Also fetch transaction history for reference
                await fetchTransactionHistory(user.username);
                debugLog('Data loaded successfully');
                return true;
            } catch (error) {
                console.error('[WalletContext] Error loading wallet data:', error);
                setInitializationError('Failed to load wallet data');
                return false;
            }
        }
    }["WalletProvider.useCallback[loadAllData]"], [
        user,
        fetchBalance,
        fetchAdminPlatformBalance,
        fetchAdminAnalytics,
        fetchOrderHistory,
        fetchTransactionHistory,
        fireAdminBalanceUpdateEvent,
        fetchAdminActions,
        adminBalance
    ]);
    // CRITICAL FIX: Refresh admin data with proper throttling
    const refreshAdminData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[refreshAdminData]": async ()=>{
            if (!user || user.role !== 'admin' && !isAdminUser(user.username)) {
                debugLog('Not admin, skipping admin data refresh');
                return;
            }
            // Add throttling to prevent rapid refreshes
            if (throttleManager.current.shouldThrottle('refresh_admin_data', 10000)) {
                debugLog('Admin data refresh throttled');
                return;
            }
            try {
                debugLog('Refreshing admin data...');
                // Fetch unified platform balance (now properly throttled)
                const platformBalance = await fetchAdminPlatformBalance();
                // Fetch admin actions (only if needed)
                if (!throttleManager.current.shouldThrottle('fetch_admin_actions', 30000)) {
                    await fetchAdminActions();
                }
                // Only fetch analytics if significant time has passed
                if (!throttleManager.current.shouldThrottle('fetch_analytics', 60000)) {
                    const analyticsData = await fetchAdminAnalytics('all');
                    if (analyticsData && analyticsData.adminBalance !== platformBalance) {
                        // Ensure unified balance is used
                        setAdminBalanceState(platformBalance);
                        fireAdminBalanceUpdateEvent(platformBalance);
                    }
                    debugLog('Admin data refreshed with unified balance:', platformBalance);
                }
            } catch (error) {
                console.error('[WalletContext] Error refreshing admin data:', error);
            }
        }
    }["WalletProvider.useCallback[refreshAdminData]"], [
        user,
        fetchAdminPlatformBalance,
        fetchAdminAnalytics,
        fireAdminBalanceUpdateEvent,
        fetchAdminActions
    ]);
    // Initialize wallet when user logs in
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WalletProvider.useEffect": ()=>{
            const initializeWallet = {
                "WalletProvider.useEffect.initializeWallet": async ()=>{
                    if (initializingRef.current || !user) {
                        return;
                    }
                    initializingRef.current = true;
                    setIsLoading(true);
                    setInitializationError(null);
                    try {
                        debugLog('Initializing wallet for user:', user.username);
                        const loadSuccess = await loadAllData();
                        if (loadSuccess) {
                            setIsInitialized(true);
                            debugLog('Wallet initialization complete');
                        }
                    } catch (error) {
                        console.error('[WalletContext] Initialization error:', error);
                        setInitializationError(error instanceof Error ? error.message : 'Unknown error');
                    } finally{
                        setIsLoading(false);
                        initializingRef.current = false;
                    }
                }
            }["WalletProvider.useEffect.initializeWallet"];
            if (user) {
                initializeWallet();
            } else {
                // Clear wallet data when user logs out
                setBuyerBalancesState({});
                setSellerBalancesState({});
                setAdminBalanceState(0);
                setOrderHistory([]);
                setIsInitialized(false);
                deduplicationManager.current.destroy();
                deduplicationManager.current = new DeduplicationManager(30000);
                throttleManager.current.clear();
                lastPlatformBalanceFetch.current = null;
                lastFiredBalanceRef.current = null;
                lastAdminActionsFetch.current = 0;
            }
        }
    }["WalletProvider.useEffect"], [
        user,
        loadAllData
    ]);
    // Balance getters (from cached state)
    const getBuyerBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[getBuyerBalance]": (username)=>{
            try {
                const validatedUsername = validateUsername(username);
                // Admin users don't have buyer balances
                if (isAdminUser(validatedUsername)) {
                    return 0;
                }
                return buyerBalances[validatedUsername] || 0;
            } catch (e) {
                return 0;
            }
        }
    }["WalletProvider.useCallback[getBuyerBalance]"], [
        buyerBalances
    ]);
    const getSellerBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[getSellerBalance]": (seller)=>{
            try {
                const validatedSeller = validateUsername(seller);
                // Admin users don't have seller balances
                if (isAdminUser(validatedSeller)) {
                    return 0;
                }
                return sellerBalances[validatedSeller] || 0;
            } catch (e) {
                return 0;
            }
        }
    }["WalletProvider.useCallback[getSellerBalance]"], [
        sellerBalances
    ]);
    // Balance setters (update cache and call API)
    const setBuyerBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[setBuyerBalance]": async (username, balance)=>{
            // Don't set buyer balance for admin users
            if (isAdminUser(username)) {
                debugLog('Skipping buyer balance update for admin user');
                return;
            }
            const validatedUsername = validateUsername(username);
            // Update local cache immediately
            setBuyerBalancesState({
                "WalletProvider.useCallback[setBuyerBalance]": (prev)=>({
                        ...prev,
                        [validatedUsername]: balance
                    })
            }["WalletProvider.useCallback[setBuyerBalance]"]);
            // Emit WebSocket update
            emitBalanceUpdate(validatedUsername, 'buyer', balance);
        }
    }["WalletProvider.useCallback[setBuyerBalance]"], [
        emitBalanceUpdate
    ]);
    const setSellerBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[setSellerBalance]": async (seller, balance)=>{
            // Don't set seller balance for admin users
            if (isAdminUser(seller)) {
                debugLog('Skipping seller balance update for admin user');
                return;
            }
            const validatedSeller = validateUsername(seller);
            // Update local cache immediately
            setSellerBalancesState({
                "WalletProvider.useCallback[setSellerBalance]": (prev)=>({
                        ...prev,
                        [validatedSeller]: balance
                    })
            }["WalletProvider.useCallback[setSellerBalance]"]);
            // Emit WebSocket update
            emitBalanceUpdate(validatedSeller, 'seller', balance);
        }
    }["WalletProvider.useCallback[setSellerBalance]"], [
        emitBalanceUpdate
    ]);
    const setAdminBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[setAdminBalance]": async (balance)=>{
            // Only update if changed
            if (adminBalance !== balance) {
                setAdminBalanceState(balance);
                fireAdminBalanceUpdateEvent(balance);
                // Emit WebSocket update for platform wallet
                emitBalanceUpdate('platform', 'admin', balance);
            }
        }
    }["WalletProvider.useCallback[setAdminBalance]"], [
        emitBalanceUpdate,
        fireAdminBalanceUpdateEvent,
        adminBalance
    ]);
    // Create order via API
    const addOrder = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[addOrder]": async (order)=>{
            try {
                debugLog('Creating order via API:', order);
                const orderPayload = {
                    title: order.title,
                    description: order.description,
                    price: order.price,
                    markedUpPrice: order.markedUpPrice,
                    seller: order.seller,
                    buyer: order.buyer,
                    tags: order.tags || [],
                    wasAuction: order.wasAuction || false,
                    imageUrl: order.imageUrl,
                    listingId: order.listingId,
                    deliveryAddress: order.deliveryAddress || {
                        fullName: 'John Doe',
                        addressLine1: '123 Main St',
                        city: 'New York',
                        state: 'NY',
                        postalCode: '10001',
                        country: 'US'
                    }
                };
                debugLog('Order payload:', orderPayload);
                const response = await apiClient.post('/orders', orderPayload);
                debugLog('Order creation response:', response);
                if (response.success && response.data) {
                    // Include tier information in the order
                    const orderWithTier = {
                        ...response.data,
                        sellerTier: response.data.sellerTier,
                        tierCreditAmount: response.data.tierCreditAmount || 0
                    };
                    setOrderHistory({
                        "WalletProvider.useCallback[addOrder]": (prev)=>[
                                ...prev,
                                orderWithTier
                            ]
                    }["WalletProvider.useCallback[addOrder]"]);
                    // Only fetch current user's balance after order creation
                    if (user === null || user === void 0 ? void 0 : user.username) {
                        const newBalance = await fetchBalance(user.username);
                        if (user.role === 'buyer') {
                            setBuyerBalancesState({
                                "WalletProvider.useCallback[addOrder]": (prev)=>({
                                        ...prev,
                                        [user.username]: newBalance
                                    })
                            }["WalletProvider.useCallback[addOrder]"]);
                        } else if (user.role === 'seller') {
                            setSellerBalancesState({
                                "WalletProvider.useCallback[addOrder]": (prev)=>({
                                        ...prev,
                                        [user.username]: newBalance
                                    })
                            }["WalletProvider.useCallback[addOrder]"]);
                        } else if (user.role === 'admin' || isAdminUser(user.username)) {
                            // For admin users, refresh platform balance AND admin actions
                            await refreshAdminData();
                        }
                    }
                    // If current user is admin, refresh admin actions to get tier credits
                    if ((user === null || user === void 0 ? void 0 : user.role) === 'admin' || isAdminUser((user === null || user === void 0 ? void 0 : user.username) || '')) {
                        await fetchAdminActions();
                    }
                    // Refresh order history for current user only
                    if (user === null || user === void 0 ? void 0 : user.username) {
                        if (!throttleManager.current.shouldThrottle('order_refresh', 3000)) {
                            await fetchOrderHistory(user.username);
                        }
                    }
                    debugLog('Order created and balance updated');
                } else {
                    var _response_error;
                    const errorMessage = ((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || response.error || 'Order creation failed';
                    console.error('[WalletContext] Order creation failed:', errorMessage);
                    throw new Error(errorMessage);
                }
            } catch (error) {
                console.error('[WalletContext] Failed to create order:', error);
                throw error;
            }
        }
    }["WalletProvider.useCallback[addOrder]"], [
        apiClient,
        fetchBalance,
        fetchOrderHistory,
        refreshAdminData,
        user,
        fetchAdminActions
    ]);
    // UPDATED: Purchase custom request implementation
    const purchaseCustomRequest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[purchaseCustomRequest]": async (request)=>{
            console.log('[WalletContext] Processing custom request purchase:', request);
            try {
                var _request_metadata, _request_metadata1;
                debugLog('Processing custom request via API:', {
                    requestId: request.requestId,
                    buyer: request.buyer,
                    seller: request.seller,
                    amount: request.amount
                });
                // Prepare the request data for the backend
                const orderRequest = {
                    requestId: request.requestId,
                    title: request.description || 'Custom Request',
                    description: ((_request_metadata = request.metadata) === null || _request_metadata === void 0 ? void 0 : _request_metadata.description) || request.description,
                    price: request.amount,
                    seller: request.seller,
                    buyer: request.buyer,
                    tags: ((_request_metadata1 = request.metadata) === null || _request_metadata1 === void 0 ? void 0 : _request_metadata1.tags) || [],
                    deliveryAddress: undefined // Will be added later by buyer
                };
                debugLog('Calling custom request endpoint with:', orderRequest);
                // Call the new custom request endpoint
                const response = await apiClient.post('/orders/custom-request', orderRequest);
                debugLog('Custom request order response:', response);
                if (response.success && response.data) {
                    console.log('[WalletContext] Custom request order created successfully:', response.data.id);
                    // Add to order history
                    const orderWithDetails = {
                        ...response.data,
                        isCustomRequest: true,
                        originalRequestId: request.requestId
                    };
                    setOrderHistory({
                        "WalletProvider.useCallback[purchaseCustomRequest]": (prev)=>[
                                ...prev,
                                orderWithDetails
                            ]
                    }["WalletProvider.useCallback[purchaseCustomRequest]"]);
                    // Now update reloadData to use loadAllData
                    await loadAllData();
                    // Dispatch event for other components to react
                    window.dispatchEvent(new CustomEvent('custom_request:paid', {
                        detail: {
                            requestId: request.requestId,
                            orderId: response.data.id,
                            buyer: request.buyer,
                            seller: request.seller,
                            amount: request.amount
                        }
                    }));
                    // If notification callback is set, notify seller
                    if (addSellerNotification) {
                        addSellerNotification(request.seller, '💰 Custom request "'.concat(request.description, '" has been paid! Check your orders to fulfill.'));
                    }
                    return true;
                } else {
                    var _response_error_message, _response_error;
                    console.error('[WalletContext] Failed to create custom request order:', response.error);
                    // Check if it's an insufficient balance error
                    if ((_response_error = response.error) === null || _response_error === void 0 ? void 0 : (_response_error_message = _response_error.message) === null || _response_error_message === void 0 ? void 0 : _response_error_message.includes('Insufficient balance')) {
                        throw new Error(response.error.message);
                    }
                    return false;
                }
            } catch (error) {
                console.error('[WalletContext] Error processing custom request purchase:', error);
                // Re-throw errors with message for UI to handle
                if (error instanceof Error) {
                    throw error;
                }
                throw new Error('Failed to process custom request payment');
            }
        }
    }["WalletProvider.useCallback[purchaseCustomRequest]"], [
        apiClient,
        loadAllData,
        addSellerNotification
    ]);
    // Make a deposit via API
    const addDeposit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[addDeposit]": async (username, amount, method, notes)=>{
            try {
                checkRateLimit('DEPOSIT', username);
                const validatedUsername = validateUsername(username);
                const validatedAmount = validateTransactionAmount(amount);
                debugLog('Processing deposit via API:', {
                    username: validatedUsername,
                    amount: validatedAmount,
                    method,
                    authUser: user === null || user === void 0 ? void 0 : user.username
                });
                const response = await apiClient.post('/wallet/deposit', {
                    amount: validatedAmount,
                    method,
                    notes
                });
                debugLog('Deposit response:', response);
                if (response.success) {
                    var _response_data, _response_data1, _response_data2;
                    // Wait a moment for the transaction to be processed
                    await new Promise({
                        "WalletProvider.useCallback[addDeposit]": (resolve)=>setTimeout(resolve, 500)
                    }["WalletProvider.useCallback[addDeposit]"]);
                    // Refresh balance after deposit
                    const newBalance = await fetchBalance(validatedUsername);
                    debugLog('New balance after deposit:', newBalance);
                    if (!isAdminUser(validatedUsername)) {
                        setBuyerBalancesState({
                            "WalletProvider.useCallback[addDeposit]": (prev)=>({
                                    ...prev,
                                    [validatedUsername]: newBalance
                                })
                        }["WalletProvider.useCallback[addDeposit]"]);
                    }
                    // Add to local deposit logs
                    const depositLog = {
                        id: ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.id) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                        username: validatedUsername,
                        amount: validatedAmount,
                        method,
                        date: ((_response_data1 = response.data) === null || _response_data1 === void 0 ? void 0 : _response_data1.createdAt) || new Date().toISOString(),
                        status: 'completed',
                        transactionId: ((_response_data2 = response.data) === null || _response_data2 === void 0 ? void 0 : _response_data2.id) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                        notes
                    };
                    setDepositLogs({
                        "WalletProvider.useCallback[addDeposit]": (prev)=>[
                                ...prev,
                                depositLog
                            ]
                    }["WalletProvider.useCallback[addDeposit]"]);
                    // Emit WebSocket event for real-time update
                    if (!isAdminUser(validatedUsername)) {
                        emitBalanceUpdate(validatedUsername, 'buyer', newBalance);
                    }
                    debugLog('Deposit successful');
                    return true;
                } else {
                    var _response_error;
                    console.error('[WalletContext] Deposit failed:', response.error);
                    if ((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) {
                        throw new Error(response.error.message);
                    }
                    return false;
                }
            } catch (error) {
                console.error('[WalletContext] Error processing deposit:', error);
                throw error;
            }
        }
    }["WalletProvider.useCallback[addDeposit]"], [
        apiClient,
        fetchBalance,
        emitBalanceUpdate,
        user
    ]);
    // Purchase listing with proper error handling
    const purchaseListing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[purchaseListing]": async (listing, buyerUsername)=>{
            try {
                var _listing_imageUrls;
                checkRateLimit('API_CALL', buyerUsername);
                const validatedBuyer = validateUsername(buyerUsername);
                const validatedSeller = validateUsername(listing.seller);
                // Validate price with security service
                const priceValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAmount(listing.price, {
                    min: 0.01,
                    max: 100000
                });
                if (!priceValidation.valid) {
                    throw new Error(priceValidation.error || 'Invalid listing price');
                }
                debugLog('Processing purchase:', {
                    buyer: validatedBuyer,
                    seller: validatedSeller,
                    listing: listing.title,
                    price: listing.price,
                    markedUpPrice: listing.markedUpPrice
                });
                await addOrder({
                    id: listing.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    title: listing.title,
                    description: listing.description,
                    price: listing.price,
                    markedUpPrice: listing.markedUpPrice || listing.price,
                    seller: validatedSeller,
                    buyer: validatedBuyer,
                    imageUrl: (_listing_imageUrls = listing.imageUrls) === null || _listing_imageUrls === void 0 ? void 0 : _listing_imageUrls[0],
                    date: new Date().toISOString(),
                    shippingStatus: 'pending',
                    tags: listing.tags || [],
                    listingId: listing.id,
                    deliveryAddress: {
                        fullName: 'John Doe',
                        addressLine1: '123 Main St',
                        city: 'New York',
                        state: 'NY',
                        postalCode: '10001',
                        country: 'US'
                    }
                });
                // Notification
                if (addSellerNotification) {
                    addSellerNotification(validatedSeller, 'New sale: "'.concat(listing.title, '" for ').concat(listing.price.toFixed(2)));
                }
                debugLog('Purchase successful');
                return true;
            } catch (error) {
                console.error('[Purchase] Error:', error);
                throw error;
            }
        }
    }["WalletProvider.useCallback[purchaseListing]"], [
        addOrder,
        addSellerNotification
    ]);
    // Withdraw funds via API
    const addSellerWithdrawal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[addSellerWithdrawal]": async (username, amount)=>{
            try {
                checkRateLimit('WITHDRAWAL', username);
                const validatedUsername = validateUsername(username);
                const validatedAmount = validateTransactionAmount(amount);
                debugLog('Processing withdrawal via API:', {
                    username: validatedUsername,
                    amount: validatedAmount
                });
                const response = await apiClient.post('/wallet/withdraw', {
                    username: validatedUsername,
                    amount: validatedAmount,
                    accountDetails: {
                        accountNumber: '****1234',
                        routingNumber: '123456789',
                        accountType: 'checking'
                    }
                });
                debugLog('Withdrawal response:', response);
                if (response.success) {
                    var _response_data, _response_data1;
                    const newWithdrawal = {
                        amount: validatedAmount,
                        date: ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.createdAt) || new Date().toISOString(),
                        status: ((_response_data1 = response.data) === null || _response_data1 === void 0 ? void 0 : _response_data1.status) || 'pending'
                    };
                    setSellerWithdrawals({
                        "WalletProvider.useCallback[addSellerWithdrawal]": (prev)=>({
                                ...prev,
                                [validatedUsername]: [
                                    ...prev[validatedUsername] || [],
                                    newWithdrawal
                                ]
                            })
                    }["WalletProvider.useCallback[addSellerWithdrawal]"]);
                    // Refresh balance
                    const newBalance = await fetchBalance(validatedUsername);
                    if (!isAdminUser(validatedUsername)) {
                        setSellerBalancesState({
                            "WalletProvider.useCallback[addSellerWithdrawal]": (prev)=>({
                                    ...prev,
                                    [validatedUsername]: newBalance
                                })
                        }["WalletProvider.useCallback[addSellerWithdrawal]"]);
                    }
                    debugLog('Withdrawal successful');
                } else {
                    var _response_error;
                    console.error('[WalletContext] Withdrawal failed:', response.error);
                    throw new Error(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Withdrawal failed');
                }
            } catch (error) {
                console.error('[WalletContext] Withdrawal error:', error);
                throw error;
            }
        }
    }["WalletProvider.useCallback[addSellerWithdrawal]"], [
        apiClient,
        fetchBalance
    ]);
    // Admin credit via API
    const adminCreditUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[adminCreditUser]": async (username, role, amount, reason)=>{
            try {
                checkRateLimit('REPORT_ACTION', 'admin');
                const validatedUsername = validateUsername(username);
                const validatedAmount = validateTransactionAmount(amount);
                const sanitizedReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reason);
                debugLog('Processing admin credit via API:', {
                    username: validatedUsername,
                    role,
                    amount: validatedAmount,
                    reason: sanitizedReason
                });
                const response = await apiClient.post('/wallet/admin-actions', {
                    action: 'credit',
                    username: validatedUsername,
                    amount: validatedAmount,
                    reason: sanitizedReason,
                    adminUsername: (user === null || user === void 0 ? void 0 : user.username) || 'platform'
                });
                debugLog('Admin credit response:', response);
                if (response.success) {
                    var _response_data, _response_data1;
                    // Refresh balance
                    const newBalance = await fetchBalance(validatedUsername);
                    if (role === 'buyer' && !isAdminUser(validatedUsername)) {
                        setBuyerBalancesState({
                            "WalletProvider.useCallback[adminCreditUser]": (prev)=>({
                                    ...prev,
                                    [validatedUsername]: newBalance
                                })
                        }["WalletProvider.useCallback[adminCreditUser]"]);
                    } else if (role === 'seller' && !isAdminUser(validatedUsername)) {
                        setSellerBalancesState({
                            "WalletProvider.useCallback[adminCreditUser]": (prev)=>({
                                    ...prev,
                                    [validatedUsername]: newBalance
                                })
                        }["WalletProvider.useCallback[adminCreditUser]"]);
                    }
                    // Refresh platform balance after admin action
                    if ((user === null || user === void 0 ? void 0 : user.role) === 'admin' || isAdminUser((user === null || user === void 0 ? void 0 : user.username) || '')) {
                        await fetchAdminPlatformBalance();
                        // Refresh admin actions after credit
                        await fetchAdminActions();
                    }
                    // Update admin actions locally
                    const action = {
                        id: ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.id) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                        type: 'credit',
                        amount: validatedAmount,
                        targetUser: validatedUsername,
                        username: validatedUsername,
                        adminUser: (user === null || user === void 0 ? void 0 : user.username) || 'platform',
                        reason: sanitizedReason,
                        date: ((_response_data1 = response.data) === null || _response_data1 === void 0 ? void 0 : _response_data1.createdAt) || new Date().toISOString(),
                        role
                    };
                    setAdminActions({
                        "WalletProvider.useCallback[adminCreditUser]": (prev)=>[
                                ...prev,
                                action
                            ]
                    }["WalletProvider.useCallback[adminCreditUser]"]);
                    debugLog('Admin credit successful');
                    return true;
                }
                console.error('[WalletContext] Admin credit failed:', response.error);
                return false;
            } catch (error) {
                console.error('Admin credit error:', error);
                return false;
            }
        }
    }["WalletProvider.useCallback[adminCreditUser]"], [
        user,
        apiClient,
        fetchBalance,
        fetchAdminPlatformBalance,
        fetchAdminActions
    ]);
    // Admin debit via API
    const adminDebitUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[adminDebitUser]": async (username, role, amount, reason)=>{
            try {
                checkRateLimit('REPORT_ACTION', 'admin');
                const validatedUsername = validateUsername(username);
                const validatedAmount = validateTransactionAmount(amount);
                const sanitizedReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reason);
                debugLog('Processing admin debit via API:', {
                    username: validatedUsername,
                    role,
                    amount: validatedAmount,
                    reason: sanitizedReason
                });
                const response = await apiClient.post('/wallet/admin-actions', {
                    action: 'debit',
                    username: validatedUsername,
                    amount: validatedAmount,
                    reason: sanitizedReason,
                    adminUsername: (user === null || user === void 0 ? void 0 : user.username) || 'platform'
                });
                debugLog('Admin debit response:', response);
                if (response.success) {
                    var _response_data, _response_data1;
                    // Refresh balance
                    const newBalance = await fetchBalance(validatedUsername);
                    if (role === 'buyer' && !isAdminUser(validatedUsername)) {
                        setBuyerBalancesState({
                            "WalletProvider.useCallback[adminDebitUser]": (prev)=>({
                                    ...prev,
                                    [validatedUsername]: newBalance
                                })
                        }["WalletProvider.useCallback[adminDebitUser]"]);
                    } else if (role === 'seller' && !isAdminUser(validatedUsername)) {
                        setSellerBalancesState({
                            "WalletProvider.useCallback[adminDebitUser]": (prev)=>({
                                    ...prev,
                                    [validatedUsername]: newBalance
                                })
                        }["WalletProvider.useCallback[adminDebitUser]"]);
                    }
                    // Refresh platform balance after admin action
                    if ((user === null || user === void 0 ? void 0 : user.role) === 'admin' || isAdminUser((user === null || user === void 0 ? void 0 : user.username) || '')) {
                        await fetchAdminPlatformBalance();
                        // Refresh admin actions after debit
                        await fetchAdminActions();
                    }
                    // Update admin actions locally
                    const action = {
                        id: ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.id) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                        type: 'debit',
                        amount: validatedAmount,
                        targetUser: validatedUsername,
                        username: validatedUsername,
                        adminUser: (user === null || user === void 0 ? void 0 : user.username) || 'platform',
                        reason: sanitizedReason,
                        date: ((_response_data1 = response.data) === null || _response_data1 === void 0 ? void 0 : _response_data1.createdAt) || new Date().toISOString(),
                        role
                    };
                    setAdminActions({
                        "WalletProvider.useCallback[adminDebitUser]": (prev)=>[
                                ...prev,
                                action
                            ]
                    }["WalletProvider.useCallback[adminDebitUser]"]);
                    debugLog('Admin debit successful');
                    return true;
                }
                console.error('[WalletContext] Admin debit failed:', response.error);
                return false;
            } catch (error) {
                console.error('Admin debit error:', error);
                return false;
            }
        }
    }["WalletProvider.useCallback[adminDebitUser]"], [
        user,
        apiClient,
        fetchBalance,
        fetchAdminPlatformBalance,
        fetchAdminActions
    ]);
    // Get transaction history from API
    const getTransactionHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[getTransactionHistory]": async (username, limit)=>{
            try {
                const targetUsername = username || (user === null || user === void 0 ? void 0 : user.username);
                if (!targetUsername) {
                    console.warn('[WalletContext] No username for transaction history');
                    return [];
                }
                // For admin users, use platform
                const queryUsername = isAdminUser(targetUsername) ? 'platform' : targetUsername;
                const endpoint = "/wallet/transactions/".concat(queryUsername).concat(limit ? "?limit=".concat(limit) : '');
                debugLog('Fetching transaction history:', endpoint);
                const response = await apiClient.get(endpoint);
                debugLog('Transaction history response:', response);
                if (response.success && response.data) {
                    return response.data;
                }
                return [];
            } catch (error) {
                console.error('Error getting transaction history:', error);
                return [];
            }
        }
    }["WalletProvider.useCallback[getTransactionHistory]"], [
        apiClient,
        user
    ]);
    // UPDATE reloadData to use loadAllData properly
    const updateReloadData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[updateReloadData]": async ()=>{
            if (isLoading) {
                debugLog('Already loading, skipping reload');
                return;
            }
            setIsLoading(true);
            try {
                await loadAllData();
                // For admin users, also refresh admin actions
                if ((user === null || user === void 0 ? void 0 : user.role) === 'admin' || isAdminUser((user === null || user === void 0 ? void 0 : user.username) || '')) {
                    await fetchAdminActions();
                }
            } finally{
                setIsLoading(false);
            }
        }
    }["WalletProvider.useCallback[updateReloadData]"], [
        loadAllData,
        isLoading,
        user,
        fetchAdminActions
    ]);
    // Subscription payment via API
    const subscribeToSellerWithPayment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[subscribeToSellerWithPayment]": async (buyer, seller, amount)=>{
            try {
                debugLog('Processing subscription via API:', {
                    buyer,
                    seller,
                    amount
                });
                const response = await apiClient.post('/subscriptions/subscribe', {
                    seller,
                    price: amount
                });
                debugLog('Subscription response:', response);
                if (response.success) {
                    // Refresh buyer balance
                    const newBalance = await fetchBalance(buyer);
                    if (!isAdminUser(buyer)) {
                        setBuyerBalancesState({
                            "WalletProvider.useCallback[subscribeToSellerWithPayment]": (prev)=>({
                                    ...prev,
                                    [buyer]: newBalance
                                })
                        }["WalletProvider.useCallback[subscribeToSellerWithPayment]"]);
                    }
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Subscription error:', error);
                return false;
            }
        }
    }["WalletProvider.useCallback[subscribeToSellerWithPayment]"], [
        apiClient,
        fetchBalance
    ]);
    // Unsubscribe from seller via API
    const unsubscribeFromSeller = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[unsubscribeFromSeller]": async (buyer, seller)=>{
            try {
                debugLog('Processing unsubscribe via API:', {
                    buyer,
                    seller
                });
                const response = await apiClient.post('/subscriptions/unsubscribe', {
                    seller
                });
                debugLog('Unsubscribe response:', response);
                if (response.success) {
                    debugLog('Successfully unsubscribed');
                    // Optionally refresh buyer balance to reflect any changes
                    if (buyer === (user === null || user === void 0 ? void 0 : user.username)) {
                        const newBalance = await fetchBalance(buyer);
                        if (!isAdminUser(buyer)) {
                            setBuyerBalancesState({
                                "WalletProvider.useCallback[unsubscribeFromSeller]": (prev)=>({
                                        ...prev,
                                        [buyer]: newBalance
                                    })
                            }["WalletProvider.useCallback[unsubscribeFromSeller]"]);
                        }
                    }
                    return true;
                }
                console.error('[WalletContext] Unsubscribe failed:', response.error);
                return false;
            } catch (error) {
                console.error('[WalletContext] Unsubscribe error:', error);
                return false;
            }
        }
    }["WalletProvider.useCallback[unsubscribeFromSeller]"], [
        apiClient,
        fetchBalance,
        user
    ]);
    // Admin withdrawal
    const addAdminWithdrawal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[addAdminWithdrawal]": async (amount)=>{
            try {
                debugLog('Processing admin withdrawal from unified platform wallet');
                const response = await apiClient.post('/wallet/admin-withdraw', {
                    amount,
                    accountDetails: {
                        accountNumber: '****9999',
                        accountType: 'business'
                    },
                    notes: "Platform withdrawal by ".concat(user === null || user === void 0 ? void 0 : user.username)
                });
                if (response.success) {
                    const withdrawal = {
                        amount,
                        date: new Date().toISOString(),
                        status: 'completed',
                        method: 'bank_transfer'
                    };
                    setAdminWithdrawals({
                        "WalletProvider.useCallback[addAdminWithdrawal]": (prev)=>[
                                ...prev,
                                withdrawal
                            ]
                    }["WalletProvider.useCallback[addAdminWithdrawal]"]);
                    // Refresh unified platform balance
                    await fetchAdminPlatformBalance();
                    debugLog('Admin withdrawal successful');
                } else {
                    var _response_error;
                    console.error('[WalletContext] Admin withdrawal failed:', response.error);
                    throw new Error(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Withdrawal failed');
                }
            } catch (error) {
                console.error('[WalletContext] Admin withdrawal error:', error);
                throw error;
            }
        }
    }["WalletProvider.useCallback[addAdminWithdrawal]"], [
        apiClient,
        fetchAdminPlatformBalance,
        user
    ]);
    // Update order address
    const updateOrderAddress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[updateOrderAddress]": async (orderId, address)=>{
            try {
                debugLog('Updating order address:', orderId);
                // Use POST method since ApiClient doesn't have PUT
                const response = await apiClient.post("/orders/".concat(orderId, "/address"), {
                    deliveryAddress: address
                });
                if (response.success) {
                    // Update local order history
                    setOrderHistory({
                        "WalletProvider.useCallback[updateOrderAddress]": (prev)=>prev.map({
                                "WalletProvider.useCallback[updateOrderAddress]": (order)=>order.id === orderId ? {
                                        ...order,
                                        deliveryAddress: address
                                    } : order
                            }["WalletProvider.useCallback[updateOrderAddress]"])
                    }["WalletProvider.useCallback[updateOrderAddress]"]);
                    debugLog('Order address updated successfully');
                } else {
                    var _response_error;
                    throw new Error(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to update address');
                }
            } catch (error) {
                console.error('[WalletContext] Error updating order address:', error);
                throw error;
            }
        }
    }["WalletProvider.useCallback[updateOrderAddress]"], [
        apiClient
    ]);
    // Update shipping status
    const updateShippingStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[updateShippingStatus]": async (orderId, status)=>{
            try {
                debugLog('Updating shipping status:', orderId, status);
                // Use POST method since ApiClient doesn't have PUT
                const response = await apiClient.post("/orders/".concat(orderId, "/shipping"), {
                    shippingStatus: status
                });
                if (response.success) {
                    // Update local order history
                    setOrderHistory({
                        "WalletProvider.useCallback[updateShippingStatus]": (prev)=>prev.map({
                                "WalletProvider.useCallback[updateShippingStatus]": (order)=>order.id === orderId ? {
                                        ...order,
                                        shippingStatus: status
                                    } : order
                            }["WalletProvider.useCallback[updateShippingStatus]"])
                    }["WalletProvider.useCallback[updateShippingStatus]"]);
                    debugLog('Shipping status updated successfully');
                } else {
                    var _response_error;
                    throw new Error(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to update shipping status');
                }
            } catch (error) {
                console.error('[WalletContext] Error updating shipping status:', error);
                throw error;
            }
        }
    }["WalletProvider.useCallback[updateShippingStatus]"], [
        apiClient
    ]);
    // Auction-related stubs
    const holdBidFunds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[holdBidFunds]": async ()=>{
            debugLog('Auction features not fully implemented in API yet');
            return false;
        }
    }["WalletProvider.useCallback[holdBidFunds]"], []);
    const refundBidFunds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[refundBidFunds]": async ()=>{
            debugLog('Auction features not fully implemented in API yet');
            return false;
        }
    }["WalletProvider.useCallback[refundBidFunds]"], []);
    const placeBid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[placeBid]": async ()=>{
            debugLog('Auction features not fully implemented in API yet');
            return false;
        }
    }["WalletProvider.useCallback[placeBid]"], []);
    const finalizeAuctionPurchase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[finalizeAuctionPurchase]": async ()=>{
            debugLog('Auction features not fully implemented in API yet');
            return false;
        }
    }["WalletProvider.useCallback[finalizeAuctionPurchase]"], []);
    // Enhanced features stubs
    const checkSuspiciousActivity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[checkSuspiciousActivity]": async (username)=>{
            return {
                suspicious: false,
                reasons: []
            };
        }
    }["WalletProvider.useCallback[checkSuspiciousActivity]"], []);
    const reconcileBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "WalletProvider.useCallback[reconcileBalance]": async (username, role)=>{
            return null;
        }
    }["WalletProvider.useCallback[reconcileBalance]"], []);
    const contextValue = {
        // Loading state
        isLoading,
        isInitialized,
        initializationError,
        // Core functionality
        buyerBalances,
        adminBalance,
        sellerBalances,
        setBuyerBalance,
        getBuyerBalance,
        setAdminBalance,
        setSellerBalance,
        getSellerBalance,
        purchaseListing,
        purchaseCustomRequest,
        subscribeToSellerWithPayment,
        unsubscribeFromSeller,
        orderHistory,
        addOrder,
        sellerWithdrawals,
        adminWithdrawals,
        addSellerWithdrawal,
        addAdminWithdrawal,
        wallet: {
            ...buyerBalances,
            ...sellerBalances,
            admin: adminBalance
        },
        updateWallet: ()=>{
            console.warn('updateWallet is deprecated - use API methods instead');
        },
        sendTip,
        setAddSellerNotificationCallback,
        adminCreditUser,
        adminDebitUser,
        adminActions,
        updateOrderAddress,
        updateShippingStatus,
        depositLogs,
        addDeposit,
        getDepositsForUser: (username)=>depositLogs.filter((log)=>log.username === username),
        getTotalDeposits: ()=>depositLogs.reduce((sum, log)=>sum + log.amount, 0),
        getDepositsByTimeframe: ()=>depositLogs,
        // Auction methods (stubs for now)
        holdBidFunds,
        refundBidFunds,
        finalizeAuctionPurchase,
        placeBid,
        chargeIncrementalBid: async ()=>false,
        getAuctionBidders: async ()=>[],
        cleanupAuctionTracking: async ()=>{},
        // Enhanced features
        checkSuspiciousActivity,
        reconcileBalance,
        getTransactionHistory,
        // Admin-specific methods
        refreshAdminData,
        getPlatformTransactions,
        getAnalyticsData,
        // Data management - Use the updated function
        reloadData: updateReloadData
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(WalletContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/WalletContext.tsx",
        lineNumber: 2088,
        columnNumber: 5
    }, this);
}
_s(WalletProvider, "GO2ktxvvDWa70mHzIjHMpjkJGcg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"]
    ];
});
_c = WalletProvider;
const useWallet = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(WalletContext);
    if (!context) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
};
_s1(useWallet, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "WalletProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/AuctionContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AuctionProvider": ()=>AuctionProvider,
    "useAuction": ()=>useAuction
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/websocket.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/permissions.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
const AuctionContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
// -----------------------------
// Validation Schemas (Zod)
// -----------------------------
const BidEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    listingId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional(),
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    bidder: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional(),
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional(),
    amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().finite().nonnegative().optional(),
    bid: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().finite().nonnegative()
    }).optional(),
    timestamp: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const RefundEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().finite().nonnegative(),
    listingId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional(),
    balance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().finite().nonnegative().optional(),
    reason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const BalanceUpdateEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    newBalance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().finite(),
    role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const AuctionEndedEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    listingId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'ended',
        'cancelled',
        'reserve_not_met'
    ]).optional(),
    winnerId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    winner: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    finalPrice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional(),
    finalBid: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional()
});
// -----------------------------
// Utilities
// -----------------------------
function makeBidId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return "bid_".concat(Date.now(), "_").concat(Math.floor(Math.random() * 1e6));
}
function coerceNumber(n) {
    let fallback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 0;
    const v = typeof n === 'number' ? n : Number(n);
    return Number.isFinite(v) ? v : fallback;
}
// Local, safe defaults for bid spam protection
const BID_LIMIT = {
    maxAttempts: 5,
    windowMs: 10_000,
    blockDuration: 10_000
};
function AuctionProvider(param) {
    let { children } = param;
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const wsContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"])();
    const subscribe = (wsContext === null || wsContext === void 0 ? void 0 : wsContext.subscribe) || (()=>()=>{});
    const isConnected = (wsContext === null || wsContext === void 0 ? void 0 : wsContext.isConnected) || false;
    const [auctions, setAuctions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [userBids, setUserBids] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [isPlacingBid, setIsPlacingBid] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isCancellingAuction, setIsCancellingAuction] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLoadingAuctions, setIsLoadingAuctions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [bidError, setBidError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Keep a ref to latest auctions to avoid effect dependency churn
    const auctionsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(auctions);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuctionProvider.useEffect": ()=>{
            auctionsRef.current = auctions;
        }
    }["AuctionProvider.useEffect"], [
        auctions
    ]);
    const activeAuctions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "AuctionProvider.useMemo[activeAuctions]": ()=>Object.values(auctions).filter({
                "AuctionProvider.useMemo[activeAuctions]": (a)=>a.status === 'active'
            }["AuctionProvider.useMemo[activeAuctions]"])
    }["AuctionProvider.useMemo[activeAuctions]"], [
        auctions
    ]);
    const clearBidError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[clearBidError]": ()=>{
            setBidError(null);
        }
    }["AuctionProvider.useCallback[clearBidError]"], []);
    const refreshCurrentUserBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[refreshCurrentUserBalance]": async ()=>{
            if (!user) return;
            try {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/wallet/balance/".concat(user.username), {
                    method: 'GET'
                });
                if (response.success && response.data) {
                    const newBalance = response.data.balance || 0;
                    if ("TURBOPACK compile-time truthy", 1) {
                        console.log("[AuctionContext] Current user balance updated: $".concat(newBalance));
                        window.dispatchEvent(new CustomEvent('wallet:balance_update', {
                            detail: {
                                username: user.username,
                                role: user.role,
                                balance: newBalance,
                                newBalance: newBalance,
                                timestamp: Date.now()
                            }
                        }));
                        const roleEvent = user.role === 'buyer' ? 'wallet:buyer-balance-updated' : 'wallet:seller-balance-updated';
                        window.dispatchEvent(new CustomEvent(roleEvent, {
                            detail: {
                                username: user.username,
                                balance: newBalance,
                                timestamp: Date.now()
                            }
                        }));
                    }
                }
            } catch (error) {
                console.error("[AuctionContext] Error refreshing current user balance:", error);
            }
        }
    }["AuctionProvider.useCallback[refreshCurrentUserBalance]"], [
        user
    ]);
    const updateAuctionWithBid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[updateAuctionWithBid]": (listingId, rawData)=>{
            var _data_bid;
            const parsed = BidEventSchema.safeParse(rawData);
            if (!parsed.success) {
                var _parsed_error;
                console.warn('[AuctionContext] Ignoring malformed bid event', (_parsed_error = parsed.error) === null || _parsed_error === void 0 ? void 0 : _parsed_error.flatten());
                return undefined;
            }
            const data = parsed.data;
            const amount = typeof data.amount === 'number' ? data.amount : coerceNumber((_data_bid = data.bid) === null || _data_bid === void 0 ? void 0 : _data_bid.amount, 0);
            const bidder = (data.bidder || data.username || '').trim();
            if (!listingId || !bidder || !Number.isFinite(amount)) {
                console.warn('[AuctionContext] Incomplete bid payload; skipping update');
                return undefined;
            }
            const bid = {
                id: makeBidId(),
                bidder,
                amount,
                timestamp: data.timestamp || new Date().toISOString(),
                isWinning: true
            };
            console.log('[AuctionContext] Processing bid update:', {
                listingId,
                bid
            });
            let previousHighestBidder;
            setAuctions({
                "AuctionProvider.useCallback[updateAuctionWithBid]": (prev)=>{
                    const existingAuction = prev[listingId];
                    previousHighestBidder = existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.highestBidder;
                    const reserveMet = (existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.reservePrice) ? bid.amount >= existingAuction.reservePrice : true;
                    return {
                        ...prev,
                        [listingId]: {
                            ...existingAuction,
                            listingId,
                            id: listingId,
                            seller: (existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.seller) || '',
                            startingPrice: (existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.startingPrice) || 0,
                            reservePrice: existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.reservePrice,
                            currentBid: bid.amount,
                            highestBidder: bid.bidder,
                            previousBidder: previousHighestBidder,
                            endTime: (existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.endTime) || '',
                            status: (existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.status) || 'active',
                            reserveMet,
                            bids: [
                                ...(existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.bids) || [],
                                bid
                            ].sort({
                                "AuctionProvider.useCallback[updateAuctionWithBid]": (a, b)=>b.amount - a.amount
                            }["AuctionProvider.useCallback[updateAuctionWithBid]"])
                        }
                    };
                }
            }["AuctionProvider.useCallback[updateAuctionWithBid]"]);
            setUserBids({
                "AuctionProvider.useCallback[updateAuctionWithBid]": (prev)=>({
                        ...prev,
                        [bid.bidder]: [
                            ...prev[bid.bidder] || [],
                            bid
                        ]
                    })
            }["AuctionProvider.useCallback[updateAuctionWithBid]"]);
            return previousHighestBidder;
        }
    }["AuctionProvider.useCallback[updateAuctionWithBid]"], []);
    const updateAuctionStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[updateAuctionStatus]": (listingId, status, winnerId, finalPrice)=>{
            setAuctions({
                "AuctionProvider.useCallback[updateAuctionStatus]": (prev)=>{
                    const existingAuction = prev[listingId];
                    return {
                        ...prev,
                        [listingId]: {
                            ...existingAuction,
                            listingId,
                            id: listingId,
                            seller: (existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.seller) || '',
                            startingPrice: (existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.startingPrice) || 0,
                            reservePrice: existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.reservePrice,
                            currentBid: (existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.currentBid) || 0,
                            endTime: (existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.endTime) || '',
                            bids: (existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.bids) || [],
                            status,
                            ...winnerId && {
                                winnerId
                            },
                            ...typeof finalPrice === 'number' && Number.isFinite(finalPrice) && {
                                finalPrice
                            },
                            reserveMet: status === 'reserve_not_met' ? false : existingAuction === null || existingAuction === void 0 ? void 0 : existingAuction.reserveMet
                        }
                    };
                }
            }["AuctionProvider.useCallback[updateAuctionStatus]"]);
        }
    }["AuctionProvider.useCallback[updateAuctionStatus]"], []);
    const checkReserveMet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[checkReserveMet]": (listingId)=>{
            const auction = auctions[listingId];
            if (!auction || !auction.reservePrice) return true;
            return auction.currentBid >= auction.reservePrice;
        }
    }["AuctionProvider.useCallback[checkReserveMet]"], [
        auctions
    ]);
    // Initial load (kept minimal; extend if needed)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuctionProvider.useEffect": ()=>{
            const loadAuctions = {
                "AuctionProvider.useEffect.loadAuctions": async ()=>{
                    if (!user) return;
                    setIsLoadingAuctions(true);
                    try {
                        console.log('[AuctionContext] Loading auctions...');
                    // (Intentionally left without fetching to avoid regressions)
                    } catch (error) {
                        console.error('[AuctionContext] Error loading auctions:', error);
                    } finally{
                        setIsLoadingAuctions(false);
                    }
                }
            }["AuctionProvider.useEffect.loadAuctions"];
            loadAuctions();
        }
    }["AuctionProvider.useEffect"], [
        user
    ]);
    // WebSocket subscriptions (stabilized: no dependency on auctions state)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuctionProvider.useEffect": ()=>{
            if (!isConnected || !subscribe) return;
            const unsubscribers = [];
            // New bid
            unsubscribers.push(subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].AUCTION_BID, {
                "AuctionProvider.useEffect": async (raw)=>{
                    const parsed = BidEventSchema.safeParse(raw);
                    if (!parsed.success) {
                        var _parsed_error;
                        console.warn('[AuctionContext] Ignoring malformed AUCTION_BID', (_parsed_error = parsed.error) === null || _parsed_error === void 0 ? void 0 : _parsed_error.flatten());
                        return;
                    }
                    const data = parsed.data;
                    const listingId = (data.listingId || data.id || '').toString();
                    if (!listingId) return;
                    updateAuctionWithBid(listingId, data);
                    if (user && (data.bidder === user.username || data.username === user.username)) {
                        await refreshCurrentUserBalance();
                    }
                }
            }["AuctionProvider.useEffect"]));
            // Wallet refund
            unsubscribers.push(subscribe('wallet:refund', {
                "AuctionProvider.useEffect": async (raw)=>{
                    const parsed = RefundEventSchema.safeParse(raw);
                    if (!parsed.success) {
                        var _parsed_error;
                        console.warn('[AuctionContext] Ignoring malformed wallet:refund', (_parsed_error = parsed.error) === null || _parsed_error === void 0 ? void 0 : _parsed_error.flatten());
                        return;
                    }
                    const data = parsed.data;
                    if (user && data.username === user.username) {
                        console.log('[AuctionContext] Current user was refunded, refreshing balance');
                        await refreshCurrentUserBalance();
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('wallet:user-refunded', {
                                detail: {
                                    username: user.username,
                                    amount: data.amount,
                                    listingId: data.listingId,
                                    balance: data.balance,
                                    reason: data.reason,
                                    timestamp: Date.now()
                                }
                            }));
                        }
                    }
                }
            }["AuctionProvider.useEffect"]));
            // Balance update passthrough (dedupe + fan-out)
            unsubscribers.push(subscribe('wallet:balance_update', {
                "AuctionProvider.useEffect": async (raw)=>{
                    const parsed = BalanceUpdateEventSchema.safeParse(raw);
                    if (!parsed.success) {
                        var _parsed_error;
                        console.warn('[AuctionContext] Ignoring malformed wallet:balance_update', (_parsed_error = parsed.error) === null || _parsed_error === void 0 ? void 0 : _parsed_error.flatten());
                        return;
                    }
                    const data = parsed.data;
                    if (user && data.username === user.username && typeof data.newBalance === 'number') {
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('wallet:balance_update', {
                                detail: {
                                    username: user.username,
                                    role: user.role,
                                    balance: data.newBalance,
                                    newBalance: data.newBalance,
                                    timestamp: Date.now()
                                }
                            }));
                            const roleEvent = user.role === 'buyer' ? 'wallet:buyer-balance-updated' : 'wallet:seller-balance-updated';
                            window.dispatchEvent(new CustomEvent(roleEvent, {
                                detail: {
                                    username: user.username,
                                    balance: data.newBalance,
                                    timestamp: Date.now()
                                }
                            }));
                            window.dispatchEvent(new CustomEvent('auction:check-bid-status', {
                                detail: {
                                    username: user.username,
                                    balance: data.newBalance,
                                    timestamp: Date.now()
                                }
                            }));
                        }
                    }
                }
            }["AuctionProvider.useEffect"]));
            // Outbid notice (no-op other than logging for now)
            unsubscribers.push(subscribe('auction:outbid', {
                "AuctionProvider.useEffect": async (data)=>{
                    console.log('[AuctionContext] User was outbid:', data);
                    if (user && (data === null || data === void 0 ? void 0 : data.username) === user.username) {
                        console.log('[AuctionContext] Current user was outbid on', data === null || data === void 0 ? void 0 : data.listingTitle);
                    }
                }
            }["AuctionProvider.useEffect"]));
            // Auction ended
            unsubscribers.push(subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].AUCTION_ENDED, {
                "AuctionProvider.useEffect": async (raw)=>{
                    const parsed = AuctionEndedEventSchema.safeParse(raw);
                    if (!parsed.success) {
                        var _parsed_error;
                        console.warn('[AuctionContext] Ignoring malformed AUCTION_ENDED', (_parsed_error = parsed.error) === null || _parsed_error === void 0 ? void 0 : _parsed_error.flatten());
                        return;
                    }
                    const data = parsed.data;
                    const listingId = (data.listingId || data.id || '').toString();
                    if (!listingId) return;
                    const status = data.status || 'ended';
                    if (status === 'reserve_not_met') {
                        updateAuctionStatus(listingId, 'reserve_not_met');
                        const auction = auctionsRef.current[listingId];
                        if (user && (auction === null || auction === void 0 ? void 0 : auction.highestBidder) === user.username) {
                            console.log('[AuctionContext] Reserve not met, user will be refunded');
                        }
                    } else {
                        const winner = data.winnerId || data.winner;
                        const final = typeof data.finalPrice === 'number' ? data.finalPrice : typeof data.finalBid === 'number' ? data.finalBid : undefined;
                        updateAuctionStatus(listingId, 'ended', winner, final);
                        if (user && winner === user.username) {
                            await refreshCurrentUserBalance();
                        }
                    }
                }
            }["AuctionProvider.useEffect"]));
            // Reserve not met
            unsubscribers.push(subscribe('auction:reserve_not_met', {
                "AuctionProvider.useEffect": async (raw)=>{
                    const parsed = AuctionEndedEventSchema.safeParse(raw);
                    if (!parsed.success) {
                        var _parsed_error;
                        console.warn('[AuctionContext] Ignoring malformed auction:reserve_not_met', (_parsed_error = parsed.error) === null || _parsed_error === void 0 ? void 0 : _parsed_error.flatten());
                        return;
                    }
                    const data = parsed.data;
                    const listingId = (data.listingId || data.id || '').toString();
                    if (!listingId) return;
                    updateAuctionStatus(listingId, 'reserve_not_met');
                    const auction = auctionsRef.current[listingId];
                    if (user && (auction === null || auction === void 0 ? void 0 : auction.highestBidder) === user.username) {
                        console.log('[AuctionContext] User was highest bidder, awaiting refund for reserve not met');
                    }
                }
            }["AuctionProvider.useEffect"]));
            // Cancelled
            unsubscribers.push(subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WebSocketEvent"].AUCTION_CANCELLED, {
                "AuctionProvider.useEffect": async (raw)=>{
                    const parsed = AuctionEndedEventSchema.safeParse(raw);
                    if (!parsed.success) {
                        var _parsed_error;
                        console.warn('[AuctionContext] Ignoring malformed AUCTION_CANCELLED', (_parsed_error = parsed.error) === null || _parsed_error === void 0 ? void 0 : _parsed_error.flatten());
                        return;
                    }
                    const data = parsed.data;
                    const listingId = (data.listingId || data.id || '').toString();
                    if (!listingId) return;
                    const auction = auctionsRef.current[listingId];
                    updateAuctionStatus(listingId, 'cancelled');
                    if (user && (auction === null || auction === void 0 ? void 0 : auction.highestBidder) === user.username) {
                        await refreshCurrentUserBalance();
                    }
                }
            }["AuctionProvider.useEffect"]));
            return ({
                "AuctionProvider.useEffect": ()=>{
                    unsubscribers.forEach({
                        "AuctionProvider.useEffect": (unsub)=>{
                            try {
                                unsub();
                            } catch (e) {
                            // swallow teardown errors
                            }
                        }
                    }["AuctionProvider.useEffect"]);
                }
            })["AuctionProvider.useEffect"];
        }
    }["AuctionProvider.useEffect"], [
        isConnected,
        subscribe,
        updateAuctionWithBid,
        updateAuctionStatus,
        refreshCurrentUserBalance,
        user
    ]);
    const placeBid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[placeBid]": async (listingId, bidder, amount)=>{
            if (!user) {
                setBidError('You must be logged in to bid');
                return false;
            }
            // Gentle client-side rate limit against spam clicks
            try {
                const limiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])(); // no args
                const key = "auction:bid:".concat(user.username);
                limiter.check(key, {
                    maxAttempts: BID_LIMIT.maxAttempts,
                    windowMs: BID_LIMIT.windowMs,
                    blockDuration: BID_LIMIT.blockDuration
                });
            } catch (e) {
                setBidError('Too many bid attempts. Please wait a moment.');
                return false;
            }
            // Coerce & validate amount
            const amt = coerceNumber(amount, NaN);
            if (!Number.isFinite(amt) || amt < 0) {
                setBidError('Invalid bid amount');
                return false;
            }
            // Ensure bidder matches logged-in user (UI safety)
            if (bidder && user.username && bidder !== user.username) {
                console.warn('[AuctionContext] Bidder mismatch; normalizing to current user');
            }
            setIsPlacingBid(true);
            setBidError(null);
            try {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(listingId, "/bid"), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: amt
                    })
                });
                if (response.success) {
                    var _response_data;
                    console.log('[AuctionContext] Bid placed successfully:', ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.message) || 'Success');
                    updateAuctionWithBid(listingId, {
                        bidder: user.username,
                        amount: amt,
                        timestamp: new Date().toISOString()
                    });
                    const auction = auctionsRef.current[listingId];
                    if ((auction === null || auction === void 0 ? void 0 : auction.reservePrice) && amt < auction.reservePrice) {
                        console.log('[AuctionContext] Bid placed but reserve price not yet met');
                    }
                    await refreshCurrentUserBalance();
                    return true;
                } else {
                    var _response_error;
                    const errorMsg = typeof response.error === 'string' ? response.error : ((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to place bid';
                    setBidError(errorMsg);
                    console.error('[AuctionContext] Bid failed:', errorMsg);
                    return false;
                }
            } catch (error) {
                const errorMsg = (error === null || error === void 0 ? void 0 : error.message) || 'Network error while placing bid';
                setBidError(errorMsg);
                console.error('[AuctionContext] Bid error:', error);
                return false;
            } finally{
                setIsPlacingBid(false);
            }
        }
    }["AuctionProvider.useCallback[placeBid]"], [
        user,
        updateAuctionWithBid,
        refreshCurrentUserBalance
    ]);
    const cancelAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[cancelAuction]": async (listingId)=>{
            if (!user) return false;
            setIsCancellingAuction(true);
            try {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(listingId, "/cancel-auction"), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.success) {
                    return true;
                } else {
                    console.error('[AuctionContext] Cancel auction failed:', response.error);
                    return false;
                }
            } catch (error) {
                console.error('[AuctionContext] Cancel auction error:', error);
                return false;
            } finally{
                setIsCancellingAuction(false);
            }
        }
    }["AuctionProvider.useCallback[cancelAuction]"], [
        user
    ]);
    const endAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[endAuction]": async (listingId)=>{
            if (!user || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$permissions$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAdmin"])(user)) {
                return false;
            }
            try {
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(listingId, "/end-auction"), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.success) {
                    return true;
                } else {
                    console.error('[AuctionContext] End auction failed:', response.error);
                    return false;
                }
            } catch (error) {
                console.error('[AuctionContext] End auction error:', error);
                return false;
            }
        }
    }["AuctionProvider.useCallback[endAuction]"], [
        user
    ]);
    // Process ended auction - handle already processed auctions gracefully
    const processEndedAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[processEndedAuction]": async (listing)=>{
            if (!(listing === null || listing === void 0 ? void 0 : listing.auction)) return false;
            try {
                var _response_error;
                // Call backend to process auction completion
                const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])("/listings/".concat(listing.id, "/end-auction"), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.success) {
                    var _response_data, _response_data_data, _response_data1, _responseData_data, _responseData_data1;
                    // Check if it was already processed (backend returns success with alreadyProcessed flag)
                    const alreadyProcessed = ((_response_data = response.data) === null || _response_data === void 0 ? void 0 : _response_data.alreadyProcessed) || ((_response_data1 = response.data) === null || _response_data1 === void 0 ? void 0 : (_response_data_data = _response_data1.data) === null || _response_data_data === void 0 ? void 0 : _response_data_data.alreadyProcessed) || false;
                    if (alreadyProcessed) {
                        var _response_data2, _response_data3, _response_data_data1, _response_data4;
                        console.log('[AuctionContext] Auction was already processed:', (_response_data2 = response.data) === null || _response_data2 === void 0 ? void 0 : _response_data2.status);
                        // Update status based on the already-processed status
                        const status = ((_response_data3 = response.data) === null || _response_data3 === void 0 ? void 0 : _response_data3.status) || ((_response_data4 = response.data) === null || _response_data4 === void 0 ? void 0 : (_response_data_data1 = _response_data4.data) === null || _response_data_data1 === void 0 ? void 0 : _response_data_data1.status) || 'ended';
                        if (status === 'reserve_not_met') {
                            updateAuctionStatus(listing.id, 'reserve_not_met');
                        } else if (listing.auction.highestBidder && listing.auction.highestBid) {
                            updateAuctionStatus(listing.id, 'ended', listing.auction.highestBidder, listing.auction.highestBid);
                        } else {
                            updateAuctionStatus(listing.id, 'ended');
                        }
                        return true; // handled
                    }
                    // Process the response data
                    const responseData = response.data || {};
                    // Check if order was created successfully
                    const order = responseData.order || ((_responseData_data = responseData.data) === null || _responseData_data === void 0 ? void 0 : _responseData_data.order);
                    if (order) {
                        console.log('[AuctionContext] Order created successfully:', order);
                        // Fire event for order creation
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('order:created', {
                                detail: {
                                    order
                                }
                            }));
                        }
                    }
                    // Update status based on response
                    const status = responseData.status || ((_responseData_data1 = responseData.data) === null || _responseData_data1 === void 0 ? void 0 : _responseData_data1.status) || 'ended';
                    if (status === 'reserve_not_met') {
                        updateAuctionStatus(listing.id, 'reserve_not_met');
                    } else if (listing.auction.highestBidder && listing.auction.highestBid) {
                        updateAuctionStatus(listing.id, 'ended', listing.auction.highestBidder, listing.auction.highestBid);
                    } else {
                        updateAuctionStatus(listing.id, 'ended');
                    }
                    return true;
                }
                // Error path: treat known messages as already-processed
                const msg = (typeof response.error === 'string' ? response.error : ((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || '').toLowerCase();
                if (msg.includes('auction is not active') || msg.includes('already processed') || msg.includes('auction already processed')) {
                    console.log('[AuctionContext] Auction already processed, treating as success');
                    updateAuctionStatus(listing.id, 'ended');
                    return true;
                }
                console.error('[AuctionContext] Failed to process ended auction:', response.error);
                return false;
            } catch (error) {
                const msg = ((error === null || error === void 0 ? void 0 : error.message) || '').toLowerCase();
                if (msg.includes('auction is not active') || msg.includes('already processed') || msg.includes('auction already processed')) {
                    console.log('[AuctionContext] Auction already processed (from catch), treating as success');
                    updateAuctionStatus(listing.id, 'ended');
                    return true;
                }
                console.error('[AuctionContext] Error processing ended auction:', error);
                return false;
            }
        }
    }["AuctionProvider.useCallback[processEndedAuction]"], [
        updateAuctionStatus
    ]);
    const getAuctionByListingId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[getAuctionByListingId]": (listingId)=>auctions[listingId] || null
    }["AuctionProvider.useCallback[getAuctionByListingId]"], [
        auctions
    ]);
    const getUserBidsForAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[getUserBidsForAuction]": (listingId, username)=>{
            const auction = auctions[listingId];
            if (!auction) return [];
            return auction.bids.filter({
                "AuctionProvider.useCallback[getUserBidsForAuction]": (bid)=>bid.bidder === username
            }["AuctionProvider.useCallback[getUserBidsForAuction]"]);
        }
    }["AuctionProvider.useCallback[getUserBidsForAuction]"], [
        auctions
    ]);
    const isUserHighestBidder = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[isUserHighestBidder]": (listingId, username)=>{
            const auction = auctions[listingId];
            return (auction === null || auction === void 0 ? void 0 : auction.highestBidder) === username;
        }
    }["AuctionProvider.useCallback[isUserHighestBidder]"], [
        auctions
    ]);
    const subscribeToAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[subscribeToAuction]": (listingId)=>{
            if (!isConnected) return;
            console.log('[AuctionContext] Subscribing to auction:', listingId);
        // Hook for future: if your WS supports rooms, join here.
        }
    }["AuctionProvider.useCallback[subscribeToAuction]"], [
        isConnected
    ]);
    const unsubscribeFromAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuctionProvider.useCallback[unsubscribeFromAuction]": (listingId)=>{
            if (!isConnected) return;
            console.log('[AuctionContext] Unsubscribing from auction:', listingId);
        // Hook for future: if your WS supports rooms, leave here.
        }
    }["AuctionProvider.useCallback[unsubscribeFromAuction]"], [
        isConnected
    ]);
    const value = {
        auctions,
        activeAuctions,
        userBids,
        placeBid,
        cancelAuction,
        endAuction,
        processEndedAuction,
        getAuctionByListingId,
        getUserBidsForAuction,
        isUserHighestBidder,
        checkReserveMet,
        isPlacingBid,
        isCancellingAuction,
        isLoadingAuctions,
        bidError,
        clearBidError,
        subscribeToAuction,
        unsubscribeFromAuction
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuctionContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AuctionContext.tsx",
        lineNumber: 871,
        columnNumber: 10
    }, this);
}
_s(AuctionProvider, "aNlqO2YGy/LhFC4LJ3u6X+njmP0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"]
    ];
});
_c = AuctionProvider;
function useAuction() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuctionContext);
    if (!context) {
        throw new Error('useAuction must be used within AuctionProvider');
    }
    return context;
}
_s1(useAuction, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuctionProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/ListingContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/context/ListingContext.tsx
__turbopack_context__.s({
    "ListingProvider": ()=>ListingProvider,
    "useListings": ()=>useListings
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@swc/helpers/esm/_define_property.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WalletContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuctionContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuctionContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/listings.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/users.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
;
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
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
// FIX 2: Add deduplication manager for sold listings
class SoldListingDeduplicationManager {
    startCleanup() {
        this.cleanupInterval = setInterval(()=>{
            const now = Date.now();
            const expiredKeys = [];
            this.processedListings.forEach((timestamp, listingId)=>{
                if (now - timestamp > this.expiryMs) {
                    expiredKeys.push(listingId);
                }
            });
            expiredKeys.forEach((key)=>this.processedListings.delete(key));
        }, 30000); // Cleanup every 30 seconds
    }
    isDuplicate(listingId) {
        if (this.processedListings.has(listingId)) {
            return true;
        }
        this.processedListings.set(listingId, Date.now());
        return false;
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.processedListings.clear();
    }
    constructor(expiryMs = 60000){
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "processedListings", new Map());
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "cleanupInterval", null);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$swc$2f$helpers$2f$esm$2f$_define_property$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["_"])(this, "expiryMs", void 0);
        this.expiryMs = expiryMs;
        this.startCleanup();
    }
}
const ListingContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const ListingProvider = (param)=>{
    let { children } = param;
    _s();
    const { user, updateUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const webSocketContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"])();
    // Extract properties from WebSocket context safely
    const subscribe = webSocketContext === null || webSocketContext === void 0 ? void 0 : webSocketContext.subscribe;
    const isConnected = (webSocketContext === null || webSocketContext === void 0 ? void 0 : webSocketContext.isConnected) || false;
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [listings, setListings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [subscriptions, setSubscriptions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [notificationStore, setNotificationStore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [isAuthReady, setIsAuthReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [latestOrder, setLatestOrder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // FIX 2: Add ref for deduplication manager
    const soldListingDeduplicator = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new SoldListingDeduplicationManager());
    // Add deduplication mechanism for listing updates
    const listingUpdateDeduplicator = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    const DEBOUNCE_TIME = 500; // 500ms debounce
    // Add request deduplication for API calls
    const apiRequestCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    const API_CACHE_TIME = 1000; // Cache API responses for 1 second
    // Helper function to normalize notification items to the new format
    const normalizeNotification = (item)=>{
        if (typeof item === 'string') {
            return {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                message: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(item),
                timestamp: new Date().toISOString(),
                cleared: false
            };
        }
        return {
            ...item,
            message: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(item.message) // Sanitize message
        };
    };
    // Helper function to save notification store
    const saveNotificationStore = async (store)=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('seller_notifications_store', store);
    };
    // Memoized notification function to avoid infinite render loop
    const addSellerNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ListingProvider.useCallback[addSellerNotification]": (seller, message)=>{
            if (!seller) {
                console.warn("Attempted to add notification without seller ID");
                return;
            }
            // Sanitize the notification message
            const sanitizedMessage = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(message);
            const newNotification = {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                message: sanitizedMessage,
                timestamp: new Date().toISOString(),
                cleared: false
            };
            setNotificationStore({
                "ListingProvider.useCallback[addSellerNotification]": (prev)=>{
                    const sellerNotifications = prev[seller] || [];
                    const updated = {
                        ...prev,
                        [seller]: [
                            ...sellerNotifications,
                            newNotification
                        ]
                    };
                    saveNotificationStore(updated);
                    return updated;
                }
            }["ListingProvider.useCallback[addSellerNotification]"]);
        }
    }["ListingProvider.useCallback[addSellerNotification]"], []);
    const { subscribeToSellerWithPayment, setAddSellerNotificationCallback, purchaseListing, orderHistory, unsubscribeFromSeller: walletUnsubscribeFromSeller } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"])();
    // Get auction functions from AuctionContext
    const { placeBid: auctionPlaceBid, cancelAuction: auctionCancelAuction, processEndedAuction } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuctionContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuction"])();
    // On mount, set the notification callback in WalletContext
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ListingProvider.useEffect": ()=>{
            if (setAddSellerNotificationCallback) {
                setAddSellerNotificationCallback(addSellerNotification);
            }
        }
    }["ListingProvider.useEffect"], [
        setAddSellerNotificationCallback,
        addSellerNotification
    ]);
    // FIX: Optimized WebSocket subscription with debouncing
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ListingProvider.useEffect": ()=>{
            if (!isConnected || !subscribe) return;
            console.log('[ListingContext] Setting up WebSocket subscription for listing:sold events');
            const unsubscribe = subscribe('listing:sold', {
                "ListingProvider.useEffect.unsubscribe": (data)=>{
                    console.log('[ListingContext] Received listing:sold event:', data);
                    var _data_listingId;
                    // Handle both possible field names for the listing ID
                    const id = (_data_listingId = data.listingId) !== null && _data_listingId !== void 0 ? _data_listingId : data.id;
                    if (!id) {
                        console.error('[ListingContext] No listing ID in sold event:', data);
                        return;
                    }
                    // Debounce duplicate events
                    const now = Date.now();
                    const lastUpdate = listingUpdateDeduplicator.current.get(id);
                    if (lastUpdate && now - lastUpdate < DEBOUNCE_TIME) {
                        console.log('[ListingContext] Skipping duplicate sold event (debounced):', id);
                        return;
                    }
                    listingUpdateDeduplicator.current.set(id, now);
                    // Check if we've already processed this sold listing
                    if (soldListingDeduplicator.current.isDuplicate(id)) {
                        console.log('[ListingContext] Skipping duplicate sold listing:', id);
                        return;
                    }
                    // Use setState with callback to prevent multiple state updates
                    setListings({
                        "ListingProvider.useEffect.unsubscribe": (prev)=>{
                            // Check if listing exists before filtering
                            const exists = prev.some({
                                "ListingProvider.useEffect.unsubscribe.exists": (listing)=>listing.id === id
                            }["ListingProvider.useEffect.unsubscribe.exists"]);
                            if (!exists) {
                                console.log('[ListingContext] Listing not found in current state:', id);
                                return prev;
                            }
                            const filtered = prev.filter({
                                "ListingProvider.useEffect.unsubscribe.filtered": (listing)=>listing.id !== id
                            }["ListingProvider.useEffect.unsubscribe.filtered"]);
                            console.log('[ListingContext] Removed sold listing:', id);
                            // Fire custom event for any components that need to know
                            if ("TURBOPACK compile-time truthy", 1) {
                                // Debounce the custom event as well
                                setTimeout({
                                    "ListingProvider.useEffect.unsubscribe": ()=>{
                                        window.dispatchEvent(new CustomEvent('listing:removed', {
                                            detail: {
                                                listingId: id,
                                                reason: 'sold'
                                            }
                                        }));
                                    }
                                }["ListingProvider.useEffect.unsubscribe"], 100);
                            }
                            return filtered;
                        }
                    }["ListingProvider.useEffect.unsubscribe"]);
                }
            }["ListingProvider.useEffect.unsubscribe"]);
            return ({
                "ListingProvider.useEffect": ()=>{
                    unsubscribe();
                    // Clean up deduplicator on unmount
                    listingUpdateDeduplicator.current.clear();
                }
            })["ListingProvider.useEffect"];
        }
    }["ListingProvider.useEffect"], [
        isConnected,
        subscribe
    ]);
    // Subscribe to order:created events
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ListingProvider.useEffect": ()=>{
            if (!isConnected || !subscribe) return;
            console.log('[ListingContext] Setting up WebSocket subscription for order:created events');
            const unsubscribe = subscribe('order:created', {
                "ListingProvider.useEffect.unsubscribe": (data)=>{
                    console.log('[ListingContext] Received order:created event:', data);
                    // Store the latest order so it's immediately available
                    if (data.order || data) {
                        const order = data.order || data;
                        setLatestOrder(order);
                        // Fire custom event for any components that need to know
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('order:created', {
                                detail: {
                                    order
                                }
                            }));
                        }
                    }
                }
            }["ListingProvider.useEffect.unsubscribe"]);
            return ({
                "ListingProvider.useEffect": ()=>{
                    unsubscribe();
                }
            })["ListingProvider.useEffect"];
        }
    }["ListingProvider.useEffect"], [
        isConnected,
        subscribe
    ]);
    // Cleanup deduplication manager on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ListingProvider.useEffect": ()=>{
            return ({
                "ListingProvider.useEffect": ()=>{
                    soldListingDeduplicator.current.destroy();
                }
            })["ListingProvider.useEffect"];
        }
    }["ListingProvider.useEffect"], []);
    // Listen for notification changes in localStorage (for header live updates)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ListingProvider.useEffect": ()=>{
            function handleStorageChange(e) {
                if (e.key === 'seller_notifications_store') {
                    try {
                        setNotificationStore(JSON.parse(e.newValue || '{}'));
                    } catch (e) {
                        setNotificationStore({});
                    }
                }
            }
            window.addEventListener('storage', handleStorageChange);
            return ({
                "ListingProvider.useEffect": ()=>window.removeEventListener('storage', handleStorageChange)
            })["ListingProvider.useEffect"];
        }
    }["ListingProvider.useEffect"], []);
    // Migration function to convert old notifications to new format
    const migrateNotifications = (notifications)=>{
        return notifications.map(normalizeNotification);
    };
    // Cached fetch function for individual listings
    const fetchListingWithCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ListingProvider.useCallback[fetchListingWithCache]": async (listingId)=>{
            const now = Date.now();
            const cached = apiRequestCache.current.get(listingId);
            // Return cached promise if it's still fresh
            if (cached && now - cached.timestamp < API_CACHE_TIME) {
                console.log('[ListingContext] Using cached listing request for:', listingId);
                return cached.promise;
            }
            // Create new request
            const promise = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].getListing(listingId);
            apiRequestCache.current.set(listingId, {
                timestamp: now,
                promise
            });
            // Clean up old cache entries
            setTimeout({
                "ListingProvider.useCallback[fetchListingWithCache]": ()=>{
                    const cleanupTime = Date.now();
                    for (const [key, value] of apiRequestCache.current.entries()){
                        if (cleanupTime - value.timestamp > API_CACHE_TIME * 2) {
                            apiRequestCache.current.delete(key);
                        }
                    }
                }
            }["ListingProvider.useCallback[fetchListingWithCache]"], API_CACHE_TIME * 2);
            return promise;
        }
    }["ListingProvider.useCallback[fetchListingWithCache]"], []);
    // Add a cache for the getListings API call
    const listingsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const LISTINGS_CACHE_TIME = 1000; // Cache for 1 second
    // Load initial data using services with caching
    const loadData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ListingProvider.useCallback[loadData]": async ()=>{
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            // Check if we're already loading to prevent duplicate calls
            if (isLoading) {
                console.log('[ListingContext] Already loading, skipping duplicate call');
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                // Load users - FIXED: Handle new UsersResponse format with proper type checking
                const usersResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].getUsers();
                if (usersResult.success && usersResult.data) {
                    // Convert UsersResponse back to Record<string, User> format for backward compatibility
                    const usersMap = {};
                    if (Array.isArray(usersResult.data)) {
                        // Handle case where data is directly an array
                        usersResult.data.forEach({
                            "ListingProvider.useCallback[loadData]": (user)=>{
                                usersMap[user.username] = user;
                            }
                        }["ListingProvider.useCallback[loadData]"]);
                    } else if (usersResult.data && typeof usersResult.data === 'object' && 'users' in usersResult.data) {
                        // Handle case where data is UsersResponse object - check if users property exists and is array
                        const usersResponse = usersResult.data;
                        if (Array.isArray(usersResponse.users)) {
                            usersResponse.users.forEach({
                                "ListingProvider.useCallback[loadData]": (user)=>{
                                    usersMap[user.username] = user;
                                }
                            }["ListingProvider.useCallback[loadData]"]);
                        }
                    }
                    setUsers(usersMap);
                }
                // Load listings using the service with caching
                const now = Date.now();
                let listingsResult;
                if (listingsCache.current && now - listingsCache.current.timestamp < LISTINGS_CACHE_TIME) {
                    console.log('[ListingContext] Using cached listings for initial load');
                    listingsResult = await listingsCache.current.promise;
                } else {
                    const promise = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].getListings();
                    listingsCache.current = {
                        timestamp: now,
                        promise
                    };
                    listingsResult = await promise;
                }
                if (listingsResult.success && listingsResult.data) {
                    setListings(listingsResult.data);
                } else {
                    var _listingsResult_error;
                    throw new Error(((_listingsResult_error = listingsResult.error) === null || _listingsResult_error === void 0 ? void 0 : _listingsResult_error.message) || 'Failed to load listings');
                }
                // Load subscriptions
                const storedSubs = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('subscriptions', {});
                setSubscriptions(storedSubs);
                // Load notifications
                const storedNotifications = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('seller_notifications_store', {});
                const migrated = {};
                Object.keys(storedNotifications).forEach({
                    "ListingProvider.useCallback[loadData]": (username)=>{
                        if (Array.isArray(storedNotifications[username])) {
                            migrated[username] = migrateNotifications(storedNotifications[username]);
                        }
                    }
                }["ListingProvider.useCallback[loadData]"]);
                setNotificationStore(migrated);
                await saveNotificationStore(migrated);
                setIsAuthReady(true);
            } catch (error) {
                console.error('Error loading ListingContext data:', error);
                setError(error instanceof Error ? error.message : 'Failed to load data');
                setIsAuthReady(true);
                listingsCache.current = null; // Clear cache on error
            } finally{
                setIsLoading(false);
            }
        }
    }["ListingProvider.useCallback[loadData]"], [
        isLoading
    ]); // Add isLoading as dependency to prevent duplicate calls
    // Load data on mount with proper cleanup
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ListingProvider.useEffect": ()=>{
            let mounted = true;
            let timeoutId;
            // Debounce the initial load slightly to prevent multiple rapid calls
            timeoutId = setTimeout({
                "ListingProvider.useEffect": ()=>{
                    if (mounted && !isAuthReady && !isLoading) {
                        loadData();
                    }
                }
            }["ListingProvider.useEffect"], 100);
            return ({
                "ListingProvider.useEffect": ()=>{
                    mounted = false;
                    clearTimeout(timeoutId);
                }
            })["ListingProvider.useEffect"];
        }
    }["ListingProvider.useEffect"], []); // Empty dependency array - only run once on mount
    const persistUsers = async (updated)=>{
        setUsers(updated);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('all_users_v2', updated);
    };
    // Refresh listings with caching
    const refreshListings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ListingProvider.useCallback[refreshListings]": async ()=>{
            const now = Date.now();
            // Return cached promise if it's still fresh
            if (listingsCache.current && now - listingsCache.current.timestamp < LISTINGS_CACHE_TIME) {
                console.log('[ListingContext] Using cached listings request');
                try {
                    const result = await listingsCache.current.promise;
                    if (result.success && result.data) {
                        setListings(result.data);
                    }
                    return;
                } catch (error) {
                // If cached request failed, continue with new request
                }
            }
            setIsLoading(true);
            setError(null);
            try {
                // Create and cache the new promise
                const promise = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].getListings();
                listingsCache.current = {
                    timestamp: now,
                    promise
                };
                const listingsResult = await promise;
                if (listingsResult.success && listingsResult.data) {
                    setListings(listingsResult.data);
                } else {
                    var _listingsResult_error;
                    throw new Error(((_listingsResult_error = listingsResult.error) === null || _listingsResult_error === void 0 ? void 0 : _listingsResult_error.message) || 'Failed to refresh listings');
                }
            } catch (error) {
                console.error('Error refreshing listings:', error);
                setError(error instanceof Error ? error.message : 'Failed to refresh listings');
                listingsCache.current = null; // Clear cache on error
            } finally{
                setIsLoading(false);
            }
        }
    }["ListingProvider.useCallback[refreshListings]"], []);
    // Check for ended auctions on load and at regular intervals
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ListingProvider.useEffect": ()=>{
            checkEndedAuctions();
            const interval = setInterval({
                "ListingProvider.useEffect.interval": ()=>{
                    checkEndedAuctions();
                }
            }["ListingProvider.useEffect.interval"], 60000);
            return ({
                "ListingProvider.useEffect": ()=>clearInterval(interval)
            })["ListingProvider.useEffect"];
        }
    }["ListingProvider.useEffect"], [
        listings
    ]);
    // Use listings service for adding listings
    const addListing = async (listing)=>{
        console.log('🔍 addListing called with user:', user);
        if (!user || user.role !== 'seller') {
            console.error('❌ addListing failed: user is not a seller', {
                user: user === null || user === void 0 ? void 0 : user.username,
                role: user === null || user === void 0 ? void 0 : user.role
            });
            alert('You must be logged in as a seller to create listings.');
            return;
        }
        // Validate and sanitize listing data
        const validationResult = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAndSanitize({
            title: listing.title,
            description: listing.description,
            price: listing.price,
            tags: listing.tags,
            wearDuration: listing.hoursWorn
        }, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingSchemas"].createListingSchema.pick({
            title: true,
            description: true,
            price: true,
            tags: true,
            wearDuration: true
        }), {
            title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict,
            description: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict,
            tags: (tags)=>tags === null || tags === void 0 ? void 0 : tags.map((tag)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(tag))
        });
        if (!validationResult.success) {
            console.error('Validation failed:', validationResult.errors);
            alert('Please check your listing details:\n' + Object.values(validationResult.errors || {}).join('\n'));
            return;
        }
        const myListings = listings.filter((l)=>l.seller === user.username);
        const isVerified = user.isVerified || user.verificationStatus === 'verified';
        const maxListings = isVerified ? 25 : 2;
        console.log('📊 Listing check:', {
            currentListings: myListings.length,
            maxListings,
            isVerified,
            username: user.username
        });
        if (myListings.length >= maxListings) {
            alert(isVerified ? 'You have reached the maximum of 25 listings for verified sellers.' : 'Unverified sellers can only have 2 active listings. Please verify your account to add more.');
            return;
        }
        try {
            const sanitizedListing = {
                ...listing,
                title: validationResult.data.title,
                description: validationResult.data.description,
                price: validationResult.data.price,
                tags: validationResult.data.tags,
                hoursWorn: validationResult.data.wearDuration,
                seller: user.username,
                isVerified: isVerified
            };
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].createListing(sanitizedListing);
            if (result.success && result.data) {
                setListings((prev)=>[
                        ...prev,
                        result.data
                    ]);
                console.log('✅ Created new listing:', result.data);
                window.dispatchEvent(new CustomEvent('listingCreated', {
                    detail: {
                        listing: result.data
                    }
                }));
            } else {
                var _result_error;
                console.error('Failed to create listing:', result.error);
                alert(((_result_error = result.error) === null || _result_error === void 0 ? void 0 : _result_error.message) || 'Failed to create listing. Please try again.');
            }
        } catch (error) {
            console.error('Error creating listing:', error);
            alert('An error occurred while creating the listing.');
        }
    };
    // Add an auction listing
    const addAuctionListing = async (listing, auctionSettings)=>{
        if (!user || user.role !== 'seller') {
            alert('You must be logged in as a seller to create auction listings.');
            return;
        }
        // Validate and sanitize listing data
        const listingValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAndSanitize({
            title: listing.title,
            description: listing.description,
            price: listing.price,
            tags: listing.tags,
            wearDuration: listing.hoursWorn
        }, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingSchemas"].createListingSchema.pick({
            title: true,
            description: true,
            price: true,
            tags: true,
            wearDuration: true
        }), {
            title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict,
            description: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict,
            tags: (tags)=>tags === null || tags === void 0 ? void 0 : tags.map((tag)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(tag))
        });
        if (!listingValidation.success) {
            console.error('Listing validation failed:', listingValidation.errors);
            alert('Please check your listing details:\n' + Object.values(listingValidation.errors || {}).join('\n'));
            return;
        }
        // Validate auction settings
        const amountValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAmount(auctionSettings.startingPrice, {
            min: 0.01,
            max: 10000
        });
        if (!amountValidation.valid) {
            alert(amountValidation.error || 'Invalid starting price');
            return;
        }
        if (auctionSettings.reservePrice) {
            const reserveValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAmount(auctionSettings.reservePrice, {
                min: auctionSettings.startingPrice,
                max: 10000
            });
            if (!reserveValidation.valid) {
                alert('Reserve price must be at least the starting price');
                return;
            }
        }
        const myListings = listings.filter((l)=>l.seller === user.username);
        const isVerified = user.isVerified || user.verificationStatus === 'verified';
        const maxListings = isVerified ? 25 : 2;
        if (myListings.length >= maxListings) {
            alert(isVerified ? 'You have reached the maximum of 25 listings for verified sellers.' : 'Unverified sellers can only have 2 active listings. Please verify your account to add more.');
            return;
        }
        try {
            const sanitizedListing = {
                ...listing,
                title: listingValidation.data.title,
                description: listingValidation.data.description,
                price: listingValidation.data.price,
                tags: listingValidation.data.tags,
                hoursWorn: listingValidation.data.wearDuration,
                seller: user.username,
                isVerified: isVerified,
                auction: auctionSettings
            };
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].createListing(sanitizedListing);
            if (result.success && result.data) {
                setListings((prev)=>[
                        ...prev,
                        result.data
                    ]);
                addSellerNotification(user.username, "🔨 You've created a new auction: \"".concat(sanitizedListing.title, '" starting at $').concat(auctionSettings.startingPrice.toFixed(2)));
                window.dispatchEvent(new CustomEvent('listingCreated', {
                    detail: {
                        listing: result.data
                    }
                }));
            } else {
                var _result_error;
                alert(((_result_error = result.error) === null || _result_error === void 0 ? void 0 : _result_error.message) || 'Failed to create auction listing. Please try again.');
            }
        } catch (error) {
            console.error('Error creating auction listing:', error);
            alert('An error occurred while creating the auction listing.');
        }
    };
    const removeListing = async (id)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].deleteListing(id);
            if (result.success) {
                setListings((prev)=>prev.filter((listing)=>listing.id !== id));
                // FIX 2: Fire event when listing is removed
                if ("TURBOPACK compile-time truthy", 1) {
                    window.dispatchEvent(new CustomEvent('listing:removed', {
                        detail: {
                            listingId: id,
                            reason: 'deleted'
                        }
                    }));
                }
                window.dispatchEvent(new CustomEvent('listingDeleted', {
                    detail: {
                        listingId: id
                    }
                }));
            } else {
                var _result_error;
                throw new Error(((_result_error = result.error) === null || _result_error === void 0 ? void 0 : _result_error.message) || 'Failed to delete listing');
            }
        } catch (error) {
            console.error('Error removing listing:', error);
            alert(error instanceof Error ? error.message : 'Failed to remove listing');
        }
    };
    const purchaseListingAndRemove = async (listing, buyerUsername)=>{
        try {
            var _listing_hoursWorn;
            // Sanitize buyer username
            const sanitizedBuyer = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(buyerUsername);
            // Convert ListingContext's Listing to the format that WalletContext expects
            const listingForWallet = {
                id: listing.id,
                title: listing.title,
                description: listing.description,
                price: listing.price,
                markedUpPrice: listing.markedUpPrice,
                seller: listing.seller,
                sellerUsername: listing.seller,
                imageUrls: listing.imageUrls,
                type: 'instant',
                status: 'active',
                category: 'panties',
                shippingIncluded: true,
                internationalShipping: false,
                createdAt: listing.date,
                updatedAt: listing.date,
                views: listing.views || 0,
                favorites: 0,
                tags: listing.tags,
                size: undefined,
                color: undefined,
                material: undefined,
                wearTime: (_listing_hoursWorn = listing.hoursWorn) === null || _listing_hoursWorn === void 0 ? void 0 : _listing_hoursWorn.toString(),
                customizations: [],
                featured: false,
                verified: listing.isVerified,
                nsfw: false
            };
            // First, process the purchase through wallet
            const success = await purchaseListing(listingForWallet, sanitizedBuyer);
            if (success) {
                // If purchase was successful, remove the listing
                // FIX 2: Add to deduplication manager before removing
                soldListingDeduplicator.current.isDuplicate(listing.id);
                await removeListing(listing.id);
                console.log('✅ Listing purchased and removed:', listing.id);
            }
            return success;
        } catch (error) {
            console.error('Error in purchaseListingAndRemove:', error);
            return false;
        }
    };
    const updateListing = async (id, updatedListing)=>{
        try {
            // Sanitize updated fields if they exist
            const sanitizedUpdate = {
                ...updatedListing
            };
            if (updatedListing.title) {
                sanitizedUpdate.title = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(updatedListing.title);
            }
            if (updatedListing.description) {
                sanitizedUpdate.description = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(updatedListing.description);
            }
            if (updatedListing.tags) {
                sanitizedUpdate.tags = updatedListing.tags.map((tag)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(tag));
            }
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].updateListing(id, sanitizedUpdate);
            if (result.success && result.data) {
                setListings((prev)=>prev.map((listing)=>listing.id === id ? result.data : listing));
            } else {
                var _result_error;
                throw new Error(((_result_error = result.error) === null || _result_error === void 0 ? void 0 : _result_error.message) || 'Failed to update listing');
            }
        } catch (error) {
            console.error('Error updating listing:', error);
            alert(error instanceof Error ? error.message : 'Failed to update listing');
        }
    };
    // CRITICAL FIX: Update placeBid to not call hooks inside
    const placeBid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ListingProvider.useCallback[placeBid]": async (listingId, bidder, amount)=>{
            try {
                var _listing_auction, _listing_auction1;
                const listing = listings.find({
                    "ListingProvider.useCallback[placeBid].listing": (l)=>l.id === listingId
                }["ListingProvider.useCallback[placeBid].listing"]);
                if (!listing) {
                    console.error('[ListingContext] Listing not found:', listingId);
                    return false;
                }
                // Check if this is an incremental bid (user raising their own bid)
                const isCurrentHighestBidder = ((_listing_auction = listing.auction) === null || _listing_auction === void 0 ? void 0 : _listing_auction.highestBidder) === bidder;
                const currentHighestBid = ((_listing_auction1 = listing.auction) === null || _listing_auction1 === void 0 ? void 0 : _listing_auction1.highestBid) || 0;
                if (isCurrentHighestBidder && currentHighestBid > 0) {
                    // For incremental bids, only charge the difference (no fee)
                    const bidDifference = amount - currentHighestBid;
                    // NOTE: Balance validation should be done in the component that calls placeBid
                    // We don't validate balance here to avoid using hooks inside this function
                    console.log("[ListingContext] Processing incremental bid: difference=".concat(bidDifference));
                }
                // Delegate to AuctionContext
                const success = await auctionPlaceBid(listingId, bidder, amount);
                if (success) {
                    // Refresh listings to get updated bid info
                    await refreshListings();
                    // Add seller notification
                    addSellerNotification(listing.seller, "💰 New bid! ".concat(bidder, " bid $").concat(amount.toFixed(2), ' on "').concat(listing.title, '"'));
                }
                return success;
            } catch (error) {
                console.error('[ListingContext] Bid error:', error);
                return false;
            }
        }
    }["ListingProvider.useCallback[placeBid]"], [
        listings,
        auctionPlaceBid,
        refreshListings,
        addSellerNotification
    ]);
    const getAuctionListings = ()=>{
        return listings.filter((listing)=>{
            var _listing_auction;
            return (_listing_auction = listing.auction) === null || _listing_auction === void 0 ? void 0 : _listing_auction.isAuction;
        });
    };
    const getActiveAuctions = ()=>{
        return listings.filter((listing)=>{
            var _listing_auction;
            return ((_listing_auction = listing.auction) === null || _listing_auction === void 0 ? void 0 : _listing_auction.isAuction) && listing.auction.status === 'active';
        });
    };
    const getEndedAuctions = ()=>{
        return listings.filter((listing)=>{
            var _listing_auction;
            return ((_listing_auction = listing.auction) === null || _listing_auction === void 0 ? void 0 : _listing_auction.isAuction) && listing.auction.status === 'ended';
        });
    };
    // FIX: Updated checkEndedAuctions to only run for sellers and admins
    const checkEndedAuctions = async ()=>{
        // Only check ended auctions if user is a seller or admin
        if (!user || user.role !== 'seller' && user.role !== 'admin') {
            return; // Skip auction checks for buyers
        }
        const activeAuctions = getActiveAuctions();
        const now = new Date();
        for (const listing of activeAuctions){
            // Only process auctions where the current user is the seller
            if (listing.auction && new Date(listing.auction.endTime) <= now && (user.username === listing.seller || user.role === 'admin')) {
                const processed = await processEndedAuction(listing);
                if (processed) {
                    // Update listing status locally
                    setListings((prev)=>prev.map((l)=>l.id === listing.id ? {
                                ...l,
                                auction: {
                                    ...l.auction,
                                    status: 'ended'
                                }
                            } : l));
                    // Remove the listing if it was sold
                    if (listing.auction.highestBidder) {
                        // FIX 2: Add to deduplication manager before removing
                        soldListingDeduplicator.current.isDuplicate(listing.id);
                        setListings((prev)=>prev.filter((l)=>l.id !== listing.id));
                        // FIX 2: Fire event for sold auction
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('listing:removed', {
                                detail: {
                                    listingId: listing.id,
                                    reason: 'auction-sold'
                                }
                            }));
                        }
                    }
                    // Notify seller with updated message for 20% fee
                    if (listing.auction.highestBidder && listing.auction.highestBid) {
                        const sellerEarnings = listing.auction.highestBid * 0.8; // 80% to seller
                        addSellerNotification(listing.seller, '🏆 Auction ended: "'.concat(listing.title, '" sold to ').concat(listing.auction.highestBidder, " for $").concat(listing.auction.highestBid.toFixed(2), ". You'll receive $").concat(sellerEarnings.toFixed(2), " (after 20% platform fee)"));
                    } else {
                        addSellerNotification(listing.seller, '🔨 Auction ended: No valid bids for "'.concat(listing.title, '"'));
                    }
                }
            }
        }
    };
    // NEW: Use AuctionContext for cancelling auctions
    const cancelAuction = async (listingId)=>{
        if (!user) return false;
        const listing = listings.find((l)=>l.id === listingId);
        if (!listing) return false;
        if (user.role !== 'admin' && user.username !== listing.seller) return false;
        const success = await auctionCancelAuction(listingId);
        if (success) {
            // Update listing locally
            setListings((prev)=>prev.map((l)=>l.id === listingId ? {
                        ...l,
                        auction: {
                            ...l.auction,
                            status: 'cancelled'
                        }
                    } : l));
            addSellerNotification(listing.seller, '🛑 You cancelled your auction: "'.concat(listing.title, '". All bidders have been refunded.'));
        }
        return success;
    };
    // Draft management functions (unchanged)
    const saveDraft = async (draft)=>{
        if (!user || user.role !== 'seller') {
            console.error('Only sellers can save drafts');
            return false;
        }
        try {
            // Sanitize draft fields - Access from formState
            const sanitizedDraft = {
                ...draft,
                formState: {
                    ...draft.formState,
                    title: draft.formState.title ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(draft.formState.title) : '',
                    description: draft.formState.description ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(draft.formState.description) : '',
                    tags: draft.formState.tags ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(draft.formState.tags) : ''
                },
                seller: user.username
            };
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].saveDraft(sanitizedDraft);
            return result.success;
        } catch (error) {
            console.error('Error saving draft:', error);
            return false;
        }
    };
    const getDrafts = async ()=>{
        if (!user || user.role !== 'seller') {
            return [];
        }
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].getDrafts(user.username);
            return result.success && result.data ? result.data : [];
        } catch (error) {
            console.error('Error getting drafts:', error);
            return [];
        }
    };
    const deleteDraft = async (draftId)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].deleteDraft(draftId);
            return result.success;
        } catch (error) {
            console.error('Error deleting draft:', error);
            return false;
        }
    };
    // Image management functions (unchanged)
    const uploadImage = async (file)=>{
        // Validate file before upload
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
            alert(fileValidation.error || 'Invalid file');
            return null;
        }
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].uploadImage(file);
            return result.success && result.data ? result.data : null;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };
    const deleteImage = async (imageUrl)=>{
        try {
            // Validate URL before deletion
            const sanitizedUrl = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].url(imageUrl);
            if (!sanitizedUrl) {
                console.error('Invalid image URL');
                return false;
            }
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listingsService"].deleteImage(sanitizedUrl);
            return result.success;
        } catch (error) {
            console.error('Error deleting image:', error);
            return false;
        }
    };
    // Subscription functions (unchanged)
    const subscribeToSeller = async (buyer, seller, price)=>{
        // Validate subscription price
        const priceValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAmount(price, {
            min: 0.01,
            max: 1000
        });
        if (!priceValidation.valid) {
            console.error('Invalid subscription price:', priceValidation.error);
            return false;
        }
        // Sanitize usernames
        const sanitizedBuyer = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(buyer);
        const sanitizedSeller = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(seller);
        const success = await subscribeToSellerWithPayment(sanitizedBuyer, sanitizedSeller, price);
        if (success) {
            setSubscriptions((prev)=>{
                const updated = {
                    ...prev,
                    [sanitizedBuyer]: [
                        ...prev[sanitizedBuyer] || [],
                        sanitizedSeller
                    ]
                };
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('subscriptions', updated);
                return updated;
            });
            // NEW: Store subscription details with the actual price paid
            const subscriptionDetails = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('subscription_details', {});
            const buyerSubs = subscriptionDetails[sanitizedBuyer] || [];
            // Remove any existing subscription to this seller
            const filteredSubs = buyerSubs.filter((sub)=>sub.seller !== sanitizedSeller);
            // Add new subscription with price
            filteredSubs.push({
                seller: sanitizedSeller,
                price: price,
                subscribedAt: new Date().toISOString()
            });
            subscriptionDetails[sanitizedBuyer] = filteredSubs;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('subscription_details', subscriptionDetails);
            addSellerNotification(sanitizedSeller, "🎉 ".concat(sanitizedBuyer, " subscribed to you!"));
        }
        return success;
    };
    // Unsubscribe from seller with API support (unchanged)
    const unsubscribeFromSeller = async (buyer, seller)=>{
        try {
            // Sanitize usernames
            const sanitizedBuyer = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(buyer);
            const sanitizedSeller = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(seller);
            console.log('[ListingContext] Unsubscribing from seller:', {
                buyer: sanitizedBuyer,
                seller: sanitizedSeller
            });
            // First, call the wallet context's unsubscribe method to handle the backend API call
            let success = false;
            // Check if the unsubscribeFromSeller method exists in wallet context
            if (walletUnsubscribeFromSeller && typeof walletUnsubscribeFromSeller === 'function') {
                success = await walletUnsubscribeFromSeller(sanitizedBuyer, sanitizedSeller);
                console.log('[ListingContext] Wallet unsubscribe result:', success);
            } else {
                console.warn('[ListingContext] Wallet unsubscribeFromSeller method not available, updating local state only');
                success = true; // Allow local state update even if wallet method isn't available
            }
            if (success) {
                // Update local subscriptions state
                setSubscriptions((prev)=>{
                    const updated = {
                        ...prev,
                        [sanitizedBuyer]: (prev[sanitizedBuyer] || []).filter((s)=>s !== sanitizedSeller)
                    };
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('subscriptions', updated);
                    return updated;
                });
                // Also remove from subscription details
                const subscriptionDetails = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('subscription_details', {});
                const buyerSubs = subscriptionDetails[sanitizedBuyer] || [];
                const filteredSubs = buyerSubs.filter((sub)=>sub.seller !== sanitizedSeller);
                subscriptionDetails[sanitizedBuyer] = filteredSubs;
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('subscription_details', subscriptionDetails);
                // Add notification to seller
                addSellerNotification(sanitizedSeller, "".concat(sanitizedBuyer, " unsubscribed from your content"));
                console.log('[ListingContext] Successfully unsubscribed and updated local state');
            } else {
                console.error('[ListingContext] Failed to unsubscribe from seller');
                throw new Error('Failed to unsubscribe. Please try again.');
            }
        } catch (error) {
            console.error('[ListingContext] Error in unsubscribeFromSeller:', error);
            throw error;
        }
    };
    const isSubscribed = (buyer, seller)=>{
        var _subscriptions_sanitizedBuyer;
        // Sanitize usernames
        const sanitizedBuyer = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(buyer);
        const sanitizedSeller = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(seller);
        var _subscriptions_sanitizedBuyer_includes;
        return (_subscriptions_sanitizedBuyer_includes = (_subscriptions_sanitizedBuyer = subscriptions[sanitizedBuyer]) === null || _subscriptions_sanitizedBuyer === void 0 ? void 0 : _subscriptions_sanitizedBuyer.includes(sanitizedSeller)) !== null && _subscriptions_sanitizedBuyer_includes !== void 0 ? _subscriptions_sanitizedBuyer_includes : false;
    };
    // Notification functions (unchanged)
    const getCurrentSellerNotifications = ()=>{
        if (!user || user.role !== 'seller') {
            return [];
        }
        const userNotifications = notificationStore[user.username] || [];
        return userNotifications.map(normalizeNotification);
    };
    const clearSellerNotification = (notificationId)=>{
        if (!user || user.role !== 'seller') {
            return;
        }
        const username = user.username;
        const userNotifications = notificationStore[username] || [];
        setNotificationStore((prev)=>{
            const updatedNotifications = userNotifications.map((item, index)=>{
                const notification = normalizeNotification(item);
                const shouldClear = typeof notificationId === 'string' ? notification.id === notificationId : index === notificationId;
                if (shouldClear) {
                    return {
                        ...notification,
                        cleared: true
                    };
                }
                return notification;
            });
            const updated = {
                ...prev,
                [username]: updatedNotifications
            };
            saveNotificationStore(updated);
            return updated;
        });
    };
    const restoreSellerNotification = (notificationId)=>{
        if (!user || user.role !== 'seller') {
            return;
        }
        const username = user.username;
        const userNotifications = notificationStore[username] || [];
        setNotificationStore((prev)=>{
            const updatedNotifications = userNotifications.map((item)=>{
                const notification = normalizeNotification(item);
                if (notification.id === notificationId) {
                    return {
                        ...notification,
                        cleared: false
                    };
                }
                return notification;
            });
            const updated = {
                ...prev,
                [username]: updatedNotifications
            };
            saveNotificationStore(updated);
            return updated;
        });
    };
    const permanentlyDeleteSellerNotification = (notificationId)=>{
        if (!user || user.role !== 'seller') {
            return;
        }
        const username = user.username;
        const userNotifications = notificationStore[username] || [];
        setNotificationStore((prev)=>{
            const updatedNotifications = userNotifications.filter((item)=>{
                const notification = normalizeNotification(item);
                return notification.id !== notificationId;
            });
            const updated = {
                ...prev,
                [username]: updatedNotifications
            };
            saveNotificationStore(updated);
            return updated;
        });
    };
    // Verification functions (unchanged)
    const requestVerification = async (docs)=>{
        if (!user) return;
        console.log('🔍 requestVerification called with user:', user.username);
        const code = docs.code || "VERIF-".concat(user.username, "-").concat(Math.floor(100000 + Math.random() * 900000));
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].requestVerification(user.username, {
                ...docs,
                code
            });
            if (result.success) {
                await updateUser({
                    verificationStatus: 'pending',
                    verificationRequestedAt: new Date().toISOString(),
                    verificationDocs: {
                        ...docs,
                        code
                    }
                });
                // Also update the legacy users store for admin functionality
                const updatedUser = {
                    ...user,
                    verificationStatus: 'pending',
                    verificationDocs: {
                        ...docs,
                        code
                    },
                    verificationRequestedAt: new Date().toISOString()
                };
                await persistUsers({
                    ...users,
                    [user.username]: updatedUser
                });
                console.log('✅ Verification request submitted for:', user.username);
            } else {
                console.error('Failed to submit verification request:', result.error);
                alert('Failed to submit verification request. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting verification request:', error);
            alert('An error occurred while submitting verification request.');
        }
    };
    const setVerificationStatus = async (username, status, rejectionReason)=>{
        // Sanitize inputs
        const sanitizedUsername = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(username);
        const sanitizedReason = rejectionReason ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(rejectionReason) : undefined;
        const existingUser = users[sanitizedUsername];
        if (!existingUser) return;
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usersService"].updateVerificationStatus(sanitizedUsername, {
                status,
                rejectionReason: sanitizedReason,
                adminUsername: (user === null || user === void 0 ? void 0 : user.username) || 'admin'
            });
            if (result.success) {
                const updatedUser = {
                    ...existingUser,
                    verificationStatus: status,
                    verified: status === 'verified',
                    verificationReviewedAt: new Date().toISOString(),
                    verificationRejectionReason: sanitizedReason
                };
                // Also update AuthContext if this is the current user
                if ((user === null || user === void 0 ? void 0 : user.username) === sanitizedUsername) {
                    await updateUser({
                        verificationStatus: status,
                        isVerified: status === 'verified',
                        verificationRejectionReason: sanitizedReason
                    });
                }
                await persistUsers({
                    ...users,
                    [sanitizedUsername]: updatedUser
                });
                setListings((prev)=>{
                    return prev.map((listing)=>{
                        if (listing.seller === sanitizedUsername) {
                            return {
                                ...listing,
                                isVerified: status === 'verified'
                            };
                        }
                        return listing;
                    });
                });
            } else {
                console.error('Failed to update verification status:', result.error);
                alert('Failed to update verification status. Please try again.');
            }
        } catch (error) {
            console.error('Error updating verification status:', error);
            alert('An error occurred while updating verification status.');
        }
    };
    const sellerNotifications = getCurrentSellerNotifications();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ListingContext.Provider, {
        value: {
            isAuthReady,
            listings,
            addListing,
            addAuctionListing,
            removeListing,
            updateListing,
            purchaseListingAndRemove,
            placeBid,
            getAuctionListings,
            getActiveAuctions,
            getEndedAuctions,
            checkEndedAuctions,
            cancelAuction,
            saveDraft,
            getDrafts,
            deleteDraft,
            uploadImage,
            deleteImage,
            subscriptions,
            subscribeToSeller,
            unsubscribeFromSeller,
            isSubscribed,
            sellerNotifications,
            addSellerNotification,
            clearSellerNotification,
            restoreSellerNotification,
            permanentlyDeleteSellerNotification,
            requestVerification,
            setVerificationStatus,
            users,
            orderHistory,
            latestOrder,
            isLoading,
            error,
            refreshListings
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/ListingContext.tsx",
        lineNumber: 1467,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ListingProvider, "Jfu+PotgU6E3+HRhOlyeLMj2mUA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWallet"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuctionContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuction"]
    ];
});
_c = ListingProvider;
const useListings = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ListingContext);
    if (!context) throw new Error('useListings must be used within a ListingProvider');
    return context;
};
_s1(useListings, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "ListingProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/MessageContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/context/MessageContext.tsx
__turbopack_context__.s({
    "MessageProvider": ()=>MessageProvider,
    "getReportCount": ()=>getReportCount,
    "useMessages": ()=>useMessages
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm-browser/v4.js [app-client] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/messages.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
// Import WebSocket context
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
const MessageContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Helper to create a consistent conversation key
const getConversationKey = (userA, userB)=>{
    return [
        userA,
        userB
    ].sort().join('-');
};
// Validation schemas
const customRequestMetaSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.title,
    price: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.price,
    message: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.description
});
const MessageProvider = (param)=>{
    let { children } = param;
    _s();
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [blockedUsers, setBlockedUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [reportedUsers, setReportedUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [reportLogs, setReportLogs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [messageNotifications, setMessageNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [updateTrigger, setUpdateTrigger] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    // Use WebSocket context - with safe fallback
    const wsContext = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"] ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"])() : null;
    const { subscribe, isConnected } = wsContext || {
        subscribe: null,
        isConnected: false
    };
    // Track processed message IDs to prevent duplicates
    const processedMessageIds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const optimisticMessageMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map()); // optimisticId -> realId
    const subscriptionsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    // Initialize service on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MessageProvider.useEffect": ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messagesService"].initialize();
        }
    }["MessageProvider.useEffect"], []);
    // Load initial data using services
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MessageProvider.useEffect": ()=>{
            const loadData = {
                "MessageProvider.useEffect.loadData": async ()=>{
                    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                    ;
                    try {
                        setIsLoading(true);
                        // Load messages
                        const storedMessages = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_messages', {});
                        // Ensure we have a valid object
                        if (storedMessages && typeof storedMessages === 'object') {
                            // Migrate old format if needed
                            const needsMigration = Object.values(storedMessages).some({
                                "MessageProvider.useEffect.loadData.needsMigration": (value)=>!Array.isArray(value) || value.length > 0 && !value[0].sender
                            }["MessageProvider.useEffect.loadData.needsMigration"]);
                            if (needsMigration) {
                                console.log('Migrating message format...');
                                const migrated = {};
                                Object.entries(storedMessages).forEach({
                                    "MessageProvider.useEffect.loadData": (param)=>{
                                        let [key, msgs] = param;
                                        if (Array.isArray(msgs)) {
                                            msgs.forEach({
                                                "MessageProvider.useEffect.loadData": (msg)=>{
                                                    if (msg.sender && msg.receiver) {
                                                        const conversationKey = getConversationKey(msg.sender, msg.receiver);
                                                        if (!migrated[conversationKey]) {
                                                            migrated[conversationKey] = [];
                                                        }
                                                        migrated[conversationKey].push({
                                                            ...msg,
                                                            content: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(msg.content || '')
                                                        });
                                                    }
                                                }
                                            }["MessageProvider.useEffect.loadData"]);
                                        }
                                    }
                                }["MessageProvider.useEffect.loadData"]);
                                setMessages(migrated);
                                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', migrated);
                            } else {
                                // Sanitize existing messages
                                const sanitized = {};
                                Object.entries(storedMessages).forEach({
                                    "MessageProvider.useEffect.loadData": (param)=>{
                                        let [key, msgs] = param;
                                        sanitized[key] = msgs.map({
                                            "MessageProvider.useEffect.loadData": (msg)=>({
                                                    ...msg,
                                                    content: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(msg.content || '')
                                                })
                                        }["MessageProvider.useEffect.loadData"]);
                                    }
                                }["MessageProvider.useEffect.loadData"]);
                                setMessages(sanitized);
                            }
                        }
                        // Load blocked users
                        const blocked = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_blocked', {});
                        setBlockedUsers(blocked || {});
                        // Load reported users
                        const reported = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_reported', {});
                        setReportedUsers(reported || {});
                        // Load report logs
                        const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
                        setReportLogs(reports || []);
                        // Load message notifications
                        const notifications = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_message_notifications', {});
                        setMessageNotifications(notifications || {});
                    } catch (error) {
                        console.error('Error loading message data:', error);
                    } finally{
                        setIsLoading(false);
                    }
                }
            }["MessageProvider.useEffect.loadData"];
            loadData();
        }
    }["MessageProvider.useEffect"], []);
    // FIXED: WebSocket listener for new messages - handle optimistic updates properly
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MessageProvider.useEffect": ()=>{
            // Clean up previous subscriptions
            subscriptionsRef.current.forEach({
                "MessageProvider.useEffect": (unsub)=>unsub()
            }["MessageProvider.useEffect"]);
            subscriptionsRef.current = [];
            if (!subscribe) {
                console.log('[MessageContext] WebSocket subscribe not available');
                return;
            }
            console.log('[MessageContext] Setting up WebSocket listeners, connected:', isConnected);
            // Subscribe to new message events
            const unsubscribeNewMessage = subscribe('message:new', {
                "MessageProvider.useEffect.unsubscribeNewMessage": (data)=>{
                    console.log('[MessageContext] New message received via WebSocket:', data);
                    if (data && data.sender && data.receiver) {
                        const conversationKey = getConversationKey(data.sender, data.receiver);
                        // Check if we've already processed this message ID
                        if (data.id && processedMessageIds.current.has(data.id)) {
                            console.log('[MessageContext] Message already processed, skipping:', data.id);
                            return;
                        }
                        if (data.id) {
                            processedMessageIds.current.add(data.id);
                            // Clean up old IDs to prevent memory leak
                            if (processedMessageIds.current.size > 1000) {
                                const idsArray = Array.from(processedMessageIds.current);
                                processedMessageIds.current = new Set(idsArray.slice(-500));
                            }
                        }
                        const newMessage = {
                            id: data.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                            sender: data.sender,
                            receiver: data.receiver,
                            content: data.content || '',
                            date: data.date || data.createdAt || new Date().toISOString(),
                            isRead: data.isRead || false,
                            read: data.read || false,
                            type: data.type || 'normal',
                            meta: data.meta,
                            threadId: data.threadId || conversationKey,
                            _optimisticId: data._optimisticId
                        };
                        console.log('[MessageContext] Processing message for conversation:', conversationKey);
                        // Update messages state
                        setMessages({
                            "MessageProvider.useEffect.unsubscribeNewMessage": (prev)=>{
                                const existingMessages = prev[conversationKey] || [];
                                // Check if this is a confirmation of an optimistic message
                                if (data._optimisticId) {
                                    // Store the mapping
                                    optimisticMessageMap.current.set(data._optimisticId, newMessage.id);
                                    // Remove the optimistic message and add the confirmed one
                                    const withoutOptimistic = existingMessages.filter({
                                        "MessageProvider.useEffect.unsubscribeNewMessage.withoutOptimistic": (m)=>m._optimisticId !== data._optimisticId
                                    }["MessageProvider.useEffect.unsubscribeNewMessage.withoutOptimistic"]);
                                    // Check if the confirmed message already exists
                                    const isDuplicate = withoutOptimistic.some({
                                        "MessageProvider.useEffect.unsubscribeNewMessage.isDuplicate": (m)=>m.id && m.id === newMessage.id
                                    }["MessageProvider.useEffect.unsubscribeNewMessage.isDuplicate"]);
                                    if (isDuplicate) {
                                        console.log('[MessageContext] Confirmed message already exists, skipping');
                                        return prev;
                                    }
                                    const updatedMessages = {
                                        ...prev,
                                        [conversationKey]: [
                                            ...withoutOptimistic,
                                            newMessage
                                        ]
                                    };
                                    console.log('[MessageContext] Replaced optimistic message with confirmed message');
                                    // Save to storage
                                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', updatedMessages).catch({
                                        "MessageProvider.useEffect.unsubscribeNewMessage": (err)=>console.error('[MessageContext] Failed to save messages:', err)
                                    }["MessageProvider.useEffect.unsubscribeNewMessage"]);
                                    return updatedMessages;
                                }
                                // Check if message already exists (by ID or by content+timestamp for duplicates)
                                const isDuplicate = existingMessages.some({
                                    "MessageProvider.useEffect.unsubscribeNewMessage.isDuplicate": (m)=>{
                                        if (m.id && m.id === newMessage.id) return true;
                                        // Check for duplicate by content and approximate time (within 2 seconds)
                                        if (m.sender === newMessage.sender && m.receiver === newMessage.receiver && m.content === newMessage.content) {
                                            const timeDiff = Math.abs(new Date(m.date).getTime() - new Date(newMessage.date).getTime());
                                            return timeDiff < 2000;
                                        }
                                        return false;
                                    }
                                }["MessageProvider.useEffect.unsubscribeNewMessage.isDuplicate"]);
                                if (isDuplicate) {
                                    console.log('[MessageContext] Duplicate message detected, skipping');
                                    return prev;
                                }
                                const updatedMessages = {
                                    ...prev,
                                    [conversationKey]: [
                                        ...existingMessages,
                                        newMessage
                                    ]
                                };
                                console.log('[MessageContext] Added new message to conversation');
                                // Save to storage
                                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', updatedMessages).catch({
                                    "MessageProvider.useEffect.unsubscribeNewMessage": (err)=>console.error('[MessageContext] Failed to save messages:', err)
                                }["MessageProvider.useEffect.unsubscribeNewMessage"]);
                                return updatedMessages;
                            }
                        }["MessageProvider.useEffect.unsubscribeNewMessage"]);
                        // Force a re-render to ensure UI updates
                        setUpdateTrigger({
                            "MessageProvider.useEffect.unsubscribeNewMessage": (prev)=>{
                                console.log('[MessageContext] Triggering update:', prev + 1);
                                return prev + 1;
                            }
                        }["MessageProvider.useEffect.unsubscribeNewMessage"]);
                        // Update notifications if it's not a custom request
                        if (data.type !== 'customRequest') {
                            setMessageNotifications({
                                "MessageProvider.useEffect.unsubscribeNewMessage": (prev)=>{
                                    const sellerNotifs = prev[data.receiver] || [];
                                    const existingIndex = sellerNotifs.findIndex({
                                        "MessageProvider.useEffect.unsubscribeNewMessage.existingIndex": (n)=>n.buyer === data.sender
                                    }["MessageProvider.useEffect.unsubscribeNewMessage.existingIndex"]);
                                    if (existingIndex >= 0) {
                                        const updated = [
                                            ...sellerNotifs
                                        ];
                                        updated[existingIndex] = {
                                            buyer: data.sender,
                                            messageCount: updated[existingIndex].messageCount + 1,
                                            lastMessage: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
                                            timestamp: new Date().toISOString()
                                        };
                                        return {
                                            ...prev,
                                            [data.receiver]: updated
                                        };
                                    } else {
                                        return {
                                            ...prev,
                                            [data.receiver]: [
                                                ...sellerNotifs,
                                                {
                                                    buyer: data.sender,
                                                    messageCount: 1,
                                                    lastMessage: data.content.substring(0, 50) + (data.content.length > 50 ? '...' : ''),
                                                    timestamp: new Date().toISOString()
                                                }
                                            ]
                                        };
                                    }
                                }
                            }["MessageProvider.useEffect.unsubscribeNewMessage"]);
                        }
                        // Emit a custom event for components to listen to
                        if ("TURBOPACK compile-time truthy", 1) {
                            console.log('[MessageContext] Dispatching DOM event for new message');
                            window.dispatchEvent(new CustomEvent('message:new', {
                                detail: newMessage
                            }));
                        }
                    }
                }
            }["MessageProvider.useEffect.unsubscribeNewMessage"]);
            // Also listen for message:read events
            const unsubscribeRead = subscribe('message:read', {
                "MessageProvider.useEffect.unsubscribeRead": (data)=>{
                    console.log('[MessageContext] Messages marked as read via WebSocket:', data);
                    if (data && data.threadId && data.messageIds) {
                        setMessages({
                            "MessageProvider.useEffect.unsubscribeRead": (prev)=>{
                                const updatedMessages = {
                                    ...prev
                                };
                                if (updatedMessages[data.threadId]) {
                                    updatedMessages[data.threadId] = updatedMessages[data.threadId].map({
                                        "MessageProvider.useEffect.unsubscribeRead": (msg)=>{
                                            // Check both real ID and optimistic ID mapping
                                            const realId = msg._optimisticId ? optimisticMessageMap.current.get(msg._optimisticId) || msg.id : msg.id;
                                            if (realId && data.messageIds.includes(realId)) {
                                                return {
                                                    ...msg,
                                                    isRead: true,
                                                    read: true
                                                };
                                            }
                                            return msg;
                                        }
                                    }["MessageProvider.useEffect.unsubscribeRead"]);
                                }
                                // Save to storage
                                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', updatedMessages).catch({
                                    "MessageProvider.useEffect.unsubscribeRead": (err)=>console.error('[MessageContext] Failed to save messages after read update:', err)
                                }["MessageProvider.useEffect.unsubscribeRead"]);
                                return updatedMessages;
                            }
                        }["MessageProvider.useEffect.unsubscribeRead"]);
                        // Emit DOM event for read status update
                        if ("TURBOPACK compile-time truthy", 1) {
                            window.dispatchEvent(new CustomEvent('message:read', {
                                detail: data
                            }));
                        }
                        // Force a re-render
                        setUpdateTrigger({
                            "MessageProvider.useEffect.unsubscribeRead": (prev)=>prev + 1
                        }["MessageProvider.useEffect.unsubscribeRead"]);
                    }
                }
            }["MessageProvider.useEffect.unsubscribeRead"]);
            subscriptionsRef.current = [
                unsubscribeNewMessage,
                unsubscribeRead
            ];
            return ({
                "MessageProvider.useEffect": ()=>{
                    console.log('[MessageContext] Cleaning up WebSocket listeners');
                    subscriptionsRef.current.forEach({
                        "MessageProvider.useEffect": (unsub)=>unsub()
                    }["MessageProvider.useEffect"]);
                    subscriptionsRef.current = [];
                }
            })["MessageProvider.useEffect"];
        }
    }["MessageProvider.useEffect"], [
        subscribe,
        isConnected
    ]);
    // Save data whenever it changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MessageProvider.useEffect": ()=>{
            if ("object" !== 'undefined' && !isLoading) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', messages);
            }
        }
    }["MessageProvider.useEffect"], [
        messages,
        isLoading
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MessageProvider.useEffect": ()=>{
            if ("object" !== 'undefined' && !isLoading) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_blocked', blockedUsers);
            }
        }
    }["MessageProvider.useEffect"], [
        blockedUsers,
        isLoading
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MessageProvider.useEffect": ()=>{
            if ("object" !== 'undefined' && !isLoading) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_reported', reportedUsers);
            }
        }
    }["MessageProvider.useEffect"], [
        reportedUsers,
        isLoading
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MessageProvider.useEffect": ()=>{
            if ("object" !== 'undefined' && !isLoading) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_report_logs', reportLogs);
            }
        }
    }["MessageProvider.useEffect"], [
        reportLogs,
        isLoading
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MessageProvider.useEffect": ()=>{
            if ("object" !== 'undefined' && !isLoading) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_message_notifications', messageNotifications);
            }
        }
    }["MessageProvider.useEffect"], [
        messageNotifications,
        isLoading
    ]);
    // FIXED: Send message with optimistic ID tracking
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[sendMessage]": async (sender, receiver, content, options)=>{
            var _options_meta, _options_meta1;
            // Validate inputs
            if (!sender || !receiver) {
                console.error('Invalid sender or receiver');
                return;
            }
            if (!content.trim() && !(options === null || options === void 0 ? void 0 : (_options_meta = options.meta) === null || _options_meta === void 0 ? void 0 : _options_meta.imageUrl)) {
                console.error('Cannot send empty message without image');
                return;
            }
            // For image messages, allow empty content or provide default
            let sanitizedContent = content;
            if ((options === null || options === void 0 ? void 0 : options.type) === 'image' && !content.trim() && (options === null || options === void 0 ? void 0 : (_options_meta1 = options.meta) === null || _options_meta1 === void 0 ? void 0 : _options_meta1.imageUrl)) {
                sanitizedContent = 'Image shared';
            }
            // Validate message content only if we have content to validate
            if (sanitizedContent.trim()) {
                const contentValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messageSchemas"].messageContent.safeParse(sanitizedContent);
                if (!contentValidation.success) {
                    console.error('Invalid message content:', contentValidation.error);
                    return;
                }
                sanitizedContent = contentValidation.data;
            }
            // Validate and sanitize meta fields if present
            let sanitizedMeta = options === null || options === void 0 ? void 0 : options.meta;
            if (sanitizedMeta) {
                var _sanitizedMeta_tags;
                sanitizedMeta = {
                    ...sanitizedMeta,
                    title: sanitizedMeta.title ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(sanitizedMeta.title) : undefined,
                    message: sanitizedMeta.message ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(sanitizedMeta.message) : undefined,
                    tags: (_sanitizedMeta_tags = sanitizedMeta.tags) === null || _sanitizedMeta_tags === void 0 ? void 0 : _sanitizedMeta_tags.map({
                        "MessageProvider.useCallback[sendMessage]": (tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag).slice(0, 30)
                    }["MessageProvider.useCallback[sendMessage]"])
                };
            }
            try {
                // Include optimistic ID if provided
                const messageData = {
                    sender,
                    receiver,
                    content: sanitizedContent,
                    type: options === null || options === void 0 ? void 0 : options.type,
                    meta: sanitizedMeta,
                    _optimisticId: options === null || options === void 0 ? void 0 : options._optimisticId
                };
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messagesService"].sendMessage(messageData);
                if (result.success && result.data) {
                    // DON'T add the message to local state here - let WebSocket handle it
                    // This prevents duplicates
                    console.log('Message sent successfully, waiting for WebSocket confirmation');
                    // Only update notifications locally since WebSocket won't handle this
                    if ((options === null || options === void 0 ? void 0 : options.type) !== 'customRequest') {
                        setMessageNotifications({
                            "MessageProvider.useCallback[sendMessage]": (prev)=>{
                                const sellerNotifs = prev[receiver] || [];
                                const existingIndex = sellerNotifs.findIndex({
                                    "MessageProvider.useCallback[sendMessage].existingIndex": (n)=>n.buyer === sender
                                }["MessageProvider.useCallback[sendMessage].existingIndex"]);
                                if (existingIndex >= 0) {
                                    const updated = [
                                        ...sellerNotifs
                                    ];
                                    updated[existingIndex] = {
                                        buyer: sender,
                                        messageCount: updated[existingIndex].messageCount + 1,
                                        lastMessage: sanitizedContent.substring(0, 50) + (sanitizedContent.length > 50 ? '...' : ''),
                                        timestamp: new Date().toISOString()
                                    };
                                    return {
                                        ...prev,
                                        [receiver]: updated
                                    };
                                } else {
                                    return {
                                        ...prev,
                                        [receiver]: [
                                            ...sellerNotifs,
                                            {
                                                buyer: sender,
                                                messageCount: 1,
                                                lastMessage: sanitizedContent.substring(0, 50) + (sanitizedContent.length > 50 ? '...' : ''),
                                                timestamp: new Date().toISOString()
                                            }
                                        ]
                                    };
                                }
                            }
                        }["MessageProvider.useCallback[sendMessage]"]);
                    }
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    }["MessageProvider.useCallback[sendMessage]"], []);
    const sendCustomRequest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[sendCustomRequest]": (buyer, seller, content, title, price, tags, listingId)=>{
            // Validate custom request data
            const validation = customRequestMetaSchema.safeParse({
                title,
                price,
                message: content
            });
            if (!validation.success) {
                console.error('Invalid custom request:', validation.error);
                return;
            }
            sendMessage(buyer, seller, validation.data.message, {
                type: 'customRequest',
                meta: {
                    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    title: validation.data.title,
                    price: validation.data.price,
                    tags: tags.map({
                        "MessageProvider.useCallback[sendCustomRequest]": (tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag).slice(0, 30)
                    }["MessageProvider.useCallback[sendCustomRequest]"]),
                    message: validation.data.message
                }
            });
        }
    }["MessageProvider.useCallback[sendCustomRequest]"], [
        sendMessage
    ]);
    const getMessagesForUsers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[getMessagesForUsers]": (userA, userB)=>{
            const conversationKey = getConversationKey(userA, userB);
            return messages[conversationKey] || [];
        }
    }["MessageProvider.useCallback[getMessagesForUsers]"], [
        messages,
        updateTrigger
    ]); // Add updateTrigger to dependencies
    const getThreadsForUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[getThreadsForUser]": (username, role)=>{
            const threads = {};
            Object.entries(messages).forEach({
                "MessageProvider.useCallback[getThreadsForUser]": (param)=>{
                    let [key, msgs] = param;
                    msgs.forEach({
                        "MessageProvider.useCallback[getThreadsForUser]": (msg)=>{
                            if (msg.sender === username || msg.receiver === username) {
                                const otherParty = msg.sender === username ? msg.receiver : msg.sender;
                                if (!threads[otherParty]) {
                                    threads[otherParty] = [];
                                }
                                threads[otherParty].push(msg);
                            }
                        }
                    }["MessageProvider.useCallback[getThreadsForUser]"]);
                }
            }["MessageProvider.useCallback[getThreadsForUser]"]);
            Object.values(threads).forEach({
                "MessageProvider.useCallback[getThreadsForUser]": (thread)=>{
                    thread.sort({
                        "MessageProvider.useCallback[getThreadsForUser]": (a, b)=>new Date(a.date).getTime() - new Date(b.date).getTime()
                    }["MessageProvider.useCallback[getThreadsForUser]"]);
                }
            }["MessageProvider.useCallback[getThreadsForUser]"]);
            return threads;
        }
    }["MessageProvider.useCallback[getThreadsForUser]"], [
        messages,
        updateTrigger
    ]); // Add updateTrigger to dependencies
    const getThreadInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[getThreadInfo]": (username, otherParty)=>{
            const conversationKey = getConversationKey(username, otherParty);
            const threadMessages = messages[conversationKey] || [];
            const unreadCount = threadMessages.filter({
                "MessageProvider.useCallback[getThreadInfo]": (msg)=>msg.receiver === username && !msg.read && !msg.isRead
            }["MessageProvider.useCallback[getThreadInfo]"]).length;
            const lastMessage = threadMessages.length > 0 ? threadMessages[threadMessages.length - 1] : null;
            return {
                unreadCount,
                lastMessage,
                otherParty
            };
        }
    }["MessageProvider.useCallback[getThreadInfo]"], [
        messages,
        updateTrigger
    ]); // Add updateTrigger to dependencies
    const getAllThreadsInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[getAllThreadsInfo]": (username, role)=>{
            const threads = getThreadsForUser(username, role);
            const threadInfos = {};
            Object.keys(threads).forEach({
                "MessageProvider.useCallback[getAllThreadsInfo]": (otherParty)=>{
                    threadInfos[otherParty] = getThreadInfo(username, otherParty);
                }
            }["MessageProvider.useCallback[getAllThreadsInfo]"]);
            return threadInfos;
        }
    }["MessageProvider.useCallback[getAllThreadsInfo]"], [
        getThreadsForUser,
        getThreadInfo
    ]);
    const markMessagesAsRead = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[markMessagesAsRead]": async (userA, userB)=>{
            try {
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messagesService"].markMessagesAsRead(userA, userB);
                if (result.success) {
                    const conversationKey = getConversationKey(userA, userB);
                    setMessages({
                        "MessageProvider.useCallback[markMessagesAsRead]": (prev)=>{
                            const conversationMessages = prev[conversationKey] || [];
                            const updatedMessages = conversationMessages.map({
                                "MessageProvider.useCallback[markMessagesAsRead].updatedMessages": (msg)=>msg.receiver === userA && msg.sender === userB && !msg.read ? {
                                        ...msg,
                                        read: true,
                                        isRead: true
                                    } : msg
                            }["MessageProvider.useCallback[markMessagesAsRead].updatedMessages"]);
                            const updated = {
                                ...prev,
                                [conversationKey]: updatedMessages
                            };
                            // Save to storage
                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', updated).catch({
                                "MessageProvider.useCallback[markMessagesAsRead]": (err)=>console.error('[MessageContext] Failed to save messages after marking read:', err)
                            }["MessageProvider.useCallback[markMessagesAsRead]"]);
                            return updated;
                        }
                    }["MessageProvider.useCallback[markMessagesAsRead]"]);
                    clearMessageNotifications(userA, userB);
                    // Force a re-render
                    setUpdateTrigger({
                        "MessageProvider.useCallback[markMessagesAsRead]": (prev)=>prev + 1
                    }["MessageProvider.useCallback[markMessagesAsRead]"]);
                }
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        }
    }["MessageProvider.useCallback[markMessagesAsRead]"], []);
    const clearMessageNotifications = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[clearMessageNotifications]": (seller, buyer)=>{
            setMessageNotifications({
                "MessageProvider.useCallback[clearMessageNotifications]": (prev)=>{
                    const sellerNotifs = prev[seller] || [];
                    const filtered = sellerNotifs.filter({
                        "MessageProvider.useCallback[clearMessageNotifications].filtered": (n)=>n.buyer !== buyer
                    }["MessageProvider.useCallback[clearMessageNotifications].filtered"]);
                    if (filtered.length === sellerNotifs.length) {
                        return prev;
                    }
                    return {
                        ...prev,
                        [seller]: filtered
                    };
                }
            }["MessageProvider.useCallback[clearMessageNotifications]"]);
        }
    }["MessageProvider.useCallback[clearMessageNotifications]"], []);
    const blockUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[blockUser]": async (blocker, blockee)=>{
            try {
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messagesService"].blockUser({
                    blocker,
                    blocked: blockee
                });
                if (result.success) {
                    setBlockedUsers({
                        "MessageProvider.useCallback[blockUser]": (prev)=>{
                            const blockerList = prev[blocker] || [];
                            if (!blockerList.includes(blockee)) {
                                return {
                                    ...prev,
                                    [blocker]: [
                                        ...blockerList,
                                        blockee
                                    ]
                                };
                            }
                            return prev;
                        }
                    }["MessageProvider.useCallback[blockUser]"]);
                }
            } catch (error) {
                console.error('Error blocking user:', error);
            }
        }
    }["MessageProvider.useCallback[blockUser]"], []);
    const unblockUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[unblockUser]": async (blocker, blockee)=>{
            try {
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messagesService"].unblockUser({
                    blocker,
                    blocked: blockee
                });
                if (result.success) {
                    setBlockedUsers({
                        "MessageProvider.useCallback[unblockUser]": (prev)=>{
                            const blockerList = prev[blocker] || [];
                            return {
                                ...prev,
                                [blocker]: blockerList.filter({
                                    "MessageProvider.useCallback[unblockUser]": (b)=>b !== blockee
                                }["MessageProvider.useCallback[unblockUser]"])
                            };
                        }
                    }["MessageProvider.useCallback[unblockUser]"]);
                }
            } catch (error) {
                console.error('Error unblocking user:', error);
            }
        }
    }["MessageProvider.useCallback[unblockUser]"], []);
    const reportUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[reportUser]": async (reporter, reportee)=>{
            const conversationKey = getConversationKey(reporter, reportee);
            const reportMessages = messages[conversationKey] || [];
            try {
                const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messagesService"].reportUser({
                    reporter,
                    reportee,
                    messages: reportMessages
                });
                if (result.success) {
                    setReportedUsers({
                        "MessageProvider.useCallback[reportUser]": (prev)=>{
                            const reporterList = prev[reporter] || [];
                            if (!reporterList.includes(reportee)) {
                                return {
                                    ...prev,
                                    [reporter]: [
                                        ...reporterList,
                                        reportee
                                    ]
                                };
                            }
                            return prev;
                        }
                    }["MessageProvider.useCallback[reportUser]"]);
                    const newReport = {
                        id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2d$browser$2f$v4$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                        reporter,
                        reportee,
                        messages: reportMessages,
                        date: new Date().toISOString(),
                        processed: false,
                        category: 'other'
                    };
                    setReportLogs({
                        "MessageProvider.useCallback[reportUser]": (prev)=>[
                                ...prev,
                                newReport
                            ]
                    }["MessageProvider.useCallback[reportUser]"]);
                }
            } catch (error) {
                console.error('Error reporting user:', error);
            }
        }
    }["MessageProvider.useCallback[reportUser]"], [
        messages
    ]);
    const isBlocked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[isBlocked]": (blocker, blockee)=>{
            var _blockedUsers_blocker;
            var _blockedUsers_blocker_includes;
            return (_blockedUsers_blocker_includes = (_blockedUsers_blocker = blockedUsers[blocker]) === null || _blockedUsers_blocker === void 0 ? void 0 : _blockedUsers_blocker.includes(blockee)) !== null && _blockedUsers_blocker_includes !== void 0 ? _blockedUsers_blocker_includes : false;
        }
    }["MessageProvider.useCallback[isBlocked]"], [
        blockedUsers
    ]);
    const hasReported = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[hasReported]": (reporter, reportee)=>{
            var _reportedUsers_reporter;
            var _reportedUsers_reporter_includes;
            return (_reportedUsers_reporter_includes = (_reportedUsers_reporter = reportedUsers[reporter]) === null || _reportedUsers_reporter === void 0 ? void 0 : _reportedUsers_reporter.includes(reportee)) !== null && _reportedUsers_reporter_includes !== void 0 ? _reportedUsers_reporter_includes : false;
        }
    }["MessageProvider.useCallback[hasReported]"], [
        reportedUsers
    ]);
    const getReportCount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[getReportCount]": ()=>{
            return reportLogs.filter({
                "MessageProvider.useCallback[getReportCount]": (report)=>!report.processed
            }["MessageProvider.useCallback[getReportCount]"]).length;
        }
    }["MessageProvider.useCallback[getReportCount]"], [
        reportLogs
    ]);
    // Add a method to force refresh messages
    const refreshMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MessageProvider.useCallback[refreshMessages]": ()=>{
            console.log('[MessageContext] Force refresh triggered');
            setUpdateTrigger({
                "MessageProvider.useCallback[refreshMessages]": (prev)=>prev + 1
            }["MessageProvider.useCallback[refreshMessages]"]);
        }
    }["MessageProvider.useCallback[refreshMessages]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MessageContext.Provider, {
        value: {
            messages,
            isLoading,
            sendMessage,
            sendCustomRequest,
            getMessagesForUsers,
            getThreadsForUser,
            getThreadInfo,
            getAllThreadsInfo,
            markMessagesAsRead,
            blockUser,
            unblockUser,
            reportUser,
            isBlocked,
            hasReported,
            getReportCount,
            blockedUsers,
            reportedUsers,
            reportLogs,
            messageNotifications,
            clearMessageNotifications,
            refreshMessages
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/MessageContext.tsx",
        lineNumber: 840,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(MessageProvider, "QppeTGochuexHyQO6NoaqS8TLik=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"]
    ];
});
_c = MessageProvider;
const useMessages = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(MessageContext);
    if (!context) {
        throw new Error('useMessages must be used within a MessageProvider');
    }
    return context;
};
_s1(useMessages, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const getReportCount = async ()=>{
    try {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const reports = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_report_logs', []);
        if (!Array.isArray(reports)) return 0;
        const pendingReports = reports.filter((report)=>report && typeof report === 'object' && !report.processed);
        return pendingReports.length;
    } catch (error) {
        console.error('Error getting external report count:', error);
        return 0;
    }
};
var _c;
__turbopack_context__.k.register(_c, "MessageProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/ReviewContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/context/ReviewContext.tsx
__turbopack_context__.s({
    "ReviewProvider": ()=>ReviewProvider,
    "useReviews": ()=>useReviews
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reviews$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/reviews.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
// Validation schema for reviews
const reviewSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    rating: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(5),
    comment: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10, 'Review must be at least 10 characters').max(500, 'Review must be less than 500 characters')
});
const ReviewContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const ReviewProvider = (param)=>{
    let { children } = param;
    _s();
    const [cachedReviews, setCachedReviews] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [cachedStats, setCachedStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    // Clear cache when user changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ReviewProvider.useEffect": ()=>{
            setCachedReviews({});
            setCachedStats({});
        }
    }["ReviewProvider.useEffect"], [
        user === null || user === void 0 ? void 0 : user.username
    ]);
    const getReviewsForSeller = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ReviewProvider.useCallback[getReviewsForSeller]": async (sellerUsername)=>{
            try {
                setIsLoading(true);
                setError(null);
                // Check cache first
                if (cachedReviews[sellerUsername]) {
                    return cachedReviews[sellerUsername];
                }
                // Fetch from API
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reviews$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reviewsService"].getSellerReviews(sellerUsername);
                if (response.success && response.data) {
                    const reviews = response.data.reviews.map({
                        "ReviewProvider.useCallback[getReviewsForSeller].reviews": (r)=>({
                                _id: r._id,
                                orderId: r.orderId,
                                reviewer: r.reviewer,
                                reviewee: r.reviewee,
                                rating: r.rating,
                                comment: r.comment,
                                date: r.createdAt,
                                asDescribed: r.asDescribed,
                                fastShipping: r.fastShipping,
                                wouldBuyAgain: r.wouldBuyAgain,
                                sellerResponse: r.sellerResponse
                            })
                    }["ReviewProvider.useCallback[getReviewsForSeller].reviews"]);
                    // Update cache
                    setCachedReviews({
                        "ReviewProvider.useCallback[getReviewsForSeller]": (prev)=>({
                                ...prev,
                                [sellerUsername]: reviews
                            })
                    }["ReviewProvider.useCallback[getReviewsForSeller]"]);
                    // Cache stats too
                    if (response.data.stats) {
                        setCachedStats({
                            "ReviewProvider.useCallback[getReviewsForSeller]": (prev)=>({
                                    ...prev,
                                    [sellerUsername]: response.data.stats
                                })
                        }["ReviewProvider.useCallback[getReviewsForSeller]"]);
                    }
                    return reviews;
                } else {
                    var _response_error;
                    setError(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to fetch reviews');
                    return [];
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
                setError('Failed to fetch reviews');
                return [];
            } finally{
                setIsLoading(false);
            }
        }
    }["ReviewProvider.useCallback[getReviewsForSeller]"], [
        cachedReviews
    ]);
    const addReview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ReviewProvider.useCallback[addReview]": async (sellerUsername, orderId, review)=>{
            try {
                setIsLoading(true);
                setError(null);
                if (!(user === null || user === void 0 ? void 0 : user.username)) {
                    setError('You must be logged in to submit a review');
                    return false;
                }
                // Validate review data
                const validation = reviewSchema.safeParse({
                    rating: review.rating,
                    comment: review.comment
                });
                if (!validation.success) {
                    var _validation_error_errors_;
                    setError(((_validation_error_errors_ = validation.error.errors[0]) === null || _validation_error_errors_ === void 0 ? void 0 : _validation_error_errors_.message) || 'Invalid review');
                    return false;
                }
                // Create review via API
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reviews$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reviewsService"].createReview({
                    orderId,
                    rating: validation.data.rating,
                    comment: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(validation.data.comment),
                    asDescribed: review.asDescribed !== false,
                    fastShipping: review.fastShipping !== false,
                    wouldBuyAgain: review.wouldBuyAgain !== false
                });
                if (response.success) {
                    // Clear cache for this seller to force refresh
                    setCachedReviews({
                        "ReviewProvider.useCallback[addReview]": (prev)=>{
                            const updated = {
                                ...prev
                            };
                            delete updated[sellerUsername];
                            return updated;
                        }
                    }["ReviewProvider.useCallback[addReview]"]);
                    setCachedStats({
                        "ReviewProvider.useCallback[addReview]": (prev)=>{
                            const updated = {
                                ...prev
                            };
                            delete updated[sellerUsername];
                            return updated;
                        }
                    }["ReviewProvider.useCallback[addReview]"]);
                    return true;
                } else {
                    var _response_error;
                    setError(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to create review');
                    return false;
                }
            } catch (error) {
                console.error('Error adding review:', error);
                setError('Failed to add review');
                return false;
            } finally{
                setIsLoading(false);
            }
        }
    }["ReviewProvider.useCallback[addReview]"], [
        user === null || user === void 0 ? void 0 : user.username
    ]);
    const hasReviewed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ReviewProvider.useCallback[hasReviewed]": async (orderId)=>{
            try {
                setIsLoading(true);
                setError(null);
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reviews$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["reviewsService"].checkOrderReview(orderId);
                if (response.success && response.data) {
                    return response.data.hasReview;
                }
                return false;
            } catch (error) {
                console.error('Error checking review status:', error);
                return false;
            } finally{
                setIsLoading(false);
            }
        }
    }["ReviewProvider.useCallback[hasReviewed]"], []);
    const getReviewStats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "ReviewProvider.useCallback[getReviewStats]": async (sellerUsername)=>{
            try {
                // Check cache first
                if (cachedStats[sellerUsername]) {
                    return cachedStats[sellerUsername];
                }
                // If not in cache, fetch reviews which will also cache stats
                await getReviewsForSeller(sellerUsername);
                return cachedStats[sellerUsername] || null;
            } catch (error) {
                console.error('Error getting review stats:', error);
                return null;
            }
        }
    }["ReviewProvider.useCallback[getReviewStats]"], [
        cachedStats,
        getReviewsForSeller
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ReviewContext.Provider, {
        value: {
            getReviewsForSeller,
            addReview,
            hasReviewed,
            getReviewStats,
            isLoading,
            error
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/ReviewContext.tsx",
        lineNumber: 213,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(ReviewProvider, "zk/e2Wy9Xp/biJDWmwj2pMM2MmE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = ReviewProvider;
const useReviews = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ReviewContext);
    if (!context) throw new Error('useReviews must be used within a ReviewProvider');
    return context;
};
_s1(useReviews, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "ReviewProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/RequestContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/context/RequestContext.tsx
__turbopack_context__.s({
    "RequestProvider": ()=>RequestProvider,
    "useRequests": ()=>useRequests
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
// Validation schemas
const requestSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.title,
    description: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.description,
    price: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.price,
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(30)).max(10).optional()
});
const responseSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(500);
const RequestContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const useRequests = ()=>{
    _s();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(RequestContext);
    if (!ctx) throw new Error('useRequests must be used within a RequestProvider');
    return ctx;
};
_s(useRequests, "/dMy7t63NXD4eYACoT93CePwGrg=");
const RequestProvider = (param)=>{
    let { children } = param;
    _s1();
    const [requests, setRequests] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isInitialized, setIsInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Load initial data from localStorage using service
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RequestProvider.useEffect": ()=>{
            const loadData = {
                "RequestProvider.useEffect.loadData": async ()=>{
                    if ("object" === 'undefined' || isInitialized) return;
                    try {
                        const stored = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem('panty_custom_requests', []);
                        // Migrate and sanitize old requests
                        const migratedRequests = stored.map({
                            "RequestProvider.useEffect.loadData.migratedRequests": (req)=>({
                                    ...req,
                                    title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(req.title || ''),
                                    description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(req.description || ''),
                                    response: req.response ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(req.response) : undefined,
                                    tags: Array.isArray(req.tags) ? req.tags.map({
                                        "RequestProvider.useEffect.loadData.migratedRequests": (tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag).slice(0, 30)
                                    }["RequestProvider.useEffect.loadData.migratedRequests"]) : [],
                                    messageThreadId: req.messageThreadId || "".concat(req.buyer, "-").concat(req.seller),
                                    lastModifiedBy: req.lastModifiedBy || req.buyer,
                                    originalMessageId: req.originalMessageId || req.id,
                                    lastEditedBy: req.lastEditedBy || req.buyer,
                                    pendingWith: req.pendingWith || req.seller
                                })
                        }["RequestProvider.useEffect.loadData.migratedRequests"]);
                        setRequests(migratedRequests);
                        setIsInitialized(true);
                    } catch (error) {
                        console.error('Error loading requests from localStorage:', error);
                        setIsInitialized(true);
                    }
                }
            }["RequestProvider.useEffect.loadData"];
            loadData();
        }
    }["RequestProvider.useEffect"], [
        isInitialized
    ]);
    // Save to localStorage whenever requests change using service
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "RequestProvider.useEffect": ()=>{
            if ("object" !== 'undefined' && isInitialized) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_custom_requests', requests);
            }
        }
    }["RequestProvider.useEffect"], [
        requests,
        isInitialized
    ]);
    const addRequest = (req)=>{
        var _validation_data_tags;
        // Validate request data
        const validation = requestSchema.safeParse({
            title: req.title,
            description: req.description,
            price: req.price,
            tags: req.tags
        });
        if (!validation.success) {
            console.error('Invalid request data:', validation.error);
            return;
        }
        const requestWithDefaults = {
            ...req,
            title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(validation.data.title),
            description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(validation.data.description),
            price: validation.data.price,
            tags: ((_validation_data_tags = validation.data.tags) === null || _validation_data_tags === void 0 ? void 0 : _validation_data_tags.map((tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag).slice(0, 30))) || [],
            messageThreadId: req.messageThreadId || "".concat(req.buyer, "-").concat(req.seller),
            lastModifiedBy: req.lastModifiedBy || req.buyer,
            originalMessageId: req.originalMessageId || req.id,
            lastEditedBy: req.buyer,
            pendingWith: req.seller
        };
        setRequests((prev)=>[
                ...prev,
                requestWithDefaults
            ]);
    };
    const getRequestsForUser = (username, role)=>{
        return requests.filter((r)=>r[role] === username);
    };
    const getRequestById = (id)=>{
        return requests.find((r)=>r.id === id);
    };
    // Enhanced respond function that tracks who made the last modification
    const respondToRequest = (id, status, response, updateFields, modifiedBy)=>{
        // Validate response if provided
        if (response) {
            const responseValidation = responseSchema.safeParse(response);
            if (!responseValidation.success) {
                console.error('Invalid response:', responseValidation.error);
                return;
            }
        }
        // Validate update fields if provided
        if (updateFields) {
            const updateValidation = requestSchema.partial().safeParse(updateFields);
            if (!updateValidation.success) {
                console.error('Invalid update fields:', updateValidation.error);
                return;
            }
        }
        setRequests((prev)=>prev.map((r)=>{
                var _updateFields_tags;
                if (r.id !== id) return r;
                // Determine who it's pending with based on who modified it
                let pendingWith = r.pendingWith;
                let lastEditedBy = r.lastEditedBy;
                if (status === 'edited' && modifiedBy) {
                    // If edited, it's pending with the other party
                    pendingWith = modifiedBy === r.buyer ? r.seller : r.buyer;
                    lastEditedBy = modifiedBy;
                } else if (status === 'accepted' || status === 'rejected') {
                    // No longer pending with anyone
                    pendingWith = undefined;
                }
                var _updateFields_price;
                return {
                    ...r,
                    status,
                    response: response ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(response) : r.response,
                    lastModifiedBy: modifiedBy || r.lastModifiedBy,
                    lastEditedBy: status === 'edited' ? lastEditedBy : r.lastEditedBy,
                    pendingWith,
                    ...updateFields ? {
                        title: updateFields.title ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(updateFields.title) : r.title,
                        description: updateFields.description ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(updateFields.description) : r.description,
                        price: (_updateFields_price = updateFields.price) !== null && _updateFields_price !== void 0 ? _updateFields_price : r.price,
                        tags: ((_updateFields_tags = updateFields.tags) === null || _updateFields_tags === void 0 ? void 0 : _updateFields_tags.map((tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag).slice(0, 30))) || r.tags
                    } : {}
                };
            }));
    };
    // Mark request as paid (when payment is processed)
    const markRequestAsPaid = (id)=>{
        setRequests((prev)=>prev.map((r)=>r.id === id ? {
                    ...r,
                    status: 'paid',
                    paid: true,
                    pendingWith: undefined
                } : r));
    };
    // Get all active requests between two users
    const getActiveRequestsForThread = (buyer, seller)=>{
        return requests.filter((r)=>r.buyer === buyer && r.seller === seller && r.status !== 'rejected' && r.status !== 'paid');
    };
    // Get the most recent request in a conversation thread
    const getLatestRequestInThread = (buyer, seller)=>{
        const threadRequests = requests.filter((r)=>r.buyer === buyer && r.seller === seller).sort((a, b)=>new Date(b.date).getTime() - new Date(a.date).getTime());
        return threadRequests[0];
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(RequestContext.Provider, {
        value: {
            requests,
            setRequests,
            addRequest,
            getRequestsForUser,
            getRequestById,
            respondToRequest,
            markRequestAsPaid,
            getActiveRequestsForThread,
            getLatestRequestInThread
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/RequestContext.tsx",
        lineNumber: 247,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s1(RequestProvider, "ObQV1ERnJX1iutNmv9gIMvSgrlE=");
_c = RequestProvider;
var _c;
__turbopack_context__.k.register(_c, "RequestProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/LoadingContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// src/context/LoadingContext.tsx
__turbopack_context__.s({
    "LoadingButton": ()=>LoadingButton,
    "LoadingProvider": ()=>LoadingProvider,
    "LoadingSpinner": ()=>LoadingSpinner,
    "useLoading": ()=>useLoading
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const LoadingContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function LoadingProvider(param) {
    let { children } = param;
    _s();
    const [globalLoading, setGlobalLoadingState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        isLoading: false
    });
    const [loadingStates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(new Map());
    const [, forceUpdate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const loadingCountRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    // Set global loading
    const setGlobalLoading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LoadingProvider.useCallback[setGlobalLoading]": (isLoading, message, progress)=>{
            setGlobalLoadingState({
                isLoading,
                message,
                progress
            });
        }
    }["LoadingProvider.useCallback[setGlobalLoading]"], []);
    // Set named loading state
    const setLoading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LoadingProvider.useCallback[setLoading]": (key, isLoading, message, progress)=>{
            if (isLoading) {
                // Increment loading count for this key
                const currentCount = loadingCountRef.current.get(key) || 0;
                loadingCountRef.current.set(key, currentCount + 1);
                loadingStates.set(key, {
                    isLoading: true,
                    message,
                    progress
                });
            } else {
                // Decrement loading count
                const currentCount = loadingCountRef.current.get(key) || 0;
                const newCount = Math.max(0, currentCount - 1);
                if (newCount === 0) {
                    loadingStates.delete(key);
                    loadingCountRef.current.delete(key);
                } else {
                    loadingCountRef.current.set(key, newCount);
                }
            }
            forceUpdate({});
        }
    }["LoadingProvider.useCallback[setLoading]"], [
        loadingStates
    ]);
    // Check if specific key is loading
    const isLoading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LoadingProvider.useCallback[isLoading]": (key)=>{
            return loadingStates.has(key);
        }
    }["LoadingProvider.useCallback[isLoading]"], [
        loadingStates
    ]);
    // Execute function with loading state
    const withLoading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LoadingProvider.useCallback[withLoading]": async (key, fn, message)=>{
            setLoading(key, true, message);
            try {
                return await fn();
            } finally{
                setLoading(key, false);
            }
        }
    }["LoadingProvider.useCallback[withLoading]"], [
        setLoading
    ]);
    // Clear all loading states
    const clearAllLoading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "LoadingProvider.useCallback[clearAllLoading]": ()=>{
            loadingStates.clear();
            loadingCountRef.current.clear();
            setGlobalLoadingState({
                isLoading: false
            });
            forceUpdate({});
        }
    }["LoadingProvider.useCallback[clearAllLoading]"], [
        loadingStates
    ]);
    const value = {
        globalLoading,
        setGlobalLoading,
        loadingStates,
        setLoading,
        isLoading,
        withLoading,
        clearAllLoading
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingContext.Provider, {
        value: value,
        children: [
            children,
            globalLoading.isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(GlobalLoadingOverlay, {
                ...globalLoading
            }, void 0, false, {
                fileName: "[project]/src/context/LoadingContext.tsx",
                lineNumber: 121,
                columnNumber: 35
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/context/LoadingContext.tsx",
        lineNumber: 119,
        columnNumber: 5
    }, this);
}
_s(LoadingProvider, "tyssBEw+hh0pTMtAGYEWt3BcLvg=");
_c = LoadingProvider;
// Global Loading Overlay Component
function GlobalLoadingOverlay(param) {
    let { message, progress } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                        className: "w-10 h-10 text-[#ff950e] animate-spin"
                    }, void 0, false, {
                        fileName: "[project]/src/context/LoadingContext.tsx",
                        lineNumber: 132,
                        columnNumber: 11
                    }, this),
                    message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-white text-sm font-medium",
                        children: message
                    }, void 0, false, {
                        fileName: "[project]/src/context/LoadingContext.tsx",
                        lineNumber: 135,
                        columnNumber: 13
                    }, this),
                    progress !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-48",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gray-800 rounded-full h-2 overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-[#ff950e] h-full transition-all duration-300",
                                    style: {
                                        width: "".concat(Math.min(100, Math.max(0, progress)), "%")
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/src/context/LoadingContext.tsx",
                                    lineNumber: 141,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/context/LoadingContext.tsx",
                                lineNumber: 140,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-400 text-xs mt-1 text-center",
                                children: [
                                    Math.round(progress),
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/context/LoadingContext.tsx",
                                lineNumber: 146,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/context/LoadingContext.tsx",
                        lineNumber: 139,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/context/LoadingContext.tsx",
                lineNumber: 131,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/context/LoadingContext.tsx",
            lineNumber: 130,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/context/LoadingContext.tsx",
        lineNumber: 129,
        columnNumber: 5
    }, this);
}
_c1 = GlobalLoadingOverlay;
function useLoading() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
_s1(useLoading, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
function LoadingSpinner(param) {
    let { size = 'md', className = '' } = param;
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
        className: "animate-spin text-[#ff950e] ".concat(sizeClasses[size], " ").concat(className)
    }, void 0, false, {
        fileName: "[project]/src/context/LoadingContext.tsx",
        lineNumber: 181,
        columnNumber: 5
    }, this);
}
_c2 = LoadingSpinner;
function LoadingButton(param) {
    let { isLoading, children, loadingText, className = '', ...props } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        disabled: isLoading,
        className: "relative ".concat(className),
        ...props,
        children: isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "flex items-center justify-center gap-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingSpinner, {
                    size: "sm"
                }, void 0, false, {
                    fileName: "[project]/src/context/LoadingContext.tsx",
                    lineNumber: 204,
                    columnNumber: 11
                }, this),
                loadingText || 'Loading...'
            ]
        }, void 0, true, {
            fileName: "[project]/src/context/LoadingContext.tsx",
            lineNumber: 203,
            columnNumber: 9
        }, this) : children
    }, void 0, false, {
        fileName: "[project]/src/context/LoadingContext.tsx",
        lineNumber: 197,
        columnNumber: 5
    }, this);
}
_c3 = LoadingButton;
var _c, _c1, _c2, _c3;
__turbopack_context__.k.register(_c, "LoadingProvider");
__turbopack_context__.k.register(_c1, "GlobalLoadingOverlay");
__turbopack_context__.k.register(_c2, "LoadingSpinner");
__turbopack_context__.k.register(_c3, "LoadingButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/FavoritesContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "FavoritesProvider": ()=>FavoritesProvider,
    "useFavorites": ()=>useFavorites
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$favorites$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/favorites.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-client] (ecmascript) <export * as z>");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
const FavoritesContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// ================ Validation Schemas ================
// Very defensive; we only ensure minimal fields + types are correct.
// URL validation for profilePicture is intentionally relaxed to avoid breaking existing data.
const StoredFavoriteSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    sellerId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    sellerUsername: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    addedAt: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    profilePicture: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    tier: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    isVerified: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false)
});
const SellerInputSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    profilePicture: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    tier: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    isVerified: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean()
});
// ================ Limits / Helpers ================
const FAV_LIMIT = {
    maxAttempts: 30,
    windowMs: 60_000,
    blockDuration: 60_000
};
function dedupeBySellerId(list) {
    const seen = new Set();
    const out = [];
    for (const f of list){
        if (!seen.has(f.sellerId)) {
            seen.add(f.sellerId);
            out.push(f);
        }
    }
    return out;
}
/**
 * Rate-limit wrapper that works whether limiter.check()
 * throws on limit OR returns { allowed, waitTime }.
 */ function checkRateLimitSafe(limiter, key, opts) {
    try {
        var _limiter_check;
        const res = limiter === null || limiter === void 0 ? void 0 : (_limiter_check = limiter.check) === null || _limiter_check === void 0 ? void 0 : _limiter_check.call(limiter, key, opts);
        // If it returns an object
        if (typeof res === 'object' && res !== null) {
            if (res.allowed === false) {
                // waitTime may be provided in seconds or ms; normalize to seconds
                const waitSeconds = typeof res.waitTime === 'number' ? Math.max(1, Math.ceil(res.waitTime)) : undefined;
                return {
                    allowed: false,
                    waitTime: waitSeconds
                };
            }
            return {
                allowed: true
            };
        }
        // If no return (assume not limited)
        return {
            allowed: true
        };
    } catch (e) {
        var _e_waitTimeMs, _ref;
        // If it throws on limit, try to extract wait time
        const ms = (_ref = (_e_waitTimeMs = e === null || e === void 0 ? void 0 : e.waitTimeMs) !== null && _e_waitTimeMs !== void 0 ? _e_waitTimeMs : e === null || e === void 0 ? void 0 : e.retryAfterMs) !== null && _ref !== void 0 ? _ref : typeof (e === null || e === void 0 ? void 0 : e.waitTime) === 'number' && e.waitTime > 10 ? e.waitTime * 1000 : undefined;
        const seconds = ms ? Math.max(1, Math.ceil(ms / 1000)) : undefined;
        return {
            allowed: false,
            waitTime: seconds
        };
    }
}
function FavoritesProvider(param) {
    let { children } = param;
    _s();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [favorites, setFavorites] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingFavorites, setLoadingFavorites] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Create limiter once; safe even under React strict mode
    const rateLimiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "FavoritesProvider.useMemo[rateLimiter]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getRateLimiter"])()
    }["FavoritesProvider.useMemo[rateLimiter]"], []);
    // Storage key based on username (sanitized)
    const getStorageKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FavoritesProvider.useCallback[getStorageKey]": (username)=>{
            return "favorites_".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username));
        }
    }["FavoritesProvider.useCallback[getStorageKey]"], []);
    // ------------- Load favorites (API or local) -------------
    const loadFavorites = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FavoritesProvider.useCallback[loadFavorites]": async ()=>{
            if (!(user === null || user === void 0 ? void 0 : user.username)) {
                setFavorites([]);
                return;
            }
            setLoadingFavorites(true);
            try {
                if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                    // Load from API
                    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$favorites$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["favoritesService"].getFavorites(user.username);
                    if (response.success && response.data) {
                        // Validate + sanitize response
                        const cleaned = (Array.isArray(response.data) ? response.data : []).map({
                            "FavoritesProvider.useCallback[loadFavorites].cleaned": (f)=>{
                                const parsed = StoredFavoriteSchema.safeParse(f);
                                if (!parsed.success) return null;
                                const v = parsed.data;
                                return {
                                    sellerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(v.sellerId),
                                    sellerUsername: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(v.sellerUsername),
                                    addedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(v.addedAt),
                                    profilePicture: v.profilePicture,
                                    tier: v.tier,
                                    isVerified: !!v.isVerified
                                };
                            }
                        }["FavoritesProvider.useCallback[loadFavorites].cleaned"]).filter(Boolean);
                        const deduped = dedupeBySellerId(cleaned);
                        setFavorites(deduped);
                        // Cache for offline
                        const storageKey = getStorageKey(user.username);
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(storageKey, deduped);
                    } else {
                        var _response_error;
                        // API error → fallback to local
                        setError(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to load favorites from server');
                        const storageKey = getStorageKey(user.username);
                        const stored = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(storageKey, []);
                        const validated = (Array.isArray(stored) ? stored : []).map({
                            "FavoritesProvider.useCallback[loadFavorites].validated": (f)=>{
                                const parsed = StoredFavoriteSchema.safeParse(f);
                                if (!parsed.success) return null;
                                const v = parsed.data;
                                return {
                                    sellerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(v.sellerId),
                                    sellerUsername: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(v.sellerUsername),
                                    addedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(v.addedAt),
                                    profilePicture: v.profilePicture,
                                    tier: v.tier,
                                    isVerified: !!v.isVerified
                                };
                            }
                        }["FavoritesProvider.useCallback[loadFavorites].validated"]).filter(Boolean);
                        setFavorites(dedupeBySellerId(validated));
                    }
                } else {
                    // LocalStorage only
                    const storageKey = getStorageKey(user.username);
                    const stored = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].getItem(storageKey, []);
                    const validated = (Array.isArray(stored) ? stored : []).map({
                        "FavoritesProvider.useCallback[loadFavorites].validated": (f)=>{
                            const parsed = StoredFavoriteSchema.safeParse(f);
                            if (!parsed.success) return null;
                            const v = parsed.data;
                            return {
                                sellerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(v.sellerId),
                                sellerUsername: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(v.sellerUsername),
                                addedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(v.addedAt),
                                profilePicture: v.profilePicture,
                                tier: v.tier,
                                isVerified: !!v.isVerified
                            };
                        }
                    }["FavoritesProvider.useCallback[loadFavorites].validated"]).filter(Boolean);
                    setFavorites(dedupeBySellerId(validated));
                }
            } catch (err) {
                console.error('Error loading favorites:', err);
                setError('Failed to load favorites');
                setFavorites([]);
            } finally{
                setLoadingFavorites(false);
            }
        }
    }["FavoritesProvider.useCallback[loadFavorites]"], [
        user === null || user === void 0 ? void 0 : user.username,
        getStorageKey
    ]);
    // Load favorites when user changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FavoritesProvider.useEffect": ()=>{
            loadFavorites();
        }
    }["FavoritesProvider.useEffect"], [
        loadFavorites
    ]);
    // ------------- Helpers -------------
    const isFavorited = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FavoritesProvider.useCallback[isFavorited]": (sellerId)=>favorites.some({
                "FavoritesProvider.useCallback[isFavorited]": (fav)=>fav.sellerId === sellerId
            }["FavoritesProvider.useCallback[isFavorited]"])
    }["FavoritesProvider.useCallback[isFavorited]"], [
        favorites
    ]);
    // ------------- Toggle favorite -------------
    const toggleFavorite = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FavoritesProvider.useCallback[toggleFavorite]": async (seller)=>{
            if (!(user === null || user === void 0 ? void 0 : user.username)) {
                setError('Please log in to add favorites');
                return false;
            }
            // Validate & sanitize seller input
            const parsed = SellerInputSchema.safeParse(seller);
            if (!parsed.success) {
                setError('Invalid seller data');
                return false;
            }
            const cleanSeller = {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(parsed.data.id),
                username: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(parsed.data.username),
                profilePicture: parsed.data.profilePicture,
                tier: parsed.data.tier,
                isVerified: !!parsed.data.isVerified
            };
            // Rate limiting (per-user key)
            const rlKey = "favorites:toggle:".concat((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(user.username));
            const rl = checkRateLimitSafe(rateLimiter, rlKey, FAV_LIMIT);
            if (!rl.allowed) {
                var _rl_waitTime;
                const secs = (_rl_waitTime = rl.waitTime) !== null && _rl_waitTime !== void 0 ? _rl_waitTime : Math.ceil(FAV_LIMIT.blockDuration / 1000);
                setError("Too many actions. Please wait ".concat(secs, " seconds."));
                return false;
            }
            try {
                const storageKey = getStorageKey(user.username);
                const current = [
                    ...favorites
                ];
                const existingIndex = current.findIndex({
                    "FavoritesProvider.useCallback[toggleFavorite].existingIndex": (f)=>f.sellerId === cleanSeller.id
                }["FavoritesProvider.useCallback[toggleFavorite].existingIndex"]);
                if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                    if (existingIndex >= 0) {
                        // Remove via API
                        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$favorites$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["favoritesService"].removeFavorite(cleanSeller.id);
                        if (response.success) {
                            const next = current.filter({
                                "FavoritesProvider.useCallback[toggleFavorite].next": (f)=>f.sellerId !== cleanSeller.id
                            }["FavoritesProvider.useCallback[toggleFavorite].next"]);
                            setFavorites(next);
                            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(storageKey, next);
                            setError(null);
                            return true;
                        } else {
                            var _response_error;
                            setError(((_response_error = response.error) === null || _response_error === void 0 ? void 0 : _response_error.message) || 'Failed to remove favorite');
                            return false;
                        }
                    } else {
                        // Add via API
                        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$favorites$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["favoritesService"].addFavorite({
                            sellerId: cleanSeller.id,
                            sellerUsername: cleanSeller.username,
                            profilePicture: cleanSeller.profilePicture,
                            tier: cleanSeller.tier,
                            isVerified: cleanSeller.isVerified
                        });
                        if (response.success && response.data) {
                            // Validate API response item before storing
                            const parsedItem = StoredFavoriteSchema.safeParse(response.data);
                            if (!parsedItem.success) {
                                setError('Invalid server response for favorite item');
                                return false;
                            }
                            const v = parsedItem.data;
                            const newFav = {
                                sellerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(v.sellerId),
                                sellerUsername: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeUsername"])(v.sellerUsername),
                                addedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sanitizeStrict"])(v.addedAt || new Date().toISOString()),
                                profilePicture: v.profilePicture,
                                tier: v.tier,
                                isVerified: !!v.isVerified
                            };
                            const next = dedupeBySellerId([
                                ...current,
                                newFav
                            ]);
                            setFavorites(next);
                            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(storageKey, next);
                            setError(null);
                            return true;
                        } else {
                            var _response_error1;
                            setError(((_response_error1 = response.error) === null || _response_error1 === void 0 ? void 0 : _response_error1.message) || 'Failed to add favorite');
                            return false;
                        }
                    }
                } else {
                    // Local only
                    let next;
                    if (existingIndex >= 0) {
                        // Remove locally
                        next = current.filter({
                            "FavoritesProvider.useCallback[toggleFavorite]": (f)=>f.sellerId !== cleanSeller.id
                        }["FavoritesProvider.useCallback[toggleFavorite]"]);
                    } else {
                        // Add locally
                        const newFav = {
                            sellerId: cleanSeller.id,
                            sellerUsername: cleanSeller.username,
                            addedAt: new Date().toISOString(),
                            profilePicture: cleanSeller.profilePicture,
                            tier: cleanSeller.tier,
                            isVerified: cleanSeller.isVerified
                        };
                        next = dedupeBySellerId([
                            ...current,
                            newFav
                        ]);
                    }
                    const saved = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["storageService"].setItem(storageKey, next);
                    // Some storage services return void; treat undefined as success.
                    if (saved === false) {
                        setError('Failed to update favorites');
                        return false;
                    }
                    setFavorites(next);
                    setError(null);
                    return true;
                }
            } catch (err) {
                console.error('Error toggling favorite:', err);
                setError('Failed to update favorites');
                return false;
            }
        }
    }["FavoritesProvider.useCallback[toggleFavorite]"], [
        user === null || user === void 0 ? void 0 : user.username,
        favorites,
        getStorageKey,
        rateLimiter
    ]);
    const clearError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FavoritesProvider.useCallback[clearError]": ()=>setError(null)
    }["FavoritesProvider.useCallback[clearError]"], []);
    const refreshFavorites = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "FavoritesProvider.useCallback[refreshFavorites]": async ()=>{
            await loadFavorites();
        }
    }["FavoritesProvider.useCallback[refreshFavorites]"], [
        loadFavorites
    ]);
    const contextValue = {
        favorites,
        favoriteCount: favorites.length,
        isFavorited,
        toggleFavorite,
        loadingFavorites,
        error,
        clearError,
        refreshFavorites
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FavoritesContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/FavoritesContext.tsx",
        lineNumber: 388,
        columnNumber: 10
    }, this);
}
_s(FavoritesProvider, "GLMCx3wqFtUS1uem9A9K787JbIo=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = FavoritesProvider;
function useFavorites() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
_s1(useFavorites, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "FavoritesProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/context/NotificationContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "NotificationProvider": ()=>NotificationProvider,
    "useNotifications": ()=>useNotifications
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/notification.service.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const NotificationContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const useNotifications = ()=>{
    _s();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
};
_s(useNotifications, "/dMy7t63NXD4eYACoT93CePwGrg=");
const NotificationProvider = (param)=>{
    let { children } = param;
    _s1();
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const ws = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"])();
    const subscribe = ws === null || ws === void 0 ? void 0 : ws.subscribe;
    const [activeNotifications, setActiveNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [clearedNotifications, setClearedNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [unreadCount, setUnreadCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const isMountedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(true);
    const lastFetchRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    const FETCH_COOLDOWN = 1000;
    // Track processed notification IDs to prevent duplicates
    const processedNotificationIds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const loadNotifications = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "NotificationProvider.useCallback[loadNotifications]": async ()=>{
            if (!user || !isMountedRef.current) return;
            const now = Date.now();
            if (now - lastFetchRef.current < FETCH_COOLDOWN) return;
            lastFetchRef.current = now;
            setIsLoading(true);
            setError(null);
            try {
                const activeRes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notificationService"].getActiveNotifications(50);
                if (activeRes.success && Array.isArray(activeRes.data) && isMountedRef.current) {
                    setActiveNotifications(activeRes.data);
                    setUnreadCount(activeRes.data.filter({
                        "NotificationProvider.useCallback[loadNotifications]": (n)=>!n.read
                    }["NotificationProvider.useCallback[loadNotifications]"]).length);
                    // Track all loaded notification IDs
                    activeRes.data.forEach({
                        "NotificationProvider.useCallback[loadNotifications]": (n)=>{
                            const id = n._id || n.id;
                            if (id) processedNotificationIds.current.add(id);
                        }
                    }["NotificationProvider.useCallback[loadNotifications]"]);
                }
                const clearedRes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notificationService"].getClearedNotifications(50);
                if (clearedRes.success && Array.isArray(clearedRes.data) && isMountedRef.current) {
                    setClearedNotifications(clearedRes.data);
                }
            } catch (e) {
                if (isMountedRef.current) setError('Failed to load notifications');
            } finally{
                if (isMountedRef.current) setIsLoading(false);
            }
        }
    }["NotificationProvider.useCallback[loadNotifications]"], [
        user
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NotificationProvider.useEffect": ()=>{
            isMountedRef.current = true;
            if (user) {
                loadNotifications();
            } else {
                setActiveNotifications([]);
                setClearedNotifications([]);
                setUnreadCount(0);
            }
            return ({
                "NotificationProvider.useEffect": ()=>{
                    isMountedRef.current = false;
                }
            })["NotificationProvider.useEffect"];
        }
    }["NotificationProvider.useEffect"], [
        user,
        loadNotifications
    ]);
    // FIXED: Only listen to the primary notification:new event from backend
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "NotificationProvider.useEffect": ()=>{
            if (!subscribe || !user) return;
            const unsubs = [];
            // PRIMARY: This is the ONLY source for tip notifications
            // The backend's Notification.createTipNotification automatically emits this
            unsubs.push(subscribe('notification:new', {
                "NotificationProvider.useEffect": (data)=>{
                    if (!isMountedRef.current) return;
                    console.log('[NotificationContext] notification:new received', data);
                    // Check if we've already processed this notification
                    const notificationId = data.id || data._id;
                    if (notificationId && processedNotificationIds.current.has(notificationId)) {
                        console.log('[NotificationContext] Skipping duplicate notification:', notificationId);
                        return;
                    }
                    // Add to processed set
                    if (notificationId) {
                        processedNotificationIds.current.add(notificationId);
                        // Clean up old IDs to prevent memory leak
                        if (processedNotificationIds.current.size > 200) {
                            const idsArray = Array.from(processedNotificationIds.current);
                            processedNotificationIds.current = new Set(idsArray.slice(-100));
                        }
                    }
                    const n = {
                        id: notificationId,
                        _id: notificationId,
                        recipient: data.recipient || user.username,
                        type: data.type,
                        title: data.title,
                        message: data.message,
                        data: data.data,
                        read: false,
                        cleared: false,
                        priority: data.priority || 'normal',
                        createdAt: data.createdAt || new Date().toISOString()
                    };
                    // Check if notification already exists in state
                    setActiveNotifications({
                        "NotificationProvider.useEffect": (prev)=>{
                            const exists = prev.some({
                                "NotificationProvider.useEffect.exists": (existing)=>(existing._id || existing.id) === notificationId
                            }["NotificationProvider.useEffect.exists"]);
                            if (exists) {
                                console.log('[NotificationContext] Notification already in state:', notificationId);
                                return prev;
                            }
                            return [
                                n,
                                ...prev
                            ];
                        }
                    }["NotificationProvider.useEffect"]);
                    setUnreadCount({
                        "NotificationProvider.useEffect": (c)=>c + 1
                    }["NotificationProvider.useEffect"]);
                }
            }["NotificationProvider.useEffect"]));
            // REMOVED: Legacy tip_received listener - no longer needed
            // REMOVED: message:new tip listener - no longer needed
            // Clear/restore/delete event handlers remain the same
            unsubs.push(subscribe('notification:cleared', {
                "NotificationProvider.useEffect": (data)=>{
                    const id = data === null || data === void 0 ? void 0 : data.notificationId;
                    setActiveNotifications({
                        "NotificationProvider.useEffect": (prev)=>{
                            const found = prev.find({
                                "NotificationProvider.useEffect.found": (n)=>(n._id || n.id) === id
                            }["NotificationProvider.useEffect.found"]);
                            if (found) {
                                setClearedNotifications({
                                    "NotificationProvider.useEffect": (c)=>[
                                            found,
                                            ...c
                                        ]
                                }["NotificationProvider.useEffect"]);
                                if (!found.read) setUnreadCount({
                                    "NotificationProvider.useEffect": (u)=>Math.max(0, u - 1)
                                }["NotificationProvider.useEffect"]);
                            }
                            return prev.filter({
                                "NotificationProvider.useEffect": (n)=>(n._id || n.id) !== id
                            }["NotificationProvider.useEffect"]);
                        }
                    }["NotificationProvider.useEffect"]);
                }
            }["NotificationProvider.useEffect"]));
            unsubs.push(subscribe('notification:all_cleared', {
                "NotificationProvider.useEffect": ()=>{
                    setActiveNotifications({
                        "NotificationProvider.useEffect": (prevActive)=>{
                            setClearedNotifications({
                                "NotificationProvider.useEffect": (prevCleared)=>[
                                        ...prevActive.map({
                                            "NotificationProvider.useEffect": (n)=>({
                                                    ...n,
                                                    cleared: true
                                                })
                                        }["NotificationProvider.useEffect"]),
                                        ...prevCleared
                                    ]
                            }["NotificationProvider.useEffect"]);
                            setUnreadCount(0);
                            return [];
                        }
                    }["NotificationProvider.useEffect"]);
                }
            }["NotificationProvider.useEffect"]));
            unsubs.push(subscribe('notification:restored', {
                "NotificationProvider.useEffect": (data)=>{
                    const id = data === null || data === void 0 ? void 0 : data.notificationId;
                    setClearedNotifications({
                        "NotificationProvider.useEffect": (prev)=>{
                            const found = prev.find({
                                "NotificationProvider.useEffect.found": (n)=>(n._id || n.id) === id
                            }["NotificationProvider.useEffect.found"]);
                            if (found) {
                                setActiveNotifications({
                                    "NotificationProvider.useEffect": (active)=>{
                                        // Check if already exists to prevent duplicates
                                        const exists = active.some({
                                            "NotificationProvider.useEffect.exists": (n)=>(n._id || n.id) === id
                                        }["NotificationProvider.useEffect.exists"]);
                                        if (exists) return active;
                                        return [
                                            found,
                                            ...active
                                        ];
                                    }
                                }["NotificationProvider.useEffect"]);
                                if (!found.read) setUnreadCount({
                                    "NotificationProvider.useEffect": (c)=>c + 1
                                }["NotificationProvider.useEffect"]);
                            }
                            return prev.filter({
                                "NotificationProvider.useEffect": (n)=>(n._id || n.id) !== id
                            }["NotificationProvider.useEffect"]);
                        }
                    }["NotificationProvider.useEffect"]);
                }
            }["NotificationProvider.useEffect"]));
            unsubs.push(subscribe('notification:deleted', {
                "NotificationProvider.useEffect": (data)=>{
                    const id = data === null || data === void 0 ? void 0 : data.notificationId;
                    setClearedNotifications({
                        "NotificationProvider.useEffect": (prev)=>prev.filter({
                                "NotificationProvider.useEffect": (n)=>(n._id || n.id) !== id
                            }["NotificationProvider.useEffect"])
                    }["NotificationProvider.useEffect"]);
                }
            }["NotificationProvider.useEffect"]));
            return ({
                "NotificationProvider.useEffect": ()=>unsubs.forEach({
                        "NotificationProvider.useEffect": (fn)=>fn()
                    }["NotificationProvider.useEffect"])
            })["NotificationProvider.useEffect"];
        }
    }["NotificationProvider.useEffect"], [
        subscribe,
        user
    ]);
    // Actions
    const clearNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "NotificationProvider.useCallback[clearNotification]": async (id)=>{
            try {
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notificationService"].clearNotification(id);
                if (res.success) {
                    setActiveNotifications({
                        "NotificationProvider.useCallback[clearNotification]": (prev)=>{
                            const found = prev.find({
                                "NotificationProvider.useCallback[clearNotification].found": (n)=>(n._id || n.id) === id
                            }["NotificationProvider.useCallback[clearNotification].found"]);
                            if (found) {
                                setClearedNotifications({
                                    "NotificationProvider.useCallback[clearNotification]": (c)=>[
                                            {
                                                ...found,
                                                cleared: true
                                            },
                                            ...c
                                        ]
                                }["NotificationProvider.useCallback[clearNotification]"]);
                                if (!found.read) setUnreadCount({
                                    "NotificationProvider.useCallback[clearNotification]": (u)=>Math.max(0, u - 1)
                                }["NotificationProvider.useCallback[clearNotification]"]);
                            }
                            return prev.filter({
                                "NotificationProvider.useCallback[clearNotification]": (n)=>(n._id || n.id) !== id
                            }["NotificationProvider.useCallback[clearNotification]"]);
                        }
                    }["NotificationProvider.useCallback[clearNotification]"]);
                } else setError('Failed to clear notification');
            } catch (e) {
                setError('Failed to clear notification');
            }
        }
    }["NotificationProvider.useCallback[clearNotification]"], []);
    const clearAllNotifications = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "NotificationProvider.useCallback[clearAllNotifications]": async ()=>{
            try {
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notificationService"].clearAll();
                if (res.success) {
                    setActiveNotifications({
                        "NotificationProvider.useCallback[clearAllNotifications]": (prevActive)=>{
                            setClearedNotifications({
                                "NotificationProvider.useCallback[clearAllNotifications]": (prevCleared)=>[
                                        ...prevActive.map({
                                            "NotificationProvider.useCallback[clearAllNotifications]": (n)=>({
                                                    ...n,
                                                    cleared: true
                                                })
                                        }["NotificationProvider.useCallback[clearAllNotifications]"]),
                                        ...prevCleared
                                    ]
                            }["NotificationProvider.useCallback[clearAllNotifications]"]);
                            setUnreadCount(0);
                            return [];
                        }
                    }["NotificationProvider.useCallback[clearAllNotifications]"]);
                } else setError('Failed to clear all notifications');
            } catch (e) {
                setError('Failed to clear all notifications');
            }
        }
    }["NotificationProvider.useCallback[clearAllNotifications]"], []);
    const restoreNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "NotificationProvider.useCallback[restoreNotification]": async (id)=>{
            try {
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notificationService"].restoreNotification(id);
                if (res.success) {
                    setClearedNotifications({
                        "NotificationProvider.useCallback[restoreNotification]": (prev)=>{
                            const found = prev.find({
                                "NotificationProvider.useCallback[restoreNotification].found": (n)=>(n._id || n.id) === id
                            }["NotificationProvider.useCallback[restoreNotification].found"]);
                            if (found) {
                                setActiveNotifications({
                                    "NotificationProvider.useCallback[restoreNotification]": (active)=>{
                                        // Check if already exists to prevent duplicates
                                        const exists = active.some({
                                            "NotificationProvider.useCallback[restoreNotification].exists": (n)=>(n._id || n.id) === id
                                        }["NotificationProvider.useCallback[restoreNotification].exists"]);
                                        if (exists) return active;
                                        return [
                                            found,
                                            ...active
                                        ];
                                    }
                                }["NotificationProvider.useCallback[restoreNotification]"]);
                                if (!found.read) setUnreadCount({
                                    "NotificationProvider.useCallback[restoreNotification]": (u)=>u + 1
                                }["NotificationProvider.useCallback[restoreNotification]"]);
                            }
                            return prev.filter({
                                "NotificationProvider.useCallback[restoreNotification]": (n)=>(n._id || n.id) !== id
                            }["NotificationProvider.useCallback[restoreNotification]"]);
                        }
                    }["NotificationProvider.useCallback[restoreNotification]"]);
                } else setError('Failed to restore notification');
            } catch (e) {
                setError('Failed to restore notification');
            }
        }
    }["NotificationProvider.useCallback[restoreNotification]"], []);
    const deleteNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "NotificationProvider.useCallback[deleteNotification]": async (id)=>{
            try {
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notificationService"].deleteNotification(id);
                if (res.success) {
                    setClearedNotifications({
                        "NotificationProvider.useCallback[deleteNotification]": (prev)=>prev.filter({
                                "NotificationProvider.useCallback[deleteNotification]": (n)=>(n._id || n.id) !== id
                            }["NotificationProvider.useCallback[deleteNotification]"])
                    }["NotificationProvider.useCallback[deleteNotification]"]);
                } else setError('Failed to delete notification');
            } catch (e) {
                setError('Failed to delete notification');
            }
        }
    }["NotificationProvider.useCallback[deleteNotification]"], []);
    const deleteAllCleared = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "NotificationProvider.useCallback[deleteAllCleared]": async ()=>{
            try {
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notificationService"].deleteAllCleared();
                if (res.success) {
                    setClearedNotifications([]);
                } else setError('Failed to delete cleared notifications');
            } catch (e) {
                setError('Failed to delete cleared notifications');
            }
        }
    }["NotificationProvider.useCallback[deleteAllCleared]"], []);
    const markAsRead = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "NotificationProvider.useCallback[markAsRead]": async (id)=>{
            try {
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notificationService"].markAsRead(id);
                if (res.success) {
                    setActiveNotifications({
                        "NotificationProvider.useCallback[markAsRead]": (prev)=>prev.map({
                                "NotificationProvider.useCallback[markAsRead]": (n)=>(n._id || n.id) === id ? {
                                        ...n,
                                        read: true
                                    } : n
                            }["NotificationProvider.useCallback[markAsRead]"])
                    }["NotificationProvider.useCallback[markAsRead]"]);
                    const found = activeNotifications.find({
                        "NotificationProvider.useCallback[markAsRead].found": (n)=>(n._id || n.id) === id
                    }["NotificationProvider.useCallback[markAsRead].found"]);
                    if (found && !found.read) setUnreadCount({
                        "NotificationProvider.useCallback[markAsRead]": (u)=>Math.max(0, u - 1)
                    }["NotificationProvider.useCallback[markAsRead]"]);
                }
            } catch (e) {}
        }
    }["NotificationProvider.useCallback[markAsRead]"], [
        activeNotifications
    ]);
    const markAllAsRead = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "NotificationProvider.useCallback[markAllAsRead]": async ()=>{
            try {
                const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["notificationService"].markAllAsRead();
                if (res.success) {
                    setActiveNotifications({
                        "NotificationProvider.useCallback[markAllAsRead]": (prev)=>prev.map({
                                "NotificationProvider.useCallback[markAllAsRead]": (n)=>({
                                        ...n,
                                        read: true
                                    })
                            }["NotificationProvider.useCallback[markAllAsRead]"])
                    }["NotificationProvider.useCallback[markAllAsRead]"]);
                    setUnreadCount(0);
                }
            } catch (e) {}
        }
    }["NotificationProvider.useCallback[markAllAsRead]"], []);
    const addLocalNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "NotificationProvider.useCallback[addLocalNotification]": function(message) {
            let type = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 'system';
            if (!user) return;
            const n = {
                id: "local_".concat(Date.now()),
                recipient: user.username,
                type: type,
                title: 'Notification',
                message,
                read: false,
                cleared: false,
                createdAt: new Date().toISOString(),
                priority: 'normal'
            };
            setActiveNotifications({
                "NotificationProvider.useCallback[addLocalNotification]": (prev)=>[
                        n,
                        ...prev
                    ]
            }["NotificationProvider.useCallback[addLocalNotification]"]);
            setUnreadCount({
                "NotificationProvider.useCallback[addLocalNotification]": (c)=>c + 1
            }["NotificationProvider.useCallback[addLocalNotification]"]);
        }
    }["NotificationProvider.useCallback[addLocalNotification]"], [
        user
    ]);
    const value = {
        activeNotifications,
        clearedNotifications,
        unreadCount,
        totalCount: activeNotifications.length + clearedNotifications.length,
        clearNotification,
        clearAllNotifications,
        restoreNotification,
        deleteNotification,
        deleteAllCleared,
        markAsRead,
        markAllAsRead,
        refreshNotifications: loadNotifications,
        isLoading,
        error,
        addLocalNotification
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(NotificationContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/NotificationContext.tsx",
        lineNumber: 351,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s1(NotificationProvider, "gF9PJTEg1uLvvLvliquvTLIoCB0=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useWebSocket"]
    ];
});
_c = NotificationProvider;
var _c;
__turbopack_context__.k.register(_c, "NotificationProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_context_a91b0545._.js.map