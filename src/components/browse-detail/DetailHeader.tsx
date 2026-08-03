// src/components/browse-detail/DetailHeader.tsx
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DetailHeaderProps } from '@/types/browseDetail';

export default function DetailHeader({ onBack }: DetailHeaderProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <Link
        href="/browse"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
        onClick={(e) => {
          if (onBack) {
            e.preventDefault();
            onBack();
          }
        }}
        aria-label="Back to browse"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to browse
      </Link>
    </div>
  );
}
