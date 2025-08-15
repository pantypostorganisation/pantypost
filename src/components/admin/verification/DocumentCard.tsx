// src/components/admin/verification/DocumentCard.tsx
'use client';

import { ExternalLink, ImageIcon } from 'lucide-react';
import { sanitizeUrl, sanitizeStrict } from '@/utils/security/sanitization';

interface DocumentCardProps {
  title: string;
  imageSrc?: string;
  onViewFull?: () => void;
}

export default function DocumentCard({ title, imageSrc, onViewFull }: DocumentCardProps) {
  const isDataUrl = !!imageSrc && imageSrc.startsWith('data:image/');
  const safeSrc = imageSrc ? (isDataUrl ? imageSrc : sanitizeUrl(imageSrc)) : '';

  const hasImage = !!safeSrc;

  return (
    <div className="space-y-2">
      <h4 className="text-sm uppercase text-gray-400 font-medium tracking-wider">
        {sanitizeStrict(title)}
      </h4>

      <div className="relative bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden aspect-[4/3]">
        {hasImage ? (
          <>
            <img
              src={safeSrc}
              alt={sanitizeStrict(title)}
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={onViewFull}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
              draggable={false}
            />

            {/* Error fallback - hidden by default */}
            <div className="hidden absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <ImageIcon className="w-8 h-8 mb-2" />
              <span className="text-xs text-center px-2">
                Failed to load image
              </span>
            </div>

            {/* Hover overlay – pointer-events-none to not block img click */}
            <div className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-0 transition flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none">
              <ExternalLink className="w-6 h-6 text-white" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-xs text-center px-2">Not provided</span>
          </div>
        )}
      </div>
    </div>
  );
}
