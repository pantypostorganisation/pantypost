// src/components/seller-profile/ListingsGrid.tsx
'use client';

import Link from 'next/link';
import { Lock, Crown, Clock, ArrowRight } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice?: number;
  imageUrls?: string[];
  isPremium?: boolean;
  tags?: string[];
  hoursWorn?: number;
}

interface ListingsGridProps {
  standardListings: Listing[];
  premiumListings: Listing[];
  hasAccess: boolean | undefined;
  username: string;
  user: any;
  onShowSubscribeModal: () => void;
}

export default function ListingsGrid({
  standardListings,
  premiumListings,
  hasAccess,
  username,
  user,
  onShowSubscribeModal,
}: ListingsGridProps) {
  const allListings = [...standardListings, ...premiumListings];

  return (
    <div className="mt-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white">Listings by {username}</h2>
      {allListings.length === 0 ? (
        <div className="text-center py-10 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-700 text-gray-400 italic shadow-lg">
          <p className="text-lg mb-2">This seller has no active listings.</p>
          {user?.username === username && (
            <p className="text-sm mt-1">Go to <Link href="/sellers/my-listings" className="text-[#ff950e] hover:underline">My Listings</Link> to create one.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allListings.map((listing) => (
            <div
              key={listing.id}
              className="rounded-xl border border-gray-800 bg-[#1a1a1a] shadow-lg hover:shadow-xl transition relative flex flex-col overflow-hidden"
            >
              <div className="relative w-full h-56 overflow-hidden">
                <img
                  src={listing.imageUrls?.[0]}
                  alt={listing.title}
                  className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${listing.isPremium && !hasAccess ? 'blur-sm' : ''
                    }`}
                />
                {listing.isPremium && !hasAccess && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black bg-opacity-70 text-white font-bold rounded-xl p-4">
                    <Lock className="w-8 h-8 mb-2 text-[#ff950e]" />
                    <span className="text-lg mb-2">Premium Content</span>
                    <p className="text-sm text-gray-300 mb-4">Subscribe to {username} to unlock this listing.</p>
                    {user?.role === 'buyer' && user.username !== username && (
                      <button
                        onClick={onShowSubscribeModal}
                        className="bg-[#ff950e] text-black text-sm font-bold px-4 py-2 rounded-full hover:bg-[#e0850d] transition"
                      >
                        Subscribe Now
                      </button>
                    )}
                  </div>
                )}
                {listing.isPremium && hasAccess && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-[#ff950e] text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow">
                      <Crown className="w-4 h-4 mr-1" /> Premium
                    </span>
                  </div>
                )}
                {listing.hoursWorn !== undefined && listing.hoursWorn !== null && (
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {listing.hoursWorn} Hours Worn
                  </div>
                )}
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-white mb-2">{listing.title}</h3>
                <p className="text-sm text-gray-400 mb-3 line-clamp-2 flex-grow">
                  {listing.description}
                </p>
                {listing.tags && listing.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-auto mb-3">
                    {listing.tags.map((tag, idx) => (
                      <span key={idx} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-700">
                  <p className="text-[#ff950e] font-bold text-xl">
                    ${(listing.markedUpPrice || listing.price).toFixed(2)}
                  </p>
                  {(!listing.isPremium || hasAccess) && (
                    <Link
                      href={`/browse/${listing.id}`}
                      className="inline-flex items-center gap-1 text-sm bg-[#ff950e] text-black px-4 py-2 rounded-full hover:bg-[#e0850d] font-bold transition"
                    >
                      View <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
