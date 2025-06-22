// src/services/users.service.ts

import { User } from '@/context/AuthContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';

// Define VerificationStatus type since it's not exported from AuthContext
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

/**
 * Users Service
 * Handles all user-related operations
 */
export class UsersService {
  /**
   * Get all users
   */
  async getUsers(params?: UserSearchParams): Promise<ApiResponse<Record<string, User>>> {
    try {
      if (FEATURES.USE_API_USERS) {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
              queryParams.append(key, String(value));
            }
          });
        }
        
        return await apiCall<Record<string, User>>(
          `${API_ENDPOINTS.USERS.LIST}?${queryParams.toString()}`
        );
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      let filteredUsers = { ...allUsers };

      // Apply filters
      if (params) {
        const userEntries = Object.entries(allUsers);
        
        let filtered = userEntries;
        
        if (params.role) {
          filtered = filtered.filter(([_, user]) => user.role === params.role);
        }
        
        if (params.verified !== undefined) {
          filtered = filtered.filter(
            ([_, user]) => 
              (user.verificationStatus === 'verified') === params.verified
          );
        }
        
        if (params.query) {
          const query = params.query.toLowerCase();
          filtered = filtered.filter(
            ([username, user]) =>
              username.toLowerCase().includes(query) ||
              user.bio?.toLowerCase().includes(query)
          );
        }
        
        filteredUsers = Object.fromEntries(filtered);
      }

      return {
        success: true,
        data: filteredUsers,
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
    try {
      if (FEATURES.USE_API_USERS) {
        return await apiCall<User>(
          buildApiUrl(API_ENDPOINTS.USERS.PROFILE, { username })
        );
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      const user = allUsers[username];
      
      return {
        success: true,
        data: user || null,
      };
    } catch (error) {
      console.error('Get user error:', error);
      return {
        success: false,
        error: { message: 'Failed to get user' },
      };
    }
  }

  /**
   * Get user profile data
   */
  async getUserProfile(username: string): Promise<ApiResponse<UserProfile | null>> {
    try {
      if (FEATURES.USE_API_USERS) {
        return await apiCall<UserProfile>(
          `${buildApiUrl(API_ENDPOINTS.USERS.PROFILE, { username })}/profile`
        );
      }

      // LocalStorage implementation
      const profilesData = await storageService.getItem<Record<string, UserProfile>>(
        'user_profiles',
        {}
      );

      const profile = profilesData[username];
      
      if (!profile) {
        // Fallback to legacy sessionStorage for backward compatibility
        const bio = sessionStorage.getItem(`profile_bio_${username}`) || '';
        const profilePic = sessionStorage.getItem(`profile_pic_${username}`) || null;
        const subscriptionPrice = sessionStorage.getItem(`subscription_price_${username}`) || '0';
        const galleryData = localStorage.getItem(`profile_gallery_${username}`);
        const galleryImages = galleryData ? JSON.parse(galleryData) : [];

        if (bio || profilePic || subscriptionPrice !== '0') {
          return {
            success: true,
            data: {
              bio,
              profilePic,
              subscriptionPrice,
              galleryImages,
            },
          };
        }
      }

      return {
        success: true,
        data: profile || null,
      };
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
      if (FEATURES.USE_API_USERS) {
        return await apiCall<UserProfile>(
          buildApiUrl(API_ENDPOINTS.USERS.UPDATE_PROFILE, { username }),
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          }
        );
      }

      // LocalStorage implementation
      const profilesData = await storageService.getItem<Record<string, UserProfile>>(
        'user_profiles',
        {}
      );

      const updatedProfile: UserProfile = {
        bio: updates.bio ?? profilesData[username]?.bio ?? '',
        profilePic: updates.profilePic ?? profilesData[username]?.profilePic ?? null,
        subscriptionPrice: updates.subscriptionPrice ?? profilesData[username]?.subscriptionPrice ?? '0',
        galleryImages: updates.galleryImages ?? profilesData[username]?.galleryImages,
        lastUpdated: new Date().toISOString(),
      };

      profilesData[username] = updatedProfile;
      await storageService.setItem('user_profiles', profilesData);

      // Also update sessionStorage for backward compatibility
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
        }
      }

      return {
        success: true,
        data: updatedProfile,
      };
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
    try {
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

      return { success: true };
    } catch (error) {
      console.error('Request verification error:', error);
      return {
        success: false,
        error: { message: 'Failed to request verification' },
      };
    }
  }

  /**
   * Update verification status (admin only)
   */
  async updateVerificationStatus(
    username: string,
    update: VerificationUpdateRequest
  ): Promise<ApiResponse<void>> {
    try {
      if (FEATURES.USE_API_USERS) {
        return await apiCall<void>(
          buildApiUrl(API_ENDPOINTS.USERS.VERIFICATION, { username }),
          {
            method: 'PATCH',
            body: JSON.stringify(update),
          }
        );
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      if (allUsers[username]) {
        allUsers[username].verificationStatus = update.status;
        allUsers[username].isVerified = update.status === 'verified';
        
        if (update.status === 'rejected' && update.rejectionReason) {
          allUsers[username].verificationRejectionReason = update.rejectionReason;
        }
        
        await storageService.setItem('all_users_v2', allUsers);
      }

      // Update verification request
      const verificationRequests = await storageService.getItem<Record<string, any>>(
        'panty_verification_requests',
        {}
      );
      if (verificationRequests[username]) {
        verificationRequests[username].status = update.status;
        verificationRequests[username].reviewedAt = new Date().toISOString();
        verificationRequests[username].reviewedBy = update.adminUsername;
        if (update.rejectionReason) {
          verificationRequests[username].rejectionReason = update.rejectionReason;
        }
        await storageService.setItem('panty_verification_requests', verificationRequests);
      }

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
      if (FEATURES.USE_API_USERS) {
        return await apiCall<void>(`${API_ENDPOINTS.USERS.LIST}/${request.username}/ban`, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      if (allUsers[request.username]) {
        allUsers[request.username].isBanned = true;
        allUsers[request.username].banReason = request.reason;
        
        if (request.duration) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + request.duration);
          allUsers[request.username].banExpiresAt = expiresAt.toISOString();
        }
        
        await storageService.setItem('all_users_v2', allUsers);
      }

      // Store ban log
      const banLogs = await storageService.getItem<any[]>('ban_logs', []);
      banLogs.push({
        username: request.username,
        reason: request.reason,
        duration: request.duration,
        bannedBy: request.adminUsername,
        bannedAt: new Date().toISOString(),
      });
      await storageService.setItem('ban_logs', banLogs);

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
      if (FEATURES.USE_API_USERS) {
        return await apiCall<void>(`${API_ENDPOINTS.USERS.LIST}/${username}/unban`, {
          method: 'POST',
          body: JSON.stringify({ adminUsername }),
        });
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>(
        'all_users_v2',
        {}
      );

      if (allUsers[username]) {
        allUsers[username].isBanned = false;
        delete allUsers[username].banReason;
        delete allUsers[username].banExpiresAt;
        await storageService.setItem('all_users_v2', allUsers);
      }

      // Update ban log
      const banLogs = await storageService.getItem<any[]>('ban_logs', []);
      banLogs.push({
        username,
        action: 'unban',
        unbannedBy: adminUsername,
        unbannedAt: new Date().toISOString(),
      });
      await storageService.setItem('ban_logs', banLogs);

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
      if (FEATURES.USE_API_USERS) {
        return await apiCall(`${API_ENDPOINTS.SUBSCRIPTIONS.CHECK}?seller=${seller}&buyer=${buyer}`);
      }

      // LocalStorage implementation
      const subscriptions = await storageService.getItem<Record<string, string[]>>(
        'subscriptions',
        {}
      );

      const isSubscribed = subscriptions[buyer]?.includes(seller) || false;
      
      // Get subscription price
      const profileResult = await this.getUserProfile(seller);
      const price = profileResult.data?.subscriptionPrice || '0';

      return {
        success: true,
        data: {
          isSubscribed,
          price,
          subscribedAt: isSubscribed ? new Date().toISOString() : undefined,
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
}

// Export singleton instance
export const usersService = new UsersService();