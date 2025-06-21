// src/components/myListings/ListingLimitMessage.tsx
'use client';

import { AlertCircle } from 'lucide-react';

interface ListingLimitMessageProps {
  currentListings: number;
  maxListings: number;
  isVerified: boolean;
}

export default function ListingLimitMessage({ 
  currentListings, 
  maxListings, 
  isVerified 
}: ListingLimitMessageProps) {
  return (
    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div>
          <p className="text-red-500 font-medium">Listing Limit Reached</p>
          <p className="text-gray-400 text-sm mt-1">
            You currently have {currentListings} of {maxListings} listings allowed for {isVerified ? 'verified' : 'unverified'} sellers.
            {!isVerified && (
              <span className="block mt-1">
                Verify your account to increase your limit to 25 listings.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
