// src/services/api.config.ts

/**
 * API Configuration Module
 * Centralizes all API-related configuration and provides environment-based settings
 */

import { apiConfig, appConfig, securityConfig, isDevelopment } from '@/config/environment';
import { securityService } from './security.service';
import { sanitizeUrl, sanitizeStrict } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

// Re-export from environment config for backward compatibility
export { isDevelopment };
export const isProduction = !isDevelopment();

// Use environment configuration
export const API_BASE_URL = apiConfig.baseUrl;
export const FEATURES = {
  USE_API_AUTH: apiConfig.features.useAuth,
  USE_API_LISTINGS: apiConfig.features.useListings,
  USE_API_ORDERS: apiConfig.features.useOrders,
  USE_API_MESSAGES: apiConfig.features.useMessages,
  USE_API_WALLET: apiConfig.features.useWallet,
  USE_API_USERS: apiConfig.features.useUsers,
  USE_MOCK_API: false, // Always false - no mocks!
};

// API Endpoints
export const API_ENDPOINTS = {
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
  },
  
  // Wallet endpoints
  WALLET: {
    BALANCE: '/wallet/balance/:username',
    DEPOSIT: '/wallet/deposit',
    WITHDRAW: '/wallet/withdraw',
    TRANSACTIONS: '/wallet/transactions/:username',
    ADMIN_ACTIONS: '/wallet/admin-actions',
  },
  
  // Subscription endpoints
  SUBSCRIPTIONS: {
    LIST: '/subscriptions/:username',
    SUBSCRIBE: '/subscriptions/subscribe',
    UNSUBSCRIBE: '/subscriptions/unsubscribe',
    CHECK: '/subscriptions/check',
  },
  
  // Custom request endpoints
  REQUESTS: {
    LIST: '/requests',
    CREATE: '/requests',
    UPDATE: '/requests/:id',
    RESPOND: '/requests/:id/respond',
    BY_USER: '/requests/user/:username',
  },
};

// Request configuration from environment
export const REQUEST_CONFIG = {
  TIMEOUT: apiConfig.timeout,
  RETRY_ATTEMPTS: apiConfig.retryAttempts,
  RETRY_DELAY: 1000, // 1 second
  MAX_REQUEST_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_URL_LENGTH: 2048, // Maximum URL length
  MAX_HEADER_SIZE: 8192, // Maximum header size
};

// Headers configuration with version from environment
export const getDefaultHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Client-Version': sanitizeStrict(appConfig.version),
    'X-App-Name': sanitizeStrict(appConfig.name),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'X-Request-ID': generateRequestId(),
  };

  // Add CSRF token if available
  const csrfToken = securityService.generateCSRFToken();
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return headers;
};

// Auth token management
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// Helper to build full API URL with validation
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = endpoint;
  
  // Validate and sanitize path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      // Validate parameter key
      const sanitizedKey = sanitizeStrict(key);
      if (sanitizedKey !== key) {
        throw new Error(`Invalid parameter key: ${key}`);
      }
      
      // Sanitize parameter value
      const sanitizedValue = encodeURIComponent(sanitizeStrict(String(value).trim()));
      
      // Check for path traversal attempts
      if (sanitizedValue.includes('..') || sanitizedValue.includes('//')) {
        throw new Error(`Invalid parameter value: ${value}`);
      }
      
      url = url.replace(`:${key}`, sanitizedValue);
    });
  }
  
  // Check if all parameters were replaced
  if (url.includes(':')) {
    throw new Error('Missing required URL parameters');
  }
  
  // Always use real API URL
  if (API_BASE_URL) {
    const fullUrl = `${API_BASE_URL}${url}`;
    const sanitizedUrl = sanitizeUrl(fullUrl);
    
    if (!sanitizedUrl) {
      throw new Error('Invalid API URL');
    }
    
    // Check URL length
    if (sanitizedUrl.length > REQUEST_CONFIG.MAX_URL_LENGTH) {
      throw new Error('URL too long');
    }
    
    return sanitizedUrl;
  }
  
  return url;
};

