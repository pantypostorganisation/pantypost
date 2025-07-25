// src/components/browse-detail/ProductInfo.tsx
'use client';

import { Clock } from 'lucide-react';
import { ProductInfoProps } from '@/types/browseDetail';

export default function ProductInfo({ listing }: ProductInfoProps) {
  return (
    <>
      {/* Title & Basic Info */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">{listing.title}</h1>
        
        {/* Tags */}
        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {listing.tags.map((tag, i) => (
              <span 
                key={i} 
                className="bg-gray-800 text-gray-300 text-xs px-2.5 py-1 rounded-full border border-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Hours Worn */}
        {listing.hoursWorn !== undefined && listing.hoursWorn !== null && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{listing.hoursWorn} hours worn</span>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <h3 className="text-base font-semibold text-white mb-2">Description</h3>
        <p className="text-gray-300 text-sm leading-relaxed">{listing.description}</p>
      </div>
    </>
  );
}