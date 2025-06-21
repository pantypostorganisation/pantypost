// src/components/seller-settings/GalleryManager.tsx
'use client';

import { X, ImageIcon, Trash2, PlusCircle, Image as ImageLucide } from 'lucide-react';
import { RefObject } from 'react';

interface GalleryManagerProps {
  galleryImages: string[];
  selectedFiles: File[];
  isUploading: boolean;
  uploadProgress?: number;
  multipleFileInputRef: RefObject<HTMLInputElement | null>;
  handleMultipleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadGalleryImages: () => void;
  removeGalleryImage: (index: number) => void;
  removeSelectedFile: (index: number) => void;
  clearAllGalleryImages: () => void;
}

export default function GalleryManager({
  galleryImages,
  selectedFiles,
  isUploading,
  uploadProgress = 0,
  multipleFileInputRef,
  handleMultipleFileChange,
  uploadGalleryImages,
  removeGalleryImage,
  removeSelectedFile,
  clearAllGalleryImages
}: GalleryManagerProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <ImageLucide className="w-5 h-5 mr-2 text-[#ff950e]" />
          Photo Gallery
        </h2>

        <div className="flex gap-2">
          {galleryImages.length > 0 && (
            <img
              src="/Clear_All.png"
              alt="Clear All"
              onClick={clearAllGalleryImages}
              className="w-16 h-auto object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-200"
            />
          )}
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        Add photos to your public gallery. These will be visible to all visitors on your profile page. Gallery changes are saved automatically.
      </p>

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-300 mb-1">
            <span>Uploading to cloud storage...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-[#ff950e] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* File Selection & Upload */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex-1">
            <label
              htmlFor="gallery-upload"
              className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-700 rounded-lg bg-black hover:border-[#ff950e] transition cursor-pointer w-full"
            >
              <input
                id="gallery-upload"
                ref={multipleFileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleFileChange}
                className="hidden"
                disabled={isUploading}
              />
              <PlusCircle className="w-5 h-5 text-[#ff950e]" />
              <span className="text-gray-300">Select multiple images...</span>
            </label>
          </div>

          <img
            src="/Add_To_Gallery.png"
            alt="Add to Gallery"
            onClick={uploadGalleryImages}
            className={`w-12 h-auto object-contain cursor-pointer hover:scale-[1.02] transition-transform duration-200 ${
              selectedFiles.length === 0 || isUploading
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          />
        </div>

        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Selected Images:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedFiles.map((file, index) => (
                <div key={index} className="relative group border border-gray-700 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Selected ${index + 1}`}
                    className="w-full h-28 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeSelectedFile(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-90 hover:opacity-100"
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 py-1 px-2 text-xs text-white truncate">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Current Gallery */}
      <div>
        <h3 className="text-lg font-medium text-white mb-3 flex items-center">
          Your Gallery ({galleryImages.length} photos)
        </h3>

        {galleryImages.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center">
            <ImageLucide className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Your gallery is empty. Add some photos to showcase your style!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryImages.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-40 object-cover rounded-lg border border-gray-700"
                />
                <button
                  onClick={() => removeGalleryImage(index)}
                  className="absolute top-2 right-2 bg-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUploading}
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
