// src/hooks/seller-settings/useGalleryManagement.ts
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

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
    if (files) {
      setSelectedFiles(Array.from(files));
    }
  };

  // Upload gallery images
  const uploadGalleryImages = async (onSave: (images: string[]) => void) => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of selectedFiles) {
        const reader = new FileReader();
        const result = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newImages.push(result);
      }

      const updatedGallery = [...galleryImages, ...newImages];
      setGalleryImages(updatedGallery);
      setSelectedFiles([]);
      onSave(updatedGallery);

      // Reset file input
      if (multipleFileInputRef.current) {
        multipleFileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload some images. Please try again with different files.");
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
    uploadGalleryImages,
    removeGalleryImage,
    clearAllGalleryImages
  };
}
