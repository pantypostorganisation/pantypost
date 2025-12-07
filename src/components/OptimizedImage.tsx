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
  quality = 75, // kept for API compat, not used by <img>
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

  const processedSrc = useMemo(() => {
    let srcVal = (currentSrc || '').trim();

    // If nothing at all, fall back immediately
    if (!srcVal) {
      return PLACEHOLDER_IMAGE;
    }

    // Full URLs or data URLs – just use them
    if (
      srcVal.startsWith('http://') ||
      srcVal.startsWith('https://') ||
      srcVal.startsWith('data:')
    ) {
      return srcVal;
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com';

    // Normalise bare "uploads/..." -> "/uploads/..."
    if (srcVal.startsWith('uploads/')) {
      srcVal = `/${srcVal}`;
    }

    // Anything under /uploads/ should come from the API domain
    if (srcVal.startsWith('/uploads/')) {
      return `${apiBase}${srcVal}`;
    }

    // Bare filename (no slash) – assume listing/post upload filename
    if (!srcVal.includes('/')) {
      return `${apiBase}/uploads/listings/${srcVal}`;
    }

    // Local public asset like "images/foo.png" or "/images/foo.png"
    if (!srcVal.startsWith('/')) {
      return `/${srcVal}`;
    }

    // Already a root-relative path such as "/images/foo.png"
    return srcVal;
  }, [currentSrc]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setImageError(false);
  }, []);

  const handleError = useCallback(() => {
    console.warn('[OptimizedImage] Failed to load:', processedSrc);
    setIsLoading(false);

    // If we haven’t already tried our local placeholder, switch to it
    if (currentSrc !== PLACEHOLDER_IMAGE) {
      console.log('[OptimizedImage] Falling back to local placeholder');
      setCurrentSrc(PLACEHOLDER_IMAGE);
      setImageError(false);
      setIsLoading(true);
    } else {
      // Placeholder also failed
      setImageError(true);
    }

    if (onError) {
      onError();
    }
  }, [currentSrc, processedSrc, onError]);

  const imageStyles: React.CSSProperties = {
    objectFit,
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoading ? 0 : 1,
    ...style,
  };

  if (fill) {
    return (
      <div className={`relative ${className}`} style={style}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={processedSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          style={{
            ...imageStyles,
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

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
