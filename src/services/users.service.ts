// src/services/users.service.ts

import { User } from '@/context/AuthContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse, apiClient } from './api.config';
import { enhancedUsersService } from './users.service.enhanced';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { z } from 'zod';
import { validateSchema } from '@/utils/validation/schemas';
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
const verificationUpdateSchema = z.object({
  status: z.enum(['pending', 'verified', 'rejected', 'unverified']),
  rejectionReason: z.string().max(500).transform(sanitizeStrict).optional(),
  adminUsername: z.string().min(3).max(30).transform(sanitizeUsername).optional(),
});

const banRequestSchema = z.object({
  username: z.string().min(3).max(30).transform(sanitizeUsername),
  reason: z.string().min(10).max(500).transform(sanitizeStrict),
  duration: z.number().int().positive().max(365).optional(), // Max 1 year
  adminUsername: z.string().min(3).max(30).transform(sanitizeUsername),
});

/**
 * Users Service - Enhanced Version with Backward Compatibility
 * 
 * This service now uses the enhanced implementation while maintaining
 * the same API for backward compatibility.
 */
export class UsersService {
  private enhanced = enhancedUsersService;
  private rateLimiter = getRateLimiter();

  /**
   * Get all users
   */
  async getUsers(params?: UserSearchParams): Promise<ApiResponse<Record<string, User>>> {
    try {
      // Convert params to enhanced format
      const enhancedParams: EnhancedUserSearchParams = {
        ...params,
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
   * Get user by username
   */
  async getUser(username: string): Promise<ApiResponse<User | null>> {
    return this.enhanced.getUser(username);
  }

  /**
   * Get user profile data
   */
  async getUserProfile(username: string): Promise<ApiResponse<UserProfile | null>> {
    try {
      const result = await this.enhanced.getUserProfile(username);
      
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
   * Update user profile
   */
  async updateUserProfile(
    username: string,
    updates: UpdateProfileRequest
  ): Promise<ApiResponse<UserProfile>> {
    try {
      // Validate inputs using enhanced validation
      if (!isValidUsername(username)) {
        return {
          success: false,
          error: { message: 'Invalid username format' },
        };
      }

      if (updates.bio !== undefined && !isValidBio(updates.bio)) {
        return {
          success: false,
          error: { message: 'Bio is too long (max 500 characters)' },
        };
      }

      if (updates.subscriptionPrice !== undefined && !isValidSubscriptionPrice(updates.subscriptionPrice)) {
        return {
          success: false,
          error: { message: 'Invalid subscription price' },
        };
      }

      const result = await this.enhanced.updateUserProfile(username, updates);
      
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
   * Request verification
   */
  async requestVerification(
    username: string,
    docs: VerificationRequest
  ): Promise<ApiResponse<void>> {
    return this.enhanced.requestVerification(username, docs);
  }

  /**
   * Update verification status (admin only)
   */
  async updateVerificationStatus(
    username: string,
    update: VerificationUpdateRequest
  ): Promise<ApiResponse<void>> {
    try {
      // Check rate limit
      const rateLimitResult = this.rateLimiter.check(
        'REPORT_ACTION',
        { ...RATE_LIMITS.REPORT_ACTION, identifier: update.adminUsername }
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Rate limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // Validate username
      if (!isValidUsername(username)) {
        return {
          success: false,
          error: { message: 'Invalid username format' },
        };
      }

      const sanitizedUsername = sanitizeUsername(username);

      // Validate update request
      const validation = validateSchema(verificationUpdateSchema, update);
      if (!validation.success) {
        return {
          success: false,
          error: { message: Object.values(validation.errors || {})[0] || 'Invalid update data' },
        };
      }

      const sanitizedUpdate = validation.data!;

      const enhancedUpdate: EnhancedVerificationUpdateRequest = {
        ...sanitizedUpdate,
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
        'all_users_v2',
        {}
      );

      if (allUsers[sanitizedUsername]) {
        allUsers[sanitizedUsername].verificationStatus = sanitizedUpdate.status;
        allUsers[sanitizedUsername].isVerified = sanitizedUpdate.status === 'verified';
        
        if (sanitizedUpdate.status === 'rejected' && sanitizedUpdate.rejectionReason) {
          allUsers[sanitizedUsername].verificationRejectionReason = sanitizedUpdate.rejectionReason;
        }
        
        await storageService.setItem('all_users_v2', allUsers);
        
        // Clear cache
        this.enhanced.clearCache();
      }

      // Update verification request
      const verificationRequests = await storageService.getItem<Record<string, any>>(
        'panty_verification_requests',
        {}
      );
      
      if (verificationRequests[sanitizedUsername]) {
        verificationRequests[sanitizedUsername].status = sanitizedUpdate.status;
        verificationRequests[sanitizedUsername].reviewedAt = new Date().toISOString();
        verificationRequests[sanitizedUsername].reviewedBy = sanitizedUpdate.adminUsername;
        if (sanitizedUpdate.rejectionReason) {
          verificationRequests[sanitizedUsername].rejectionReason = sanitizedUpdate.rejectionReason;
        }
        await storageService.setItem('panty_verification_requests', verificationRequests);
      }

      // Track activity
      await this.enhanced.trackActivity({
        userId: sanitizedUpdate.adminUsername || 'admin',
        type: 'profile_update',
        details: {
          action: 'verification_status_updated',
          targetUser: sanitizedUsername,
          newStatus: sanitizedUpdate.status,
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
   * Ban user
   */
  async banUser(request: BanRequest): Promise<ApiResponse<void>> {
    try {
      // Check rate limit
      const rateLimitResult = this.rateLimiter.check(
        'BAN_USER',
        { ...RATE_LIMITS.BAN_USER, identifier: request.adminUsername }
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Rate limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // Validate and sanitize request
      const validation = validateSchema(banRequestSchema, request);
      if (!validation.success) {
        return {
          success: false,
          error: { message: Object.values(validation.errors || {})[0] || 'Invalid ban request' },
        };
      }

      const sanitizedRequest = validation.data!;

      const enhancedRequest: EnhancedBanRequest = {
        ...sanitizedRequest,
        evidence: [],
      };

      if (FEATURES.USE_API_USERS) {
        return await apiCall<void>(`${API_ENDPOINTS.USERS.LIST}/${sanitizedRequest.username}/ban`, {
          method: 'POST',
          body: JSON.stringify(enhancedRequest),
        });
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      if (allUsers[sanitizedRequest.username]) {
        allUsers[sanitizedRequest.username].isBanned = true;
        allUsers[sanitizedRequest.username].banReason = sanitizedRequest.reason;
        
        if (sanitizedRequest.duration) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + sanitizedRequest.duration);
          allUsers[sanitizedRequest.username].banExpiresAt = expiresAt.toISOString();
        }
        
        await storageService.setItem('all_users_v2', allUsers);
        
        // Clear cache
        this.enhanced.clearCache();
      }

      // Store ban log
      const banLogs = await storageService.getItem<any[]>('ban_logs', []);
      banLogs.push({
        username: sanitizedRequest.username,
        reason: sanitizedRequest.reason,
        duration: sanitizedRequest.duration,
        bannedBy: sanitizedRequest.adminUsername,
        bannedAt: new Date().toISOString(),
      });
      
      // Limit ban log size
      if (banLogs.length > 1000) {
        banLogs.splice(0, banLogs.length - 1000);
      }
      
      await storageService.setItem('ban_logs', banLogs);

      // Track activity
      await this.enhanced.trackActivity({
        userId: sanitizedRequest.adminUsername,
        type: 'profile_update',
        details: {
          action: 'user_banned',
          targetUser: sanitizedRequest.username,
          reason: sanitizedRequest.reason,
          duration: sanitizedRequest.duration,
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
   * Unban user
   */
  async unbanUser(username: string, adminUsername: string): Promise<ApiResponse<void>> {
    try {
      // Check rate limit
      const rateLimitResult = this.rateLimiter.check(
        'BAN_USER',
        { ...RATE_LIMITS.BAN_USER, identifier: adminUsername }
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Rate limit exceeded. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // Validate usernames
      if (!isValidUsername(username) || !isValidUsername(adminUsername)) {
        return {
          success: false,
          error: { message: 'Invalid username format' },
        };
      }

      const sanitizedUsername = sanitizeUsername(username);
      const sanitizedAdminUsername = sanitizeUsername(adminUsername);

      if (FEATURES.USE_API_USERS) {
        return await apiCall<void>(`${API_ENDPOINTS.USERS.LIST}/${sanitizedUsername}/unban`, {
          method: 'POST',
          body: JSON.stringify({ adminUsername: sanitizedAdminUsername }),
        });
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      if (allUsers[sanitizedUsername]) {
        allUsers[sanitizedUsername].isBanned = false;
        delete allUsers[sanitizedUsername].banReason;
        delete allUsers[sanitizedUsername].banExpiresAt;
        await storageService.setItem('all_users_v2', allUsers);
        
        // Clear cache
        this.enhanced.clearCache();
      }

      // Update ban log
      const banLogs = await storageService.getItem<any[]>('ban_logs', []);
      banLogs.push({
        username: sanitizedUsername,
        action: 'unban',
        unbannedBy: sanitizedAdminUsername,
        unbannedAt: new Date().toISOString(),
      });
      
      // Limit ban log size
      if (banLogs.length > 1000) {
        banLogs.splice(0, banLogs.length - 1000);
      }
      
      await storageService.setItem('ban_logs', banLogs);

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
   * Get subscription info for a seller
   */
  async getSubscriptionInfo(seller: string, buyer: string): Promise<ApiResponse<{
    isSubscribed: boolean;
    price: string;
    subscribedAt?: string;
  }>> {
    try {
      // Validate usernames
      if (!isValidUsername(seller) || !isValidUsername(buyer)) {
        return {
          success: false,
          error: { message: 'Invalid username format' },
        };
      }

      const subResult = await this.enhanced.getSubscriptionStatus(buyer, seller);
      
      if (!subResult.success) {
        return subResult as any;
      }

      // Get subscription price from profile if not subscribed
      if (!subResult.data) {
        const profileResult = await this.getUserProfile(seller);
        const price = profileResult.data?.subscriptionPrice || '0';
        
        return {
          success: true,
          data: {
            isSubscribed: false,
            price,
          },
        };
      }

      return {
        success: true,
        data: {
          isSubscribed: subResult.data.status === 'active',
          price: subResult.data.price,
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
   * Get user preferences
   */
  async getUserPreferences(username: string) {
    return this.enhanced.getUserPreferences(username);
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(username: string, updates: any) {
    return this.enhanced.updateUserPreferences(username, updates);
  }

  /**
   * Track user activity
   */
  async trackActivity(activity: any) {
    return this.enhanced.trackActivity(activity);
  }

  /**
   * Get user activity history
   */
  async getUserActivity(username: string, limit?: number) {
    return this.enhanced.getUserActivity(username, limit);
  }

  /**
   * Batch update users
   */
  async batchUpdateUsers(updates: any[]) {
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