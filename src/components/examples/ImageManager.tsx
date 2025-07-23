// src/components/examples/ImageManager.tsx
// Example component showing how to use the Cloudinary delete functionality

import React, { useState } from 'react';
import { Trash2, X, AlertCircle } from 'lucide-react';
import { useCloudinaryDelete } from '@/hooks/useCloudinaryDelete';
import { generateThumbnailUrl } from '@/utils/cloudinary';

interface ImageManagerProps {
  images: string[]; // Array of Cloudinary URLs
  onImagesDeleted?: (remainingImages: string[]) => void;
  allowMultiSelect?: boolean;
}

export function ImageManager({ 
  images, 
  onImagesDeleted,
  allowMultiSelect = false 
}: ImageManagerProps) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { deleteImage, deleteImages, isDeleting } = useCloudinaryDelete();

  const handleSelectImage = (imageUrl: string) => {
    if (!allowMultiSelect) {
      // Single selection mode
      setSelectedImages(new Set([imageUrl]));
    } else {
      // Multi-selection mode
      setSelectedImages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(imageUrl)) {
          newSet.delete(imageUrl);
        } else {
          newSet.add(imageUrl);
        }
        return newSet;
      });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return;

    setShowConfirmDialog(false);
    
    const imagesToDelete = Array.from(selectedImages);
    
    if (imagesToDelete.length === 1) {
      // Single image delete
      const success = await deleteImage(imagesToDelete[0]);
      if (success) {
        const remainingImages = images.filter(img => img !== imagesToDelete[0]);
        onImagesDeleted?.(remainingImages);
        setSelectedImages(new Set());
      }
    } else {
      // Batch delete
      const result = await deleteImages(imagesToDelete);
      if (result.successful.length > 0) {
        const remainingImages = images.filter(img => !selectedImages.has(img));
        onImagesDeleted?.(remainingImages);
        setSelectedImages(new Set());
      }
    }
  };

  const handleDeleteSingle = async (imageUrl: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this image?');
    if (!confirmed) return;

    const success = await deleteImage(imageUrl);
    if (success) {
      const remainingImages = images.filter(img => img !== imageUrl);
      onImagesDeleted?.(remainingImages);
      setSelectedImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(imageUrl);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with bulk actions */}
      {allowMultiSelect && selectedImages.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-300">
            {selectedImages.size} image{selectedImages.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedImages(new Set())}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setShowConfirmDialog(true)}
              disabled={isDeleting}
              className="px-4 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((imageUrl, index) => {
          const isSelected = selectedImages.has(imageUrl);
          const thumbnailUrl = generateThumbnailUrl(imageUrl, 200, 200);
          
          return (
            <div
              key={index}
              className={`relative group rounded-lg overflow-hidden cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-[#ff950e] ring-offset-2 ring-offset-gray-900' : ''
              }`}
              onClick={() => allowMultiSelect && handleSelectImage(imageUrl)}
            >
              <img
                src={thumbnailUrl}
                alt={`Image ${index + 1}`}
                className="w-full h-48 object-cover"
              />
              
              {/* Overlay with actions */}
              <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                {!allowMultiSelect && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSingle(imageUrl);
                    }}
                    disabled={isDeleting}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                {allowMultiSelect && isSelected && (
                  <div className="w-8 h-8 bg-[#ff950e] rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirm dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-red-900/20 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Delete {selectedImages.size} Image{selectedImages.size > 1 ? 's' : ''}?
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  This action cannot be undone. The image{selectedImages.size > 1 ? 's' : ''} will be permanently deleted.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
