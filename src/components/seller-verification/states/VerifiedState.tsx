// src/components/seller-verification/states/VerifiedState.tsx
'use client';

import { CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import VerificationStatusHeader from '../VerificationStatusHeader';
import { VerificationStateProps } from '../utils/types';

export default function VerifiedState({ user, code }: VerificationStateProps) {
  const router = useRouter();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white py-10 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#121212] rounded-xl shadow-xl overflow-hidden border border-green-800">
          <VerificationStatusHeader status="verified" title="Verification Status" />
          
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center text-center mb-8">
              {/* Display the verification badge image */}
              <div className="relative w-32 h-32 mb-6">
                <img 
                  src="/verification_badge.png" 
                  alt="Verified Seller Badge" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Verified Seller</h2>
              <p className="text-green-400 font-medium">Your account has been verified!</p>
              
              <div className="mt-8 border-t border-gray-800 pt-6 w-full">
                <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                  <span>Verification Status:</span>
                  <span className="px-3 py-1 bg-green-900 text-green-400 rounded-full text-xs font-medium">
                    Verified
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-400 mb-3">
                  <span>Verification Code:</span>
                  <span className="font-mono bg-black px-2 py-1 rounded text-green-500">{code}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>Verified Since:</span>
                  <span>
                    {user.verificationRequestedAt 
                      ? new Date(user.verificationRequestedAt).toLocaleDateString() 
                      : 'Recently'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-green-900 bg-opacity-20 border border-green-800 p-4 mt-4">
              <h3 className="font-medium text-green-400 flex items-center mb-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                Seller Benefits
              </h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Post up to 25 listings (unverified sellers can only post 2)
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <div className="flex items-center">
                    Verified badge <img src="/verification_badge.png" alt="Badge" className="w-4 h-4 mx-1" /> on your profile and listings
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Higher trustworthiness leading to more sales
                </li>
              </ul>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => router.push('/sellers/my-listings')}
                className="flex-1 px-4 py-3 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition text-center"
              >
                Manage My Listings
              </button>
              <button
                onClick={() => router.push('/sellers/profile')}
                className="flex-1 px-4 py-3 bg-[#1a1a1a] text-white border border-gray-700 rounded-lg hover:bg-[#222] transition text-center"
              >
                Back to Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
