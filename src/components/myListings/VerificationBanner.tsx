// src/components/myListings/VerificationBanner.tsx
'use client';

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { VerificationBannerProps } from '@/types/myListings';

export default function VerificationBanner({ onVerifyClick }: VerificationBannerProps) {
  return (
    <div className="bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border border-yellow-700">
      <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-3">
        <ShieldCheck className="text-yellow-500 w-6 h-6" />
        Get Verified
      </h2>
      <div className="mb-5">
        <p className="text-gray-300 mb-3">
          Verified sellers get these exclusive benefits:
        </p>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-yellow-500 font-bold text-lg leading-none">•</span>
            <span>Post up to <span className="text-yellow-500 font-bold">25 listings</span> (vs only 2 for unverified)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-500 font-bold text-lg leading-none">•</span>
            <span>Create <span className="text-purple-400 font-bold">auction listings</span> for higher bids</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-500 font-bold text-lg leading-none">•</span>
            <div className="flex items-center">
              <span>Display a verification badge </span>
              <img src="/verification_badge.png" alt="Verification Badge" className="w-4 h-4 mx-1" /> 
              <span> on your profile and listings</span>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-500 font-bold text-lg leading-none">•</span>
            <span>Earn buyers' trust for more sales and higher prices</span>
          </li>
        </ul>
      </div>
      <Link
        href="/sellers/verify"
        onClick={onVerifyClick}
        className="w-full bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-500 font-bold text-lg transition flex items-center justify-center gap-2"
      >
        <ShieldCheck className="w-5 h-5" />
        Verify My Account
      </Link>
    </div>
  );
}