// src/utils/cloudinary.ts

import { API_BASE_URL, buildApiUrl } from '@/services/api.config';

// Cloudinary configuration (kept for future use if needed)
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = () => {
  return CLOUD_NAME && 
         UPLOAD_PRESET && 
         CLOUD_NAME !== 'your_cloud_name' && 
         UPLOAD_PRESET !== 'your_upload_preset';
};

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
 * Get auth token from sessionStorage (where AuthContext stores it)
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem('auth_tokens');
    if (stored) {
      const tokens = JSON.parse(stored);
      return tokens?.token || null;
    }
  } catch (error) {
    console.error('Failed to get auth token:', error);
  }
  
  return null;
};

/**
 * Upload a single file - NOW USES BACKEND
 * This is the main function used for profile picture uploads
 * @param file - The file to upload
 * @param uploadType - Type of upload (profile-pic, gallery, verification, listing)
 * @returns Promise with upload result
 */
export const uploadToCloudinary = async (
  file: File,
  uploadType: 'profile-pic' | 'gallery' | 'verification' | 'listing' = 'profile-pic'
): Promise<CloudinaryUploadResult> => {
  // Validate file before upload
  if (!isValidImageFile(file)) {
    throw new Error(`Invalid file: ${file.name}. Must be JPEG, PNG, WebP, or GIF under 10MB.`);
  }
  
  console.log(`[Upload] Using backend for ${uploadType} upload`);
  
  // Use backend upload endpoint
  const formData = new FormData();
  
  // IMPORTANT: Match the field name to what the backend expects for each endpoint
  if (uploadType === 'profile-pic') {
    formData.append('profilePic', file);  // Backend expects 'profilePic' NOT 'file'
  } else if (uploadType === 'gallery') {
    formData.append('gallery', file);  // Backend expects 'gallery' for gallery
  } else if (uploadType === 'listing') {
    formData.append('images', file);  // Backend expects 'images' for listing
  } else if (uploadType === 'verification') {
    formData.append('file', file);  // Single file for verification
  } else {
    formData.append('file', file);  // Default to 'file'
  }
  
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Not authenticated. Please log in again.');
    }
    
    // Determine the correct endpoint based on upload type
    let endpoint = '/upload/profile-pic';
    if (uploadType === 'gallery') {
      endpoint = '/upload/gallery';
    } else if (uploadType === 'verification') {
      endpoint = '/upload/verification';
    } else if (uploadType === 'listing') {
      endpoint = '/upload/listing-images';
    }
    
    const url = buildApiUrl(endpoint);
    console.log('[Upload] Uploading to backend:', url);
    console.log('[Upload] File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
      credentials: 'include', // Include cookies
    });
    
    const responseText = await response.text();
    console.log('[Upload] Raw response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[Upload] Failed to parse response:', responseText);
      throw new Error('Invalid response from server');
    }
    
    if (!response.ok) {
      console.error('[Upload] Upload failed:', data);
      throw new Error(data.error || `Upload failed: ${response.statusText}`);
    }
    
    console.log('[Upload] Backend response:', data);
    
    if (!data.success || !data.data) {
      throw new Error(data.error || 'Invalid response from server');
    }
    
    // Handle different response formats based on upload type
    let uploadData = data.data;
    
    // For gallery uploads, data.data might be an object with newImages array
    if (uploadType === 'gallery' && data.data.newImages) {
      uploadData = {
        url: data.data.newImages[0],
        filename: `gallery_${Date.now()}`,
        size: file.size
      };
    }
    
    // For listing uploads, data.data might have a files array
    if (uploadType === 'listing' && data.data.files) {
      uploadData = data.data.files[0];
    }
    
    // Ensure URL is absolute
    let finalUrl = uploadData.url;
    if (!finalUrl.startsWith('http')) {
      // If it's a relative URL, prepend the API base URL
      if (finalUrl.startsWith('/')) {
        finalUrl = `${API_BASE_URL}${finalUrl}`;
      } else {
        finalUrl = `${API_BASE_URL}/${finalUrl}`;
      }
    }
    
    // Convert backend response to CloudinaryUploadResult format for compatibility
    return {
      url: finalUrl,
      publicId: uploadData.filename || `backend_${Date.now()}`,
      format: file.type.split('/')[1] || 'jpeg',
      width: uploadData.width || 400, // Default dimensions since backend doesn't return these
      height: uploadData.height || 600,
      bytes: uploadData.size || file.size,
      createdAt: uploadData.createdAt || new Date().toISOString(),
    };
  } catch (error) {
    console.error('[Upload] Backend upload error:', error);
    throw error instanceof Error ? error : new Error('Upload failed');
  }
};

