// src/components/seller-settings/GalleryManager.tsx
'use client';

import { X, ImageIcon, Trash2, PlusCircle, Image as ImageLucide } from 'lucide-react';
import { RefObject } from 'react';
import ImageUploadButton from './utils/ImageUploadButton';

interface GalleryManagerProps {
  galleryImages: string[];
  selectedFiles: File[];
  isUploading: boolean;
  multipleFileInputRef: RefObject<HTMLInputElement>;
  handleMultipleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadGalleryImages: () => void;
  removeGalleryImage: (index: number) => void;
  clearAllGalleryImages: () => void;
}

export default function GalleryManager({
  galleryImages,
  selectedFiles,
  isUploading,
  multipleFileInputRef,
  handleMultipleFileChange,
  uploadGalleryImages,
  removeGalleryImage,
  clearAllGalleryImages
}: GalleryManagerProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ImageLucide className="w-6 h-6 text-[#ff950e]" />
          Photo Gallery
        </h2>
        {galleryImages.length > 0 && (
          <button
            onClick={clearAllGalleryImages}
            className="text-red-500 text-sm hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Gallery Images Grid */}
      {galleryImages.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {galleryImages.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Gallery ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-700"
              />
              <button
                onClick={() => removeGalleryImage(index)}
                className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-black rounded-lg border border-dashed border-gray-700 text-gray-400 mb-6">
          <ImageIcon className="w-12 h-12 text-gray-600 mb-3" />
          <p className="text-lg">No gallery photos yet</p>
          <p className="text-sm mt-1">Upload photos to showcase in your profile</p>
        </div>
      )}

      {/* Upload Section */}
      <div className="space-y-4">
        {selectedFiles.length > 0 && (
          <div className="bg-black rounded-lg p-3">
            <p className="text-sm text-gray-300 mb-2">
              Selected: {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <span key={index} className="text-xs bg-gray-800 px-2 py-1 rounded">
                  {file.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <ImageUploadButton
            onClick={() => multipleFileInputRef.current?.click()}
            text={selectedFiles.length > 0 ? 'Change Files' : 'Select Photos'}
            icon={<PlusCircle className="w-4 h-4" />}
            className="flex-1"
          />
          
          {selectedFiles.length > 0 && (
            <ImageUploadButton
              onClick={uploadGalleryImages}
              text={isUploading ? 'Uploading...' : 'Upload to Gallery'}
              disabled={isUploading}
              className="flex-1"
            />
          )}
        </div>

        <input
          ref={multipleFileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleMultipleFileChange}
          className="hidden"
        />

        <p className="text-xs text-gray-500 text-center">
          Upload multiple photos to create an enticing gallery for potential subscribers
        </p>
      </div>
    </div>
  );
}
