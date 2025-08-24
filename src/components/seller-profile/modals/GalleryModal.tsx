'use client';

import type { MouseEvent } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryModalProps {
  show: boolean;
  selectedImage: string | null;
  currentImageIndex: number;
  galleryImages: string[];
  onClose: () => void;
  onPrevious: (e?: MouseEvent) => void;
  onNext: (e?: MouseEvent) => void;
}

export default function GalleryModal({
  show,
  selectedImage,
  currentImageIndex,
  galleryImages,
  onClose,
  onPrevious,
  onNext,
}: GalleryModalProps) {
  if (!show || !selectedImage) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-5xl max-h-[90vh] w-auto h-auto flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous Button */}
        {galleryImages.length > 1 && (
          <button
            onClick={onPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] bg-[#ff950e] text-black p-1.5 rounded-full hover:bg-opacity-90 transition-all shadow-lg"
            aria-label="Previous image"
            type="button"
          >
            <ChevronLeft strokeWidth={3} className="w-3 h-3" />
          </button>
        )}

        {/* Image with gradient border */}
        <div className="relative rounded-lg overflow-hidden p-[3px] bg-gradient-to-r from-[#ff950e] via-yellow-500 to-[#ff950e]">
          <img
            src={selectedImage}
            alt="Gallery image"
            className="max-h-[85vh] max-w-[85vw] object-contain bg-black rounded"
          />
        </div>

        {/* Next Button */}
        {galleryImages.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] bg-[#ff950e] text-black p-1.5 rounded-full hover:bg-opacity-90 transition-all shadow-lg"
            aria-label="Next image"
            type="button"
          >
            <ChevronRight strokeWidth={3} className="w-3 h-3" />
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[110] bg-white text-black p-1 rounded-full hover:bg-gray-200 transition-all"
          aria-label="Close gallery"
          type="button"
        >
          <X strokeWidth={3} className="w-3 h-3" />
        </button>

        {/* Image counter */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full font-medium text-sm">
          {currentImageIndex + 1} / {galleryImages.length}
        </div>
      </div>
    </div>
  );
}
