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
  emailVerified?: boolean;
  emailVerifiedAt?: string;
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
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
  login: (
    username: string,
    password: string,
    role?: 'buyer' | 'seller' | 'admin',
    rememberMe?: boolean
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
  token: string | null;
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

async function safeParseJson<T>(resp: Response): Promise<T | null> {
  try {
    const text = await resp.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function deriveExpiry(expiresIn: unknown, defaultMs: number): number {
  const now = safeNow();
  if (typeof expiresIn === 'number' && Number.isFinite(expiresIn)) {
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
    this.baseURL = baseURL.replace(/\/+$/, '');
    this.authContext = authContext;
  }

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    if (this.baseURL.endsWith('/api')) {
      return `${this.baseURL}${path}`;
    }

    return `${this.baseURL}/api${path}`;
  }

  private async refreshTokens(): Promise<AuthTokens | null> {
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

        const data = await safeParseJson<any>(response);

        if (response.ok && data?.success && data?.data) {
          const expiresAt = deriveExpiry(
            data.data.expiresIn ?? data.data.tokenExpiresIn,
            30 * 60 * 1000
          );

          const newTokens: AuthTokens = {
            token: data.data.token,
            refreshToken: data.data.refreshToken || tokens.refreshToken,
            expiresAt,
          };

          this.authContext.setTokens(newTokens);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('auth-token-updated', {
                detail: { token: newTokens.token },
              })
            );
          }

          if (this.authContext.onTokenRefresh) {
            await this.authContext.onTokenRefresh();
          }

          return newTokens;
        }

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
    // CRITICAL FIX: Don't try to get token for login/signup endpoints
    const isAuthEndpoint = endpoint.includes('/auth/login') || 
                          endpoint.includes('/auth/signup') ||
                          endpoint.includes('/auth/forgot-password');
    
    const token = isAuthEndpoint ? null : await this.getValidToken();

    const headerObj: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      const existingHeaders =
        options.headers instanceof Headers
          ? Object.fromEntries(options.headers.entries())
          : Array.isArray(options.headers)
          ? Object.fromEntries(options.headers)
          : (options.headers as Record<string, string>);

      Object.assign(headerObj, existingHeaders);
    }

    if (token) {
      headerObj['Authorization'] = `Bearer ${token}`;
    }

    const url = this.buildUrl(endpoint);

    const doFetch = async () => {
      const resp = await fetch(url, { ...options, headers: headerObj });
      const json = await safeParseJson<any>(resp);

      if (json && typeof json.success === 'boolean') {
        return json;
      }

      if (resp.ok) {
        return { success: true, data: json as T };
      }
      
      // CRITICAL FIX: Properly handle error responses
      return {
        success: false,
        error: {
          code: json?.error?.code || resp.status || 'HTTP_ERROR',
          message: json?.error?.message || json?.message || resp.statusText || 'Request failed',
          ...json?.error, // Include any additional error fields
        },
      };
    };

    try {
      const result = await doFetch();

      // CRITICAL FIX: Don't try to refresh token on login endpoint failures
      if (!result.success && !isAuthEndpoint && (result as any)?.error?.code === 401 && token) {
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

const API_BASE_URL =
  apiConfig?.baseUrl || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const AUTH_TOKENS_STORAGE_KEY = 'auth_tokens';

class TokenStorage {
  private memoryTokens: AuthTokens | null = null;
  private persistence: 'session' | 'local' = 'session';

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const sessionValue = window.sessionStorage.getItem(AUTH_TOKENS_STORAGE_KEY);
        const localValue = !sessionValue
          ? window.localStorage?.getItem(AUTH_TOKENS_STORAGE_KEY) ?? null
          : null;

        const stored = sessionValue ?? localValue;

        if (stored) {
          this.memoryTokens = JSON.parse(stored);
          this.persistence = sessionValue ? 'session' : 'local';

          if (!sessionValue && localValue) {
            window.sessionStorage.setItem(AUTH_TOKENS_STORAGE_KEY, localValue);
          }

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

  setPersistence(remember: boolean) {
    this.persistence = remember ? 'local' : 'session';
  }

  setTokens(tokens: AuthTokens | null) {
    this.memoryTokens = tokens;

    if (typeof window !== 'undefined') {
      try {
        if (tokens) {
          const serialized = JSON.stringify(tokens);
          window.sessionStorage.setItem(AUTH_TOKENS_STORAGE_KEY, serialized);

          if (this.persistence === 'local') {
            window.localStorage?.setItem(AUTH_TOKENS_STORAGE_KEY, serialized);
          } else {
            window.localStorage?.removeItem(AUTH_TOKENS_STORAGE_KEY);
          }

          window.dispatchEvent(
            new CustomEvent('auth-token-updated', {
              detail: { token: tokens.token },
            })
          );
        } else {
          window.sessionStorage.removeItem(AUTH_TOKENS_STORAGE_KEY);
          window.localStorage?.removeItem(AUTH_TOKENS_STORAGE_KEY);
          window.dispatchEvent(new CustomEvent('auth-token-cleared'));
        }
      } catch (error) {
        console.error('Failed to store tokens:', error);
      }
    }
  }

  getTokens(): AuthTokens | null {
    return this.memoryTokens;
  }

  clear() {
    this.memoryTokens = null;
    this.persistence = 'session';
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem(AUTH_TOKENS_STORAGE_KEY);
        window.localStorage?.removeItem(AUTH_TOKENS_STORAGE_KEY);
      } catch (error) {
        console.error('Failed to clear tokens:', error);
      }
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

  const tokenStorageRef = useRef(new TokenStorage());
  const apiClientRef = useRef<ApiClient | null>(null);

  const refreshSession = useCallback(async () => {
    const tokens = tokenStorageRef.current.getTokens();
    if (!tokens?.token) {
      setUser(null);
      return;
    }

    try {
      const response = await apiClientRef.current!.get<User>('/auth/me');

      if (response.success && response.data) {
        const banCheckResponse = await apiClientRef.current!.get(
          `/users/${response.data.username}/ban-status`
        );
        
        if (banCheckResponse.success && banCheckResponse.data?.isBanned) {
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

  if (!apiClientRef.current) {
    apiClientRef.current = new ApiClient(API_BASE_URL, {
      getTokens: () => tokenStorageRef.current.getTokens(),
      setTokens: (tokens) => tokenStorageRef.current.setTokens(tokens),
      onTokenRefresh: async () => {
        await refreshSession();
      },
    });
  }

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getAuthToken = useCallback(() => {
    const tokens = tokenStorageRef.current.getTokens();
    return tokens?.token || null;
  }, []);

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
  }, [refreshSession]);

  const login = useCallback(
    async (
      username: string,
      password: string,
      role: 'buyer' | 'seller' | 'admin' = 'buyer',
      rememberMe = false
    ): Promise<boolean> => {
      console.log('[Auth] Login attempt:', { username, role, hasPassword: !!password });

      setLoading(true);
      setError(null);

      try {
        const parsed = LoginPayloadSchema.safeParse({ username, password, role });
        if (!parsed.success) {
          const errorMessage = 'Please enter a valid username and password.';
          console.log('[Auth] Validation failed:', errorMessage);
          setError(errorMessage);
          setLoading(false);
          return false;
        }

        const cleanUsername = sanitizeUsername
          ? sanitizeUsername(parsed.data.username)
          : parsed.data.username.trim();

        const payload: LoginPayload = {
          username: cleanUsername,
          password: parsed.data.password,
          role: parsed.data.role,
        };

        console.log('[Auth] Calling API with payload:', { username: cleanUsername, role });
        const response = await apiClientRef.current!.post('/auth/login', payload);

        console.log('[Auth] Login response:', {
          success: response.success,
          hasUser: !!response.data?.user,
          hasError: !!response.error,
          errorCode: response.error?.code,
          errorMessage: response.error?.message,
        });

        if (response.success && response.data) {
          const banCheckResponse = await apiClientRef.current!.get(
            `/users/${response.data.user.username}/ban-status`
          );
          
          if (banCheckResponse.success && banCheckResponse.data?.isBanned) {
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
            
            console.log('[Auth] User is banned:', errorMessage);
            setError(errorMessage);
            setLoading(false);
            return false;
          }

          const expiresAt = deriveExpiry(
            response.data.expiresIn ?? response.data.tokenExpiresIn,
            31 * 24 * 60 * 60 * 1000
          );

          const tokens: AuthTokens = {
            token: response.data.token,
            refreshToken: response.data.refreshToken,
            expiresAt,
          };

          tokenStorageRef.current.setPersistence(rememberMe);
          tokenStorageRef.current.setTokens(tokens);
          setUser(response.data.user);

          try {
            await refreshSession();
          } catch (refreshError) {
            console.error('[Auth] Failed to hydrate user after login:', refreshError);
          }

          console.log('[Auth] Login successful');
          setLoading(false);
          return true;
        } else {
          // CRITICAL FIX: Handle all error cases properly
          const errorObj = response.error || (response as any);
          
          console.log('[Auth] Login failed, error object:', errorObj);
          
          // Check for email verification requirement
          if (errorObj.code === 'EMAIL_VERIFICATION_REQUIRED' || errorObj.requiresVerification) {
            console.log('[Auth] Email verification required - throwing error for redirect');
            setLoading(false);
            
            const verificationError: any = new Error('EMAIL_VERIFICATION_REQUIRED');
            verificationError.requiresVerification = true;
            verificationError.email = errorObj.email;
            verificationError.username = errorObj.username;
            verificationError.message = ''; // Empty message for silent redirect
            
            throw verificationError;
          } 
          
          // Check for password reset pending
          if (errorObj.code === 'PASSWORD_RESET_PENDING' || errorObj.pendingPasswordReset) {
            console.log('[Auth] Password reset pending - throwing error for redirect');
            setLoading(false);
            
            const resetError: any = new Error(errorObj.message || 'Password reset pending');
            resetError.pendingPasswordReset = true;
            resetError.email = errorObj.email;
            resetError.username = errorObj.username;
            resetError.message = errorObj.message || 'A password reset is pending for this account.';
            
            throw resetError;
          }
          
          // CRITICAL FIX: Extract the actual error message from the error object
          let errorMessage: string;
          
          if (typeof errorObj === 'string') {
            errorMessage = errorObj;
          } else if (errorObj.message) {
            errorMessage = errorObj.message;
          } else if (errorObj.error && typeof errorObj.error === 'string') {
            errorMessage = errorObj.error;
          } else if (errorObj.error && errorObj.error.message) {
            errorMessage = errorObj.error.message;
          } else {
            errorMessage = 'Login failed. Please check your credentials and try again.';
          }
          
          console.log('[Auth] Setting error message:', errorMessage);
          
          setError(errorMessage);
          setLoading(false);
          return false;
        }
      } catch (error: any) {
        console.error('[Auth] Login error:', error);
        
        // If this is an email verification error, re-throw it for redirect
        if (error.requiresVerification) {
          setLoading(false);
          throw error;
        }
        
        // If this is a password reset error, re-throw it for redirect
        if (error.pendingPasswordReset) {
          setLoading(false);
          throw error;
        }
        
        // CRITICAL FIX: For all other errors, set error message and stop loading
        const errorMessage = error?.message || 'Network error. Please check your connection and try again.';
        console.log('[Auth] Caught error, setting error message:', errorMessage);
        
        setError(errorMessage);
        setLoading(false);
        return false;
      }
    },
    [refreshSession]
  );

  const logout = useCallback(async () => {
    console.log('[Auth] Logging out...');

    try {
      const token = getAuthToken();
      if (token) {
        await apiClientRef.current!.post('/auth/logout');
      }
    } catch (error) {
      console.error('[Auth] Logout API error:', error);
    }

    tokenStorageRef.current.clear();
    setUser(null);
    setError(null);
    router.push('/login');

    console.log('[Auth] Logout complete');
  }, [getAuthToken, router]);

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
    token: getAuthToken(),
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

export const getGlobalAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(AUTH_TOKENS_STORAGE_KEY);
    if (stored) {
      const tokens = JSON.parse(stored);
      return tokens?.token || null;
    }
  } catch (error) {
    console.error('Failed to get global auth token:', error);
  }

  try {
    const stored = localStorage.getItem(AUTH_TOKENS_STORAGE_KEY);
    if (stored) {
      const tokens = JSON.parse(stored);
      return tokens?.token || null;
    }
  } catch (error) {
    console.error('Failed to get global auth token from localStorage:', error);
  }

  return null;
};
