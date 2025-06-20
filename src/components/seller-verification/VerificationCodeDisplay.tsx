// src/components/seller-verification/VerificationCodeDisplay.tsx
'use client';

import { RefreshCw } from 'lucide-react';

interface VerificationCodeDisplayProps {
  code: string;
  title?: string;
  description?: string;
  showRefreshIcon?: boolean;
}

export default function VerificationCodeDisplay({ 
  code, 
  title = "Your Unique Verification Code",
  description = "Write this code on a piece of paper. You'll need to take a photo holding this code.",
  showRefreshIcon = false
}: VerificationCodeDisplayProps) {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 mb-6">
      <h4 className="font-medium text-[#ff950e] mb-2 flex items-center">
        {showRefreshIcon && <RefreshCw className="w-4 h-4 mr-2" />}
        {title}
      </h4>
      <div className="bg-black py-3 px-4 rounded-lg border border-gray-700 text-center mb-2">
        <span className="font-mono text-xl text-[#ff950e] font-bold">
          {code}
        </span>
      </div>
      <p className="text-sm text-gray-400">
        {description}
      </p>
    </div>
  );
}
