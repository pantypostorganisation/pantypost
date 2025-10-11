// src/services/userStats.service.ts

import { apiCall, API_ENDPOINTS } from './api.config';

export interface UserStats {
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
  verifiedSellers: number;
  newUsersToday: number;
  newUsers24Hours?: number;
  timestamp: string;
}

export interface UserStatsResponse {
  success: boolean;
  data?: UserStats;
  error?: {
    code: string;
    message: string;
  };
}

class UserStatsService {
  private cache: UserStats | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  /**
   * Get user statistics with caching
   */
  async getUserStats(): Promise<UserStatsResponse> {
    try {
      // Return cached data if still valid
      const now = Date.now();
      if (this.cache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
        console.log('[UserStatsService] Returning cached stats:', this.cache);
        return { success: true, data: this.cache };
      }

      // Fetch fresh data using the standard apiCall helper
      console.log('[UserStatsService] Fetching user stats from API');
      
      // Use apiCall - the generic type should be the data type, not the response wrapper
      const response = await apiCall<UserStats>(API_ENDPOINTS.USERS.STATS);
      
      console.log('[UserStatsService] Response:', response);

      if (response.success && response.data) {
        // Cache the result - response.data is UserStats
        this.cache = response.data;
        this.cacheTimestamp = now;
        
        return { success: true, data: this.cache };
      }

      return {
        success: false,
        error: response.error 
          ? { 
              code: response.error.code || 'UNKNOWN', 
              message: response.error.message || 'Failed to fetch stats' 
            }
          : { code: 'UNKNOWN', message: 'Failed to fetch stats' }
      };
    } catch (error) {
      console.error('[UserStatsService] Error fetching user stats:', error);
      
      // Return cached data if available, even if expired
      if (this.cache) {
        console.log('[UserStatsService] Error occurred, returning stale cache');
        return { success: true, data: this.cache };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error'
        }
      };
    }
  }

  /**
   * Increment user count in cache (for real-time updates)
   */
  incrementUserCount(amount: number = 1) {
    if (this.cache) {
      this.cache.totalUsers += amount;
      this.cache.newUsersToday += amount;
      console.log('[UserStatsService] Incremented cache:', this.cache);
    }
  }

  /**
   * Update cached stats (from WebSocket events)
   */
  updateCachedStats(newStats: Partial<UserStats>) {
    if (this.cache) {
      this.cache = { ...this.cache, ...newStats };
      this.cacheTimestamp = Date.now();
      console.log('[UserStatsService] Updated cache:', this.cache);
    }
  }

  /**
   * Clear cache (force refresh on next request)
   */
  clearCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
    console.log('[UserStatsService] Cache cleared');
  }
}

// Export singleton instance
export const userStatsService = new UserStatsService();
