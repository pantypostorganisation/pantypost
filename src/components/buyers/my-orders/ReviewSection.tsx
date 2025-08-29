// src/components/buyers/my-orders/ReviewSection.tsx
'use client';

import { useState, useEffect } from 'react';
import { Star, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useReviews } from '@/context/ReviewContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { SecureTextarea } from '@/components/ui/SecureInput';
import StarRating from '@/components/StarRating';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { Order } from '@/context/WalletContext';

interface ReviewSectionProps {
  order: Order;
}

export default function ReviewSection({ order }: ReviewSectionProps) {
  const { user } = useAuth();
  const { addReview, hasReviewed, isLoading } = useReviews();
  const { showToast } = useToast();
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hasBeenReviewed, setHasBeenReviewed] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [asDescribed, setAsDescribed] = useState(true);
  const [fastShipping, setFastShipping] = useState(true);
  const [wouldBuyAgain, setWouldBuyAgain] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();

  // Check if order can be reviewed
  useEffect(() => {
    const checkReviewStatus = async () => {
      // Only buyers can review
      if (!user || order.buyer !== user.username) {
        setCanReview(false);
        return;
      }

      // Generate order ID if not present (for compatibility)
      const orderId = order.id || `order_${order.buyer}_${order.seller}_${Date.now()}`;

      // Check if already reviewed
      const reviewed = await hasReviewed(orderId);
      setHasBeenReviewed(reviewed);

      // Can review if order is shipped or delivered and not already reviewed
      // FIXED: Cast to any to handle the delivered status that might not be in the type definition
      const canDoReview = (order.shippingStatus === 'shipped' || (order.shippingStatus as any) === 'delivered') && !reviewed;
      setCanReview(canDoReview);
    };

    checkReviewStatus();
  }, [order, user, hasReviewed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!comment || comment.trim().length < 10) {
      setValidationError('Review must be at least 10 characters');
      return;
    }

    if (comment.length > 500) {
      setValidationError('Review must be less than 500 characters');
      return;
    }

    setIsSubmitting(true);
    setValidationError(undefined);

    try {
      // Generate order ID if not present
      const orderId = order.id || `order_${order.buyer}_${order.seller}_${Date.now()}`;
      
      const success = await addReview(order.seller, orderId, {
        rating,
        comment: comment.trim(),
        asDescribed,
        fastShipping,
        wouldBuyAgain,
      });

      if (success) {
        showToast({
          type: 'success',
          title: 'Review submitted successfully!',
        });
        setHasBeenReviewed(true);
        setShowReviewForm(false);
      } else {
        setValidationError('Failed to submit review. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      setValidationError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show anything if not the buyer
  if (!user || order.buyer !== user.username) {
    return null;
  }

  // Show review submitted state
  if (hasBeenReviewed) {
    return (
      <div className="mt-4 p-4 bg-green-900/20 border border-green-600/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-green-400 font-semibold">Review Submitted</span>
        </div>
        <p className="text-xs text-green-300/80 mt-1">
          Thank you for reviewing this seller!
        </p>
      </div>
    );
  }

  // Show review button or form
  if (!canReview) {
    // Order not eligible for review yet
    if (order.shippingStatus === 'pending' || order.shippingStatus === 'processing') {
      return (
        <div className="mt-4 p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">You can review this order after it's shipped</span>
          </div>
        </div>
      );
    }
    return null;
  }

  if (!showReviewForm) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setShowReviewForm(true)}
          className="w-full bg-gradient-to-r from-purple-600/20 to-purple-500/20 hover:from-purple-600/30 hover:to-purple-500/30 text-purple-300 py-2.5 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 border border-purple-600/30 hover:border-purple-500/50"
        >
          <Star className="w-4 h-4" />
          Write a Review
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4 p-5 bg-purple-900/10 border border-purple-700/30 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500" />
          Write a Review
        </h3>
        <button
          onClick={() => setShowReviewForm(false)}
          className="text-gray-400 hover:text-white transition p-1"
          aria-label="Close review form"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Rating */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1.5">
            Overall Rating
          </label>
          <div className="flex items-center gap-3">
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="bg-black/50 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isSubmitting}
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} Star{r > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <StarRating rating={rating} size="sm" />
          </div>
        </div>

        {/* Comment */}
        <div>
          <SecureTextarea
            label="Your Review"
            value={comment}
            onChange={(value) => setComment(sanitizeStrict(value))}
            placeholder="Share your experience..."
            rows={3}
            maxLength={500}
            characterCount={true}
            sanitize={true}
            sanitizer={sanitizeStrict}
            disabled={isSubmitting}
            error={validationError}
            className="!text-sm"
          />
        </div>

        {/* Additional options */}
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={asDescribed}
              onChange={(e) => setAsDescribed(e.target.checked)}
              disabled={isSubmitting}
              className="w-3.5 h-3.5 text-purple-600 bg-black border-gray-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs text-gray-300">As described</span>
          </label>
          
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={fastShipping}
              onChange={(e) => setFastShipping(e.target.checked)}
              disabled={isSubmitting}
              className="w-3.5 h-3.5 text-purple-600 bg-black border-gray-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs text-gray-300">Fast shipping</span>
          </label>
          
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={wouldBuyAgain}
              onChange={(e) => setWouldBuyAgain(e.target.checked)}
              disabled={isSubmitting}
              className="w-3.5 h-3.5 text-purple-600 bg-black border-gray-600 rounded focus:ring-purple-500"
            />
            <span className="text-xs text-gray-300">Would buy again</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => setShowReviewForm(false)}
            disabled={isSubmitting}
            className="flex-1 bg-gray-700/50 hover:bg-gray-700/70 text-white py-2 px-3 rounded-lg font-medium transition disabled:opacity-50 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !comment || comment.trim().length < 10}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white py-2 px-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}