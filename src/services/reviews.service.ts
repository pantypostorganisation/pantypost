// src/services/reviews.service.ts

import { API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { z } from 'zod';

// Review types
export interface Review {
  _id?: string;
  orderId: string;
  reviewer: string;
  reviewee: string;
  rating: number;
  comment: string;
  asDescribed?: boolean;
  fastShipping?: boolean;
  wouldBuyAgain?: boolean;
  createdAt: string;
  sellerResponse?: {
    text: string;
    date: string;
  };
  isFlagged?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface ReviewStats {
  avgRating: number;
  totalReviews: number;
  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStars: number;
}

export interface ReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateReviewRequest {
  orderId: string;
  rating: number;
  comment: string;
  asDescribed?: boolean;
  fastShipping?: boolean;
  wouldBuyAgain?: boolean;
}

export interface SellerResponseRequest {
  response: string;
}

export interface FlagReviewRequest {
  reason: string;
}

// Validation schemas
const createReviewSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(10, 'Review must be at least 10 characters').max(500, 'Review must be less than 500 characters'),
  asDescribed: z.boolean().optional(),
  fastShipping: z.boolean().optional(),
  wouldBuyAgain: z.boolean().optional(),
});

const sellerResponseSchema = z.object({
  response: z.string().min(10, 'Response must be at least 10 characters').max(500, 'Response must be less than 500 characters'),
});

/**
 * Reviews Service - Handles all review-related API operations
 */
export class ReviewsService {
  private static instance: ReviewsService;

  private constructor() {}

  static getInstance(): ReviewsService {
    if (!ReviewsService.instance) {
      ReviewsService.instance = new ReviewsService();
    }
    return ReviewsService.instance;
  }

  /**
   * Get reviews for a seller with pagination and stats
   */
  async getSellerReviews(
    username: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<ReviewsResponse>> {
    try {
      console.log('[ReviewsService] Getting reviews for seller:', username);
      
      const sanitizedUsername = sanitizeStrict(username);
      const url = buildApiUrl(API_ENDPOINTS.REVIEWS.BY_SELLER, { username: sanitizedUsername });
      
      const response = await apiCall<ReviewsResponse>(
        `${url}?page=${page}&limit=${limit}`,
        { method: 'GET' }
      );

      if (response.success && response.data) {
        // Sanitize review comments
        response.data.reviews = response.data.reviews.map(review => ({
          ...review,
          comment: sanitizeStrict(review.comment),
          sellerResponse: review.sellerResponse ? {
            ...review.sellerResponse,
            text: sanitizeStrict(review.sellerResponse.text)
          } : undefined
        }));
      }

      return response;
    } catch (error) {
      console.error('[ReviewsService] Error getting seller reviews:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch reviews'
        }
      };
    }
  }

