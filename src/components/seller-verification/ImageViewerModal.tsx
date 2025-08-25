// src/components/seller-verification/ImageViewerModal.tsx
'use client';

import { XCircle } from 'lucide-react';
import { ImageViewData } from './utils/types';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface ImageViewerModalProps {
  imageData: ImageViewData | null;
  onClose: () => void;
}

export default function ImageViewerModal({ imageData, onClose }: ImageViewerModalProps) {
  if (!imageData) return null;

  const safeType = sanitizeStrict(imageData.type);
  const safeUrl = imageData.url; // URL is rendered via <img src>; upstream selection should be trusted/sanitized

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${safeType} viewer`}
      onClick={onClose}
    >
      <div className="max-w-3xl max-h-[90vh] relative" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-2 right-2 z-10">
          <button onClick={onClose} className="bg-black bg-opacity-50 text-white p-2 rounded-full" type="button" aria-label="Close">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="absolute top-2 left-2 z-10 bg-black bg-opacity-50 px-3 py-1 rounded-lg">
          <span className="text-sm text-white">{safeType}</span>
        </div>
        <img src={safeUrl} alt={safeType} className="max-h-[90vh] max-w-full object-contain" />
      </div>
    </div>
  );
}
