// src/services/api.config.ts

/**
 * API Configuration Module
 * Centralizes all API-related configuration and provides environment-based settings
 */

import { mockApiCall } from './mock/mock-api';
import { getMockConfig } from './mock/mock.config';

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// API Base URL - defaults to localStorage in development, can be overridden with env var
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Feature flags for gradual backend migration
export const FEATURES = {
  USE_API_AUTH: process.env.NEXT_PUBLIC_USE_API_AUTH === 'true',
  USE_API_LISTINGS: process.env.NEXT_PUBLIC_USE_API_LISTINGS === 'true',
  USE_API_ORDERS: process.env.NEXT_PUBLIC_USE_API_ORDERS === 'true',
  USE_API_MESSAGES: process.env.NEXT_PUBLIC_USE_API_MESSAGES === 'true',
  USE_API_WALLET: process.env.NEXT_PUBLIC_USE_API_WALLET === 'true',
  USE_API_USERS: process.env.NEXT_PUBLIC_USE_API_USERS === 'true',
  USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK_API === 'true',
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

// Request configuration
export const REQUEST_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Headers configuration
export const getDefaultHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'X-Client-Version': process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
});

// Auth token management
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// Helper to build full API URL
export const buildApiUrl = (endpoint: string, params?: Record<string, string>): string => {
  let url = endpoint;
  
  // Replace path parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, encodeURIComponent(value));
    });
  }
  
  // Only prepend base URL if we're using the API and not mocking
  if (API_BASE_URL && !FEATURES.USE_MOCK_API) {
    return `${API_BASE_URL}${url}`;
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
  };
}

// Create a more robust API client
class ApiClient {
  private static instance: ApiClient;
  private abortControllers: Map<string, AbortController> = new Map();

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
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests() {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }

  /**
   * Make an API call with abort capability
   */
  async call<T>(
    endpoint: string,
    options: RequestInit = {},
    requestKey?: string
  ): Promise<ApiResponse<T>> {
    // Use mock API if enabled
    if (FEATURES.USE_MOCK_API) {
      try {
        return await mockApiCall<T>(endpoint, options);
      } catch (error) {
        // Handle mock API errors
        if (error && typeof error === 'object' && 'response' in error) {
          const errorResponse = (error as any).response;
          return errorResponse.data;
        }
        
        return {
          success: false,
          error: {
            message: error instanceof Error ? error.message : 'Mock API error',
            code: 'MOCK_ERROR',
          },
        };
      }
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
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: abortController.signal,
      });
      
      // Remove from active requests
      if (requestKey) {
        this.abortControllers.delete(requestKey);
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || { message: 'An error occurred' },
        };
      }
      
      return {
        success: true,
        data: data.data || data,
        meta: data.meta,
      };
    } catch (error) {
      // Remove from active requests
      if (requestKey) {
        this.abortControllers.delete(requestKey);
      }

      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: { message: 'Request was cancelled' },
        };
      }

      console.error('API call error:', error);
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      };
    }
  }
}

// Export singleton API client
export const apiClient = ApiClient.getInstance();

// Generic API call wrapper (backward compatible)
export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return apiClient.call<T>(endpoint, options);
}

// Retry utility for failed requests
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
    
    // Don't retry on client errors (4xx)
    if (lastError?.code && lastError.code.startsWith('4')) {
      return result;
    }
    
    // Don't retry if using mock API
    if (FEATURES.USE_MOCK_API) {
      return result;
    }
    
    // Wait before retrying
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_CONFIG.RETRY_DELAY * (i + 1)));
    }
  }
  
  return {
    success: false,
    error: lastError || { message: 'Max retries exceeded' },
  };
}
