// src/components/seller-settings/GalleryManager.tsx
'use client';

import { RefObject } from 'react';
import { Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { z } from 'zod';

const MAX_GALLERY_IMAGES = 20;

const PropsSchema = z.object({
  galleryImages: z.array(z.string()).default([]),
  selectedFiles: z.array(z.instanceof(File)).default([]),
  isUploading: z.boolean().default(false),
  uploadProgress: z.number().min(0).max(100).default(0),
  multipleFileInputRef: z.custom<RefObject<HTMLInputElement | null>>(), // Fixed: Allow null
  handleMultipleFileChange: z.function().args(z.any()).returns(z.void()),
  uploadGalleryImages: z.function().args().returns(z.void()),
  removeGalleryImage: z.function().args(z.number()).returns(z.void()),
  removeSelectedFile: z.function().args(z.number()).returns(z.void()),
  clearAllGalleryImages: z.function().args().returns(z.void()),
});

interface GalleryManagerProps extends z.infer<typeof PropsSchema> {}

export default function GalleryManager(props: GalleryManagerProps) {
  const parsed = PropsSchema.safeParse(props);
  const {
    galleryImages = [],
    selectedFiles = [],
    isUploading = false,
    uploadProgress = 0,
    multipleFileInputRef,
    handleMultipleFileChange,
    uploadGalleryImages,
    removeGalleryImage,
    removeSelectedFile,
    clearAllGalleryImages,
  } = parsed.success ? parsed.data : props;

  // Wrap async functions to handle Promise return
  const handleUploadClick = () => {
    // Call the async function but don't await it (returns void)
    uploadGalleryImages();
  };

  const handleRemoveGalleryImage = (index: number) => {
    // Call the function without awaiting
    removeGalleryImage(index);
  };

  const handleClearAll = () => {
    // Call the function without awaiting
    clearAllGalleryImages();
  };

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#ff950e]" />
          Photo Gallery
        </h2>
        <span className="text-sm text-gray-400">
          {galleryImages.length} / {MAX_GALLERY_IMAGES} images
        </span>
      </div>

      {/* Gallery Images Display */}
      {galleryImages.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">Current Gallery</h3>
            {galleryImages.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs text-red-500 hover:text-red-400 transition"
                disabled={isUploading}
                type="button"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {galleryImages.map((image, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={image}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-700"
                  loading="lazy"
                />
                <button
                  onClick={() => handleRemoveGalleryImage(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Remove image"
                  disabled={isUploading}
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Upload Section */}
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition">
          <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">
            {galleryImages.length === 0 
              ? "Add photos to your gallery" 
              : `Add more photos (${MAX_GALLERY_IMAGES - galleryImages.length} remaining)`}
          </p>
          <input
            ref={multipleFileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleMultipleFileChange}
            className="hidden"
            disabled={isUploading || galleryImages.length >= MAX_GALLERY_IMAGES}
          />
          <button
            onClick={() => multipleFileInputRef?.current?.click()}
            disabled={isUploading || galleryImages.length >= MAX_GALLERY_IMAGES}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            Select Images
          </button>
          <p className="text-xs text-gray-500 mt-2">
            JPEG, JPG, PNG, or WebP • Max 10MB per file
          </p>
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300 truncate max-w-[200px]">
                      {sanitizeStrict(file.name)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    onClick={() => removeSelectedFile(index)}
                    className="text-red-500 hover:text-red-400 transition p-1"
                    disabled={isUploading}
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Upload Button and Progress */}
            <div className="mt-4">
              {isUploading ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Uploading...</span>
                    <span className="text-[#ff950e]">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#ff950e] h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleUploadClick}
                  disabled={selectedFiles.length === 0}
                  className="w-full bg-[#ff950e] text-black font-bold py-2 rounded-lg hover:bg-[#e0850d] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  type="button"
                >
                  <Upload className="w-4 h-4" />
                  Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'Image' : 'Images'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Info Text */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-400">
          <strong className="text-gray-300">Tips:</strong> High-quality photos help attract more buyers. 
          Consider adding variety with different angles and styles. All images are automatically optimized for web display.
        </p>
      </div>
    </div>
  );
}
