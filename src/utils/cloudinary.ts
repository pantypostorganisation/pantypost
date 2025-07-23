// src/utils/cloudinary.ts

// Cloudinary configuration
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

// Types
export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  createdAt: string;
}

export interface CloudinaryDeleteResult {
  result: 'ok' | 'not found' | 'error';
  publicId: string;
}

export interface BatchDeleteResult {
  successful: string[];
  failed: Array<{
    publicId: string;
    error: string;
  }>;
}

/**
 * Upload a single file to Cloudinary
 * @param file - The file to upload
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (
  file: File
): Promise<CloudinaryUploadResult> => {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing');
  }
  
  // Validate file before upload
  if (!isValidImageFile(file)) {
    throw new Error(`Invalid file: ${file.name}. Must be JPEG, PNG, WebP, or GIF under 10MB.`);
  }
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${response.statusText || error}`);
    }
    
    const data = await response.json();
    
    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error instanceof Error ? error : new Error('Upload failed');
  }
};

/**
 * Upload multiple files to Cloudinary with progress tracking
 * @param files - Array of files to upload
 * @param onProgress - Progress callback
 * @returns Promise with array of upload results
 */
export const uploadMultipleToCloudinary = async (
  files: File[],
  onProgress?: (progress: number) => void
): Promise<CloudinaryUploadResult[]> => {
  // Validate all files first
  const invalidFiles = files.filter(file => !isValidImageFile(file));
  if (invalidFiles.length > 0) {
    const invalidFileNames = invalidFiles.map(f => f.name).join(', ');
    throw new Error(
      `Invalid files detected: ${invalidFileNames}. ` +
      `All files must be JPEG, PNG, WebP, or GIF under 10MB each.`
    );
  }
  
  const results: CloudinaryUploadResult[] = [];
  const totalFiles = files.length;
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadToCloudinary(files[i]);
      results.push(result);
      
      if (onProgress) {
        const progress = ((i + 1) / totalFiles) * 100;
        onProgress(progress);
      }
    } catch (error) {
      console.error(`Failed to upload file ${i + 1}:`, error);
      // Clean up any successful uploads if one fails
      if (results.length > 0) {
        console.log('Rolling back successful uploads:', results.map(r => r.publicId));
        // Attempt to delete successfully uploaded images
        await batchDeleteFromCloudinary(results.map(r => r.publicId));
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload file ${files[i].name}: ${errorMessage}`);
    }
  }
  
  return results;
};

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Promise indicating success
 */
export const deleteFromCloudinary = async (publicId: string): Promise<CloudinaryDeleteResult> => {
  try {
    // For now, make a request to the mock API endpoint
    const response = await fetch('/api/cloudinary/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Delete failed' }));
      throw new Error(error.message || `Delete failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Delete from Cloudinary error:', error);
    throw error instanceof Error ? error : new Error('Delete failed');
  }
};

/**
 * Batch delete multiple images from Cloudinary
 * @param publicIds - Array of public IDs to delete
 * @returns Promise with batch delete results
 */
export const batchDeleteFromCloudinary = async (
  publicIds: string[]
): Promise<BatchDeleteResult> => {
  const results: BatchDeleteResult = {
    successful: [],
    failed: [],
  };

  // Process deletions in parallel with error handling for each
  const deletePromises = publicIds.map(async (publicId) => {
    try {
      const result = await deleteFromCloudinary(publicId);
      if (result.result === 'ok') {
        results.successful.push(publicId);
      } else {
        results.failed.push({
          publicId,
          error: result.result === 'not found' ? 'Image not found' : 'Delete failed',
        });
      }
    } catch (error) {
      results.failed.push({
        publicId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  await Promise.allSettled(deletePromises);
  return results;
};

/**
 * Delete image by URL (extracts public ID and deletes)
 * @param url - Cloudinary URL
 * @returns Promise indicating success
 */
export const deleteImageByUrl = async (url: string): Promise<CloudinaryDeleteResult> => {
  const publicId = extractPublicId(url);
  if (!publicId) {
    throw new Error('Invalid Cloudinary URL: Unable to extract public ID');
  }
  
  return deleteFromCloudinary(publicId);
};

/**
 * Generate a thumbnail URL for a Cloudinary image
 * @param url - The original Cloudinary URL
 * @param width - Thumbnail width
 * @param height - Thumbnail height
 * @returns Thumbnail URL
 */
export const generateThumbnailUrl = (
  url: string,
  width: number = 300,
  height: number = 300
): string => {
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto/`);
};

/**
 * Generate an optimized URL for a Cloudinary image
 * @param url - The original Cloudinary URL
 * @param options - Optimization options
 * @returns Optimized URL
 */
export const generateOptimizedUrl = (
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number | 'auto';
    format?: string;
    blur?: number;
  } = {}
): string => {
  const { width, height, quality = 'auto', format = 'auto', blur } = options;
  
  let transformations = [`q_${quality}`, `f_${format}`];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (blur) transformations.push(`e_blur:${blur}`);
  
  const transformString = transformations.join(',');
  return url.replace('/upload/', `/upload/${transformString}/`);
};

/**
 * Generate a blurred preview URL (useful for premium content)
 * @param url - The original Cloudinary URL
 * @param blurLevel - Blur intensity (100-2000, higher = more blur)
 * @returns Blurred URL
 */
export const generateBlurredUrl = (url: string, blurLevel: number = 1000): string => {
  return generateOptimizedUrl(url, { blur: blurLevel, quality: 70 });
};

/**
 * Validate if a file is an acceptable image type
 * @param file - The file to validate
 * @returns Boolean indicating if file is valid
 */
export const isValidImageFile = (file: File): boolean => {
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!acceptedTypes.includes(file.type)) {
    console.warn(`Invalid file type: ${file.type} for file: ${file.name}`);
    return false;
  }
  
  if (file.size > maxSize) {
    console.warn(`File too large: ${file.size} bytes for file: ${file.name}`);
    return false;
  }
  
  return true;
};

/**
 * Get human-readable file size
 * @param bytes - File size in bytes
 * @returns Formatted string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Convert a base64 string to a File object for Cloudinary upload
 * @param base64 - The base64 string
 * @param filename - The filename to use
 * @returns File object
 */
export const base64ToFile = (base64: string, filename: string): File => {
  // Handle data URL format
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};

/**
 * Extract Cloudinary public ID from URL
 * @param url - Cloudinary URL
 * @returns Public ID or null if not a valid Cloudinary URL
 */
export const extractPublicId = (url: string): string | null => {
  try {
    const regex = /\/v\d+\/(.+)\.[a-zA-Z]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

/**
 * Check if a URL is a Cloudinary URL
 * @param url - URL to check
 * @returns Boolean
 */
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('cloudinary.com') && url.includes(CLOUD_NAME);
};