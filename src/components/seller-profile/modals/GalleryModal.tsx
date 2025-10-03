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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-5xl items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {galleryImages.length > 1 && (
          <button
            onClick={onPrevious}
            className="absolute left-6 top-1/2 z-[110] -translate-y-1/2 rounded-full border border-white/20 bg-black/70 p-3 text-white shadow-lg transition hover:bg-black/90"
            aria-label="Previous image"
            type="button"
          >
            <ChevronLeft strokeWidth={3} className="h-4 w-4" />
          </button>
        )}

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-black via-[#15080c] to-black p-1 shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,149,14,0.25),_transparent_70%)]" aria-hidden="true" />
          <div className="relative rounded-[24px] bg-black/80 p-4">
            <img
              src={selectedImage}
              alt="Gallery image"
              className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain shadow-[0_25px_60px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>

        {galleryImages.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-6 top-1/2 z-[110] -translate-y-1/2 rounded-full border border-white/20 bg-black/70 p-3 text-white shadow-lg transition hover:bg-black/90"
            aria-label="Next image"
            type="button"
          >
            <ChevronRight strokeWidth={3} className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-[110] rounded-full border border-white/20 bg-black/70 p-2 text-white transition hover:bg-black/90"
          aria-label="Close gallery"
          type="button"
        >
          <X strokeWidth={3} className="h-4 w-4" />
        </button>

        <div className="absolute bottom-6 left-1/2 z-[110] -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-5 py-2 text-sm font-medium text-white backdrop-blur">
          {currentImageIndex + 1} / {galleryImages.length}
        </div>
      </div>
    </div>
  );
}
