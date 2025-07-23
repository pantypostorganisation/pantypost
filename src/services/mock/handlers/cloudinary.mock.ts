// src/services/mock/handlers/cloudinary.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { CloudinaryDeleteResult } from '@/utils/cloudinary';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { z } from 'zod';

// Validation schemas
const deleteImageSchema = z.object({
  publicId: z.string().min(1).max(200),
});

const batchDeleteSchema = z.object({
  publicIds: z.array(z.string().min(1).max(200)).min(1).max(50),
});

// Store for tracking deleted images (for mock purposes)
interface DeletedImage {
  publicId: string;
  deletedAt: string;
  deletedBy?: string;
}

export const mockCloudinaryHandlers = {
  // Delete single image
  deleteImage: async (
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, string>
  ): Promise<ApiResponse<CloudinaryDeleteResult>> => {
    if (method !== 'DELETE') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }

    try {
      // Validate input
      const validatedData = deleteImageSchema.parse(data);
      const publicId = sanitizeStrict(validatedData.publicId);
      
      if (!publicId) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid public ID' },
        };
      }

      // Get deleted images history
      const deletedImages = await mockDataStore.get<DeletedImage[]>('deleted_images', []);
      
      // Check if already deleted
      const alreadyDeleted = deletedImages.some(img => img.publicId === publicId);
      
      if (alreadyDeleted) {
        return {
          success: true,
          data: {
            result: 'not found',
            publicId,
          },
        };
      }

      // Simulate deletion
      deletedImages.push({
        publicId,
        deletedAt: new Date().toISOString(),
      });
      
      await mockDataStore.set('deleted_images', deletedImages);

      // Simulate random failures for testing
      if (Math.random() < 0.05) { // 5% failure rate
        return {
          success: false,
          error: { 
            code: 'CLOUDINARY_ERROR', 
            message: 'Cloudinary service temporarily unavailable' 
          },
        };
      }

      return {
        success: true,
        data: {
          result: 'ok',
          publicId,
        },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: sanitizeStrict(error.errors[0].message) || 'Invalid input',
          },
        };
      }
      
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete image' },
      };
    }
  },

  // Batch delete images
  batchDelete: async (
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, string>
  ): Promise<ApiResponse<{ successful: string[]; failed: Array<{ publicId: string; error: string }> }>> => {
    if (method !== 'DELETE') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }

    try {
      // Validate input
      const validatedData = batchDeleteSchema.parse(data);
      const publicIds = validatedData.publicIds.map(id => sanitizeStrict(id)).filter(Boolean);
      
      if (publicIds.length === 0) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'No valid public IDs provided' },
        };
      }

      const deletedImages = await mockDataStore.get<DeletedImage[]>('deleted_images', []);
      const results = {
        successful: [] as string[],
        failed: [] as Array<{ publicId: string; error: string }>,
      };

      for (const publicId of publicIds) {
        // Check if already deleted
        const alreadyDeleted = deletedImages.some(img => img.publicId === publicId);
        
        if (alreadyDeleted) {
          results.failed.push({
            publicId,
            error: 'Image not found',
          });
          continue;
        }

        // Simulate random failures
        if (Math.random() < 0.1) { // 10% failure rate per image
          results.failed.push({
            publicId,
            error: 'Delete operation failed',
          });
          continue;
        }

        // Success
        deletedImages.push({
          publicId,
          deletedAt: new Date().toISOString(),
        });
        results.successful.push(publicId);
      }

      await mockDataStore.set('deleted_images', deletedImages);

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: sanitizeStrict(error.errors[0].message) || 'Invalid input',
          },
        };
      }
      
      return {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to batch delete images' },
      };
    }
  },

  // Check if image is deleted (helper endpoint)
  checkDeleted: async (
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, string>
  ): Promise<ApiResponse<{ isDeleted: boolean; deletedAt?: string }>> => {
    if (method !== 'GET') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }

    const publicId = params?.publicId;
    if (!publicId) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Public ID is required' },
      };
    }

    const deletedImages = await mockDataStore.get<DeletedImage[]>('deleted_images', []);
    const deletedImage = deletedImages.find(img => img.publicId === publicId);

    return {
      success: true,
      data: {
        isDeleted: !!deletedImage,
        deletedAt: deletedImage?.deletedAt,
      },
    };
  },

  // Clear deleted images history (for testing)
  clearHistory: async (
    method: string,
    endpoint: string,
    data?: any,
    params?: Record<string, string>
  ): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }

    await mockDataStore.set('deleted_images', []);
    
    return {
      success: true,
      data: undefined,
    };
  },
} as const;