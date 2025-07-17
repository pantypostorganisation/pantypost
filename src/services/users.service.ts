// src/services/users.service.ts

import { User } from '@/context/AuthContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse, apiClient } from './api.config';
import { enhancedUsersService } from './users.service.enhanced';
import {
  UserProfile as EnhancedUserProfile,
  UserSearchParams as EnhancedUserSearchParams,
  VerificationRequest as EnhancedVerificationRequest,
  VerificationUpdateRequest as EnhancedVerificationUpdateRequest,
  BanRequest as EnhancedBanRequest,
  UserErrorCode,
  isValidUsername,
  isValidBio,
  isValidSubscriptionPrice,
} from '@/types/users';
import { securityService } from './security.service';
import { authSchemas, profileSchemas, adminSchemas } from '@/utils/validation/schemas';
import { sanitizeStrict, sanitizeUrl, sanitizeNumber } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { z } from 'zod';

// Re-export types for backward compatibility
export type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'unverified';

export interface UserProfile {
  bio: string;
  profilePic: string | null;
  subscriptionPrice: string;
  lastUpdated?: string;
  galleryImages?: string[];
}

export interface UpdateProfileRequest {
  bio?: string;
  profilePic?: string | null;
  subscriptionPrice?: string;
  galleryImages?: string[];
}

export interface VerificationRequest {
  codePhoto?: string;
  idFront?: string;
  idBack?: string;
  passport?: string;
  code?: string;
}

export interface VerificationUpdateRequest {
  status: VerificationStatus;
  rejectionReason?: string;
  adminUsername?: string;
}

export interface UserSearchParams {
  role?: 'buyer' | 'seller';
  verified?: boolean;
  query?: string;
  page?: number;
  limit?: number;
}

export interface BanRequest {
  username: string;
  reason: string;
  duration?: number; // in days, undefined = permanent
  adminUsername: string;
}

