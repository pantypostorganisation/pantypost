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
}

/**
 * Authentication Service - API Only
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
   * Get valid token from storage
   */
  private async getValidToken(): Promise<string | null> {
    const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY, null);
    return token;
  }

  /**
   * Store tokens securely
   */
  private async storeTokens(token: string, refreshToken?: string): Promise<void> {
    await storageService.setItem(AUTH_TOKEN_KEY, token);
    
    if (refreshToken) {
      await storageService.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * Initialize session persistence
   */
  private async initializeSessionPersistence() {
    try {
      const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY, null);
      const user = await storageService.getItem<User | null>('currentUser', null);

      if (token && user) {
        const result = await apiCall<User>(API_ENDPOINTS.AUTH.ME);
        
        if (result.success && result.data) {
          await storageService.setItem('currentUser', result.data);
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
    await storageService.removeItem('currentUser');
    await storageService.removeItem(AUTH_TOKEN_KEY);
    await storageService.removeItem(REFRESH_TOKEN_KEY);
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  /**
   * Login user
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

        await storageService.setItem('currentUser', response.data.user);
        this.setupTokenRefreshTimer();
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
   * Sign up new user
   */
  async signup(request: SignupRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiCall<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (response.success && response.data) {
        if (response.data.token) {
          await this.storeTokens(response.data.token, response.data.refreshToken);
        }

        await storageService.setItem('currentUser', response.data.user);
        this.setupTokenRefreshTimer();
      }

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
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      const user = await storageService.getItem<User | null>('currentUser', null);
      
      if (!user) {
        return { success: true, data: null };
      }

      const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY, null);
      if (!token) {
        return { success: true, data: null };
      }

      const response = await apiCall<User>(API_ENDPOINTS.AUTH.ME);
      if (response.success && response.data) {
        await storageService.setItem('currentUser', response.data);
        return response;
      }

      return { success: true, data: user };
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
        await storageService.setItem('currentUser', response.data);
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
      const refreshToken = await storageService.getItem<string | null>(REFRESH_TOKEN_KEY, null);
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
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ApiResponse<PasswordResetResponse>> {
    try {
      return await apiCall<PasswordResetResponse>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ email }),
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
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<PasswordResetResponse>> {
    try {
      return await apiCall<PasswordResetResponse>(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({
          token,
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