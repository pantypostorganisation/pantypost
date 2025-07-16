// src/hooks/profile/useSellerReviews.ts

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useReviews } from '@/context/ReviewContext';
import { sanitizeUsername, sanitizeStrict } from '@/utils/security/sanitization';
import { messageSchemas } from '@/utils/validation/schemas';
import { z } from 'zod';

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
  const { orderHistory } = useWallet();
  const { getReviewsForSeller, addReview, hasReviewed } = useReviews();

  // Sanitize username
  const sanitizedUsername = sanitizeUsername(username);

  // Review form state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  // Get reviews data
  const reviews = getReviewsForSeller(sanitizedUsername);
  
  const averageRating = useMemo(() => 
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : null,
    [reviews]
  );

  const hasPurchased = useMemo(() => 
    orderHistory.some(
      order => order.seller === sanitizedUsername && order.buyer === user?.username
    ),
    [orderHistory, sanitizedUsername, user?.username]
  );

  const alreadyReviewed = user?.username ? hasReviewed(sanitizedUsername, user.username) : false;

  // Auto-hide submitted message
  useEffect(() => {
    if (submitted) {
      const timeout = setTimeout(() => setSubmitted(false), 2000);
      return () => clearTimeout(timeout);
    }
    return; // Add explicit return for else case
  }, [submitted]);

  // Clear validation error when inputs change
  useEffect(() => {
    setValidationError('');
  }, [rating, comment]);

  // Handlers
  const handleReviewSubmit = () => {
    if (!user?.username) {
      setValidationError('You must be logged in to submit a review');
      return;
    }

    // Validate review data
    const validationResult = reviewSchema.safeParse({ rating, comment });
    
    if (!validationResult.success) {
      setValidationError(validationResult.error.errors[0].message);
      return;
    }

    // Add sanitized review
    addReview(sanitizedUsername, {
      reviewer: user.username,
      rating: validationResult.data.rating,
      comment: validationResult.data.comment,
      date: new Date().toISOString(),
    });

    setSubmitted(true);
    setComment('');
    setRating(5);
    setValidationError('');
  };

  // Sanitize comment input
  const handleCommentChange = (value: string) => {
    // Apply basic length limit to prevent excessive input
    const truncated = value.slice(0, 600);
    setComment(truncated);
  };

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
    
    // Handlers
    handleReviewSubmit,
  };
}
