// src/components/CloudinaryTest.tsx
'use client';

import { useState } from 'react';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { securityService } from '@/services/security.service';

export default function CloudinaryTest() {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    
    // Validate file before upload
    const validation = securityService.validateFileUpload(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
    });

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadToCloudinary(file);
      console.log('Upload successful!', result);
      setImageUrl(result.url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Cloudinary Upload Test</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Select an image to upload
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {isUploading && (
        <div className="text-blue-600">Uploading to Cloudinary...</div>
      )}

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {imageUrl && (
        <div className="mt-4">
          <p className="text-green-600 mb-2">Upload successful!</p>
          <img src={imageUrl} alt="Uploaded" className="max-w-full h-auto rounded" />
          <p className="text-xs text-gray-600 mt-2 break-all">URL: {imageUrl}</p>
        </div>
      )}
    </div>
  );
}
