'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';
import { useAuth } from './AuthContext';
import { storageService } from '@/services';
import { favoritesService } from '@/services/favorites.service';
import { sanitizeUsername, sanitizeStrict } from '@/utils/security/sanitization';
import { getRateLimiter } from '@/utils/security/rate-limiter';
import { FEATURES } from '@/services/api.config';
import { z } from 'zod';

// ================= Types =================

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

// ================ Validation Schemas ================

// Very defensive; we only ensure minimal fields + types are correct.
// URL validation for profilePicture is intentionally relaxed to avoid breaking existing data.
const StoredFavoriteSchema = z.object({
  sellerId: z.string().min(1),
  sellerUsername: z.string().min(1),
  addedAt: z.string().min(1),
  profilePicture: z.string().optional(),
  tier: z.string().optional(),
  isVerified: z.boolean().default(false),
});

const SellerInputSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1),
  profilePicture: z.string().optional(),
  tier: z.string().optional(),
  isVerified: z.boolean(),
});

// ================ Limits / Helpers ================

const FAV_LIMIT = {
  maxAttempts: 30,
  windowMs: 60_000, // 30 toggles per minute
  blockDuration: 60_000, // optional cool-down
};

function dedupeBySellerId(list: FavoriteSeller[]): FavoriteSeller[] {
  const seen = new Set<string>();
  const out: FavoriteSeller[] = [];
  for (const f of list) {
    if (!seen.has(f.sellerId)) {
      seen.add(f.sellerId);
      out.push(f);
    }
  }
  return out;
}

/**
 * Rate-limit wrapper that works whether limiter.check()
 * throws on limit OR returns { allowed, waitTime }.
 */
