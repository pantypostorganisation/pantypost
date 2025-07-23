// src/hooks/useCloudinaryDelete.ts

import { useState, useCallback } from 'react';
import { useToast } from '@/context/ToastContext';
import { 
  deleteFromCloudinary, 
  batchDeleteFromCloudinary,
  deleteImageByUrl,
  extractPublicId,
  CloudinaryDeleteResult,
  BatchDeleteResult 
} from '@/utils/cloudinary';

interface UseCloudinaryDeleteReturn {
  isDeleting: boolean;
  deleteImage: (publicIdOrUrl: string) => Promise<boolean>;
  deleteImages: (publicIdsOrUrls: string[]) => Promise<BatchDeleteResult>;
  deleteImageByPublicId: (publicId: string) => Promise<boolean>;
  deleteImagesByPublicIds: (publicIds: string[]) => Promise<BatchDeleteResult>;
}

export function useCloudinaryDelete(): UseCloudinaryDeleteReturn {
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  // Delete single image (accepts URL or public ID)
  const deleteImage = useCallback(async (publicIdOrUrl: string): Promise<boolean> => {
    setIsDeleting(true);
    
    try {
      let result: CloudinaryDeleteResult;
      
      // Check if it's a URL or public ID
      if (publicIdOrUrl.includes('cloudinary.com')) {
        // It's a URL, extract public ID
        const publicId = extractPublicId(publicIdOrUrl);
        if (!publicId) {
          toast.error('Invalid Image', 'Unable to extract image ID from URL');
          return false;
        }
        result = await deleteFromCloudinary(publicId);
      } else {
        // It's already a public ID
        result = await deleteFromCloudinary(publicIdOrUrl);
      }

      if (result.result === 'ok') {
        toast.success('Image Deleted', 'The image has been successfully removed');
        return true;
      } else if (result.result === 'not found') {
        toast.warning('Image Not Found', 'The image may have already been deleted');
        return true; // Consider it a success if already deleted
      } else {
        toast.error('Delete Failed', 'Unable to delete the image. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('Delete image error:', error);
      toast.error(
        'Delete Failed', 
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [toast]);

  // Delete multiple images (accepts URLs or public IDs)
  const deleteImages = useCallback(async (publicIdsOrUrls: string[]): Promise<BatchDeleteResult> => {
    setIsDeleting(true);
    
    try {
      // Convert URLs to public IDs if needed
      const publicIds = publicIdsOrUrls.map(item => {
        if (item.includes('cloudinary.com')) {
          const publicId = extractPublicId(item);
          if (!publicId) {
            console.warn(`Unable to extract public ID from URL: ${item}`);
            return null;
          }
          return publicId;
        }
        return item;
      }).filter((id): id is string => id !== null);

      if (publicIds.length === 0) {
        toast.error('No Valid Images', 'No valid images found to delete');
        return { successful: [], failed: [] };
      }

      const toastId = toast.loading(`Deleting ${publicIds.length} image${publicIds.length > 1 ? 's' : ''}...`);
      
      const result = await batchDeleteFromCloudinary(publicIds);
      
      // Update toast based on results
      if (result.failed.length === 0) {
        toast.updateToast(toastId, {
          type: 'success',
          title: 'All Images Deleted',
          message: `Successfully deleted ${result.successful.length} image${result.successful.length > 1 ? 's' : ''}`,
          duration: 4000,
          persistent: false,
        });
      } else if (result.successful.length === 0) {
        toast.updateToast(toastId, {
          type: 'error',
          title: 'Delete Failed',
          message: `Failed to delete ${result.failed.length} image${result.failed.length > 1 ? 's' : ''}`,
          duration: 6000,
          persistent: false,
        });
      } else {
        toast.updateToast(toastId, {
          type: 'warning',
          title: 'Partial Success',
          message: `Deleted ${result.successful.length} image${result.successful.length > 1 ? 's' : ''}, failed ${result.failed.length}`,
          duration: 5000,
          persistent: false,
        });
      }
      
      return result;
    } catch (error) {
      console.error('Batch delete error:', error);
      toast.error(
        'Batch Delete Failed', 
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
      return { successful: [], failed: [] };
    } finally {
      setIsDeleting(false);
    }
  }, [toast]);

  // Delete by public ID directly
  const deleteImageByPublicId = useCallback(async (publicId: string): Promise<boolean> => {
    return deleteImage(publicId);
  }, [deleteImage]);

  // Delete multiple by public IDs directly
  const deleteImagesByPublicIds = useCallback(async (publicIds: string[]): Promise<BatchDeleteResult> => {
    return deleteImages(publicIds);
  }, [deleteImages]);

  return {
    isDeleting,
    deleteImage,
    deleteImages,
    deleteImageByPublicId,
    deleteImagesByPublicIds,
  };
}
