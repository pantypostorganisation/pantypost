// src/hooks/profile/useSellerGallery.ts
import { useState, useRef, useEffect, useMemo } from 'react';
import type React from 'react';
import { sanitizeUrl } from '@/utils/security/sanitization';

export function useSellerGallery(galleryImages: string[]) {
  // Build a sanitized, validated list once per input change
  const sanitizedImages = useMemo(
    () =>
      (galleryImages || [])
        .map((img) => sanitizeUrl(img))
        .filter((u): u is string => !!u && u.length > 0),
    [galleryImages]
  );

  // Gallery modal state
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Slideshow state
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideshowInterval = 4000;

  // Keep indices in range when image list changes
  useEffect(() => {
    if (sanitizedImages.length === 0) {
      setSlideIndex(0);
      setCurrentImageIndex(0);
      setSelectedImage(null);
      return;
    }
    if (currentImageIndex >= sanitizedImages.length) {
      setCurrentImageIndex(0);
    }
    if (slideIndex >= sanitizedImages.length) {
      setSlideIndex(0);
    }
  }, [sanitizedImages.length, currentImageIndex, slideIndex]);

  // Slideshow effect
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (sanitizedImages.length > 1 && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSlideIndex((prev) => (prev + 1) % sanitizedImages.length);
      }, slideshowInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sanitizedImages.length, isPaused, slideshowInterval]);

  // Clear any pending resume timeouts on unmount
  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
    };
  }, []);

  // Handlers
  const handleImageClick = (image: string, index: number) => {
    const sanitized = sanitizeUrl(image);
    if (sanitized) {
      setCurrentImageIndex(index);
      setSelectedImage(sanitized);
      setShowGalleryModal(true);
      setIsPaused(true);
    }
  };

  const closeGalleryModal = () => {
    setShowGalleryModal(false);
    setSelectedImage(null);
    setIsPaused(false);
  };

  const handlePrevImage = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    if (!sanitizedImages.length) return;
    const prevIndex =
      (currentImageIndex - 1 + sanitizedImages.length) % sanitizedImages.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(sanitizedImages[prevIndex]);
  };

  const handleNextImage = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    if (!sanitizedImages.length) return;
    const nextIndex = (currentImageIndex + 1) % sanitizedImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(sanitizedImages[nextIndex]);
  };

  const pauseThenResume = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    setIsPaused(true);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      resumeTimeoutRef.current = null;
    }, 5000);
  };

  const goToPrevSlide = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    if (!sanitizedImages.length) return;
    setSlideIndex(
      (prev) => (prev - 1 + sanitizedImages.length) % sanitizedImages.length
    );
    pauseThenResume();
  };

  const goToNextSlide = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    if (!sanitizedImages.length) return;
    setSlideIndex((prev) => (prev + 1) % sanitizedImages.length);
    pauseThenResume();
  };

  const togglePause = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    setIsPaused((prev) => !prev);
  };

  return {
    // Use sanitized images
    galleryImages: sanitizedImages,

    // Slideshow state
    slideIndex,
    setSlideIndex,
    isPaused,
    setIsPaused,

    // Gallery modal state
    showGalleryModal,
    setShowGalleryModal,
    selectedImage,
    currentImageIndex,

    // Handlers
    handleImageClick,
    closeGalleryModal,
    handlePrevImage,
    handleNextImage,
    goToPrevSlide,
    goToNextSlide,
    togglePause,
  };
}