// Error response type
export interface ApiError {
  message: string;
  code?: string;
  field?: string;
  details?: any;
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
  };
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create a more robust API client with security
class ApiClient {
  private static instance: ApiClient;
  private abortControllers: Map<string, AbortController> = new Map();
  private requestCount: number = 0;
  private requestWindowStart: number = Date.now();
  private rateLimiter = getRateLimiter();
  private pendingRequests: Set<string> = new Set();

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
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    this.pendingRequests.clear();
  }

  /**
   * Check rate limit
   */
  private checkRateLimit(): { allowed: boolean; waitTime?: number } {
    if (!securityConfig.enableRateLimiting) return { allowed: true };

    // Use rate limiter service
    const result = this.rateLimiter.check('API_CALL', RATE_LIMITS.API_CALL);
    return result;
  }

  /**
   * Validate request options
   */
  private validateRequestOptions(options: RequestInit): void {
    // Validate request method
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
    if (options.method && !allowedMethods.includes(options.method.toUpperCase())) {
      throw new Error('Invalid request method');
    }

    // Validate request body size
    if (options.body) {
      const bodySize = typeof options.body === 'string' 
        ? new Blob([options.body]).size 
        : 0;
      
      if (bodySize > REQUEST_CONFIG.MAX_REQUEST_SIZE) {
        throw new Error('Request body too large');
      }
      
      // Validate JSON structure if content type is JSON
      if (typeof options.body === 'string' && 
          options.headers && 
          (options.headers as any)['Content-Type'] === 'application/json') {
        try {
          JSON.parse(options.body);
        } catch {
          throw new Error('Invalid JSON in request body');
        }
      }
    }

    // Validate headers
    if (options.headers) {
      const headers = options.headers as Record<string, string>;
      let totalHeaderSize = 0;
      
      Object.entries(headers).forEach(([key, value]) => {
        // Prevent header injection
        if (key.includes('\n') || key.includes('\r') || 
            value.includes('\n') || value.includes('\r')) {
          throw new Error('Invalid header format');
        }
        
        // Check header size
        totalHeaderSize += key.length + value.length + 4; // +4 for ': ' and '\r\n'
        
        // Validate header names
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
    // Basic sanitization for common attack vectors
    if (typeof data === 'string') {
      // Check for potential XSS in string responses
      const sanitized = securityService.sanitizeForDisplay(data, {
        allowHtml: false,
        allowMarkdown: false,
      });
      return sanitized as unknown as T;
    }
    
    if (typeof data === 'object' && data !== null) {
      // Sanitize object responses
      return securityService.sanitizeForAPI(data) as T;
    }
    
    return data;
  }

  /**
   * Validate response
   */
  private validateResponse(response: Response): void {
    // Check for suspicious response headers
    const suspiciousHeaders = ['X-Powered-By', 'Server'];
    suspiciousHeaders.forEach(header => {
      if (response.headers.has(header)) {
        console.warn(`Suspicious header detected: ${header}`);
      }
    });
    
    // Validate content type
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html') && !response.url.includes('.html')) {
      console.warn('Unexpected HTML response');
    }
  }

  /**
   * Make an API call with abort capability and security
   */
  async call<T>(
    endpoint: string,
    options: RequestInit = {},
    requestKey?: string
  ): Promise<ApiResponse<T>> {
    const requestId = generateRequestId();
    const startTime = Date.now();
    
    // Check for duplicate requests
    if (requestKey && this.pendingRequests.has(requestKey)) {
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

    // Check rate limit
    const rateLimitResult = this.checkRateLimit();
    if (!rateLimitResult.allowed) {
      this.pendingRequests.delete(requestKey || '');
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
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Invalid request',
          code: 'VALIDATION_ERROR',
        },
        meta: { requestId },
      };
    }

    // NO MORE MOCK API - Always use real API
    
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
      abortController.abort();
    }, REQUEST_CONFIG.TIMEOUT);

    try {
      const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
      const token = typeof window !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
      
      const headers: Record<string, string> = {
        ...getDefaultHeaders() as Record<string, string>,
        ...(options.headers || {}) as Record<string, string>,
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Add request ID to headers
      headers['X-Request-ID'] = requestId;
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: abortController.signal,
        credentials: 'same-origin', // Prevent CSRF
        mode: 'cors', // Enable CORS
        redirect: 'follow', // Follow redirects but limit
      });
      
      clearTimeout(timeoutId);
      
      // Remove from active requests
      if (requestKey) {
        this.abortControllers.delete(requestKey);
        this.pendingRequests.delete(requestKey);
      }
      
      // Validate response
      this.validateResponse(response);
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          success: false,
          error: { message: 'Invalid response format', code: 'INVALID_CONTENT_TYPE' },
          meta: { requestId },
        };
      }
      
      // Check response size
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > REQUEST_CONFIG.MAX_REQUEST_SIZE) {
        return {
          success: false,
          error: { message: 'Response too large', code: 'RESPONSE_TOO_LARGE' },
          meta: { requestId },
        };
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        // Log error for monitoring
        console.error(`API Error [${response.status}]:`, data.error || data);
        
        return {
          success: false,
          error: data.error || { message: 'An error occurred', code: String(response.status) },
          meta: { requestId },
        };
      }
      
      // Sanitize response data
      const sanitizedData = this.sanitizeResponse<T>(data.data || data);
      
      // Log successful request (in production, send to monitoring)
      if (isDevelopment()) {
        console.log(`API Success [${Date.now() - startTime}ms]:`, endpoint);
      }
      
      return {
        success: true,
        data: sanitizedData,
        meta: {
          ...data.meta,
          requestId,
        },
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Remove from active requests
      if (requestKey) {
        this.abortControllers.delete(requestKey);
        this.pendingRequests.delete(requestKey);
      }

      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: { message: 'Request timeout or cancelled', code: 'REQUEST_ABORTED' },
          meta: { requestId },
        };
      }

      console.error('API call error:', error);
      
      // Check for network errors
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
    
    // Don't retry on client errors (4xx), rate limits, or validation errors
    if (lastError?.code && 
        (lastError.code.startsWith('4') || 
         lastError.code === 'RATE_LIMIT_EXCEEDED' ||
         lastError.code === 'VALIDATION_ERROR' ||
         lastError.code === 'DUPLICATE_REQUEST')) {
      return result;
    }
    
    // Exponential backoff with jitter
    if (i < maxRetries - 1) {
      const baseDelay = Math.min(REQUEST_CONFIG.RETRY_DELAY * Math.pow(2, i), 10000);
      const jitter = Math.random() * 0.3 * baseDelay; // 30% jitter
      const delay = baseDelay + jitter;
      await new Promise(resolve => setTimeout(resolve, delay));
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
