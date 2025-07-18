// src/components/myListings/ImageUploadSection.tsx
'use client';

import { Image as ImageIcon, Upload, X, MoveVertical, AlertCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

interface ImageUploadSectionProps {
  selectedFiles: File[];
  imageUrls: string[];
  isUploading: boolean;
  uploadProgress?: number;
  isAuction: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onUploadFiles: () => void;
  onRemoveImage: (url: string) => void;
  onImageReorder: (dragIndex: number, dropIndex: number) => void;
}

export default function ImageUploadSection({
  selectedFiles,
  imageUrls,
  isUploading,
  uploadProgress = 0,
  isAuction,
  onFileSelect,
  onRemoveFile,
  onUploadFiles,
  onRemoveImage,
  onImageReorder
}: ImageUploadSectionProps) {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const [fileError, setFileError] = useState<string>('');

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    onImageReorder(dragItem.current, dragOverItem.current);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Handle secure file selection with validation
  const handleSecureFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const files = Array.from(e.target.files || []);
    
    // Validate each file
    const validFiles: File[] = [];
    let hasError = false;
    
    files.forEach(file => {
      const validation = securityService.validateFileUpload(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
      });
      
      if (validation.valid) {
        validFiles.push(file);
      } else {
        hasError = true;
        setFileError(validation.error || 'Invalid file selected');
      }
    });
    
    // Only proceed if we have valid files
    if (validFiles.length > 0) {
      // Create a new event with only valid files
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          files: validFiles as unknown as FileList
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onFileSelect(newEvent);
    }
    
    // Clear the input if there were errors
    if (hasError && e.target) {
      e.target.value = '';
    }
  };

  // Sanitize upload progress
  const sanitizedProgress = sanitizeNumber(uploadProgress, 0, 100);

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Add Images</label>
        <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-700 rounded-lg bg-black transition cursor-pointer ${
          isAuction ? 'hover:border-purple-600' : 'hover:border-[#ff950e]'
        }`}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleSecureFileSelect}
            className="hidden"
          />
          <ImageIcon className={`w-5 h-5 ${isAuction ? 'text-purple-500' : 'text-[#ff950e]'}`} />
          <span className="text-gray-300">Select images from your computer</span>
        </label>
        
        {/* File error message */}
        {fileError && (
          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {fileError}
          </p>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="mt-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">{selectedFiles.length} file(s) selected</span>
            <button
              type="button"
              onClick={onUploadFiles}
              disabled={isUploading}
              className={`text-black px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                isAuction ? 'bg-purple-500 hover:bg-purple-600' : 'bg-[#ff950e] hover:bg-[#e0850d]'
              }`}
            >
              {isUploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Add to Listing
                </>
              )}
            </button>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Uploading images...</span>
                <span>{sanitizedProgress}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isAuction ? 'bg-purple-500' : 'bg-[#ff950e]'
                  }`}
                  style={{ width: `${sanitizedProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {selectedFiles.map((file, index) => (
              <div key={`selected-file-${index}`} className="relative border border-gray-700 rounded-lg overflow-hidden group">
                <SecureImage
                  src={URL.createObjectURL(file)}
                  alt={`Selected ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemoveFile(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 py-1 px-2">
                  <p className="text-xs text-white truncate">{sanitizeStrict(file.name)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {imageUrls.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Images (Drag to reorder)</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {imageUrls.map((url, index) => (
              <div
                key={`image-${index}-${url.substring(0, 20)}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`relative border rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group ${
                  index === 0 ? 'border-2 border-[#ff950e] shadow-md' : 'border-gray-700'
                }`}
              >
                <SecureImage
                  src={url}
                  alt={`Listing Image ${index + 1}`}
                  className={`w-full object-cover ${index === 0 ? 'h-32 sm:h-40' : 'h-24 sm:h-32'}`}
                />
                {index === 0 && (
                  <span className="absolute top-2 left-2 bg-[#ff950e] text-black text-xs px-2 py-0.5 rounded-full font-bold">
                    Main
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onRemoveImage(url)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black bg-opacity-20">
                  <MoveVertical className="w-6 h-6 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
