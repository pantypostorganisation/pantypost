// src/components/OptimizedImage.tsx
'use client';

import Image, { StaticImageData } from 'next/image';
import React, { useState, useCallback, useMemo } from 'react';

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
  fill?: boolean;
  style?: React.CSSProperties;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onError?: () => void;
}

const DEFAULT_BLUR_DATA_URL =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

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
  blurDataURL = DEFAULT_BLUR_DATA_URL,
  fill = false,
  style,
  objectFit = 'cover',
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Process the image source to ensure it's a valid URL
  const processedSrc = useMemo(() => {
    // If it's a StaticImageData object, return as is
    if (typeof currentSrc !== 'string') {
      return currentSrc;
    }

    // If it's already a full URL, return as is
    if (currentSrc.startsWith('http://') || currentSrc.startsWith('https://')) {
      return currentSrc;
    }

    // If it's a data URL, return as is
    if (currentSrc.startsWith('data:')) {
      return currentSrc;
    }

    // If it starts with /uploads/, prepend the API URL
    if (currentSrc.startsWith('/uploads/')) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com'}${currentSrc}`;
    }

    // If it's just a filename (no path), assume it's in /uploads/listings/
    if (!currentSrc.includes('/')) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com'}/uploads/listings/${currentSrc}`;
    }

    // Otherwise, assume it's a local public folder path
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

    // If we haven't already tried the placeholder, use it
    if (currentSrc !== PLACEHOLDER_IMAGE && typeof currentSrc === 'string') {
      console.log('[OptimizedImage] Falling back to placeholder');
      setCurrentSrc(PLACEHOLDER_IMAGE);
      setImageError(false); // Reset error for placeholder attempt
      setIsLoading(true);
    }

    if (onError) {
      onError();
    }
  }, [currentSrc, processedSrc, onError]);

  // For fill mode
  if (fill) {
    return (
      <div className={`relative ${className}`} style={style}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
        )}
        <Image
          src={processedSrc}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          style={{ objectFit }}
          className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          unoptimized={true} // Important: disable Next.js optimization for external URLs
        />
      </div>
    );
  }

  // For fixed dimensions
  return (
    <div className={`relative ${className}`} style={{ width, height, ...style }}>
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width, height }}
        />
      )}
      <Image
        src={processedSrc}
        alt={alt}
        width={width}
        height={height}
        quality={quality}
        priority={priority}
        sizes={sizes}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        style={{ objectFit, ...style }}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        unoptimized={true} // Important: disable Next.js optimization for external URLs
      />
    </div>
  );
}
