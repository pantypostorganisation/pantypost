// src/components/admin/verification/DocumentCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, ImageIcon, Loader2, RefreshCw } from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface DocumentCardProps {
  title: string;
  imageSrc?: string;
  onViewFull?: () => void;
}

export default function DocumentCard({ title, imageSrc, onViewFull }: DocumentCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset load/error state whenever the source changes, so a refreshed
  // signed URL gets a clean attempt rather than inheriting a stale error.
  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [imageSrc]);

  /**
   * The backend now returns absolute, short-lived signed URLs for
   * verification documents, so no client-side URL rewriting is needed.
   *
   * This previously hardcoded http://localhost:5000 for relative paths,
   * which meant document previews only ever worked in local development.
   */
  const safeSrc = imageSrc && imageSrc.trim() ? imageSrc : '';
  const hasImage = !!safeSrc && !imageError;

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    // The most common cause is an expired signed link, since these are
    // deliberately short-lived. Refreshing the page reissues them.
    console.warn('[DocumentCard] Could not load document (link may have expired):', title);
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm uppercase text-gray-400 font-medium tracking-wider">
        {sanitizeStrict(title)}
      </h4>

      <div className="relative bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden aspect-[4/3]">
        {hasImage ? (
          <>
            {/* Loading state */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] z-10">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            )}

            {/* Image */}
            <img
              src={safeSrc}
              alt={sanitizeStrict(title)}
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={onViewFull}
              onLoad={handleImageLoad}
              onError={handleImageError}
              draggable={false}
              // Identity documents should not leak the admin page URL
              // to any intermediary.
              referrerPolicy="no-referrer"
            />

            {/* Hover overlay */}
            {!imageLoading && (
              <div
                className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-0 transition flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer"
                onClick={onViewFull}
              >
                <ExternalLink className="w-6 h-6 text-white pointer-events-none" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 px-3">
            {imageError ? (
              <>
                <RefreshCw className="w-7 h-7 mb-2 text-amber-500/70" />
                <span className="text-xs text-center text-amber-200/80 font-medium">
                  Secure link expired
                </span>
                <span className="text-[0.7rem] text-center text-gray-500 mt-1">
                  Refresh the page to view
                </span>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs text-center">Not provided</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
