// src/components/StarRating.tsx
'use client';

import { Star } from 'lucide-react';
import { useCallback, useState } from 'react';

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
  // DON'T use sanitizeNumber - it's rounding! Just clamp the value instead
  const clampedRating = Math.max(MIN_RATING, Math.min(MAX_RATING, rating || 0));
  
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
      {VALID_STARS.map((star) => {
        // Calculate fill for this star
        const fillAmount = Math.max(0, Math.min(1, clampedRating - (star - 1)));
        const isPartiallyFilled = fillAmount > 0 && fillAmount < 1;
        const isFullyFilled = fillAmount >= 1;
        
        const starElement = (
          <div key={star} className="relative inline-block">
            {/* Base gray star - always visible */}
            <Star
              className={`${sizeClasses[safeSize]} fill-gray-300 text-gray-300`}
            />
            
            {/* Orange overlay - width based on fill amount */}
            {fillAmount > 0 && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{
                  width: `${fillAmount * 100}%`
                }}
              >
                <Star
                  className={`${sizeClasses[safeSize]} fill-[#ff950e] text-[#ff950e]`}
                />
              </div>
            )}
          </div>
        );

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(star)}
              disabled={!interactive || isProcessing}
              className={`${
                interactive && !isProcessing ? 'cursor-pointer' : 'cursor-default'
              } focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:ring-opacity-50 rounded`}
              aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              aria-pressed={star <= clampedRating}
              role="radio"
              aria-checked={star === Math.round(clampedRating)}
            >
              {starElement}
            </button>
          );
        }

        return starElement;
      })}
    </div>
  );
}
