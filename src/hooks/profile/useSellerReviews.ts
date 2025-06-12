// src/hooks/profile/useSellerReviews.ts
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useReviews } from '@/context/ReviewContext';

export function useSellerReviews(username: string) {
  const { user } = useAuth();
  const { orderHistory } = useWallet();
  const { getReviewsForSeller, addReview, hasReviewed } = useReviews();

  // Review form state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Get reviews data
  const reviews = getReviewsForSeller(username);
  
  const averageRating = useMemo(() => 
    reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : null,
    [reviews]
  );

  const hasPurchased = useMemo(() => 
    orderHistory.some(
      order => order.seller === username && order.buyer === user?.username
    ),
    [orderHistory, username, user?.username]
  );

  const alreadyReviewed = user?.username ? hasReviewed(username, user.username) : false;

  // Auto-hide submitted message
  useEffect(() => {
    if (submitted) {
      const timeout = setTimeout(() => setSubmitted(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [submitted]);

  // Handlers
  const handleReviewSubmit = () => {
    if (!user?.username || rating < 1 || rating > 5 || !comment.trim()) return;
    addReview(username, {
      reviewer: user.username,
      rating,
      comment,
      date: new Date().toISOString(),
    });
    setSubmitted(true);
    setComment('');
    setRating(5);
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
    setComment,
    submitted,
    
    // Handlers
    handleReviewSubmit,
  };
}