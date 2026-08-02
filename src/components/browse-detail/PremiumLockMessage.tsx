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
    <div className="rounded-md border border-primary-line bg-primary-soft p-4">
      <div className="flex items-start gap-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-semibold text-ink">Premium content</h3>
          <p className="text-xs leading-relaxed text-ink-muted">
            Subscribe to{' '}
            <SecureMessageDisplay
              content={listing.seller}
              allowBasicFormatting={false}
              className="inline font-medium text-ink"
            />{' '}
            to view full details and make purchases.
          </p>
          {userRole === 'buyer' && (
            <Link
              href={`/sellers/${sanitizedUsername}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-primary-hover"
              aria-label={`Subscribe to ${sanitizedUsername}`}
            >
              <Crown className="h-3.5 w-3.5" />
              Subscribe
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
