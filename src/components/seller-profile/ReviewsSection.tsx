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

function safeAvgDisplay(reviews: Review[]): number | null {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return null;
  }

  const rated = reviews.map((review) => clampRating(review.rating)).filter((value) => value > 0);
  if (rated.length === 0) {
    return null;
  }

  const total = rated.reduce((sum, value) => sum + value, 0);
  return Number.isFinite(total) ? total / rated.length : null;
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
      <section className="mt-16">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Buyer impressions</h2>
            <p className="mt-2 text-sm text-gray-400">We&apos;re fetching the latest whispers from admirers.</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-gray-300 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff950e]" />
          <span>Loading reviews...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[#ff950e]">Social proof</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white">Reviews from paying admirers</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-2xl">
            Every review is verified through a completed purchase so you can feel confident subscribing.
          </p>
        </div>
        {safeAvgDisplay(reviews) && (
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-gray-200">
            <StarRating rating={safeAvgDisplay(reviews)} />
            <span>{safeAvgDisplay(reviews)?.toFixed(1)} average</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="mt-8 text-center text-gray-400">
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-12 backdrop-blur-sm">
            <p className="text-lg font-medium text-white">No reviews yet.</p>
            <p className="mt-2 text-sm text-gray-400">Be the first admirer to leave feedback after purchasing.</p>
          </div>
        </div>
      ) : (
        <ul className="mt-8 space-y-6">
          {reviews.map((review) => {
            const key = review._id || `${review.reviewer}-${review.date}`;
            const safeReviewer = sanitizeStrict(review.reviewer);
            const safeRating = clampRating(review.rating);
            const safeDate = formatDateSafe(review.date);

            return (
              <li key={key} className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-[0_25px_60px_rgba(0,0,0,0.4)] backdrop-blur">
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                  <StarRating rating={safeRating} />
                  <span>
                    by <span className="font-semibold text-white">{safeReviewer || 'Anonymous'}</span>
                  </span>
                  <span className="text-gray-500">{safeDate}</span>
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
                  <div className="mt-5 flex flex-wrap gap-2">
                    {review.asDescribed && (
                      <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">✓ As Described</span>
                    )}
                    {review.fastShipping && (
                      <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">✓ Fast Shipping</span>
                    )}
                    {review.wouldBuyAgain && (
                      <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">✓ Would Buy Again</span>
                    )}
                  </div>
                )}

                {review.sellerResponse && (
                  <div className="mt-6 rounded-2xl border border-[#ff950e]/30 bg-[#ff950e]/5 p-5 text-sm text-gray-200">
                    <p className="mb-2 font-semibold text-[#ff950e]">Seller Response</p>
                    <SecureMessageDisplay
                      content={review.sellerResponse.text}
                      className="text-sm text-gray-100"
                      allowBasicFormatting={false}
                      maxLength={500}
                    />
                    <p className="mt-2 text-xs text-[#ff950e]/70">{formatDateSafe(review.sellerResponse.date)}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canReview && (
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur" id="review-form">
          <h3 className="text-2xl font-semibold text-white">Share your experience</h3>
          <p className="mt-1 text-sm text-gray-400">Only buyers who have completed a purchase can leave a review.</p>

          {submitted ? (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-500/40 bg-green-500/10 p-6 text-sm text-green-100">
              <span className="text-2xl">✓</span>
              <div>
                <p className="text-base font-semibold text-green-200">Review submitted successfully!</p>
                <p className="mt-1 text-sm text-green-200/70">Thank you for supporting the community.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                <label className="text-sm font-medium text-gray-200">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => onRatingChange(Number(e.target.value))}
                  className="w-full max-w-[220px] rounded-full border border-white/10 bg-black/50 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
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
                placeholder="Tell other buyers what made this experience unforgettable..."
                rows={5}
                maxLength={500}
                characterCount={true}
                sanitize={true}
                sanitizer={sanitizeStrict}
                disabled={isSubmitting}
                error={validationError}
              />

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-gray-300">
                <p className="mb-2 font-semibold text-gray-200">What we highlight</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/5 px-3 py-1 font-medium text-gray-200">✓ Item as described</span>
                  <span className="rounded-full bg-white/5 px-3 py-1 font-medium text-gray-200">✓ Fast shipping</span>
                  <span className="rounded-full bg-white/5 px-3 py-1 font-medium text-gray-200">✓ Would buy again</span>
                </div>
              </div>

              {validationError && (
                <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                  {validationError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !comment || comment.trim().length < 10}
                className="inline-flex items-center gap-2 rounded-full bg-[#ff950e] px-8 py-3 text-base font-semibold text-black shadow-lg shadow-[#ff950e33] transition hover:bg-[#e0850d] disabled:cursor-not-allowed disabled:opacity-60"
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
    </section>
  );
}
