// src/components/myListings/ListingLimitMessage.tsx
'use client';

import Link from 'next/link';

interface ListingLimitMessageProps {
  isVerified: boolean;
  isEditing: boolean;
}

export default function ListingLimitMessage({ isVerified, isEditing }: ListingLimitMessageProps) {
  if (isEditing) return null;
  
  return (
    <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 rounded-lg p-4 my-4 text-center font-semibold">
      {isVerified ? (
        <>
          You have reached the maximum of <span className="text-[#ff950e] font-bold">25</span> listings for verified sellers.
        </>
      ) : (
        <>
          Unverified sellers can only have <span className="text-[#ff950e] font-bold">2</span> active listings.<br />
          <span className="block mt-2">
            <Link
              href="/sellers/verify"
              className="text-[#ff950e] font-bold underline hover:text-white transition"
            >
              Verify your account
            </Link>{' '}
            to add up to 25 listings!
          </span>
        </>
      )}
    </div>
  );
}