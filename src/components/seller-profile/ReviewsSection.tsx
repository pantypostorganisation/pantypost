// src/components/seller-profile/ReviewsSection.tsx
'use client';

import { Star } from 'lucide-react';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import StarRating from '@/components/StarRating';

interface Review {
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
}

interface ReviewsSectionProps {
  reviews: Review[];
  canReview: boolean;
  rating: number;
  comment: string;
  submitted: boolean;
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
  onRatingChange,
  onCommentChange,
  onSubmit,
}: ReviewsSectionProps) {
  const handleCommentChange = (value: string) => {
    // Sanitize comment input
    const sanitizedValue = sanitizeStrict(value);
    onCommentChange(sanitizedValue);
  };

  return (
    <div className="mt-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Reviews</h2>
      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-700 text-gray-400 italic shadow-lg">
          <p className="text-lg">No reviews yet.</p>
        </div>
      ) : (
        <ul className="space-y-6 mb-8">
          {reviews.map((review, i) => (
            <li key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <StarRating rating={review.rating} />
                <span className="text-gray-400 text-sm">
                  by <span className="font-semibold text-white">{review.reviewer}</span> on{' '}
                  {new Date(review.date).toLocaleDateString()}
                </span>
              </div>
              <SecureMessageDisplay 
                content={review.comment}
                className="text-base text-gray-300 leading-relaxed"
                allowBasicFormatting={false}
                maxLength={1000}
              />
            </li>
          ))}
        </ul>
      )}
      {canReview && (
        <div className="border-t border-gray-700 pt-8 mt-8" id="review-form">
          <h3 className="text-xl font-bold mb-4 text-white">Leave a Review</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
            <select
              value={rating}
              onChange={(e) => onRatingChange(Number(e.target.value))}
              className="block w-full max-w-[100px] border border-gray-700 rounded-lg px-3 py-2 bg-black text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            >
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>
                  {r} Star{r > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <SecureTextarea
              label="Comment"
              value={comment}
              onChange={handleCommentChange}
              placeholder="Share your experience..."
              rows={4}
              maxLength={1000}
              characterCount={true}
              sanitize={true}
              sanitizer={sanitizeStrict}
            />
          </div>
          <button
            onClick={onSubmit}
            className="bg-[#ff950e] text-black px-6 py-3 rounded-full hover:bg-[#e0850d] font-bold transition text-lg"
          >
            Submit Review
          </button>
          {submitted && (
            <p className="text-green-500 mt-4 text-sm font-semibold">
              ✅ Review submitted successfully!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
