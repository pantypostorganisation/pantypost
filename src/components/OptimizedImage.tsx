// src/components/OptimizedImage.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onError?: () => void;
}

const PLACEHOLDER_IMAGE = '/placeholder-panty.png';

export default function OptimizedImage({
  src,
  alt,
  width = 300,
  height = 300,
  priority = false,
  className = '',
  sizes = '100vw',
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  fill = false,
  style,
  objectFit = 'cover',
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // ✅ Fix: Properly process all image sources
  const processedSrc = useMemo(() => {
    if (!currentSrc) return PLACEHOLDER_IMAGE;

    if (currentSrc.startsWith('http://') || currentSrc.startsWith('https://')) {
      return currentSrc;
    }

    if (currentSrc.startsWith('data:')) {
      return currentSrc;
    }

    if (currentSrc.startsWith('/uploads/')) {
      return `${
        process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com'
      }${currentSrc}`;
    }

    if (!currentSrc.includes('/')) {
      return `${
        process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com'
      }/uploads/listings/${currentSrc}`;
    }

    return currentSrc;
  }, [currentSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setImageError(false);
  }, []);

  const handleError = useCallback(() => {
    console.warn(`[OptimizedImage] Failed to load: ${processedSrc}`);
    setIsLoading(false);
    setImageError(true);

    if (currentSrc !== PLACEHOLDER_IMAGE) {
      console.log('[OptimizedImage] Falling back to placeholder');
      setCurrentSrc(PLACEHOLDER_IMAGE);
      setImageError(false);
      setIsLoading(true);
    }

    if (onError) onError();
  }, [currentSrc, processedSrc, onError]);

  const imageStyles: React.CSSProperties = {
    objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoading ? 0 : 1,
    ...style,
  };

  // ✅✅✅ FIXED FILL MODE (This is what was breaking Explore)
  if (fill) {
    return (
      <div
        className={`relative w-full h-full overflow-hidden ${className}`}
        style={style}
      >
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={processedSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          className="w-full h-full"
          style={{
            ...imageStyles,
            position: 'absolute',
            inset: 0,
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  // ✅ Fixed-dimension mode (used by Browse avatars, previews, etc.)
  return (
    <div
      className={`relative ${className}`}
      style={{ width, height, ...style }}
    >
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={processedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        style={imageStyles}
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