  /**
   * Check if an order has been reviewed
   */
  async checkOrderReview(orderId: string): Promise<ApiResponse<{ hasReview: boolean; review: Review | null }>> {
    try {
      console.log('[ReviewsService] Checking review for order:', orderId);
      
      const url = buildApiUrl('/reviews/order/:orderId', { orderId });
      const response = await apiCall<{ hasReview: boolean; review: Review | null }>(
        url,
        { method: 'GET' }
      );

      return response;
    } catch (error) {
      console.error('[ReviewsService] Error checking order review:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to check order review'
        }
      };
    }
  }

  /**
   * Create a new review
   */
  async createReview(request: CreateReviewRequest): Promise<ApiResponse<Review>> {
    try {
      console.log('[ReviewsService] Creating review:', request);
      
      // Validate request
      const validationResult = createReviewSchema.safeParse(request);
      if (!validationResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.error.errors[0].message
          }
        };
      }

      // Sanitize inputs
      const sanitizedRequest = {
        ...validationResult.data,
        comment: sanitizeStrict(validationResult.data.comment)
      };

      const response = await apiCall<Review>(API_ENDPOINTS.REVIEWS.CREATE, {
        method: 'POST',
        body: JSON.stringify(sanitizedRequest)
      });

      return response;
    } catch (error) {
      console.error('[ReviewsService] Error creating review:', error);
      return {
        success: false,
        error: {
          code: 'CREATE_ERROR',
          message: 'Failed to create review'
        }
      };
    }
  }

  /**
   * Add seller response to a review
   */
  async addSellerResponse(reviewId: string, request: SellerResponseRequest): Promise<ApiResponse<Review>> {
    try {
      console.log('[ReviewsService] Adding seller response to review:', reviewId);
      
      // Validate request
      const validationResult = sellerResponseSchema.safeParse(request);
      if (!validationResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.error.errors[0].message
          }
        };
      }

      // Sanitize response text
      const sanitizedRequest = {
        response: sanitizeStrict(validationResult.data.response)
      };

      const url = buildApiUrl('/reviews/:reviewId/response', { reviewId });
      const response = await apiCall<Review>(url, {
        method: 'POST',
        body: JSON.stringify(sanitizedRequest)
      });

      return response;
    } catch (error) {
      console.error('[ReviewsService] Error adding seller response:', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: 'Failed to add seller response'
        }
      };
    }
  }

  /**
   * Flag a review for moderation
   */
  async flagReview(reviewId: string, reason: string): Promise<ApiResponse<{ message: string }>> {
    try {
      console.log('[ReviewsService] Flagging review:', reviewId);
      
      const sanitizedReason = sanitizeStrict(reason);
      
      const url = buildApiUrl('/reviews/:reviewId/flag', { reviewId });
      const response = await apiCall<{ message: string }>(url, {
        method: 'POST',
        body: JSON.stringify({ reason: sanitizedReason })
      });

      return response;
    } catch (error) {
      console.error('[ReviewsService] Error flagging review:', error);
      return {
        success: false,
        error: {
          code: 'FLAG_ERROR',
          message: 'Failed to flag review'
        }
      };
    }
  }

  /**
   * Get reviews by buyer
   */
  async getBuyerReviews(username: string, page: number = 1, limit: number = 20): Promise<ApiResponse<ReviewsResponse>> {
    try {
      console.log('[ReviewsService] Getting reviews by buyer:', username);
      
      const sanitizedUsername = sanitizeStrict(username);
      const url = buildApiUrl('/reviews/buyer/:username', { username: sanitizedUsername });
      
      const response = await apiCall<ReviewsResponse>(
        `${url}?page=${page}&limit=${limit}`,
        { method: 'GET' }
      );

      if (response.success && response.data) {
        // Sanitize review comments
        response.data.reviews = response.data.reviews.map(review => ({
          ...review,
          comment: sanitizeStrict(review.comment),
          sellerResponse: review.sellerResponse ? {
            ...review.sellerResponse,
            text: sanitizeStrict(review.sellerResponse.text)
          } : undefined
        }));
      }

      return response;
    } catch (error) {
      console.error('[ReviewsService] Error getting buyer reviews:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch buyer reviews'
        }
      };
    }
  }

  /**
   * Calculate average rating from reviews
   */
  calculateAverageRating(reviews: Review[]): number {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Get rating distribution
   */
  getRatingDistribution(reviews: Review[]): ReviewStats {
    const stats: ReviewStats = {
      avgRating: this.calculateAverageRating(reviews),
      totalReviews: reviews.length,
      fiveStars: 0,
      fourStars: 0,
      threeStars: 0,
      twoStars: 0,
      oneStars: 0,
    };

    reviews.forEach(review => {
      switch (review.rating) {
        case 5:
          stats.fiveStars++;
          break;
        case 4:
          stats.fourStars++;
          break;
        case 3:
          stats.threeStars++;
          break;
        case 2:
          stats.twoStars++;
          break;
        case 1:
          stats.oneStars++;
          break;
      }
    });

    return stats;
  }
}

// Export singleton instance
export const reviewsService = ReviewsService.getInstance();