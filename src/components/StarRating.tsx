// src/components/StarRating.tsx
'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ 
  rating, 
  onRatingChange, 
  interactive = false, 
  size = 'md' 
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const containerClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5'
  };

  return (
    <div className={`flex ${containerClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRatingChange?.(star)}
          disabled={!interactive}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'fill-[#ff950e] text-[#ff950e]' 
                : 'fill-gray-300 text-gray-300'
            } ${interactive ? 'hover:fill-[#ff950e] hover:text-[#ff950e]' : ''}`}
          />
        </button>
      ))}
    </div>
  );
}
