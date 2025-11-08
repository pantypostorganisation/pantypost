// src/services/api.config.ts

/**
 * API Configuration Module
 * Centralizes all API-related configuration and provides environment-based settings
 */

import { apiConfig, appConfig, securityConfig, isDevelopment } from '@/config/environment';
import { securityService } from './security.service';
import { sanitizeUrl, sanitizeStrict } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

// AUTH PUBLIC ENDPOINTS - Don't trigger logout on 401
const AUTH_PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/signup',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-reset-code',
];

function isAuthPublicEndpoint(endpoint: string): boolean {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return AUTH_PUBLIC_ENDPOINTS.some((publicEndpoint) =>
    normalizedEndpoint.startsWith(publicEndpoint)
  );
}

// Re-export from environment config for backward compatibility
export { isDevelopment };
export const isProduction = !isDevelopment();

// Use environment configuration correctly
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
export const FEATURES = {
  USE_API_AUTH: process.env.NEXT_PUBLIC_USE_API_AUTH !== 'false',
  USE_API_LISTINGS: process.env.NEXT_PUBLIC_USE_API_LISTINGS !== 'false',
  USE_API_ORDERS: process.env.NEXT_PUBLIC_USE_API_ORDERS !== 'false',
  USE_API_MESSAGES: process.env.NEXT_PUBLIC_USE_API_MESSAGES !== 'false',
  USE_API_WALLET: process.env.NEXT_PUBLIC_USE_API_WALLET !== 'false',
  USE_API_USERS: process.env.NEXT_PUBLIC_USE_API_USERS !== 'false',
  USE_API_BANS: process.env.NEXT_PUBLIC_USE_API_BANS !== 'false',
  USE_API_REPORTS: process.env.NEXT_PUBLIC_USE_API_REPORTS !== 'false',
  USE_MOCK_API: false,
  USE_BACKEND_STORAGE: process.env.NEXT_PUBLIC_USE_BACKEND_STORAGE !== 'false',
};

// API endpoints with parameter placeholders
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VERIFY_USERNAME: '/auth/verify-username',
    FORGOT_PASSWORD: '/auth/forgot-password',
    VERIFY_RESET_CODE: '/auth/verify-reset-code',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // User endpoints
  USERS: {
    PROFILE: '/users/:username/profile',
    UPDATE_PROFILE: '/users/:username/profile',
    VERIFICATION: '/users/:username/verification',
    SETTINGS: '/users/:username/settings',
    LIST: '/users',
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
    END_AUCTION: '/listings/:id/end-auction',
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
    UPDATE_ADDRESS: '/orders/:id/address',
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
    CUSTOM_REQUEST: '/messages/custom-request',
  },

  // Wallet endpoints
  WALLET: {
    BALANCE: '/wallet/balance/:username',
    DEPOSIT: '/wallet/deposit',
    WITHDRAW: '/wallet/withdraw',
    TRANSACTIONS: '/wallet/transactions/:username',
    ADMIN_ACTIONS: '/wallet/admin-actions',
    TRANSFER: '/wallet/transfer',
  },

  // Subscription endpoints
  SUBSCRIPTIONS: {
    LIST: '/subscriptions/:username',
    SUBSCRIBE: '/subscriptions/subscribe',
    UNSUBSCRIBE: '/subscriptions/unsubscribe',
    CHECK: '/subscriptions/check',
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
    FLAG: '/reviews/:reviewId/flag',
  },

  // Report endpoints
  REPORTS: {
    SUBMIT: '/reports/submit',
    LIST: '/reports',
    GET: '/reports/:id',
    UPDATE: '/reports/:id',
    PROCESS: '/reports/:id/process',
    BY_USER: '/reports/user/:username',
    STATS: '/reports/stats',
  },

  // Upload endpoints
  UPLOAD: {
    IMAGE: '/upload/image',
    PROFILE: '/upload/profile',
    VERIFICATION: '/upload/verification',
  },

  // Custom request endpoints
  REQUESTS: {
    LIST: '/requests',
    CREATE: '/requests',
    UPDATE: '/requests/:id',
    RESPOND: '/requests/:id/respond',
    BY_USER: '/requests/user/:username',
  },

  STATS: {
    PAYMENTS_PROCESSED: '/stats/total-payments',
  },
};

