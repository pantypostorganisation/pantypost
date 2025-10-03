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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex max-h-[90vh] max-w-5xl items-center justify-center p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {galleryImages.length > 1 && (
          <button
            onClick={onPrevious}
            className="absolute left-6 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-3 text-white shadow-lg transition hover:bg-black/80"
            aria-label="Previous image"
            type="button"
          >
            <ChevronLeft strokeWidth={3} className="h-4 w-4" />
          </button>
        )}

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-black via-black/80 to-[#1b0f12] p-[3px]">
          <div className="rounded-3xl bg-black/90 p-4">
            <img
              src={selectedImage}
              alt="Gallery image"
              className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain"
            />
          </div>
        </div>

        {galleryImages.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-3 text-white shadow-lg transition hover:bg-black/80"
            aria-label="Next image"
            type="button"
          >
            <ChevronRight strokeWidth={3} className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={onClose}
          className="absolute right-8 top-8 rounded-full border border-white/20 bg-black/60 p-2 text-white transition hover:bg-black/80"
          aria-label="Close gallery"
          type="button"
        >
          <X strokeWidth={3} className="h-4 w-4" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/60 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white">
          {currentImageIndex + 1} / {galleryImages.length}
        </div>
      </div>
    </div>
  );
}
