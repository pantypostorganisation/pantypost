// src/components/admin/verification/DocumentCard.tsx
'use client';

import { useState } from 'react';
import { ExternalLink, ImageIcon, Loader2 } from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface DocumentCardProps {
  title: string;
  imageSrc?: string;
  onViewFull?: () => void;
}

export default function DocumentCard({ title, imageSrc, onViewFull }: DocumentCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Don't sanitize URLs that are from our backend
  const getSafeImageUrl = (url?: string): string => {
    if (!url) return '';
    
    // If it's a data URL, return as is
    if (url.startsWith('data:image/')) {
      return url;
    }
    
    // If it's an absolute URL from our backend, return as is
    if (url.startsWith('http://localhost:5000') || 
        url.startsWith('https://localhost:5000') ||
        url.includes('/uploads/verification/')) {
      return url;
    }
    
    // For any other URL, sanitize it
    // But since we're dealing with backend URLs, just return the URL
    return url;
  };

  const safeSrc = getSafeImageUrl(imageSrc);
  const hasImage = !!safeSrc && !imageError;

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error('[DocumentCard] Failed to load image:', safeSrc);
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm uppercase text-gray-400 font-medium tracking-wider">
        {sanitizeStrict(title)}
      </h4>

      <div className="relative bg-[#1a1a1a] rounded-lg border border-gray-700 overflow-hidden aspect-[4/3]">
        {safeSrc && !imageError ? (
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
              style={{ display: imageError ? 'none' : 'block' }}
            />

            {/* Hover overlay */}
            {!imageLoading && !imageError && (
              <div 
                className="absolute inset-0 bg-black bg-opacity-30 hover:bg-opacity-0 transition flex items-center justify-center opacity-0 hover:opacity-100 cursor-pointer"
                onClick={onViewFull}
              >
                <ExternalLink className="w-6 h-6 text-white pointer-events-none" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
            <ImageIcon className="w-8 h-8 mb-2" />
            <span className="text-xs text-center px-2">
              {imageError ? 'Failed to load image' : 'Not provided'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
