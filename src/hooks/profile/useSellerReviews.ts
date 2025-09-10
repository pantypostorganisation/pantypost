// src/hooks/profile/useSellerReviews.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useReviews } from '@/context/ReviewContext';
import { useWallet } from '@/context/WalletContext';
import { sanitizeUsername, sanitizeStrict } from '@/utils/security/sanitization';
import { z } from 'zod';
import type { Order } from '@/types/order';

// Validation schema
const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  comment: z
    .string()
    .min(10, 'Review must be at least 10 characters')
    .max(500, 'Review must be at most 500 characters')
    .transform((val) => sanitizeStrict(val)),
});

export function useSellerReviews(username: string) {
  const { user } = useAuth();
  const {
    getReviewsForSeller,
    addReview,
    hasReviewed,
    getReviewStats,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useReviews();
  const { orderHistory } = useWallet();

  const sanitizedUsername = sanitizeUsername(username);

  // Form state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data state
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch reviews + stats
  useEffect(() => {
    const run = async () => {
      if (!sanitizedUsername) return;
      setIsLoading(true);
      try {
        const fetched = await getReviewsForSeller(sanitizedUsername);
        setReviews(fetched);
        const stats = await getReviewStats(sanitizedUsername);
        if (stats) setAverageRating(stats.avgRating);
      } catch (e) {
        console.error('Error fetching reviews:', e);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [sanitizedUsername, getReviewsForSeller, getReviewStats]);

  // Check purchases and prior review
  useEffect(() => {
    const run = async () => {
      if (!user?.username || !sanitizedUsername) {
        setHasPurchased(false);
        setAlreadyReviewed(false);
        setEligibleOrderId(null);
        return;
      }

      try {
        const ordersFromSeller = orderHistory.filter((order: Order) => {
          const isBuyer = order.buyer === user.username;
          const isSeller = order.seller === sanitizedUsername;
          return isBuyer && isSeller;
        });

        if (ordersFromSeller.length > 0) {
          setHasPurchased(true);

          // Derive an order id (fallback if missing)
          const oid =
            ordersFromSeller[0].id ||
            ordersFromSeller[0].listingId ||
            `order_${user.username}_${sanitizedUsername}_${Date.now()}`;
          setEligibleOrderId(oid);

          // Check if user has reviewed already (use fetched list)
          const existing = await getReviewsForSeller(sanitizedUsername);
          const reviewed = existing.some(
            (r: any) => r.reviewer === user.username
          );
          setAlreadyReviewed(reviewed);
        } else {
          setHasPurchased(false);
          setAlreadyReviewed(false);
          setEligibleOrderId(null);
        }
      } catch (e) {
        console.error('Error checking purchase/review status:', e);
        setHasPurchased(false);
        setAlreadyReviewed(false);
        setEligibleOrderId(null);
      }
    };
    run();
  }, [user?.username, sanitizedUsername, orderHistory, getReviewsForSeller]);

  // Auto-hide submitted banner
  useEffect(() => {
    if (!submitted) return;
    const to = setTimeout(() => setSubmitted(false), 3000);
    return () => clearTimeout(to);
  }, [submitted]);

  // Clear message on input change
  useEffect(() => {
    setValidationError('');
  }, [rating, comment]);

  // Bubble up errors from context
  useEffect(() => {
    if (reviewsError) setValidationError(reviewsError);
  }, [reviewsError]);

  const handleReviewSubmit = useCallback(async () => {
    if (!user?.username) {
      setValidationError('You must be logged in to submit a review');
      return;
    }

    const orderIdToUse =
      eligibleOrderId ||
      (hasPurchased
        ? `order_${user.username}_${sanitizedUsername}_${Date.now()}`
        : null);

    if (!orderIdToUse) {
      setValidationError('You must purchase from this seller before leaving a review');
      return;
    }

    // Validate review data
    const validation = reviewSchema.safeParse({ rating, comment });
    if (!validation.success) {
      setValidationError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    setValidationError('');

    try {
      const success = await addReview(sanitizedUsername, orderIdToUse, {
        rating: validation.data.rating,
        comment: validation.data.comment,
        asDescribed: true,
        fastShipping: true,
        wouldBuyAgain: true,
      });

      if (success) {
        setSubmitted(true);
        setComment('');
        setRating(5);
        setAlreadyReviewed(true);

        const updated = await getReviewsForSeller(sanitizedUsername);
        setReviews(updated);

        const stats = await getReviewStats(sanitizedUsername);
        if (stats) setAverageRating(stats.avgRating);
      } else {
        setValidationError('Failed to submit review. Please try again.');
      }
    } catch (e) {
      console.error('Error submitting review:', e);
      setValidationError('An error occurred while submitting your review');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    user?.username,
    eligibleOrderId,
    rating,
    comment,
    sanitizedUsername,
    hasPurchased,
    addReview,
    getReviewsForSeller,
    getReviewStats,
  ]);

  // Sanitize comment as user types (length-limited)
  const handleCommentChange = useCallback((value: string) => {
    setComment(value.slice(0, 600));
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
