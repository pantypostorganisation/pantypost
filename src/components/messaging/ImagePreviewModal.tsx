// src/components/messaging/ImagePreviewModal.tsx
'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  imageUrl,
  isOpen,
  onClose,
}) => {
  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  // Prevent background scroll while open + add key listener
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] outline-none"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-2 shadow-lg"
          aria-label="Close preview"
        >
          <X size={20} />
        </button>
        {/* Guard against empty URL */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Full size preview"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            draggable={false}
          />
        ) : (
          <div className="max-w-full max-h-[90vh] p-8 bg-[#1a1a1a] text-gray-400 rounded-lg">
            Image unavailable
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagePreviewModal;