// Request configuration from environment - INCREASED TIMEOUT
export const REQUEST_CONFIG = {
  TIMEOUT: 60000, // INCREASED from 30000 to 60000 (60 seconds)
  RETRY_ATTEMPTS: parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: 1000,
  MAX_REQUEST_SIZE: 5 * 1024 * 1024,
  MAX_URL_LENGTH: 2048,
  MAX_HEADER_SIZE: 8192,
};

// Headers configuration with version from environment
export const getDefaultHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Client-Version': sanitizeStrict(process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'),
    'X-App-Name': sanitizeStrict(process.env.NEXT_PUBLIC_APP_NAME || 'PantyPost'),
    'X-Request-ID': generateRequestId(),
  };

  try {
    const csrfToken = securityService.generateCSRFToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  } catch (error) {
    console.warn('Could not generate CSRF token:', error);
  }

  return headers;
};

// Auth token management
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Helper to build full API URL with validation
 */
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  console.log('[buildApiUrl] Called with:', { endpoint, params });

  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    console.log('[buildApiUrl] Endpoint is already a full URL, returning as-is');
    return endpoint;
  }

  let url = endpoint;

  const requiredParams = (endpoint.match(/:(\w+)/g) || []).map((p) => p.substring(1));
  console.log('[buildApiUrl] Required params in endpoint:', requiredParams);

  if (requiredParams.length > 0) {
    if (!params) {
      console.error('[buildApiUrl] ERROR: No params object provided for endpoint:', endpoint);
      console.error('[buildApiUrl] Required params:', requiredParams);
      throw new Error(
        `Missing required URL parameters for endpoint: ${endpoint}. Required: ${requiredParams.join(', ')}`
      );
    }

    for (const param of requiredParams) {
      const value = params[param];

      if (value === undefined || value === null || value === '') {
        console.error(`[buildApiUrl] ERROR: Missing required parameter: ${param}`);
        console.error('[buildApiUrl] Endpoint:', endpoint);
        console.error('[buildApiUrl] Provided params:', params);
        console.error('[buildApiUrl] Required params:', requiredParams);
        throw new Error(`Missing required URL parameter: ${param} for endpoint: ${endpoint}`);
      }

      console.log(`[buildApiUrl] Replacing :${param} with "${value}"`);
    }

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        console.warn(`[buildApiUrl] Skipping undefined/null parameter: ${key}`);
        return;
      }

      const sanitizedKey = sanitizeStrict(key);
      if (sanitizedKey !== key) {
        console.error(`[buildApiUrl] Invalid parameter key: ${key}`);
        throw new Error(`Invalid parameter key: ${key}`);
      }

      const stringValue = String(value).trim();
      if (stringValue === '') {
        console.warn(`[buildApiUrl] Empty parameter value for key: ${key}`);
        return;
      }

      const sanitizedValue = encodeURIComponent(sanitizeStrict(stringValue));

      if (sanitizedValue.includes('..') || sanitizedValue.includes('//')) {
        console.error(`[buildApiUrl] Invalid parameter value (possible path traversal): ${value}`);
        throw new Error(`Invalid parameter value: ${value}`);
      }

      const placeholder = `:${key}`;
      if (url.includes(placeholder)) {
        url = url.replace(placeholder, sanitizedValue);
        console.log(`[buildApiUrl] Replaced ${placeholder} -> ${sanitizedValue}`);
      }
    });
  }

  const unreplacedParams = url.match(/:(\w+)/g);
  if (unreplacedParams && unreplacedParams.length > 0) {
    console.error('[buildApiUrl] ERROR: Unreplaced parameters found:', unreplacedParams);
    console.error('[buildApiUrl] Final URL:', url);
    console.error('[buildApiUrl] Original endpoint:', endpoint);
    console.error('[buildApiUrl] Provided params:', params);
    throw new Error(`Missing required URL parameters: ${unreplacedParams.join(', ')}`);
  }

  if (API_BASE_URL) {
    const baseUrl = API_BASE_URL.replace(/\/$/, '');
    const hasApiPath = baseUrl.endsWith('/api') || baseUrl.includes('/api/');
    const fullUrl = hasApiPath ? `${baseUrl}${url}` : `${baseUrl}/api${url}`;
    const sanitizedUrl = sanitizeUrl(fullUrl);

    if (!sanitizedUrl) {
      console.error('[buildApiUrl] ERROR: Failed to sanitize URL:', fullUrl);
      throw new Error('Invalid API URL');
    }

    if (sanitizedUrl.length > REQUEST_CONFIG.MAX_URL_LENGTH) {
      console.error('[buildApiUrl] ERROR: URL too long:', sanitizedUrl.length);
      throw new Error('URL too long');
    }

    console.log('[buildApiUrl] SUCCESS: Built URL:', sanitizedUrl);
    return sanitizedUrl;
  }

  console.log('[buildApiUrl] No API_BASE_URL, returning modified endpoint:', url);
  return url;
};

