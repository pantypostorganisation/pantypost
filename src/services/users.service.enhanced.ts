// src/services/users.service.enhanced.ts

import { User } from '@/context/AuthContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse, apiClient } from './api.config';
import { 
  UserProfile, 
  UserPreferences,
  UserSearchParams,
  VerificationRequest,
  VerificationUpdateRequest,
  BanRequest,
  BatchUserUpdate,
  BatchOperationResult,
  CachedUser,
  CachedUserProfile,
  UserError,
  UserErrorCode,
  UsersResponse,
  ProfileResponse,
  SubscriptionInfo,
  UserActivity,
  isValidUsername,
  isValidBio,
  isValidSubscriptionPrice,
  calculateProfileCompleteness,
  ProfileCompleteness,
} from '@/types/users';

// Cache configuration
const CACHE_CONFIG = {
  USER_TTL: 5 * 60 * 1000, // 5 minutes
  PROFILE_TTL: 3 * 60 * 1000, // 3 minutes
  LIST_TTL: 60 * 1000, // 1 minute
};

/**
 * Enhanced Users Service with caching, validation, and better error handling
 */
export class EnhancedUsersService {
  // In-memory caches
  private userCache = new Map<string, CachedUser>();
  private profileCache = new Map<string, CachedUserProfile>();
  private listCache = new Map<string, { data: any; expiresAt: number }>();
  
  // Request deduplication
  private pendingRequests = new Map<string, Promise<any>>();

  // Clear cache methods
  private clearUserCache(username?: string) {
    if (username) {
      this.userCache.delete(username);
      this.profileCache.delete(username);
    } else {
      this.userCache.clear();
      this.profileCache.clear();
    }
    this.listCache.clear();
  }

