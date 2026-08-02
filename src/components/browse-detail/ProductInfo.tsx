// src/components/browse-detail/ProductInfo.tsx
'use client';

import { Clock } from 'lucide-react';
import { ProductInfoProps } from '@/types/browseDetail';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function ProductInfo({ listing }: ProductInfoProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          <SecureMessageDisplay
            content={listing.title}
            allowBasicFormatting={false}
            className="inline"
          />
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {listing.hoursWorn !== undefined && listing.hoursWorn !== null && (
            <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
              <Clock className="h-3.5 w-3.5" />
              {Number(listing.hoursWorn)} hours worn
            </span>
          )}
        </div>

        {listing.tags && listing.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {listing.tags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="rounded bg-surface-overlay px-2 py-0.5 text-xs text-ink-muted"
              >
                <SecureMessageDisplay
                  content={tag}
                  allowBasicFormatting={false}
                  className="inline"
                />
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-line pt-5">
        <h2 className="text-sm font-medium text-ink">Description</h2>
        <SecureMessageDisplay
          content={listing.description}
          allowBasicFormatting={false}
          className="text-sm leading-relaxed text-ink-muted"
        />
      </div>
    </div>
  );
}
