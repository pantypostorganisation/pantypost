// src/services/users.service.enhanced.ts

import { User } from '@/context/AuthContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse, apiClient } from './api.config';
import { securityService } from './security.service';
import { sanitizeStrict, sanitizeUsername, sanitizeUrl, sanitizeEmail } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { z } from 'zod';
import { authSchemas, profileSchemas, validateSchema } from '@/utils/validation/schemas';
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

// Security limits
const SECURITY_LIMITS = {
  MAX_BATCH_SIZE: 100,
  MAX_QUERY_LENGTH: 100,
  MAX_PAGE_SIZE: 100,
  MAX_ACTIVITY_HISTORY: 1000,
  MAX_GALLERY_IMAGES: 20,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
};

// Validation schemas
const userSearchSchema = z.object({
  query: z.string().max(SECURITY_LIMITS.MAX_QUERY_LENGTH).transform(sanitizeStrict).optional(),
  role: z.enum(['buyer', 'seller', 'admin']).optional(),
  verified: z.boolean().optional(),
  tier: z.enum(['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess']).optional(),
  minRating: z.number().min(0).max(5).optional(),
  hasListings: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['username', 'joinDate', 'rating', 'sales', 'lastActive']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(SECURITY_LIMITS.MAX_PAGE_SIZE).optional(),
});

const userProfileUpdateSchema = z.object({
  bio: z.string().max(500).transform(sanitizeStrict).optional(),
  profilePic: z.string().url().nullable().optional(),
  subscriptionPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  galleryImages: z.array(z.string().url()).max(SECURITY_LIMITS.MAX_GALLERY_IMAGES).optional(),
  socialLinks: z.object({
    twitter: z.string().url().transform(sanitizeUrl).optional(),
    instagram: z.string().url().transform(sanitizeUrl).optional(),
    tiktok: z.string().url().transform(sanitizeUrl).optional(),
    website: z.string().url().transform(sanitizeUrl).optional(),
  }).optional(),
});

const userPreferencesSchema = z.object({
  notifications: z.object({
    messages: z.boolean(),
    orders: z.boolean(),
    promotions: z.boolean(),
    newsletters: z.boolean(),
  }).partial(),
  privacy: z.object({
    showOnlineStatus: z.boolean(),
    allowDirectMessages: z.boolean(),
    profileVisibility: z.enum(['public', 'subscribers', 'private']),
  }).partial(),
  language: z.string().max(10),
  currency: z.string().max(10),
  timezone: z.string().max(50),
}).partial();

const verificationRequestSchema = z.object({
  codePhoto: z.string().url().optional(),
  idFront: z.string().url().optional(),
  idBack: z.string().url().optional(),
  passport: z.string().url().optional(),
  code: z.string().max(20).transform(sanitizeStrict).optional(),
  submittedAt: z.string().datetime().optional(),
});

