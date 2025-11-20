// src/components/seller-profile/ProfileGallery.tsx
'use client';

import { ChevronLeft, ChevronRight, Maximize, Image as ImageIcon } from 'lucide-react';
import { z } from 'zod';
import { safeImageSrc } from '@/utils/url';

const PropsSchema = z.object({
  galleryImages: z.array(z.string()).default([]),
  slideIndex: z.number().int().nonnegative().default(0),
  isPaused: z.boolean().default(false),
  onSlideChange: z.function().args(z.number().int().nonnegative()).returns(z.void()),
  onTogglePause: z.function().args(z.any().optional()).returns(z.void()),
  onImageClick: z.function().args(z.string(), z.number()).returns(z.void()),
  onPrevSlide: z.function().args(z.any().optional()).returns(z.void()),
  onNextSlide: z.function().args(z.any().optional()).returns(z.void()),
});

interface ProfileGalleryProps extends z.infer<typeof PropsSchema> {}

// Clamp helper to avoid OOB slide positions
function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(n, max));
}

export default function ProfileGallery(rawProps: ProfileGalleryProps) {
  const parsed = PropsSchema.safeParse(rawProps);
  const {
    galleryImages = [],
    slideIndex: rawIndex = 0,
    isPaused,
    onSlideChange,
    onTogglePause,
    onImageClick,
    onPrevSlide,
    onNextSlide,
  } = parsed.success ? parsed.data : { ...rawProps, galleryImages: [], slideIndex: 0 };

  const maxIndex = Math.max(0, galleryImages.length - 1);
  const slideIndex = clamp(rawIndex, 0, maxIndex);

  return (
    <div className="mt-12">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-white flex items-center gap-2">
        <ImageIcon className="w-7 h-7 text-[#ff950e]" />
        Photo Gallery
      </h2>

      {galleryImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 bg-[#1a1a1a] rounded-xl border border-dashed border-gray-700 text-gray-400 italic shadow-lg">
          <ImageIcon className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-lg">No gallery photos yet.</p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-gray-800 shadow-xl bg-gradient-to-b from-[#1a1a1a] to-black">
          {/* Slideshow Container */}
          <div className="relative h-96 sm:h-[480px] overflow-hidden">
            <div
              className="flex transition-transform duration-700 ease-in-out h-full"
              style={{ transform: `translateX(-${slideIndex * 100}%)` }}
              aria-live="polite"
            >
              {galleryImages.map((image, index) => {
                const src = safeImageSrc(image, { placeholder: '/placeholder-image.png' });
                return (
                  <div
                    key={index}
                    className="w-full h-full flex-shrink-0 flex items-center justify-center bg-black"
                    style={{ minWidth: '100%' }}
                  >
                    <img
                      src={src}
                      alt={`Gallery photo ${index + 1}`}
                      className="h-full w-auto max-w-full object-contain cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                      onClick={() => onImageClick(src, index)}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                );
              })}
            </div>

            {/* Navigation Arrows - small */}
            {galleryImages.length > 1 && (
              <>
                <button
                  className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-[#ff950e] text-black p-1.5 rounded-full hover:bg-opacity-100 z-10 shadow-lg transition-transform duration-300 hover:scale-110"
                  onClick={(e) => onPrevSlide?.(e)}
                  aria-label="Previous image"
                  type="button"
                >
                  <ChevronLeft strokeWidth={3} className="w-3 h-3" />
                </button>

                <button
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-[#ff950e] text-black p-1.5 rounded-full hover:bg-opacity-100 z-10 shadow-lg transition-transform duration-300 hover:scale-110"
                  onClick={(e) => onNextSlide?.(e)}
                  aria-label="Next image"
                  type="button"
                >
                  <ChevronRight strokeWidth={3} className="w-3 h-3" />
                </button>
              </>
            )}

            {/* Controls and image counter overlay */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center p-4 bg-gradient-to-t from-black to-transparent z-10">
              {/* Current slide indicator */}
              <div className="text-white font-medium text-sm bg-black bg-opacity-60 px-3 py-1 rounded-full">
                {slideIndex + 1} / {galleryImages.length}
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={onTogglePause}
                  className="bg-black bg-opacity-60 text-white p-1 rounded-full hover:bg-opacity-80 transition-all"
                  aria-label={isPaused ? 'Play slideshow' : 'Pause slideshow'}
                  type="button"
                >
                  {isPaused ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  )}
                </button>

                <button
                  onClick={() => onImageClick(safeImageSrc(galleryImages[slideIndex]), slideIndex)}
                  className="bg-black bg-opacity-60 text-white p-1 rounded-full hover:bg-opacity-80 transition-all flex items-center justify-center"
                  aria-label="View fullscreen"
                  type="button"
                >
                  <Maximize className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
