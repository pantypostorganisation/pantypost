/**
 * Utility functions for image handling and optimization
 */

/**
 * Compresses an image file to a specified max dimension while maintaining aspect ratio
 * @param file - The image file to compress
 * @param maxDimension - The maximum width or height in pixels
 * @param quality - JPEG compression quality (0-1)
 * @returns A Promise resolving to the compressed image as a Data URL
 */
export const compressImage = (
  file: File, 
  maxDimension: number = 1200, 
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create FileReader to read the file
    const reader = new FileReader();
    
    reader.onload = (readerEvent) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while preserving aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas with new dimensions
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with specified quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      // Set image source to FileReader result
      if (typeof readerEvent.target?.result === 'string') {
        img.src = readerEvent.target.result;
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    // Read file as Data URL
    reader.readAsDataURL(file);
  });
};

/**
 * Estimates the file size in KB of a data URL
 * @param dataUrl - The data URL string
 * @returns The approximate size in KB
 */
export const estimateDataUrlSize = (dataUrl: string): number => {
  // Remove the data URL prefix to get just the base64 data
  const base64 = dataUrl.split(',')[1];
  
  // Calculate approximate size (base64 is ~4/3 the size of binary)
  if (base64) {
    const approximateBytes = (base64.length * 3) / 4;
    return Math.round(approximateBytes / 1024); // Convert to KB
  }
  
  return 0;
};

/**
 * Creates a placeholder image with initials
 * @param initials - The text to display (1-2 characters recommended)
 * @param backgroundColor - Background color in hex or name
 * @param textColor - Text color in hex or name
 * @returns A Data URL for the generated image
 */
export const createInitialsPlaceholder = (
  initials: string,
  backgroundColor: string = '#333333',
  textColor: string = '#ffffff',
  size: number = 200
): string => {
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  
  // Get drawing context
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }
  
  // Draw background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);
  
  // Draw text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${size/2}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials.substring(0, 2).toUpperCase(), size/2, size/2);
  
  // Return data URL
  return canvas.toDataURL('image/png');
};

/**
 * Safely handles file uploads by validating type and size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB
 * @param allowedTypes - Array of allowed MIME types
 * @returns An object with validation result and error message if any
 */
export const validateImageFile = (
  file: File,
  maxSizeMB: number = 5,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
): { valid: boolean; error?: string } => {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds the ${maxSizeMB}MB limit`
    };
  }
  
  return { valid: true };
};

/**
 * Loads and processes multiple image files
 * @param files - Array of files to process
 * @param maxDimension - Max dimension for compression
 * @param progressCallback - Optional callback for progress updates
 * @returns Promise resolving to array of processed image data URLs
 */
export const processMultipleImages = async (
  files: File[],
  maxDimension: number = 1200,
  progressCallback?: (progress: number) => void
): Promise<string[]> => {
  const results: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      // Validate the file
      const validation = validateImageFile(files[i]);
      if (!validation.valid) {
        console.warn(`Skipping invalid file ${files[i].name}: ${validation.error}`);
        continue;
      }
      
      // Compress the image
      const compressed = await compressImage(files[i], maxDimension);
      results.push(compressed);
      
      // Update progress if callback provided
      if (progressCallback) {
        progressCallback((i + 1) / files.length);
      }
    } catch (error) {
      console.error(`Error processing image ${files[i].name}:`, error);
    }
  }
  
  return results;
};