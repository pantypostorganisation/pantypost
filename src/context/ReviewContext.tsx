// src/context/ReviewContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storageService } from '@/services';

export type Review = {
  reviewer: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
};

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
        setAllReviews(stored);
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
    setAllReviews((prev) => {
      const updated = {
        ...prev,
        [sellerUsername]: [...(prev[sellerUsername] || []), review],
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
