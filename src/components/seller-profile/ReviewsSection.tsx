// src/components/seller-profile/ReviewsSection.tsx
'use client';

import { Star, Loader2 } from 'lucide-react';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import StarRating from '@/components/StarRating';

interface Review {
  _id?: string;
  reviewer: string;
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
}

interface ReviewsSectionProps {
  reviews: Review[];
  canReview: boolean;
  rating: number;
  comment: string;
  submitted: boolean;
  validationError?: string;
  isSubmitting?: boolean;
  isLoading?: boolean;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
}

export default function ReviewsSection({
  reviews,
  canReview,
  rating,
  comment,
  submitted,
  validationError,
  isSubmitting = false,
  isLoading = false,
  onRatingChange,
  onCommentChange,
  onSubmit,
}: ReviewsSectionProps) {
  const handleCommentChange = (value: string) => {
    // Sanitize comment input
    const sanitizedValue = sanitizeStrict(value);
    onCommentChange(sanitizedValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  if (isLoading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Reviews</h2>
        <div className="flex items-center justify-center py-10 bg-[#1a1a1a] rounded-xl border border-gray-800">
          <Loader2 className="w-8 h-8 animate-spin text-[#ff950e]" />
          <span className="ml-3 text-gray-400">Loading reviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Reviews</h2>
      
      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-700 text-gray-400 italic shadow-lg">
          <p className="text-lg">No reviews yet.</p>
        </div>
      ) : (
        <ul className="space-y-6 mb-8">
          {reviews.map((review) => (
            <li key={review._id || `${review.reviewer}-${review.date}`} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <StarRating rating={review.rating} />
                <span className="text-gray-400 text-sm">
                  by <span className="font-semibold text-white">{review.reviewer}</span> on{' '}
                  {new Date(review.date).toLocaleDateString()}
                </span>
              </div>
              
              <SecureMessageDisplay 
                content={review.comment}
                className="text-base text-gray-300 leading-relaxed mb-3"
                allowBasicFormatting={false}
                maxLength={1000}
              />
              
              {/* Additional review details */}
              {(review.asDescribed !== undefined || review.fastShipping !== undefined || review.wouldBuyAgain !== undefined) && (
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-700">
                  {review.asDescribed && (
                    <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full">
                      ✓ As Described
                    </span>
                  )}
                  {review.fastShipping && (
                    <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full">
                      ✓ Fast Shipping
                    </span>
                  )}
                  {review.wouldBuyAgain && (
                    <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full">
                      ✓ Would Buy Again
                    </span>
                  )}
                </div>
              )}
              
              {/* Seller response */}
              {review.sellerResponse && (
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border-l-4 border-[#ff950e]">
                  <p className="text-sm font-semibold text-[#ff950e] mb-2">Seller Response:</p>
                  <SecureMessageDisplay 
                    content={review.sellerResponse.text}
                    className="text-sm text-gray-300"
                    allowBasicFormatting={false}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(review.sellerResponse.date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      
      {canReview && (
        <div className="border-t border-gray-700 pt-8 mt-8" id="review-form">
          <h3 className="text-xl font-bold mb-4 text-white">Leave a Review</h3>
          
          {submitted ? (
            <div className="p-6 bg-green-900/20 border border-green-600 rounded-xl">
              <p className="text-green-500 text-lg font-semibold flex items-center">
                <span className="text-2xl mr-2">✓</span>
                Review submitted successfully!
              </p>
              <p className="text-gray-400 text-sm mt-2">Thank you for your feedback.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => onRatingChange(Number(e.target.value))}
                  className="block w-full max-w-[200px] border border-gray-700 rounded-lg px-3 py-2 bg-black text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  disabled={isSubmitting}
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} Star{r > 1 ? 's' : ''} {'★'.repeat(r)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <SecureTextarea
                  label="Comment"
                  value={comment}
                  onChange={handleCommentChange}
                  placeholder="Share your experience with this seller..."
                  rows={4}
                  maxLength={500}
                  characterCount={true}
                  sanitize={true}
                  sanitizer={sanitizeStrict}
                  disabled={isSubmitting}
                  error={validationError}
                />
              </div>
              
              {/* Additional options */}
              <div className="mb-6 space-y-2">
                <p className="text-sm text-gray-400 mb-2">Your review will include:</p>
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                    ✓ Item as described
                  </span>
                  <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                    ✓ Fast shipping
                  </span>
                  <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">
                    ✓ Would buy again
                  </span>
                </div>
              </div>
              
              {validationError && (
                <div className="p-3 bg-red-900/20 border border-red-600 rounded-lg">
                  <p className="text-red-500 text-sm">{validationError}</p>
                </div>
              )}
              
              <button
                type="submit"
                disabled={isSubmitting || !comment || comment.trim().length < 10}
                className="bg-[#ff950e] text-black px-6 py-3 rounded-full hover:bg-[#e0850d] font-bold transition text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
