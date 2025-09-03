module.exports = {

"[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "AuthProvider": ()=>AuthProvider,
    "getGlobalAuthToken": ()=>getGlobalAuthToken,
    "useAuth": ()=>useAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/environment.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-ssr] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
// ==================== SCHEMAS ====================
const LoginPayloadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(60),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'buyer',
        'seller',
        'admin'
    ]).optional()
});
// ==================== HELPERS ====================
function safeNow() {
    try {
        return Date.now();
    } catch  {
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
    } catch  {
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
    baseURL;
    authContext;
    refreshPromise = null;
    constructor(baseURL, authContext){
        this.baseURL = baseURL.replace(/\/+$/, ''); // strip trailing slashes
        this.authContext = authContext;
    }
    /**
   * Build full API URL - handles both relative and absolute endpoints
   */ buildUrl(endpoint) {
        // If endpoint already starts with http/https, return as is
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
            return endpoint;
        }
        // Ensure endpoint starts with /
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        // If baseURL already ends with /api, don't add it again
        if (this.baseURL.endsWith('/api')) {
            return `${this.baseURL}${path}`;
        }
        // Otherwise, add /api prefix to the path
        return `${this.baseURL}/api${path}`;
    }
    async refreshTokens() {
        // Prevent multiple simultaneous refresh attempts
        if (this.refreshPromise) {
            return this.refreshPromise;
        }
        const tokens = this.authContext.getTokens();
        if (!tokens?.refreshToken) {
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
                if (response.ok && data?.success && data?.data) {
                    const expiresAt = deriveExpiry(// try both common fields
                    data.data.expiresIn ?? data.data.tokenExpiresIn, 30 * 60 * 1000 // fallback 30 minutes
                    );
                    const newTokens = {
                        token: data.data.token,
                        refreshToken: data.data.refreshToken || tokens.refreshToken,
                        expiresAt
                    };
                    this.authContext.setTokens(newTokens);
                    // Fire token update event for WebSocket
                    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                    ;
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
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
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
            return newTokens?.token || null;
        }
        return tokens.token;
    }
    async request(endpoint, options = {}) {
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
            headerObj['Authorization'] = `Bearer ${token}`;
        }
        const url = this.buildUrl(endpoint);
        const doFetch = async ()=>{
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
                    message: json?.error?.message || resp.statusText || 'Request failed'
                }
            };
        };
        try {
            const result = await doFetch();
            // Handle 401 Unauthorized - try to refresh token once
            if (!result.success && result?.error?.code === 401 && token) {
                const newTokens = await this.refreshTokens();
                if (newTokens) {
                    headerObj['Authorization'] = `Bearer ${newTokens.token}`;
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
}
// ==================== AUTH CONTEXT ====================
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Get API base URL from environment config
const API_BASE_URL = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiConfig"]?.baseUrl || ("TURBOPACK compile-time value", "http://localhost:5000") || 'http://localhost:5000';
// Enhanced Token storage with WebSocket event support
class TokenStorage {
    memoryTokens = null;
    constructor(){
        // Try to restore from sessionStorage on initialization
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }
    setTokens(tokens) {
        this.memoryTokens = tokens;
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }
    getTokens() {
        return this.memoryTokens;
    }
    clear() {
        this.memoryTokens = null;
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }
}
function AuthProvider({ children }) {
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isAuthReady, setIsAuthReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePathname"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    // Token storage instance
    const tokenStorageRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new TokenStorage());
    // API client instance with auth context
    const apiClientRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Refresh session - fetch current user
    const refreshSession = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        const tokens = tokenStorageRef.current.getTokens();
        if (!tokens?.token) {
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
    }, []);
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
    const clearError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setError(null);
    }, []);
    // Get auth token
    const getAuthToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const tokens = tokenStorageRef.current.getTokens();
        return tokens?.token || null;
    }, []);
    // Initialize auth state on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const initAuth = async ()=>{
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
        };
        initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // refreshSession is stable here; intentional single-run
    const login = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, password, role = 'buyer')=>{
        console.log('[Auth] Login attempt:', {
            username,
            role,
            hasPassword: !!password
        });
        setLoading(true);
        setError(null);
        try {
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
            const cleanUsername = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"] ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(parsed.data.username) : parsed.data.username.trim();
            const payload = {
                username: cleanUsername,
                password: parsed.data.password,
                role: parsed.data.role
            };
            // Use the API client which handles URL construction properly
            const response = await apiClientRef.current.post('/auth/login', payload);
            console.log('[Auth] Login response:', {
                success: response.success,
                hasUser: !!response.data?.user
            });
            if (response.success && response.data) {
                // Calculate token expiration (prefer backend hints)
                const expiresAt = deriveExpiry(// try common fields the backend might send
                response.data.expiresIn ?? response.data.tokenExpiresIn, 7 * 24 * 60 * 60 * 1000 // fallback 7 days
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
                const errorMessage = response?.error?.message || 'Login failed';
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
    }, []);
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
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
    }, [
        getAuthToken,
        router
    ]);
    // Update user function
    const updateUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (updates)=>{
        if (!user) {
            setError('No user to update');
            return;
        }
        try {
            const response = await apiClientRef.current.patch(`/users/${user.username}/profile`, updates);
            if (response.success && response.data) {
                setUser(response.data);
            } else {
                setError(response.error?.message || 'Failed to update user');
            }
        } catch (error) {
            console.error('Update user error:', error);
            setError(error.message || 'Failed to update user');
        }
    }, [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AuthContext.tsx",
        lineNumber: 656,
        columnNumber: 10
    }, this);
}
function useAuth() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
const getGlobalAuthToken = ()=>{
    if ("TURBOPACK compile-time truthy", 1) return null;
    //TURBOPACK unreachable
    ;
};
}),
"[project]/src/context/ToastContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/context/ToastContext.tsx
__turbopack_context__.s({
    "ToastProvider": ()=>ToastProvider,
    "toastApiError": ()=>toastApiError,
    "useToast": ()=>useToast
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-check-big.js [app-ssr] (ecmascript) <export default as CheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/circle-alert.js [app-ssr] (ecmascript) <export default as AlertCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/info.js [app-ssr] (ecmascript) <export default as Info>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/triangle-alert.js [app-ssr] (ecmascript) <export default as AlertTriangle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-ssr] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const ToastContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
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
    success: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$check$2d$big$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__CheckCircle$3e$__["CheckCircle"],
    error: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$circle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertCircle$3e$__["AlertCircle"],
    info: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$info$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Info$3e$__["Info"],
    warning: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$triangle$2d$alert$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__AlertTriangle$3e$__["AlertTriangle"],
    loading: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"]
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
function ToastProvider({ children }) {
    const [toasts, setToasts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const timersRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    // Generate unique ID
    const generateId = ()=>`toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Show toast
    const showToast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((toast)=>{
        const id = generateId();
        const newToast = {
            ...toast,
            id,
            duration: toast.duration ?? DEFAULT_DURATIONS[toast.type],
            dismissible: toast.dismissible ?? true
        };
        setToasts((prev)=>[
                ...prev,
                newToast
            ]);
        // Auto-dismiss if duration is set and not persistent
        if (newToast.duration && !newToast.persistent) {
            const timer = setTimeout(()=>{
                removeToast(id);
            }, newToast.duration);
            timersRef.current.set(id, timer);
        }
        return id;
    }, []);
    // Update toast
    const updateToast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id, updates)=>{
        setToasts((prev)=>prev.map((toast)=>toast.id === id ? {
                    ...toast,
                    ...updates
                } : toast));
        // Handle duration updates
        if (updates.duration !== undefined) {
            const existingTimer = timersRef.current.get(id);
            if (existingTimer) {
                clearTimeout(existingTimer);
                timersRef.current.delete(id);
            }
            if (updates.duration && !updates.persistent) {
                const timer = setTimeout(()=>{
                    removeToast(id);
                }, updates.duration);
                timersRef.current.set(id, timer);
            }
        }
    }, []);
    // Remove toast
    const removeToast = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((id)=>{
        // Clear any existing timer
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
        setToasts((prev)=>prev.filter((toast)=>toast.id !== id));
    }, []);
    // Clear all toasts
    const clearToasts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        // Clear all timers
        timersRef.current.forEach((timer)=>clearTimeout(timer));
        timersRef.current.clear();
        setToasts([]);
    }, []);
    // Convenience methods
    const success = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((title, message)=>showToast({
            type: 'success',
            title,
            message
        }), [
        showToast
    ]);
    const error = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((title, message)=>showToast({
            type: 'error',
            title,
            message
        }), [
        showToast
    ]);
    const info = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((title, message)=>showToast({
            type: 'info',
            title,
            message
        }), [
        showToast
    ]);
    const warning = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((title, message)=>showToast({
            type: 'warning',
            title,
            message
        }), [
        showToast
    ]);
    const loading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((title, message)=>showToast({
            type: 'loading',
            title,
            message,
            persistent: true
        }), [
        showToast
    ]);
    // Promise handler
    const promise = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (promise, messages)=>{
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
    }, [
        loading,
        updateToast
    ]);
    // Cleanup timers on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        return ()=>{
            timersRef.current.forEach((timer)=>clearTimeout(timer));
            timersRef.current.clear();
        };
    }, []);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastContext.Provider, {
        value: value,
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastContainer, {}, void 0, false, {
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
// Toast Container Component
function ToastContainer() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ToastContext);
    if (!context) return null;
    const { toasts, removeToast } = context;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed top-4 right-4 z-50 pointer-events-none",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AnimatePresence"], {
            mode: "popLayout",
            children: toasts.map((toast)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastItem, {
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
// Individual Toast Component
function ToastItem({ toast, onRemove }) {
    const Icon = TOAST_ICONS[toast.type];
    const colors = TOAST_COLORS[toast.type];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["motion"].div, {
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
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: `
        ${colors.bg} ${colors.border}
        border rounded-lg shadow-lg p-4
        max-w-sm min-w-[300px]
        backdrop-blur-sm
      `,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-start gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                        className: `w-5 h-5 ${colors.icon} flex-shrink-0 ${toast.type === 'loading' ? 'animate-spin' : ''}`
                    }, void 0, false, {
                        fileName: "[project]/src/context/ToastContext.tsx",
                        lineNumber: 305,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-semibold text-white",
                                children: toast.title
                            }, void 0, false, {
                                fileName: "[project]/src/context/ToastContext.tsx",
                                lineNumber: 310,
                                columnNumber: 13
                            }, this),
                            toast.message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-gray-400 mt-1",
                                children: toast.message
                            }, void 0, false, {
                                fileName: "[project]/src/context/ToastContext.tsx",
                                lineNumber: 314,
                                columnNumber: 15
                            }, this),
                            toast.action && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                    toast.dismissible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: onRemove,
                        className: "text-gray-400 hover:text-white transition-colors",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
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
function useToast() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
function toastApiError(error, fallbackMessage = 'An error occurred') {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ToastContext);
    if (!context) return;
    let message = fallbackMessage;
    if (error?.response?.data?.error?.message) {
        message = error.response.data.error.message;
    } else if (error?.message) {
        message = error.message;
    }
    context.error('Error', message);
}
}),
"[project]/src/context/BanContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "BanProvider": ()=>BanProvider,
    "useBans": ()=>useBans
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/ban.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/users.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-ssr] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/permissions.ts [app-ssr] (ecmascript)");
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
        const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usersService"].getUser(username);
        if (result.success && result.data?.role) return result.data.role;
        return null;
    } catch (err) {
        console.error('[BanContext] Error checking user role:', err);
        return null;
    }
};
const BanContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// ================== Validation Schemas ==================
const banReasonSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
    'harassment',
    'spam',
    'inappropriate_content',
    'scam',
    'underage',
    'payment_fraud',
    'other'
]);
const banDurationSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal('permanent'),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().max(8760)
]);
const appealTextSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10).max(1000);
const customReasonSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(5).max(500);
const banNotesSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(1000);
// Simple IPv4, conservative; adjust if you need IPv6
const ipAddressSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().regex(/^(?:\d{1,3}\.){3}\d{1,3}$/);
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
    const cleanReviews = reviews.filter((r)=>!(r.reviewId?.startsWith?.('mock_') || isMockString(r.reviewerAdmin) || isMockString(r.reviewNotes)));
    const cleanIPBans = ipBans.filter((ip)=>!(ip.ipAddress?.startsWith?.('0.0.0') || isMockString(ip.reason)));
    const removed = {
        bans: bans.length - cleanBans.length,
        history: history.length - cleanHistory.length,
        reviews: reviews.length - cleanReviews.length,
        ipBans: ipBans.length - cleanIPBans.length
    };
    if (removed.bans || removed.history || removed.reviews || removed.ipBans) {
        console.warn('[BanContext] Removed mock/dev data from storage:', removed);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.BANS, cleanBans);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.HISTORY, cleanHistory);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.REVIEWS, cleanReviews);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.IP_BANS, cleanIPBans);
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
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = ()=>reject(new Error('Image load failed'));
                img.src = event.target?.result;
            };
            reader.onerror = ()=>reject(new Error('File read failed'));
            reader.readAsDataURL(file);
        } catch (e) {
            reject(e);
        }
    });
const BanProvider = ({ children })=>{
    const [bans, setBans] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [banHistory, setBanHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [appealReviews, setAppealReviews] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [ipBans, setIPBans] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isInitialized, setIsInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    // Track active timers to prevent leaks
    const activeTimers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    // Saving guard
    const isSavingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    // Dev override to allow non-admin actions locally when explicitly enabled
    const canAdminAct = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((action)=>{
        const devBypass = process.env.NEXT_PUBLIC_ALLOW_LOCAL_BAN === '1';
        if (devBypass && user) {
            console.warn(`[BanContext] Dev override enabled for action: ${action} by ${user.username}`);
            return true;
        }
        return !!(user && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isAdmin"])(user));
    }, [
        user
    ]);
    // Force refresh function
    const refreshBanData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        console.log('[BanContext] Force refreshing ban data...');
        setIsInitialized(false);
        await loadData(true);
    }, []);
    // Load from storage using service
    const loadData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (forceRefresh = false)=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    }, [
        isInitialized
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        loadData();
    }, [
        loadData
    ]);
    // Persistors (guarded to avoid loops)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        bans,
        isInitialized
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        banHistory,
        isInitialized
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        appealReviews,
        isInitialized
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        ipBans,
        isInitialized
    ]);
    // Cleanup timers on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        return ()=>{
            activeTimers.current.forEach((t)=>clearTimeout(t));
            activeTimers.current.clear();
        };
    }, []);
    // ---------- Validation (async because we may look up role) ----------
    const validateBanInput = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, hours, reason, targetUserRole)=>{
        const sanitized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
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
    }, []);
    // ---------- History helper ----------
    const addBanHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((action, username, details, adminUsername, metadata)=>{
        const historyEntry = {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
            username: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username,
            action,
            details: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(details),
            timestamp: new Date().toISOString(),
            adminUsername: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(adminUsername) || adminUsername,
            metadata
        };
        setBanHistory((prev)=>[
                ...prev,
                historyEntry
            ]);
    }, []);
    // ---------- Unban first (used by scheduler) ----------
    const clearExpirationTimer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((banId)=>{
        const t = activeTimers.current.get(banId);
        if (t) {
            clearTimeout(t);
            activeTimers.current.delete(banId);
        }
    }, []);
    const unbanUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, adminUsername, reason)=>{
        // Admin-only
        if (!canAdminAct('unban')) {
            console.warn('[BanContext] Unban blocked: admin privileges required');
            return false;
        }
        try {
            const cleanUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username;
            const cleanAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(adminUsername || user?.username || 'system');
            const cleanReason = reason ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reason) : 'Ban lifted by admin';
            const banToUnban = bans.find((b)=>b.username === cleanUsername && b.active);
            if (!banToUnban) {
                console.warn('[BanContext] No active ban found for', cleanUsername);
                return false;
            }
            // stop any scheduled expiration
            clearExpirationTimer(banToUnban.id);
            const updated = bans.map((b)=>b.id === banToUnban.id ? {
                    ...b,
                    active: false
                } : b);
            // Persist first to avoid race
            isSavingRef.current = true;
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem(STORAGE_KEYS.BANS, updated);
            isSavingRef.current = false;
            setBans(updated);
            addBanHistory('unbanned', cleanUsername, cleanReason, cleanAdmin);
            // UI event
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            console.log('[BanContext] User unbanned:', cleanUsername);
            return true;
        } catch (err) {
            console.error('[BanContext] Error unbanning user:', err);
            isSavingRef.current = false;
            return false;
        }
    }, [
        bans,
        addBanHistory,
        clearExpirationTimer,
        canAdminAct,
        user?.username
    ]);
    // ---------- Scheduler ----------
    const scheduleExpiration = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((ban)=>{
        if (ban.banType === 'permanent' || !ban.endTime || !ban.active) return;
        const ms = new Date(ban.endTime).getTime() - Date.now();
        if (ms <= 0) return;
        console.log(`[BanContext] Scheduling expiration for ${ban.username} in ~${Math.round(ms / 60000)} minutes`);
        const t = setTimeout(async ()=>{
            console.log(`[BanContext] Auto-expiring ban for ${ban.username}`);
            await unbanUser(ban.username, 'system', 'Automatic expiration');
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            activeTimers.current.delete(ban.id);
        }, ms);
        activeTimers.current.set(ban.id, t);
    }, [
        unbanUser
    ]);
    // ---------- Ban user ----------
    const banUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, hours, reason, customReason, adminUsername, reportIds = [], notes, targetUserRole)=>{
        // Admin-only
        if (!canAdminAct('ban')) {
            console.warn('[BanContext] Ban blocked: admin privileges required');
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
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
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            }
            return false;
        }
        // Sanitize inputs
        const cleanUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username;
        const cleanAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(adminUsername || user?.username || 'system');
        const cleanNotes = notes ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(notes) : undefined;
        let cleanCustomReason;
        if (customReason) {
            const cr = customReasonSchema.safeParse(customReason);
            if (!cr.success) {
                console.error('[BanContext] Custom reason too short/long');
                return false;
            }
            cleanCustomReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(cr.data);
        }
        // Lock to avoid duplicate bans
        const lockKey = `ban_user_${cleanUsername}`;
        const existingLock = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].getItem(lockKey, null);
        if (existingLock) {
            try {
                const age = Date.now() - (existingLock.timestamp || 0);
                if (age < 30_000) {
                    console.warn(`[BanContext] Ban already in progress for ${cleanUsername}`);
                    return false;
                }
            } catch  {
            // ignore bad lock
            }
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem(lockKey, {
            timestamp: Date.now(),
            adminUser: cleanAdmin
        });
        try {
            // Already banned?
            const already = bans.find((b)=>b.username === cleanUsername && b.active);
            if (already) {
                console.warn(`[BanContext] ${cleanUsername} is already banned`);
                return false;
            }
            // Save to DB (best-effort)
            const apiResponse = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$ban$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["banService"].createBan({
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
            setBans((prev)=>[
                    ...prev,
                    newBan
                ]);
            if (newBan.banType === 'temporary' && newBan.endTime) {
                scheduleExpiration(newBan);
            }
            const durationText = hours === 'permanent' ? 'permanently' : `for ${hours} hours`;
            addBanHistory('banned', cleanUsername, `Banned ${durationText} for ${reason}${cleanCustomReason ? `: ${cleanCustomReason}` : ''}`, cleanAdmin, {
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
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].removeItem(lockKey);
        }
    }, [
        bans,
        addBanHistory,
        scheduleExpiration,
        validateBanInput,
        canAdminAct,
        user?.username
    ]);
    // ---------- Appeals ----------
    const submitAppeal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, appealText, evidence)=>{
        try {
            // Allow the banned user themselves OR an admin acting on their behalf
            const requester = user?.username;
            const isSelf = requester && (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(requester) === (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username);
            if (!isSelf && !canAdminAct('submitAppeal')) {
                console.warn('[BanContext] Appeal submission blocked: not the user or admin');
                return false;
            }
            const cleanUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username;
            const appealValidation = appealTextSchema.safeParse(appealText);
            if (!appealValidation.success) {
                console.error('[BanContext] Invalid appeal text:', appealValidation.error);
                return false;
            }
            const cleanAppealText = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(appealValidation.data);
            let appealEvidence = [];
            if (evidence && evidence.length > 0) {
                try {
                    // Only first 3 images
                    const trimmed = evidence.slice(0, 3);
                    appealEvidence = await Promise.all(trimmed.map((f)=>compressImage(f)));
                } catch (err) {
                    console.error('[BanContext] Evidence processing failed:', err);
                }
            }
            setBans((prev)=>prev.map((ban)=>ban.username === cleanUsername && ban.active && ban.appealable ? {
                        ...ban,
                        appealSubmitted: true,
                        appealText: cleanAppealText,
                        appealDate: new Date().toISOString(),
                        appealStatus: 'pending',
                        appealEvidence
                    } : ban));
            addBanHistory('appeal_submitted', cleanUsername, `Appeal submitted: "${cleanAppealText.substring(0, 100)}${cleanAppealText.length > 100 ? '...' : ''}"`, cleanUsername, {
                evidenceCount: appealEvidence.length
            });
            return true;
        } catch (err) {
            console.error('[BanContext] Error submitting appeal:', err);
            return false;
        }
    }, [
        addBanHistory,
        canAdminAct,
        user?.username
    ]);
    const reviewAppeal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((banId, decision, reviewNotes, adminUsername)=>{
        // Admin-only
        if (!canAdminAct('reviewAppeal')) {
            console.warn('[BanContext] Review appeal blocked: admin privileges required');
            return false;
        }
        try {
            const cleanNotes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reviewNotes);
            const cleanAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(adminUsername || user?.username || 'system');
            const review = {
                reviewId: Date.now().toString() + Math.random().toString(36).slice(2, 11),
                banId,
                reviewerAdmin: cleanAdmin,
                reviewNotes: cleanNotes,
                decision,
                reviewDate: new Date().toISOString(),
                escalationReason: decision === 'escalate' ? cleanNotes : undefined
            };
            setAppealReviews((prev)=>[
                    ...prev,
                    review
                ]);
            const ban = bans.find((b)=>b.id === banId);
            if (!ban) return false;
            if (decision === 'approve') return approveAppeal(banId, cleanAdmin);
            if (decision === 'reject') return rejectAppeal(banId, cleanAdmin, cleanNotes);
            if (decision === 'escalate') return escalateAppeal(banId, cleanAdmin, cleanNotes);
            return true;
        } catch (err) {
            console.error('[BanContext] Error reviewing appeal:', err);
            return false;
        }
    }, [
        bans,
        canAdminAct,
        user?.username
    ]);
    const approveAppeal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((banId, adminUsername)=>{
        // Admin-only
        if (!canAdminAct('approveAppeal')) return false;
        try {
            const ban = bans.find((b)=>b.id === banId);
            if (!ban) return false;
            setBans((prev)=>prev.map((b)=>b.id === banId ? {
                        ...b,
                        active: false,
                        appealStatus: 'approved'
                    } : b));
            clearExpirationTimer(banId);
            addBanHistory('appeal_approved', ban.username, 'Appeal approved and ban lifted', adminUsername);
            return true;
        } catch (err) {
            console.error('[BanContext] Error approving appeal:', err);
            return false;
        }
    }, [
        bans,
        addBanHistory,
        clearExpirationTimer,
        canAdminAct
    ]);
    const rejectAppeal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((banId, adminUsername, reason)=>{
        // Admin-only
        if (!canAdminAct('rejectAppeal')) return false;
        try {
            const ban = bans.find((b)=>b.id === banId);
            if (!ban) return false;
            setBans((prev)=>prev.map((b)=>b.id === banId ? {
                        ...b,
                        appealSubmitted: false,
                        appealText: undefined,
                        appealable: false,
                        appealStatus: 'rejected'
                    } : b));
            addBanHistory('appeal_rejected', ban.username, reason || 'Appeal rejected', adminUsername);
            return true;
        } catch (err) {
            console.error('[BanContext] Error rejecting appeal:', err);
            return false;
        }
    }, [
        bans,
        addBanHistory,
        canAdminAct
    ]);
    const escalateAppeal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((banId, adminUsername, escalationReason)=>{
        // Admin-only
        if (!canAdminAct('escalateAppeal')) return false;
        try {
            const ban = bans.find((b)=>b.id === banId);
            if (!ban) return false;
            setBans((prev)=>prev.map((b)=>b.id === banId ? {
                        ...b,
                        appealStatus: 'escalated'
                    } : b));
            addBanHistory('appeal_escalated', ban.username, `Appeal escalated: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(escalationReason)}`, adminUsername);
            return true;
        } catch (err) {
            console.error('[BanContext] Error escalating appeal:', err);
            return false;
        }
    }, [
        bans,
        addBanHistory,
        canAdminAct
    ]);
    // ---------- IP banning ----------
    const banUserIP = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((username, ipAddress, reason)=>{
        // Admin-only
        if (!canAdminAct('banUserIP')) {
            console.warn('[BanContext] IP ban blocked: admin privileges required');
            return false;
        }
        try {
            const cleanUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username;
            const ipValidation = ipAddressSchema.safeParse(ipAddress);
            if (!ipValidation.success) {
                console.error('[BanContext] Invalid IP address format');
                return false;
            }
            const cleanReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reason);
            const ipBan = {
                ipAddress: ipValidation.data,
                bannedUsernames: [
                    cleanUsername
                ],
                banDate: new Date().toISOString(),
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                reason: cleanReason
            };
            setIPBans((prev)=>{
                const existing = prev.find((b)=>b.ipAddress === ipValidation.data);
                if (existing) {
                    return prev.map((b)=>b.ipAddress === ipValidation.data ? {
                            ...b,
                            bannedUsernames: [
                                ...new Set([
                                    ...b.bannedUsernames,
                                    cleanUsername
                                ])
                            ]
                        } : b);
                }
                return [
                    ...prev,
                    ipBan
                ];
            });
            return true;
        } catch (err) {
            console.error('[BanContext] Error banning IP:', err);
            return false;
        }
    }, [
        canAdminAct
    ]);
    const isIPBanned = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((ipAddress)=>{
        const now = new Date();
        return ipBans.some((ban)=>ban.ipAddress === ipAddress && (!ban.expiryDate || new Date(ban.expiryDate) > now));
    }, [
        ipBans
    ]);
    // ---------- Queries ----------
    const isUserBanned = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((username)=>{
        const cleanUsername = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username) || username;
        const activeBan = bans.find((b)=>b.username === cleanUsername && b.active);
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
    }, [
        bans,
        unbanUser
    ]);
    const getBanInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((username)=>{
        return isUserBanned(username);
    }, [
        isUserBanned
    ]);
    const getActiveBans = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const active = bans.filter((b)=>b.active).map((b)=>{
            if (b.banType === 'temporary' && b.endTime) {
                const now = new Date();
                const end = new Date(b.endTime);
                const remainingMs = end.getTime() - now.getTime();
                b.remainingHours = Math.max(0, Math.ceil(remainingMs / 3_600_000));
            }
            return b;
        });
        console.log('[BanContext] Getting active bans:', {
            total: bans.length,
            active: active.length,
            usernames: active.map((b)=>b.username)
        });
        return active;
    }, [
        bans
    ]);
    const getExpiredBans = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        return bans.filter((b)=>!b.active);
    }, [
        bans
    ]);
    const getUserBanHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((username)=>bans.filter((b)=>b.username === username), [
        bans
    ]);
    const updateExpiredBans = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        const now = new Date();
        let changed = false;
        setBans((prev)=>prev.map((b)=>{
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
            }));
        if (changed) console.log('[BanContext] Expired bans updated');
    }, [
        addBanHistory,
        clearExpirationTimer
    ]);
    const getBanStats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
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
        active.forEach((b)=>{
            bansByReason[b.reason]++;
        });
        const allAppeals = bans.filter((b)=>b.appealSubmitted);
        const appealStats = {
            totalAppeals: allAppeals.length,
            pendingAppeals: allAppeals.filter((b)=>b.appealStatus === 'pending').length,
            approvedAppeals: banHistory.filter((h)=>h.action === 'appeal_approved').length,
            rejectedAppeals: banHistory.filter((h)=>h.action === 'appeal_rejected').length
        };
        const stats = {
            totalActiveBans: active.length,
            temporaryBans: active.filter((b)=>b.banType === 'temporary').length,
            permanentBans: active.filter((b)=>b.banType === 'permanent').length,
            pendingAppeals: active.filter((b)=>b.appealSubmitted && b.appealStatus === 'pending').length,
            recentBans24h: bans.filter((b)=>new Date(b.startTime) >= hours24Ago).length,
            bansByReason,
            appealStats
        };
        console.log('[BanContext] Ban stats:', stats);
        return stats;
    }, [
        getActiveBans,
        bans,
        banHistory
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(BanContext.Provider, {
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
const useBans = ()=>{
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(BanContext);
    if (!ctx) {
        throw new Error('useBans must be used within a BanProvider');
    }
    return ctx;
};
}),
"[project]/src/context/WebSocketContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/context/WebSocketContext.tsx
__turbopack_context__.s({
    "WebSocketProvider": ()=>WebSocketProvider,
    "useWebSocket": ()=>useWebSocket
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$websocket$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/websocket.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/websocket.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/environment.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
;
const WebSocketContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const useWebSocket = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(WebSocketContext);
    // Return null instead of throwing to allow components to handle missing context gracefully
    return context || null;
};
const WebSocketProvider = ({ children })=>{
    const { user, getAuthToken } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [isConnected, setIsConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [connectionState, setConnectionState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketState"].DISCONNECTED);
    const [typingUsers, setTypingUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Map());
    const [onlineUsers, setOnlineUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Set());
    const [notifications, setNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const typingTimers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    const wsService = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$websocket$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getWebSocketService"])());
    const currentToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const hasInitialized = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const pendingSubscriptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])([]); // Store pending subscriptions
    // Listen for auth token events from AuthContext
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const handleTokenUpdate = undefined;
        const handleTokenClear = undefined;
    }, [
        user
    ]);
    // Improved WebSocket initialization
    const initializeWebSocket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!user || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["websocketConfig"].enabled) {
            console.log('[WebSocket] User not available or WebSocket disabled');
            return undefined;
        }
        // Try multiple ways to get the auth token
        let token = currentToken.current;
        if (!token) {
            token = getAuthToken();
        }
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        if (!token) {
            console.log('[WebSocket] No auth token available');
            return undefined;
        }
        console.log('[WebSocket] Initializing with token:', !!token);
        currentToken.current = token;
        try {
            // Use WebSocket URL from config
            const wsUrl = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["websocketConfig"].url || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["apiConfig"].baseUrl.replace('/api', '').replace('http', 'ws');
            // Create WebSocket service if it doesn't exist
            if (!wsService.current) {
                wsService.current = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$websocket$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createWebSocketService"])({
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
            const unsubConnect = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].CONNECT, ()=>{
                setIsConnected(true);
                setConnectionState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketState"].CONNECTED);
                console.log('[WebSocket] Connected');
                // Process any pending subscriptions
                if (pendingSubscriptions.current.length > 0) {
                    console.log('[WebSocket] Processing', pendingSubscriptions.current.length, 'pending subscriptions');
                    const pending = [
                        ...pendingSubscriptions.current
                    ];
                    pendingSubscriptions.current = [];
                    pending.forEach(({ event, handler })=>{
                        if (wsService.current) {
                            wsService.current.on(event, handler);
                        }
                    });
                }
                // Send initial online status
                updateOnlineStatus(true);
            });
            const unsubDisconnect = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].DISCONNECT, ()=>{
                setIsConnected(false);
                setConnectionState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketState"].DISCONNECTED);
                setOnlineUsers(new Set());
                setTypingUsers(new Map());
                console.log('[WebSocket] Disconnected');
            });
            const unsubError = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].ERROR, (error)=>{
                setConnectionState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketState"].ERROR);
                console.error('[WebSocket] Error:', error);
            });
            // Subscribe to app events
            const unsubTyping = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].MESSAGE_TYPING, handleTypingUpdate);
            const unsubUserOnline = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_ONLINE, handleUserOnline);
            const unsubUserOffline = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_OFFLINE, handleUserOffline);
            const unsubNotification = wsService.current.on(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].NOTIFICATION_NEW, handleNewNotification);
            // Subscribe to message events
            const unsubMessageNew = wsService.current.on('message:new', (data)=>{
                console.log('[WebSocket Context] New message received:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            const unsubMessageRead = wsService.current.on('message:read', (data)=>{
                console.log('[WebSocket Context] Message read event:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            // Subscribe to order events
            const unsubOrderCreated = wsService.current.on('order:created', (data)=>{
                console.log('[WebSocket Context] Order created event received:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            const unsubOrderNew = wsService.current.on('order:new', (data)=>{
                console.log('[WebSocket Context] Order new event received:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            // Subscribe to auction events
            const unsubAuctionWon = wsService.current.on('auction:won', (data)=>{
                console.log('[WebSocket Context] Auction won event received:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            const unsubAuctionEnded = wsService.current.on('auction:ended', (data)=>{
                console.log('[WebSocket Context] Auction ended event received:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            const unsubListingSold = wsService.current.on('listing:sold', (data)=>{
                console.log('[WebSocket Context] Listing sold event received:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            // Subscribe to wallet balance updates
            const unsubWalletUpdate = wsService.current.on('wallet:balance_update', (data)=>{
                console.log('[WebSocket Context] Wallet balance update:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            const unsubWalletTransaction = wsService.current.on('wallet:transaction', (data)=>{
                console.log('[WebSocket Context] Wallet transaction:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            // Subscribe to notification events
            const unsubNotificationNew = wsService.current.on('notification:new', (data)=>{
                console.log('[WebSocket Context] New notification:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            const unsubNotificationCleared = wsService.current.on('notification:cleared', (data)=>{
                console.log('[WebSocket Context] Notification cleared:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            const unsubNotificationAllCleared = wsService.current.on('notification:all_cleared', (data)=>{
                console.log('[WebSocket Context] All notifications cleared:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            const unsubNotificationRestored = wsService.current.on('notification:restored', (data)=>{
                console.log('[WebSocket Context] Notification restored:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            const unsubNotificationDeleted = wsService.current.on('notification:deleted', (data)=>{
                console.log('[WebSocket Context] Notification deleted:', data);
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            });
            // Connect
            wsService.current.connect();
            // Store cleanup functions
            return ()=>{
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
            };
        } catch (error) {
            console.error('[WebSocket] Initialization error:', error);
            setConnectionState(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketState"].ERROR);
            return undefined;
        }
    }, [
        user,
        getAuthToken
    ]);
    // Initialize WebSocket connection when user is available
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let cleanup;
        const init = async ()=>{
            if (!hasInitialized.current && user && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["websocketConfig"].enabled) {
                hasInitialized.current = true;
                cleanup = await initializeWebSocket();
            }
        };
        if (user && __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$environment$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["websocketConfig"].enabled) {
            init();
        } else if (wsService.current?.isConnected()) {
            // Disconnect if no user or WebSocket disabled
            wsService.current.disconnect();
            hasInitialized.current = false;
        }
        return ()=>{
            cleanup?.();
            hasInitialized.current = false;
        };
    }, [
        user,
        initializeWebSocket
    ]);
    // Cleanup on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        return ()=>{
            typingTimers.current.forEach((timer)=>clearTimeout(timer));
            if (wsService.current?.isConnected()) {
                wsService.current.disconnect();
            }
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$websocket$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["destroyWebSocketService"])();
        };
    }, []);
    // Handle typing updates
    const handleTypingUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((data)=>{
        const key = `${data.conversationId}-${data.userId}`;
        if (data.isTyping) {
            setTypingUsers((prev)=>new Map(prev).set(key, data));
            // Clear existing timer
            const existingTimer = typingTimers.current.get(key);
            if (existingTimer) {
                clearTimeout(existingTimer);
            }
            // Set new timer to remove typing indicator after 3 seconds
            const timer = setTimeout(()=>{
                setTypingUsers((prev)=>{
                    const newMap = new Map(prev);
                    newMap.delete(key);
                    return newMap;
                });
                typingTimers.current.delete(key);
            }, 3000);
            typingTimers.current.set(key, timer);
        } else {
            setTypingUsers((prev)=>{
                const newMap = new Map(prev);
                newMap.delete(key);
                return newMap;
            });
            const timer = typingTimers.current.get(key);
            if (timer) {
                clearTimeout(timer);
                typingTimers.current.delete(key);
            }
        }
    }, []);
    // Handle user online
    const handleUserOnline = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((data)=>{
        setOnlineUsers((prev)=>new Set(prev).add(data.userId));
    }, []);
    // Handle user offline
    const handleUserOffline = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((data)=>{
        setOnlineUsers((prev)=>{
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
        });
    }, []);
    // Handle new notification
    const handleNewNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((notification)=>{
        setNotifications((prev)=>[
                notification,
                ...prev
            ].slice(0, 50)); // Keep last 50
    }, []);
    // Public methods
    const connect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        if (!currentToken.current) {
            currentToken.current = getAuthToken() || (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getGlobalAuthToken"])();
        }
        wsService.current?.connect();
    }, [
        getAuthToken
    ]);
    const disconnect = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        wsService.current?.disconnect();
    }, []);
    // FIXED: Subscribe method that queues subscriptions if service not ready
    const subscribe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((event, handler)=>{
        if (!wsService.current) {
            console.log('[WebSocket] Service not initialized - queueing subscription for:', event);
            // Queue the subscription for later
            pendingSubscriptions.current.push({
                event,
                handler
            });
            // Return a cleanup function that removes from pending if not yet processed
            return ()=>{
                const index = pendingSubscriptions.current.findIndex((sub)=>sub.event === event && sub.handler === handler);
                if (index !== -1) {
                    pendingSubscriptions.current.splice(index, 1);
                }
            };
        }
        // Service is ready, subscribe immediately
        return wsService.current.on(event, handler);
    }, []);
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((event, data)=>{
        if (!wsService.current?.isConnected()) {
            console.warn('[WebSocket] Not connected, cannot send message');
            return;
        }
        wsService.current.send(event, data);
    }, []);
    const sendTyping = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((conversationId, isTyping)=>{
        if (!user) return;
        sendMessage(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].MESSAGE_TYPING, {
            userId: user.id,
            username: user.username,
            conversationId,
            isTyping
        });
    }, [
        user,
        sendMessage
    ]);
    const updateOnlineStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((isOnline)=>{
        if (!user) return;
        sendMessage(isOnline ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_ONLINE : __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].USER_OFFLINE, {
            userId: user.id,
            isOnline
        });
    }, [
        user,
        sendMessage
    ]);
    const markNotificationRead = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((notificationId)=>{
        setNotifications((prev)=>prev.map((n)=>n.id === notificationId ? {
                    ...n,
                    read: true
                } : n));
        sendMessage(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].NOTIFICATION_READ, {
            notificationId
        });
    }, [
        sendMessage
    ]);
    const clearNotifications = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setNotifications([]);
    }, []);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(WebSocketContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/WebSocketContext.tsx",
        lineNumber: 544,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
}),
"[project]/src/context/WalletContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/context/WalletContext.tsx
__turbopack_context__.s({
    "WalletContext": ()=>WalletContext,
    "WalletProvider": ()=>WalletProvider,
    "useWallet": ()=>useWallet
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-ssr] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/websocket.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-ssr] (ecmascript) <locals>");
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
;
// Debug mode helper
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG === 'true';
const debugLog = (...args)=>{
    if (DEBUG_MODE) {
        console.log('[WalletContext]', ...args);
    }
};
// Validation schemas for wallet operations
const walletOperationSchemas = {
    transactionAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().min(0.01).max(100000),
    balanceAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().min(0).max(100000),
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
    reason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(500),
    withdrawalAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().min(10).max(10000),
    tipAmount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().positive().min(1).max(500),
    depositMethod: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'credit_card',
        'bank_transfer',
        'crypto',
        'admin_credit'
    ])
};
// Enhanced deduplication manager with configurable expiry
class DeduplicationManager {
    processedEvents = new Map();
    cleanupInterval = null;
    expiryMs;
    constructor(expiryMs = 30000){
        this.expiryMs = expiryMs;
        this.startCleanup();
    }
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
            key = `${eventType}_${data.username}_${data.balance || data.newBalance}_${data.timestamp || Date.now()}`;
        } else if (eventType === 'transaction') {
            key = `${eventType}_${data.id || data.transactionId}_${data.from}_${data.to}_${data.amount}`;
        } else if (eventType === 'order_created') {
            key = `${eventType}_${data.id || data._id}_${data.buyer}_${data.seller}`;
        } else {
            key = `${eventType}_${JSON.stringify(data)}`;
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
}
// Helper function to check if user is admin
const isAdminUser = (username)=>{
    return username === 'oakley' || username === 'gerome' || username === 'platform' || username === 'admin';
};
// Transaction throttle manager
class ThrottleManager {
    lastCallTimes = new Map();
    shouldThrottle(key, minIntervalMs = 3000) {
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
}
// Transaction lock manager for preventing race conditions
class TransactionLockManager {
    locks = new Map();
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
}
const WalletContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function WalletProvider({ children }) {
    const { user, getAuthToken, apiClient } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const webSocketContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWebSocket"])();
    // Extract properties from WebSocket context safely
    const sendMessage = webSocketContext?.sendMessage;
    const subscribe = webSocketContext?.subscribe;
    const isConnected = webSocketContext?.isConnected || false;
    // State management - these will be populated from API
    const [buyerBalances, setBuyerBalancesState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [adminBalance, setAdminBalanceState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [sellerBalances, setSellerBalancesState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [orderHistory, setOrderHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [sellerWithdrawals, setSellerWithdrawals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [adminWithdrawals, setAdminWithdrawals] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [adminActions, setAdminActions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [depositLogs, setDepositLogs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [addSellerNotification, setAddSellerNotification] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Loading and initialization state
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isInitialized, setIsInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [initializationError, setInitializationError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Refs
    const initializingRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(false);
    const rateLimiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRateLimiter"])());
    const transactionLock = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new TransactionLockManager());
    const deduplicationManager = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new DeduplicationManager(30000)); // 30 second expiry
    const throttleManager = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new ThrottleManager());
    // FIX: Add refs to track last fetched data for deduplication
    const lastFiredBalanceRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastPlatformBalanceFetch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lastAdminActionsFetch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    const setAddSellerNotificationCallback = (fn)=>{
        setAddSellerNotification(()=>fn);
    };
    // Cleanup on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        return ()=>{
            deduplicationManager.current.destroy();
            throttleManager.current.clear();
        };
    }, []);
    // FIX: Enhanced fireAdminBalanceUpdateEvent with deduplication
    const fireAdminBalanceUpdateEvent = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((balance)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, []);
    // Helper function to validate amounts
    const validateTransactionAmount = (amount)=>{
        const validation = walletOperationSchemas.transactionAmount.safeParse(amount);
        if (!validation.success) {
            throw new Error('Invalid transaction amount: ' + validation.error.errors[0]?.message);
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeCurrency"])(validation.data);
    };
    const validateUsername = (username)=>{
        const validation = walletOperationSchemas.username.safeParse(username);
        if (!validation.success) {
            throw new Error('Invalid username: ' + validation.error.errors[0]?.message);
        }
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(validation.data);
    };
    // Check rate limit
    const checkRateLimit = (operation, identifier)=>{
        const rateLimitConfig = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RATE_LIMITS"][operation] || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RATE_LIMITS"].API_CALL;
        const result = rateLimiter.current.check(operation, {
            ...rateLimitConfig,
            identifier
        });
        if (!result.allowed) {
            throw new Error(`Rate limit exceeded. Please wait ${result.waitTime} seconds before trying again.`);
        }
    };
    // CRITICAL FIX: Fetch actual orders from /orders endpoint
    const fetchOrderHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username)=>{
        try {
            debugLog('Fetching orders for:', username);
            // Use the orders endpoint with buyer parameter
            const response = await apiClient.get(`/orders?buyer=${username}`);
            debugLog('Orders response:', response);
            if (response.success && response.data) {
                // The orders should already be in the correct format
                setOrderHistory(response.data);
                debugLog('Order history updated:', response.data.length, 'orders');
            }
        } catch (error) {
            console.error('[WalletContext] Failed to fetch order history:', error);
        }
    }, [
        apiClient
    ]);
    // Also fetch transactions for transaction history (keep this separate)
    const fetchTransactionHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username)=>{
        try {
            debugLog('Fetching transactions for:', username);
            // For admin users, fetch platform transactions
            const queryUsername = isAdminUser(username) ? 'platform' : username;
            const response = await apiClient.get(`/wallet/transactions/${queryUsername}`);
            debugLog('Transactions response:', response);
        // Don't try to convert transactions to orders anymore
        // Transactions and orders are separate things
        } catch (error) {
            console.error('[WalletContext] Failed to fetch transaction history:', error);
        }
    }, [
        apiClient
    ]);
    // CRITICAL FIX: Fetch admin platform wallet balance with proper throttling
    const fetchAdminPlatformBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
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
    }, [
        user,
        apiClient,
        fireAdminBalanceUpdateEvent,
        adminBalance
    ]);
    // CRITICAL FIX: Fetch admin actions from API with throttling
    const fetchAdminActions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
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
                const normalizedActions = response.data.map((action)=>({
                        id: action._id || action.id,
                        _id: action._id || action.id,
                        type: action.type,
                        amount: action.amount,
                        reason: action.reason,
                        date: action.date,
                        metadata: action.metadata || {},
                        targetUser: action.metadata?.seller || action.metadata?.username,
                        username: action.metadata?.seller || action.metadata?.username,
                        adminUser: action.adminUser || 'platform',
                        role: action.metadata?.role
                    }));
                setAdminActions(normalizedActions);
                debugLog('Admin actions loaded:', normalizedActions.length);
            } else {
                console.warn('[WalletContext] Admin actions fetch failed:', response.error);
            }
        } catch (error) {
            console.error('[WalletContext] Error fetching admin actions:', error);
        }
    }, [
        user,
        apiClient
    ]);
    // FIXED: Define reloadData BEFORE it's used in other functions
    const reloadData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
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
            if (user?.role === 'admin' || isAdminUser(user?.username || '')) {
                await fetchAdminActions();
            }
        } finally{
            setIsLoading(false);
        }
    }, [
        isLoading,
        user,
        fetchAdminActions
    ]);
    // WebSocket event handlers
    const handleWalletBalanceUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((data)=>{
        debugLog('Received wallet:balance_update:', data);
        // Check for duplicate
        if (deduplicationManager.current.isDuplicate('balance_update', data)) {
            debugLog('Skipping duplicate balance update');
            return;
        }
        // Validate incoming data with security service
        try {
            // Sanitize username
            const sanitizedUsername = data.username ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(data.username) : null;
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
                setBuyerBalancesState((prev)=>({
                        ...prev,
                        [sanitizedUsername]: validatedBalance
                    }));
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
                setSellerBalancesState((prev)=>({
                        ...prev,
                        [sanitizedUsername]: validatedBalance
                    }));
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
    }, [
        user,
        fireAdminBalanceUpdateEvent,
        adminBalance
    ]);
    const handlePlatformBalanceUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((data)=>{
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
    }, [
        user,
        fireAdminBalanceUpdateEvent,
        adminBalance
    ]);
    // CRITICAL: Add handler for order:created events
    const handleOrderCreated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((data)=>{
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
    }, [
        user,
        fetchOrderHistory
    ]);
    const handleWalletTransaction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (data)=>{
        debugLog('Received wallet:transaction:', data);
        // Check for duplicate
        if (deduplicationManager.current.isDuplicate('transaction', data)) {
            debugLog('Skipping duplicate transaction');
            return;
        }
        // Validate transaction data
        try {
            // Sanitize usernames if present
            const sanitizedFrom = data.from ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(data.from) : null;
            const sanitizedTo = data.to ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(data.to) : null;
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
    }, [
        user,
        fetchTransactionHistory,
        fetchOrderHistory,
        fetchAdminPlatformBalance,
        fetchAdminActions
    ]);
    // Consolidated WebSocket subscriptions
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
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
        return ()=>{
            unsubBalance();
            unsubPlatform();
            unsubTransaction();
            unsubOrderCreated();
        };
    }, [
        isConnected,
        subscribe,
        handleWalletBalanceUpdate,
        handlePlatformBalanceUpdate,
        handleWalletTransaction,
        handleOrderCreated
    ]);
    // Listen to custom WebSocket balance updates via events (backward compatibility)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
        const handleBalanceUpdate = undefined;
        const handleTransaction = undefined;
        const handleOrderEvent = undefined;
    }, [
        handleWalletBalanceUpdate,
        handleWalletTransaction,
        handleOrderCreated
    ]);
    // Helper to emit wallet balance updates
    const emitBalanceUpdate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((username, role, balance)=>{
        if (isConnected && sendMessage) {
            sendMessage(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].WALLET_BALANCE_UPDATE, {
                username,
                role,
                balance,
                timestamp: Date.now()
            });
        }
    }, [
        isConnected,
        sendMessage
    ]);
    // Send tip function
    const sendTip = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (fromUsername, toUsername, amount, message)=>{
        try {
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
                message: message ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(message) : undefined
            });
            if (!response.success) {
                console.error('[Wallet] Tip failed:', response.error);
                return false;
            }
            // Update local state optimistically
            setBuyerBalancesState((prev)=>({
                    ...prev,
                    [validatedFrom]: prev[validatedFrom] - validatedAmount
                }));
            setSellerBalancesState((prev)=>({
                    ...prev,
                    [validatedTo]: (prev[validatedTo] || 0) + validatedAmount
                }));
            // Emit balance updates
            emitBalanceUpdate(validatedFrom, 'buyer', senderBalance - validatedAmount);
            emitBalanceUpdate(validatedTo, 'seller', (sellerBalances[validatedTo] || 0) + validatedAmount);
            // Log the transaction locally
            const tipLog = {
                id: response.data?.transaction?.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                username: validatedFrom,
                amount: validatedAmount,
                method: 'credit_card',
                date: new Date().toISOString(),
                status: 'completed',
                transactionId: response.data?.transaction?.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                notes: `Tip to ${validatedTo}`
            };
            setDepositLogs((prev)=>[
                    ...prev,
                    tipLog
                ]);
            debugLog(`[Wallet] Tip sent: $${validatedAmount} from ${validatedFrom} to ${validatedTo}`);
            return true;
        } catch (error) {
            console.error('[Wallet] Error sending tip:', error);
            return false;
        }
    }, [
        buyerBalances,
        sellerBalances,
        apiClient,
        emitBalanceUpdate
    ]);
    // Fetch balance from API
    const fetchBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username)=>{
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
            const response = await apiClient.get(`/wallet/balance/${username}`);
            debugLog('Balance response:', response);
            if (response.success && response.data) {
                return response.data.balance || 0;
            }
            console.warn('[WalletContext] Balance fetch failed:', response.error);
            return 0;
        } catch (error) {
            console.error(`[WalletContext] Failed to fetch balance for ${username}:`, error);
            return 0;
        }
    }, [
        apiClient
    ]);
    // Get platform transactions
    const getPlatformTransactions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (limit = 100, page = 1)=>{
        if (!user || user.role !== 'admin' && !isAdminUser(user.username)) {
            debugLog('Not admin user, skipping platform transactions fetch');
            return [];
        }
        try {
            debugLog('Fetching platform transactions...');
            const response = await apiClient.get(`/wallet/platform-transactions?limit=${limit}&page=${page}`);
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
    }, [
        user,
        apiClient
    ]);
    // Fetch complete admin analytics data
    const fetchAdminAnalytics = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (timeFilter = 'all')=>{
        if (!user || user.role !== 'admin' && !isAdminUser(user.username)) {
            debugLog('Not admin user, skipping analytics fetch');
            return null;
        }
        try {
            debugLog('Fetching admin analytics data with filter:', timeFilter);
            const response = await apiClient.get(`/wallet/admin/analytics?timeFilter=${timeFilter}`);
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
                    Object.entries(data.wallet).forEach(([username, balance])=>{
                        if (data.users[username]) {
                            const userRole = data.users[username].role;
                            // Skip admin users as they use unified balance
                            if (userRole === 'admin' || isAdminUser(username)) {
                                // Don't set individual balances for admin users
                                return;
                            } else if (userRole === 'buyer') {
                                setBuyerBalancesState((prev)=>({
                                        ...prev,
                                        [username]: balance
                                    }));
                            } else if (userRole === 'seller') {
                                setSellerBalancesState((prev)=>({
                                        ...prev,
                                        [username]: balance
                                    }));
                            }
                        }
                    });
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
    }, [
        user,
        apiClient,
        fireAdminBalanceUpdateEvent,
        fetchAdminActions,
        adminActions.length,
        adminBalance
    ]);
    // Get analytics data with time filter
    const getAnalyticsData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (timeFilter = 'all')=>{
        if (!user || user.role !== 'admin' && !isAdminUser(user.username)) {
            debugLog('Not admin, cannot get analytics');
            return null;
        }
        return await fetchAdminAnalytics(timeFilter);
    }, [
        user,
        fetchAdminAnalytics
    ]);
    // Load all data from API with admin analytics support
    const loadAllData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
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
                setBuyerBalancesState((prev)=>({
                        ...prev,
                        [user.username]: balance
                    }));
            } else if (user.role === 'seller') {
                setSellerBalancesState((prev)=>({
                        ...prev,
                        [user.username]: balance
                    }));
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
    }, [
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
    const refreshAdminData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
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
    }, [
        user,
        fetchAdminPlatformBalance,
        fetchAdminAnalytics,
        fireAdminBalanceUpdateEvent,
        fetchAdminActions
    ]);
    // Initialize wallet when user logs in
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const initializeWallet = async ()=>{
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
        };
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
    }, [
        user,
        loadAllData
    ]);
    // Balance getters (from cached state)
    const getBuyerBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((username)=>{
        try {
            const validatedUsername = validateUsername(username);
            // Admin users don't have buyer balances
            if (isAdminUser(validatedUsername)) {
                return 0;
            }
            return buyerBalances[validatedUsername] || 0;
        } catch  {
            return 0;
        }
    }, [
        buyerBalances
    ]);
    const getSellerBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((seller)=>{
        try {
            const validatedSeller = validateUsername(seller);
            // Admin users don't have seller balances
            if (isAdminUser(validatedSeller)) {
                return 0;
            }
            return sellerBalances[validatedSeller] || 0;
        } catch  {
            return 0;
        }
    }, [
        sellerBalances
    ]);
    // Balance setters (update cache and call API)
    const setBuyerBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, balance)=>{
        // Don't set buyer balance for admin users
        if (isAdminUser(username)) {
            debugLog('Skipping buyer balance update for admin user');
            return;
        }
        const validatedUsername = validateUsername(username);
        // Update local cache immediately
        setBuyerBalancesState((prev)=>({
                ...prev,
                [validatedUsername]: balance
            }));
        // Emit WebSocket update
        emitBalanceUpdate(validatedUsername, 'buyer', balance);
    }, [
        emitBalanceUpdate
    ]);
    const setSellerBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (seller, balance)=>{
        // Don't set seller balance for admin users
        if (isAdminUser(seller)) {
            debugLog('Skipping seller balance update for admin user');
            return;
        }
        const validatedSeller = validateUsername(seller);
        // Update local cache immediately
        setSellerBalancesState((prev)=>({
                ...prev,
                [validatedSeller]: balance
            }));
        // Emit WebSocket update
        emitBalanceUpdate(validatedSeller, 'seller', balance);
    }, [
        emitBalanceUpdate
    ]);
    const setAdminBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (balance)=>{
        // Only update if changed
        if (adminBalance !== balance) {
            setAdminBalanceState(balance);
            fireAdminBalanceUpdateEvent(balance);
            // Emit WebSocket update for platform wallet
            emitBalanceUpdate('platform', 'admin', balance);
        }
    }, [
        emitBalanceUpdate,
        fireAdminBalanceUpdateEvent,
        adminBalance
    ]);
    // Create order via API
    const addOrder = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (order)=>{
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
                setOrderHistory((prev)=>[
                        ...prev,
                        orderWithTier
                    ]);
                // Only fetch current user's balance after order creation
                if (user?.username) {
                    const newBalance = await fetchBalance(user.username);
                    if (user.role === 'buyer') {
                        setBuyerBalancesState((prev)=>({
                                ...prev,
                                [user.username]: newBalance
                            }));
                    } else if (user.role === 'seller') {
                        setSellerBalancesState((prev)=>({
                                ...prev,
                                [user.username]: newBalance
                            }));
                    } else if (user.role === 'admin' || isAdminUser(user.username)) {
                        // For admin users, refresh platform balance AND admin actions
                        await refreshAdminData();
                    }
                }
                // If current user is admin, refresh admin actions to get tier credits
                if (user?.role === 'admin' || isAdminUser(user?.username || '')) {
                    await fetchAdminActions();
                }
                // Refresh order history for current user only
                if (user?.username) {
                    if (!throttleManager.current.shouldThrottle('order_refresh', 3000)) {
                        await fetchOrderHistory(user.username);
                    }
                }
                debugLog('Order created and balance updated');
            } else {
                const errorMessage = response.error?.message || response.error || 'Order creation failed';
                console.error('[WalletContext] Order creation failed:', errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('[WalletContext] Failed to create order:', error);
            throw error;
        }
    }, [
        apiClient,
        fetchBalance,
        fetchOrderHistory,
        refreshAdminData,
        user,
        fetchAdminActions
    ]);
    // UPDATED: Purchase custom request implementation
    const purchaseCustomRequest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (request)=>{
        console.log('[WalletContext] Processing custom request purchase:', request);
        try {
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
                description: request.metadata?.description || request.description,
                price: request.amount,
                seller: request.seller,
                buyer: request.buyer,
                tags: request.metadata?.tags || [],
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
                setOrderHistory((prev)=>[
                        ...prev,
                        orderWithDetails
                    ]);
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
                    addSellerNotification(request.seller, `💰 Custom request "${request.description}" has been paid! Check your orders to fulfill.`);
                }
                return true;
            } else {
                console.error('[WalletContext] Failed to create custom request order:', response.error);
                // Check if it's an insufficient balance error
                if (response.error?.message?.includes('Insufficient balance')) {
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
    }, [
        apiClient,
        loadAllData,
        addSellerNotification
    ]);
    // Make a deposit via API
    const addDeposit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, amount, method, notes)=>{
        try {
            checkRateLimit('DEPOSIT', username);
            const validatedUsername = validateUsername(username);
            const validatedAmount = validateTransactionAmount(amount);
            debugLog('Processing deposit via API:', {
                username: validatedUsername,
                amount: validatedAmount,
                method,
                authUser: user?.username
            });
            const response = await apiClient.post('/wallet/deposit', {
                amount: validatedAmount,
                method,
                notes
            });
            debugLog('Deposit response:', response);
            if (response.success) {
                // Wait a moment for the transaction to be processed
                await new Promise((resolve)=>setTimeout(resolve, 500));
                // Refresh balance after deposit
                const newBalance = await fetchBalance(validatedUsername);
                debugLog('New balance after deposit:', newBalance);
                if (!isAdminUser(validatedUsername)) {
                    setBuyerBalancesState((prev)=>({
                            ...prev,
                            [validatedUsername]: newBalance
                        }));
                }
                // Add to local deposit logs
                const depositLog = {
                    id: response.data?.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    username: validatedUsername,
                    amount: validatedAmount,
                    method,
                    date: response.data?.createdAt || new Date().toISOString(),
                    status: 'completed',
                    transactionId: response.data?.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    notes
                };
                setDepositLogs((prev)=>[
                        ...prev,
                        depositLog
                    ]);
                // Emit WebSocket event for real-time update
                if (!isAdminUser(validatedUsername)) {
                    emitBalanceUpdate(validatedUsername, 'buyer', newBalance);
                }
                debugLog('Deposit successful');
                return true;
            } else {
                console.error('[WalletContext] Deposit failed:', response.error);
                if (response.error?.message) {
                    throw new Error(response.error.message);
                }
                return false;
            }
        } catch (error) {
            console.error('[WalletContext] Error processing deposit:', error);
            throw error;
        }
    }, [
        apiClient,
        fetchBalance,
        emitBalanceUpdate,
        user
    ]);
    // Purchase listing with proper error handling
    const purchaseListing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (listing, buyerUsername)=>{
        try {
            checkRateLimit('API_CALL', buyerUsername);
            const validatedBuyer = validateUsername(buyerUsername);
            const validatedSeller = validateUsername(listing.seller);
            // Validate price with security service
            const priceValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAmount(listing.price, {
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
                id: listing.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                title: listing.title,
                description: listing.description,
                price: listing.price,
                markedUpPrice: listing.markedUpPrice || listing.price,
                seller: validatedSeller,
                buyer: validatedBuyer,
                imageUrl: listing.imageUrls?.[0],
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
                addSellerNotification(validatedSeller, `New sale: "${listing.title}" for ${listing.price.toFixed(2)}`);
            }
            debugLog('Purchase successful');
            return true;
        } catch (error) {
            console.error('[Purchase] Error:', error);
            throw error;
        }
    }, [
        addOrder,
        addSellerNotification
    ]);
    // Withdraw funds via API
    const addSellerWithdrawal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, amount)=>{
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
                const newWithdrawal = {
                    amount: validatedAmount,
                    date: response.data?.createdAt || new Date().toISOString(),
                    status: response.data?.status || 'pending'
                };
                setSellerWithdrawals((prev)=>({
                        ...prev,
                        [validatedUsername]: [
                            ...prev[validatedUsername] || [],
                            newWithdrawal
                        ]
                    }));
                // Refresh balance
                const newBalance = await fetchBalance(validatedUsername);
                if (!isAdminUser(validatedUsername)) {
                    setSellerBalancesState((prev)=>({
                            ...prev,
                            [validatedUsername]: newBalance
                        }));
                }
                debugLog('Withdrawal successful');
            } else {
                console.error('[WalletContext] Withdrawal failed:', response.error);
                throw new Error(response.error?.message || 'Withdrawal failed');
            }
        } catch (error) {
            console.error('[WalletContext] Withdrawal error:', error);
            throw error;
        }
    }, [
        apiClient,
        fetchBalance
    ]);
    // Admin credit via API
    const adminCreditUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, role, amount, reason)=>{
        try {
            checkRateLimit('REPORT_ACTION', 'admin');
            const validatedUsername = validateUsername(username);
            const validatedAmount = validateTransactionAmount(amount);
            const sanitizedReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reason);
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
                adminUsername: user?.username || 'platform'
            });
            debugLog('Admin credit response:', response);
            if (response.success) {
                // Refresh balance
                const newBalance = await fetchBalance(validatedUsername);
                if (role === 'buyer' && !isAdminUser(validatedUsername)) {
                    setBuyerBalancesState((prev)=>({
                            ...prev,
                            [validatedUsername]: newBalance
                        }));
                } else if (role === 'seller' && !isAdminUser(validatedUsername)) {
                    setSellerBalancesState((prev)=>({
                            ...prev,
                            [validatedUsername]: newBalance
                        }));
                }
                // Refresh platform balance after admin action
                if (user?.role === 'admin' || isAdminUser(user?.username || '')) {
                    await fetchAdminPlatformBalance();
                    // Refresh admin actions after credit
                    await fetchAdminActions();
                }
                // Update admin actions locally
                const action = {
                    id: response.data?.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    type: 'credit',
                    amount: validatedAmount,
                    targetUser: validatedUsername,
                    username: validatedUsername,
                    adminUser: user?.username || 'platform',
                    reason: sanitizedReason,
                    date: response.data?.createdAt || new Date().toISOString(),
                    role
                };
                setAdminActions((prev)=>[
                        ...prev,
                        action
                    ]);
                debugLog('Admin credit successful');
                return true;
            }
            console.error('[WalletContext] Admin credit failed:', response.error);
            return false;
        } catch (error) {
            console.error('Admin credit error:', error);
            return false;
        }
    }, [
        user,
        apiClient,
        fetchBalance,
        fetchAdminPlatformBalance,
        fetchAdminActions
    ]);
    // Admin debit via API
    const adminDebitUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, role, amount, reason)=>{
        try {
            checkRateLimit('REPORT_ACTION', 'admin');
            const validatedUsername = validateUsername(username);
            const validatedAmount = validateTransactionAmount(amount);
            const sanitizedReason = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(reason);
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
                adminUsername: user?.username || 'platform'
            });
            debugLog('Admin debit response:', response);
            if (response.success) {
                // Refresh balance
                const newBalance = await fetchBalance(validatedUsername);
                if (role === 'buyer' && !isAdminUser(validatedUsername)) {
                    setBuyerBalancesState((prev)=>({
                            ...prev,
                            [validatedUsername]: newBalance
                        }));
                } else if (role === 'seller' && !isAdminUser(validatedUsername)) {
                    setSellerBalancesState((prev)=>({
                            ...prev,
                            [validatedUsername]: newBalance
                        }));
                }
                // Refresh platform balance after admin action
                if (user?.role === 'admin' || isAdminUser(user?.username || '')) {
                    await fetchAdminPlatformBalance();
                    // Refresh admin actions after debit
                    await fetchAdminActions();
                }
                // Update admin actions locally
                const action = {
                    id: response.data?.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    type: 'debit',
                    amount: validatedAmount,
                    targetUser: validatedUsername,
                    username: validatedUsername,
                    adminUser: user?.username || 'platform',
                    reason: sanitizedReason,
                    date: response.data?.createdAt || new Date().toISOString(),
                    role
                };
                setAdminActions((prev)=>[
                        ...prev,
                        action
                    ]);
                debugLog('Admin debit successful');
                return true;
            }
            console.error('[WalletContext] Admin debit failed:', response.error);
            return false;
        } catch (error) {
            console.error('Admin debit error:', error);
            return false;
        }
    }, [
        user,
        apiClient,
        fetchBalance,
        fetchAdminPlatformBalance,
        fetchAdminActions
    ]);
    // Get transaction history from API
    const getTransactionHistory = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, limit)=>{
        try {
            const targetUsername = username || user?.username;
            if (!targetUsername) {
                console.warn('[WalletContext] No username for transaction history');
                return [];
            }
            // For admin users, use platform
            const queryUsername = isAdminUser(targetUsername) ? 'platform' : targetUsername;
            const endpoint = `/wallet/transactions/${queryUsername}${limit ? `?limit=${limit}` : ''}`;
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
    }, [
        apiClient,
        user
    ]);
    // UPDATE reloadData to use loadAllData properly
    const updateReloadData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (isLoading) {
            debugLog('Already loading, skipping reload');
            return;
        }
        setIsLoading(true);
        try {
            await loadAllData();
            // For admin users, also refresh admin actions
            if (user?.role === 'admin' || isAdminUser(user?.username || '')) {
                await fetchAdminActions();
            }
        } finally{
            setIsLoading(false);
        }
    }, [
        loadAllData,
        isLoading,
        user,
        fetchAdminActions
    ]);
    // Subscription payment via API
    const subscribeToSellerWithPayment = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (buyer, seller, amount)=>{
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
                    setBuyerBalancesState((prev)=>({
                            ...prev,
                            [buyer]: newBalance
                        }));
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Subscription error:', error);
            return false;
        }
    }, [
        apiClient,
        fetchBalance
    ]);
    // Unsubscribe from seller via API
    const unsubscribeFromSeller = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (buyer, seller)=>{
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
                if (buyer === user?.username) {
                    const newBalance = await fetchBalance(buyer);
                    if (!isAdminUser(buyer)) {
                        setBuyerBalancesState((prev)=>({
                                ...prev,
                                [buyer]: newBalance
                            }));
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
    }, [
        apiClient,
        fetchBalance,
        user
    ]);
    // Admin withdrawal
    const addAdminWithdrawal = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (amount)=>{
        try {
            debugLog('Processing admin withdrawal from unified platform wallet');
            const response = await apiClient.post('/wallet/admin-withdraw', {
                amount,
                accountDetails: {
                    accountNumber: '****9999',
                    accountType: 'business'
                },
                notes: `Platform withdrawal by ${user?.username}`
            });
            if (response.success) {
                const withdrawal = {
                    amount,
                    date: new Date().toISOString(),
                    status: 'completed',
                    method: 'bank_transfer'
                };
                setAdminWithdrawals((prev)=>[
                        ...prev,
                        withdrawal
                    ]);
                // Refresh unified platform balance
                await fetchAdminPlatformBalance();
                debugLog('Admin withdrawal successful');
            } else {
                console.error('[WalletContext] Admin withdrawal failed:', response.error);
                throw new Error(response.error?.message || 'Withdrawal failed');
            }
        } catch (error) {
            console.error('[WalletContext] Admin withdrawal error:', error);
            throw error;
        }
    }, [
        apiClient,
        fetchAdminPlatformBalance,
        user
    ]);
    // Update order address
    const updateOrderAddress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (orderId, address)=>{
        try {
            debugLog('Updating order address:', orderId);
            // Use POST method since ApiClient doesn't have PUT
            const response = await apiClient.post(`/orders/${orderId}/address`, {
                deliveryAddress: address
            });
            if (response.success) {
                // Update local order history
                setOrderHistory((prev)=>prev.map((order)=>order.id === orderId ? {
                            ...order,
                            deliveryAddress: address
                        } : order));
                debugLog('Order address updated successfully');
            } else {
                throw new Error(response.error?.message || 'Failed to update address');
            }
        } catch (error) {
            console.error('[WalletContext] Error updating order address:', error);
            throw error;
        }
    }, [
        apiClient
    ]);
    // Update shipping status
    const updateShippingStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (orderId, status)=>{
        try {
            debugLog('Updating shipping status:', orderId, status);
            // Use POST method since ApiClient doesn't have PUT
            const response = await apiClient.post(`/orders/${orderId}/shipping`, {
                shippingStatus: status
            });
            if (response.success) {
                // Update local order history
                setOrderHistory((prev)=>prev.map((order)=>order.id === orderId ? {
                            ...order,
                            shippingStatus: status
                        } : order));
                debugLog('Shipping status updated successfully');
            } else {
                throw new Error(response.error?.message || 'Failed to update shipping status');
            }
        } catch (error) {
            console.error('[WalletContext] Error updating shipping status:', error);
            throw error;
        }
    }, [
        apiClient
    ]);
    // Auction-related stubs
    const holdBidFunds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        debugLog('Auction features not fully implemented in API yet');
        return false;
    }, []);
    const refundBidFunds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        debugLog('Auction features not fully implemented in API yet');
        return false;
    }, []);
    const placeBid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        debugLog('Auction features not fully implemented in API yet');
        return false;
    }, []);
    const finalizeAuctionPurchase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        debugLog('Auction features not fully implemented in API yet');
        return false;
    }, []);
    // Enhanced features stubs
    const checkSuspiciousActivity = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username)=>{
        return {
            suspicious: false,
            reasons: []
        };
    }, []);
    const reconcileBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (username, role)=>{
        return null;
    }, []);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(WalletContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/WalletContext.tsx",
        lineNumber: 2088,
        columnNumber: 5
    }, this);
}
const useWallet = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(WalletContext);
    if (!context) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
};
}),
"[project]/src/context/AuctionContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "AuctionProvider": ()=>AuctionProvider,
    "useAuction": ()=>useAuction
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/websocket.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-ssr] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/permissions.ts [app-ssr] (ecmascript)");
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
const AuctionContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
// -----------------------------
// Validation Schemas (Zod)
// -----------------------------
const BidEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    listingId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional(),
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    bidder: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional(),
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional(),
    amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().finite().nonnegative().optional(),
    bid: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
        amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().finite().nonnegative()
    }).optional(),
    timestamp: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const RefundEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    amount: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().finite().nonnegative(),
    listingId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).optional(),
    balance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().finite().nonnegative().optional(),
    reason: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const BalanceUpdateEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1),
    newBalance: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().finite(),
    role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional()
});
const AuctionEndedEventSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    listingId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    id: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    status: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        'ended',
        'cancelled',
        'reserve_not_met'
    ]).optional(),
    winnerId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    winner: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    finalPrice: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional(),
    finalBid: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().optional()
});
// -----------------------------
// Utilities
// -----------------------------
function makeBidId() {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `bid_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}
function coerceNumber(n, fallback = 0) {
    const v = typeof n === 'number' ? n : Number(n);
    return Number.isFinite(v) ? v : fallback;
}
// Local, safe defaults for bid spam protection
const BID_LIMIT = {
    maxAttempts: 5,
    windowMs: 10_000,
    blockDuration: 10_000
};
function AuctionProvider({ children }) {
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const wsContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWebSocket"])();
    const subscribe = wsContext?.subscribe || (()=>()=>{});
    const isConnected = wsContext?.isConnected || false;
    const [auctions, setAuctions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [userBids, setUserBids] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [isPlacingBid, setIsPlacingBid] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isCancellingAuction, setIsCancellingAuction] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLoadingAuctions, setIsLoadingAuctions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [bidError, setBidError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // Keep a ref to latest auctions to avoid effect dependency churn
    const auctionsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(auctions);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        auctionsRef.current = auctions;
    }, [
        auctions
    ]);
    const activeAuctions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>Object.values(auctions).filter((a)=>a.status === 'active'), [
        auctions
    ]);
    const clearBidError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setBidError(null);
    }, []);
    const refreshCurrentUserBalance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!user) return;
        try {
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(`/wallet/balance/${user.username}`, {
                method: 'GET'
            });
            if (response.success && response.data) {
                const newBalance = response.data.balance || 0;
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            }
        } catch (error) {
            console.error(`[AuctionContext] Error refreshing current user balance:`, error);
        }
    }, [
        user
    ]);
    const updateAuctionWithBid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((listingId, rawData)=>{
        const parsed = BidEventSchema.safeParse(rawData);
        if (!parsed.success) {
            console.warn('[AuctionContext] Ignoring malformed bid event', parsed.error?.flatten());
            return undefined;
        }
        const data = parsed.data;
        const amount = typeof data.amount === 'number' ? data.amount : coerceNumber(data.bid?.amount, 0);
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
        setAuctions((prev)=>{
            const existingAuction = prev[listingId];
            previousHighestBidder = existingAuction?.highestBidder;
            const reserveMet = existingAuction?.reservePrice ? bid.amount >= existingAuction.reservePrice : true;
            return {
                ...prev,
                [listingId]: {
                    ...existingAuction,
                    listingId,
                    id: listingId,
                    seller: existingAuction?.seller || '',
                    startingPrice: existingAuction?.startingPrice || 0,
                    reservePrice: existingAuction?.reservePrice,
                    currentBid: bid.amount,
                    highestBidder: bid.bidder,
                    previousBidder: previousHighestBidder,
                    endTime: existingAuction?.endTime || '',
                    status: existingAuction?.status || 'active',
                    reserveMet,
                    bids: [
                        ...existingAuction?.bids || [],
                        bid
                    ].sort((a, b)=>b.amount - a.amount)
                }
            };
        });
        setUserBids((prev)=>({
                ...prev,
                [bid.bidder]: [
                    ...prev[bid.bidder] || [],
                    bid
                ]
            }));
        return previousHighestBidder;
    }, []);
    const updateAuctionStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((listingId, status, winnerId, finalPrice)=>{
        setAuctions((prev)=>{
            const existingAuction = prev[listingId];
            return {
                ...prev,
                [listingId]: {
                    ...existingAuction,
                    listingId,
                    id: listingId,
                    seller: existingAuction?.seller || '',
                    startingPrice: existingAuction?.startingPrice || 0,
                    reservePrice: existingAuction?.reservePrice,
                    currentBid: existingAuction?.currentBid || 0,
                    endTime: existingAuction?.endTime || '',
                    bids: existingAuction?.bids || [],
                    status,
                    ...winnerId && {
                        winnerId
                    },
                    ...typeof finalPrice === 'number' && Number.isFinite(finalPrice) && {
                        finalPrice
                    },
                    reserveMet: status === 'reserve_not_met' ? false : existingAuction?.reserveMet
                }
            };
        });
    }, []);
    const checkReserveMet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((listingId)=>{
        const auction = auctions[listingId];
        if (!auction || !auction.reservePrice) return true;
        return auction.currentBid >= auction.reservePrice;
    }, [
        auctions
    ]);
    // Initial load (kept minimal; extend if needed)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const loadAuctions = async ()=>{
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
        };
        loadAuctions();
    }, [
        user
    ]);
    // WebSocket subscriptions (stabilized: no dependency on auctions state)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isConnected || !subscribe) return;
        const unsubscribers = [];
        // New bid
        unsubscribers.push(subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].AUCTION_BID, async (raw)=>{
            const parsed = BidEventSchema.safeParse(raw);
            if (!parsed.success) {
                console.warn('[AuctionContext] Ignoring malformed AUCTION_BID', parsed.error?.flatten());
                return;
            }
            const data = parsed.data;
            const listingId = (data.listingId || data.id || '').toString();
            if (!listingId) return;
            updateAuctionWithBid(listingId, data);
            if (user && (data.bidder === user.username || data.username === user.username)) {
                await refreshCurrentUserBalance();
            }
        }));
        // Wallet refund
        unsubscribers.push(subscribe('wallet:refund', async (raw)=>{
            const parsed = RefundEventSchema.safeParse(raw);
            if (!parsed.success) {
                console.warn('[AuctionContext] Ignoring malformed wallet:refund', parsed.error?.flatten());
                return;
            }
            const data = parsed.data;
            if (user && data.username === user.username) {
                console.log('[AuctionContext] Current user was refunded, refreshing balance');
                await refreshCurrentUserBalance();
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            }
        }));
        // Balance update passthrough (dedupe + fan-out)
        unsubscribers.push(subscribe('wallet:balance_update', async (raw)=>{
            const parsed = BalanceUpdateEventSchema.safeParse(raw);
            if (!parsed.success) {
                console.warn('[AuctionContext] Ignoring malformed wallet:balance_update', parsed.error?.flatten());
                return;
            }
            const data = parsed.data;
            if (user && data.username === user.username && typeof data.newBalance === 'number') {
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            }
        }));
        // Outbid notice (no-op other than logging for now)
        unsubscribers.push(subscribe('auction:outbid', async (data)=>{
            console.log('[AuctionContext] User was outbid:', data);
            if (user && data?.username === user.username) {
                console.log('[AuctionContext] Current user was outbid on', data?.listingTitle);
            }
        }));
        // Auction ended
        unsubscribers.push(subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].AUCTION_ENDED, async (raw)=>{
            const parsed = AuctionEndedEventSchema.safeParse(raw);
            if (!parsed.success) {
                console.warn('[AuctionContext] Ignoring malformed AUCTION_ENDED', parsed.error?.flatten());
                return;
            }
            const data = parsed.data;
            const listingId = (data.listingId || data.id || '').toString();
            if (!listingId) return;
            const status = data.status || 'ended';
            if (status === 'reserve_not_met') {
                updateAuctionStatus(listingId, 'reserve_not_met');
                const auction = auctionsRef.current[listingId];
                if (user && auction?.highestBidder === user.username) {
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
        }));
        // Reserve not met
        unsubscribers.push(subscribe('auction:reserve_not_met', async (raw)=>{
            const parsed = AuctionEndedEventSchema.safeParse(raw);
            if (!parsed.success) {
                console.warn('[AuctionContext] Ignoring malformed auction:reserve_not_met', parsed.error?.flatten());
                return;
            }
            const data = parsed.data;
            const listingId = (data.listingId || data.id || '').toString();
            if (!listingId) return;
            updateAuctionStatus(listingId, 'reserve_not_met');
            const auction = auctionsRef.current[listingId];
            if (user && auction?.highestBidder === user.username) {
                console.log('[AuctionContext] User was highest bidder, awaiting refund for reserve not met');
            }
        }));
        // Cancelled
        unsubscribers.push(subscribe(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$websocket$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WebSocketEvent"].AUCTION_CANCELLED, async (raw)=>{
            const parsed = AuctionEndedEventSchema.safeParse(raw);
            if (!parsed.success) {
                console.warn('[AuctionContext] Ignoring malformed AUCTION_CANCELLED', parsed.error?.flatten());
                return;
            }
            const data = parsed.data;
            const listingId = (data.listingId || data.id || '').toString();
            if (!listingId) return;
            const auction = auctionsRef.current[listingId];
            updateAuctionStatus(listingId, 'cancelled');
            if (user && auction?.highestBidder === user.username) {
                await refreshCurrentUserBalance();
            }
        }));
        return ()=>{
            unsubscribers.forEach((unsub)=>{
                try {
                    unsub();
                } catch  {
                // swallow teardown errors
                }
            });
        };
    }, [
        isConnected,
        subscribe,
        updateAuctionWithBid,
        updateAuctionStatus,
        refreshCurrentUserBalance,
        user
    ]);
    const placeBid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (listingId, bidder, amount)=>{
        if (!user) {
            setBidError('You must be logged in to bid');
            return false;
        }
        // Gentle client-side rate limit against spam clicks
        try {
            const limiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRateLimiter"])(); // no args
            const key = `auction:bid:${user.username}`;
            limiter.check(key, {
                maxAttempts: BID_LIMIT.maxAttempts,
                windowMs: BID_LIMIT.windowMs,
                blockDuration: BID_LIMIT.blockDuration
            });
        } catch  {
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
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(`/listings/${listingId}/bid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: amt
                })
            });
            if (response.success) {
                console.log('[AuctionContext] Bid placed successfully:', response.data?.message || 'Success');
                updateAuctionWithBid(listingId, {
                    bidder: user.username,
                    amount: amt,
                    timestamp: new Date().toISOString()
                });
                const auction = auctionsRef.current[listingId];
                if (auction?.reservePrice && amt < auction.reservePrice) {
                    console.log('[AuctionContext] Bid placed but reserve price not yet met');
                }
                await refreshCurrentUserBalance();
                return true;
            } else {
                const errorMsg = typeof response.error === 'string' ? response.error : response.error?.message || 'Failed to place bid';
                setBidError(errorMsg);
                console.error('[AuctionContext] Bid failed:', errorMsg);
                return false;
            }
        } catch (error) {
            const errorMsg = error?.message || 'Network error while placing bid';
            setBidError(errorMsg);
            console.error('[AuctionContext] Bid error:', error);
            return false;
        } finally{
            setIsPlacingBid(false);
        }
    }, [
        user,
        updateAuctionWithBid,
        refreshCurrentUserBalance
    ]);
    const cancelAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (listingId)=>{
        if (!user) return false;
        setIsCancellingAuction(true);
        try {
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(`/listings/${listingId}/cancel-auction`, {
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
    }, [
        user
    ]);
    const endAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (listingId)=>{
        if (!user || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$permissions$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isAdmin"])(user)) {
            return false;
        }
        try {
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(`/listings/${listingId}/end-auction`, {
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
    }, [
        user
    ]);
    // Process ended auction - handle already processed auctions gracefully
    const processEndedAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (listing)=>{
        if (!listing?.auction) return false;
        try {
            // Call backend to process auction completion
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["apiCall"])(`/listings/${listing.id}/end-auction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.success) {
                // Check if it was already processed (backend returns success with alreadyProcessed flag)
                const alreadyProcessed = response.data?.alreadyProcessed || response.data?.data?.alreadyProcessed || false;
                if (alreadyProcessed) {
                    console.log('[AuctionContext] Auction was already processed:', response.data?.status);
                    // Update status based on the already-processed status
                    const status = response.data?.status || response.data?.data?.status || 'ended';
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
                const order = responseData.order || responseData.data?.order;
                if (order) {
                    console.log('[AuctionContext] Order created successfully:', order);
                    // Fire event for order creation
                    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                    ;
                }
                // Update status based on response
                const status = responseData.status || responseData.data?.status || 'ended';
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
            const msg = (typeof response.error === 'string' ? response.error : response.error?.message || '').toLowerCase();
            if (msg.includes('auction is not active') || msg.includes('already processed') || msg.includes('auction already processed')) {
                console.log('[AuctionContext] Auction already processed, treating as success');
                updateAuctionStatus(listing.id, 'ended');
                return true;
            }
            console.error('[AuctionContext] Failed to process ended auction:', response.error);
            return false;
        } catch (error) {
            const msg = (error?.message || '').toLowerCase();
            if (msg.includes('auction is not active') || msg.includes('already processed') || msg.includes('auction already processed')) {
                console.log('[AuctionContext] Auction already processed (from catch), treating as success');
                updateAuctionStatus(listing.id, 'ended');
                return true;
            }
            console.error('[AuctionContext] Error processing ended auction:', error);
            return false;
        }
    }, [
        updateAuctionStatus
    ]);
    const getAuctionByListingId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((listingId)=>auctions[listingId] || null, [
        auctions
    ]);
    const getUserBidsForAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((listingId, username)=>{
        const auction = auctions[listingId];
        if (!auction) return [];
        return auction.bids.filter((bid)=>bid.bidder === username);
    }, [
        auctions
    ]);
    const isUserHighestBidder = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((listingId, username)=>{
        const auction = auctions[listingId];
        return auction?.highestBidder === username;
    }, [
        auctions
    ]);
    const subscribeToAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((listingId)=>{
        if (!isConnected) return;
        console.log('[AuctionContext] Subscribing to auction:', listingId);
    // Hook for future: if your WS supports rooms, join here.
    }, [
        isConnected
    ]);
    const unsubscribeFromAuction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((listingId)=>{
        if (!isConnected) return;
        console.log('[AuctionContext] Unsubscribing from auction:', listingId);
    // Hook for future: if your WS supports rooms, leave here.
    }, [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuctionContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AuctionContext.tsx",
        lineNumber: 871,
        columnNumber: 10
    }, this);
}
function useAuction() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuctionContext);
    if (!context) {
        throw new Error('useAuction must be used within AuctionProvider');
    }
    return context;
}
}),
"[project]/src/context/ListingContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/context/ListingContext.tsx
__turbopack_context__.s({
    "ListingProvider": ()=>ListingProvider,
    "useListings": ()=>useListings
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WalletContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuctionContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuctionContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/listings.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/users.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/security.service.ts [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-ssr] (ecmascript)");
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
// FIX 2: Add deduplication manager for sold listings
class SoldListingDeduplicationManager {
    processedListings = new Map();
    cleanupInterval = null;
    expiryMs;
    constructor(expiryMs = 60000){
        this.expiryMs = expiryMs;
        this.startCleanup();
    }
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
}
const ListingContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const ListingProvider = ({ children })=>{
    const { user, updateUser } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const webSocketContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWebSocket"])();
    // Extract properties from WebSocket context safely
    const subscribe = webSocketContext?.subscribe;
    const isConnected = webSocketContext?.isConnected || false;
    const [users, setUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [listings, setListings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [subscriptions, setSubscriptions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [notificationStore, setNotificationStore] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [isAuthReady, setIsAuthReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [latestOrder, setLatestOrder] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    // FIX 2: Add ref for deduplication manager
    const soldListingDeduplicator = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new SoldListingDeduplicationManager());
    // Add deduplication mechanism for listing updates
    const listingUpdateDeduplicator = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    const DEBOUNCE_TIME = 500; // 500ms debounce
    // Add request deduplication for API calls
    const apiRequestCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    const API_CACHE_TIME = 1000; // Cache API responses for 1 second
    // Helper function to normalize notification items to the new format
    const normalizeNotification = (item)=>{
        if (typeof item === 'string') {
            return {
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                message: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(item),
                timestamp: new Date().toISOString(),
                cleared: false
            };
        }
        return {
            ...item,
            message: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(item.message) // Sanitize message
        };
    };
    // Helper function to save notification store
    const saveNotificationStore = async (store)=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('seller_notifications_store', store);
    };
    // Memoized notification function to avoid infinite render loop
    const addSellerNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((seller, message)=>{
        if (!seller) {
            console.warn("Attempted to add notification without seller ID");
            return;
        }
        // Sanitize the notification message
        const sanitizedMessage = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(message);
        const newNotification = {
            id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
            message: sanitizedMessage,
            timestamp: new Date().toISOString(),
            cleared: false
        };
        setNotificationStore((prev)=>{
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
        });
    }, []);
    const { subscribeToSellerWithPayment, setAddSellerNotificationCallback, purchaseListing, orderHistory, unsubscribeFromSeller: walletUnsubscribeFromSeller } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WalletContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWallet"])();
    // Get auction functions from AuctionContext
    const { placeBid: auctionPlaceBid, cancelAuction: auctionCancelAuction, processEndedAuction } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuctionContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuction"])();
    // On mount, set the notification callback in WalletContext
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (setAddSellerNotificationCallback) {
            setAddSellerNotificationCallback(addSellerNotification);
        }
    }, [
        setAddSellerNotificationCallback,
        addSellerNotification
    ]);
    // FIX: Optimized WebSocket subscription with debouncing
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isConnected || !subscribe) return;
        console.log('[ListingContext] Setting up WebSocket subscription for listing:sold events');
        const unsubscribe = subscribe('listing:sold', (data)=>{
            console.log('[ListingContext] Received listing:sold event:', data);
            // Handle both possible field names for the listing ID
            const id = data.listingId ?? data.id;
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
            setListings((prev)=>{
                // Check if listing exists before filtering
                const exists = prev.some((listing)=>listing.id === id);
                if (!exists) {
                    console.log('[ListingContext] Listing not found in current state:', id);
                    return prev;
                }
                const filtered = prev.filter((listing)=>listing.id !== id);
                console.log('[ListingContext] Removed sold listing:', id);
                // Fire custom event for any components that need to know
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                return filtered;
            });
        });
        return ()=>{
            unsubscribe();
            // Clean up deduplicator on unmount
            listingUpdateDeduplicator.current.clear();
        };
    }, [
        isConnected,
        subscribe
    ]);
    // Subscribe to order:created events
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!isConnected || !subscribe) return;
        console.log('[ListingContext] Setting up WebSocket subscription for order:created events');
        const unsubscribe = subscribe('order:created', (data)=>{
            console.log('[ListingContext] Received order:created event:', data);
            // Store the latest order so it's immediately available
            if (data.order || data) {
                const order = data.order || data;
                setLatestOrder(order);
                // Fire custom event for any components that need to know
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            }
        });
        return ()=>{
            unsubscribe();
        };
    }, [
        isConnected,
        subscribe
    ]);
    // Cleanup deduplication manager on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        return ()=>{
            soldListingDeduplicator.current.destroy();
        };
    }, []);
    // Listen for notification changes in localStorage (for header live updates)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        function handleStorageChange(e) {
            if (e.key === 'seller_notifications_store') {
                try {
                    setNotificationStore(JSON.parse(e.newValue || '{}'));
                } catch  {
                    setNotificationStore({});
                }
            }
        }
        window.addEventListener('storage', handleStorageChange);
        return ()=>window.removeEventListener('storage', handleStorageChange);
    }, []);
    // Migration function to convert old notifications to new format
    const migrateNotifications = (notifications)=>{
        return notifications.map(normalizeNotification);
    };
    // Cached fetch function for individual listings
    const fetchListingWithCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (listingId)=>{
        const now = Date.now();
        const cached = apiRequestCache.current.get(listingId);
        // Return cached promise if it's still fresh
        if (cached && now - cached.timestamp < API_CACHE_TIME) {
            console.log('[ListingContext] Using cached listing request for:', listingId);
            return cached.promise;
        }
        // Create new request
        const promise = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingsService"].getListing(listingId);
        apiRequestCache.current.set(listingId, {
            timestamp: now,
            promise
        });
        // Clean up old cache entries
        setTimeout(()=>{
            const cleanupTime = Date.now();
            for (const [key, value] of apiRequestCache.current.entries()){
                if (cleanupTime - value.timestamp > API_CACHE_TIME * 2) {
                    apiRequestCache.current.delete(key);
                }
            }
        }, API_CACHE_TIME * 2);
        return promise;
    }, []);
    // Add a cache for the getListings API call
    const listingsCache = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const LISTINGS_CACHE_TIME = 1000; // Cache for 1 second
    // Load initial data using services with caching
    const loadData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if ("TURBOPACK compile-time truthy", 1) return;
        //TURBOPACK unreachable
        ;
    }, [
        isLoading
    ]); // Add isLoading as dependency to prevent duplicate calls
    // Load data on mount with proper cleanup
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let mounted = true;
        let timeoutId;
        // Debounce the initial load slightly to prevent multiple rapid calls
        timeoutId = setTimeout(()=>{
            if (mounted && !isAuthReady && !isLoading) {
                loadData();
            }
        }, 100);
        return ()=>{
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, []); // Empty dependency array - only run once on mount
    const persistUsers = async (updated)=>{
        setUsers(updated);
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('all_users_v2', updated);
    };
    // Refresh listings with caching
    const refreshListings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
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
            const promise = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingsService"].getListings();
            listingsCache.current = {
                timestamp: now,
                promise
            };
            const listingsResult = await promise;
            if (listingsResult.success && listingsResult.data) {
                setListings(listingsResult.data);
            } else {
                throw new Error(listingsResult.error?.message || 'Failed to refresh listings');
            }
        } catch (error) {
            console.error('Error refreshing listings:', error);
            setError(error instanceof Error ? error.message : 'Failed to refresh listings');
            listingsCache.current = null; // Clear cache on error
        } finally{
            setIsLoading(false);
        }
    }, []);
    // Check for ended auctions on load and at regular intervals
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        checkEndedAuctions();
        const interval = setInterval(()=>{
            checkEndedAuctions();
        }, 60000);
        return ()=>clearInterval(interval);
    }, [
        listings
    ]);
    // Use listings service for adding listings
    const addListing = async (listing)=>{
        console.log('🔍 addListing called with user:', user);
        if (!user || user.role !== 'seller') {
            console.error('❌ addListing failed: user is not a seller', {
                user: user?.username,
                role: user?.role
            });
            alert('You must be logged in as a seller to create listings.');
            return;
        }
        // Validate and sanitize listing data
        const validationResult = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAndSanitize({
            title: listing.title,
            description: listing.description,
            price: listing.price,
            tags: listing.tags,
            wearDuration: listing.hoursWorn
        }, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingSchemas"].createListingSchema.pick({
            title: true,
            description: true,
            price: true,
            tags: true,
            wearDuration: true
        }), {
            title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict,
            description: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict,
            tags: (tags)=>tags?.map((tag)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(tag))
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
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingsService"].createListing(sanitizedListing);
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
                console.error('Failed to create listing:', result.error);
                alert(result.error?.message || 'Failed to create listing. Please try again.');
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
        const listingValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAndSanitize({
            title: listing.title,
            description: listing.description,
            price: listing.price,
            tags: listing.tags,
            wearDuration: listing.hoursWorn
        }, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingSchemas"].createListingSchema.pick({
            title: true,
            description: true,
            price: true,
            tags: true,
            wearDuration: true
        }), {
            title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict,
            description: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict,
            tags: (tags)=>tags?.map((tag)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(tag))
        });
        if (!listingValidation.success) {
            console.error('Listing validation failed:', listingValidation.errors);
            alert('Please check your listing details:\n' + Object.values(listingValidation.errors || {}).join('\n'));
            return;
        }
        // Validate auction settings
        const amountValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAmount(auctionSettings.startingPrice, {
            min: 0.01,
            max: 10000
        });
        if (!amountValidation.valid) {
            alert(amountValidation.error || 'Invalid starting price');
            return;
        }
        if (auctionSettings.reservePrice) {
            const reserveValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAmount(auctionSettings.reservePrice, {
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
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingsService"].createListing(sanitizedListing);
            if (result.success && result.data) {
                setListings((prev)=>[
                        ...prev,
                        result.data
                    ]);
                addSellerNotification(user.username, `🔨 You've created a new auction: "${sanitizedListing.title}" starting at $${auctionSettings.startingPrice.toFixed(2)}`);
                window.dispatchEvent(new CustomEvent('listingCreated', {
                    detail: {
                        listing: result.data
                    }
                }));
            } else {
                alert(result.error?.message || 'Failed to create auction listing. Please try again.');
            }
        } catch (error) {
            console.error('Error creating auction listing:', error);
            alert('An error occurred while creating the auction listing.');
        }
    };
    const removeListing = async (id)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingsService"].deleteListing(id);
            if (result.success) {
                setListings((prev)=>prev.filter((listing)=>listing.id !== id));
                // FIX 2: Fire event when listing is removed
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                window.dispatchEvent(new CustomEvent('listingDeleted', {
                    detail: {
                        listingId: id
                    }
                }));
            } else {
                throw new Error(result.error?.message || 'Failed to delete listing');
            }
        } catch (error) {
            console.error('Error removing listing:', error);
            alert(error instanceof Error ? error.message : 'Failed to remove listing');
        }
    };
    const purchaseListingAndRemove = async (listing, buyerUsername)=>{
        try {
            // Sanitize buyer username
            const sanitizedBuyer = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(buyerUsername);
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
                wearTime: listing.hoursWorn?.toString(),
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
                sanitizedUpdate.title = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(updatedListing.title);
            }
            if (updatedListing.description) {
                sanitizedUpdate.description = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(updatedListing.description);
            }
            if (updatedListing.tags) {
                sanitizedUpdate.tags = updatedListing.tags.map((tag)=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(tag));
            }
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingsService"].updateListing(id, sanitizedUpdate);
            if (result.success && result.data) {
                setListings((prev)=>prev.map((listing)=>listing.id === id ? result.data : listing));
            } else {
                throw new Error(result.error?.message || 'Failed to update listing');
            }
        } catch (error) {
            console.error('Error updating listing:', error);
            alert(error instanceof Error ? error.message : 'Failed to update listing');
        }
    };
    // CRITICAL FIX: Update placeBid to not call hooks inside
    const placeBid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (listingId, bidder, amount)=>{
        try {
            const listing = listings.find((l)=>l.id === listingId);
            if (!listing) {
                console.error('[ListingContext] Listing not found:', listingId);
                return false;
            }
            // Check if this is an incremental bid (user raising their own bid)
            const isCurrentHighestBidder = listing.auction?.highestBidder === bidder;
            const currentHighestBid = listing.auction?.highestBid || 0;
            if (isCurrentHighestBidder && currentHighestBid > 0) {
                // For incremental bids, only charge the difference (no fee)
                const bidDifference = amount - currentHighestBid;
                // NOTE: Balance validation should be done in the component that calls placeBid
                // We don't validate balance here to avoid using hooks inside this function
                console.log(`[ListingContext] Processing incremental bid: difference=${bidDifference}`);
            }
            // Delegate to AuctionContext
            const success = await auctionPlaceBid(listingId, bidder, amount);
            if (success) {
                // Refresh listings to get updated bid info
                await refreshListings();
                // Add seller notification
                addSellerNotification(listing.seller, `💰 New bid! ${bidder} bid $${amount.toFixed(2)} on "${listing.title}"`);
            }
            return success;
        } catch (error) {
            console.error('[ListingContext] Bid error:', error);
            return false;
        }
    }, [
        listings,
        auctionPlaceBid,
        refreshListings,
        addSellerNotification
    ]);
    const getAuctionListings = ()=>{
        return listings.filter((listing)=>listing.auction?.isAuction);
    };
    const getActiveAuctions = ()=>{
        return listings.filter((listing)=>listing.auction?.isAuction && listing.auction.status === 'active');
    };
    const getEndedAuctions = ()=>{
        return listings.filter((listing)=>listing.auction?.isAuction && listing.auction.status === 'ended');
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
                        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                        ;
                    }
                    // Notify seller with updated message for 20% fee
                    if (listing.auction.highestBidder && listing.auction.highestBid) {
                        const sellerEarnings = listing.auction.highestBid * 0.8; // 80% to seller
                        addSellerNotification(listing.seller, `🏆 Auction ended: "${listing.title}" sold to ${listing.auction.highestBidder} for $${listing.auction.highestBid.toFixed(2)}. You'll receive $${sellerEarnings.toFixed(2)} (after 20% platform fee)`);
                    } else {
                        addSellerNotification(listing.seller, `🔨 Auction ended: No valid bids for "${listing.title}"`);
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
            addSellerNotification(listing.seller, `🛑 You cancelled your auction: "${listing.title}". All bidders have been refunded.`);
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
                    title: draft.formState.title ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(draft.formState.title) : '',
                    description: draft.formState.description ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(draft.formState.description) : '',
                    tags: draft.formState.tags ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(draft.formState.tags) : ''
                },
                seller: user.username
            };
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingsService"].saveDraft(sanitizedDraft);
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
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingsService"].getDrafts(user.username);
            return result.success && result.data ? result.data : [];
        } catch (error) {
            console.error('Error getting drafts:', error);
            return [];
        }
    };
    const deleteDraft = async (draftId)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingsService"].deleteDraft(draftId);
            return result.success;
        } catch (error) {
            console.error('Error deleting draft:', error);
            return false;
        }
    };
    // Image management functions (unchanged)
    const uploadImage = async (file)=>{
        // Validate file before upload
        const fileValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateFileUpload(file, {
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
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingsService"].uploadImage(file);
            return result.success && result.data ? result.data : null;
        } catch (error) {
            console.error('Error uploading image:', error);
            return null;
        }
    };
    const deleteImage = async (imageUrl)=>{
        try {
            // Validate URL before deletion
            const sanitizedUrl = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].url(imageUrl);
            if (!sanitizedUrl) {
                console.error('Invalid image URL');
                return false;
            }
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$listings$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listingsService"].deleteImage(sanitizedUrl);
            return result.success;
        } catch (error) {
            console.error('Error deleting image:', error);
            return false;
        }
    };
    // Subscription functions (unchanged)
    const subscribeToSeller = async (buyer, seller, price)=>{
        // Validate subscription price
        const priceValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["securityService"].validateAmount(price, {
            min: 0.01,
            max: 1000
        });
        if (!priceValidation.valid) {
            console.error('Invalid subscription price:', priceValidation.error);
            return false;
        }
        // Sanitize usernames
        const sanitizedBuyer = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(buyer);
        const sanitizedSeller = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(seller);
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
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('subscriptions', updated);
                return updated;
            });
            // NEW: Store subscription details with the actual price paid
            const subscriptionDetails = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].getItem('subscription_details', {});
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
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('subscription_details', subscriptionDetails);
            addSellerNotification(sanitizedSeller, `🎉 ${sanitizedBuyer} subscribed to you!`);
        }
        return success;
    };
    // Unsubscribe from seller with API support (unchanged)
    const unsubscribeFromSeller = async (buyer, seller)=>{
        try {
            // Sanitize usernames
            const sanitizedBuyer = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(buyer);
            const sanitizedSeller = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(seller);
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
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('subscriptions', updated);
                    return updated;
                });
                // Also remove from subscription details
                const subscriptionDetails = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].getItem('subscription_details', {});
                const buyerSubs = subscriptionDetails[sanitizedBuyer] || [];
                const filteredSubs = buyerSubs.filter((sub)=>sub.seller !== sanitizedSeller);
                subscriptionDetails[sanitizedBuyer] = filteredSubs;
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('subscription_details', subscriptionDetails);
                // Add notification to seller
                addSellerNotification(sanitizedSeller, `${sanitizedBuyer} unsubscribed from your content`);
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
        // Sanitize usernames
        const sanitizedBuyer = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(buyer);
        const sanitizedSeller = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(seller);
        return subscriptions[sanitizedBuyer]?.includes(sanitizedSeller) ?? false;
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
        const code = docs.code || `VERIF-${user.username}-${Math.floor(100000 + Math.random() * 900000)}`;
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usersService"].requestVerification(user.username, {
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
        const sanitizedUsername = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].username(username);
        const sanitizedReason = rejectionReason ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$security$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["sanitize"].strict(rejectionReason) : undefined;
        const existingUser = users[sanitizedUsername];
        if (!existingUser) return;
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$users$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usersService"].updateVerificationStatus(sanitizedUsername, {
                status,
                rejectionReason: sanitizedReason,
                adminUsername: user?.username || 'admin'
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
                if (user?.username === sanitizedUsername) {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ListingContext.Provider, {
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
const useListings = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ListingContext);
    if (!context) throw new Error('useListings must be used within a ListingProvider');
    return context;
};
}),
"[project]/src/context/MessageContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/context/MessageContext.tsx
__turbopack_context__.s({
    "MessageProvider": ()=>MessageProvider,
    "getReportCount": ()=>getReportCount,
    "useMessages": ()=>useMessages
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__ = __turbopack_context__.i("[project]/node_modules/uuid/dist/esm/v4.js [app-ssr] (ecmascript) <export default as v4>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/messages.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-ssr] (ecmascript) <export * as z>");
// Import WebSocket context
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
const MessageContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Helper to create a consistent conversation key
const getConversationKey = (userA, userB)=>{
    return [
        userA,
        userB
    ].sort().join('-');
};
// Validation schemas
const customRequestMetaSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.title,
    price: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.price,
    message: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.description
});
const MessageProvider = ({ children })=>{
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [blockedUsers, setBlockedUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [reportedUsers, setReportedUsers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [reportLogs, setReportLogs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [messageNotifications, setMessageNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [updateTrigger, setUpdateTrigger] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    // Use WebSocket context - with safe fallback
    const wsContext = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWebSocket"] ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWebSocket"])() : null;
    const { subscribe, isConnected } = wsContext || {
        subscribe: null,
        isConnected: false
    };
    // Track processed message IDs to prevent duplicates
    const processedMessageIds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const optimisticMessageMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Map()); // optimisticId -> realId
    const subscriptionsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])([]);
    // Initialize service on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messagesService"].initialize();
    }, []);
    // Load initial data using services
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const loadData = async ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                setIsLoading(false);
                return;
            }
            //TURBOPACK unreachable
            ;
        };
        loadData();
    }, []);
    // FIXED: WebSocket listener for new messages - handle optimistic updates properly
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Clean up previous subscriptions
        subscriptionsRef.current.forEach((unsub)=>unsub());
        subscriptionsRef.current = [];
        if (!subscribe) {
            console.log('[MessageContext] WebSocket subscribe not available');
            return;
        }
        console.log('[MessageContext] Setting up WebSocket listeners, connected:', isConnected);
        // Subscribe to new message events
        const unsubscribeNewMessage = subscribe('message:new', (data)=>{
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
                    id: data.id || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
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
                setMessages((prev)=>{
                    const existingMessages = prev[conversationKey] || [];
                    // Check if this is a confirmation of an optimistic message
                    if (data._optimisticId) {
                        // Store the mapping
                        optimisticMessageMap.current.set(data._optimisticId, newMessage.id);
                        // Remove the optimistic message and add the confirmed one
                        const withoutOptimistic = existingMessages.filter((m)=>m._optimisticId !== data._optimisticId);
                        // Check if the confirmed message already exists
                        const isDuplicate = withoutOptimistic.some((m)=>m.id && m.id === newMessage.id);
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
                        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', updatedMessages).catch((err)=>console.error('[MessageContext] Failed to save messages:', err));
                        return updatedMessages;
                    }
                    // Check if message already exists (by ID or by content+timestamp for duplicates)
                    const isDuplicate = existingMessages.some((m)=>{
                        if (m.id && m.id === newMessage.id) return true;
                        // Check for duplicate by content and approximate time (within 2 seconds)
                        if (m.sender === newMessage.sender && m.receiver === newMessage.receiver && m.content === newMessage.content) {
                            const timeDiff = Math.abs(new Date(m.date).getTime() - new Date(newMessage.date).getTime());
                            return timeDiff < 2000;
                        }
                        return false;
                    });
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
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', updatedMessages).catch((err)=>console.error('[MessageContext] Failed to save messages:', err));
                    return updatedMessages;
                });
                // Force a re-render to ensure UI updates
                setUpdateTrigger((prev)=>{
                    console.log('[MessageContext] Triggering update:', prev + 1);
                    return prev + 1;
                });
                // Update notifications if it's not a custom request
                if (data.type !== 'customRequest') {
                    setMessageNotifications((prev)=>{
                        const sellerNotifs = prev[data.receiver] || [];
                        const existingIndex = sellerNotifs.findIndex((n)=>n.buyer === data.sender);
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
                    });
                }
                // Emit a custom event for components to listen to
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
            }
        });
        // Also listen for message:read events
        const unsubscribeRead = subscribe('message:read', (data)=>{
            console.log('[MessageContext] Messages marked as read via WebSocket:', data);
            if (data && data.threadId && data.messageIds) {
                setMessages((prev)=>{
                    const updatedMessages = {
                        ...prev
                    };
                    if (updatedMessages[data.threadId]) {
                        updatedMessages[data.threadId] = updatedMessages[data.threadId].map((msg)=>{
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
                        });
                    }
                    // Save to storage
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', updatedMessages).catch((err)=>console.error('[MessageContext] Failed to save messages after read update:', err));
                    return updatedMessages;
                });
                // Emit DOM event for read status update
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                // Force a re-render
                setUpdateTrigger((prev)=>prev + 1);
            }
        });
        subscriptionsRef.current = [
            unsubscribeNewMessage,
            unsubscribeRead
        ];
        return ()=>{
            console.log('[MessageContext] Cleaning up WebSocket listeners');
            subscriptionsRef.current.forEach((unsub)=>unsub());
            subscriptionsRef.current = [];
        };
    }, [
        subscribe,
        isConnected
    ]);
    // Save data whenever it changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        messages,
        isLoading
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        blockedUsers,
        isLoading
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        reportedUsers,
        isLoading
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        reportLogs,
        isLoading
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        messageNotifications,
        isLoading
    ]);
    // FIXED: Send message with optimistic ID tracking
    const sendMessage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (sender, receiver, content, options)=>{
        // Validate inputs
        if (!sender || !receiver) {
            console.error('Invalid sender or receiver');
            return;
        }
        if (!content.trim() && !options?.meta?.imageUrl) {
            console.error('Cannot send empty message without image');
            return;
        }
        // For image messages, allow empty content or provide default
        let sanitizedContent = content;
        if (options?.type === 'image' && !content.trim() && options?.meta?.imageUrl) {
            sanitizedContent = 'Image shared';
        }
        // Validate message content only if we have content to validate
        if (sanitizedContent.trim()) {
            const contentValidation = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messageSchemas"].messageContent.safeParse(sanitizedContent);
            if (!contentValidation.success) {
                console.error('Invalid message content:', contentValidation.error);
                return;
            }
            sanitizedContent = contentValidation.data;
        }
        // Validate and sanitize meta fields if present
        let sanitizedMeta = options?.meta;
        if (sanitizedMeta) {
            sanitizedMeta = {
                ...sanitizedMeta,
                title: sanitizedMeta.title ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(sanitizedMeta.title) : undefined,
                message: sanitizedMeta.message ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(sanitizedMeta.message) : undefined,
                tags: sanitizedMeta.tags?.map((tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag).slice(0, 30))
            };
        }
        try {
            // Include optimistic ID if provided
            const messageData = {
                sender,
                receiver,
                content: sanitizedContent,
                type: options?.type,
                meta: sanitizedMeta,
                _optimisticId: options?._optimisticId
            };
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messagesService"].sendMessage(messageData);
            if (result.success && result.data) {
                // DON'T add the message to local state here - let WebSocket handle it
                // This prevents duplicates
                console.log('Message sent successfully, waiting for WebSocket confirmation');
                // Only update notifications locally since WebSocket won't handle this
                if (options?.type !== 'customRequest') {
                    setMessageNotifications((prev)=>{
                        const sellerNotifs = prev[receiver] || [];
                        const existingIndex = sellerNotifs.findIndex((n)=>n.buyer === sender);
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
                    });
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }, []);
    const sendCustomRequest = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((buyer, seller, content, title, price, tags, listingId)=>{
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
                id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                title: validation.data.title,
                price: validation.data.price,
                tags: tags.map((tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag).slice(0, 30)),
                message: validation.data.message
            }
        });
    }, [
        sendMessage
    ]);
    const getMessagesForUsers = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((userA, userB)=>{
        const conversationKey = getConversationKey(userA, userB);
        return messages[conversationKey] || [];
    }, [
        messages,
        updateTrigger
    ]); // Add updateTrigger to dependencies
    const getThreadsForUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((username, role)=>{
        const threads = {};
        Object.entries(messages).forEach(([key, msgs])=>{
            msgs.forEach((msg)=>{
                if (msg.sender === username || msg.receiver === username) {
                    const otherParty = msg.sender === username ? msg.receiver : msg.sender;
                    if (!threads[otherParty]) {
                        threads[otherParty] = [];
                    }
                    threads[otherParty].push(msg);
                }
            });
        });
        Object.values(threads).forEach((thread)=>{
            thread.sort((a, b)=>new Date(a.date).getTime() - new Date(b.date).getTime());
        });
        return threads;
    }, [
        messages,
        updateTrigger
    ]); // Add updateTrigger to dependencies
    const getThreadInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((username, otherParty)=>{
        const conversationKey = getConversationKey(username, otherParty);
        const threadMessages = messages[conversationKey] || [];
        const unreadCount = threadMessages.filter((msg)=>msg.receiver === username && !msg.read && !msg.isRead).length;
        const lastMessage = threadMessages.length > 0 ? threadMessages[threadMessages.length - 1] : null;
        return {
            unreadCount,
            lastMessage,
            otherParty
        };
    }, [
        messages,
        updateTrigger
    ]); // Add updateTrigger to dependencies
    const getAllThreadsInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((username, role)=>{
        const threads = getThreadsForUser(username, role);
        const threadInfos = {};
        Object.keys(threads).forEach((otherParty)=>{
            threadInfos[otherParty] = getThreadInfo(username, otherParty);
        });
        return threadInfos;
    }, [
        getThreadsForUser,
        getThreadInfo
    ]);
    const markMessagesAsRead = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (userA, userB)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messagesService"].markMessagesAsRead(userA, userB);
            if (result.success) {
                const conversationKey = getConversationKey(userA, userB);
                setMessages((prev)=>{
                    const conversationMessages = prev[conversationKey] || [];
                    const updatedMessages = conversationMessages.map((msg)=>msg.receiver === userA && msg.sender === userB && !msg.read ? {
                            ...msg,
                            read: true,
                            isRead: true
                        } : msg);
                    const updated = {
                        ...prev,
                        [conversationKey]: updatedMessages
                    };
                    // Save to storage
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem('panty_messages', updated).catch((err)=>console.error('[MessageContext] Failed to save messages after marking read:', err));
                    return updated;
                });
                clearMessageNotifications(userA, userB);
                // Force a re-render
                setUpdateTrigger((prev)=>prev + 1);
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    }, []);
    const clearMessageNotifications = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((seller, buyer)=>{
        setMessageNotifications((prev)=>{
            const sellerNotifs = prev[seller] || [];
            const filtered = sellerNotifs.filter((n)=>n.buyer !== buyer);
            if (filtered.length === sellerNotifs.length) {
                return prev;
            }
            return {
                ...prev,
                [seller]: filtered
            };
        });
    }, []);
    const blockUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (blocker, blockee)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messagesService"].blockUser({
                blocker,
                blocked: blockee
            });
            if (result.success) {
                setBlockedUsers((prev)=>{
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
                });
            }
        } catch (error) {
            console.error('Error blocking user:', error);
        }
    }, []);
    const unblockUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (blocker, blockee)=>{
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messagesService"].unblockUser({
                blocker,
                blocked: blockee
            });
            if (result.success) {
                setBlockedUsers((prev)=>{
                    const blockerList = prev[blocker] || [];
                    return {
                        ...prev,
                        [blocker]: blockerList.filter((b)=>b !== blockee)
                    };
                });
            }
        } catch (error) {
            console.error('Error unblocking user:', error);
        }
    }, []);
    const reportUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (reporter, reportee)=>{
        const conversationKey = getConversationKey(reporter, reportee);
        const reportMessages = messages[conversationKey] || [];
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$messages$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messagesService"].reportUser({
                reporter,
                reportee,
                messages: reportMessages
            });
            if (result.success) {
                setReportedUsers((prev)=>{
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
                });
                const newReport = {
                    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$uuid$2f$dist$2f$esm$2f$v4$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__v4$3e$__["v4"])(),
                    reporter,
                    reportee,
                    messages: reportMessages,
                    date: new Date().toISOString(),
                    processed: false,
                    category: 'other'
                };
                setReportLogs((prev)=>[
                        ...prev,
                        newReport
                    ]);
            }
        } catch (error) {
            console.error('Error reporting user:', error);
        }
    }, [
        messages
    ]);
    const isBlocked = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((blocker, blockee)=>{
        return blockedUsers[blocker]?.includes(blockee) ?? false;
    }, [
        blockedUsers
    ]);
    const hasReported = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((reporter, reportee)=>{
        return reportedUsers[reporter]?.includes(reportee) ?? false;
    }, [
        reportedUsers
    ]);
    const getReportCount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        return reportLogs.filter((report)=>!report.processed).length;
    }, [
        reportLogs
    ]);
    // Add a method to force refresh messages
    const refreshMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        console.log('[MessageContext] Force refresh triggered');
        setUpdateTrigger((prev)=>prev + 1);
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MessageContext.Provider, {
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
const useMessages = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(MessageContext);
    if (!context) {
        throw new Error('useMessages must be used within a MessageProvider');
    }
    return context;
};
const getReportCount = async ()=>{
    try {
        if ("TURBOPACK compile-time truthy", 1) return 0;
        //TURBOPACK unreachable
        ;
        const reports = undefined;
        const pendingReports = undefined;
    } catch (error) {
        console.error('Error getting external report count:', error);
        return 0;
    }
};
}),
"[project]/src/context/ReviewContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/context/ReviewContext.tsx
__turbopack_context__.s({
    "ReviewProvider": ()=>ReviewProvider,
    "useReviews": ()=>useReviews
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reviews$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/reviews.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-ssr] (ecmascript) <export * as z>");
'use client';
;
;
;
;
;
;
// Validation schema for reviews
const reviewSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    rating: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number().int().min(1).max(5),
    comment: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(10, 'Review must be at least 10 characters').max(500, 'Review must be less than 500 characters')
});
const ReviewContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const ReviewProvider = ({ children })=>{
    const [cachedReviews, setCachedReviews] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [cachedStats, setCachedStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    // Clear cache when user changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        setCachedReviews({});
        setCachedStats({});
    }, [
        user?.username
    ]);
    const getReviewsForSeller = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (sellerUsername)=>{
        try {
            setIsLoading(true);
            setError(null);
            // Check cache first
            if (cachedReviews[sellerUsername]) {
                return cachedReviews[sellerUsername];
            }
            // Fetch from API
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reviews$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["reviewsService"].getSellerReviews(sellerUsername);
            if (response.success && response.data) {
                const reviews = response.data.reviews.map((r)=>({
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
                    }));
                // Update cache
                setCachedReviews((prev)=>({
                        ...prev,
                        [sellerUsername]: reviews
                    }));
                // Cache stats too
                if (response.data.stats) {
                    setCachedStats((prev)=>({
                            ...prev,
                            [sellerUsername]: response.data.stats
                        }));
                }
                return reviews;
            } else {
                setError(response.error?.message || 'Failed to fetch reviews');
                return [];
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setError('Failed to fetch reviews');
            return [];
        } finally{
            setIsLoading(false);
        }
    }, [
        cachedReviews
    ]);
    const addReview = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (sellerUsername, orderId, review)=>{
        try {
            setIsLoading(true);
            setError(null);
            if (!user?.username) {
                setError('You must be logged in to submit a review');
                return false;
            }
            // Validate review data
            const validation = reviewSchema.safeParse({
                rating: review.rating,
                comment: review.comment
            });
            if (!validation.success) {
                setError(validation.error.errors[0]?.message || 'Invalid review');
                return false;
            }
            // Create review via API
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reviews$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["reviewsService"].createReview({
                orderId,
                rating: validation.data.rating,
                comment: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(validation.data.comment),
                asDescribed: review.asDescribed !== false,
                fastShipping: review.fastShipping !== false,
                wouldBuyAgain: review.wouldBuyAgain !== false
            });
            if (response.success) {
                // Clear cache for this seller to force refresh
                setCachedReviews((prev)=>{
                    const updated = {
                        ...prev
                    };
                    delete updated[sellerUsername];
                    return updated;
                });
                setCachedStats((prev)=>{
                    const updated = {
                        ...prev
                    };
                    delete updated[sellerUsername];
                    return updated;
                });
                return true;
            } else {
                setError(response.error?.message || 'Failed to create review');
                return false;
            }
        } catch (error) {
            console.error('Error adding review:', error);
            setError('Failed to add review');
            return false;
        } finally{
            setIsLoading(false);
        }
    }, [
        user?.username
    ]);
    const hasReviewed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (orderId)=>{
        try {
            setIsLoading(true);
            setError(null);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$reviews$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["reviewsService"].checkOrderReview(orderId);
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
    }, []);
    const getReviewStats = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (sellerUsername)=>{
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
    }, [
        cachedStats,
        getReviewsForSeller
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(ReviewContext.Provider, {
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
const useReviews = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(ReviewContext);
    if (!context) throw new Error('useReviews must be used within a ReviewProvider');
    return context;
};
}),
"[project]/src/context/RequestContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/context/RequestContext.tsx
__turbopack_context__.s({
    "RequestProvider": ()=>RequestProvider,
    "useRequests": ()=>useRequests
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validation/schemas.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-ssr] (ecmascript) <export * as z>");
"use client";
;
;
;
;
;
;
// Validation schemas
const requestSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    title: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.title,
    description: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.description,
    price: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validation$2f$schemas$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["messageSchemas"].customRequest.shape.price,
    tags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().max(30)).max(10).optional()
});
const responseSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(1).max(500);
const RequestContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const useRequests = ()=>{
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(RequestContext);
    if (!ctx) throw new Error('useRequests must be used within a RequestProvider');
    return ctx;
};
const RequestProvider = ({ children })=>{
    const [requests, setRequests] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isInitialized, setIsInitialized] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Load initial data from localStorage using service
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const loadData = async ()=>{
            if ("TURBOPACK compile-time truthy", 1) return;
            //TURBOPACK unreachable
            ;
        };
        loadData();
    }, [
        isInitialized
    ]);
    // Save to localStorage whenever requests change using service
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        requests,
        isInitialized
    ]);
    const addRequest = (req)=>{
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
            title: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(validation.data.title),
            description: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(validation.data.description),
            price: validation.data.price,
            tags: validation.data.tags?.map((tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag).slice(0, 30)) || [],
            messageThreadId: req.messageThreadId || `${req.buyer}-${req.seller}`,
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
                return {
                    ...r,
                    status,
                    response: response ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(response) : r.response,
                    lastModifiedBy: modifiedBy || r.lastModifiedBy,
                    lastEditedBy: status === 'edited' ? lastEditedBy : r.lastEditedBy,
                    pendingWith,
                    ...updateFields ? {
                        title: updateFields.title ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(updateFields.title) : r.title,
                        description: updateFields.description ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(updateFields.description) : r.description,
                        price: updateFields.price ?? r.price,
                        tags: updateFields.tags?.map((tag)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(tag).slice(0, 30)) || r.tags
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(RequestContext.Provider, {
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
}),
"[project]/src/context/LoadingContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/context/LoadingContext.tsx
__turbopack_context__.s({
    "LoadingButton": ()=>LoadingButton,
    "LoadingProvider": ()=>LoadingProvider,
    "LoadingSpinner": ()=>LoadingSpinner,
    "useLoading": ()=>useLoading
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-ssr] (ecmascript) <export default as Loader2>");
'use client';
;
;
;
const LoadingContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function LoadingProvider({ children }) {
    const [globalLoading, setGlobalLoadingState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        isLoading: false
    });
    const [loadingStates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(new Map());
    const [, forceUpdate] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const loadingCountRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Map());
    // Set global loading
    const setGlobalLoading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((isLoading, message, progress)=>{
        setGlobalLoadingState({
            isLoading,
            message,
            progress
        });
    }, []);
    // Set named loading state
    const setLoading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((key, isLoading, message, progress)=>{
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
    }, [
        loadingStates
    ]);
    // Check if specific key is loading
    const isLoading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((key)=>{
        return loadingStates.has(key);
    }, [
        loadingStates
    ]);
    // Execute function with loading state
    const withLoading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (key, fn, message)=>{
        setLoading(key, true, message);
        try {
            return await fn();
        } finally{
            setLoading(key, false);
        }
    }, [
        setLoading
    ]);
    // Clear all loading states
    const clearAllLoading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        loadingStates.clear();
        loadingCountRef.current.clear();
        setGlobalLoadingState({
            isLoading: false
        });
        forceUpdate({});
    }, [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingContext.Provider, {
        value: value,
        children: [
            children,
            globalLoading.isLoading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(GlobalLoadingOverlay, {
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
// Global Loading Overlay Component
function GlobalLoadingOverlay({ message, progress }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                        className: "w-10 h-10 text-[#ff950e] animate-spin"
                    }, void 0, false, {
                        fileName: "[project]/src/context/LoadingContext.tsx",
                        lineNumber: 132,
                        columnNumber: 11
                    }, this),
                    message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-white text-sm font-medium",
                        children: message
                    }, void 0, false, {
                        fileName: "[project]/src/context/LoadingContext.tsx",
                        lineNumber: 135,
                        columnNumber: 13
                    }, this),
                    progress !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-48",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-gray-800 rounded-full h-2 overflow-hidden",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-[#ff950e] h-full transition-all duration-300",
                                    style: {
                                        width: `${Math.min(100, Math.max(0, progress))}%`
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
function useLoading() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
function LoadingSpinner({ size = 'md', className = '' }) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
        className: `animate-spin text-[#ff950e] ${sizeClasses[size]} ${className}`
    }, void 0, false, {
        fileName: "[project]/src/context/LoadingContext.tsx",
        lineNumber: 181,
        columnNumber: 5
    }, this);
}
function LoadingButton({ isLoading, children, loadingText, className = '', ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        disabled: isLoading,
        className: `relative ${className}`,
        ...props,
        children: isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "flex items-center justify-center gap-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LoadingSpinner, {
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
}),
"[project]/src/context/FavoritesContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// src/context/FavoritesContext.tsx
__turbopack_context__.s({
    "FavoritesProvider": ()=>FavoritesProvider,
    "useFavorites": ()=>useFavorites
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$index$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/index.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/storage.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$favorites$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/favorites.service.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/sanitization.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/security/rate-limiter.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-ssr] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/services/api.config.ts [app-ssr] (ecmascript) <locals>");
'use client';
;
;
;
;
;
;
;
;
const FavoritesContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function FavoritesProvider({ children }) {
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [favorites, setFavorites] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loadingFavorites, setLoadingFavorites] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const rateLimiter = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$rate$2d$limiter$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getRateLimiter"])();
    // Storage key based on username
    const getStorageKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((username)=>{
        return `favorites_${(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(username)}`;
    }, []);
    // Load favorites from API or localStorage
    const loadFavorites = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!user?.username) {
            setFavorites([]);
            return;
        }
        setLoadingFavorites(true);
        try {
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                // Load from API
                const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$favorites$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["favoritesService"].getFavorites(user.username);
                if (response.success && response.data) {
                    setFavorites(response.data);
                    // Also save to localStorage for offline access
                    const storageKey = getStorageKey(user.username);
                    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem(storageKey, response.data);
                } else if (response.error) {
                    setError(response.error.message);
                    // Fallback to localStorage
                    const storageKey = getStorageKey(user.username);
                    const storedFavorites = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].getItem(storageKey, []);
                    setFavorites(storedFavorites);
                }
            } else {
                // Load from localStorage only
                const storageKey = getStorageKey(user.username);
                const storedFavorites = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].getItem(storageKey, []);
                // Validate and sanitize loaded data
                const validatedFavorites = storedFavorites.filter((fav)=>fav.sellerId && fav.sellerUsername && fav.addedAt).map((fav)=>({
                        ...fav,
                        sellerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(fav.sellerId),
                        sellerUsername: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(fav.sellerUsername),
                        addedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(fav.addedAt)
                    }));
                setFavorites(validatedFavorites);
            }
        } catch (err) {
            console.error('Error loading favorites:', err);
            setError('Failed to load favorites');
            setFavorites([]);
        } finally{
            setLoadingFavorites(false);
        }
    }, [
        user?.username,
        getStorageKey
    ]);
    // Load favorites when user changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        loadFavorites();
    }, [
        loadFavorites
    ]);
    // Check if seller is favorited
    const isFavorited = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((sellerId)=>{
        return favorites.some((fav)=>fav.sellerId === sellerId);
    }, [
        favorites
    ]);
    // Toggle favorite status
    const toggleFavorite = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (seller)=>{
        if (!user?.username) {
            setError('Please log in to add favorites');
            return false;
        }
        // Rate limiting
        const rateLimitResult = rateLimiter.check('FAVORITES_TOGGLE', {
            maxAttempts: 30,
            windowMs: 60 * 1000 // 30 toggles per minute
        });
        if (!rateLimitResult.allowed) {
            setError(`Too many actions. Please wait ${rateLimitResult.waitTime} seconds.`);
            return false;
        }
        try {
            const storageKey = getStorageKey(user.username);
            const currentFavorites = [
                ...favorites
            ];
            const existingIndex = currentFavorites.findIndex((fav)=>fav.sellerId === seller.id);
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$api$2e$config$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["FEATURES"].USE_API_USERS) {
                // Use API
                if (existingIndex >= 0) {
                    // Remove from favorites via API
                    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$favorites$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["favoritesService"].removeFavorite(seller.id);
                    if (response.success) {
                        const newFavorites = currentFavorites.filter((fav)=>fav.sellerId !== seller.id);
                        setFavorites(newFavorites);
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem(storageKey, newFavorites);
                        setError(null);
                        return true;
                    } else {
                        setError(response.error?.message || 'Failed to remove favorite');
                        return false;
                    }
                } else {
                    // Add to favorites via API
                    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$favorites$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["favoritesService"].addFavorite({
                        sellerId: seller.id,
                        sellerUsername: seller.username,
                        profilePicture: seller.profilePicture,
                        tier: seller.tier,
                        isVerified: seller.isVerified
                    });
                    if (response.success && response.data) {
                        const newFavorites = [
                            ...currentFavorites,
                            response.data
                        ];
                        setFavorites(newFavorites);
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem(storageKey, newFavorites);
                        setError(null);
                        return true;
                    } else {
                        setError(response.error?.message || 'Failed to add favorite');
                        return false;
                    }
                }
            } else {
                // LocalStorage only
                let newFavorites;
                if (existingIndex >= 0) {
                    // Remove from favorites
                    newFavorites = currentFavorites.filter((fav)=>fav.sellerId !== seller.id);
                } else {
                    // Add to favorites
                    const newFavorite = {
                        sellerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeStrict"])(seller.id),
                        sellerUsername: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$security$2f$sanitization$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sanitizeUsername"])(seller.username),
                        addedAt: new Date().toISOString(),
                        profilePicture: seller.profilePicture,
                        tier: seller.tier,
                        isVerified: seller.isVerified
                    };
                    newFavorites = [
                        ...currentFavorites,
                        newFavorite
                    ];
                }
                // Save to storage
                const success = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$storage$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["storageService"].setItem(storageKey, newFavorites);
                if (success) {
                    setFavorites(newFavorites);
                    setError(null);
                    return true;
                } else {
                    setError('Failed to update favorites');
                    return false;
                }
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
            setError('Failed to update favorites');
            return false;
        }
    }, [
        user?.username,
        favorites,
        getStorageKey,
        rateLimiter
    ]);
    const clearError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        setError(null);
    }, []);
    const refreshFavorites = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        await loadFavorites();
    }, [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FavoritesContext.Provider, {
        value: contextValue,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/FavoritesContext.tsx",
        lineNumber: 239,
        columnNumber: 5
    }, this);
}
function useFavorites() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
}
}),
"[project]/src/context/NotificationContext.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "NotificationProvider": ()=>NotificationProvider,
    "useNotifications": ()=>useNotifications
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/context/WebSocketContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/notification.service.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
;
const NotificationContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const useNotifications = ()=>{
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
    return ctx;
};
const NotificationProvider = ({ children })=>{
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const ws = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$context$2f$WebSocketContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useWebSocket"])();
    const subscribe = ws?.subscribe;
    const [activeNotifications, setActiveNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [clearedNotifications, setClearedNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [unreadCount, setUnreadCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const isMountedRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(true);
    const lastFetchRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(0);
    const FETCH_COOLDOWN = 1000;
    // Track processed notification IDs to prevent duplicates
    const processedNotificationIds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new Set());
    const loadNotifications = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        if (!user || !isMountedRef.current) return;
        const now = Date.now();
        if (now - lastFetchRef.current < FETCH_COOLDOWN) return;
        lastFetchRef.current = now;
        setIsLoading(true);
        setError(null);
        try {
            const activeRes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationService"].getActiveNotifications(50);
            if (activeRes.success && Array.isArray(activeRes.data) && isMountedRef.current) {
                setActiveNotifications(activeRes.data);
                setUnreadCount(activeRes.data.filter((n)=>!n.read).length);
                // Track all loaded notification IDs
                activeRes.data.forEach((n)=>{
                    const id = n._id || n.id;
                    if (id) processedNotificationIds.current.add(id);
                });
            }
            const clearedRes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationService"].getClearedNotifications(50);
            if (clearedRes.success && Array.isArray(clearedRes.data) && isMountedRef.current) {
                setClearedNotifications(clearedRes.data);
            }
        } catch (e) {
            if (isMountedRef.current) setError('Failed to load notifications');
        } finally{
            if (isMountedRef.current) setIsLoading(false);
        }
    }, [
        user
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        isMountedRef.current = true;
        if (user) {
            loadNotifications();
        } else {
            setActiveNotifications([]);
            setClearedNotifications([]);
            setUnreadCount(0);
        }
        return ()=>{
            isMountedRef.current = false;
        };
    }, [
        user,
        loadNotifications
    ]);
    // FIXED: Only listen to the primary notification:new event from backend
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!subscribe || !user) return;
        const unsubs = [];
        // PRIMARY: This is the ONLY source for tip notifications
        // The backend's Notification.createTipNotification automatically emits this
        unsubs.push(subscribe('notification:new', (data)=>{
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
            setActiveNotifications((prev)=>{
                const exists = prev.some((existing)=>(existing._id || existing.id) === notificationId);
                if (exists) {
                    console.log('[NotificationContext] Notification already in state:', notificationId);
                    return prev;
                }
                return [
                    n,
                    ...prev
                ];
            });
            setUnreadCount((c)=>c + 1);
        }));
        // REMOVED: Legacy tip_received listener - no longer needed
        // REMOVED: message:new tip listener - no longer needed
        // Clear/restore/delete event handlers remain the same
        unsubs.push(subscribe('notification:cleared', (data)=>{
            const id = data?.notificationId;
            setActiveNotifications((prev)=>{
                const found = prev.find((n)=>(n._id || n.id) === id);
                if (found) {
                    setClearedNotifications((c)=>[
                            found,
                            ...c
                        ]);
                    if (!found.read) setUnreadCount((u)=>Math.max(0, u - 1));
                }
                return prev.filter((n)=>(n._id || n.id) !== id);
            });
        }));
        unsubs.push(subscribe('notification:all_cleared', ()=>{
            setActiveNotifications((prevActive)=>{
                setClearedNotifications((prevCleared)=>[
                        ...prevActive.map((n)=>({
                                ...n,
                                cleared: true
                            })),
                        ...prevCleared
                    ]);
                setUnreadCount(0);
                return [];
            });
        }));
        unsubs.push(subscribe('notification:restored', (data)=>{
            const id = data?.notificationId;
            setClearedNotifications((prev)=>{
                const found = prev.find((n)=>(n._id || n.id) === id);
                if (found) {
                    setActiveNotifications((active)=>{
                        // Check if already exists to prevent duplicates
                        const exists = active.some((n)=>(n._id || n.id) === id);
                        if (exists) return active;
                        return [
                            found,
                            ...active
                        ];
                    });
                    if (!found.read) setUnreadCount((c)=>c + 1);
                }
                return prev.filter((n)=>(n._id || n.id) !== id);
            });
        }));
        unsubs.push(subscribe('notification:deleted', (data)=>{
            const id = data?.notificationId;
            setClearedNotifications((prev)=>prev.filter((n)=>(n._id || n.id) !== id));
        }));
        return ()=>unsubs.forEach((fn)=>fn());
    }, [
        subscribe,
        user
    ]);
    // Actions
    const clearNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (id)=>{
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationService"].clearNotification(id);
            if (res.success) {
                setActiveNotifications((prev)=>{
                    const found = prev.find((n)=>(n._id || n.id) === id);
                    if (found) {
                        setClearedNotifications((c)=>[
                                {
                                    ...found,
                                    cleared: true
                                },
                                ...c
                            ]);
                        if (!found.read) setUnreadCount((u)=>Math.max(0, u - 1));
                    }
                    return prev.filter((n)=>(n._id || n.id) !== id);
                });
            } else setError('Failed to clear notification');
        } catch  {
            setError('Failed to clear notification');
        }
    }, []);
    const clearAllNotifications = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationService"].clearAll();
            if (res.success) {
                setActiveNotifications((prevActive)=>{
                    setClearedNotifications((prevCleared)=>[
                            ...prevActive.map((n)=>({
                                    ...n,
                                    cleared: true
                                })),
                            ...prevCleared
                        ]);
                    setUnreadCount(0);
                    return [];
                });
            } else setError('Failed to clear all notifications');
        } catch  {
            setError('Failed to clear all notifications');
        }
    }, []);
    const restoreNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (id)=>{
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationService"].restoreNotification(id);
            if (res.success) {
                setClearedNotifications((prev)=>{
                    const found = prev.find((n)=>(n._id || n.id) === id);
                    if (found) {
                        setActiveNotifications((active)=>{
                            // Check if already exists to prevent duplicates
                            const exists = active.some((n)=>(n._id || n.id) === id);
                            if (exists) return active;
                            return [
                                found,
                                ...active
                            ];
                        });
                        if (!found.read) setUnreadCount((u)=>u + 1);
                    }
                    return prev.filter((n)=>(n._id || n.id) !== id);
                });
            } else setError('Failed to restore notification');
        } catch  {
            setError('Failed to restore notification');
        }
    }, []);
    const deleteNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (id)=>{
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationService"].deleteNotification(id);
            if (res.success) {
                setClearedNotifications((prev)=>prev.filter((n)=>(n._id || n.id) !== id));
            } else setError('Failed to delete notification');
        } catch  {
            setError('Failed to delete notification');
        }
    }, []);
    const deleteAllCleared = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationService"].deleteAllCleared();
            if (res.success) {
                setClearedNotifications([]);
            } else setError('Failed to delete cleared notifications');
        } catch  {
            setError('Failed to delete cleared notifications');
        }
    }, []);
    const markAsRead = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (id)=>{
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationService"].markAsRead(id);
            if (res.success) {
                setActiveNotifications((prev)=>prev.map((n)=>(n._id || n.id) === id ? {
                            ...n,
                            read: true
                        } : n));
                const found = activeNotifications.find((n)=>(n._id || n.id) === id);
                if (found && !found.read) setUnreadCount((u)=>Math.max(0, u - 1));
            }
        } catch  {}
    }, [
        activeNotifications
    ]);
    const markAllAsRead = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$notification$2e$service$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["notificationService"].markAllAsRead();
            if (res.success) {
                setActiveNotifications((prev)=>prev.map((n)=>({
                            ...n,
                            read: true
                        })));
                setUnreadCount(0);
            }
        } catch  {}
    }, []);
    const addLocalNotification = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])((message, type = 'system')=>{
        if (!user) return;
        const n = {
            id: `local_${Date.now()}`,
            recipient: user.username,
            type: type,
            title: 'Notification',
            message,
            read: false,
            cleared: false,
            createdAt: new Date().toISOString(),
            priority: 'normal'
        };
        setActiveNotifications((prev)=>[
                n,
                ...prev
            ]);
        setUnreadCount((c)=>c + 1);
    }, [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(NotificationContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/NotificationContext.tsx",
        lineNumber: 351,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
}),

};

//# sourceMappingURL=src_context_ae54ac0e._.js.map