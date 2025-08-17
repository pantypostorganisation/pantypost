// src/hooks/profile/useSellerReviews.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useReviews } from '@/context/ReviewContext';
import { useWallet } from '@/context/WalletContext';
import { sanitizeUsername, sanitizeStrict } from '@/utils/security/sanitization';
import { z } from 'zod';
import type { Order } from '@/types/order';

// Review validation schema
const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z.string()
    .min(10, 'Review must be at least 10 characters')
    .max(500, 'Review must be at most 500 characters')
    .transform(val => sanitizeStrict(val))
});

export function useSellerReviews(username: string) {
  const { user } = useAuth();
  const { getReviewsForSeller, addReview, hasReviewed, getReviewStats, isLoading: reviewsLoading, error: reviewsError } = useReviews();
  const { orderHistory } = useWallet();

  // Sanitize username
  const sanitizedUsername = sanitizeUsername(username);

  // Review form state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reviews data state
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reviews for the seller
  useEffect(() => {
    const fetchReviews = async () => {
      if (!sanitizedUsername) return;
      
      setIsLoading(true);
      try {
        const fetchedReviews = await getReviewsForSeller(sanitizedUsername);
        setReviews(fetchedReviews);
        
        // Get stats for average rating
        const stats = await getReviewStats(sanitizedUsername);
        if (stats) {
          setAverageRating(stats.avgRating);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [sanitizedUsername, getReviewsForSeller, getReviewStats]);

  // Check if user has purchased from this seller and if they've already reviewed
  useEffect(() => {
    const checkPurchaseAndReview = async () => {
      if (!user?.username || !sanitizedUsername) {
        setHasPurchased(false);
        setAlreadyReviewed(false);
        setEligibleOrderId(null);
        return;
      }

      try {
        // Use orderHistory from wallet context
        // Filter orders where the current user is the buyer and the seller matches
        const ordersFromSeller = orderHistory.filter(
          (order: Order) => {
            const isBuyer = order.buyer === user.username;
            const isSeller = order.seller === sanitizedUsername;
            return isBuyer && isSeller;
          }
        );

        if (ordersFromSeller.length > 0) {
          setHasPurchased(true);
          
          // Use the first order's ID as the eligible order for the review
          // Generate a dummy order ID if none exists (for backwards compatibility)
          const orderId = ordersFromSeller[0].id || 
                         ordersFromSeller[0].listingId || 
                         `order_${user.username}_${sanitizedUsername}_${Date.now()}`;
          
          setEligibleOrderId(orderId);
          
          // Check if the user has already reviewed this seller
          // by checking if their username appears in the reviews list
          const existingReviews = await getReviewsForSeller(sanitizedUsername);
          const hasUserReviewed = existingReviews.some(
            (review: any) => review.reviewer === user.username
          );
          
          setAlreadyReviewed(hasUserReviewed);
        } else {
          setHasPurchased(false);
          setAlreadyReviewed(false);
          setEligibleOrderId(null);
        }
      } catch (error) {
        console.error('Error checking purchase/review status:', error);
        setHasPurchased(false);
        setAlreadyReviewed(false);
        setEligibleOrderId(null);
      }
    };

    checkPurchaseAndReview();
  }, [user?.username, sanitizedUsername, orderHistory, getReviewsForSeller]);

  // Auto-hide submitted message
  useEffect(() => {
    if (submitted) {
      const timeout = setTimeout(() => setSubmitted(false), 3000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [submitted]);

  // Clear validation error when inputs change
  useEffect(() => {
    setValidationError('');
  }, [rating, comment]);

  // Clear review errors
  useEffect(() => {
    if (reviewsError) {
      setValidationError(reviewsError);
    }
  }, [reviewsError]);

  // Handlers
  const handleReviewSubmit = useCallback(async () => {
    if (!user?.username) {
      setValidationError('You must be logged in to submit a review');
      return;
    }

    if (!eligibleOrderId) {
      // If no order ID but user has purchased, generate a temporary one
      if (hasPurchased) {
        const tempOrderId = `order_${user.username}_${sanitizedUsername}_${Date.now()}`;
        setEligibleOrderId(tempOrderId);
        
        // Retry with the generated ID
        setTimeout(() => {
          handleReviewSubmit();
        }, 100);
        return;
      } else {
        setValidationError('You must purchase from this seller before leaving a review');
        return;
      }
    }

    // Validate review data
    const validationResult = reviewSchema.safeParse({ rating, comment });
    
    if (!validationResult.success) {
      setValidationError(validationResult.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      // Add review via context (which calls the API)
      const success = await addReview(sanitizedUsername, eligibleOrderId, {
        rating: validationResult.data.rating,
        comment: validationResult.data.comment,
        asDescribed: true,
        fastShipping: true,
        wouldBuyAgain: true,
      });

      if (success) {
        setSubmitted(true);
        setComment('');
        setRating(5);
        setAlreadyReviewed(true);
        
        // Refresh reviews
        const updatedReviews = await getReviewsForSeller(sanitizedUsername);
        setReviews(updatedReviews);
        
        // Update stats
        const stats = await getReviewStats(sanitizedUsername);
        if (stats) {
          setAverageRating(stats.avgRating);
        }
      } else {
        setValidationError('Failed to submit review. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setValidationError('An error occurred while submitting your review');
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.username, eligibleOrderId, rating, comment, sanitizedUsername, hasPurchased, addReview, getReviewsForSeller, getReviewStats]);

  // Sanitize comment input
  const handleCommentChange = useCallback((value: string) => {
    // Apply basic length limit to prevent excessive input
    const truncated = value.slice(0, 600);
    setComment(truncated);
  }, []);

  return {
    // Review data
    reviews,
    averageRating,
    
    // Access control
    hasPurchased,
    alreadyReviewed,
    canReview: hasPurchased && !alreadyReviewed && user?.role === 'buyer',
    
    // Form state
    rating,
    setRating,
    comment,
    setComment: handleCommentChange,
    submitted,
    validationError,
    isSubmitting,
    
    // Loading state
    isLoading: isLoading || reviewsLoading,
    
    // Handlers
    handleReviewSubmit,
  };
}
