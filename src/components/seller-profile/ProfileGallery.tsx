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
    <section className="mt-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#ff950e]">
            <ImageIcon className="h-3.5 w-3.5" />
            Gallery
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold text-white">Visual teasers &amp; behind-the-scenes</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-xl">
            Slip into the seller&apos;s world with curated shots designed to build anticipation for their premium drops.
          </p>
        </div>

        {galleryImages.length > 1 && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="inline-flex h-2 w-2 rounded-full bg-[#ff950e]" />
            Swipe through for the full reveal
          </div>
        )}
      </div>

      {galleryImages.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-gray-400 backdrop-blur-sm">
          <ImageIcon className="h-12 w-12 text-gray-600" />
          <p className="text-lg">No gallery photos yet. Stay tuned for new drops.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] shadow-[0_30px_60px_rgba(0,0,0,0.45)] backdrop-blur">
          {/* Slideshow Container */}
          <div className="relative h-[480px] sm:h-[540px] overflow-hidden">
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${slideIndex * 100}%)` }}
              aria-live="polite"
            >
              {galleryImages.map((image, index) => {
                const src = safeImageSrc(image, { placeholder: '/placeholder-image.png' });
                return (
                  <div
                    key={index}
                    className="flex h-full min-w-full flex-shrink-0 items-center justify-center bg-gradient-to-br from-black via-[#0d0306] to-black"
                  >
                    <img
                      src={src}
                      alt={`Gallery photo ${index + 1}`}
                      className="max-h-full w-auto max-w-full cursor-pointer rounded-3xl object-contain shadow-[0_10px_40px_rgba(0,0,0,0.6)] transition duration-500 hover:scale-[1.03]"
                      onClick={() => onImageClick(src, index)}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                );
              })}
            </div>

            {/* Navigation Arrows */}
            {galleryImages.length > 1 && (
              <>
                <button
                  className="absolute left-6 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white shadow-lg transition hover:bg-black/90"
                  onClick={(e) => onPrevSlide?.(e)}
                  aria-label="Previous image"
                  type="button"
                >
                  <ChevronLeft strokeWidth={3} className="h-5 w-5" />
                </button>

                <button
                  className="absolute right-6 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white shadow-lg transition hover:bg-black/90"
                  onClick={(e) => onNextSlide?.(e)}
                  aria-label="Next image"
                  type="button"
                >
                  <ChevronRight strokeWidth={3} className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Controls and image counter overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-t from-black via-black/60 to-transparent">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                {slideIndex + 1} / {galleryImages.length}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={onTogglePause}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white transition hover:bg-black/80"
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
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/60 text-white transition hover:bg-black/80"
                  aria-label="View fullscreen"
                  type="button"
                >
                  <Maximize className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
