// src/components/myListings/ListingTypeSelector.tsx
'use client';

import { Tag, Gavel } from 'lucide-react';

interface ListingTypeSelectorProps {
  isAuction: boolean;
  isVerified: boolean;
  onChange: (isAuction: boolean) => void;
}

export default function ListingTypeSelector({ 
  isAuction, 
  isVerified, 
  onChange 
}: ListingTypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">Listing Type</label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`p-4 rounded-lg border-2 transition ${
            !isAuction
              ? 'border-[#ff950e] bg-[#ff950e]/10 text-[#ff950e]'
              : 'border-gray-700 bg-black text-gray-400 hover:border-gray-600'
          }`}
        >
          <Tag className="w-6 h-6 mx-auto mb-2" />
          <div className="font-medium">Standard Listing</div>
          <div className="text-xs mt-1 opacity-80">Fixed price sale</div>
        </button>

        <button
          type="button"
          onClick={() => isVerified && onChange(true)}
          disabled={!isVerified}
          className={`p-4 rounded-lg border-2 transition ${
            isAuction
              ? 'border-purple-500 bg-purple-500/10 text-purple-500'
              : isVerified
              ? 'border-gray-700 bg-black text-gray-400 hover:border-gray-600'
              : 'border-gray-800 bg-gray-900/50 text-gray-600 cursor-not-allowed'
          }`}
        >
          <Gavel className="w-6 h-6 mx-auto mb-2" />
          <div className="font-medium">Auction</div>
          <div className="text-xs mt-1 opacity-80">
            {isVerified ? 'Competitive bidding' : 'Verified sellers only'}
          </div>
        </button>
      </div>
    </div>
  );
}
