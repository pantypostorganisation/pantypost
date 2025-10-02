// src/context/AuthContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { apiConfig } from '@/config/environment';
import { z } from 'zod';
import { sanitizeUsername } from '@/utils/security/sanitization';

// ==================== TYPES ====================

export interface User {
  id: string;
  username: string;
  role: 'buyer' | 'seller' | 'admin';
  email?: string;
  profilePicture?: string;
  isVerified: boolean;
  tier?: 'Tease' | 'Flirt' | 'Obsession' | 'Desire' | 'Goddess';
  subscriberCount?: number;
  totalSales?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  lastActive: string;
  bio?: string;
  isBanned?: boolean;
  banReason?: string;
  banExpiresAt?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'unverified';
  verificationRequestedAt?: string;
  verificationRejectionReason?: string;
  verificationDocs?: any;
}

interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (ms)
}

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
  login: (
    username: string,
    password: string,
    role?: 'buyer' | 'seller' | 'admin'
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refreshSession: () => Promise<void>;
  getAuthToken: () => string | null;
  apiClient: ApiClient;
  token: string | null; // compatibility
}

// ==================== SCHEMAS ====================

const LoginPayloadSchema = z.object({
  username: z.string().min(1).max(60),
  password: z.string().min(1),
  role: z.enum(['buyer', 'seller', 'admin']).optional(),
});

type LoginPayload = z.infer<typeof LoginPayloadSchema>;

// ==================== HELPERS ====================

function safeNow(): number {
  try {
    return Date.now();
  } catch {
    return new Date().getTime();
  }
}

/**
 * Safely parse JSON; return null if empty/invalid.
 */
