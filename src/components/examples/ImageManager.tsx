// src/components/examples/ImageManager.tsx
// Example component showing how to use the Cloudinary delete functionality

'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Trash2, X, AlertCircle } from 'lucide-react';
import { useCloudinaryDelete } from '@/hooks/useCloudinaryDelete';
import { generateThumbnailUrl } from '@/utils/cloudinary';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';

interface ImageManagerProps {
  images: string[]; // Array of Cloudinary URLs
  onImagesDeleted?: (remainingImages: string[]) => void;
  allowMultiSelect?: boolean;
}

function isSafeCloudinaryUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const isHttp = u.protocol === 'https:' || u.protocol === 'http:';
    const isCloudinary =
      u.hostname.endsWith('cloudinary.com') || u.hostname.endsWith('res.cloudinary.com');
    return isHttp && isCloudinary;
  } catch {
    return false;
  }
}

export function ImageManager({
  images,
  onImagesDeleted,
  allowMultiSelect = false,
}: ImageManagerProps) {
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { deleteImage, deleteImages, isDeleting } = useCloudinaryDelete();

  // Only render Cloudinary HTTPS images we consider safe
  const safeImages = useMemo(() => images.filter(isSafeCloudinaryUrl), [images]);

  // Drop any selections that no longer exist
  useEffect(() => {
    setSelectedImages((prev) => {
      const next = new Set<string>();
      for (const url of prev) {
        if (safeImages.includes(url)) next.add(url);
      }
      return next;
    });
  }, [safeImages]);

  const clearSelection = useCallback(() => setSelectedImages(new Set()), []);

  const handleSelectImage = (imageUrl: string) => {
    if (!allowMultiSelect) {
      setSelectedImages(new Set([imageUrl]));
      return;
    }
    setSelectedImages((prev) => {
      const next = new Set(prev);
      next.has(imageUrl) ? next.delete(imageUrl) : next.add(imageUrl);
      return next;
    });
  };

  const commitDeletion = (deleted: Set<string>) => {
    const remaining = images.filter((img) => !deleted.has(img));
    onImagesDeleted?.(remaining);
    clearSelection();
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return;
    setShowConfirmDialog(false);

    const toDelete = Array.from(selectedImages).filter(isSafeCloudinaryUrl);
    if (toDelete.length === 0) {
      clearSelection();
      return;
    }

    try {
      if (toDelete.length === 1) {
        const ok = await deleteImage(toDelete[0]);
        if (ok) commitDeletion(new Set(toDelete));
      } else {
        const result = await deleteImages(toDelete);
        if (result.successful?.length) {
          commitDeletion(new Set(result.successful));
        }
      }
    } catch {
      // Silently swallow here; your hook likely surfaces its own error UI.
      // If you want inline error text, we can add a small alert bar.
    }
  };

  const handleDeleteSingle = async (imageUrl: string) => {
    if (!isSafeCloudinaryUrl(imageUrl)) return;
    const confirmed = window.confirm('Are you sure you want to delete this image?');
    if (!confirmed) return;

    try {
      const ok = await deleteImage(imageUrl);
      if (ok) {
        commitDeletion(new Set([imageUrl]));
      }
    } catch {
      // see note above
    }
  };

  const onTileKeyDown = (e: React.KeyboardEvent, imageUrl: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelectImage(imageUrl);
    }
    if (!allowMultiSelect && (e.key === 'Delete' || e.key === 'Backspace')) {
      e.preventDefault();
      handleDeleteSingle(imageUrl);
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
              onClick={clearSelection}
              className="px-3 py-1 text-sm text-gray-400 hover:text-white transition-colors"
              disabled={isDeleting}
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
        {safeImages.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-10">
            No images to display.
          </div>
        ) : (
          safeImages.map((imageUrl, idx) => {
            const isSelected = selectedImages.has(imageUrl);
            const thumb = generateThumbnailUrl(imageUrl, 200, 200);

            return (
              <div
                key={imageUrl}
                className={`relative group rounded-lg overflow-hidden cursor-pointer transition-all focus-within:ring-2 focus-within:ring-[#ff950e] ${
                  isSelected ? 'ring-2 ring-[#ff950e] ring-offset-2 ring-offset-gray-900' : ''
                }`}
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
                onClick={() => allowMultiSelect && handleSelectImage(imageUrl)}
                onKeyDown={(e) => onTileKeyDown(e, imageUrl)}
              >
                <SecureImage
                  src={thumb}
                  alt={`Image ${idx + 1}`}
                  className="w-full h-48 object-cover"
                  fallbackSrc="/placeholder-image.png"
                />

                {/* Overlay with actions */}
                <div
                  className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {!allowMultiSelect && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSingle(imageUrl);
                      }}
                      disabled={isDeleting}
                      className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Delete image"
                      title="Delete image"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}

                  {allowMultiSelect && isSelected && (
                    <div
                      aria-hidden
                      className="w-8 h-8 bg-[#ff950e] rounded-full flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
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
                  Delete {selectedImages.size} image{selectedImages.size > 1 ? 's' : ''}?
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  This action cannot be undone. The selected image
                  {selectedImages.size > 1 ? 's' : ''} will be permanently deleted from Cloudinary.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    disabled={isDeleting}
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
