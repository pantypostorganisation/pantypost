/// src/components/buyers/dashboard/FeaturedListings.tsx
'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag, ChevronRight } from 'lucide-react';
import { FeaturedListingsProps } from '@/types/dashboard';

// This component is no longer used but kept for potential future use
export default function FeaturedListings({ listings }: FeaturedListingsProps) {
  if (listings.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Recommended For You</h2>
        <Link 
          href="/browse"
          className="text-[#ff950e] hover:text-[#e88800] font-medium flex items-center gap-2 text-sm"
        >
          Browse All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/browse/${listing.id}`}
            className="bg-[#111111] rounded-lg overflow-hidden hover:ring-2 hover:ring-[#ff950e] transition-all group"
          >
            {listing.images && listing.images.length > 0 ? (
              <div className="aspect-[4/3] overflow-hidden bg-gray-900">
                <img 
                  src={listing.images[0]} 
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] bg-gray-900 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-gray-700" />
              </div>
            )}
            
            <div className="p-4">
              <h3 className="font-medium text-white mb-1 line-clamp-1 group-hover:text-[#ff950e] transition-colors">
                {listing.title}
              </h3>
              <p className="text-sm text-gray-500 mb-2">by {listing.seller}</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-[#ff950e]">
                  ${(listing.price * 1.1).toFixed(2)}
                </p>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#ff950e] transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}