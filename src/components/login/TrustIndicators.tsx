// src/components/login/TrustIndicators.tsx
'use client';

import Image from 'next/image';
import { TrustIndicatorsProps } from '@/types/login';

export default function TrustIndicators({}: TrustIndicatorsProps) {
  return (
    <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-400 transition-all duration-500">
      {/* Private */}
      <span className="flex items-center gap-1.5">
        <Image
          src="/security_badge.png"
          alt="Security Badge"
          width={16}
          height={16}
          className="w-4 h-4 object-contain"
        />
        Private
      </span>
      
      {/* Encrypted */}
      <span className="flex items-center gap-1.5">
        <Image
          src="/encrypted_badge.png"
          alt="Encrypted Badge"
          width={16}
          height={16}
          className="w-4 h-4 object-contain"
        />
        Encrypted
      </span>
      
      {/* Safe Payments */}
      <span className="flex items-center gap-1.5">
        <Image
          src="/card_badge.png"
          alt="Card Badge"
          width={16}
          height={16}
          className="w-4 h-4 object-contain"
        />
        Safe Payments
      </span>
      
      {/* Verified Sellers */}
      <span className="flex items-center gap-1.5">
        <Image
          src="/verification_badge.png"
          alt="Verification Badge"
          width={16}
          height={16}
          className="w-4 h-4 object-contain"
        />
        Verified Sellers
      </span>
    </div>
  );
}