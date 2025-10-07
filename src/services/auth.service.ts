// src/services/auth.service.ts

import { User } from '@/context/AuthContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, API_BASE_URL, buildApiUrl, apiCall, ApiResponse, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from './api.config';

export interface LoginRequest {
  username: string;
  password?: string;
  role: 'buyer' | 'seller' | 'admin';
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  role: 'buyer' | 'seller';
}

export interface SignupResponse {
  message: string;
  email: string;
  username: string;
  requiresVerification: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  refreshToken?: string;
}

export interface UsernameCheckResponse {
  available: boolean;
  message?: string;
}

export interface PasswordResetResponse {
  message: string;
  email?: string;
  expiresIn?: number;
}

export interface EmailVerificationResponse {
  message: string;
  user?: User;
  token?: string;
  refreshToken?: string;
}

/**
 * Authentication Service - API Only with Email Verification
 */
export class AuthService {
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private readonly TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeInterceptor();
      this.initializeSessionPersistence();
    }
  }

  /**
   * Initialize fetch interceptor for auth headers
   */
  private initializeInterceptor() {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const token = await this.getValidToken();
      
      if (token && API_BASE_URL) {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.startsWith(API_BASE_URL)) {
          init = init || {};
          init.headers = {
            ...init.headers,
            'Authorization': `Bearer ${token}`,
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
              this.refreshSubscribers.forEach(callback => callback(refreshResult.data!.token));
              this.refreshSubscribers = [];

              if (init?.headers) {
                (init.headers as any)['Authorization'] = `Bearer ${refreshResult.data.token}`;
              }
              return originalFetch(input, init);
            } else {
              await this.logout();
              window.location.href = '/login';
            }
          } finally {
            this.isRefreshing = false;
          }
        } else {
          return new Promise((resolve) => {
            this.refreshSubscribers.push((token: string) => {
              if (init?.headers) {
                (init.headers as any)['Authorization'] = `Bearer ${token}`;
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
   * Get valid token from storage - FIXED to use sessionStorage directly
   */
  private async getValidToken(): Promise<string | null> {
    // CRITICAL FIX: Read directly from sessionStorage to avoid circular dependency
    if (typeof window === 'undefined') return null;
    
    try {
      // Try sessionStorage first (where AuthContext stores tokens)
      const authTokens = sessionStorage.getItem('auth_tokens');
      if (authTokens) {
        const parsed = JSON.parse(authTokens);
        return parsed.token || null;
      }
      
      // Fallback to direct token
      return sessionStorage.getItem(AUTH_TOKEN_KEY) || 
             localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  /**
   * Store tokens securely - FIXED to use sessionStorage directly
   */
  private async storeTokens(token: string, refreshToken?: string): Promise<void> {
    console.log('[AuthService] Storing tokens...');
    
    if (typeof window === 'undefined') return;
    
    try {
      // CRITICAL FIX: Store directly in sessionStorage (where AuthContext reads from)
      const tokens = {
        token,
        refreshToken: refreshToken || token,
        expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };
      
      sessionStorage.setItem('auth_tokens', JSON.stringify(tokens));
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      
      if (refreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      
      console.log('[AuthService] Tokens stored successfully');
      
      // Fire token update event for WebSocket and AuthContext
      window.dispatchEvent(
        new CustomEvent('auth-token-updated', {
          detail: { token },
        })
      );
    } catch (error) {
      console.error('[AuthService] Failed to store tokens:', error);
    }
  }

  /**
   * Initialize session persistence
   */
  private async initializeSessionPersistence() {
    try {
      const token = await this.getValidToken();
      
      if (token) {
        // Verify token is still valid
        const result = await apiCall<User>(API_ENDPOINTS.AUTH.ME);
        
        if (result.success && result.data) {
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
   */
  private setupTokenRefreshTimer() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    this.tokenRefreshTimer = setTimeout(async () => {
      const result = await this.refreshToken();
      if (result.success) {
        this.setupTokenRefreshTimer();
      }
    }, this.TOKEN_REFRESH_INTERVAL);
  }

  /**
   * Clear authentication state
   */
  private async clearAuthState() {
    if (typeof window === 'undefined') return;
    
    sessionStorage.removeItem('auth_tokens');
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('currentUser');
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
    
    // Fire token cleared event
    window.dispatchEvent(new CustomEvent('auth-token-cleared'));
  }

  /**
   * Login user - UPDATED to check email verification
   */
  async login(request: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiCall<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        body: JSON.stringify({
          username: request.username,
          password: request.password,
          role: request.role,
        }),
      });

      if (response.success && response.data) {
        if (response.data.token) {
          await this.storeTokens(response.data.token, response.data.refreshToken);
        }

        // Store user data
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('currentUser', JSON.stringify(response.data.user));
        }
        
        this.setupTokenRefreshTimer();
      } else if (response.error && (response.error as any).requiresVerification) {
        // Email verification required
        return {
          success: false,
          error: {
            ...response.error,
            code: 'EMAIL_VERIFICATION_REQUIRED',
          },
        };
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: {
          message: 'Login failed. Please try again.',
        },
      };
    }
  }

  /**
   * Sign up new user - UPDATED to handle email verification flow
   */
  async signup(request: SignupRequest): Promise<ApiResponse<SignupResponse>> {
    try {
      const response = await apiCall<SignupResponse>(API_ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      // Don't auto-login on signup anymore since email verification is required
      // Just return the response which includes requiresVerification flag
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: {
          message: 'Signup failed. Please try again.',
        },
      };
    }
  }

  /**
   * Verify email with token or code - FIXED with proper token storage
   */
  async verifyEmail(tokenOrCode: string, isCode: boolean = false): Promise<ApiResponse<EmailVerificationResponse>> {
    try {
      const payload = isCode ? { code: tokenOrCode } : { token: tokenOrCode };
      
      console.log('[AuthService] Verifying email with:', isCode ? 'code' : 'token');
      
      const response = await apiCall<EmailVerificationResponse>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      console.log('[AuthService] Verification response:', response);

      if (response.success && response.data) {
        // CRITICAL FIX: Store token and user IMMEDIATELY after verification
        if (response.data.token) {
          console.log('[AuthService] Storing verification token...');
          await this.storeTokens(response.data.token, response.data.refreshToken);
        }

        // Store user if provided
        if (response.data.user) {
          console.log('[AuthService] Storing user data...');
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('currentUser', JSON.stringify(response.data.user));
          }
          this.setupTokenRefreshTimer();
        }
        
        console.log('[AuthService] Email verification complete - user should be logged in');
      }

      return response;
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        success: false,
        error: {
          message: 'Email verification failed. Please try again.',
        },
      };
    }
  }

  /**
   * Resend verification email - NEW METHOD
   */
  async resendVerificationEmail(emailOrUsername: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const payload = emailOrUsername.includes('@') 
        ? { email: emailOrUsername }
        : { username: emailOrUsername };
      
      return await apiCall<{ message: string }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      return {
        success: false,
        error: {
          message: 'Failed to resend verification email. Please try again.',
        },
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      await apiCall(API_ENDPOINTS.AUTH.LOGOUT, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }

    await this.clearAuthState();
    return { success: true };
  }

  /**
   * Get current authenticated user - UPDATED to include email verification status
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const token = await this.getValidToken();
      if (!token) {
        return { success: true, data: null };
      }

      const response = await apiCall<User>(API_ENDPOINTS.AUTH.ME);
      if (response.success && response.data) {
        // Store user data
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('currentUser', JSON.stringify(response.data));
        }
        return response;
      }

      return { success: true, data: null };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: { message: 'Failed to get current user' },
      };
    }
  }

  /**
   * Update current user
   */
  async updateCurrentUser(updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const currentUserResult = await this.getCurrentUser();
      if (!currentUserResult.success || !currentUserResult.data) {
        return {
          success: false,
          error: { message: 'No user to update' },
        };
      }

      const currentUser = currentUserResult.data;
      
      const response = await apiCall<User>(
        buildApiUrl(API_ENDPOINTS.USERS.UPDATE_PROFILE, { username: currentUser.username }),
        {
          method: 'PATCH',
          body: JSON.stringify(updates),
        }
      );

      if (response.success && response.data) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('currentUser', JSON.stringify(response.data));
        }
      }

      return response;
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        error: { message: 'Failed to update user' },
      };
    }
  }

  /**
   * Check if username is available
   */
  async checkUsername(username: string): Promise<ApiResponse<UsernameCheckResponse>> {
    try {
      return await apiCall<UsernameCheckResponse>(
        `${API_ENDPOINTS.AUTH.VERIFY_USERNAME}?username=${encodeURIComponent(username)}`
      );
    } catch (error) {
      console.error('Check username error:', error);
      return {
        success: false,
        error: { message: 'Failed to check username availability' },
      };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    try {
      const refreshToken = await this.getValidToken();
      if (!refreshToken) {
        return {
          success: false,
          error: { message: 'No refresh token available' },
        };
      }

      const response = await apiCall<{ token: string; refreshToken: string }>(
        API_ENDPOINTS.AUTH.REFRESH,
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (response.success && response.data) {
        await this.storeTokens(response.data.token, response.data.refreshToken);
      }

      return response;
    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        error: { message: 'Failed to refresh token' },
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getValidToken();
    return !!token;
  }

  /**
   * Get stored auth token
   */
  async getAuthToken(): Promise<string | null> {
    return this.getValidToken();
  }

  /**
   * Request password reset - accepts email OR username
   */
  async forgotPassword(emailOrUsername: string): Promise<ApiResponse<PasswordResetResponse>> {
    try {
      return await apiCall<PasswordResetResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ emailOrUsername }),
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: {
          message: 'Failed to process password reset request. Please try again.',
        },
      };
    }
  }

  /**
   * Verify reset code
   */
  async verifyResetCode(email: string, code: string): Promise<ApiResponse<{ valid: boolean; message: string; token?: string }>> {
    try {
      return await apiCall<{ valid: boolean; message: string; token?: string }>(
        '/auth/verify-reset-code',
        {
          method: 'POST',
          body: JSON.stringify({ email, code }),
        }
      );
    } catch (error) {
      console.error('Verify reset code error:', error);
      return {
        success: false,
        error: {
          message: 'Failed to verify code. Please try again.',
        },
      };
    }
  }

  /**
   * Reset password with code
   */
  async resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse<PasswordResetResponse>> {
    try {
      return await apiCall<PasswordResetResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({
          email,
          code,
          newPassword,
        }),
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: {
          message: 'Failed to reset password. Please try again.',
        },
      };
    }
  }
}

// Export singleton instance
export const authService = new AuthService();