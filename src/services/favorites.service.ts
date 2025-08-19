// src/services/favorites.service.ts
import { apiCall, FEATURES } from './api.config';
import { storageService } from './storage.service';
import { FavoriteSeller } from '@/context/FavoritesContext';
import { ApiResponse, ApiError } from './api.config';

export interface FavoritesApiResponse {
  success: boolean;
  data?: FavoriteSeller[];
  error?: ApiError;
  meta?: { total: number };
}

class FavoritesService {
  private readonly STORAGE_KEY_PREFIX = 'favorites_';

  async getFavorites(username: string): Promise<FavoritesApiResponse> {
    try {
      if (FEATURES.USE_API_USERS) {
        const response = await apiCall<FavoriteSeller[]>('/favorites');
        return {
          success: response.success,
          data: response.data,
          error: response.error,
          meta: response.meta as { total: number } | undefined
        };
      }

      // LocalStorage fallback
      const storageKey = `${this.STORAGE_KEY_PREFIX}${username}`;
      const favorites = await storageService.getItem<FavoriteSeller[]>(storageKey, []);
      
      return {
        success: true,
        data: favorites,
        meta: { total: favorites.length }
      };
    } catch (error) {
      console.error('Get favorites error:', error);
      return {
        success: false,
        error: { 
          code: 'FETCH_ERROR', 
          message: 'Failed to get favorites' 
        }
      };
    }
  }

  async checkFavorite(sellerId: string): Promise<{ success: boolean; isFavorited: boolean }> {
    try {
      if (FEATURES.USE_API_USERS) {
        const response = await apiCall<{ isFavorited: boolean }>(`/favorites/check/${sellerId}`);
        return {
          success: response.success,
          isFavorited: response.data?.isFavorited || false
        };
      }

      // LocalStorage fallback handled by context
      return { success: true, isFavorited: false };
    } catch (error) {
      console.error('Check favorite error:', error);
      return { success: false, isFavorited: false };
    }
  }

  async addFavorite(favorite: Omit<FavoriteSeller, 'addedAt'>): Promise<ApiResponse<FavoriteSeller>> {
    try {
      if (FEATURES.USE_API_USERS) {
        const response = await apiCall<FavoriteSeller>('/favorites', {
          method: 'POST',
          body: JSON.stringify({
            sellerId: favorite.sellerId,
            sellerUsername: favorite.sellerUsername,
            profilePicture: favorite.profilePicture,
            tier: favorite.tier,
            isVerified: favorite.isVerified
          })
        });

        return response;
      }

      // LocalStorage fallback handled by context
      return { success: true };
    } catch (error) {
      console.error('Add favorite error:', error);
      return {
        success: false,
        error: { 
          code: 'ADD_ERROR', 
          message: 'Failed to add favorite' 
        }
      };
    }
  }

  async removeFavorite(sellerId: string): Promise<ApiResponse<void>> {
    try {
      if (FEATURES.USE_API_USERS) {
        const response = await apiCall<void>(`/favorites/${sellerId}`, {
          method: 'DELETE'
        });

        return response;
      }

      // LocalStorage fallback handled by context
      return { success: true };
    } catch (error) {
      console.error('Remove favorite error:', error);
      return {
        success: false,
        error: { 
          code: 'REMOVE_ERROR', 
          message: 'Failed to remove favorite' 
        }
      };
    }
  }

  async getFavoritesStats(username: string): Promise<ApiResponse<any>> {
    try {
      if (FEATURES.USE_API_USERS) {
        return await apiCall('/favorites/stats');
      }

      // LocalStorage stats
      const storageKey = `${this.STORAGE_KEY_PREFIX}${username}`;
      const favorites = await storageService.getItem<FavoriteSeller[]>(storageKey, []);
      
      const byTier = favorites.reduce((acc, fav) => {
        const tier = fav.tier || 'Unknown';
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        success: true,
        data: {
          total: favorites.length,
          byTier: Object.entries(byTier).map(([tier, count]) => ({ _id: tier, count })),
          recentlyAdded: favorites.slice(0, 5)
        }
      };
    } catch (error) {
      console.error('Get favorites stats error:', error);
      return { 
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to get favorites stats'
        }
      };
    }
  }
}

export const favoritesService = new FavoritesService();