// Validation schemas
const userSearchSchema = z.object({
  role: z.enum(['buyer', 'seller']).optional(),
  verified: z.boolean().optional(),
  query: z.string().max(100).transform(sanitizeStrict).optional(),
  page: z.number().int().min(0).max(1000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

const updateProfileSchema = z.object({
  bio: z.string().max(500).transform(sanitizeStrict).optional(),
  profilePic: z.union([z.string().url().transform(sanitizeUrl), z.null()]).optional(),
  subscriptionPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  galleryImages: z.array(z.string().url().transform(sanitizeUrl)).max(20).optional(),
});

const verificationRequestSchema = z.object({
  codePhoto: z.string().url().optional(),
  idFront: z.string().url().optional(),
  idBack: z.string().url().optional(),
  passport: z.string().url().optional(),
  code: z.string().max(20).transform(sanitizeStrict).optional(),
});

const verificationUpdateSchema = z.object({
  status: z.enum(['pending', 'verified', 'rejected', 'unverified']),
  rejectionReason: z.string().max(500).transform(sanitizeStrict).optional(),
  adminUsername: z.string().max(50).transform(s => s.toLowerCase()).optional(),
});

/**
 * Users Service - Enhanced Version with Security and Backward Compatibility
 * 
 * This service now uses the enhanced implementation while maintaining
 * the same API for backward compatibility with added security measures.
 */
export class UsersService {
  private enhanced = enhancedUsersService;
  private rateLimiter = getRateLimiter();

  /**
   * Get all users with validation
   */
  async getUsers(params?: UserSearchParams): Promise<ApiResponse<Record<string, User>>> {
    try {
      // Validate search params
      let validatedParams: UserSearchParams | undefined;
      if (params) {
        const validation = securityService.validateAndSanitize(params, userSearchSchema);
        if (!validation.success) {
          return {
            success: false,
            error: { message: 'Invalid search parameters', details: validation.errors },
          };
        }
        validatedParams = validation.data;
      }

      // Convert params to enhanced format
      const enhancedParams: EnhancedUserSearchParams = {
        ...validatedParams,
        sortBy: 'username',
        sortOrder: 'asc',
      };

      const result = await this.enhanced.getUsers(enhancedParams);
      
      if (!result.success) {
        return result as any;
      }

      // Convert UsersResponse to Record<string, User> for backward compatibility
      const usersMap: Record<string, User> = {};
      if (result.data?.users) {
        result.data.users.forEach(user => {
          usersMap[user.username] = user;
        });
      }

      return {
        success: true,
        data: usersMap,
      };
    } catch (error) {
      console.error('Get users error:', error);
      return {
        success: false,
        error: { message: 'Failed to get users' },
      };
    }
  }

  /**
   * Get user by username with validation
   */
  async getUser(username: string): Promise<ApiResponse<User | null>> {
    // Validate username
    const sanitizedUsername = sanitizeStrict(username).toLowerCase();
    if (!sanitizedUsername || !isValidUsername(sanitizedUsername)) {
      return {
        success: false,
        error: { message: 'Invalid username format' },
      };
    }

    return this.enhanced.getUser(sanitizedUsername);
  }

  /**
   * Get user profile data with validation
   */
  async getUserProfile(username: string): Promise<ApiResponse<UserProfile | null>> {
    try {
      // Validate username
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      if (!sanitizedUsername || !isValidUsername(sanitizedUsername)) {
        return {
          success: false,
          error: { message: 'Invalid username format' },
        };
      }

      const result = await this.enhanced.getUserProfile(sanitizedUsername);
      
      if (!result.success) {
        return result as any;
      }

      if (!result.data) {
        return { success: true, data: null };
      }

      // Extract just the profile part for backward compatibility
      const profile: UserProfile = {
        bio: result.data.profile.bio,
        profilePic: result.data.profile.profilePic,
        subscriptionPrice: result.data.profile.subscriptionPrice,
        lastUpdated: result.data.profile.lastUpdated,
        galleryImages: result.data.profile.galleryImages,
      };

      return { success: true, data: profile };
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: { message: 'Failed to get user profile' },
      };
    }
  }

  /**
   * Update user profile with validation and rate limiting
   */
  async updateUserProfile(
    username: string,
    updates: UpdateProfileRequest
  ): Promise<ApiResponse<UserProfile>> {
    try {
      // Validate username
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      if (!sanitizedUsername || !isValidUsername(sanitizedUsername)) {
        return {
          success: false,
          error: { message: 'Invalid username format' },
        };
      }

      // Check rate limit
      const rateLimitKey = `profile_update_${sanitizedUsername}`;
      const rateLimitResult = this.rateLimiter.check(rateLimitKey, {
        maxAttempts: 10,
        windowMs: 60 * 60 * 1000, // 10 updates per hour
      });
      
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Too many profile updates. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // Validate updates
      const validation = securityService.validateAndSanitize(updates, updateProfileSchema);
      if (!validation.success || !validation.data) {
        return {
          success: false,
          error: { message: 'Invalid profile data', details: validation.errors },
        };
      }

      const validatedUpdates = validation.data;

      // Additional validation using enhanced validators
      if (validatedUpdates.bio !== undefined && !isValidBio(validatedUpdates.bio)) {
        return {
          success: false,
          error: { message: 'Bio is too long (max 500 characters)' },
        };
      }

      if (validatedUpdates.subscriptionPrice !== undefined && !isValidSubscriptionPrice(validatedUpdates.subscriptionPrice)) {
        return {
          success: false,
          error: { message: 'Invalid subscription price' },
        };
      }

      const result = await this.enhanced.updateUserProfile(sanitizedUsername, validatedUpdates);
      
      if (!result.success) {
        return result as any;
      }

      // Convert to simple profile format
      const profile: UserProfile = {
        bio: result.data!.bio,
        profilePic: result.data!.profilePic,
        subscriptionPrice: result.data!.subscriptionPrice,
        lastUpdated: result.data!.lastUpdated,
        galleryImages: result.data!.galleryImages,
      };

      return { success: true, data: profile };
    } catch (error) {
      console.error('Update user profile error:', error);
      return {
        success: false,
        error: { message: 'Failed to update user profile' },
      };
    }
  }

  /**
   * Request verification with validation and rate limiting
   */
  async requestVerification(
    username: string,
    docs: VerificationRequest
  ): Promise<ApiResponse<void>> {
    // Validate username
    const sanitizedUsername = sanitizeStrict(username).toLowerCase();
    if (!sanitizedUsername || !isValidUsername(sanitizedUsername)) {
      return {
        success: false,
        error: { message: 'Invalid username format' },
      };
    }

    // Check rate limit
    const rateLimitKey = `verification_request_${sanitizedUsername}`;
    const rateLimitResult = this.rateLimiter.check(rateLimitKey, {
      maxAttempts: 3,
      windowMs: 24 * 60 * 60 * 1000, // 3 requests per day
    });
    
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: { message: `Too many verification requests. Please wait ${rateLimitResult.waitTime} seconds.` },
      };
    }

    // Validate documents
    const validation = securityService.validateAndSanitize(docs, verificationRequestSchema);
    if (!validation.success || !validation.data) {
      return {
        success: false,
        error: { message: 'Invalid verification documents', details: validation.errors },
      };
    }

    return this.enhanced.requestVerification(sanitizedUsername, validation.data);
  }

  /**
   * Update verification status (admin only) with validation
   */
  async updateVerificationStatus(
    username: string,
    update: VerificationUpdateRequest
  ): Promise<ApiResponse<void>> {
    try {
      // Validate username
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      if (!sanitizedUsername || !isValidUsername(sanitizedUsername)) {
        return {
          success: false,
          error: { message: 'Invalid username format' },
        };
      }

      // Validate update request
      const validation = securityService.validateAndSanitize(update, verificationUpdateSchema);
      if (!validation.success || !validation.data) {
        return {
          success: false,
          error: { message: 'Invalid verification update', details: validation.errors },
        };
      }

      const validatedUpdate = validation.data;

      // Check rate limit for admin actions
      if (validatedUpdate.adminUsername) {
        const rateLimitKey = `admin_verification_${validatedUpdate.adminUsername}`;
        const rateLimitResult = this.rateLimiter.check(rateLimitKey, {
          maxAttempts: 50,
          windowMs: 60 * 60 * 1000, // 50 verifications per hour
        });
        
        if (!rateLimitResult.allowed) {
          return {
            success: false,
            error: { message: `Too many verification updates. Please wait ${rateLimitResult.waitTime} seconds.` },
          };
        }
      }

      const enhancedUpdate: EnhancedVerificationUpdateRequest = {
        ...validatedUpdate,
        reviewedAt: new Date().toISOString(),
      };

      if (FEATURES.USE_API_USERS) {
        return await apiCall<void>(
          buildApiUrl(API_ENDPOINTS.USERS.VERIFICATION, { username: sanitizedUsername }),
          {
            method: 'PATCH',
            body: JSON.stringify(enhancedUpdate),
          }
        );
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'panty_users',
        {}
      );

      if (allUsers[sanitizedUsername]) {
        allUsers[sanitizedUsername].verificationStatus = validatedUpdate.status;
        allUsers[sanitizedUsername].isVerified = validatedUpdate.status === 'verified';
        
        if (validatedUpdate.status === 'rejected' && validatedUpdate.rejectionReason) {
          allUsers[sanitizedUsername].verificationRejectionReason = validatedUpdate.rejectionReason;
        }
        
        await storageService.setItem('panty_users', allUsers);
        
        // Clear cache
        this.enhanced.clearCache();
      }

      // Update verification request
      const verificationRequests = await storageService.getItem<Record<string, any>>(
        'panty_verification_requests',
        {}
      );
      
      if (verificationRequests[sanitizedUsername]) {
        verificationRequests[sanitizedUsername].status = validatedUpdate.status;
        verificationRequests[sanitizedUsername].reviewedAt = new Date().toISOString();
        verificationRequests[sanitizedUsername].reviewedBy = validatedUpdate.adminUsername;
        if (validatedUpdate.rejectionReason) {
          verificationRequests[sanitizedUsername].rejectionReason = validatedUpdate.rejectionReason;
        }
        await storageService.setItem('panty_verification_requests', verificationRequests);
      }

      // Track activity
      await this.enhanced.trackActivity({
        userId: validatedUpdate.adminUsername || 'admin',
        type: 'profile_update',
        details: {
          action: 'verification_status_updated',
          targetUser: sanitizedUsername,
          newStatus: validatedUpdate.status,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Update verification status error:', error);
      return {
        success: false,
        error: { message: 'Failed to update verification status' },
      };
    }
  }

  /**
   * Ban user with validation and rate limiting
   */
  async banUser(request: BanRequest): Promise<ApiResponse<void>> {
    try {
      // Extract adminUsername before validation since it's not in the schema
      const adminUsername = request.adminUsername;
      
      // Prepare data for validation (matching the schema structure)
      const dataForValidation = {
        userId: request.username,
        reason: request.reason,
        duration: request.duration === undefined ? 'permanent' : 
                  request.duration === 1 ? '1_day' :
                  request.duration === 7 ? '7_days' : 
                  request.duration === 30 ? '30_days' : 'permanent'
      };
      
      // Validate ban request
      const validation = securityService.validateAndSanitize(dataForValidation, adminSchemas.banUser);
      if (!validation.success || !validation.data) {
        return {
          success: false,
          error: { message: 'Invalid ban request', details: validation.errors },
        };
      }

      const validatedRequest = validation.data;

      // Check rate limit using the original adminUsername
      const rateLimitKey = `ban_user_${adminUsername}`;
      const rateLimitResult = this.rateLimiter.check(rateLimitKey, RATE_LIMITS.BAN_USER);
      
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Too many ban actions. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // Sanitize username
      const sanitizedUsername = sanitizeStrict(validatedRequest.userId).toLowerCase();

      const enhancedRequest: EnhancedBanRequest = {
        username: sanitizedUsername,
        reason: validatedRequest.reason,
        duration: validatedRequest.duration === 'permanent' ? undefined : 
                  validatedRequest.duration === '1_day' ? 1 :
                  validatedRequest.duration === '7_days' ? 7 : 30,
        adminUsername: adminUsername || 'admin',
        evidence: [],
      };

      if (FEATURES.USE_API_USERS) {
        return await apiCall<void>(`${API_ENDPOINTS.USERS.LIST}/${sanitizedUsername}/ban`, {
          method: 'POST',
          body: JSON.stringify(enhancedRequest),
        });
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'panty_users',
        {}
      );

      if (allUsers[sanitizedUsername]) {
        allUsers[sanitizedUsername].isBanned = true;
        allUsers[sanitizedUsername].banReason = enhancedRequest.reason;
        
        if (enhancedRequest.duration) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + enhancedRequest.duration);
          allUsers[sanitizedUsername].banExpiresAt = expiresAt.toISOString();
        }
        
        await storageService.setItem('panty_users', allUsers);
        
        // Clear cache
        this.enhanced.clearCache();
      }

      // Store ban log
      const banLogs = await storageService.getItem<any[]>('panty_ban_logs', []);
      banLogs.push({
        username: sanitizedUsername,
        reason: enhancedRequest.reason,
        duration: enhancedRequest.duration,
        bannedBy: enhancedRequest.adminUsername,
        bannedAt: new Date().toISOString(),
      });
      await storageService.setItem('panty_ban_logs', banLogs);

      // Track activity
      await this.enhanced.trackActivity({
        userId: enhancedRequest.adminUsername,
        type: 'profile_update',
        details: {
          action: 'user_banned',
          targetUser: sanitizedUsername,
          reason: enhancedRequest.reason,
          duration: enhancedRequest.duration,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Ban user error:', error);
      return {
        success: false,
        error: { message: 'Failed to ban user' },
      };
    }
  }

  /**
   * Unban user with validation
   */
  async unbanUser(username: string, adminUsername: string): Promise<ApiResponse<void>> {
    try {
      // Validate inputs
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      const sanitizedAdminUsername = sanitizeStrict(adminUsername).toLowerCase();
      
      if (!sanitizedUsername || !isValidUsername(sanitizedUsername)) {
        return {
          success: false,
          error: { message: 'Invalid username format' },
        };
      }

      if (!sanitizedAdminUsername || !isValidUsername(sanitizedAdminUsername)) {
        return {
          success: false,
          error: { message: 'Invalid admin username format' },
        };
      }

      if (FEATURES.USE_API_USERS) {
        return await apiCall<void>(`${API_ENDPOINTS.USERS.LIST}/${sanitizedUsername}/unban`, {
          method: 'POST',
          body: JSON.stringify({ adminUsername: sanitizedAdminUsername }),
        });
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'panty_users',
        {}
      );

      if (allUsers[sanitizedUsername]) {
        allUsers[sanitizedUsername].isBanned = false;
        delete allUsers[sanitizedUsername].banReason;
        delete allUsers[sanitizedUsername].banExpiresAt;
        await storageService.setItem('panty_users', allUsers);
        
        // Clear cache
        this.enhanced.clearCache();
      }

      // Update ban log
      const banLogs = await storageService.getItem<any[]>('panty_ban_logs', []);
      banLogs.push({
        username: sanitizedUsername,
        action: 'unban',
        unbannedBy: sanitizedAdminUsername,
        unbannedAt: new Date().toISOString(),
      });
      await storageService.setItem('panty_ban_logs', banLogs);

      // Track activity
      await this.enhanced.trackActivity({
        userId: sanitizedAdminUsername,
        type: 'profile_update',
        details: {
          action: 'user_unbanned',
          targetUser: sanitizedUsername,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Unban user error:', error);
      return {
        success: false,
        error: { message: 'Failed to unban user' },
      };
    }
  }

  /**
   * Get subscription info for a seller with validation
   */
  async getSubscriptionInfo(seller: string, buyer: string): Promise<ApiResponse<{
    isSubscribed: boolean;
    price: string;
    subscribedAt?: string;
  }>> {
    try {
      // Validate inputs
      const sanitizedSeller = sanitizeStrict(seller).toLowerCase();
      const sanitizedBuyer = sanitizeStrict(buyer).toLowerCase();
      
      if (!sanitizedSeller || !isValidUsername(sanitizedSeller)) {
        return {
          success: false,
          error: { message: 'Invalid seller username' },
        };
      }

      if (!sanitizedBuyer || !isValidUsername(sanitizedBuyer)) {
        return {
          success: false,
          error: { message: 'Invalid buyer username' },
        };
      }

      const subResult = await this.enhanced.getSubscriptionStatus(sanitizedBuyer, sanitizedSeller);
      
      if (!subResult.success) {
        return subResult as any;
      }

      // Get subscription price from profile if not subscribed
      if (!subResult.data) {
        const profileResult = await this.getUserProfile(sanitizedSeller);
        const price = profileResult.data?.subscriptionPrice || '0';
        
        return {
          success: true,
          data: {
            isSubscribed: false,
            price: sanitizeNumber(price, 0, 1000, 2).toString(),
          },
        };
      }

      return {
        success: true,
        data: {
          isSubscribed: subResult.data.status === 'active',
          price: sanitizeNumber(subResult.data.price, 0, 1000, 2).toString(),
          subscribedAt: subResult.data.subscribedAt,
        },
      };
    } catch (error) {
      console.error('Get subscription info error:', error);
      return {
        success: false,
        error: { message: 'Failed to get subscription info' },
      };
    }
  }

  /**
   * New enhanced methods - exposed for gradual adoption
   */
  
  /**
   * Get user preferences with validation
   */
  async getUserPreferences(username: string) {
    const sanitizedUsername = sanitizeStrict(username).toLowerCase();
    if (!sanitizedUsername || !isValidUsername(sanitizedUsername)) {
      return {
        success: false,
        error: { message: 'Invalid username format' },
      };
    }
    return this.enhanced.getUserPreferences(sanitizedUsername);
  }

  /**
   * Update user preferences with validation
   */
  async updateUserPreferences(username: string, updates: any) {
    const sanitizedUsername = sanitizeStrict(username).toLowerCase();
    if (!sanitizedUsername || !isValidUsername(sanitizedUsername)) {
      return {
        success: false,
        error: { message: 'Invalid username format' },
      };
    }
    return this.enhanced.updateUserPreferences(sanitizedUsername, updates);
  }

  /**
   * Track user activity
   */
  async trackActivity(activity: any) {
    return this.enhanced.trackActivity(activity);
  }

  /**
   * Get user activity history with validation
   */
  async getUserActivity(username: string, limit?: number) {
    const sanitizedUsername = sanitizeStrict(username).toLowerCase();
    if (!sanitizedUsername || !isValidUsername(sanitizedUsername)) {
      return {
        success: false,
        error: { message: 'Invalid username format' },
      };
    }
    
    const sanitizedLimit = limit ? Math.min(Math.max(1, limit), 100) : undefined;
    return this.enhanced.getUserActivity(sanitizedUsername, sanitizedLimit);
  }

  /**
   * Batch update users (admin only)
   */
  async batchUpdateUsers(updates: any[]) {
    // Limit batch size
    if (updates.length > 50) {
      return {
        success: false,
        error: { message: 'Batch size too large (max 50)' },
      };
    }
    return this.enhanced.batchUpdateUsers(updates);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.enhanced.clearCache();
  }
}

// Export singleton instance
export const usersService = new UsersService();