// Error response type
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
  statusCode?: number;
  requiresSubscription?: boolean;
  seller?: string;
}

// Success response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    page?: number;
    totalPages?: number;
    totalItems?: number;
    requestId?: string;
    premiumAccess?: boolean;
  };
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// CRITICAL FIX: Track in-flight requests to prevent duplicates
const inFlightRequests = new Map<string, Promise<any>>();

// Create a more robust API client with security
class ApiClient {
  private static instance: ApiClient;
  private abortControllers: Map<string, AbortController> = new Map();
  private requestCount: number = 0;
  private requestWindowStart: number = Date.now();
  private pendingRequests: Set<string> = new Set();
  private refreshPromise: Promise<any> | null = null; // ADDED: Track refresh attempts

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(key: string) {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
    this.pendingRequests.delete(key);
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
    this.pendingRequests.clear();
  }

  /**
   * Check rate limit - RELAXED for view tracking
   */
  private checkRateLimit(endpoint: string): { allowed: boolean; waitTime?: number } {
    if (process.env.NEXT_PUBLIC_ENABLE_RATE_LIMITING === 'false') return { allowed: true };

    // CRITICAL FIX: Relax rate limiting for view tracking endpoints
    if (endpoint.includes('/views')) {
      return { allowed: true }; // No rate limit for view tracking
    }

    try {
      const rateLimiter = getRateLimiter();
      const result = rateLimiter.check('API_CALL', RATE_LIMITS.API_CALL);
      return result;
    } catch (error) {
      console.warn('Rate limiter not available:', error);
      return { allowed: true };
    }
  }

  /**
   * Validate request options
   */
  private validateRequestOptions(options: RequestInit): void {
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
    if (options.method && !allowedMethods.includes(options.method.toUpperCase())) {
      throw new Error('Invalid request method');
    }

    if (options.body) {
      const bodySize =
        typeof options.body === 'string' ? new Blob([options.body]).size : 0;

      if (bodySize > REQUEST_CONFIG.MAX_REQUEST_SIZE) {
        throw new Error('Request body too large');
      }

      if (
        typeof options.body === 'string' &&
        options.headers &&
        (options.headers as any)['Content-Type'] === 'application/json'
      ) {
        try {
          JSON.parse(options.body);
        } catch {
          throw new Error('Invalid JSON in request body');
        }
      }
    }

    if (options.headers) {
      const headers = options.headers as Record<string, string>;
      let totalHeaderSize = 0;

      Object.entries(headers).forEach(([key, value]) => {
        if (
          key.includes('\n') ||
          key.includes('\r') ||
          value.includes('\n') ||
          value.includes('\r')
        ) {
          throw new Error('Invalid header format');
        }

        totalHeaderSize += key.length + value.length + 4;

        if (!/^[a-zA-Z0-9\-]+$/.test(key)) {
          throw new Error(`Invalid header name: ${key}`);
        }
      });

      if (totalHeaderSize > REQUEST_CONFIG.MAX_HEADER_SIZE) {
        throw new Error('Headers too large');
      }
    }
  }

  /**
   * Sanitize response data
   */
  private sanitizeResponse<T>(data: any): T {
    if (typeof data === 'string') {
      try {
        const sanitized = securityService.sanitizeForDisplay(data, {
          allowHtml: false,
          allowMarkdown: false,
        });
        return sanitized as unknown as T;
      } catch (error) {
        console.warn('Could not sanitize string response:', error);
        return data as T;
      }
    }

    if (typeof data === 'object' && data !== null) {
      try {
        return securityService.sanitizeForAPI(data) as T;
      } catch (error) {
        console.warn('Could not sanitize object response:', error);
        return data as T;
      }
    }

    return data as T;
  }

