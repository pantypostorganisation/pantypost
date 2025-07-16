// src/hooks/profile/useSellerGallery.ts

import { useState, useRef, useEffect } from 'react';
import { sanitizeUrl } from '@/utils/security/sanitization';

export function useSellerGallery(galleryImages: string[]) {
  // Validate and sanitize gallery images
  const validatedImages = galleryImages.filter(img => {
    const sanitized = sanitizeUrl(img);
    return sanitized && sanitized.length > 0;
  });

  // Gallery modal state
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  
  // Slideshow state
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slideshowRef = useRef<NodeJS.Timeout | null>(null);
  const slideshowInterval = 4000;

  // Slideshow effect
  useEffect(() => {
    if (validatedImages.length > 1 && !isPaused) {
      slideshowRef.current = setInterval(() => {
        setSlideIndex(prevIndex => (prevIndex + 1) % validatedImages.length);
      }, slideshowInterval);
    }
    
    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
      }
    };
  }, [validatedImages.length, isPaused]);

  // Handlers
  const handleImageClick = (image: string, index: number) => {
    // Validate image URL before setting
    const sanitizedImage = sanitizeUrl(image);
    if (sanitizedImage) {
      setCurrentImageIndex(index);
      setSelectedImage(sanitizedImage);
      setShowGalleryModal(true);
      setIsPaused(true);
    }
  };

  const closeGalleryModal = () => {
    setShowGalleryModal(false);
    setSelectedImage(null);
    setIsPaused(false);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (validatedImages.length === 0) return;
    const prevIndex = (currentImageIndex - 1 + validatedImages.length) % validatedImages.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(validatedImages[prevIndex]);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (validatedImages.length === 0) return;
    const nextIndex = (currentImageIndex + 1) % validatedImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(validatedImages[nextIndex]);
  };

  const goToPrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex(prevIndex => (prevIndex - 1 + validatedImages.length) % validatedImages.length);
    
    // Reset the timer and pause temporarily
    if (slideshowRef.current) {
      clearInterval(slideshowRef.current);
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 5000); // Resume after 5 seconds
    }
  };
  
  const goToNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex(prevIndex => (prevIndex + 1) % validatedImages.length);
    
    // Reset the timer and pause temporarily
    if (slideshowRef.current) {
      clearInterval(slideshowRef.current);
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 5000); // Resume after 5 seconds
    }
  };

  const togglePause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPaused(prev => !prev);
  };

  return {
    // Use validated images instead of raw input
    galleryImages: validatedImages,
    
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