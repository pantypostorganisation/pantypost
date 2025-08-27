// src/components/browse-detail/DetailHeader.tsx
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DetailHeaderProps } from '@/types/browseDetail';

export default function DetailHeader({ onBack }: DetailHeaderProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-6">
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-[#ff950e] transition-colors text-sm font-medium"
        onClick={(e) => {
          if (onBack) {
            e.preventDefault();
            onBack();
          }
        }}
        aria-label="Back to Browse"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Browse
      </Link>
    </div>
  );
}
