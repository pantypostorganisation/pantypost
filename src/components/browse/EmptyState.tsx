// src/components/browse/EmptyState.tsx
'use client';

import { ShoppingBag } from 'lucide-react';
import { EmptyStateProps } from '@/types/browse';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function EmptyState({ searchTerm, onResetFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-24 bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-2xl border border-gray-800 shadow-2xl">
      <div className="mb-6">
        <ShoppingBag className="w-20 h-20 text-gray-600 mx-auto mb-4" />
        <div className="w-24 h-1 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] mx-auto rounded-full mb-6"></div>
      </div>
      <h3 className="text-white font-bold text-2xl mb-3">No listings found</h3>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        {searchTerm ? (
          <>
            We couldn't find any listings matching "<SecureMessageDisplay 
              content={searchTerm} 
              allowBasicFormatting={false}
              className="inline font-semibold text-[#ff950e]"
            />". Try adjusting your filters or check back later for new items.
          </>
        ) : (
          'We couldn\'t find any listings matching your criteria. Try adjusting your filters or check back later for new items.'
        )}
      </p>
      <button
        onClick={onResetFilters}
        className="px-8 py-3 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-black rounded-xl font-bold hover:from-[#e88800] hover:to-[#ff950e] transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        Reset All Filters
      </button>
    </div>
  );
}
