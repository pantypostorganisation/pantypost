// src/services/listings.service.ts

import { Listing, AuctionSettings, Bid } from '@/context/ListingContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';
import type { ListingDraft } from '@/types/myListings';
import { securityService, sanitize } from './security.service';
import { listingSchemas, financialSchemas } from '@/utils/validation/schemas';
import { z } from 'zod';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

export interface CreateListingRequest {
  title: string;
  description: string;
  price: number;
  imageUrls: string[];
  seller: string;
  isVerified?: boolean;
  isPremium?: boolean;
  tags?: string[];
  hoursWorn?: number;
  auction?: {
    startingPrice: number;
    reservePrice?: number;
    endTime: string;
  };
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  price?: number;
  imageUrls?: string[];
  isPremium?: boolean;
  tags?: string[];
  hoursWorn?: number;
}

export interface ListingSearchParams {
  query?: string;
  seller?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  isPremium?: boolean;
  isAuction?: boolean;
  isActive?: boolean;
  sortBy?: 'date' | 'price' | 'views' | 'endingSoon';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ListingViewUpdate {
  listingId: string;
  viewerId?: string;
}

export interface BulkUpdateRequest {
  listingIds: string[];
  updates: UpdateListingRequest;
}

export interface PopularTag {
  tag: string;
  count: number;
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const VIEW_CACHE_DURATION = 30 * 1000; // 30 seconds

// Validation schemas for the service
const createListingRequestSchema = z.object({
  title: listingSchemas.title,
  description: listingSchemas.description,
  price: z.number().positive().min(0.01).max(10000),
  imageUrls: z.array(z.string().url()).min(1).max(10),
  seller: z.string().min(1).max(30),
  isVerified: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  hoursWorn: z.number().min(0).max(720).optional(), // Max 30 days
  auction: z.object({
    startingPrice: z.number().positive().min(0.01).max(10000),
    reservePrice: z.number().positive().min(0.01).max(10000).optional(),
    endTime: z.string().datetime(),
  }).optional(),
});

const updateListingRequestSchema = z.object({
  title: listingSchemas.title.optional(),
  description: listingSchemas.description.optional(),
  price: z.number().positive().min(0.01).max(10000).optional(),
  imageUrls: z.array(z.string().url()).min(1).max(10).optional(),
  isPremium: z.boolean().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  hoursWorn: z.number().min(0).max(720).optional(),
});

const searchParamsSchema = z.object({
  query: z.string().max(100).optional(),
  seller: z.string().max(30).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().positive().max(100000).optional(),
  tags: z.array(z.string().max(30)).optional(),
  isPremium: z.boolean().optional(),
  isAuction: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['date', 'price', 'views', 'endingSoon']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/**
 * Listings Service
 * Handles all listing-related operations with caching and error handling
 */
export class ListingsService {
  private listingsCache: {
    data: Listing[] | null;
    timestamp: number;
  } = { data: null, timestamp: 0 };

  private viewsCache: Map<string, { count: number; timestamp: number }> = new Map();
  private popularTagsCache: { data: PopularTag[] | null; timestamp: number } = {
    data: null,
    timestamp: 0,
  };

  private rateLimiter = getRateLimiter();

  /**
   * Get all listings with optional filtering
   */
  async getListings(params?: ListingSearchParams): Promise<ApiResponse<Listing[]>> {
    try {
      console.log('[ListingsService] Getting listings with params:', params);

      // Validate and sanitize search parameters
      if (params) {
        const validation = securityService.validateAndSanitize(
          params,
          searchParamsSchema,
          {
            query: sanitize.searchQuery,
            seller: sanitize.username,
            tags: (tags: string[]) => tags?.map(tag => sanitize.strict(tag))
          }
        );

        if (!validation.success) {
          return {
            success: false,
            error: { message: 'Invalid search parameters', details: validation.errors }
          };
        }

        params = validation.data as ListingSearchParams;
      }

      // Rate limiting for search operations
      if (params?.query) {
        const rateLimitResult = this.rateLimiter.check('SEARCH', RATE_LIMITS.SEARCH);
        if (!rateLimitResult.allowed) {
          return {
            success: false,
            error: { 
              message: `Too many search requests. Please wait ${rateLimitResult.waitTime} seconds.`,
              code: 'RATE_LIMIT_EXCEEDED'
            }
          };
        }
      }

      if (FEATURES.USE_API_LISTINGS) {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
              queryParams.append(key, String(value));
            }
          });
        }
        
        return await apiCall<Listing[]>(
          `${API_ENDPOINTS.LISTINGS.LIST}?${queryParams.toString()}`
        );
      }

      // Check cache first - but ONLY if no params are provided
      const now = Date.now();
      if (
        !params &&
        this.listingsCache.data &&
        now - this.listingsCache.timestamp < CACHE_DURATION
      ) {
        console.log('[ListingsService] Returning cached listings:', this.listingsCache.data.length);
        return {
          success: true,
          data: this.listingsCache.data,
        };
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      console.log('[ListingsService] Found listings in storage:', listings.length);
      
      if (listings.length === 0) {
        console.warn('[ListingsService] No listings found in storage! Check if listings are being created properly.');
      }

      // Update cache only if no filters
      if (!params) {
        this.listingsCache = { data: listings, timestamp: now };
      }

      let filteredListings = [...listings];

      // Apply filters
      if (params) {
        const beforeFilterCount = filteredListings.length;
        
        // Active filter (not ended auctions)
        if (params.isActive !== undefined && params.isActive === true) {
          filteredListings = filteredListings.filter(listing => {
            // For non-auction listings, always consider them active
            if (!listing.auction) return true;
            
            // For auction listings, check end time
            const now = new Date();
            const endTime = new Date(listing.auction.endTime);
            const isActive = endTime > now;
            
            return isActive;
          });
          console.log(`[ListingsService] Active filter: ${beforeFilterCount} -> ${filteredListings.length}`);
        }

        if (params.query) {
          const beforeQueryCount = filteredListings.length;
          const query = params.query.toLowerCase();
          filteredListings = filteredListings.filter(
            listing =>
              listing.title.toLowerCase().includes(query) ||
              listing.description.toLowerCase().includes(query) ||
              listing.tags?.some(tag => tag.toLowerCase().includes(query)) ||
              listing.seller.toLowerCase().includes(query)
          );
          console.log(`[ListingsService] Query filter "${params.query}": ${beforeQueryCount} -> ${filteredListings.length}`);
        }

        if (params.seller) {
          const beforeSellerCount = filteredListings.length;
          const sellerFilter = params.seller; // Store in const to fix TS issue
          filteredListings = filteredListings.filter(
            listing => listing.seller === sellerFilter
          );
          console.log(`[ListingsService] Seller filter "${params.seller}": ${beforeSellerCount} -> ${filteredListings.length}`);
        }

        if (params.minPrice !== undefined) {
          const beforeMinPriceCount = filteredListings.length;
          const minPrice = params.minPrice; // Store in const to fix TS issue
          filteredListings = filteredListings.filter(listing => {
            const price = listing.auction?.highestBid || listing.price;
            return price >= minPrice;
          });
          console.log(`[ListingsService] Min price filter ${params.minPrice}: ${beforeMinPriceCount} -> ${filteredListings.length}`);
        }

        if (params.maxPrice !== undefined) {
          const beforeMaxPriceCount = filteredListings.length;
          const maxPrice = params.maxPrice; // Store in const to fix TS issue
          filteredListings = filteredListings.filter(listing => {
            const price = listing.auction?.highestBid || listing.price;
            return price <= maxPrice;
          });
          console.log(`[ListingsService] Max price filter ${params.maxPrice}: ${beforeMaxPriceCount} -> ${filteredListings.length}`);
        }

        if (params.tags && params.tags.length > 0) {
          const beforeTagsCount = filteredListings.length;
          const tagsFilter = params.tags; // Store in const to fix TS issue
          filteredListings = filteredListings.filter(listing =>
            listing.tags?.some(tag => tagsFilter.includes(tag))
          );
          console.log(`[ListingsService] Tags filter: ${beforeTagsCount} -> ${filteredListings.length}`);
        }

        if (params.isPremium !== undefined) {
          const beforePremiumCount = filteredListings.length;
          const isPremiumFilter = params.isPremium; // Store in const to fix TS issue
          filteredListings = filteredListings.filter(
            listing => listing.isPremium === isPremiumFilter
          );
          console.log(`[ListingsService] Premium filter ${params.isPremium}: ${beforePremiumCount} -> ${filteredListings.length}`);
        }

        if (params.isAuction !== undefined) {
          const beforeAuctionCount = filteredListings.length;
          const isAuctionFilter = params.isAuction; // Store in const to fix TS issue
          filteredListings = filteredListings.filter(
            listing => (isAuctionFilter ? !!listing.auction : !listing.auction)
          );
          console.log(`[ListingsService] Auction filter ${params.isAuction}: ${beforeAuctionCount} -> ${filteredListings.length}`);
        }

        // Sorting
        if (params.sortBy) {
          const sortBy = params.sortBy; // Store in const to fix TS issue
          const sortOrder = params.sortOrder || 'asc'; // Store in const with default
          console.log(`[ListingsService] Sorting by ${sortBy} ${sortOrder}`);
          filteredListings.sort((a, b) => {
            let compareValue = 0;
            
            switch (sortBy) {
              case 'date':
                compareValue = new Date(b.date).getTime() - new Date(a.date).getTime();
                break;
              case 'price':
                const aPrice = a.auction?.highestBid || a.price;
                const bPrice = b.auction?.highestBid || b.price;
                compareValue = aPrice - bPrice;
                break;
              case 'views':
                // Would need to load views data for each listing
                compareValue = 0;
                break;
              case 'endingSoon':
                // Sort auctions by end time, non-auctions last
                if (a.auction && b.auction) {
                  compareValue = new Date(a.auction.endTime).getTime() - new Date(b.auction.endTime).getTime();
                } else if (a.auction) {
                  compareValue = -1;
                } else if (b.auction) {
                  compareValue = 1;
                }
                break;
            }

            return sortOrder === 'desc' ? -compareValue : compareValue;
          });
        }

        // Pagination - only if explicitly requested
        if (params.page !== undefined && params.limit) {
          const start = params.page * params.limit;
          const end = start + params.limit;
          
          console.log(`[ListingsService] Paginating: page ${params.page}, limit ${params.limit}, showing ${start}-${end} of ${filteredListings.length}`);
          
          return {
            success: true,
            data: filteredListings.slice(start, end),
            meta: {
              page: params.page,
              totalPages: Math.ceil(filteredListings.length / params.limit),
              totalItems: filteredListings.length,
            },
          };
        }
      }

      console.log('[ListingsService] Returning listings:', filteredListings.length);
      
      return {
        success: true,
        data: filteredListings,
        meta: {
          totalItems: filteredListings.length
        }
      };
    } catch (error) {
      console.error('[ListingsService] Get listings error:', error);
      return {
        success: false,
        error: { message: 'Failed to get listings' },
      };
    }
  }

