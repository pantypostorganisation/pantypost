// src/components/admin/verification/ImageViewer.tsx
'use client';

import { X } from 'lucide-react';
import type { ImageViewerProps } from '@/types/verification';

export default function ImageViewer({
  imageData,
  isLoading,
  onClose,
  onLoad
}: ImageViewerProps) {
  if (!imageData) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div className="relative max-w-[90vw] max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Image Type Label */}
        <div className="absolute -top-12 left-0 text-white">
          <h3 className="text-lg font-medium">{imageData.type}</h3>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff950e]"></div>
          </div>
        )}

        {/* Image */}
        <img
          src={imageData.url}
          alt={imageData.type}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          onLoad={onLoad}
          style={{ opacity: isLoading ? 0.2 : 1, transition: 'opacity 0.3s' }}
        />
      </div>
    </div>
  );
}