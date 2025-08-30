// src/components/StarRating.tsx
'use client';

import { Star } from 'lucide-react';
import { useCallback, useState } from 'react';
import { sanitizeNumber } from '@/utils/security/sanitization';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const MIN_RATING = 0;
const MAX_RATING = 5;
const VALID_STARS = [1, 2, 3, 4, 5] as const;

export default function StarRating({
  rating,
  onRatingChange,
  interactive = false,
  size = 'md',
}: StarRatingProps) {
  // Validate and sanitize the rating
  const sanitizedRating = sanitizeNumber(rating, MIN_RATING, MAX_RATING, 0);

  // Prevent rapid clicks
  const [isProcessing, setIsProcessing] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  } as const;

  const containerClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  } as const;

  const safeSize = (['sm', 'md', 'lg'] as const).includes(size) ? size : 'md';

  const handleRatingChange = useCallback(
    (star: number) => {
      if (!interactive || !onRatingChange || isProcessing) return;

      // Validate star value
      if (!(VALID_STARS as readonly number[]).includes(star)) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Invalid star rating:', star);
        }
        return;
      }

      // Prevent rapid clicks
      setIsProcessing(true);

      try {
        onRatingChange(star);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error updating rating:', error);
        }
      } finally {
        // Reset processing state after a short delay
        setTimeout(() => setIsProcessing(false), 300);
      }
    },
    [interactive, onRatingChange, isProcessing]
  );

  return (
    <div className={`flex ${containerClasses[safeSize]}`} role="radiogroup" aria-label="Star rating">
      {VALID_STARS.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleRatingChange(star)}
          disabled={!interactive || isProcessing}
          className={`${
            interactive && !isProcessing ? 'cursor-pointer' : 'cursor-default'
          } focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:ring-opacity-50 rounded`}
          aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          aria-pressed={star <= sanitizedRating}
          role="radio"
          aria-checked={star === Math.round(sanitizedRating)}
        >
          <Star
            className={`${sizeClasses[safeSize]} ${
              star <= sanitizedRating ? 'fill-[#ff950e] text-[#ff950e]' : 'fill-gray-300 text-gray-300'
            } ${interactive && !isProcessing ? 'hover:fill-[#ff950e] hover:text-[#ff950e] transition-colors' : ''}`}
          />
        </button>
      ))}
    </div>
  );
}
