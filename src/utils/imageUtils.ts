// src/utils/imageUtils.ts
/**
 * Utility functions for image handling and optimization
 */

/**
 * Reads a File instance as a data URL.
 */
const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    const onLoad = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to read file'));
    };

    const onError = () => {
      reject(new Error('Failed to read file'));
    };

    reader.addEventListener('load', onLoad, { once: true });
    reader.addEventListener('error', onError, { once: true });

    reader.readAsDataURL(file);
  });

/**
 * Loads an image element from the provided data URL.
 */
const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.addEventListener('load', () => resolve(img), { once: true });
    img.addEventListener('error', () => reject(new Error('Failed to load image')), {
      once: true
    });

    img.src = dataUrl;
  });

/**
 * Calculates the scaled dimensions for an image while preserving its aspect ratio.
 */
const calculateDimensions = (
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } => {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  if (width > height) {
    return {
      width: maxDimension,
      height: Math.round((height * maxDimension) / width)
    };
  }

  return {
    width: Math.round((width * maxDimension) / height),
    height: maxDimension
  };
};

type CanvasBundle = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dispose: () => void;
};

const createCanvasBundle = (width: number, height: number): CanvasBundle | null => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.width = 0;
    canvas.height = 0;
    return null;
  }

  const dispose = () => {
    ctx.clearRect(0, 0, width, height);
    canvas.width = 0;
    canvas.height = 0;
  };

  return { canvas, ctx, dispose };
};

/**
 * Compresses an image file to a specified max dimension while maintaining aspect ratio
 * @param file - The image file to compress
 * @param maxDimension - The maximum width or height in pixels
 * @param quality - JPEG compression quality (0-1)
 * @returns A Promise resolving to the compressed image as a Data URL
 */
export const compressImage = async (
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.7
): Promise<string> => {
  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImageFromDataUrl(dataUrl);
  const { width, height } = calculateDimensions(img.width, img.height, maxDimension);
  const bundle = createCanvasBundle(width, height);
  if (!bundle) {
    throw new Error('Could not get canvas context');
  }

  try {
    bundle.ctx.drawImage(img, 0, 0, width, height);
    return bundle.canvas.toDataURL('image/jpeg', quality);
  } finally {
    bundle.dispose();
    img.src = '';
  }
};

/**
 * Estimates the file size in KB of a data URL
 * @param dataUrl - The data URL string
 * @returns The approximate size in KB
 */
export const estimateDataUrlSize = (dataUrl: string): number => {
  const [, base64 = ''] = dataUrl.split(',', 2);
  if (!base64) {
    return 0;
  }

  // Calculate approximate size (base64 is ~4/3 the size of binary)
  const approximateBytes = (base64.length * 3) / 4;
  return Math.round(approximateBytes / 1024); // Convert to KB
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
  const bundle = createCanvasBundle(size, size);
  if (!bundle) {
    return '';
  }

  try {
    // Draw background
    bundle.ctx.fillStyle = backgroundColor;
    bundle.ctx.fillRect(0, 0, size, size);

    // Draw text
    bundle.ctx.fillStyle = textColor;
    bundle.ctx.font = `bold ${size / 2}px Arial, sans-serif`;
    bundle.ctx.textAlign = 'center';
    bundle.ctx.textBaseline = 'middle';
    bundle.ctx.fillText(initials.substring(0, 2).toUpperCase(), size / 2, size / 2);

    // Get data URL
    return bundle.canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error creating initials placeholder:', error);
    return '';
  } finally {
    bundle.dispose();
  }
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
  const errors: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      // Validate the file
      const validation = validateImageFile(files[i]);
      if (!validation.valid) {
        console.warn(`Skipping invalid file ${files[i].name}: ${validation.error}`);
        errors.push(`${files[i].name}: ${validation.error}`);
        continue;
      }
      
      // Compress the image
      const compressed = await compressImage(files[i], maxDimension);
      results.push(compressed);
      
      // Update progress if callback provided
      progressCallback?.((i + 1) / files.length);

      // Force garbage collection hint by yielding control
      await new Promise((resolve) => setTimeout(resolve, 0));
      
    } catch (error) {
      console.error(`Error processing image ${files[i].name}:`, error);
      errors.push(`${files[i].name}: Processing failed`);
    }
  }
  
  // Log any errors that occurred
  if (errors.length > 0) {
    console.warn('Image processing completed with errors:', errors);
  }
  
  return results;
};