// src/context/FavoritesContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { storageService } from '@/services';
import { favoritesService } from '@/services/favorites.service';
import { sanitizeUsername, sanitizeStrict } from '@/utils/security/sanitization';
import { getRateLimiter } from '@/utils/security/rate-limiter';
import { FEATURES } from '@/services/api.config';

export interface FavoriteSeller {
  sellerId: string;
  sellerUsername: string;
  addedAt: string;
  profilePicture?: string;
  tier?: string;
  isVerified: boolean;
}

interface FavoritesContextType {
  favorites: FavoriteSeller[];
  favoriteCount: number;
  isFavorited: (sellerId: string) => boolean;
  toggleFavorite: (seller: {
    id: string;
    username: string;
    profilePicture?: string;
    tier?: string;
    isVerified: boolean;
  }) => Promise<boolean>;
  loadingFavorites: boolean;
  error: string | null;
  clearError: () => void;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteSeller[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rateLimiter = getRateLimiter();

  // Storage key based on username
  const getStorageKey = useCallback((username: string) => {
    return `favorites_${sanitizeUsername(username)}`;
  }, []);

  // Load favorites from API or localStorage
  const loadFavorites = useCallback(async () => {
    if (!user?.username) {
      setFavorites([]);
      return;
    }

    setLoadingFavorites(true);
    try {
      if (FEATURES.USE_API_USERS) {
        // Load from API
        const response = await favoritesService.getFavorites(user.username);
        
        if (response.success && response.data) {
          setFavorites(response.data);
          
          // Also save to localStorage for offline access
          const storageKey = getStorageKey(user.username);
          await storageService.setItem(storageKey, response.data);
        } else if (response.error) {
          setError(response.error.message);
          // Fallback to localStorage
          const storageKey = getStorageKey(user.username);
          const storedFavorites = await storageService.getItem<FavoriteSeller[]>(storageKey, []);
          setFavorites(storedFavorites);
        }
      } else {
        // Load from localStorage only
        const storageKey = getStorageKey(user.username);
        const storedFavorites = await storageService.getItem<FavoriteSeller[]>(storageKey, []);
        
        // Validate and sanitize loaded data
        const validatedFavorites = storedFavorites.filter(fav => 
          fav.sellerId && fav.sellerUsername && fav.addedAt
        ).map(fav => ({
          ...fav,
          sellerId: sanitizeStrict(fav.sellerId),
          sellerUsername: sanitizeUsername(fav.sellerUsername),
          addedAt: sanitizeStrict(fav.addedAt),
        }));

        setFavorites(validatedFavorites);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites');
      setFavorites([]);
    } finally {
      setLoadingFavorites(false);
    }
  }, [user?.username, getStorageKey]);

  // Load favorites when user changes
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Check if seller is favorited
  const isFavorited = useCallback((sellerId: string): boolean => {
    return favorites.some(fav => fav.sellerId === sellerId);
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (seller: {
    id: string;
    username: string;
    profilePicture?: string;
    tier?: string;
    isVerified: boolean;
  }): Promise<boolean> => {
    if (!user?.username) {
      setError('Please log in to add favorites');
      return false;
    }

    // Rate limiting
    const rateLimitResult = rateLimiter.check('FAVORITES_TOGGLE', {
      maxAttempts: 30,
      windowMs: 60 * 1000 // 30 toggles per minute
    });

    if (!rateLimitResult.allowed) {
      setError(`Too many actions. Please wait ${rateLimitResult.waitTime} seconds.`);
      return false;
    }

    try {
      const storageKey = getStorageKey(user.username);
      const currentFavorites = [...favorites];
      const existingIndex = currentFavorites.findIndex(fav => fav.sellerId === seller.id);

      if (FEATURES.USE_API_USERS) {
        // Use API
        if (existingIndex >= 0) {
          // Remove from favorites via API
          const response = await favoritesService.removeFavorite(seller.id);
          
          if (response.success) {
            const newFavorites = currentFavorites.filter(fav => fav.sellerId !== seller.id);
            setFavorites(newFavorites);
            await storageService.setItem(storageKey, newFavorites);
            setError(null);
            return true;
          } else {
            setError(response.error?.message || 'Failed to remove favorite');
            return false;
          }
        } else {
          // Add to favorites via API
          const response = await favoritesService.addFavorite({
            sellerId: seller.id,
            sellerUsername: seller.username,
            profilePicture: seller.profilePicture,
            tier: seller.tier,
            isVerified: seller.isVerified
          });
          
          if (response.success && response.data) {
            const newFavorites = [...currentFavorites, response.data];
            setFavorites(newFavorites);
            await storageService.setItem(storageKey, newFavorites);
            setError(null);
            return true;
          } else {
            setError(response.error?.message || 'Failed to add favorite');
            return false;
          }
        }
      } else {
        // LocalStorage only
        let newFavorites: FavoriteSeller[];

        if (existingIndex >= 0) {
          // Remove from favorites
          newFavorites = currentFavorites.filter(fav => fav.sellerId !== seller.id);
        } else {
          // Add to favorites
          const newFavorite: FavoriteSeller = {
            sellerId: sanitizeStrict(seller.id),
            sellerUsername: sanitizeUsername(seller.username),
            addedAt: new Date().toISOString(),
            profilePicture: seller.profilePicture,
            tier: seller.tier,
            isVerified: seller.isVerified,
          };
          newFavorites = [...currentFavorites, newFavorite];
        }

        // Save to storage
        const success = await storageService.setItem(storageKey, newFavorites);
        
        if (success) {
          setFavorites(newFavorites);
          setError(null);
          return true;
        } else {
          setError('Failed to update favorites');
          return false;
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorites');
      return false;
    }
  }, [user?.username, favorites, getStorageKey, rateLimiter]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshFavorites = useCallback(async () => {
    await loadFavorites();
  }, [loadFavorites]);

  const contextValue: FavoritesContextType = {
    favorites,
    favoriteCount: favorites.length,
    isFavorited,
    toggleFavorite,
    loadingFavorites,
    error,
    clearError,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
