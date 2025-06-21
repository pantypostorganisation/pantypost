// src/utils/cloudinary.ts

export const CLOUD_NAME = 'ddanxxkwz';
export const UPLOAD_PRESET = 'pantypost_upload';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  thumbnailUrl: string;
}

export interface CloudinaryError {
  message: string;
  code?: string;
}

/**
 * Upload a single file to Cloudinary
 * @param file - The file to upload
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  // Validate file before upload
  if (!isValidImageFile(file)) {
    const fileSize = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(
      `Invalid file: ${file.name}. ` +
      `Type: ${file.type || 'unknown'}, Size: ${fileSize}MB. ` +
      `Must be JPEG, PNG, WebP, or GIF under 10MB.`
    );
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
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }
    
    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      thumbnailUrl: data.secure_url.replace('/upload/', '/upload/w_300,h_300,c_fill,q_auto/')
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param files - Array of files to upload
 * @param onProgress - Optional callback for progress updates
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
        // In production, you'd delete these from Cloudinary via your backend
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
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // Note: This requires server-side implementation with API credentials
  // For now, we'll just log the intention
  console.log('Delete requested for:', publicId);
  // In production, this would make a call to your backend API
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