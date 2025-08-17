// src/context/ReviewContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { reviewsService, Review as ServiceReview, ReviewStats } from '@/services/reviews.service';
import { useAuth } from './AuthContext';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { z } from 'zod';

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

// Validation schema for reviews
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(500, 'Review must be less than 500 characters'),
});

type ReviewContextType = {
  getReviewsForSeller: (sellerUsername: string) => Promise<Review[]>;
  addReview: (sellerUsername: string, orderId: string, review: Omit<Review, 'reviewer' | 'date'>) => Promise<boolean>;
  hasReviewed: (orderId: string) => Promise<boolean>;
  getReviewStats: (sellerUsername: string) => Promise<ReviewStats | null>;
  isLoading: boolean;
  error: string | null;
};

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cachedReviews, setCachedReviews] = useState<{ [seller: string]: Review[] }>({});
  const [cachedStats, setCachedStats] = useState<{ [seller: string]: ReviewStats }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Clear cache when user changes
  useEffect(() => {
    setCachedReviews({});
    setCachedStats({});
  }, [user?.username]);

  const getReviewsForSeller = useCallback(async (sellerUsername: string): Promise<Review[]> => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      if (cachedReviews[sellerUsername]) {
        return cachedReviews[sellerUsername];
      }

      // Fetch from API
      const response = await reviewsService.getSellerReviews(sellerUsername);
      
      if (response.success && response.data) {
        const reviews: Review[] = response.data.reviews.map(r => ({
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
        }));

        // Update cache
        setCachedReviews(prev => ({
          ...prev,
          [sellerUsername]: reviews
        }));

        // Cache stats too
        if (response.data.stats) {
          setCachedStats(prev => ({
            ...prev,
            [sellerUsername]: response.data!.stats
          }));
        }

        return reviews;
      } else {
        setError(response.error?.message || 'Failed to fetch reviews');
        return [];
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError('Failed to fetch reviews');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [cachedReviews]);

  const addReview = useCallback(async (
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

      // Validate review data
      const validation = reviewSchema.safeParse({
        rating: review.rating,
        comment: review.comment,
      });

      if (!validation.success) {
        setError(validation.error.errors[0]?.message || 'Invalid review');
        return false;
      }

      // Create review via API
      const response = await reviewsService.createReview({
        orderId,
        rating: validation.data.rating,
        comment: sanitizeStrict(validation.data.comment),
        asDescribed: review.asDescribed !== false,
        fastShipping: review.fastShipping !== false,
        wouldBuyAgain: review.wouldBuyAgain !== false,
      });

      if (response.success) {
        // Clear cache for this seller to force refresh
        setCachedReviews(prev => {
          const updated = { ...prev };
          delete updated[sellerUsername];
          return updated;
        });
        setCachedStats(prev => {
          const updated = { ...prev };
          delete updated[sellerUsername];
          return updated;
        });
        
        return true;
      } else {
        setError(response.error?.message || 'Failed to create review');
        return false;
      }
    } catch (error) {
      console.error('Error adding review:', error);
      setError('Failed to add review');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.username]);

  const hasReviewed = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await reviewsService.checkOrderReview(orderId);
      
      if (response.success && response.data) {
        return response.data.hasReview;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking review status:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getReviewStats = useCallback(async (sellerUsername: string): Promise<ReviewStats | null> => {
    try {
      // Check cache first
      if (cachedStats[sellerUsername]) {
        return cachedStats[sellerUsername];
      }

      // If not in cache, fetch reviews which will also cache stats
      await getReviewsForSeller(sellerUsername);
      
      return cachedStats[sellerUsername] || null;
    } catch (error) {
      console.error('Error getting review stats:', error);
      return null;
    }
  }, [cachedStats, getReviewsForSeller]);

  return (
    <ReviewContext.Provider value={{ 
      getReviewsForSeller, 
      addReview, 
      hasReviewed,
      getReviewStats,
      isLoading,
      error
    }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) throw new Error('useReviews must be used within a ReviewProvider');
  return context;
};