  /**
   * Get single listing by ID
   */
  async getListing(id: string): Promise<ApiResponse<Listing | null>> {
    try {
      // Sanitize ID
      const sanitizedId = sanitize.strict(id);
      if (!sanitizedId || sanitizedId.length !== 36) { // UUID length
        return {
          success: false,
          error: { message: 'Invalid listing ID' }
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.GET, { id: sanitizedId })
        );
      }

      // Try cache first
      if (this.listingsCache.data) {
        const cachedListing = this.listingsCache.data.find(l => l.id === sanitizedId);
        if (cachedListing) {
          return {
            success: true,
            data: cachedListing,
          };
        }
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const listing = listings.find(l => l.id === sanitizedId);

      return {
        success: true,
        data: listing || null,
      };
    } catch (error) {
      console.error('Get listing error:', error);
      return {
        success: false,
        error: { message: 'Failed to get listing' },
      };
    }
  }

  /**
   * Get listings by seller
   */
  async getListingsBySeller(username: string): Promise<ApiResponse<Listing[]>> {
    try {
      // Sanitize username
      const sanitizedUsername = sanitize.username(username);
      if (!sanitizedUsername) {
        return {
          success: false,
          error: { message: 'Invalid username' }
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing[]>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.BY_SELLER, { username: sanitizedUsername })
        );
      }

      // LocalStorage implementation
      return this.getListings({ seller: sanitizedUsername });
    } catch (error) {
      console.error('Get listings by seller error:', error);
      return {
        success: false,
        error: { message: 'Failed to get seller listings' },
      };
    }
  }

