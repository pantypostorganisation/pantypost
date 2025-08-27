// src/services/listings.service.ts

import { Listing, AuctionSettings, Bid } from '@/context/ListingContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';
import type { ListingDraft } from '@/types/myListings';
import { securityService } from './security.service';
import { listingSchemas, authSchemas } from '@/utils/validation/schemas';
import { sanitize } from './security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { z } from 'zod';

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

// Backend listing format (from your backend)
interface BackendListing {
  _id?: string;
  id?: string;  // Backend might use 'id' instead of '_id'
  title: string;
  description: string;
  price?: number;
  markedUpPrice?: number;
  imageUrls: string[];
  seller: string;
  isVerified?: boolean;
  isPremium?: boolean;
  tags?: string[];
  hoursWorn?: number;
  status?: 'active' | 'sold' | 'expired' | 'cancelled';
  views?: number;
  createdAt: string;
  soldAt?: string;
  auction?: {
    isAuction: boolean;
    startingPrice: number;
    reservePrice?: number;
    currentBid: number;
    bidIncrement?: number;
    highestBidder?: string;
    endTime: string;
    status: 'active' | 'ended' | 'cancelled' | 'reserve_not_met';
    bidCount: number;
    bids: Array<{
      bidder: string;
      amount: number;
      date: string;
    }>;
  };
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const VIEW_CACHE_DURATION = 30 * 1000; // 30 seconds

// FIXED: Create a custom schema for listing creation that handles number conversion properly
const createListingValidationSchema = z.object({
  title: listingSchemas.title,
  description: listingSchemas.description,
  price: z.number().positive().min(0.01).max(10000), // Direct number validation
  tags: listingSchemas.tags.optional(),
  seller: authSchemas.username,
  hoursWorn: z.number().min(0).max(720).optional(), // Direct number validation
});

type CreateListingValidationData = z.infer<typeof createListingValidationSchema>;

/**
 * Convert backend listing format to frontend format
 * FIXED: Handle both '_id' and 'id' fields from backend AND include views field
 */
function convertBackendToFrontend(backendListing: BackendListing): Listing {
  // Handle both _id and id fields
  const listingId = backendListing._id || backendListing.id || uuidv4();
  
  const frontendListing: Listing = {
    id: listingId,
    title: backendListing.title,
    description: backendListing.description,
    price: backendListing.price || 0,
    markedUpPrice: backendListing.markedUpPrice || Math.round((backendListing.price || 0) * 1.1 * 100) / 100,
    imageUrls: backendListing.imageUrls || [],
    date: backendListing.createdAt,
    seller: backendListing.seller,
    isVerified: backendListing.isVerified || false,
    isPremium: backendListing.isPremium || false,
    tags: backendListing.tags || [],
    hoursWorn: backendListing.hoursWorn,
    // FIX: Include views field in the frontend listing
    views: backendListing.views || 0,
  };

  // Convert auction data if present
  if (backendListing.auction?.isAuction) {
    frontendListing.auction = {
      isAuction: true,
      startingPrice: Math.floor(backendListing.auction.startingPrice || 0),
      reservePrice: backendListing.auction.reservePrice ? 
        Math.floor(backendListing.auction.reservePrice) : undefined,
      endTime: backendListing.auction.endTime,
      bids: backendListing.auction.bids.map(bid => ({
        id: uuidv4(), // Generate ID for frontend
        bidder: bid.bidder,
        amount: Math.floor(bid.amount || 0), // Ensure integer
        date: bid.date,
      })),
      // CRITICAL FIX: Always floor the currentBid to remove any decimals
      highestBid: backendListing.auction.currentBid > 0 ? 
        Math.floor(backendListing.auction.currentBid) : undefined,
      highestBidder: backendListing.auction.highestBidder,
      status: backendListing.auction.status === 'active' ? 'active' : 
              backendListing.auction.status === 'ended' ? 'ended' : 'cancelled',
      minimumIncrement: Math.floor(backendListing.auction.bidIncrement || 1),
    };
  }

  return frontendListing;
}

/**
 * Convert frontend listing format to backend format for creation
 */
function convertFrontendToBackend(frontendListing: CreateListingRequest): any {
  const backendListing: any = {
    title: frontendListing.title,
    description: frontendListing.description,
    imageUrls: frontendListing.imageUrls,
    seller: frontendListing.seller,
    isVerified: frontendListing.isVerified,
    isPremium: frontendListing.isPremium,
    tags: frontendListing.tags,
    hoursWorn: frontendListing.hoursWorn,
  };

  // Handle auction vs regular listing
  if (frontendListing.auction) {
    backendListing.isAuction = true;
    backendListing.startingPrice = frontendListing.auction.startingPrice;
    backendListing.reservePrice = frontendListing.auction.reservePrice;
    backendListing.endTime = frontendListing.auction.endTime;
  } else {
    backendListing.price = frontendListing.price;
  }

  return backendListing;
}

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

