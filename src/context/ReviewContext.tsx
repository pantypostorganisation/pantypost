// src/context/ReviewContext.tsx
'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import {
  reviewsService,
  Review as ServiceReview,
  ReviewStats,
} from '@/services/reviews.service';
import { useAuth } from './AuthContext';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { z } from 'zod';

// ===================== Types =====================

export type Review = {
  _id?: string;
  orderId?: string;
  reviewer: string;
  reviewee?: string;
  rating: number;
  comment: string;
  date: string;
  asDescribed?: boolean;
  fastShipping?: boolean;
  wouldBuyAgain?: boolean;
  sellerResponse?: {
    text: string;
    date: string;
  };
};

type ReviewsResponseShape = {
  reviews?: ServiceReview[];
  stats?: ReviewStats;
};

type ReviewContextType = {
  getReviewsForSeller: (sellerUsername: string) => Promise<Review[]>;
  addReview: (
    sellerUsername: string,
    orderId: string,
    review: Omit<Review, 'reviewer' | 'date'>
  ) => Promise<boolean>;
  hasReviewed: (orderId: string) => Promise<boolean>;
  getReviewStats: (sellerUsername: string) => Promise<ReviewStats | null>;
  isLoading: boolean;
  error: string | null;
};

// ===================== Validation =====================

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(500, 'Review must be less than 500 characters'),
});

// ===================== Context =====================

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

// Helper: normalize API review -> UI Review
const normalizeServiceReview = (r: ServiceReview): Review => ({
  _id: r._id,
  orderId: r.orderId,
  reviewer: r.reviewer,
  reviewee: r.reviewee,
  rating: r.rating,
  comment: r.comment,
  date: r.createdAt,
  asDescribed: r.asDescribed,
  fastShipping: r.fastShipping,
  wouldBuyAgain: r.wouldBuyAgain,
  sellerResponse: r.sellerResponse,
});

export const ReviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cachedReviews, setCachedReviews] = useState<Record<string, Review[]>>({});
  const [cachedStats, setCachedStats] = useState<Record<string, ReviewStats>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Clear caches when the logged-in user changes (prevents leakage across sessions)
  useEffect(() => {
    setCachedReviews({});
    setCachedStats({});
  }, [user?.username]);

  const getReviewsForSeller = useCallback(
    async (sellerUsername: string): Promise<Review[]> => {
      try {
        setIsLoading(true);
        setError(null);

        // Use cache if available
        if (cachedReviews[sellerUsername]) {
          return cachedReviews[sellerUsername];
        }

        const response = await reviewsService.getSellerReviews(sellerUsername);

        if (response.success && response.data) {
          // Narrow once and safely destructure
          const { reviews: srvReviews = [], stats } = response.data as ReviewsResponseShape;

          const reviews: Review[] = (srvReviews ?? []).map(normalizeServiceReview);

          setCachedReviews(prev => ({
            ...prev,
            [sellerUsername]: reviews,
          }));

          if (stats) {
            setCachedStats(prev => ({
              ...prev,
              [sellerUsername]: stats,
            }));
          }

          return reviews;
        } else {
          setError(response.error?.message || 'Failed to fetch reviews');
          return [];
        }
      } catch (e) {
        console.error('[ReviewContext] getReviewsForSeller error:', e);
        setError('Failed to fetch reviews');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [cachedReviews]
  );

  const addReview = useCallback(
    async (
      sellerUsername: string,
      orderId: string,
      review: Omit<Review, 'reviewer' | 'date'>
    ): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        if (!user?.username) {
          setError('You must be logged in to submit a review');
          return false;
        }

        // Validate input
        const parsed = reviewSchema.safeParse({
          rating: review.rating,
          comment: review.comment,
        });

        if (!parsed.success) {
          setError(parsed.error.errors[0]?.message || 'Invalid review');
          return false;
        }

        // Sanitize comment before sending
        const payload = {
          orderId,
          rating: parsed.data.rating,
          comment: sanitizeStrict(parsed.data.comment),
          asDescribed: review.asDescribed !== false,
          fastShipping: review.fastShipping !== false,
          wouldBuyAgain: review.wouldBuyAgain !== false,
        };

        const response = await reviewsService.createReview(payload);

        if (response.success) {
          // Bust caches for this seller so next fetch is fresh
          setCachedReviews(prev => {
            const { [sellerUsername]: _removed, ...rest } = prev;
            return rest;
          });
          setCachedStats(prev => {
            const { [sellerUsername]: _removed, ...rest } = prev;
            return rest;
          });
          return true;
        } else {
          setError(response.error?.message || 'Failed to create review');
          return false;
        }
      } catch (e) {
        console.error('[ReviewContext] addReview error:', e);
        setError('Failed to add review');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [user?.username]
  );

  const hasReviewed = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await reviewsService.checkOrderReview(orderId);

      if (response.success && response.data) {
        return !!response.data.hasReview;
      }

      return false;
    } catch (e) {
      console.error('[ReviewContext] hasReviewed error:', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getReviewStats = useCallback(
    async (sellerUsername: string): Promise<ReviewStats | null> => {
      try {
        // Return cached if present
        if (cachedStats[sellerUsername]) {
          return cachedStats[sellerUsername];
        }

        // Fetch full payload (reviews + stats) and cache safely
        const res = await reviewsService.getSellerReviews(sellerUsername);

        if (res.success && res.data) {
          const { reviews: srvReviews = [], stats = null } = res.data as ReviewsResponseShape;

          if (Array.isArray(srvReviews)) {
            const normalized = srvReviews.map(normalizeServiceReview);
            setCachedReviews(prev => ({ ...prev, [sellerUsername]: normalized }));
          }

          if (stats) {
            setCachedStats(prev => ({ ...prev, [sellerUsername]: stats }));
            return stats;
          }

          return null;
        }

        // If API failed or returned no data
        return null;
      } catch (e) {
        console.error('[ReviewContext] getReviewStats error:', e);
        return null;
      }
    },
    [cachedStats]
  );

  const value: ReviewContextType = {
    getReviewsForSeller,
    addReview,
    hasReviewed,
    getReviewStats,
    isLoading,
    error,
  };

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
};

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) {
    throw new Error('useReviews must be used within a ReviewProvider');
  }
  return context;
};