const activitySchema = z.object({
  userId: z.string().transform(sanitizeUsername),
  type: z.enum(['login', 'profile_update', 'listing_created', 'order_placed', 'message_sent']),
  details: z.record(z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

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
  
  // Rate limiter
  private rateLimiter = getRateLimiter();

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

      // Sanitize username
      const sanitizedUsername = sanitizeUsername(username);

      // Check cache first
      const cached = this.userCache.get(sanitizedUsername);
      if (cached && cached.expiresAt > Date.now()) {
        return { success: true, data: cached.data };
      }

      // Check for pending request
      const pendingKey = `user:${sanitizedUsername}`;
      if (this.pendingRequests.has(pendingKey)) {
        return await this.pendingRequests.get(pendingKey);
      }

      // Create new request
      const request = this._fetchUser(sanitizedUsername);
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
        // Sanitize user data
        const sanitizedUser = this.sanitizeUserData(response.data);
        
        // Cache the result
        this.userCache.set(username, {
          data: sanitizedUser,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_CONFIG.USER_TTL,
        });
        
        return { ...response, data: sanitizedUser };
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
      // Sanitize user data
      const sanitizedUser = this.sanitizeUserData(user);
      
      // Cache the result
      this.userCache.set(username, {
        data: sanitizedUser,
        timestamp: Date.now(),
        expiresAt: Date.now() + CACHE_CONFIG.USER_TTL,
      });
      
      return { success: true, data: sanitizedUser };
    }

    return { success: true, data: null };
  }

  /**
   * Get users with advanced filtering and caching
   */
  async getUsers(params?: UserSearchParams): Promise<ApiResponse<UsersResponse>> {
    try {
      // Validate and sanitize params
      let validatedParams: UserSearchParams | undefined;
      if (params) {
        const validation = validateSchema(userSearchSchema, params);
        if (!validation.success) {
          return {
            success: false,
            error: {
              code: UserErrorCode.VALIDATION_ERROR,
              message: 'Invalid search parameters',
            },
          };
        }
        validatedParams = validation.data;
      }

      // Create cache key from params
      const cacheKey = `users:${JSON.stringify(validatedParams || {})}`;
      const cached = this.listCache.get(cacheKey);
      
      if (cached && cached.expiresAt > Date.now()) {
        return { success: true, data: cached.data };
      }

      if (FEATURES.USE_API_USERS) {
        const queryParams = new URLSearchParams();
        if (validatedParams) {
          Object.entries(validatedParams).forEach(([key, value]) => {
            if (value !== undefined) {
              queryParams.append(key, String(value));
            }
          });
        }
        
        const response = await apiCall<any>(
          `${API_ENDPOINTS.USERS.LIST}?${queryParams.toString()}`
        );
        
        if (response.success && response.data) {
          // CRITICAL FIX: Handle both response formats
          let sanitizedResponse: UsersResponse;
          
          if (Array.isArray(response.data)) {
            // Backend returns array directly
            const sanitizedUsers = response.data.map((user: any) => this.sanitizeUserData(user));
            sanitizedResponse = {
              users: sanitizedUsers,
              total: sanitizedUsers.length,
              page: validatedParams?.page || 1,
              totalPages: 1,
            };
          } else {
            // Backend returns UsersResponse object
            const sanitizedUsers = response.data.users?.map((user: any) => this.sanitizeUserData(user)) || [];
            sanitizedResponse = { 
              ...response.data, 
              users: sanitizedUsers 
            };
          }
          
          // Cache the result
          this.listCache.set(cacheKey, {
            data: sanitizedResponse,
            expiresAt: Date.now() + CACHE_CONFIG.LIST_TTL,
          });
          
          return { 
            success: true, 
            data: sanitizedResponse,
            error: response.error,
            meta: response.meta 
          };
        }
        
        return {
          success: false,
          error: response.error || { code: UserErrorCode.NETWORK_ERROR, message: 'Failed to get users' }
        };
      }

      // LocalStorage implementation with advanced filtering
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      let filteredUsers = Object.entries(allUsers);

      // Apply filters
      if (validatedParams) {
        if (validatedParams.query) {
          const query = validatedParams.query.toLowerCase();
          filteredUsers = filteredUsers.filter(([username, user]) =>
            username.toLowerCase().includes(query) ||
            user.bio?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query)
          );
        }

        if (validatedParams.role) {
          filteredUsers = filteredUsers.filter(([_, user]) => user.role === validatedParams.role);
        }

        if (validatedParams.verified !== undefined) {
          filteredUsers = filteredUsers.filter(
            ([_, user]) => (user.verificationStatus === 'verified') === validatedParams.verified
          );
        }

        if (validatedParams.tier) {
          filteredUsers = filteredUsers.filter(([_, user]) => user.tier === validatedParams.tier);
        }

        if (validatedParams.minRating !== undefined) {
          filteredUsers = filteredUsers.filter(
            ([_, user]) => (user.rating || 0) >= validatedParams.minRating!
          );
        }

        if (validatedParams.hasListings !== undefined) {
          // This would need to check listings data
          // For now, we'll skip this filter in localStorage mode
        }

        if (validatedParams.isActive !== undefined) {
          const dayAgo = new Date();
          dayAgo.setDate(dayAgo.getDate() - 1);
          filteredUsers = filteredUsers.filter(
            ([_, user]) => {
              const lastActive = new Date(user.lastActive || user.createdAt);
              return validatedParams.isActive ? lastActive > dayAgo : lastActive <= dayAgo;
            }
          );
        }

        // Apply sorting
        if (validatedParams.sortBy) {
          filteredUsers.sort(([aUsername, a], [bUsername, b]) => {
            let compareValue = 0;
            
            switch (validatedParams.sortBy) {
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
            
            return validatedParams.sortOrder === 'desc' ? -compareValue : compareValue;
          });
        }
      }

      // Apply pagination
      const page = validatedParams?.page || 1;
      const limit = validatedParams?.limit || 50;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      const users = paginatedUsers.map(([_, user]) => this.sanitizeUserData(user));

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

      // Sanitize username
      const sanitizedUsername = sanitizeUsername(username);

      // Check cache
      const cached = this.profileCache.get(sanitizedUsername);
      if (cached && cached.expiresAt > Date.now()) {
        const userResult = await this.getUser(sanitizedUsername);
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
          `${buildApiUrl(API_ENDPOINTS.USERS.PROFILE, { username: sanitizedUsername })}/full`
        );
        
        if (response.success && response.data) {
          // Sanitize profile data
          const sanitizedProfile = this.sanitizeProfileData(response.data.profile);
          
          // Cache the profile
          this.profileCache.set(sanitizedUsername, {
            data: sanitizedProfile,
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL,
          });
          
          return {
            ...response,
            data: {
              ...response.data,
              profile: sanitizedProfile,
            },
          };
        }
        
        return response;
      }

      // LocalStorage implementation
      const userResult = await this.getUser(sanitizedUsername);
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

      let profile = profilesData[sanitizedUsername];
      
      if (!profile) {
        // Try legacy storage
        const bio = sessionStorage.getItem(`profile_bio_${sanitizedUsername}`) || '';
        const profilePic = sessionStorage.getItem(`profile_pic_${sanitizedUsername}`) || null;
        const subscriptionPrice = sessionStorage.getItem(`subscription_price_${sanitizedUsername}`) || '0';
        const galleryData = localStorage.getItem(`profile_gallery_${sanitizedUsername}`);
        const galleryImages = galleryData ? JSON.parse(galleryData) : [];

        profile = {
          bio,
          profilePic,
          subscriptionPrice,
          galleryImages,
        };
      }

      // Sanitize profile data
      const sanitizedProfile = this.sanitizeProfileData(profile);

      // Calculate profile completeness
      const completeness = calculateProfileCompleteness(userResult.data, sanitizedProfile);
      sanitizedProfile.completeness = completeness;

      // Cache the profile
      if (sanitizedProfile) {
        this.profileCache.set(sanitizedUsername, {
          data: sanitizedProfile,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL,
        });
      }

      return {
        success: true,
        data: {
          profile: sanitizedProfile,
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
      // Check rate limit
      const rateLimitResult = this.rateLimiter.check(
        `profile_update_${username}`,
        { maxAttempts: 10, windowMs: 60 * 60 * 1000 } // 10 updates per hour
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: `Too many updates. Please wait ${rateLimitResult.waitTime} seconds.`,
          },
        };
      }

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

      const sanitizedUsername = sanitizeUsername(username);

      // Validate and sanitize updates
      const validation = validateSchema(userProfileUpdateSchema, updates);
      if (!validation.success) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: Object.values(validation.errors || {})[0] || 'Invalid profile data',
          },
        };
      }

      const sanitizedUpdates = validation.data!;

      // Additional validation for bio and subscription price
      if (sanitizedUpdates.bio !== undefined && !isValidBio(sanitizedUpdates.bio)) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: 'Bio is too long (max 500 characters)',
            field: 'bio',
          },
        };
      }

      if (sanitizedUpdates.subscriptionPrice !== undefined && !isValidSubscriptionPrice(sanitizedUpdates.subscriptionPrice)) {
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
      const currentProfile = this.profileCache.get(sanitizedUsername);
      if (currentProfile) {
        const optimisticProfile = { ...currentProfile.data, ...sanitizedUpdates };
        this.profileCache.set(sanitizedUsername, {
          data: optimisticProfile,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL,
        });
      }

      if (FEATURES.USE_API_USERS) {
        const response = await apiCall<UserProfile>(
          buildApiUrl(API_ENDPOINTS.USERS.UPDATE_PROFILE, { username: sanitizedUsername }),
          {
            method: 'PATCH',
            body: JSON.stringify(sanitizedUpdates),
          }
        );
        
        if (!response.success) {
          // Revert optimistic update
          if (currentProfile) {
            this.profileCache.set(sanitizedUsername, currentProfile);
          } else {
            this.profileCache.delete(sanitizedUsername);
          }
        } else if (response.data) {
          // Update cache with server response
          const sanitizedProfile = this.sanitizeProfileData(response.data);
          this.profileCache.set(sanitizedUsername, {
            data: sanitizedProfile,
            timestamp: Date.now(),
            expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL,
          });
          
          return { ...response, data: sanitizedProfile };
        }
        
        return response;
      }

      // LocalStorage implementation
      const profilesData = await storageService.getItem<Record<string, UserProfile>>(
        'user_profiles',
        {}
      );

      const currentData = profilesData[sanitizedUsername] || {
        bio: '',
        profilePic: null,
        subscriptionPrice: '0',
      };

      const updatedProfile: UserProfile = {
        ...currentData,
        ...sanitizedUpdates,
        lastUpdated: new Date().toISOString(),
      };

      profilesData[sanitizedUsername] = updatedProfile;
      const success = await storageService.setItem('user_profiles', profilesData);

      if (success) {
        // Update legacy storage for backward compatibility
        if (sanitizedUpdates.bio !== undefined) {
          sessionStorage.setItem(`profile_bio_${sanitizedUsername}`, sanitizedUpdates.bio);
        }
        if (sanitizedUpdates.profilePic !== undefined) {
          if (sanitizedUpdates.profilePic) {
            sessionStorage.setItem(`profile_pic_${sanitizedUsername}`, sanitizedUpdates.profilePic);
          } else {
            sessionStorage.removeItem(`profile_pic_${sanitizedUsername}`);
          }
        }
        if (sanitizedUpdates.subscriptionPrice !== undefined) {
          sessionStorage.setItem(`subscription_price_${sanitizedUsername}`, sanitizedUpdates.subscriptionPrice);
        }
        if (sanitizedUpdates.galleryImages !== undefined) {
          localStorage.setItem(`profile_gallery_${sanitizedUsername}`, JSON.stringify(sanitizedUpdates.galleryImages));
        }

        // Update user bio in all_users_v2 if needed
        if (sanitizedUpdates.bio !== undefined) {
          const allUsers = await storageService.getItem<Record<string, any>>(
            'all_users_v2',
            {}
          );
          if (allUsers[sanitizedUsername]) {
            allUsers[sanitizedUsername].bio = sanitizedUpdates.bio;
            await storageService.setItem('all_users_v2', allUsers);
            // Clear user cache
            this.userCache.delete(sanitizedUsername);
          }
        }

        // Update cache
        this.profileCache.set(sanitizedUsername, {
          data: updatedProfile,
          timestamp: Date.now(),
          expiresAt: Date.now() + CACHE_CONFIG.PROFILE_TTL,
        });

        return { success: true, data: updatedProfile };
      } else {
        // Revert optimistic update
        if (currentProfile) {
          this.profileCache.set(sanitizedUsername, currentProfile);
        } else {
          this.profileCache.delete(sanitizedUsername);
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
      // Validate username
      if (!isValidUsername(username)) {
        return {
          success: false,
          error: {
            code: UserErrorCode.INVALID_USERNAME,
            message: 'Invalid username format',
          },
        };
      }

      const sanitizedUsername = sanitizeUsername(username);

      if (FEATURES.USE_API_USERS) {
        return await apiCall<UserPreferences>(
          `${buildApiUrl(API_ENDPOINTS.USERS.SETTINGS, { username: sanitizedUsername })}/preferences`
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

      const preferences = preferencesData[sanitizedUsername] || defaultPreferences;

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
      // Validate username
      if (!isValidUsername(username)) {
        return {
          success: false,
          error: {
            code: UserErrorCode.INVALID_USERNAME,
            message: 'Invalid username format',
          },
        };
      }

      const sanitizedUsername = sanitizeUsername(username);

      // Validate preferences
      const validation = validateSchema(userPreferencesSchema, updates);
      if (!validation.success) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: 'Invalid preferences data',
          },
        };
      }

      const sanitizedUpdates = validation.data!;

      if (FEATURES.USE_API_USERS) {
        return await apiCall<UserPreferences>(
          `${buildApiUrl(API_ENDPOINTS.USERS.SETTINGS, { username: sanitizedUsername })}/preferences`,
          {
            method: 'PATCH',
            body: JSON.stringify(sanitizedUpdates),
          }
        );
      }

      // LocalStorage implementation
      const preferencesData = await storageService.getItem<Record<string, UserPreferences>>(
        'user_preferences',
        {}
      );

      const currentPreferences = preferencesData[sanitizedUsername] || {
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
        ...sanitizedUpdates,
        notifications: {
          ...currentPreferences.notifications,
          ...(sanitizedUpdates.notifications || {}),
        },
        privacy: {
          ...currentPreferences.privacy,
          ...(sanitizedUpdates.privacy || {}),
        },
      };

      preferencesData[sanitizedUsername] = updatedPreferences;
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
      // Validate activity data
      const validation = validateSchema(activitySchema, activity);
      if (!validation.success) {
        return { success: true }; // Silently fail for activity tracking
      }

      const sanitizedActivity = validation.data!;

      if (FEATURES.USE_API_USERS) {
        return await apiCall<void>('/users/activity', {
          method: 'POST',
          body: JSON.stringify(sanitizedActivity),
        });
      }

      // LocalStorage implementation
      const activities = await storageService.getItem<UserActivity[]>('user_activities', []);
      
      const newActivity: UserActivity = {
        ...sanitizedActivity,
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      };

      activities.push(newActivity);
      
      // Keep only last N activities
      if (activities.length > SECURITY_LIMITS.MAX_ACTIVITY_HISTORY) {
        activities.splice(0, activities.length - SECURITY_LIMITS.MAX_ACTIVITY_HISTORY);
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
      // Validate username
      if (!isValidUsername(username)) {
        return {
          success: false,
          error: {
            code: UserErrorCode.INVALID_USERNAME,
            message: 'Invalid username format',
          },
        };
      }

      const sanitizedUsername = sanitizeUsername(username);
      const sanitizedLimit = Math.min(Math.max(1, limit), SECURITY_LIMITS.MAX_PAGE_SIZE);

      if (FEATURES.USE_API_USERS) {
        return await apiCall<UserActivity[]>(
          `${buildApiUrl(API_ENDPOINTS.USERS.PROFILE, { username: sanitizedUsername })}/activity?limit=${sanitizedLimit}`
        );
      }

      // LocalStorage implementation
      const activities = await storageService.getItem<UserActivity[]>('user_activities', []);
      
      const userActivities = activities
        .filter(activity => activity.userId === sanitizedUsername)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, sanitizedLimit);

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
      // Check rate limit
      const rateLimitResult = this.rateLimiter.check(
        'batch_update',
        { maxAttempts: 5, windowMs: 60 * 60 * 1000 } // 5 batch updates per hour
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: `Too many batch updates. Please wait ${rateLimitResult.waitTime} seconds.`,
          },
        };
      }

      // Limit batch size
      if (updates.length > SECURITY_LIMITS.MAX_BATCH_SIZE) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: `Batch size exceeds limit of ${SECURITY_LIMITS.MAX_BATCH_SIZE}`,
          },
        };
      }

      // Validate all updates
      const validatedUpdates: BatchUserUpdate[] = [];
      for (const update of updates) {
        if (!isValidUsername(update.username)) {
          continue;
        }
        
        const sanitizedUsername = sanitizeUsername(update.username);
        const sanitizedUpdates = this.sanitizeUserData(update.updates as User);
        
        validatedUpdates.push({
          username: sanitizedUsername,
          updates: sanitizedUpdates,
        });
      }

      if (FEATURES.USE_API_USERS) {
        return await apiCall<BatchOperationResult>('/users/batch-update', {
          method: 'POST',
          body: JSON.stringify({ updates: validatedUpdates }),
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

      for (const update of validatedUpdates) {
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
      // Check rate limit
      const rateLimitResult = this.rateLimiter.check(
        `verification_${username}`,
        { maxAttempts: 3, windowMs: 24 * 60 * 60 * 1000 } // 3 requests per day
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: `Too many verification requests. Please wait ${rateLimitResult.waitTime} seconds.`,
          },
        };
      }

      // Validate username
      if (!isValidUsername(username)) {
        return {
          success: false,
          error: {
            code: UserErrorCode.INVALID_USERNAME,
            message: 'Invalid username format',
          },
        };
      }

      const sanitizedUsername = sanitizeUsername(username);

      // Validate verification request
      const validation = validateSchema(verificationRequestSchema, docs);
      if (!validation.success) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: 'Invalid verification data',
          },
        };
      }

      const sanitizedDocs = validation.data!;

      // Validate required documents
      if (!sanitizedDocs.codePhoto || !sanitizedDocs.code) {
        return {
          success: false,
          error: {
            code: UserErrorCode.VALIDATION_ERROR,
            message: 'Code photo and verification code are required',
          },
        };
      }

      if (!sanitizedDocs.idFront && !sanitizedDocs.passport) {
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
          buildApiUrl(API_ENDPOINTS.USERS.VERIFICATION, { username: sanitizedUsername }),
          {
            method: 'POST',
            body: JSON.stringify(sanitizedDocs),
          }
        );
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      if (allUsers[sanitizedUsername]) {
        allUsers[sanitizedUsername].verificationStatus = 'pending';
        allUsers[sanitizedUsername].verificationRequestedAt = new Date().toISOString();
        allUsers[sanitizedUsername].verificationDocs = sanitizedDocs;
        await storageService.setItem('all_users_v2', allUsers);
        
        // Clear user cache
        this.userCache.delete(sanitizedUsername);
      }

      // Store verification request
      const verificationRequests = await storageService.getItem<Record<string, any>>(
        'panty_verification_requests',
        {}
      );
      
      verificationRequests[sanitizedUsername] = {
        ...sanitizedDocs,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      };
      
      await storageService.setItem('panty_verification_requests', verificationRequests);

      // Track activity
      await this.trackActivity({
        userId: sanitizedUsername,
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
      // Validate usernames
      if (!isValidUsername(buyer) || !isValidUsername(seller)) {
        return {
          success: false,
          error: {
            code: UserErrorCode.INVALID_USERNAME,
            message: 'Invalid username format',
          },
        };
      }

      const sanitizedBuyer = sanitizeUsername(buyer);
      const sanitizedSeller = sanitizeUsername(seller);
      
      const cacheKey = `sub:${sanitizedBuyer}:${sanitizedSeller}`;
      const cached = this.listCache.get(cacheKey);
      
      if (cached && cached.expiresAt > Date.now()) {
        return { success: true, data: cached.data };
      }

      if (FEATURES.USE_API_USERS) {
        const response = await apiCall<SubscriptionInfo>(
          `${API_ENDPOINTS.SUBSCRIPTIONS.CHECK}?buyer=${sanitizedBuyer}&seller=${sanitizedSeller}`
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

      const buyerSubs = subscriptions[sanitizedBuyer] || [];
      const subscription = buyerSubs.find(sub => sub.seller === sanitizedSeller);

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

  /**
   * Sanitize user data
   */
  private sanitizeUserData(user: any): User {
    return {
      ...user,
      username: user.username ? sanitizeUsername(user.username) : '',
      email: user.email ? sanitizeEmail(user.email) : undefined,
      bio: user.bio ? sanitizeStrict(user.bio) : undefined,
      banReason: user.banReason ? sanitizeStrict(user.banReason) : undefined,
      verificationRejectionReason: user.verificationRejectionReason ? sanitizeStrict(user.verificationRejectionReason) : undefined,
    };
  }

  /**
   * Sanitize profile data
   */
  private sanitizeProfileData(profile: UserProfile): UserProfile {
    return {
      ...profile,
      bio: sanitizeStrict(profile.bio),
      profilePic: profile.profilePic ? sanitizeUrl(profile.profilePic) : null,
      subscriptionPrice: profile.subscriptionPrice,
      galleryImages: profile.galleryImages?.map(url => sanitizeUrl(url)),
      socialLinks: profile.socialLinks ? {
        twitter: profile.socialLinks.twitter ? sanitizeUrl(profile.socialLinks.twitter) : undefined,
        instagram: profile.socialLinks.instagram ? sanitizeUrl(profile.socialLinks.instagram) : undefined,
        tiktok: profile.socialLinks.tiktok ? sanitizeUrl(profile.socialLinks.tiktok) : undefined,
        website: profile.socialLinks.website ? sanitizeUrl(profile.socialLinks.website) : undefined,
      } : undefined,
    };
  }
}

// Export enhanced singleton instance
export const enhancedUsersService = new EnhancedUsersService();