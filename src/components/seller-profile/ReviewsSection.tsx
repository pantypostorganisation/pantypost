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
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Reviews</h2>
        <div className="flex items-center justify-center gap-3 rounded-3xl border border-white/10 bg-black/40 py-10 text-gray-300">
          <Loader2 className="h-6 w-6 animate-spin text-[#ff950e]" />
          <span>Loading reviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Reviews</h2>
        <p className="text-sm text-gray-400 max-w-lg">
          Authentic experiences from verified buyers keep our community safe and intimate.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-black/40 py-12 text-center text-gray-400 shadow-inner shadow-black/40">
          <p className="text-lg">No reviews yet. Be the first to share your experience.</p>
        </div>
      ) : (
        <ul className="space-y-6">
          {reviews.map((review) => {
            const key = review._id || `${review.reviewer}-${review.date}`;
            const safeReviewer = sanitizeStrict(review.reviewer);
            const safeRating = clampRating(review.rating);
            const safeDate = formatDateSafe(review.date);

            return (
              <li
                key={key}
                className="rounded-3xl border border-white/10 bg-black/40 p-6 sm:p-8 shadow-[0_18px_50px_-35px_rgba(0,0,0,0.9)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <StarRating rating={safeRating} />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                      {safeDate}
                    </span>
                  </div>
                  <span className="text-sm text-gray-300">
                    Reviewed by <span className="font-semibold text-white">{safeReviewer || 'Anonymous'}</span>
                  </span>
                </div>

                <SecureMessageDisplay
                  content={review.comment}
                  className="mt-4 text-base leading-relaxed text-gray-200"
                  allowBasicFormatting={false}
                  maxLength={1000}
                />

                {(review.asDescribed !== undefined ||
                  review.fastShipping !== undefined ||
                  review.wouldBuyAgain !== undefined) && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {review.asDescribed && (
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        ✓ As Described
                      </span>
                    )}
                    {review.fastShipping && (
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        ✓ Fast Shipping
                      </span>
                    )}
                    {review.wouldBuyAgain && (
                      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                        ✓ Would Buy Again
                      </span>
                    )}
                  </div>
                )}

                {review.sellerResponse && (
                  <div className="mt-6 rounded-2xl border border-[#ff950e]/40 bg-[#ff950e]/10 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#ff950e]">
                      Seller Response
                    </p>
                    <SecureMessageDisplay
                      content={review.sellerResponse.text}
                      className="mt-2 text-sm text-orange-100/90"
                      allowBasicFormatting={false}
                      maxLength={500}
                    />
                    <p className="mt-3 text-xs text-[#ff950e]/70">{formatDateSafe(review.sellerResponse.date)}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canReview && (
        <div className="rounded-3xl border border-white/10 bg-black/50 p-6 sm:p-8" id="review-form">
          <h3 className="text-xl font-semibold text-white">Share Your Experience</h3>
          <p className="mt-1 text-sm text-gray-400">
            Reviews are anonymous to other buyers and help keep our marketplace trustworthy.
          </p>

          {submitted ? (
            <div className="mt-6 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-6 text-center text-emerald-200">
              <p className="text-lg font-semibold">✓ Review submitted successfully!</p>
              <p className="mt-2 text-sm text-emerald-100/80">Thank you for your feedback.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="text-sm font-medium text-gray-300">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => onRatingChange(Number(e.target.value))}
                  className="w-full sm:w-52 rounded-full border border-white/15 bg-black/60 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                  disabled={isSubmitting}
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {r} Star{r > 1 ? 's' : ''} {'★'.repeat(r)}
                    </option>
                  ))}
                </select>
              </div>

              <SecureTextarea
                label="Comment"
                value={comment}
                onChange={handleCommentChange}
                placeholder="Share what made this seller special..."
                rows={5}
                maxLength={500}
                characterCount={true}
                sanitize={true}
                sanitizer={sanitizeStrict}
                disabled={isSubmitting}
                error={validationError}
                className="[&_textarea]:bg-black/60 [&_textarea]:border-white/15 [&_textarea]:text-white"
              />

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-gray-400">
                <p className="font-semibold uppercase tracking-[0.2em] text-white/70">Your review highlights</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">✓ Item as described</span>
                  <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">✓ Fast shipping</span>
                  <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">✓ Would buy again</span>
                </div>
              </div>

              {validationError && (
                <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">
                  <p className="text-sm">{validationError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !comment || comment.trim().length < 10}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff950e] to-[#fb923c] px-8 py-3 text-base font-semibold text-black transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
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
