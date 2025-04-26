'use client';

import {
  FaStar as FullStar,
  FaStarHalfAlt as HalfStar,
  FaRegStar as EmptyStar,
} from 'react-icons/fa';

type StarRatingProps = {
  rating: number;
  size?: 'sm' | 'md'; // optional size prop
};

export default function StarRating({ rating, size = 'md' }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  // Only show half star if decimal is >= 0.4
  const decimal = rating - fullStars;
  const hasHalfStar = decimal >= 0.4;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const iconClass = size === 'sm' ? 'text-xs' : 'text-base';

  return (
    <div className={`flex items-center text-yellow-500 ${iconClass}`}>
      {Array.from({ length: fullStars }).map((_, i) => (
        <FullStar key={`full-${i}`} />
      ))}
      {hasHalfStar && <HalfStar key="half" />}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <EmptyStar key={`empty-${i}`} />
      ))}
    </div>
  );
}
