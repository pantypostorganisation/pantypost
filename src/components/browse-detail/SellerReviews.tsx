// src/components/browse-detail/SellerReviews.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { reviewsService } from '@/services/reviews.service';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeUsername } from '@/utils/security/sanitization';

interface SellerReviewsProps {
  seller: string;
  /** How many to show inline. The rest live on the shop page. */
  limit?: number;
}

interface ReviewRow {
  _id?: string;
  reviewer: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

function formatDate(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

/**
 * Reviews are written about the SELLER, not the item — Review is keyed on
 * `reviewee`. Intimate garments are one-off pieces, so item-level reviews
 * would read zero on almost every listing. Showing the seller's record
 * here is both the honest mapping of the data and the more useful signal
 * for a buyer deciding whether to send money to a stranger.
 */
export default function SellerReviews({ seller, limit = 3 }: SellerReviewsProps) {
  const safeSeller = sanitizeUsername(seller);

  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!safeSeller) {
        setLoading(false);
        return;
      }

      try {
        const result = await reviewsService.getSellerReviews(safeSeller, 1, limit);
        if (cancelled) return;

        if (result.success && result.data) {
          setReviews((result.data.reviews || []) as ReviewRow[]);
          const stats = result.data.stats;
          setAvgRating(typeof stats?.avgRating === 'number' ? stats.avgRating : null);
          setTotalReviews(
            typeof stats?.totalReviews === 'number'
              ? stats.totalReviews
              : (result.data.reviews || []).length
          );
        }
      } catch (error) {
        console.error('[SellerReviews] Failed to load reviews:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [safeSeller, limit]);

  // Nothing to say yet. An empty reviews heading is worse than no
  // heading, so the whole block stays out of the layout.
  if (loading || totalReviews === 0 || reviews.length === 0) return null;

  return (
    <section className="border-t border-line pt-5">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-ink">Reviews for {safeSeller}</h2>

        {avgRating !== null && avgRating > 0 && (
          <span className="inline-flex items-center gap-1 text-sm text-ink-muted">
            <Star className="h-3.5 w-3.5 fill-primary text-primary" />
            <span className="font-semibold text-ink">{avgRating.toFixed(1)}</span>
            <span>
              ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </span>
        )}
      </div>

      <ul className="space-y-3">
        {reviews.map((review, index) => (
          <li
            key={review._id || `${review.reviewer}-${index}`}
            className="rounded-md bg-surface-raised p-3"
          >
            <div className="mb-1.5 flex items-center gap-2">
              <div className="flex" aria-label={`${review.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= review.rating
                        ? 'fill-primary text-primary'
                        : 'fill-transparent text-ink-faint'
                    }`}
                  />
                ))}
              </div>
              <span className="truncate text-xs text-ink-muted">{review.reviewer}</span>
              {review.createdAt && (
                <>
                  <span className="text-ink-faint">·</span>
                  <span className="shrink-0 text-xs text-ink-faint">
                    {formatDate(review.createdAt)}
                  </span>
                </>
              )}
            </div>

            <SecureMessageDisplay
              content={review.comment}
              allowBasicFormatting={false}
              className="line-clamp-3 text-sm leading-relaxed text-ink-muted"
            />
          </li>
        ))}
      </ul>

      {totalReviews > reviews.length && (
        <Link
          href={`/sellers/${safeSeller}`}
          className="mt-3 inline-flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          See all {totalReviews} reviews
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}