/**
 * Upload for gallery images specifically
 */
export const uploadGalleryImage = async (file: File): Promise<CloudinaryUploadResult> => {
  return uploadToCloudinary(file, 'gallery');
};

/**
 * Upload for verification documents
 */
export const uploadVerificationDocument = async (file: File): Promise<CloudinaryUploadResult> => {
  return uploadToCloudinary(file, 'verification');
};

/**
 * Upload for listing images specifically
 */
export const uploadListingImage = async (file: File): Promise<CloudinaryUploadResult> => {
  return uploadToCloudinary(file, 'listing');
};

/**
 * Upload multiple files to backend with progress tracking
 * @param files - Array of files to upload
 * @param onProgress - Progress callback (NOW SECOND PARAMETER)
 * @param uploadType - Type of upload (NOW THIRD PARAMETER)
 * @returns Promise with array of upload results
 */
export const uploadMultipleToCloudinary = async (
  files: File[],
  onProgress?: (progress: number) => void,
  uploadType: 'gallery' | 'listing' = 'listing'
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
  
  // For listing uploads, batch upload to listing-images endpoint
  if (uploadType === 'listing' && files.length > 0) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file); // Note: 'images' for multiple listing files
    });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }
      
      const url = buildApiUrl('/upload/listing-images');
      console.log('[Upload] Batch uploading listing images:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || `Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Upload] Batch upload response:', data);
      
      if (!data.success || !data.data) {
        throw new Error('Invalid response from server');
      }
      
      // Convert response to CloudinaryUploadResult array
      const results: CloudinaryUploadResult[] = [];
      const uploadedFiles = data.data.files || [];
      
      uploadedFiles.forEach((fileData: any, index: number) => {
        let finalUrl = fileData.url;
        if (!finalUrl.startsWith('http')) {
          finalUrl = finalUrl.startsWith('/') 
            ? `${API_BASE_URL}${finalUrl}`
            : `${API_BASE_URL}/${finalUrl}`;
        }
        
        results.push({
          url: finalUrl,
          publicId: fileData.filename || `listing_${Date.now()}_${index}`,
          format: files[index]?.type.split('/')[1] || 'jpeg',
          width: 400,
          height: 600,
          bytes: fileData.size || files[index]?.size || 0,
          createdAt: new Date().toISOString(),
        });
      });
      
      if (onProgress) {
        onProgress(100);
      }
      
      return results;
    } catch (error) {
      console.error('[Upload] Batch upload error:', error);
      throw error instanceof Error ? error : new Error('Batch upload failed');
    }
  }
  
  // For gallery, we can upload all at once
  if (uploadType === 'gallery' && files.length > 0) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('gallery', file); // Note: 'gallery' for multiple gallery files
    });
    
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }
      
      const url = buildApiUrl('/upload/gallery');
      console.log('[Upload] Batch uploading to gallery:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(error.error || `Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[Upload] Batch upload response:', data);
      
      if (!data.success || !data.data) {
        throw new Error('Invalid response from server');
      }
      
      // Convert response to CloudinaryUploadResult array
      const results: CloudinaryUploadResult[] = [];
      const newImages = data.data.newImages || [];
      
      newImages.forEach((url: string, index: number) => {
        let finalUrl = url;
        if (!finalUrl.startsWith('http')) {
          finalUrl = finalUrl.startsWith('/') 
            ? `${API_BASE_URL}${finalUrl}`
            : `${API_BASE_URL}/${finalUrl}`;
        }
        
        results.push({
          url: finalUrl,
          publicId: `gallery_${Date.now()}_${index}`,
          format: files[index]?.type.split('/')[1] || 'jpeg',
          width: 400,
          height: 600,
          bytes: files[index]?.size || 0,
          createdAt: new Date().toISOString(),
        });
      });
      
      if (onProgress) {
        onProgress(100);
      }
      
      return results;
    } catch (error) {
      console.error('[Upload] Batch upload error:', error);
      throw error instanceof Error ? error : new Error('Batch upload failed');
    }
  }
  
  // Default fallback - return empty array
  return [];
};

