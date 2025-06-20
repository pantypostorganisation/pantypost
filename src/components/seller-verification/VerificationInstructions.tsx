// src/components/seller-verification/VerificationInstructions.tsx
'use client';

import { HelpCircle } from 'lucide-react';

export default function VerificationInstructions() {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6 border border-[#ff950e] border-opacity-30">
      <h3 className="font-medium text-[#ff950e] mb-4 flex items-center">
        <HelpCircle className="w-4 h-4 mr-2" />
        How to Take Your Verification Photo
      </h3>
      
      <div className="flex justify-center mb-3">
        <img 
          src="/verification_instruction.png" 
          alt="Verification Instructions" 
          className="w-1/2 h-auto object-contain"
        />
      </div>
      
      <p className="text-sm text-gray-300 text-center">
        Take a clear photo with your smartphone showing your face and the verification code on a piece of paper or displayed on another device.
      </p>
    </div>
  );
}