  /**
   * Get user with caching and deduplication
   */
  async getUser(username: string): Promise<ApiResponse<User | null>> {
    try {
      // Validate username
      if (!isValidUsername(username)) {
        return {
          success: false,
          error: {
            code: UserErrorCode.INVALID_USERNAME,
            message: 'Invalid username format',
            field: 'username',
          },
        };
      }

      // Check cache first
      const cached = this.userCache.get(username);
      if (cached && cached.expiresAt > Date.now()) {
        return { success: true, data: cached.data };
      }

      // Check for pending request
      const pendingKey = `user:${username}`;
      if (this.pendingRequests.has(pendingKey)) {
        return await this.pendingRequests.get(pendingKey);
      }

      // Create new request
      const request = this._fetchUser(username);
      this.pendingRequests.set(pendingKey, request);

      try {
        const result = await request;
        this.pendingRequests.delete(pendingKey);
        return result;
      } catch (error) {
        this.pendingRequests.delete(pendingKey);
        throw error;
      }
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        error: {
          code: UserErrorCode.NETWORK_ERROR,
          message: 'Failed to get user',
        },
      };
    }
  }

  private async _fetchUser(username: string): Promise<ApiResponse<User | null>> {
    if (FEATURES.USE_API_USERS) {
      const response = await apiCall<User>(
        buildApiUrl(API_ENDPOINTS.USERS.PROFILE, { username })
      );
      
      if (response.success && response.data) {
        // Cache the result
        this.userCache.set(username, {
          data: response.data,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_CONFIG.USER_TTL,
        });
      }
      
      return response;
    }

    // LocalStorage implementation
    const allUsers = await storageService.getItem<Record<string, any>>(
      'all_users_v2',
      {}
    );

    const user = allUsers[username] || null;
    
    if (user) {
      // Cache the result
      this.userCache.set(username, {
        data: user,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_CONFIG.USER_TTL,
      });
    }

    return { success: true, data: user };
  }

  /**
   * Get users with advanced filtering and caching
   */
  async getUsers(params?: UserSearchParams): Promise<ApiResponse<UsersResponse>> {
    try {
      // Create cache key from params
      const cacheKey = `users:${JSON.stringify(params || {})}`;
      const cached = this.listCache.get(cacheKey);
      
      if (cached && cached.expiresAt > Date.now()) {
        return { success: true, data: cached.data };
      }

      if (FEATURES.USE_API_USERS) {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
              queryParams.append(key, String(value));
            }
          });
        }
        
        const response = await apiCall<UsersResponse>(
          `${API_ENDPOINTS.USERS.LIST}?${queryParams.toString()}`
        );
        
        if (response.success && response.data) {
          // Cache the result
          this.listCache.set(cacheKey, {
            data: response.data,
            expiresAt: Date.now() + CACHE_CONFIG.LIST_TTL,
          });
        }
        
        return response;
      }

      // LocalStorage implementation with advanced filtering
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      let filteredUsers = Object.entries(allUsers);

      // Apply filters
      if (params) {
        if (params.query) {
          const query = params.query.toLowerCase();
          filteredUsers = filteredUsers.filter(([username, user]) =>
            username.toLowerCase().includes(query) ||
            user.bio?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query)
          );
        }

        if (params.role) {
          filteredUsers = filteredUsers.filter(([_, user]) => user.role === params.role);
        }

        if (params.verified !== undefined) {
          filteredUsers = filteredUsers.filter(
            ([_, user]) => (user.verificationStatus === 'verified') === params.verified
          );
        }

        if (params.tier) {
          filteredUsers = filteredUsers.filter(([_, user]) => user.tier === params.tier);
        }

        if (params.minRating !== undefined) {
          filteredUsers = filteredUsers.filter(
            ([_, user]) => (user.rating || 0) >= params.minRating!
          );
        }

        if (params.hasListings !== undefined) {
          // This would need to check listings data
          // For now, we'll skip this filter in localStorage mode
        }

        if (params.isActive !== undefined) {
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 1);
          filteredUsers = filteredUsers.filter(
            ([_, user]) => {
              const lastActive = new Date(user.lastActive || user.createdAt);
              return params.isActive ? lastActive > dayAgo : lastActive <= dayAgo;
            }
          );
        }

        // Apply sorting
        if (params.sortBy) {
          filteredUsers.sort(([aUsername, a], [bUsername, b]) => {
            let compareValue = 0;
            
            switch (params.sortBy) {
              case 'username':
                compareValue = aUsername.localeCompare(bUsername);
                break;
              case 'joinDate':
                compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
              case 'rating':
                compareValue = (a.rating || 0) - (b.rating || 0);
                break;
              case 'sales':
                compareValue = (a.totalSales || 0) - (b.totalSales || 0);
                break;
              case 'lastActive':
                compareValue = new Date(a.lastActive || a.createdAt).getTime() - 
                               new Date(b.lastActive || b.createdAt).getTime();
                break;
            }
            
            return params.sortOrder === 'desc' ? -compareValue : compareValue;
          });
        }
      }

      // Apply pagination
      const page = params?.page || 1;
      const limit = params?.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      const users = paginatedUsers.map(([_, user]) => user);

      const result: UsersResponse = {
        users,
        total: filteredUsers.length,
        page,
        totalPages: Math.ceil(filteredUsers.length / limit),
      };

      // Cache the result
      this.listCache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + CACHE_CONFIG.LIST_TTL,
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        error: {
          code: UserErrorCode.NETWORK_ERROR,
          message: 'Failed to get users',
        },
      };
    }
  }

  /**
   * Get user profile with caching and validation
   */
  async getUserProfile(username: string): Promise<ApiResponse<ProfileResponse | null>> {
    try {
      // Validate username
      if (!isValidUsername(username)) {
        return {
          success: false,
          error: {
            code: UserErrorCode.INVALID_USERNAME,
            message: 'Invalid username format',
            field: 'username',
          },
        };
      }

      // Check cache
      const cached = this.profileCache.get(username);
      if (cached && cached.expiresAt > Date.now()) {
        const userResult = await this.getUser(username);
        if (userResult.success && userResult.data) {
          return {
            success: true,
            data: {
              profile: cached.data,
              user: userResult.data,
            },
          };
        }
      }

      if (FEATURES.USE_API_USERS) {
        const response = await apiCall<ProfileResponse>(
          `${buildApiUrl(API_ENDPOINTS.USERS.PROFILE, { username })}/full`
        );
        
        if (response.success && response.data) {
          // Cache the profile
          this.profileCache.set(username, {
            data: response.data.profile,
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL,
          });
        }
        
        return response;
      }

      // LocalStorage implementation
      const userResult = await this.getUser(username);
      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: {
            code: UserErrorCode.USER_NOT_FOUND,
            message: 'User not found',
          },
        };
      }

      const profilesData = await storageService.getItem<Record<string, UserProfile>>(
        'user_profiles',
        {}
      );

      let profile = profilesData[username];
      
      if (!profile) {
        // Try legacy storage
        const bio = sessionStorage.getItem(`profile_bio_${username}`) || '';
        const profilePic = sessionStorage.getItem(`profile_pic_${username}`) || null;
        const subscriptionPrice = sessionStorage.getItem(`subscription_price_${username}`) || '0';
        const galleryData = localStorage.getItem(`profile_gallery_${username}`);
        const galleryImages = galleryData ? JSON.parse(galleryData) : [];

        profile = {
          bio,
          profilePic,
          subscriptionPrice,
          galleryImages,
        };
      }

      // Calculate profile completeness
      const completeness = calculateProfileCompleteness(userResult.data, profile);
      profile.completeness = completeness;

      // Cache the profile
      if (profile) {
        this.profileCache.set(username, {
          data: profile,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL,
        });
      }

      return {
        success: true,
        data: {
          profile,
          user: userResult.data,
        },
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: {
          code: UserErrorCode.NETWORK_ERROR,
          message: 'Failed to get user profile',
        },
      };
    }
  }

  /**
   * Update user profile with validation and optimistic updates
   */
  async updateUserProfile(
    username: string,
    updates: Partial<UserProfile>
  ): Promise<ApiResponse<UserProfile>> {
    try {
      // Validate inputs
      if (!isValidUsername(username)) {
        return {
          success: false,
          error: {
            code: UserErrorCode.INVALID_USERNAME,
            message: 'Invalid username format',
            field: 'username',
          },
        };
      }

      if (updates.bio !== undefined && !isValidBio(updates.bio)) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: 'Bio is too long (max 500 characters)',
            field: 'bio',
          },
        };
      }

      if (updates.subscriptionPrice !== undefined && !isValidSubscriptionPrice(updates.subscriptionPrice)) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: 'Invalid subscription price',
            field: 'subscriptionPrice',
          },
        };
      }

      // Optimistic update - update cache immediately
      const currentProfile = this.profileCache.get(username);
      if (currentProfile) {
        const optimisticProfile = { ...currentProfile.data, ...updates };
        this.profileCache.set(username, {
          data: optimisticProfile,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL,
        });
      }

      if (FEATURES.USE_API_USERS) {
        const response = await apiCall<UserProfile>(
          buildApiUrl(API_ENDPOINTS.USERS.UPDATE_PROFILE, { username }),
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          }
        );
        
        if (!response.success) {
          // Revert optimistic update
          if (currentProfile) {
            this.profileCache.set(username, currentProfile);
          } else {
            this.profileCache.delete(username);
          }
        } else if (response.data) {
          // Update cache with server response
          this.profileCache.set(username, {
            data: response.data,
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL,
          });
        }
        
        return response;
      }

      // LocalStorage implementation
      const profilesData = await storageService.getItem<Record<string, UserProfile>>(
        'user_profiles',
        {}
      );

      const currentData = profilesData[username] || {
        bio: '',
        profilePic: null,
        subscriptionPrice: '0',
      };

      const updatedProfile: UserProfile = {
        ...currentData,
        ...updates,
        lastUpdated: new Date().toISOString(),
      };

      profilesData[username] = updatedProfile;
      const success = await storageService.setItem('user_profiles', profilesData);

      if (success) {
        // Update legacy storage for backward compatibility
        if (updates.bio !== undefined) {
          sessionStorage.setItem(`profile_bio_${username}`, updates.bio);
        }
        if (updates.profilePic !== undefined) {
          if (updates.profilePic) {
            sessionStorage.setItem(`profile_pic_${username}`, updates.profilePic);
          } else {
            sessionStorage.removeItem(`profile_pic_${username}`);
          }
        }
        if (updates.subscriptionPrice !== undefined) {
          sessionStorage.setItem(`subscription_price_${username}`, updates.subscriptionPrice);
        }
        if (updates.galleryImages !== undefined) {
          localStorage.setItem(`profile_gallery_${username}`, JSON.stringify(updates.galleryImages));
        }

        // Update user bio in all_users_v2 if needed
        if (updates.bio !== undefined) {
          const allUsers = await storageService.getItem<Record<string, any>>(
            'all_users_v2',
            {}
          );
          if (allUsers[username]) {
            allUsers[username].bio = updates.bio;
            await storageService.setItem('all_users_v2', allUsers);
            // Clear user cache
            this.userCache.delete(username);
          }
        }

        // Update cache
        this.profileCache.set(username, {
          data: updatedProfile,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL,
        });

        return { success: true, data: updatedProfile };
      } else {
        // Revert optimistic update
        if (currentProfile) {
          this.profileCache.set(username, currentProfile);
        } else {
          this.profileCache.delete(username);
        }

        return {
          success: false,
          error: {
            code: UserErrorCode.PROFILE_UPDATE_FAILED,
            message: 'Failed to update profile',
          },
        };
      }
    } catch (error) {
      console.error('Update user profile error:', error);
      
      // Revert optimistic update on error
      this.profileCache.delete(username);
      
      return {
        success: false,
        error: {
          code: UserErrorCode.NETWORK_ERROR,
          message: 'Failed to update profile',
        },
      };
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(username: string): Promise<ApiResponse<UserPreferences>> {
    try {
      if (FEATURES.USE_API_USERS) {
        return await apiCall<UserPreferences>(
          `${buildApiUrl(API_ENDPOINTS.USERS.SETTINGS, { username })}/preferences`
        );
      }

      // LocalStorage implementation
      const preferencesData = await storageService.getItem<Record<string, UserPreferences>>(
        'user_preferences',
        {}
      );

      const defaultPreferences: UserPreferences = {
        notifications: {
          messages: true,
          orders: true,
          promotions: false,
          newsletters: false,
        },
        privacy: {
          showOnlineStatus: true,
          allowDirectMessages: true,
          profileVisibility: 'public',
        },
        language: 'en',
        currency: 'USD',
        timezone: 'UTC',
      };

      const preferences = preferencesData[username] || defaultPreferences;

      return { success: true, data: preferences };
    } catch (error) {
      console.error('Get user preferences error:', error);
      return {
        success: false,
        error: {
          code: UserErrorCode.NETWORK_ERROR,
          message: 'Failed to get preferences',
        },
      };
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(
    username: string,
    updates: Partial<UserPreferences>
  ): Promise<ApiResponse<UserPreferences>> {
    try {
      if (FEATURES.USE_API_USERS) {
        return await apiCall<UserPreferences>(
          `${buildApiUrl(API_ENDPOINTS.USERS.SETTINGS, { username })}/preferences`,
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          }
        );
      }

      // LocalStorage implementation
      const preferencesData = await storageService.getItem<Record<string, UserPreferences>>(
        'user_preferences',
        {}
      );

      const currentPreferences = preferencesData[username] || {
        notifications: {
          messages: true,
          orders: true,
          promotions: false,
          newsletters: false,
        },
        privacy: {
          showOnlineStatus: true,
          allowDirectMessages: true,
          profileVisibility: 'public' as const,
        },
        language: 'en',
        currency: 'USD',
        timezone: 'UTC',
      };

      const updatedPreferences: UserPreferences = {
        ...currentPreferences,
        ...updates,
        notifications: {
          ...currentPreferences.notifications,
          ...(updates.notifications || {}),
        },
        privacy: {
          ...currentPreferences.privacy,
          ...(updates.privacy || {}),
        },
      };

      preferencesData[username] = updatedPreferences;
      await storageService.setItem('user_preferences', preferencesData);

      return { success: true, data: updatedPreferences };
    } catch (error) {
      console.error('Update user preferences error:', error);
      return {
        success: false,
        error: {
          code: UserErrorCode.NETWORK_ERROR,
          message: 'Failed to update preferences',
        },
      };
    }
  }

  /**
   * Track user activity
   */
  async trackActivity(activity: Omit<UserActivity, 'id' | 'timestamp'>): Promise<ApiResponse<void>> {
    try {
      if (FEATURES.USE_API_USERS) {
        return await apiCall<void>('/users/activity', {
          method: 'POST',
          body: JSON.stringify(activity),
        });
      }

      // LocalStorage implementation
      const activities = await storageService.getItem<UserActivity[]>('user_activities', []);
      
      const newActivity: UserActivity = {
        ...activity,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };

      activities.push(newActivity);
      
      // Keep only last 1000 activities
      if (activities.length > 1000) {
        activities.splice(0, activities.length - 1000);
      }

      await storageService.setItem('user_activities', activities);

      return { success: true };
    } catch (error) {
      console.error('Track activity error:', error);
      // Don't return error for activity tracking failures
      return { success: true };
    }
  }

  /**
   * Get user activity history
   */
  async getUserActivity(
    username: string,
    limit: number = 50
  ): Promise<ApiResponse<UserActivity[]>> {
    try {
      if (FEATURES.USE_API_USERS) {
        return await apiCall<UserActivity[]>(
          `${buildApiUrl(API_ENDPOINTS.USERS.PROFILE, { username })}/activity?limit=${limit}`
        );
      }

      // LocalStorage implementation
      const activities = await storageService.getItem<UserActivity[]>('user_activities', []);
      
      const userActivities = activities
        .filter(activity => activity.userId === username)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return { success: true, data: userActivities };
    } catch (error) {
      console.error('Get user activity error:', error);
      return {
        success: false,
        error: {
          code: UserErrorCode.NETWORK_ERROR,
          message: 'Failed to get activity history',
        },
      };
    }
  }

  /**
   * Batch update users (admin only)
   */
  async batchUpdateUsers(
    updates: BatchUserUpdate[]
  ): Promise<ApiResponse<BatchOperationResult>> {
    try {
      if (FEATURES.USE_API_USERS) {
        return await apiCall<BatchOperationResult>('/users/batch-update', {
          method: 'POST',
          body: JSON.stringify({ updates }),
        });
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      const result: BatchOperationResult = {
        succeeded: [],
        failed: [],
      };

      for (const update of updates) {
        try {
          if (allUsers[update.username]) {
            allUsers[update.username] = {
              ...allUsers[update.username],
              ...update.updates,
            };
            result.succeeded.push(update.username);
            // Clear cache for updated user
            this.clearUserCache(update.username);
          } else {
            result.failed.push({
              username: update.username,
              error: 'User not found',
            });
          }
        } catch (error) {
          result.failed.push({
            username: update.username,
            error: error instanceof Error ? error.message : 'Update failed',
          });
        }
      }

      if (result.succeeded.length > 0) {
        await storageService.setItem('all_users_v2', allUsers);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('Batch update users error:', error);
      return {
        success: false,
        error: {
          code: UserErrorCode.NETWORK_ERROR,
          message: 'Failed to batch update users',
        },
      };
    }
  }

  /**
   * Request verification with file validation
   */
  async requestVerification(
    username: string,
    docs: VerificationRequest
  ): Promise<ApiResponse<void>> {
    try {
      // Validate required documents
      if (!docs.codePhoto || !docs.code) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: 'Code photo and verification code are required',
          },
        };
      }

      if (!docs.idFront && !docs.passport) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: 'Either ID front or passport is required',
          },
        };
      }

      if (FEATURES.USE_API_USERS) {
        return await apiCall<void>(
          buildApiUrl(API_ENDPOINTS.USERS.VERIFICATION, { username }),
          {
            method: 'POST',
            body: JSON.stringify(docs),
          }
        );
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      if (allUsers[username]) {
        allUsers[username].verificationStatus = 'pending';
        allUsers[username].verificationRequestedAt = new Date().toISOString();
        allUsers[username].verificationDocs = docs;
        await storageService.setItem('all_users_v2', allUsers);
        
        // Clear user cache
        this.userCache.delete(username);
      }

      // Store verification request
      const verificationRequests = await storageService.getItem<Record<string, any>>(
        'panty_verification_requests',
        {}
      );
      
      verificationRequests[username] = {
        ...docs,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      };
      
      await storageService.setItem('panty_verification_requests', verificationRequests);

      // Track activity
      await this.trackActivity({
        userId: username,
        type: 'profile_update',
        details: { action: 'verification_requested' },
      });

      return { success: true };
    } catch (error) {
      console.error('Request verification error:', error);
      return {
        success: false,
        error: {
          code: UserErrorCode.VERIFICATION_FAILED,
          message: 'Failed to request verification',
        },
      };
    }
  }

  /**
   * Get subscription status with caching
   */
  async getSubscriptionStatus(
    buyer: string,
    seller: string
  ): Promise<ApiResponse<SubscriptionInfo | null>> {
    try {
      const cacheKey = `sub:${buyer}:${seller}`;
      const cached = this.listCache.get(cacheKey);
      
      if (cached && cached.expiresAt > Date.now()) {
        return { success: true, data: cached.data };
      }

      if (FEATURES.USE_API_USERS) {
        const response = await apiCall<SubscriptionInfo>(
          `${API_ENDPOINTS.SUBSCRIPTIONS.CHECK}?buyer=${buyer}&seller=${seller}`
        );
        
        if (response.success && response.data) {
          this.listCache.set(cacheKey, {
            data: response.data,
            expiresAt: Date.now() + CACHE_CONFIG.LIST_TTL,
          });
        }
        
        return response;
      }

      // LocalStorage implementation
      const subscriptions = await storageService.getItem<Record<string, SubscriptionInfo[]>>(
        'user_subscriptions',
        {}
      );

      const buyerSubs = subscriptions[buyer] || [];
      const subscription = buyerSubs.find(sub => sub.seller === seller);

      if (subscription) {
        this.listCache.set(cacheKey, {
          data: subscription,
          expiresAt: Date.now() + CACHE_CONFIG.LIST_TTL,
        });
      }

      return {
        success: true,
        data: subscription || null,
      };
    } catch (error) {
      console.error('Get subscription status error:', error);
      return {
        success: false,
        error: {
          code: UserErrorCode.NETWORK_ERROR,
          message: 'Failed to get subscription status',
        },
      };
    }
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.userCache.clear();
    this.profileCache.clear();
    this.listCache.clear();
  }
}

// Export enhanced singleton instance
export const enhancedUsersService = new EnhancedUsersService();