  /**
   * Validate response
   */
  private validateResponse(response: Response): void {
    const suspiciousHeaders = ['X-Powered-By', 'Server'];
    suspiciousHeaders.forEach((header) => {
      if (response.headers.has(header)) {
        console.warn(`Suspicious header detected: ${header}`);
      }
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html') && !response.url.includes('.html')) {
      console.warn('Unexpected HTML response');
    }
  }

  /**
   * Get auth token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const authTokens = sessionStorage.getItem('auth_tokens');
      if (authTokens) {
        const parsed = JSON.parse(authTokens);
        return parsed.token;
      }

      return localStorage.getItem('auth_token');
    } catch (error) {
      console.warn('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Make an API call with abort capability and security - CRITICAL FIX
   */
  async call<T>(
    endpoint: string,
    options: RequestInit = {},
    requestKey?: string
  ): Promise<ApiResponse<T>> {
    const requestId = generateRequestId();
    const startTime = Date.now();

    console.log('[ApiClient.call] Starting request:', {
      endpoint,
      method: options.method || 'GET',
      requestId,
    });

    // CRITICAL FIX: Create a unique key for deduplication
    const dedupeKey =
      requestKey ||
      `${options.method || 'GET'}:${endpoint}:${JSON.stringify(options.body || '')}`;

    // CRITICAL FIX: Check if an identical request is already in flight
    if (inFlightRequests.has(dedupeKey)) {
      console.log('[ApiClient.call] Reusing in-flight request:', dedupeKey);
      try {
        return await inFlightRequests.get(dedupeKey)!;
      } catch (error) {
        // If the in-flight request failed, continue with a new request
        inFlightRequests.delete(dedupeKey);
      }
    }

    // Check for duplicate requests (legacy check)
    if (requestKey && this.pendingRequests.has(requestKey)) {
      console.warn('[ApiClient.call] Duplicate request detected:', requestKey);
      return {
        success: false,
        error: {
          message: 'Request already in progress',
          code: 'DUPLICATE_REQUEST',
        },
        meta: { requestId },
      };
    }

    if (requestKey) {
      this.pendingRequests.add(requestKey);
    }

    // Check rate limit - but skip for view tracking
    const rateLimitResult = this.checkRateLimit(endpoint);
    if (!rateLimitResult.allowed) {
      this.pendingRequests.delete(requestKey || '');
      console.warn('[ApiClient.call] Rate limit exceeded');
      return {
        success: false,
        error: {
          message: `Rate limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
        },
        meta: { requestId },
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
          code: 'VALIDATION_ERROR',
        },
        meta: { requestId },
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
    const timeoutId = setTimeout(() => {
      console.warn('[ApiClient.call] Request timeout:', endpoint);
      abortController.abort();
    }, REQUEST_CONFIG.TIMEOUT);

    // CRITICAL FIX: Create the request promise and store it
    const requestPromise = (async (): Promise<ApiResponse<T>> => {
      try {
        let url: string;
        if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
          url = endpoint;
          console.log('[ApiClient.call] Using full URL:', url);
        } else if (endpoint.startsWith('/')) {
          url = buildApiUrl(endpoint);
          console.log('[ApiClient.call] Built URL from endpoint:', url);
        } else {
          console.error('[ApiClient.call] Invalid endpoint format:', endpoint);
          throw new Error('Invalid endpoint format - must start with / or be a full URL');
        }

        const token = this.getAuthToken();

        const headers: Record<string, string> = {
          ...(getDefaultHeaders() as Record<string, string>),
          ...((options.headers || {}) as Record<string, string>),
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        headers['X-Request-ID'] = requestId;

        console.log(`[ApiClient.call] Making request to: ${url}`);
        console.log(`[ApiClient.call] Method: ${options.method || 'GET'}`);

        const response = await fetch(url, {
          ...options,
          headers,
          signal: abortController.signal,
          credentials: 'same-origin',
          mode: 'cors',
          redirect: 'follow',
        });

        clearTimeout(timeoutId);

        if (requestKey) {
          this.abortControllers.delete(requestKey);
          this.pendingRequests.delete(requestKey);
        }

        this.validateResponse(response);

        let data: any;

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const text = await response.text();
          console.warn('[ApiClient.call] Non-JSON response:', text);
          return {
            success: false,
            error: { message: 'Invalid response format', code: 'INVALID_CONTENT_TYPE' },
            meta: { requestId },
          };
        }

        const elapsed = Date.now() - startTime;
        console.log(
          `[ApiClient.call] Response [${response.status}] in ${elapsed}ms:`,
          data
        );

        // >>>>>>>>>>>>>>>>>> MODIFIED BLOCK STARTS HERE <<<<<<<<<<<<<<<<<<
        if (!response.ok) {
          console.error(
            `[ApiClient.call] API Error [${response.status}]:`,
            data.error || data
          );

          const normalizedError =
            typeof data.error === 'string'
              ? { message: data.error }
              : (data.error || {
                  message: data.message || 'An error occurred',
                  code: String(response.status),
                });

          // CRITICAL FIX: Only treat 401 as "real" auth issue on protected endpoints
          if (response.status === 401) {
            if (isAuthPublicEndpoint(endpoint)) {
              console.log(
                '[ApiClient.call] 401 on auth endpoint - NOT triggering logout, returning error'
              );
              // just return the error; login/password UI will handle it
            } else {
              console.log(
                '[ApiClient.call] 401 on protected endpoint - triggering normal auth handling'
              );
              // keep your existing behavior / higher-level handlers
            }
          }

          return {
            success: false,
            error: normalizedError,
            meta: { requestId },
          };
        }
        // >>>>>>>>>>>>>>>>>> MODIFIED BLOCK ENDS HERE <<<<<<<<<<<<<<<<<<

        if (data.success !== undefined) {
          if (data.success) {
            const {
              data: nestedData,
              meta: responseMeta,
              error: _ignoredError,
              success: _ignoredSuccess,
              ...fallbackPayload
            } = data;

            const payload =
              nestedData !== undefined
                ? nestedData
                : Object.keys(fallbackPayload).length > 0
                  ? fallbackPayload
                  : undefined;

            const sanitizedData = this.sanitizeResponse<T>(payload as T);

            return {
              success: true,
              data: sanitizedData,
              meta: {
                ...(typeof responseMeta === 'object' && responseMeta !== null
                  ? responseMeta
                  : {}),
                requestId,
              },
            };
          } else {
            const normalizedError =
              typeof data.error === 'string'
                ? { message: data.error }
                : data.error || { message: 'Unknown error' };

            return {
              success: false,
              error: normalizedError,
              meta: { requestId },
            };
          }
        } else {
          const sanitizedData = this.sanitizeResponse<T>(data);
          return {
            success: true,
            data: sanitizedData,
            meta: { requestId },
          };
        }
      } catch (error) {
        clearTimeout(timeoutId);

        if (requestKey) {
          this.abortControllers.delete(requestKey);
          this.pendingRequests.delete(requestKey);
        }

        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('[ApiClient.call] Request aborted:', endpoint);
          return {
            success: false,
            error: { message: 'Request timeout or cancelled', code: 'REQUEST_ABORTED' },
            meta: { requestId },
          };
        }

        console.error('[ApiClient.call] API call error:', error);

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          return {
            success: false,
            error: {
              message: 'Network error. Please check your connection.',
              code: 'NETWORK_ERROR',
            },
            meta: { requestId },
          };
        }

        return {
          success: false,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            code: 'UNKNOWN_ERROR',
          },
          meta: { requestId },
        };
      }
    })();

    // CRITICAL FIX: Store the promise for deduplication
    inFlightRequests.set(dedupeKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // CRITICAL FIX: Clean up after request completes
      inFlightRequests.delete(dedupeKey);
    }
  }

  get<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T = any>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Legacy method name for compatibility
  request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.call<T>(endpoint, options);
  }
}

// Export singleton API client
export const apiClient = ApiClient.getInstance();

// Generic API call wrapper with security
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return apiClient.call<T>(endpoint, options);
}

// Retry utility for failed requests with exponential backoff
export async function apiCallWithRetry<T>(
  endpoint: string,
  options: RequestInit = {},
  maxRetries = REQUEST_CONFIG.RETRY_ATTEMPTS
): Promise<ApiResponse<T>> {
  let lastError: ApiError | undefined;

  for (let i = 0; i < maxRetries; i++) {
    const result = await apiCall<T>(endpoint, options);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    if (
      lastError?.code &&
      (lastError.code.startsWith('4') ||
        lastError.code === 'RATE_LIMIT_EXCEEDED' ||
        lastError.code === 'VALIDATION_ERROR' ||
        lastError.code === 'DUPLICATE_REQUEST')
    ) {
      return result;
    }

    if (i < maxRetries - 1) {
      const baseDelay = Math.min(REQUEST_CONFIG.RETRY_DELAY * Math.pow(2, i), 10000);
      const jitter = Math.random() * 0.3 * baseDelay;
      const delay = baseDelay + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError || { message: 'Max retries exceeded', code: 'MAX_RETRIES' },
  };
}

// Health check function
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await apiCall<{ status: string }>('/health', {
      method: 'GET',
    });
    return response.success && response.data?.status === 'ok';
  } catch {
    return false;
  }
}