async function safeParseJson<T>(resp: Response): Promise<T | null> {
  try {
    const text = await resp.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Derive absolute expiry from `expiresIn` (seconds or ms).
 * Fallback to defaultMs when not provided.
 */
function deriveExpiry(expiresIn: unknown, defaultMs: number): number {
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
  private baseURL: string;
  private authContext: {
    getTokens: () => AuthTokens | null;
    setTokens: (tokens: AuthTokens | null) => void;
    onTokenRefresh?: () => Promise<void>;
  };
  private refreshPromise: Promise<AuthTokens | null> | null = null;

  constructor(
    baseURL: string,
    authContext: {
      getTokens: () => AuthTokens | null;
      setTokens: (tokens: AuthTokens | null) => void;
      onTokenRefresh?: () => Promise<void>;
    }
  ) {
    this.baseURL = baseURL.replace(/\/+$/, ''); // strip trailing slashes
    this.authContext = authContext;
  }

  /**
   * Build full API URL - handles both relative and absolute endpoints
   */
  private buildUrl(endpoint: string): string {
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

  private async refreshTokens(): Promise<AuthTokens | null> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const tokens = this.authContext.getTokens();
    if (!tokens?.refreshToken) {
      return null;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(this.buildUrl('/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });

        // Gracefully parse JSON (may be empty on some implementations)
        const data = await safeParseJson<any>(response);

        if (response.ok && data?.success && data?.data) {
          const expiresAt = deriveExpiry(
            // try both common fields
            data.data.expiresIn ?? data.data.tokenExpiresIn,
            30 * 60 * 1000 // fallback 30 minutes
          );

          const newTokens: AuthTokens = {
            token: data.data.token,
            refreshToken: data.data.refreshToken || tokens.refreshToken,
            expiresAt,
          };

          this.authContext.setTokens(newTokens);

          // Fire token update event for WebSocket
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('auth-token-updated', {
                detail: { token: newTokens.token },
              })
            );
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

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth-token-cleared'));
        }

        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async getValidToken(): Promise<string | null> {
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

  async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: any }> {
    const token = await this.getValidToken();

    // Create headers as a plain object first
    const headerObj: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add existing headers from options
    if (options.headers) {
      const existingHeaders =
        options.headers instanceof Headers
          ? Object.fromEntries(options.headers.entries())
          : Array.isArray(options.headers)
          ? Object.fromEntries(options.headers)
          : (options.headers as Record<string, string>);

      Object.assign(headerObj, existingHeaders);
    }

    // Add auth token if available
    if (token) {
      headerObj['Authorization'] = `Bearer ${token}`;
    }

    const url = this.buildUrl(endpoint);

    const doFetch = async () => {
      const resp = await fetch(url, { ...options, headers: headerObj });
      const json = await safeParseJson<any>(resp);

      // If server returns our standard shape, just return it as-is
      if (json && typeof json.success === 'boolean') {
        return json;
      }

      // Otherwise normalize a minimal shape
      if (resp.ok) {
        return { success: true, data: json as T };
      }
      return {
        success: false,
        error: {
          code: resp.status || 'HTTP_ERROR',
          message: json?.error?.message || resp.statusText || 'Request failed',
        },
      };
    };

    try {
      const result = await doFetch();

      // Handle 401 Unauthorized - try to refresh token once
      if (!result.success && (result as any)?.error?.code === 401 && token) {
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
          message: 'Network request failed',
        },
      };
    }
  }

  // Convenience methods
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
}

// ==================== AUTH CONTEXT ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get API base URL - FIXED for network access
const API_BASE_URL = (() => {
  // In development, detect the network IP and use it
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Use the same hostname but port 5000 for backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    // Network IP - use it directly
    return `http://${hostname}:5000`;
  }
  
  // Server-side development
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000';
  }
  
  // Production
  return apiConfig?.baseUrl || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.pantypost.com';
})();

// Enhanced Token storage with WebSocket event support
class TokenStorage {
  private memoryTokens: AuthTokens | null = null;

  constructor() {
    // Try to restore from sessionStorage on initialization
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('auth_tokens');
        if (stored) {
          this.memoryTokens = JSON.parse(stored);
          // Fire initial token event if we have tokens
          if (this.memoryTokens?.token) {
            setTimeout(() => {
              window.dispatchEvent(
                new CustomEvent('auth-token-updated', {
                  detail: { token: this.memoryTokens!.token },
                })
              );
            }, 100);
          }
        }
      } catch (error) {
        console.error('Failed to restore tokens:', error);
      }
    }
  }

  setTokens(tokens: AuthTokens | null) {
    this.memoryTokens = tokens;

    if (typeof window !== 'undefined') {
      if (tokens) {
        try {
          sessionStorage.setItem('auth_tokens', JSON.stringify(tokens));
          // Fire token update event
          window.dispatchEvent(
            new CustomEvent('auth-token-updated', {
              detail: { token: tokens.token },
            })
          );
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

  getTokens(): AuthTokens | null {
    return this.memoryTokens;
  }

  clear() {
    this.memoryTokens = null;
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth_tokens');
      // Fire token cleared event
      window.dispatchEvent(new CustomEvent('auth-token-cleared'));
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Token storage instance
  const tokenStorageRef = useRef(new TokenStorage());

  // API client instance with auth context
  const apiClientRef = useRef<ApiClient | null>(null);

  // Refresh session - fetch current user
  const refreshSession = useCallback(async () => {
    const tokens = tokenStorageRef.current.getTokens();
    if (!tokens?.token) {
      setUser(null);
      return;
    }

    try {
      const response = await apiClientRef.current!.get<User>('/auth/me');

      if (response.success && response.data) {
        // Check if user is banned
        const banCheckResponse = await apiClientRef.current!.get(
          `/users/${response.data.username}/ban-status`
        );
        
        if (banCheckResponse.success && banCheckResponse.data?.isBanned) {
          // User is banned - clear session
          console.log('[Auth] User is banned, clearing session');
          tokenStorageRef.current.clear();
          setUser(null);
          return;
        }

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
      getTokens: () => tokenStorageRef.current.getTokens(),
      setTokens: (tokens) => tokenStorageRef.current.setTokens(tokens),
      onTokenRefresh: async () => {
        // Refresh user data after token refresh
        await refreshSession();
      },
    });
  }

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get auth token
  const getAuthToken = useCallback(() => {
    const tokens = tokenStorageRef.current.getTokens();
    return tokens?.token || null;
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('[Auth] Initializing...');
      console.log('[Auth] API_BASE_URL:', API_BASE_URL);

      try {
        await refreshSession();
      } catch (error) {
        console.error('[Auth] Init error:', error);
      } finally {
        setIsAuthReady(true);
        console.log('[Auth] Ready');
      }
    };

    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // refreshSession is stable here; intentional single-run

  const login = useCallback(
    async (
      username: string,
      password: string,
      role: 'buyer' | 'seller' | 'admin' = 'buyer'
    ): Promise<boolean> => {
      console.log('[Auth] Login attempt:', { username, role, hasPassword: !!password });

      setLoading(true);
      setError(null);

      try {
        // Validate & sanitize inputs
        const parsed = LoginPayloadSchema.safeParse({ username, password, role });
        if (!parsed.success) {
          setError('Please enter a valid username and password.');
          setLoading(false);
          return false;
        }

        const cleanUsername = sanitizeUsername
          ? sanitizeUsername(parsed.data.username)
          : parsed.data.username.trim();

        const payload: LoginPayload = {
          username: cleanUsername,
          password: parsed.data.password,
          role: parsed.data.role, // optional on backend; we pass it if present
        };

        // Use the API client which handles URL construction properly
        const response = await apiClientRef.current!.post('/auth/login', payload);

        console.log('[Auth] Login response:', {
          success: response.success,
          hasUser: !!response.data?.user,
        });

        if (response.success && response.data) {
          // Check if the user is banned before completing login
          const banCheckResponse = await apiClientRef.current!.get(
            `/users/${response.data.user.username}/ban-status`
          );
          
          if (banCheckResponse.success && banCheckResponse.data?.isBanned) {
            // User is banned - don't complete login
            const banInfo = banCheckResponse.data;
            let errorMessage = 'Your account has been suspended.';
            
            if (banInfo.reason) {
              errorMessage += ` Reason: ${banInfo.reason}`;
            }
            
            if (banInfo.isPermanent) {
              errorMessage += ' This is a permanent suspension.';
            } else if (banInfo.expiresAt) {
              const expiryDate = new Date(banInfo.expiresAt).toLocaleDateString();
              errorMessage += ` Suspension expires: ${expiryDate}`;
            }
            
            setError(errorMessage);
            setLoading(false);
            return false;
          }

          // Calculate token expiration (prefer backend hints)
          const expiresAt =
            deriveExpiry(
              // try common fields the backend might send
              response.data.expiresIn ?? response.data.tokenExpiresIn,
              7 * 24 * 60 * 60 * 1000 // fallback 7 days
            );

          const tokens: AuthTokens = {
            token: response.data.token,
            refreshToken: response.data.refreshToken,
            expiresAt,
          };

          // Store tokens securely (fires auth-token-updated)
          tokenStorageRef.current.setTokens(tokens);

          // Set user state
          setUser(response.data.user);

          console.log('[Auth] Login successful');
          setLoading(false);
          return true;
        } else {
          const errorInfo = (response as any)?.error;
          let errorMessage = errorInfo?.message || 'Login failed';

          if (errorInfo?.code === 'AUTH_INVALID_CREDENTIALS') {
            const lowerMessage = errorMessage.toLowerCase();

            if (
              lowerMessage.includes("couldn't find") ||
              lowerMessage.includes('could not find') ||
              lowerMessage.includes('no account')
            ) {
              errorMessage = `We couldn't find an account with the username "${cleanUsername}". Double-check the spelling or sign up for a new account.`;
            } else if (lowerMessage.includes('password')) {
              errorMessage = 'Wrong password. Please try again or use "Forgot password" if you need help.';
            }
          }

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
    },
    []
  );

  const logout = useCallback(async () => {
    console.log('[Auth] Logging out...');

    try {
      const token = getAuthToken();
      if (token) {
        // Even if the server returns 204, our client handles it safely
        await apiClientRef.current!.post('/auth/logout');
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
  }, [getAuthToken, router]);

  // Update user function
  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user) {
        setError('No user to update');
        return;
      }

      try {
        const response = await apiClientRef.current!.patch<User>(
          `/users/${user.username}/profile`,
          updates
        );

        if (response.success && response.data) {
          setUser(response.data);
        } else {
          setError(response.error?.message || 'Failed to update user');
        }
      } catch (error: any) {
        console.error('Update user error:', error);
        setError(error.message || 'Failed to update user');
      }
    },
    [user]
  );

  const contextValue: AuthContextType = {
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
    apiClient: apiClientRef.current!,
    token: getAuthToken(), // compatibility; use getAuthToken() for up-to-date value
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export getAuthToken globally for WebSocket access
export const getGlobalAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem('auth_tokens');
    if (stored) {
      const tokens = JSON.parse(stored);
      return tokens?.token || null;
    }
  } catch (error) {
    console.error('Failed to get global auth token:', error);
  }

  return null;
};