function checkRateLimitSafe(
  limiter: any,
  key: string,
  opts: { maxAttempts: number; windowMs: number; blockDuration?: number }
): { allowed: boolean; waitTime?: number } {
  try {
    const res = limiter?.check?.(key, opts);
    // If it returns an object
    if (typeof res === 'object' && res !== null) {
      if (res.allowed === false) {
        // waitTime may be provided in seconds or ms; normalize to seconds
        const waitSeconds =
          typeof res.waitTime === 'number'
            ? Math.max(1, Math.ceil(res.waitTime))
            : undefined;
        return { allowed: false, waitTime: waitSeconds };
      }
      return { allowed: true };
    }
    // If no return (assume not limited)
    return { allowed: true };
  } catch (e: any) {
    // If it throws on limit, try to extract wait time
    const ms =
      e?.waitTimeMs ??
      e?.retryAfterMs ??
      (typeof e?.waitTime === 'number' && e.waitTime > 10 ? e.waitTime * 1000 : undefined);
    const seconds = ms ? Math.max(1, Math.ceil(ms / 1000)) : undefined;
    return { allowed: false, waitTime: seconds };
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteSeller[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create limiter once; safe even under React strict mode
  const rateLimiter = useMemo(() => getRateLimiter(), []);

  // Storage key based on username (sanitized)
  const getStorageKey = useCallback((username: string) => {
    return `favorites_${sanitizeUsername(username)}`;
  }, []);

  // ------------- Load favorites (API or local) -------------
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
          // Validate + sanitize response
          const cleaned = (Array.isArray(response.data) ? response.data : [])
            .map((f) => {
              const parsed = StoredFavoriteSchema.safeParse(f);
              if (!parsed.success) return null;
              const v = parsed.data;
              return {
                sellerId: sanitizeStrict(v.sellerId),
                sellerUsername: sanitizeUsername(v.sellerUsername),
                addedAt: sanitizeStrict(v.addedAt),
                profilePicture: v.profilePicture,
                tier: v.tier,
                isVerified: !!v.isVerified,
              } as FavoriteSeller;
            })
            .filter(Boolean) as FavoriteSeller[];

          const deduped = dedupeBySellerId(cleaned);
          setFavorites(deduped);

          // Cache for offline
          const storageKey = getStorageKey(user.username);
          await storageService.setItem(storageKey, deduped);
        } else {
          // API error → fallback to local
          setError(response.error?.message || 'Failed to load favorites from server');
          const storageKey = getStorageKey(user.username);
          const stored = await storageService.getItem<FavoriteSeller[]>(storageKey, []);
          const validated = (Array.isArray(stored) ? stored : [])
            .map((f) => {
              const parsed = StoredFavoriteSchema.safeParse(f);
              if (!parsed.success) return null;
              const v = parsed.data;
              return {
                sellerId: sanitizeStrict(v.sellerId),
                sellerUsername: sanitizeUsername(v.sellerUsername),
                addedAt: sanitizeStrict(v.addedAt),
                profilePicture: v.profilePicture,
                tier: v.tier,
                isVerified: !!v.isVerified,
              } as FavoriteSeller;
            })
            .filter(Boolean) as FavoriteSeller[];
          setFavorites(dedupeBySellerId(validated));
        }
      } else {
        // LocalStorage only
        const storageKey = getStorageKey(user.username);
        const stored = await storageService.getItem<FavoriteSeller[]>(storageKey, []);
        const validated = (Array.isArray(stored) ? stored : [])
          .map((f) => {
            const parsed = StoredFavoriteSchema.safeParse(f);
            if (!parsed.success) return null;
            const v = parsed.data;
            return {
              sellerId: sanitizeStrict(v.sellerId),
              sellerUsername: sanitizeUsername(v.sellerUsername),
              addedAt: sanitizeStrict(v.addedAt),
              profilePicture: v.profilePicture,
              tier: v.tier,
              isVerified: !!v.isVerified,
            } as FavoriteSeller;
          })
          .filter(Boolean) as FavoriteSeller[];
        setFavorites(dedupeBySellerId(validated));
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

  // ------------- Helpers -------------
  const isFavorited = useCallback(
    (sellerId: string): boolean => favorites.some((fav) => fav.sellerId === sellerId),
    [favorites]
  );

  // ------------- Toggle favorite -------------
  const toggleFavorite = useCallback(
    async (seller: {
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

      // Validate & sanitize seller input
      const parsed = SellerInputSchema.safeParse(seller);
      if (!parsed.success) {
        setError('Invalid seller data');
        return false;
      }
      const cleanSeller = {
        id: sanitizeStrict(parsed.data.id),
        username: sanitizeUsername(parsed.data.username),
        profilePicture: parsed.data.profilePicture,
        tier: parsed.data.tier,
        isVerified: !!parsed.data.isVerified,
      };

      // Rate limiting (per-user key)
      const rlKey = `favorites:toggle:${sanitizeUsername(user.username)}`;
      const rl = checkRateLimitSafe(rateLimiter, rlKey, FAV_LIMIT);
      if (!rl.allowed) {
        const secs = rl.waitTime ?? Math.ceil(FAV_LIMIT.blockDuration / 1000);
        setError(`Too many actions. Please wait ${secs} seconds.`);
        return false;
      }

      try {
        const storageKey = getStorageKey(user.username);
        const current = [...favorites];
        const existingIndex = current.findIndex((f) => f.sellerId === cleanSeller.id);

        if (FEATURES.USE_API_USERS) {
          if (existingIndex >= 0) {
            // Remove via API
            const response = await favoritesService.removeFavorite(cleanSeller.id);
            if (response.success) {
              const next = current.filter((f) => f.sellerId !== cleanSeller.id);
              setFavorites(next);
              await storageService.setItem(storageKey, next);
              setError(null);
              return true;
            } else {
              setError(response.error?.message || 'Failed to remove favorite');
              return false;
            }
          } else {
            // Add via API
            const response = await favoritesService.addFavorite({
              sellerId: cleanSeller.id,
              sellerUsername: cleanSeller.username,
              profilePicture: cleanSeller.profilePicture,
              tier: cleanSeller.tier,
              isVerified: cleanSeller.isVerified,
            });

            if (response.success && response.data) {
              // Validate API response item before storing
              const parsedItem = StoredFavoriteSchema.safeParse(response.data);
              if (!parsedItem.success) {
                setError('Invalid server response for favorite item');
                return false;
              }
              const v = parsedItem.data;
              const newFav: FavoriteSeller = {
                sellerId: sanitizeStrict(v.sellerId),
                sellerUsername: sanitizeUsername(v.sellerUsername),
                addedAt: sanitizeStrict(v.addedAt || new Date().toISOString()),
                profilePicture: v.profilePicture,
                tier: v.tier,
                isVerified: !!v.isVerified,
              };
              const next = dedupeBySellerId([...current, newFav]);
              setFavorites(next);
              await storageService.setItem(storageKey, next);
              setError(null);
              return true;
            } else {
              setError(response.error?.message || 'Failed to add favorite');
              return false;
            }
          }
        } else {
          // Local only
          let next: FavoriteSeller[];
          if (existingIndex >= 0) {
            // Remove locally
            next = current.filter((f) => f.sellerId !== cleanSeller.id);
          } else {
            // Add locally
            const newFav: FavoriteSeller = {
              sellerId: cleanSeller.id,
              sellerUsername: cleanSeller.username,
              addedAt: new Date().toISOString(),
              profilePicture: cleanSeller.profilePicture,
              tier: cleanSeller.tier,
              isVerified: cleanSeller.isVerified,
            };
            next = dedupeBySellerId([...current, newFav]);
          }

          const saved = await storageService.setItem(storageKey, next as any);
          // Some storage services return void; treat undefined as success.
          if (saved === false) {
            setError('Failed to update favorites');
            return false;
          }
          setFavorites(next);
          setError(null);
          return true;
        }
      } catch (err) {
        console.error('Error toggling favorite:', err);
        setError('Failed to update favorites');
        return false;
      }
    },
    [user?.username, favorites, getStorageKey, rateLimiter]
  );

  const clearError = useCallback(() => setError(null), []);

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

  return <FavoritesContext.Provider value={contextValue}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
