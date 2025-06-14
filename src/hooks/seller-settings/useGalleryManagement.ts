// src/hooks/seller-settings/useGalleryManagement.ts
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

// Image compression utility
const compressImage = (file: File, maxWidth = 800): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedDataUrl);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export function useGalleryManagement() {
  const { user } = useAuth();
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

  // Load gallery images on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.username) {
      const storedGallery = localStorage.getItem(`profile_gallery_${user.username}`);
      if (storedGallery) {
        try {
          const parsedGallery = JSON.parse(storedGallery);
          if (Array.isArray(parsedGallery)) {
            setGalleryImages(parsedGallery);
          } else {
            console.error('Stored gallery data is not an array:', parsedGallery);
            setGalleryImages([]);
          }
        } catch (error) {
          console.error('Failed to parse stored gallery data:', error);
          setGalleryImages([]);
        }
      } else {
        setGalleryImages([]);
      }
    }
  }, [user?.username]);

  // Handle multiple file selection
  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);

    if (multipleFileInputRef.current) {
      multipleFileInputRef.current.value = '';
    }
  };

  // Remove selected file before upload
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload gallery images
  const uploadGalleryImages = async (onSave: (images: string[]) => void) => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const compressPromises = selectedFiles.map(file => compressImage(file));
      const compressedImages = await Promise.all(compressPromises);

      const updatedGallery = [...galleryImages, ...compressedImages];
      setGalleryImages(updatedGallery);
      onSave(updatedGallery);

      setSelectedFiles([]);
    } catch (error) {
      console.error("Error processing images:", error);
      alert("Failed to process one or more images. Please try again with different files.");
    } finally {
      setIsUploading(false);
    }
  };

  // Remove gallery image
  const removeGalleryImage = (index: number, onSave: (images: string[]) => void) => {
    const updatedGallery = galleryImages.filter((_, i) => i !== index);
    setGalleryImages(updatedGallery);
    onSave(updatedGallery);
  };

  // Clear all gallery images
  const clearAllGalleryImages = (onSave: (images: string[]) => void) => {
    if (window.confirm("Are you sure you want to remove all gallery images?")) {
      setGalleryImages([]);
      onSave([]);
    }
  };

  return {
    galleryImages,
    selectedFiles,
    isUploading,
    multipleFileInputRef,
    handleMultipleFileChange,
    removeSelectedFile,
    uploadGalleryImages,
    removeGalleryImage,
    clearAllGalleryImages
  };
}