  /**
   * Get all listings with optional filtering
   */
  async getListings(params?: ListingSearchParams): Promise<ApiResponse<Listing[]>> {
    try {
      console.log('[ListingsService] Getting listings with params:', params);

      // Sanitize search params if provided
      if (params) {
        if (params.query) {
          params.query = sanitize.searchQuery(params.query);
        }
        if (params.seller) {
          params.seller = sanitize.username(params.seller);
        }
        if (params.tags) {
          params.tags = params.tags.map(tag => sanitize.strict(tag));
        }
        if (params.minPrice !== undefined) {
          params.minPrice = sanitize.number(params.minPrice, 0, 10000);
        }
        if (params.maxPrice !== undefined) {
          params.maxPrice = sanitize.number(params.maxPrice, 0, 10000);
        }
      }

      if (FEATURES.USE_API_LISTINGS) {
        console.log('[ListingsService] Using backend API for listings');
        
        const queryParams = new URLSearchParams();
        if (params) {
          // Map frontend params to backend params
          if (params.query) queryParams.append('search', params.query);
          if (params.seller) queryParams.append('seller', params.seller);
          if (params.minPrice !== undefined) queryParams.append('minPrice', params.minPrice.toString());
          if (params.maxPrice !== undefined) queryParams.append('maxPrice', params.maxPrice.toString());
          if (params.tags) queryParams.append('tags', params.tags.join(','));
          if (params.isPremium !== undefined) queryParams.append('isPremium', params.isPremium.toString());
          if (params.isAuction !== undefined) queryParams.append('isAuction', params.isAuction.toString());
          if (params.sortBy) {
            const sortMap: Record<string, string> = {
              'date': 'date',
              'price': 'price',
              'views': 'views',
              'endingSoon': 'date' // Backend doesn't have endingSoon, use date
            };
            queryParams.append('sort', sortMap[params.sortBy] || 'date');
          }
          if (params.sortOrder) queryParams.append('order', params.sortOrder);
          if (params.page !== undefined) queryParams.append('page', (params.page + 1).toString()); // Frontend is 0-based
          if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
        }
        
        const response = await apiCall<BackendListing[]>(
          `/listings?${queryParams.toString()}`
        );

        if (response.success && response.data) {
          // Convert backend format to frontend format
          const convertedListings = response.data.map(convertBackendToFrontend);
          console.log('[ListingsService] Converted backend listings:', convertedListings.length);
          
          // Update cache only if no filters
          if (!params) {
            this.listingsCache = { data: convertedListings, timestamp: Date.now() };
          }
          
          return {
            success: true,
            data: convertedListings,
            meta: response.meta
          };
        } else {
          throw new Error(response.error?.message || 'Failed to fetch listings from backend');
        }
      }

      // Fallback to localStorage implementation
      console.log('[ListingsService] Using localStorage fallback');
      
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

      // Apply filters (same as before)
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
          filteredListings = filteredListings.filter(
            listing => listing.seller === params.seller
          );
          console.log(`[ListingsService] Seller filter "${params.seller}": ${beforeSellerCount} -> ${filteredListings.length}`);
        }

        if (params.minPrice !== undefined) {
          const beforeMinPriceCount = filteredListings.length;
          filteredListings = filteredListings.filter(listing => {
            const price = listing.auction?.highestBid || listing.price;
            return price >= params.minPrice!;
          });
          console.log(`[ListingsService] Min price filter ${params.minPrice}: ${beforeMinPriceCount} -> ${filteredListings.length}`);
        }

        if (params.maxPrice !== undefined) {
          const beforeMaxPriceCount = filteredListings.length;
          filteredListings = filteredListings.filter(listing => {
            const price = listing.auction?.highestBid || listing.price;
            return price <= params.maxPrice!;
          });
          console.log(`[ListingsService] Max price filter ${params.maxPrice}: ${beforeMaxPriceCount} -> ${filteredListings.length}`);
        }

        if (params.tags && params.tags.length > 0) {
          const beforeTagsCount = filteredListings.length;
          filteredListings = filteredListings.filter(listing =>
            listing.tags?.some(tag => params.tags!.includes(tag))
          );
          console.log(`[ListingsService] Tags filter: ${beforeTagsCount} -> ${filteredListings.length}`);
        }

        if (params.isPremium !== undefined) {
          const beforePremiumCount = filteredListings.length;
          filteredListings = filteredListings.filter(
            listing => listing.isPremium === params.isPremium
          );
          console.log(`[ListingsService] Premium filter ${params.isPremium}: ${beforePremiumCount} -> ${filteredListings.length}`);
        }

        if (params.isAuction !== undefined) {
          const beforeAuctionCount = filteredListings.length;
          filteredListings = filteredListings.filter(
            listing => (params.isAuction ? !!listing.auction : !listing.auction)
          );
          console.log(`[ListingsService] Auction filter ${params.isAuction}: ${beforeAuctionCount} -> ${filteredListings.length}`);
        }

        // Sorting
        if (params.sortBy) {
          console.log(`[ListingsService] Sorting by ${params.sortBy} ${params.sortOrder || 'asc'}`);
          filteredListings.sort((a, b) => {
            let compareValue = 0;
            
            switch (params.sortBy) {
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

            return params.sortOrder === 'desc' ? -compareValue : compareValue;
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

      if (FEATURES.USE_API_LISTINGS) {
        console.log('[ListingsService] Fetching listing from backend:', sanitizedId);
        
        const response = await apiCall<BackendListing>(`/listings/${sanitizedId}`);
        
        if (response.success && response.data) {
          const convertedListing = convertBackendToFrontend(response.data);
          return {
            success: true,
            data: convertedListing,
          };
        } else {
          return {
            success: true,
            data: null,
          };
        }
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

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing[]>(
          `/listings?seller=${sanitizedUsername}`
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
   * FIXED: Properly handle the backend response structure
   */
  async createListing(request: CreateListingRequest): Promise<ApiResponse<Listing>> {
    try {
      console.log('[ListingsService] Creating listing:', request);

      // Check rate limit
      const rateLimiter = getRateLimiter();
      const rateLimit = rateLimiter.check('LISTING_CREATE', RATE_LIMITS.LISTING_CREATE);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: { message: `Rate limit exceeded. Please wait ${rateLimit.waitTime} seconds.` },
        };
      }

      // FIXED: Ensure proper number types for validation
      const validationData = {
        title: request.title,
        description: request.description,
        price: typeof request.price === 'string' ? parseFloat(request.price) : request.price,
        seller: request.seller,
        tags: request.tags,
        hoursWorn: request.hoursWorn ? 
          (typeof request.hoursWorn === 'string' ? parseInt(request.hoursWorn) : request.hoursWorn) : 
          undefined,
      };

      // Validate and sanitize the request
      const validation = securityService.validateAndSanitize(
        validationData,
        createListingValidationSchema,
        {
          title: sanitize.strict,
          description: sanitize.strict,
          seller: sanitize.username,
          tags: (tags: string[] | undefined) => tags ? tags.map(tag => sanitize.strict(tag)) : undefined,
        }
      );

      if (!validation.success) {
        return {
          success: false,
          error: { message: 'Invalid listing data', details: validation.errors },
        };
      }

      const sanitizedData = validation.data as CreateListingValidationData;

      // Validate image URLs
      for (const imageUrl of request.imageUrls) {
        const sanitizedUrl = sanitize.url(imageUrl);
        if (!sanitizedUrl) {
          return {
            success: false,
            error: { message: 'Invalid image URL provided' },
          };
        }
      }

      if (FEATURES.USE_API_LISTINGS) {
        console.log('[ListingsService] Creating listing via backend API');
        
        const backendRequest = convertFrontendToBackend({
          ...sanitizedData,
          imageUrls: request.imageUrls,
          isVerified: request.isVerified,
          isPremium: request.isPremium,
          auction: request.auction,
        });

        const response = await apiCall<BackendListing>('/listings', {
          method: 'POST',
          body: JSON.stringify(backendRequest),
        });

        console.log('[ListingsService] Backend response:', response);

        if (response.success && response.data) {
          const convertedListing = convertBackendToFrontend(response.data);
          
          // Invalidate cache
          this.invalidateCache();
          
          return {
            success: true,
            data: convertedListing,
          };
        } else {
          throw new Error(response.error?.message || 'Backend API error');
        }
      }

      // LocalStorage implementation (fallback)
      const listings = await storageService.getItem<Listing[]>('listings', []);
      console.log('[ListingsService] Current listings count before create:', listings.length);
      
      const newListing: Listing = {
        id: uuidv4(),
        title: sanitizedData.title,
        description: sanitizedData.description,
        price: sanitizedData.price,
        markedUpPrice: Math.round(sanitizedData.price * 1.1 * 100) / 100,
        imageUrls: request.imageUrls || [],
        date: new Date().toISOString(),
        seller: sanitizedData.seller,
        isVerified: request.isVerified || false,
        isPremium: request.isPremium || false,
        tags: sanitizedData.tags || [],
        hoursWorn: sanitizedData.hoursWorn,
        views: 0, // Initialize views for new listings
        auction: request.auction ? {
          isAuction: true,
          startingPrice: request.auction.startingPrice,
          reservePrice: request.auction.reservePrice,
          endTime: request.auction.endTime,
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

      // Sanitize updates
      const sanitizedUpdates: UpdateListingRequest = {};
      
      if (updates.title !== undefined) {
        sanitizedUpdates.title = sanitize.strict(updates.title);
      }
      if (updates.description !== undefined) {
        sanitizedUpdates.description = sanitize.strict(updates.description);
      }
      if (updates.price !== undefined) {
        sanitizedUpdates.price = sanitize.number(updates.price, 0.01, 10000);
      }
      if (updates.tags !== undefined) {
        sanitizedUpdates.tags = updates.tags.map(tag => sanitize.strict(tag));
      }
      if (updates.hoursWorn !== undefined) {
        sanitizedUpdates.hoursWorn = sanitize.number(updates.hoursWorn, 0, 30);
      }
      if (updates.imageUrls !== undefined) {
        // Validate image URLs
        for (const imageUrl of updates.imageUrls) {
          const sanitizedUrl = sanitize.url(imageUrl);
          if (!sanitizedUrl) {
            return {
              success: false,
              error: { message: 'Invalid image URL provided' },
            };
          }
        }
        sanitizedUpdates.imageUrls = updates.imageUrls;
      }
      if (updates.isPremium !== undefined) {
        sanitizedUpdates.isPremium = updates.isPremium;
      }

      if (FEATURES.USE_API_LISTINGS) {
        console.log('[ListingsService] Updating listing via backend API:', sanitizedId);
        
        const response = await apiCall<BackendListing>(`/listings/${sanitizedId}`, {
          method: 'PATCH',
          body: JSON.stringify(sanitizedUpdates),
        });

        if (response.success && response.data) {
          const convertedListing = convertBackendToFrontend(response.data);
          
          // Invalidate cache
          this.invalidateCache();
          
          return {
            success: true,
            data: convertedListing,
          };
        } else {
          throw new Error(response.error?.message || 'Backend API error');
        }
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

      if (FEATURES.USE_API_LISTINGS) {
        console.log('[ListingsService] Deleting listing via backend API:', sanitizedId);
        
        const response = await apiCall<void>(`/listings/${sanitizedId}`, { 
          method: 'DELETE' 
        });

        if (response.success) {
          // Invalidate cache
          this.invalidateCache();
          
          // Trigger a custom event to notify other components
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('listingDeleted', { 
              detail: { listingId: sanitizedId } 
            }));
          }
          
          return { success: true };
        } else {
          throw new Error(response.error?.message || 'Backend API error');
        }
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
      // Sanitize listing IDs
      const sanitizedIds = request.listingIds.map(id => sanitize.strict(id));

      // Sanitize updates (same as updateListing)
      const sanitizedUpdates: UpdateListingRequest = {};
      
      if (request.updates.title !== undefined) {
        sanitizedUpdates.title = sanitize.strict(request.updates.title);
      }
      if (request.updates.description !== undefined) {
        sanitizedUpdates.description = sanitize.strict(request.updates.description);
      }
      if (request.updates.price !== undefined) {
        sanitizedUpdates.price = sanitize.number(request.updates.price, 0.01, 10000);
      }
      if (request.updates.tags !== undefined) {
        sanitizedUpdates.tags = request.updates.tags.map(tag => sanitize.strict(tag));
      }
      if (request.updates.hoursWorn !== undefined) {
        sanitizedUpdates.hoursWorn = sanitize.number(request.updates.hoursWorn, 0, 30);
      }
      if (request.updates.isPremium !== undefined) {
        sanitizedUpdates.isPremium = request.updates.isPremium;
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing[]>(`/listings/bulk`, {
          method: 'PATCH',
          body: JSON.stringify({
            listingIds: sanitizedIds,
            updates: sanitizedUpdates,
          }),
        });
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const updatedListings: Listing[] = [];

      listings.forEach((listing, index) => {
        if (sanitizedIds.includes(listing.id)) {
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
   * Place bid on auction listing with proper minimum bid validation
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
      const sanitizedAmount = sanitize.currency(amount);

      // Validate amount
      if (sanitizedAmount < 0.01 || sanitizedAmount > 10000) {
        return {
          success: false,
          error: { message: 'Invalid bid amount' },
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        console.log('[ListingsService] Placing bid via backend API:', sanitizedId, sanitizedAmount);
        
        const response = await apiCall<BackendListing>(`/listings/${sanitizedId}/bid`, {
          method: 'POST',
          body: JSON.stringify({ amount: sanitizedAmount }),
        });

        if (response.success && response.data) {
          const convertedListing = convertBackendToFrontend(response.data);
          
          // Invalidate cache
          this.invalidateCache();
          
          return {
            success: true,
            data: convertedListing,
          };
        } else {
          return {
            success: false,
            error: { message: response.error?.message || 'Failed to place bid' },
          };
        }
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

      // Proper bid validation logic
      const currentHighestBid = listing.auction.highestBid || 0;
      const startingPrice = listing.auction.startingPrice;
      
      if (currentHighestBid === 0) {
        // First bid - must be at least starting price (allow equal)
        if (sanitizedAmount < startingPrice) {
          return {
            success: false,
            error: { message: `Minimum bid is $${startingPrice.toFixed(2)}` },
          };
        }
      } else {
        // Subsequent bids - must be higher than current highest bid
        if (sanitizedAmount <= currentHighestBid) {
          return {
            success: false,
            error: { message: `Bid must be higher than $${currentHighestBid.toFixed(2)}` },
          };
        }
      }

      const newBid: Bid = {
        id: uuidv4(),
        bidder: sanitizedBidder,
        amount: sanitizedAmount,
        date: new Date().toISOString(),
      };

      listing.auction.bids.push(newBid);
      listing.auction.highestBid = sanitizedAmount;
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

      if (FEATURES.USE_API_LISTINGS) {
        // Backend doesn't have a specific cancel endpoint, so we'll use a status update
        const response = await apiCall<BackendListing>(`/listings/${sanitizedId}`, {
          method: 'PATCH',
          body: JSON.stringify({ 'auction.status': 'cancelled' }),
        });

        if (response.success && response.data) {
          const convertedListing = convertBackendToFrontend(response.data);
          
          // Invalidate cache
          this.invalidateCache();
          
          return {
            success: true,
            data: convertedListing,
          };
        } else {
          throw new Error(response.error?.message || 'Backend API error');
        }
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

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<void>(`/listings/${sanitizedId}/views`, {
          method: 'POST',
          body: JSON.stringify({ viewerId: sanitizedViewerId }),
        });
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
        const response = await apiCall<number>(`/listings/${sanitizedId}/views`);
        
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
      // Sanitize limit
      const sanitizedLimit = Math.min(Math.max(1, limit), 50);

      // Check cache first
      const now = Date.now();
      if (
        this.popularTagsCache.data &&
        now - this.popularTagsCache.timestamp < CACHE_DURATION
      ) {
        return {
          success: true,
          data: this.popularTagsCache.data.slice(0, sanitizedLimit),
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        const response = await apiCall<PopularTag[]>(
          `/listings/popular-tags?limit=${sanitizedLimit}`
        );
        
        if (response.success && response.data) {
          // Cache the result
          this.popularTagsCache = {
            data: response.data,
            timestamp: now,
          };
          
          return response;
        }
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
        .slice(0, sanitizedLimit);

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
      // Create a sanitized copy, checking each property exists
      const sanitizedDraft: ListingDraft = { ...draft };

      // The ListingDraft type should have these properties, but let's handle them safely
      const draftAsAny = draft as any;
      
      if (draftAsAny.title) {
        (sanitizedDraft as any).title = sanitize.strict(draftAsAny.title);
      }
      if (draftAsAny.description) {
        (sanitizedDraft as any).description = sanitize.strict(draftAsAny.description);
      }
      if (draftAsAny.seller) {
        (sanitizedDraft as any).seller = sanitize.username(draftAsAny.seller);
      }
      if (draftAsAny.tags) {
        (sanitizedDraft as any).tags = draftAsAny.tags.map((tag: string) => sanitize.strict(tag));
      }

      const drafts = await storageService.getItem<ListingDraft[]>('listing_drafts', []);
      
      const existingIndex = drafts.findIndex(d => d.id === sanitizedDraft.id);
      
      if (existingIndex >= 0) {
        drafts[existingIndex] = { ...sanitizedDraft, lastModified: new Date().toISOString() };
      } else {
        drafts.push({ ...sanitizedDraft, lastModified: new Date().toISOString() });
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
      // Sanitize seller
      const sanitizedSeller = sanitize.username(seller);

      const drafts = await storageService.getItem<ListingDraft[]>('listing_drafts', []);
      const sellerDrafts = drafts.filter(d => (d as any).seller === sanitizedSeller);
      
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
      // Sanitize ID
      const sanitizedId = sanitize.strict(draftId);

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
      // Check rate limit
      const rateLimiter = getRateLimiter();
      const rateLimit = rateLimiter.check('IMAGE_UPLOAD', RATE_LIMITS.IMAGE_UPLOAD);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: { message: `Rate limit exceeded. Please wait ${rateLimit.waitTime} seconds.` },
        };
      }

      // Validate file
      const fileValidation = securityService.validateFileUpload(file, {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
      });

      if (!fileValidation.valid) {
        return {
          success: false,
          error: { message: fileValidation.error! },
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
      
      return {
        success: true,
        data: data.secure_url,
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
      // Sanitize URL
      const sanitizedUrl = sanitize.url(imageUrl);
      if (!sanitizedUrl) {
        return {
          success: false,
          error: { message: 'Invalid image URL' },
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<void>(`/listings/images/delete`, {
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