  /**
   * Create new listing
   */
  async createListing(request: CreateListingRequest): Promise<ApiResponse<Listing>> {
    try {
      console.log('[ListingsService] Creating listing:', request);

      // Rate limiting for listing creation
      const rateLimitResult = this.rateLimiter.check('LISTING_CREATE', RATE_LIMITS.LISTING_CREATE);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { 
            message: `Too many listing creation attempts. Please wait ${rateLimitResult.waitTime} seconds.`,
            code: 'RATE_LIMIT_EXCEEDED'
          }
        };
      }

      // Validate and sanitize the request
      const validation = securityService.validateAndSanitize(
        request,
        createListingRequestSchema,
        {
          title: sanitize.strict,
          description: sanitize.strict,
          seller: sanitize.username,
          tags: (tags: string[]) => tags?.map(tag => sanitize.strict(tag))
        }
      );

      if (!validation.success) {
        return {
          success: false,
          error: { message: 'Invalid listing data', details: validation.errors }
        };
      }

      const sanitizedRequest = validation.data as CreateListingRequest;

      // Validate image URLs
      for (const imageUrl of sanitizedRequest.imageUrls) {
        const sanitizedUrl = sanitize.url(imageUrl);
        if (!sanitizedUrl) {
          return {
            success: false,
            error: { message: 'Invalid image URL detected' }
          };
        }
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing>(API_ENDPOINTS.LISTINGS.CREATE, {
          method: 'POST',
          body: JSON.stringify(sanitizedRequest),
        });
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      console.log('[ListingsService] Current listings count before create:', listings.length);
      
      const newListing: Listing = {
        id: uuidv4(),
        title: sanitizedRequest.title,
        description: sanitizedRequest.description,
        price: sanitizedRequest.price,
        markedUpPrice: Math.round(sanitizedRequest.price * 1.1 * 100) / 100,
        imageUrls: sanitizedRequest.imageUrls || [],
        date: new Date().toISOString(),
        seller: sanitizedRequest.seller,
        isVerified: sanitizedRequest.isVerified || false,
        isPremium: sanitizedRequest.isPremium || false,
        tags: sanitizedRequest.tags || [],
        hoursWorn: sanitizedRequest.hoursWorn,
        auction: sanitizedRequest.auction ? {
          isAuction: true,
          startingPrice: sanitizedRequest.auction.startingPrice,
          reservePrice: sanitizedRequest.auction.reservePrice,
          endTime: sanitizedRequest.auction.endTime,
          bids: [],
          highestBid: undefined,
          highestBidder: undefined,
          status: 'active',
        } : undefined,
      };

      console.log('[ListingsService] New listing object:', newListing);

      listings.push(newListing);
      const saveResult = await storageService.setItem('listings', listings);
      
      if (!saveResult) {
        throw new Error('Failed to save listings to storage');
      }

      // Verify the save
      const verifyListings = await storageService.getItem<Listing[]>('listings', []);
      console.log('[ListingsService] Verified listings count after save:', verifyListings.length);
      
      // Check if our listing is in the saved data
      const savedListing = verifyListings.find(l => l.id === newListing.id);
      if (!savedListing) {
        throw new Error('Listing was not properly saved to storage');
      }

      // Invalidate cache
      this.invalidateCache();

      return {
        success: true,
        data: newListing,
      };
    } catch (error) {
      console.error('[ListingsService] Create listing error:', error);
      return {
        success: false,
        error: { message: 'Failed to create listing: ' + (error as Error).message },
      };
    }
  }

  /**
   * Update existing listing
   */
  async updateListing(
    id: string,
    updates: UpdateListingRequest
  ): Promise<ApiResponse<Listing>> {
    try {
      // Sanitize ID
      const sanitizedId = sanitize.strict(id);
      if (!sanitizedId || sanitizedId.length !== 36) {
        return {
          success: false,
          error: { message: 'Invalid listing ID' }
        };
      }

      // Validate and sanitize updates
      const validation = securityService.validateAndSanitize(
        updates,
        updateListingRequestSchema,
        {
          title: sanitize.strict,
          description: sanitize.strict,
          tags: (tags: string[]) => tags?.map(tag => sanitize.strict(tag))
        }
      );

      if (!validation.success) {
        return {
          success: false,
          error: { message: 'Invalid update data', details: validation.errors }
        };
      }

      const sanitizedUpdates = validation.data as UpdateListingRequest;

      // Validate image URLs if provided
      if (sanitizedUpdates.imageUrls) {
        for (const imageUrl of sanitizedUpdates.imageUrls) {
          const sanitizedUrl = sanitize.url(imageUrl);
          if (!sanitizedUrl) {
            return {
              success: false,
              error: { message: 'Invalid image URL detected' }
            };
          }
        }
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.UPDATE, { id: sanitizedId }),
          {
            method: 'PATCH',
            body: JSON.stringify(sanitizedUpdates),
          }
        );
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const index = listings.findIndex(l => l.id === sanitizedId);

      if (index === -1) {
        return {
          success: false,
          error: { message: 'Listing not found' },
        };
      }

      const updatedListing = {
        ...listings[index],
        ...sanitizedUpdates,
        markedUpPrice: sanitizedUpdates.price
          ? Math.round(sanitizedUpdates.price * 1.1 * 100) / 100
          : listings[index].markedUpPrice,
      };

      listings[index] = updatedListing;
      await storageService.setItem('listings', listings);

      // Invalidate cache
      this.invalidateCache();

      return {
        success: true,
        data: updatedListing,
      };
    } catch (error) {
      console.error('Update listing error:', error);
      return {
        success: false,
        error: { message: 'Failed to update listing' },
      };
    }
  }

  /**
   * Delete listing - Enhanced with event broadcasting
   */
  async deleteListing(id: string): Promise<ApiResponse<void>> {
    try {
      console.log('[ListingsService] Deleting listing:', id);

      // Sanitize ID
      const sanitizedId = sanitize.strict(id);
      if (!sanitizedId || sanitizedId.length !== 36) {
        return {
          success: false,
          error: { message: 'Invalid listing ID' }
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<void>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.DELETE, { id: sanitizedId }),
          { method: 'DELETE' }
        );
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const beforeCount = listings.length;
      const filtered = listings.filter(l => l.id !== sanitizedId);
      const afterCount = filtered.length;
      
      console.log(`[ListingsService] Delete listing: ${beforeCount} -> ${afterCount} listings`);
      
      if (beforeCount === afterCount) {
        console.warn(`[ListingsService] Listing ${sanitizedId} was not found in storage`);
      }
      
      await storageService.setItem('listings', filtered);

      // Invalidate all caches
      this.invalidateCache();
      
      // Clear browse cache specifically
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('browse_listings_cache');
          console.log('[ListingsService] Cleared browse listings cache');
        } catch (e) {
          console.warn('Failed to clear browse cache:', e);
        }
      }
      
      // Trigger a custom event to notify other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('listingDeleted', { 
          detail: { listingId: sanitizedId } 
        }));
        
        // Also trigger storage event manually for cross-tab sync
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'listings',
          newValue: JSON.stringify(filtered),
          url: window.location.href
        }));
      }

      return { success: true };
    } catch (error) {
      console.error('[ListingsService] Delete listing error:', error);
      return {
        success: false,
        error: { message: 'Failed to delete listing' },
      };
    }
  }

  /**
   * Bulk update listings
   */
  async bulkUpdateListings(request: BulkUpdateRequest): Promise<ApiResponse<Listing[]>> {
    try {
      // Validate listing IDs
      for (const id of request.listingIds) {
        const sanitizedId = sanitize.strict(id);
        if (!sanitizedId || sanitizedId.length !== 36) {
          return {
            success: false,
            error: { message: 'Invalid listing ID in bulk update' }
          };
        }
      }

      // Validate and sanitize updates
      const validation = securityService.validateAndSanitize(
        request.updates,
        updateListingRequestSchema,
        {
          title: sanitize.strict,
          description: sanitize.strict,
          tags: (tags: string[]) => tags?.map(tag => sanitize.strict(tag))
        }
      );

      if (!validation.success) {
        return {
          success: false,
          error: { message: 'Invalid update data', details: validation.errors }
        };
      }

      const sanitizedUpdates = validation.data as UpdateListingRequest;

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing[]>(`${API_ENDPOINTS.LISTINGS.LIST}/bulk`, {
          method: 'PATCH',
          body: JSON.stringify({
            listingIds: request.listingIds,
            updates: sanitizedUpdates
          }),
        });
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const updatedListings: Listing[] = [];

      listings.forEach((listing, index) => {
        if (request.listingIds.includes(listing.id)) {
          const updatedListing = {
            ...listing,
            ...sanitizedUpdates,
            markedUpPrice: sanitizedUpdates.price
              ? Math.round(sanitizedUpdates.price * 1.1 * 100) / 100
              : listing.markedUpPrice,
          };
          listings[index] = updatedListing;
          updatedListings.push(updatedListing);
        }
      });

      await storageService.setItem('listings', listings);

      // Invalidate cache
      this.invalidateCache();

      return {
        success: true,
        data: updatedListings,
      };
    } catch (error) {
      console.error('Bulk update error:', error);
      return {
        success: false,
        error: { message: 'Failed to bulk update listings' },
      };
    }
  }

  /**
   * Place bid on auction listing
   */
  async placeBid(
    listingId: string,
    bidder: string,
    amount: number
  ): Promise<ApiResponse<Listing>> {
    try {
      // Sanitize inputs
      const sanitizedId = sanitize.strict(listingId);
      const sanitizedBidder = sanitize.username(bidder);
      
      if (!sanitizedId || sanitizedId.length !== 36) {
        return {
          success: false,
          error: { message: 'Invalid listing ID' }
        };
      }

      if (!sanitizedBidder) {
        return {
          success: false,
          error: { message: 'Invalid bidder username' }
        };
      }

      // Validate bid amount
      const amountValidation = securityService.validateAmount(amount, {
        min: 0.01,
        max: 10000
      });

      if (!amountValidation.valid) {
        return {
          success: false,
          error: { message: amountValidation.error || 'Invalid bid amount' }
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing>(
          `${buildApiUrl(API_ENDPOINTS.LISTINGS.GET, { id: sanitizedId })}/bids`,
          {
            method: 'POST',
            body: JSON.stringify({ bidder: sanitizedBidder, amount: amountValidation.value }),
          }
        );
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const listing = listings.find(l => l.id === sanitizedId);

      if (!listing || !listing.auction) {
        return {
          success: false,
          error: { message: 'Auction not found' },
        };
      }

      if (listing.auction.status !== 'active') {
        return {
          success: false,
          error: { message: 'Auction is not active' },
        };
      }

      // Check if auction has ended
      const now = new Date();
      const endTime = new Date(listing.auction.endTime);
      if (endTime <= now) {
        return {
          success: false,
          error: { message: 'Auction has ended' },
        };
      }

      if (amount <= (listing.auction.highestBid || listing.auction.startingPrice)) {
        return {
          success: false,
          error: { message: 'Bid must be higher than current bid' },
        };
      }

      const newBid: Bid = {
        id: uuidv4(),
        bidder: sanitizedBidder,
        amount: amountValidation.value!,
        date: new Date().toISOString(),
      };

      listing.auction.bids.push(newBid);
      listing.auction.highestBid = amountValidation.value;
      listing.auction.highestBidder = sanitizedBidder;

      await storageService.setItem('listings', listings);

      // Invalidate cache
      this.invalidateCache();

      return {
        success: true,
        data: listing,
      };
    } catch (error) {
      console.error('Place bid error:', error);
      return {
        success: false,
        error: { message: 'Failed to place bid' },
      };
    }
  }

  /**
   * Cancel auction
   */
  async cancelAuction(listingId: string): Promise<ApiResponse<Listing>> {
    try {
      // Sanitize ID
      const sanitizedId = sanitize.strict(listingId);
      if (!sanitizedId || sanitizedId.length !== 36) {
        return {
          success: false,
          error: { message: 'Invalid listing ID' }
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing>(
          `${buildApiUrl(API_ENDPOINTS.LISTINGS.GET, { id: sanitizedId })}/auction/cancel`,
          { method: 'POST' }
        );
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const listing = listings.find(l => l.id === sanitizedId);

      if (!listing || !listing.auction) {
        return {
          success: false,
          error: { message: 'Auction not found' },
        };
      }

      listing.auction.status = 'cancelled';
      await storageService.setItem('listings', listings);

      // Invalidate cache
      this.invalidateCache();

      return {
        success: true,
        data: listing,
      };
    } catch (error) {
      console.error('Cancel auction error:', error);
      return {
        success: false,
        error: { message: 'Failed to cancel auction' },
      };
    }
  }

  /**
   * Update listing views
   */
  async updateViews(update: ListingViewUpdate): Promise<ApiResponse<void>> {
    try {
      // Sanitize inputs
      const sanitizedId = sanitize.strict(update.listingId);
      const sanitizedViewerId = update.viewerId ? sanitize.username(update.viewerId) : undefined;

      if (!sanitizedId || sanitizedId.length !== 36) {
        return {
          success: false,
          error: { message: 'Invalid listing ID' }
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<void>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.VIEWS, { id: sanitizedId }),
          {
            method: 'POST',
            body: JSON.stringify({ viewerId: sanitizedViewerId }),
          }
        );
      }

      // LocalStorage implementation
      const viewsData = await storageService.getItem<Record<string, number>>(
        'listing_views',
        {}
      );
      
      viewsData[sanitizedId] = (viewsData[sanitizedId] || 0) + 1;
      await storageService.setItem('listing_views', viewsData);

      // Invalidate view cache for this listing
      this.viewsCache.delete(sanitizedId);

      return { success: true };
    } catch (error) {
      console.error('Update views error:', error);
      return {
        success: false,
        error: { message: 'Failed to update views' },
      };
    }
  }

  /**
   * Get listing views with caching
   */
  async getListingViews(listingId: string): Promise<ApiResponse<number>> {
    try {
      // Sanitize ID
      const sanitizedId = sanitize.strict(listingId);
      if (!sanitizedId || sanitizedId.length !== 36) {
        return {
          success: false,
          error: { message: 'Invalid listing ID' }
        };
      }

      // Check cache first
      const cached = this.viewsCache.get(sanitizedId);
      const now = Date.now();
      
      if (cached && now - cached.timestamp < VIEW_CACHE_DURATION) {
        return {
          success: true,
          data: cached.count,
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        const response = await apiCall<number>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.VIEWS, { id: sanitizedId })
        );
        
        if (response.success && response.data !== undefined) {
          this.viewsCache.set(sanitizedId, { count: response.data, timestamp: now });
        }
        
        return response;
      }

      // LocalStorage implementation
      const viewsData = await storageService.getItem<Record<string, number>>(
        'listing_views',
        {}
      );

      const count = viewsData[sanitizedId] || 0;
      this.viewsCache.set(sanitizedId, { count, timestamp: now });

      return {
        success: true,
        data: count,
      };
    } catch (error) {
      console.error('Get listing views error:', error);
      return {
        success: false,
        error: { message: 'Failed to get listing views' },
      };
    }
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit: number = 20): Promise<ApiResponse<PopularTag[]>> {
    try {
      // Validate limit
      const safeLimit = Math.min(Math.max(1, limit), 100);

      // Check cache first
      const now = Date.now();
      if (
        this.popularTagsCache.data &&
        now - this.popularTagsCache.timestamp < CACHE_DURATION
      ) {
        return {
          success: true,
          data: this.popularTagsCache.data.slice(0, safeLimit),
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<PopularTag[]>(
          `${API_ENDPOINTS.LISTINGS.LIST}/tags/popular?limit=${safeLimit}`
        );
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const tagCounts = new Map<string, number>();

      listings.forEach(listing => {
        listing.tags?.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      const popularTags = Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, safeLimit);

      // Update cache
      this.popularTagsCache = { data: popularTags, timestamp: now };

      return {
        success: true,
        data: popularTags,
      };
    } catch (error) {
      console.error('Get popular tags error:', error);
      return {
        success: false,
        error: { message: 'Failed to get popular tags' },
      };
    }
  }

  /**
   * Draft Management
   */
  
  /**
   * Save listing draft
   */
  async saveDraft(draft: ListingDraft): Promise<ApiResponse<ListingDraft>> {
    try {
      // Sanitize draft data
      const sanitizedDraft: ListingDraft = {
        ...draft,
        id: sanitize.strict(draft.id),
        seller: sanitize.username(draft.seller),
        name: draft.name ? sanitize.strict(draft.name) : undefined,
        formState: {
          ...draft.formState,
          title: sanitize.strict(draft.formState.title),
          description: sanitize.strict(draft.formState.description),
          tags: sanitize.strict(draft.formState.tags),
          price: draft.formState.price,
          imageUrls: draft.formState.imageUrls.map(url => {
            const sanitized = sanitize.url(url);
            if (!sanitized) throw new Error('Invalid image URL in draft');
            return sanitized;
          }),
          isPremium: draft.formState.isPremium,
          hoursWorn: draft.formState.hoursWorn,
          isAuction: draft.formState.isAuction,
          startingPrice: draft.formState.startingPrice,
          reservePrice: draft.formState.reservePrice,
          auctionDuration: draft.formState.auctionDuration,
        },
        createdAt: draft.createdAt,
        lastModified: new Date().toISOString(),
      };

      const drafts = await storageService.getItem<ListingDraft[]>('listing_drafts', []);
      
      const existingIndex = drafts.findIndex(d => d.id === sanitizedDraft.id);
      
      if (existingIndex >= 0) {
        drafts[existingIndex] = sanitizedDraft;
      } else {
        drafts.push(sanitizedDraft);
      }
      
      await storageService.setItem('listing_drafts', drafts);
      
      return {
        success: true,
        data: sanitizedDraft,
      };
    } catch (error) {
      console.error('Save draft error:', error);
      return {
        success: false,
        error: { message: 'Failed to save draft' },
      };
    }
  }

  /**
   * Get all drafts for a seller
   */
  async getDrafts(seller: string): Promise<ApiResponse<ListingDraft[]>> {
    try {
      // Sanitize seller username
      const sanitizedSeller = sanitize.username(seller);
      if (!sanitizedSeller) {
        return {
          success: false,
          error: { message: 'Invalid seller username' }
        };
      }

      const drafts = await storageService.getItem<ListingDraft[]>('listing_drafts', []);
      const sellerDrafts = drafts.filter(d => d.seller === sanitizedSeller);
      
      return {
        success: true,
        data: sellerDrafts,
      };
    } catch (error) {
      console.error('Get drafts error:', error);
      return {
        success: false,
        error: { message: 'Failed to get drafts' },
      };
    }
  }

  /**
   * Delete draft
   */
  async deleteDraft(draftId: string): Promise<ApiResponse<void>> {
    try {
      // Sanitize draft ID
      const sanitizedId = sanitize.strict(draftId);
      if (!sanitizedId) {
        return {
          success: false,
          error: { message: 'Invalid draft ID' }
        };
      }

      const drafts = await storageService.getItem<ListingDraft[]>('listing_drafts', []);
      const filtered = drafts.filter(d => d.id !== sanitizedId);
      
      await storageService.setItem('listing_drafts', filtered);
      
      return { success: true };
    } catch (error) {
      console.error('Delete draft error:', error);
      return {
        success: false,
        error: { message: 'Failed to delete draft' },
      };
    }
  }

  /**
   * Upload image to Cloudinary
   */
  async uploadImage(file: File): Promise<ApiResponse<string>> {
    try {
      // Rate limiting for image uploads
      const rateLimitResult = this.rateLimiter.check('IMAGE_UPLOAD', RATE_LIMITS.IMAGE_UPLOAD);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { 
            message: `Too many upload attempts. Please wait ${rateLimitResult.waitTime} seconds.`,
            code: 'RATE_LIMIT_EXCEEDED'
          }
        };
      }

      // Validate file
      const fileValidation = securityService.validateFileUpload(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
      });

      if (!fileValidation.valid) {
        return {
          success: false,
          error: { message: fileValidation.error || 'Invalid file' }
        };
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '');
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      // Validate returned URL
      const sanitizedUrl = sanitize.url(data.secure_url);
      if (!sanitizedUrl) {
        throw new Error('Invalid URL returned from upload');
      }
      
      return {
        success: true,
        data: sanitizedUrl,
      };
    } catch (error) {
      console.error('Upload image error:', error);
      return {
        success: false,
        error: { message: 'Failed to upload image' },
      };
    }
  }

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(imageUrl: string): Promise<ApiResponse<void>> {
    try {
      // Validate URL
      const sanitizedUrl = sanitize.url(imageUrl);
      if (!sanitizedUrl) {
        return {
          success: false,
          error: { message: 'Invalid image URL' }
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<void>(`${API_ENDPOINTS.LISTINGS.LIST}/images/delete`, {
          method: 'DELETE',
          body: JSON.stringify({ imageUrl: sanitizedUrl }),
        });
      }
      
      // For now, we can't delete from Cloudinary without backend
      // Just return success to allow UI to continue
      return { success: true };
    } catch (error) {
      console.error('Delete image error:', error);
      return {
        success: false,
        error: { message: 'Failed to delete image' },
      };
    }
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(): void {
    console.log('[ListingsService] Invalidating cache');
    this.listingsCache = { data: null, timestamp: 0 };
    this.popularTagsCache = { data: null, timestamp: 0 };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    console.log('[ListingsService] Clearing all caches');
    this.invalidateCache();
    this.viewsCache.clear();
  }
}

// Export singleton instance
export const listingsService = new ListingsService();