// src/components/myListings/ListingTypeSelector.tsx
'use client';

import { Sparkles, Gavel, LockIcon } from 'lucide-react';
import Link from 'next/link';

interface ListingTypeSelectorProps {
  isAuction: boolean;
  isVerified: boolean;
  onChange: (isAuction: boolean) => void;
}

export default function ListingTypeSelector({ isAuction, isVerified, onChange }: ListingTypeSelectorProps) {
  return (
    <div className="bg-[#121212] p-4 rounded-lg border border-gray-700">
      <h3 className="text-lg font-medium mb-3 text-white">Listing Type</h3>
      <div className="flex flex-col sm:flex-row gap-4">
        <label className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer border-2 transition flex-1 ${
          !isAuction ? 'border-[#ff950e] bg-[#ff950e] bg-opacity-10' : 'border-gray-700 bg-black'
        }`}>
          <input
            type="radio"
            checked={!isAuction}
            onChange={() => onChange(false)}
            className="sr-only"
          />
          <Sparkles className={`w-5 h-5 ${!isAuction ? 'text-[#ff950e]' : 'text-gray-500'}`} />
          <div>
            <span className="font-medium">Standard Listing</span>
            <p className="text-xs text-gray-400 mt-1">Fixed price, first come first served</p>
          </div>
        </label>
        
        <div className="relative flex-1">
          <label 
            className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer border-2 transition ${
              isAuction 
                ? 'border-purple-600 bg-purple-600 bg-opacity-10' 
                : 'border-gray-700 bg-black'
            } ${
              !isVerified 
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-purple-500'
            }`}
          >
            <input
              type="radio"
              checked={isAuction}
              onChange={() => {
                if (isVerified) {
                  onChange(true);
                }
              }}
              disabled={!isVerified}
              className="sr-only"
            />
            <Gavel className={`w-5 h-5 ${isAuction ? 'text-purple-500' : 'text-gray-500'}`} />
            <div>
              <span className="font-medium">Auction</span>
              <p className="text-xs text-gray-400 mt-1">Let buyers bid, highest wins</p>
            </div>
          </label>
          
          {!isVerified && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 rounded-lg px-3 py-2">
              <LockIcon className="w-6 h-6 text-yellow-500 mb-1" />
              <span className="text-xs text-yellow-400 font-medium text-center">Verify your account to unlock auctions</span>
              <Link 
                href="/sellers/verify" 
                className="mt-1 text-xs text-white bg-yellow-600 hover:bg-yellow-500 px-3 py-1 rounded-full font-medium transition"
              >
                Get Verified
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}