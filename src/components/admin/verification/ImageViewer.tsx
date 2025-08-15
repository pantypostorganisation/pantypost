// src/components/admin/verification/ImageViewer.tsx
'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ImageViewerProps } from '@/types/verification';
import { sanitizeUrl, sanitizeStrict } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function ImageViewer({
  imageData,
  isLoading,
  onClose,
  onLoad
}: ImageViewerProps) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!imageData) return;

    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // ESC to close + initial focus
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [imageData, onClose]);

  if (!imageData) return null;

  const isDataUrl = imageData.url.startsWith('data:image/');
  const safeImageUrl = isDataUrl ? imageData.url : sanitizeUrl(imageData.url);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-95 z-[100]"
        onClick={onClose}
        role="button"
        aria-label="Close image viewer"
      />

      {/* Modal Content */}
      <div
        className="fixed inset-0 flex items-center justify-center z-[101] p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Verification image viewer"
        style={{ pointerEvents: 'none' }}
      >
        <div className="relative max-w-[90vw] max-h-[90vh]" style={{ pointerEvents: 'auto' }}>
          {/* Close button */}
          <button
            ref={closeBtnRef}
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2"
            aria-label="Close"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Image Type Label */}
          <div className="absolute -top-12 left-0 text-white">
            <h3 className="text-lg font-medium">
              <SecureMessageDisplay
                content={imageData.type}
                allowBasicFormatting={false}
              />
            </h3>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff950e]" aria-label="Loading" />
            </div>
          )}

          {/* Image */}
          <img
            src={safeImageUrl}
            alt={sanitizeStrict(imageData.type)}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onLoad={() => {
              if (onLoad) onLoad();
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="20"%3EImage failed to load%3C/text%3E%3C/svg%3E';
            }}
            style={{
              opacity: isLoading ? 0.2 : 1,
              transition: 'opacity 0.3s',
              display: 'block'
            }}
            draggable={false}
          />
        </div>
      </div>
    </>
  );
}
