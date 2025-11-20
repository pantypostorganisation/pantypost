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

  // Dynamic base URL that works on local network
  const baseUrl = typeof window !== 'undefined' && window.location.hostname.match(/192\.168\.|10\.|172\./)
    ? `http://${window.location.hostname}:5000`
    : 'http://localhost:5000';

  // Fix URLs that incorrectly have /api/ in the path for static uploads
  const getSafeImageUrl = (url?: string): string => {
    if (!url) return '';
    
    // If it's a data URL, return as is
    if (url.startsWith('data:image/')) {
      return url;
    }
    
    // FIX: Check for URLs with /api/uploads/ and fix them
    // Backend serves uploads directly from /uploads/, not /api/uploads/
    if (url.includes('/api/uploads/')) {
      // Extract the base URL and the path
      const baseUrlPart = url.substring(0, url.indexOf('/api/uploads/'));
      const path = url.substring(url.indexOf('/api/uploads/') + 4); // Remove '/api' prefix
      const fixedUrl = `${baseUrlPart}${path}`;
      console.log('[DocumentCard] Fixed URL from:', url, 'to:', fixedUrl);
      return fixedUrl;
    }
    
    // If it's a relative upload path, construct the correct URL
    if (url.startsWith('/uploads/')) {
      // Use dynamic base URL
      return `${baseUrl}${url}`;
    }
    
    // If it's already a correct absolute URL from our backend, update the hostname if needed
    if (url.startsWith('http://localhost:5000/uploads/') || 
        url.startsWith('https://localhost:5000/uploads/')) {
      // Replace localhost with current hostname if on network
      if (typeof window !== 'undefined' && window.location.hostname.match(/192\.168\.|10\.|172\./)) {
        return url.replace(/localhost/, window.location.hostname);
      }
      return url;
    }
    
    // For any other URL, return as is
    return url;
  };

  const safeSrc = getSafeImageUrl(imageSrc);
  const hasImage = !!safeSrc && !imageError;

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error('[DocumentCard] Failed to load image:', imageSrc, '-> Fixed to:', safeSrc);
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
