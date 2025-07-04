// src/services/auth.service.ts

import { User } from '@/context/AuthContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, API_BASE_URL, buildApiUrl, apiCall, ApiResponse, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from './api.config';

export interface LoginRequest {
  username: string;
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

/**
 * Authentication Service
 * Handles all auth-related operations with localStorage fallback
 */
export class AuthService {
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    // Initialize interceptor on service creation
    if (typeof window !== 'undefined') {
      this.initializeInterceptor();
      this.initializeSessionPersistence();
    }
  }

  /**
   * Initialize fetch interceptor for auth headers
   */
  private initializeInterceptor() {
    // Store original fetch
    const originalFetch = window.fetch;

    // Override fetch to add auth headers
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Get token from storage
      const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY, null);
      
      // Add auth header if token exists and this is an API call
      if (token && FEATURES.USE_API_AUTH && API_BASE_URL) {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.startsWith(API_BASE_URL)) {
          init = init || {};
          init.headers = {
            ...init.headers,
            'Authorization': `Bearer ${token}`,
          };
        }
      }

      // Make the request
      const response = await originalFetch(input, init);

      // Handle 401 responses (unauthorized)
      if (response.status === 401 && FEATURES.USE_API_AUTH) {
        // Only try to refresh if we're not already refreshing
        if (!this.isRefreshing) {
          this.isRefreshing = true;

          try {
            // Try to refresh token
            const refreshResult = await this.refreshToken();
            
            if (refreshResult.success && refreshResult.data) {
              // Store new tokens
              await storageService.setItem(AUTH_TOKEN_KEY, refreshResult.data.token);
              await storageService.setItem(REFRESH_TOKEN_KEY, refreshResult.data.refreshToken);

              // Notify all subscribers
              this.refreshSubscribers.forEach(callback => callback(refreshResult.data!.token));
              this.refreshSubscribers = [];

              // Retry original request with new token
              if (init?.headers) {
                (init.headers as any)['Authorization'] = `Bearer ${refreshResult.data.token}`;
              }
              return originalFetch(input, init);
            } else {
              // Refresh failed, logout user
              await this.logout();
              window.location.href = '/login';
            }
          } finally {
            this.isRefreshing = false;
          }
        } else {
          // Wait for token refresh to complete
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
   * Initialize session persistence
   */
  private async initializeSessionPersistence() {
    try {
      const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY, null);
      const user = await storageService.getItem<User | null>('currentUser', null);

      if (token && user && FEATURES.USE_API_AUTH) {
        // Verify token is still valid
        const result = await apiCall<User>(API_ENDPOINTS.AUTH.ME);
        
        if (result.success && result.data) {
          // Update user data with fresh data from server
          await storageService.setItem('currentUser', result.data);
          
          // Set up token refresh timer
          this.setupTokenRefreshTimer();
        } else {
          // Token invalid, clear auth state
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
    // Clear existing timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    // Refresh token 5 minutes before expiry
    // For now, we'll refresh every 25 minutes (assuming 30 min tokens)
    this.tokenRefreshTimer = setTimeout(async () => {
      const result = await this.refreshToken();
      if (result.success) {
        this.setupTokenRefreshTimer();
      }
    }, 25 * 60 * 1000); // 25 minutes
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
      if (FEATURES.USE_API_AUTH) {
        const response = await apiCall<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
          method: 'POST',
          body: JSON.stringify(request),
        });

        if (response.success && response.data) {
          // Store tokens
          if (response.data.token) {
            await storageService.setItem(AUTH_TOKEN_KEY, response.data.token);
          }
          if (response.data.refreshToken) {
            await storageService.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
          }

          // Store user
          await storageService.setItem('currentUser', response.data.user);

          // Set up token refresh
          this.setupTokenRefreshTimer();
        }

        return response;
      }

      // LocalStorage implementation
      const { username, role } = request;
      
      // Check if user exists in all_users_v2
      const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
      const existingUser = allUsers[username];

      const isAdmin = username === 'oakley' || username === 'gerome';
      
      // Create or update user
      const user: User = {
        id: existingUser?.id || `user_${Date.now()}`,
        username,
        role: isAdmin ? 'admin' : role,
        email: existingUser?.email || `${username}@example.com`,
        isVerified: existingUser?.verificationStatus === 'verified' || isAdmin,
        tier: role === 'seller' && !isAdmin ? 'Tease' : undefined,
        subscriberCount: existingUser?.subscriberCount || 0,
        totalSales: existingUser?.totalSales || 0,
        rating: existingUser?.rating || 0,
        reviewCount: existingUser?.reviewCount || 0,
        createdAt: existingUser?.createdAt || new Date().toISOString(),
        lastActive: new Date().toISOString(),
        bio: existingUser?.bio || '',
        isBanned: existingUser?.isBanned || false,
        verificationStatus: existingUser?.verificationStatus || (isAdmin ? 'verified' : 'unverified'),
        verificationRequestedAt: existingUser?.verificationRequestedAt,
        verificationRejectionReason: existingUser?.verificationRejectionReason,
        verificationDocs: existingUser?.verificationDocs,
      };

      // Update all_users_v2
      allUsers[username] = user;
      await storageService.setItem('all_users_v2', allUsers);

      // Set current user
      await storageService.setItem('currentUser', user);

      console.log('[Auth] Login successful, saved user:', { username: user.username, role: user.role });

      return {
        success: true,
        data: { user },
      };
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
      if (FEATURES.USE_API_AUTH) {
        const response = await apiCall<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, {
          method: 'POST',
          body: JSON.stringify(request),
        });

        if (response.success && response.data) {
          // Store tokens
          if (response.data.token) {
            await storageService.setItem(AUTH_TOKEN_KEY, response.data.token);
          }
          if (response.data.refreshToken) {
            await storageService.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
          }

          // Store user
          await storageService.setItem('currentUser', response.data.user);

          // Set up token refresh
          this.setupTokenRefreshTimer();
        }

        return response;
      }

      // LocalStorage implementation
      const { username, email, password, role } = request;
      
      // Check if username exists
      const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
      if (allUsers[username]) {
        return {
          success: false,
          error: {
            message: 'Username already exists',
            field: 'username',
          },
        };
      }

      // Store credentials separately (temporary - will be handled by backend)
      const credentials = await storageService.getItem<Record<string, any>>('userCredentials', {});
      credentials[username] = { email, password };
      await storageService.setItem('userCredentials', credentials);

      // Create new user
      const user: User = {
        id: `user_${Date.now()}`,
        username,
        role,
        email,
        isVerified: false,
        tier: role === 'seller' ? 'Tease' : undefined,
        subscriberCount: 0,
        totalSales: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        bio: '',
        isBanned: false,
        verificationStatus: 'unverified',
      };

      // Save to all_users_v2
      allUsers[username] = user;
      await storageService.setItem('all_users_v2', allUsers);

      // Set as current user
      await storageService.setItem('currentUser', user);

      return {
        success: true,
        data: { user },
      };
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
      if (FEATURES.USE_API_AUTH) {
        await apiCall(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
        });
      }

      // Clear auth state
      await this.clearAuthState();

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      await this.clearAuthState();
      return {
        success: false,
        error: { message: 'Logout failed' },
      };
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      if (FEATURES.USE_API_AUTH) {
        const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY, null);
        if (!token) {
          return { success: true, data: null };
        }

        return await apiCall<User>(API_ENDPOINTS.AUTH.ME);
      }

      // LocalStorage implementation
      const user = await storageService.getItem<User | null>('currentUser', null);
      
      if (user) {
        // Check if user data in all_users_v2 has been updated
        const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
        const storedUserData = allUsers[user.username];
        
        if (storedUserData) {
          // ✅ FIX: Selective merge - preserve critical auth fields
          const mergedUser = {
            // Core auth fields from current session (never override these)
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email || storedUserData.email,
            
            // Profile fields from stored data (can be updated)
            bio: storedUserData.bio !== undefined ? storedUserData.bio : user.bio,
            profilePicture: storedUserData.profilePicture || user.profilePicture,
            
            // Verification fields
            verificationStatus: storedUserData.verificationStatus || user.verificationStatus,
            isVerified: storedUserData.verificationStatus === 'verified' || user.isVerified,
            verificationRequestedAt: storedUserData.verificationRequestedAt || user.verificationRequestedAt,
            verificationRejectionReason: storedUserData.verificationRejectionReason || user.verificationRejectionReason,
            verificationDocs: storedUserData.verificationDocs || user.verificationDocs,
            
            // Seller-specific fields
            tier: storedUserData.tier || user.tier,
            subscriberCount: storedUserData.subscriberCount ?? user.subscriberCount,
            totalSales: storedUserData.totalSales ?? user.totalSales,
            rating: storedUserData.rating ?? user.rating,
            reviewCount: storedUserData.reviewCount ?? user.reviewCount,
            
            // Ban status
            isBanned: storedUserData.isBanned ?? user.isBanned,
            banReason: storedUserData.banReason || user.banReason,
            banExpiresAt: storedUserData.banExpiresAt || user.banExpiresAt,
            
            // Timestamps
            createdAt: user.createdAt || storedUserData.createdAt,
            lastActive: new Date().toISOString(),
          };
          
          // Only update if there are actual changes
          if (JSON.stringify(user) !== JSON.stringify(mergedUser)) {
            await storageService.setItem('currentUser', mergedUser);
          }
          
          return {
            success: true,
            data: mergedUser,
          };
        }
      }

      return {
        success: true,
        data: user,
      };
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
      const updatedUser = {
        ...currentUser,
        ...updates,
        lastActive: new Date().toISOString(),
      };

      if (FEATURES.USE_API_AUTH) {
        return await apiCall<User>(
          buildApiUrl(API_ENDPOINTS.USERS.UPDATE_PROFILE, { username: currentUser.username }),
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          }
        );
      }

      // LocalStorage implementation
      // Update currentUser
      await storageService.setItem('currentUser', updatedUser);

      // Also update in all_users_v2
      const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
      allUsers[currentUser.username] = updatedUser;
      await storageService.setItem('all_users_v2', allUsers);

      return {
        success: true,
        data: updatedUser,
      };
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
      if (FEATURES.USE_API_AUTH) {
        return await apiCall<UsernameCheckResponse>(
          `${API_ENDPOINTS.AUTH.VERIFY_USERNAME}?username=${encodeURIComponent(username)}`
        );
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
      const available = !allUsers[username.toLowerCase()];

      return {
        success: true,
        data: {
          available,
          message: available ? 'Username is available' : 'Username is already taken',
        },
      };
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
      if (FEATURES.USE_API_AUTH) {
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
          // Store new tokens
          await storageService.setItem(AUTH_TOKEN_KEY, response.data.token);
          await storageService.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
        }

        return response;
      }

      // LocalStorage doesn't need token refresh
      return {
        success: true,
        data: { token: 'mock_token', refreshToken: 'mock_refresh_token' },
      };
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
    if (FEATURES.USE_API_AUTH) {
      const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY, null);
      return !!token;
    }

    const user = await storageService.getItem<User | null>('currentUser', null);
    return !!user;
  }

  /**
   * Get stored auth token
   */
  async getAuthToken(): Promise<string | null> {
    return storageService.getItem<string | null>(AUTH_TOKEN_KEY, null);
  }
}

// Export singleton instance
export const authService = new AuthService();