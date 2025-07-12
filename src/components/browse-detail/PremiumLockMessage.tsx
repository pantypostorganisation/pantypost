// src/components/browse-detail/PremiumLockMessage.tsx
'use client';

import Link from 'next/link';
import { Lock, Crown } from 'lucide-react';
import { PremiumLockMessageProps } from '@/types/browseDetail';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { sanitizeUsername } from '@/utils/security/sanitization';

export default function PremiumLockMessage({ listing, userRole }: PremiumLockMessageProps) {
  const sanitizedUsername = sanitizeUsername(listing.seller);

  return (
    <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <Lock className="w-4 h-4 text-yellow-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-base font-bold text-white mb-1">Premium Content</h3>
          <p className="text-gray-300 mb-2 text-xs">
            Subscribe to{' '}
            <SecureMessageDisplay 
              content={listing.seller}
              allowBasicFormatting={false}
              className="inline font-semibold"
            />{' '}
            to view full details and make purchases.
          </p>
          {userRole === 'buyer' && (
            <Link
              href={`/sellers/${sanitizedUsername}`}
              className="inline-flex items-center gap-1.5 bg-yellow-600 text-black font-medium px-3 py-1.5 rounded-lg hover:bg-yellow-500 transition text-xs"
            >
              <Crown className="w-3.5 h-3.5" />
              Subscribe Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
