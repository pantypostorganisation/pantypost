// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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
  expiresAt: number; // Unix timestamp
}

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
  login: (username: string, password: string, role?: 'buyer' | 'seller' | 'admin') => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refreshSession: () => Promise<void>;
  getAuthToken: () => string | null;
  apiClient: ApiClient;
}

// ==================== API CLIENT ====================

class ApiClient {
  private baseURL: string;
  private authContext: { getTokens: () => AuthTokens | null; setTokens: (tokens: AuthTokens | null) => void; onTokenRefresh?: () => Promise<void> };
  private refreshPromise: Promise<AuthTokens | null> | null = null;

  constructor(
    baseURL: string, 
    authContext: { 
      getTokens: () => AuthTokens | null; 
      setTokens: (tokens: AuthTokens | null) => void;
      onTokenRefresh?: () => Promise<void>;
    }
  ) {
    this.baseURL = baseURL;
    this.authContext = authContext;
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
        const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Failed to refresh token');
        }

        const data = await response.json();
        if (data.success && data.data) {
          const newTokens: AuthTokens = {
            token: data.data.token,
            refreshToken: data.data.refreshToken,
            expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
          };
          
          this.authContext.setTokens(newTokens);
          
          // Call the refresh callback if provided
          if (this.authContext.onTokenRefresh) {
            await this.authContext.onTokenRefresh();
          }
          
          return newTokens;
        }
        
        throw new Error('Invalid refresh response');
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Clear tokens on refresh failure
        this.authContext.setTokens(null);
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
    const isExpiringSoon = tokens.expiresAt <= Date.now() + (5 * 60 * 1000);
    
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
      const existingHeaders = options.headers instanceof Headers 
        ? Object.fromEntries(options.headers.entries())
        : Array.isArray(options.headers)
        ? Object.fromEntries(options.headers)
        : options.headers as Record<string, string>;
      
      Object.assign(headerObj, existingHeaders);
    }

    // Add auth token if available
    if (token) {
      headerObj['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: headerObj,
      });

      const data = await response.json();

      // Handle 401 Unauthorized - try to refresh token once
      if (response.status === 401 && token) {
        const newTokens = await this.refreshTokens();
        if (newTokens) {
          // Retry request with new token
          headerObj['Authorization'] = `Bearer ${newTokens.token}`;
          const retryResponse = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: headerObj,
          });
          return await retryResponse.json();
        }
      }

      return data;
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

// Use the base URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Secure token storage using memory + sessionStorage
class TokenStorage {
  private memoryTokens: AuthTokens | null = null;

  constructor() {
    // Try to restore from sessionStorage on initialization
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('auth_tokens');
        if (stored) {
          this.memoryTokens = JSON.parse(stored);
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
        } catch (error) {
          console.error('Failed to store tokens:', error);
        }
      } else {
        sessionStorage.removeItem('auth_tokens');
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

  // Refresh session - fetch current user
  const refreshSession = useCallback(async () => {
    const tokens = tokenStorageRef.current.getTokens();
    if (!tokens?.token) {
      setUser(null);
      return;
    }

    try {
      const response = await apiClientRef.current!.get<User>('/api/auth/me');
      
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
        // Clear tokens if user fetch fails
        tokenStorageRef.current.clear();
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setUser(null);
      tokenStorageRef.current.clear();
    }
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
  }, [refreshSession]);

  // Login function
  const login = useCallback(async (
    username: string, 
    password: string,
    role: 'buyer' | 'seller' | 'admin' = 'buyer'
  ): Promise<boolean> => {
    console.log('[Auth] Login attempt:', { username, role, hasPassword: !!password });
    console.log('[Auth] API endpoint:', `${API_BASE_URL}/api/auth/login`);
    
    setLoading(true);
    setError(null);

    try {
      console.log('[Auth] Making login request...');
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();
      console.log('[Auth] Login response:', { 
        status: response.status, 
        success: data.success, 
        hasUser: !!data.data?.user 
      });

      if (data.success && data.data) {
        // Calculate token expiration (30 minutes from now)
        const tokens: AuthTokens = {
          token: data.data.token,
          refreshToken: data.data.refreshToken,
          expiresAt: Date.now() + (30 * 60 * 1000),
        };
        
        // Store tokens securely
        tokenStorageRef.current.setTokens(tokens);
        
        // Set user state
        setUser(data.data.user);
        
        console.log('[Auth] Login successful');
        setLoading(false);
        return true;
      } else {
        // Extract error message from backend response
        const errorMessage = data.error?.message || 'Login failed';
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

  // Logout function
  const logout = useCallback(async () => {
    console.log('[Auth] Logging out...');
    
    try {
      const token = getAuthToken();
      if (token) {
        // Call logout endpoint
        await apiClientRef.current!.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('[Auth] Logout API error:', error);
    }

    // Clear local state regardless of API response
    tokenStorageRef.current.clear();
    setUser(null);
    setError(null);
    
    // Redirect to login page
    router.push('/login');
    
    console.log('[Auth] Logout complete');
  }, [getAuthToken, router]);

  // Update user function
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      setError('No user to update');
      return;
    }

    try {
      const response = await apiClientRef.current!.patch<User>(
        `/api/users/${user.username}`,
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
  }, [user]);

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
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}