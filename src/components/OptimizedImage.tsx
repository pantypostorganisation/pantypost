// src/components/OptimizedImage.tsx
'use client';

import Image, { StaticImageData } from 'next/image';
import React, { useMemo, useState } from 'react';
import { cn } from '@/utils/cn';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface OptimizedImageProps {
  src: string | StaticImageData;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

const DEFAULT_BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

/** Safe URL check (prevents javascript: and other unsafe schemes) */
function isSafeSrc(src: string | StaticImageData): boolean {
  if (typeof src !== 'string') return true; // StaticImageData is safe
  try {
    const trimmed = src.trim();
    // Allow data:, http:, https: only (Next/Image will also enforce remote patterns)
    if (trimmed.startsWith('data:')) return true;
    const u = new URL(trimmed, 'http://example.com'); // base for relative parsing
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

/** Clamp helper */
const clamp = (v: number | undefined, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(Math.max(v, min), max) : fallback;

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  sizes = '100vw',
  quality = 85,
  placeholder = 'blur',
  blurDataURL = DEFAULT_BLUR_DATA_URL,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Sanitize textual props
  const safeAlt = useMemo(() => sanitizeStrict(alt || 'image'), [alt]);
  const safeClassName = useMemo(() => sanitizeStrict(className || ''), [className]);

  // Guard dimensions and quality
  const safeWidth = clamp(width, 1, 4096, 500);
  const safeHeight = clamp(height, 1, 4096, 500);
  const safeQuality = clamp(quality, 1, 100, 85);

  // Validate source
  const safeSrcOk = isSafeSrc(src);

  const handleLoad = () => setIsLoading(false);
  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  if (error || !safeSrcOk) {
    return (
      <div className={cn('bg-gray-800 flex items-center justify-center', safeClassName)}>
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', safeClassName)}>
      {isLoading && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
      <Image
        src={src}
        alt={safeAlt}
        width={safeWidth}
        height={safeHeight}
        priority={priority}
        sizes={sizes}
        quality={safeQuality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        className={cn('transition-opacity duration-300', isLoading ? 'opacity-0' : 'opacity-100')}
      />
    </div>
  );
}
