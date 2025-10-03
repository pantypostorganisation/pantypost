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
    <div className="mt-12 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <h2 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-white">
          <ImageIcon className="h-7 w-7 text-[#ff950e]" />
          Photo Gallery
        </h2>
        <p className="text-sm text-gray-400 max-w-md">
          Swipe through sensual previews curated to tease subscribers. Tap to expand any shot in full resolution.
        </p>
      </div>

      {galleryImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/15 bg-black/40 p-10 text-gray-400 shadow-inner shadow-black/40">
          <ImageIcon className="h-12 w-12 text-gray-600" />
          <p className="text-lg">No gallery photos yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_25px_60px_-35px_rgba(0,0,0,0.9)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-40" aria-hidden="true" />

            <div className="relative h-80 sm:h-[460px] overflow-hidden">
              <div
                className="flex h-full transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                aria-live="polite"
              >
                {galleryImages.map((image, index) => {
                  const src = safeImageSrc(image, { placeholder: '/placeholder-image.png' });
                  return (
                    <div
                      key={index}
                      className="flex min-w-full items-center justify-center bg-gradient-to-br from-black via-black/80 to-[#150807]"
                    >
                      <img
                        src={src}
                        alt={`Gallery photo ${index + 1}`}
                        className="h-full w-auto max-w-full cursor-pointer object-contain transition duration-500 ease-out hover:scale-[1.02]"
                        onClick={() => onImageClick(src, index)}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  );
                })}
              </div>

              {galleryImages.length > 1 && (
                <>
                  <button
                    className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full border border-white/15 bg-black/60 p-2 text-white backdrop-blur transition hover:bg-black/80"
                    onClick={(e) => onPrevSlide?.(e)}
                    aria-label="Previous image"
                    type="button"
                  >
                    <ChevronLeft strokeWidth={3} className="h-4 w-4" />
                  </button>

                  <button
                    className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full border border-white/15 bg-black/60 p-2 text-white backdrop-blur transition hover:bg-black/80"
                    onClick={(e) => onNextSlide?.(e)}
                    aria-label="Next image"
                    type="button"
                  >
                    <ChevronRight strokeWidth={3} className="h-4 w-4" />
                  </button>
                </>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black via-black/60 to-transparent px-4 py-4 text-white">
                <div className="rounded-full border border-white/20 bg-black/60 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em]">
                  {slideIndex + 1} / {galleryImages.length}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={onTogglePause}
                    className="rounded-full border border-white/20 bg-black/60 p-2 text-white transition hover:bg-black/80"
                    aria-label={isPaused ? 'Play slideshow' : 'Pause slideshow'}
                    type="button"
                  >
                    {isPaused ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
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
                        width="14"
                        height="14"
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
                    className="flex items-center justify-center rounded-full border border-white/20 bg-black/60 p-2 text-white transition hover:bg-black/80"
                    aria-label="View fullscreen"
                    type="button"
                  >
                    <Maximize className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {galleryImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {galleryImages.slice(0, 8).map((image, index) => {
                const src = safeImageSrc(image, { placeholder: '/placeholder-image.png' });
                const isActive = index === slideIndex;
                return (
                  <button
                    key={`thumb-${index}`}
                    type="button"
                    onClick={() => onSlideChange(index)}
                    className={`relative overflow-hidden rounded-xl border transition ${
                      isActive
                        ? 'border-[#ff950e] shadow-[0_10px_30px_-15px_rgba(255,149,14,0.8)]'
                        : 'border-white/10 hover:border-[#ff950e]/40'
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Preview ${index + 1}`}
                      className={`h-20 w-full object-cover ${isActive ? '' : 'opacity-80'}`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                    {isActive && <div className="absolute inset-0 border-2 border-[#ff950e]/70" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
