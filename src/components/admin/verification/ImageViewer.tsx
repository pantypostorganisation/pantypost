// src/components/admin/verification/ImageViewer.tsx
'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { ImageViewerProps } from '@/types/verification';
import { sanitizeUrl } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function ImageViewer({
  imageData,
  isLoading,
  onClose,
  onLoad
}: ImageViewerProps) {
  // Debug logging and body scroll management
  useEffect(() => {
    if (imageData) {
      console.log('ImageViewer mounted with data:', imageData);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset';
    };
  }, [imageData]);

  if (!imageData) {
    return null;
  }

  // For verification images, we trust the source since they come from our own system
  // Check if it's a data URL (base64 image) - these are blocked by default sanitizeUrl
  const isDataUrl = imageData.url.startsWith('data:image/');
  const safeImageUrl = isDataUrl ? imageData.url : sanitizeUrl(imageData.url);

  return (
    <>
      {/* Backdrop - separate from content for better click handling */}
      <div
        className="fixed inset-0 bg-black bg-opacity-95 z-[100]"
        onClick={onClose}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)'
        }}
      />
      
      {/* Modal Content */}
      <div 
        className="fixed inset-0 flex items-center justify-center z-[101] p-4"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}
      >
        <div 
          className="relative max-w-[90vw] max-h-[90vh]"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2"
            style={{
              position: 'absolute',
              top: '-48px',
              right: '0',
              color: 'white',
              cursor: 'pointer',
              zIndex: 102
            }}
          >
            <X className="w-8 h-8" />
          </button>

          {/* Image Type Label */}
          <div 
            className="absolute -top-12 left-0 text-white"
            style={{
              position: 'absolute',
              top: '-48px',
              left: '0',
              color: 'white'
            }}
          >
            <h3 className="text-lg font-medium">
              <SecureMessageDisplay 
                content={imageData.type}
                allowBasicFormatting={false}
              />
            </h3>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff950e]"></div>
            </div>
          )}

          {/* Image */}
          <img
            src={safeImageUrl}
            alt={imageData.type}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onLoad={() => {
              console.log('Image loaded successfully');
              if (onLoad) onLoad();
            }}
            onError={(e) => {
              console.error('Image failed to load');
              // Show a placeholder instead of hiding the image
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23333"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="20"%3EImage failed to load%3C/text%3E%3C/svg%3E';
            }}
            style={{ 
              opacity: isLoading ? 0.2 : 1, 
              transition: 'opacity 0.3s',
              maxWidth: '90vw',
              maxHeight: '85vh',
              display: 'block'
            }}
          />
        </div>
      </div>
    </>
  );
}
