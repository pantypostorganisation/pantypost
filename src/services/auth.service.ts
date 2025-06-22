// src/services/auth.service.ts

import { User } from '@/context/AuthContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';

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
  /**
   * Login user
   */
  async login(request: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      if (FEATURES.USE_API_AUTH) {
        return await apiCall<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
          method: 'POST',
          body: JSON.stringify(request),
        });
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
        return await apiCall<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, {
          method: 'POST',
          body: JSON.stringify(request),
        });
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

      // Clear current user
      await storageService.removeItem('currentUser');
      await storageService.removeItem('auth_token');
      await storageService.removeItem('refresh_token');

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
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
        return await apiCall<User>(API_ENDPOINTS.AUTH.ME);
      }

      // LocalStorage implementation
      const user = await storageService.getItem<User | null>('currentUser', null);
      
      if (user) {
        // Check if user data in all_users_v2 has been updated
        const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
        const storedUserData = allUsers[user.username];
        
        if (storedUserData) {
          // Merge any updates from all_users_v2
          const mergedUser = {
            ...user,
            ...storedUserData,
            lastActive: new Date().toISOString(),
          };
          
          // Update currentUser if there were changes
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
        const refreshToken = await storageService.getItem<string | null>('refresh_token', null);
        if (!refreshToken) {
          return {
            success: false,
            error: { message: 'No refresh token available' },
          };
        }

        return await apiCall<{ token: string; refreshToken: string }>(
          API_ENDPOINTS.AUTH.REFRESH,
          {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          }
        );
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
}

// Export singleton instance
export const authService = new AuthService();