// src/hooks/profile/useSellerGallery.ts
import { useState, useRef, useEffect } from 'react';

export function useSellerGallery(galleryImages: string[]) {
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
    if (galleryImages.length > 1 && !isPaused) {
      slideshowRef.current = setInterval(() => {
        setSlideIndex(prevIndex => (prevIndex + 1) % galleryImages.length);
      }, slideshowInterval);
    }
    
    return () => {
      if (slideshowRef.current) {
        clearInterval(slideshowRef.current);
      }
    };
  }, [galleryImages.length, isPaused]);

  // Handlers
  const handleImageClick = (image: string, index: number) => {
    if (image) {
      setCurrentImageIndex(index);
      setSelectedImage(image);
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
    if (galleryImages.length === 0) return;
    const prevIndex = (currentImageIndex - 1 + galleryImages.length) % galleryImages.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(galleryImages[prevIndex]);
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryImages.length === 0) return;
    const nextIndex = (currentImageIndex + 1) % galleryImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(galleryImages[nextIndex]);
  };

  const goToPrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex(prevIndex => (prevIndex - 1 + galleryImages.length) % galleryImages.length);
    
    // Reset the timer and pause temporarily
    if (slideshowRef.current) {
      clearInterval(slideshowRef.current);
      setIsPaused(true);
      setTimeout(() => setIsPaused(false), 5000); // Resume after 5 seconds
    }
  };
  
  const goToNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSlideIndex(prevIndex => (prevIndex + 1) % galleryImages.length);
    
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