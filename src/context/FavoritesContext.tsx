'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { storageService } from '@/services';
import { sanitizeUsername, sanitizeStrict } from '@/utils/security/sanitization';
import { getRateLimiter } from '@/utils/security/rate-limiter';

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

  // Load favorites from localStorage
  const loadFavorites = useCallback(async () => {
    if (!user?.username) {
      setFavorites([]);
      return;
    }

    setLoadingFavorites(true);
    try {
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
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorites');
      return false;
    }
  }, [user?.username, favorites, getStorageKey, rateLimiter]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const contextValue: FavoritesContextType = {
    favorites,
    favoriteCount: favorites.length,
    isFavorited,
    toggleFavorite,
    loadingFavorites,
    error,
    clearError,
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
