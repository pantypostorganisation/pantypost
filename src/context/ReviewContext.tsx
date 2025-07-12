// src/context/ReviewContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storageService } from '@/services';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { z } from 'zod';

export type Review = {
  reviewer: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
};

// Validation schema for reviews
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(500, 'Review must be less than 500 characters'),
});

type ReviewContextType = {
  getReviewsForSeller: (sellerUsername: string) => Review[];
  addReview: (sellerUsername: string, review: Review) => void;
  hasReviewed: (sellerUsername: string, buyerUsername: string) => boolean;
};

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export const ReviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [allReviews, setAllReviews] = useState<{ [seller: string]: Review[] }>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data using storage service
  useEffect(() => {
    const loadData = async () => {
      if (typeof window === 'undefined' || isInitialized) return;
      
      try {
        const stored = await storageService.getItem<{ [seller: string]: Review[] }>('panty_reviews', {});
        
        // Sanitize existing reviews
        const sanitizedReviews: { [seller: string]: Review[] } = {};
        Object.entries(stored).forEach(([seller, reviews]) => {
          sanitizedReviews[seller] = reviews.map(review => ({
            ...review,
            comment: sanitizeStrict(review.comment || ''),
          }));
        });
        
        setAllReviews(sanitizedReviews);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading reviews:', error);
        setIsInitialized(true);
      }
    };

    loadData();
  }, [isInitialized]);

  // Save data using storage service
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      storageService.setItem('panty_reviews', allReviews);
    }
  }, [allReviews, isInitialized]);

  const getReviewsForSeller = (sellerUsername: string): Review[] => {
    return allReviews[sellerUsername] || [];
  };

  const addReview = (sellerUsername: string, review: Review) => {
    // Validate review data
    const validation = reviewSchema.safeParse({
      rating: review.rating,
      comment: review.comment,
    });

    if (!validation.success) {
      console.error('Invalid review data:', validation.error);
      alert(validation.error.errors[0]?.message || 'Invalid review');
      return;
    }

    const sanitizedReview: Review = {
      ...review,
      rating: validation.data.rating,
      comment: sanitizeStrict(validation.data.comment),
    };

    setAllReviews((prev) => {
      const updated = {
        ...prev,
        [sellerUsername]: [...(prev[sellerUsername] || []), sanitizedReview],
      };
      return updated;
    });
  };

  const hasReviewed = (sellerUsername: string, buyerUsername: string): boolean => {
    return allReviews[sellerUsername]?.some(
      (review) => review.reviewer === buyerUsername
    ) || false;
  };

  return (
    <ReviewContext.Provider value={{ getReviewsForSeller, addReview, hasReviewed }}>
      {children}
    </ReviewContext.Provider>
  );
};

export const useReviews = () => {
  const context = useContext(ReviewContext);
  if (!context) throw new Error('useReviews must be used within a ReviewProvider');
  return context;
};
