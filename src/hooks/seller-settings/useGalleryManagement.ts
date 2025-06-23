// src/hooks/seller-settings/useGalleryManagement.ts
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { uploadMultipleToCloudinary } from '@/utils/cloudinary';
import { storageService } from '@/services';

export function useGalleryManagement() {
  const { user } = useAuth();
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

  // Load gallery images on mount
  useEffect(() => {
    const loadGalleryImages = async () => {
      if (user?.username) {
        const storedGallery = await storageService.getItem<string[]>(
          `profile_gallery_${user.username}`,
          []
        );
        setGalleryImages(storedGallery);
      }
    };

    loadGalleryImages();
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

  // Upload gallery images with Cloudinary
  const uploadGalleryImages = async (onSave: (images: string[]) => void) => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload to Cloudinary with progress tracking
      const uploadResults = await uploadMultipleToCloudinary(
        selectedFiles,
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );

      // Extract URLs from upload results
      const newImageUrls = uploadResults.map(result => result.url);
      
      // Update gallery with new URLs
      const updatedGallery = [...galleryImages, ...newImageUrls];
      setGalleryImages(updatedGallery);
      onSave(updatedGallery);

      setSelectedFiles([]);
      setUploadProgress(0);
      
      console.log('Gallery images uploaded successfully:', uploadResults);
    } catch (error) {
      console.error("Error uploading images:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload images: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
    uploadProgress,
    multipleFileInputRef,
    handleMultipleFileChange,
    removeSelectedFile,
    uploadGalleryImages,
    removeGalleryImage,
    clearAllGalleryImages
  };
}
