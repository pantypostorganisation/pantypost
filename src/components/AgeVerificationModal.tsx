// src/components/AgeVerificationModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { storageService } from '@/services';

export default function AgeVerificationModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      const verified = await storageService.getItem('ageVerified', null);
      if (!verified) {
        setIsVisible(true);
      }
    };

    checkVerification();
  }, []);

  const handleYes = async () => {
    await storageService.setItem('ageVerified', 'true');
    setIsVisible(false);
  };

  const handleNo = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
      <div className="bg-[#161616] border-2 border-[#ff950e]/50 p-8 rounded-2xl max-w-md w-full shadow-2xl shadow-[#ff950e]/10">
        <h2 className="text-2xl font-bold text-[#ff950e] mb-4 text-center">Age Verification</h2>
        <p className="mb-6 text-center text-gray-300">
          You must be at least 21 years old to enter this site. By entering, you confirm you are at least 21 years old.
        </p>
        <p className="text-sm mb-6 text-center text-gray-400">
          By entering our website, you agree to the terms & conditions.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleYes}
            className="group relative inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#ff950e] to-[#ffb347] text-black font-bold rounded-full overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-[#ff950e]/30 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff950e] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span className="relative z-10">I am 21+</span>
          </button>
          <button
            onClick={handleNo}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-full transition-all duration-300 ease-out hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
