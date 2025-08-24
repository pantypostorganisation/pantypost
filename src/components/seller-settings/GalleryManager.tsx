// src/components/seller-settings/GalleryManager.tsx
'use client';

import { X, Image as ImageLucide, PlusCircle, AlertCircle } from 'lucide-react';
import React, { RefObject, useEffect, useMemo, useState } from 'react';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { z } from 'zod';

// ---- Props validation (keep function signatures, validate primitives) ----
const PropsSchema = z.object({
  galleryImages: z.array(z.string()).default([]),
  selectedFiles: z.array(z.any()).default([]), // File[] at runtime
  isUploading: z.boolean().default(false),
  uploadProgress: z.number().min(0).max(100).optional(),
  multipleFileInputRef: z.any(), // RefObject<HTMLInputElement | null>, left as any for runtime
  handleMultipleFileChange: z.function().args(z.any()).returns(z.void()),
  uploadGalleryImages: z.function().args().returns(z.void()),
  removeGalleryImage: z.function().args(z.number().int().nonnegative()).returns(z.void()),
  removeSelectedFile: z.function().args(z.number().int().nonnegative()).returns(z.void()),
  clearAllGalleryImages: z.function().args().returns(z.void()),
});

interface GalleryManagerProps extends z.infer<typeof PropsSchema> {}

// Helper: build a real FileList from an array of Files using DataTransfer
function filesToFileList(files: File[]): FileList {
  const dt = new DataTransfer();
  for (const f of files) dt.items.add(f);
  return dt.files;
}

// Child component that manages its own object URL & cleanup for each File preview
function SelectedFilePreview({
  file,
  index,
  onRemove,
  disabled,
}: {
  file: File;
  index: number;
  onRemove: (i: number) => void;
  disabled: boolean;
}) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore
      }
    };
  }, [file]);

  return (
    <div className="relative group border border-gray-700 rounded-lg overflow-hidden">
      <SecureImage src={url} alt={`Selected ${index + 1}`} className="w-full h-28 object-cover" />
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100 disabled:opacity-50"
        disabled={disabled}
        aria-label="Remove selected image"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 py-1 px-2 text-xs text-white truncate">
        {sanitizeStrict(file.name)}
      </div>
    </div>
  );
}

export default function GalleryManager(rawProps: GalleryManagerProps) {
  const parsed = PropsSchema.safeParse(rawProps);
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
  } = parsed.success
    ? parsed.data
    : {
        galleryImages: [],
        selectedFiles: [],
        isUploading: false,
        uploadProgress: 0,
        multipleFileInputRef: { current: null } as RefObject<HTMLInputElement | null>,
        handleMultipleFileChange: () => {},
        uploadGalleryImages: () => {},
        removeGalleryImage: () => {},
        removeSelectedFile: () => {},
        clearAllGalleryImages: () => {},
      };

  const [fileError, setFileError] = useState<string>('');

  // Sanitize upload progress for display and bar width
  const sanitizedProgress = sanitizeNumber(uploadProgress ?? 0, 0, 100, 0);

  // Handle secure file selection with validation
  const handleSecureFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      const validation = securityService.validateFileUpload(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      });

      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(validation.error || 'Invalid file');
      }
    });

    if (errors.length > 0) {
      setFileError(`${errors[0]}${errors.length > 1 ? ` (and ${errors.length - 1} more)` : ''}`);
    }

    if (validFiles.length > 0) {
      // Build a proper FileList to pass along to the original handler
      const fileList = filesToFileList(validFiles);
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          files: fileList,
        },
      } as React.ChangeEvent<HTMLInputElement>;

      handleMultipleFileChange(syntheticEvent);
    } else {
      // Clear the input if all were invalid
      if (e.target) {
        try {
          e.target.value = '';
        } catch {
          /* read-only in some browsers; ignore */
        }
      }
    }
  };

  const galleryCount = useMemo(
    () => (Number.isFinite(galleryImages.length) ? galleryImages.length : 0),
    [galleryImages.length]
  );

  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <ImageLucide className="w-5 h-5 mr-2 text-[#ff950e]" />
          Photo Gallery
        </h2>

        <div className="flex gap-2">
          {galleryImages.length > 0 && (
            <SecureImage
              src="/Clear_All.png"
              alt="Clear All"
              onClick={!isUploading ? clearAllGalleryImages : undefined}
              className={`w-16 h-auto object-contain transition-transform duration-200 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
              }`}
            />
          )}
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        Add photos to your public gallery. These will be visible to all visitors on your profile page. Gallery changes are
        saved automatically.
      </p>

      {/* Upload Progress */}
      {isUploading && sanitizedProgress > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-300 mb-1">
            <span>Uploading to cloud storage...</span>
            <span>{sanitizedProgress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-[#ff950e] h-2 rounded-full transition-all duration-300" style={{ width: `${sanitizedProgress}%` }} />
          </div>
        </div>
      )}

      {/* File Selection & Upload */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex-1">
            <label
              htmlFor="gallery-upload"
              className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg bg-black transition w-full ${
                isUploading ? 'border-gray-800 opacity-60 cursor-not-allowed' : 'border-gray-700 hover:border-[#ff950e] cursor-pointer'
              }`}
            >
              <input
                id="gallery-upload"
                ref={multipleFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleSecureFileChange}
                className="hidden"
                disabled={isUploading}
              />
              <PlusCircle className="w-5 h-5 text-[#ff950e]" />
              <span className="text-gray-300">Select multiple images...</span>
            </label>
          </div>

          <SecureImage
            src="/Add_To_Gallery.png"
            alt="Add to Gallery"
            onClick={selectedFiles.length > 0 && !isUploading ? uploadGalleryImages : undefined}
            className={`w-12 h-auto object-contain transition-transform duration-200 ${
              selectedFiles.length === 0 || isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
            }`}
          />
        </div>

        {/* File error message */}
        {fileError && (
          <p className="text-xs text-red-400 flex items-center gap-1 mb-2" role="alert" aria-live="assertive">
            <AlertCircle className="w-3 h-3" />
            {sanitizeStrict(fileError)}
          </p>
        )}

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Selected Images:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedFiles.map((file, index) => (
                <SelectedFilePreview
                  key={`${file.name}-${index}`}
                  file={file as File}
                  index={index}
                  onRemove={removeSelectedFile}
                  disabled={isUploading}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Current Gallery */}
      <div>
        <h3 className="text-lg font-medium text-white mb-3 flex items-center">Your Gallery ({galleryCount} photos)</h3>

        {galleryImages.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center">
            <ImageLucide className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Your gallery is empty. Add some photos to showcase your style!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryImages.map((img, index) => (
              <div key={`${img}-${index}`} className="relative group">
                <SecureImage src={img} alt={`Gallery ${index + 1}`} className="w-full h-40 object-cover rounded-lg border border-gray-700" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(index)}
                  className="absolute top-2 right-2 bg-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  disabled={isUploading}
                  aria-label="Remove image from gallery"
                >
                  <X size={16} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