/**
 * Delete an image - for backend images, this is handled server-side
 * @param publicId - The public ID of the image to delete
 * @returns Promise indicating success
 */
export const deleteFromCloudinary = async (publicId: string): Promise<CloudinaryDeleteResult> => {
  // Backend handles image deletion when profile is updated
  console.log('[Delete] Image deletion handled by backend:', publicId);
  return {
    result: 'ok',
    publicId: publicId,
  };
};

/**
 * Batch delete multiple images
 * @param publicIds - Array of public IDs to delete
 * @returns Promise with batch delete results
 */
export const batchDeleteFromCloudinary = async (
  publicIds: string[]
): Promise<BatchDeleteResult> => {
  const results: BatchDeleteResult = {
    successful: publicIds, // Backend handles deletion
    failed: [],
  };
  
  console.log('[Delete] Batch deletion handled by backend:', publicIds);
  return results;
};

/**
 * Delete image by URL (extracts public ID and deletes)
 * @param url - Image URL
 * @returns Promise indicating success
 */
export const deleteImageByUrl = async (url: string): Promise<CloudinaryDeleteResult> => {
  // Backend handles deletion
  return {
    result: 'ok',
    publicId: 'backend_managed',
  };
};

/**
 * Generate a thumbnail URL for an image
 * For backend images, returns the same URL (backend could implement thumbnail generation)
 * @param url - The original URL
 * @param width - Thumbnail width
 * @param height - Thumbnail height
 * @returns Thumbnail URL
 */
export const generateThumbnailUrl = (
  url: string,
  width: number = 300,
  height: number = 300
): string => {
  // For backend URLs, return as is (backend could implement query params for sizing)
  if (url.includes('/uploads/')) {
    return url; // Could add ?w=${width}&h=${height} if backend supports it
  }
  
  // For Cloudinary URLs (if ever used)
  if (url.includes('cloudinary.com')) {
    return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill,q_auto/`);
  }
  
  return url;
};

/**
 * Generate an optimized URL for an image
 * @param url - The original URL
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
  // For backend URLs, return as is
  if (url.includes('/uploads/')) {
    return url;
  }
  
  // For Cloudinary URLs (if ever used)
  if (url.includes('cloudinary.com')) {
    const { width, height, quality = 'auto', format = 'auto', blur } = options;
    
    let transformations = [`q_${quality}`, `f_${format}`];
    
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (blur) transformations.push(`e_blur:${blur}`);
    
    const transformString = transformations.join(',');
    return url.replace('/upload/', `/upload/${transformString}/`);
  }
  
  return url;
};

/**
 * Generate a blurred preview URL (useful for premium content)
 * @param url - The original URL
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
 * Convert a base64 string to a File object
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
 * Extract Cloudinary public ID from URL (kept for compatibility)
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
  return url.includes('cloudinary.com') && !!CLOUD_NAME && url.includes(CLOUD_NAME);
};

/**
 * Check if using backend or Cloudinary
 */
export const checkUploadConfig = (): { backend: boolean; message: string } => {
  return {
    backend: true,
    message: 'Using backend server for image uploads. All images are stored on your server.'
  };
};

/**
 * Check if Cloudinary is configured (for backward compatibility)
 */
export const checkCloudinaryConfig = (): { configured: boolean; message?: string } => {
  // Always return false since we're using backend now
  return {
    configured: false,
    message: 'Using backend server for image uploads instead of Cloudinary.'
  };
};