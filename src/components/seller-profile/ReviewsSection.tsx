// src/components/seller-profile/ReviewsSection.tsx
'use client';

import { Loader2 } from 'lucide-react';
import { SecureTextarea } from '@/components/ui/SecureInput';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict } from '@/utils/security/sanitization';
import StarRating from '@/components/StarRating';
import { z } from 'zod';

const ReviewSchema = z.object({
  _id: z.string().optional(),
  reviewer: z.string().default('Anonymous'),
  rating: z.number().min(0).max(5).catch(0),
  comment: z.string().default(''),
  date: z.string().default(''),
  asDescribed: z.boolean().optional(),
  fastShipping: z.boolean().optional(),
  wouldBuyAgain: z.boolean().optional(),
  sellerResponse: z
    .object({
      text: z.string().default(''),
      date: z.string().default(''),
    })
    .optional(),
});

const PropsSchema = z.object({
  reviews: z.array(ReviewSchema).default([]),
  canReview: z.boolean().default(false),
  rating: z.number().min(0).max(5).catch(0),
  comment: z.string().default(''),
  submitted: z.boolean().default(false),
  validationError: z.string().optional(),
  isSubmitting: z.boolean().optional(),
  isLoading: z.boolean().optional(),
  onRatingChange: z.function().args(z.number()).returns(z.void()),
  onCommentChange: z.function().args(z.string()).returns(z.void()),
  onSubmit: z.function().args().returns(z.void()),
});

interface Review extends z.infer<typeof ReviewSchema> {}
interface ReviewsSectionProps extends z.infer<typeof PropsSchema> {}

function formatDateSafe(input: string): string {
  const d = new Date(input);
  return Number.isFinite(d.getTime()) ? d.toLocaleDateString() : 'Unknown date';
}

// Clamp to 0–5 for display (StarRating can accept decimals if your component supports it)
function clampRating(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, n));
}

export default function ReviewsSection(rawProps: ReviewsSectionProps) {
  const parsed = PropsSchema.safeParse(rawProps);
  const {
    reviews = [],
    canReview = false,
    rating = 0,
    comment = '',
    submitted = false,
    validationError,
    isSubmitting = false,
    isLoading = false,
    onRatingChange,
    onCommentChange,
    onSubmit,
  } = parsed.success
    ? parsed.data
    : {
        reviews: [],
        canReview: false,
        rating: 0,
        comment: '',
        submitted: false,
        isSubmitting: false,
        isLoading: false,
        onRatingChange: () => {},
        onCommentChange: () => {},
        onSubmit: () => {},
      };

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
        <div className="flex items-center justify-center py-10 bg-surface-raised rounded-md border border-line">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-ink-muted">Loading reviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Reviews</h2>

      {reviews.length === 0 ? (
        <div className="text-center py-10 bg-surface-raised rounded-md border border-dashed border-line text-ink-muted italic shadow-lg">
          <p className="text-lg">No reviews yet.</p>
        </div>
      ) : (
        <ul className="space-y-6 mb-8">
          {reviews.map((review) => {
            const key = review._id || `${review.reviewer}-${review.date}`;
            const safeReviewer = sanitizeStrict(review.reviewer);
            const safeRating = clampRating(review.rating);
            const safeDate = formatDateSafe(review.date);

            return (
              <li key={key} className="bg-surface-raised border border-line rounded-md p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <StarRating rating={safeRating} />
                  <span className="text-ink-muted text-sm">
                    by <span className="font-semibold text-white">{safeReviewer || 'Anonymous'}</span> on {safeDate}
                  </span>
                </div>

                <SecureMessageDisplay
                  content={review.comment}
                  className="text-base text-ink-muted leading-relaxed mb-3"
                  allowBasicFormatting={false}
                  maxLength={1000}
                />

                {(review.asDescribed !== undefined ||
                  review.fastShipping !== undefined ||
                  review.wouldBuyAgain !== undefined) && (
                  <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-line">
                    {review.asDescribed && (
                      <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-md">✓ As Described</span>
                    )}
                    {review.fastShipping && (
                      <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-md">✓ Fast Shipping</span>
                    )}
                    {review.wouldBuyAgain && (
                      <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-md">✓ Would Buy Again</span>
                    )}
                  </div>
                )}

                {review.sellerResponse && (
                  <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border-l-4 border-primary">
                    <p className="text-sm font-semibold text-primary mb-2">Seller Response:</p>
                    <SecureMessageDisplay
                      content={review.sellerResponse.text}
                      className="text-sm text-ink-muted"
                      allowBasicFormatting={false}
                      maxLength={500}
                    />
                    <p className="text-xs text-ink-faint mt-2">{formatDateSafe(review.sellerResponse.date)}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canReview && (
        <div className="border-t border-line pt-8 mt-8" id="review-form">
          <h3 className="text-xl font-bold mb-4 text-white">Leave a Review</h3>

          {submitted ? (
            <div className="p-6 bg-green-900/20 border border-green-600 rounded-md">
              <p className="text-green-500 text-lg font-semibold flex items-center">
                <span className="text-2xl mr-2">✓</span>
                Review submitted successfully!
              </p>
              <p className="text-ink-muted text-sm mt-2">Thank you for your feedback.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-ink-muted mb-2">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => onRatingChange(Number(e.target.value))}
                  className="block w-full max-w-[200px] border border-line rounded-lg px-3 py-2 bg-surface text-white focus:outline-none focus:ring-2 focus:ring-primary"
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

              {/* Additional options (informational only) */}
              <div className="mb-6 space-y-2">
                <p className="text-sm text-ink-muted mb-2">Your review will include:</p>
                <div className="flex flex-wrap gap-3">
                  <span className="text-xs bg-gray-800 text-ink-muted px-3 py-1 rounded-md">✓ Item as described</span>
                  <span className="text-xs bg-gray-800 text-ink-muted px-3 py-1 rounded-md">✓ Fast shipping</span>
                  <span className="text-xs bg-gray-800 text-ink-muted px-3 py-1 rounded-md">✓ Would buy again</span>
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
                className="bg-primary text-black px-6 py-3 rounded-md hover:bg-primary-press font-bold transition text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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