// src/services/listings.service.ts

import { Listing, AuctionSettings, Bid } from '@/context/ListingContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';
import type { ListingDraft } from '@/types/myListings';

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

      // Check cache first
      const now = Date.now();
      if (
        !params &&
        this.listingsCache.data &&
        now - this.listingsCache.timestamp < CACHE_DURATION
      ) {
        return {
          success: true,
          data: this.listingsCache.data,
        };
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      
      // Update cache
      if (!params) {
        this.listingsCache = { data: listings, timestamp: now };
      }

      let filteredListings = [...listings];

      // Apply filters
      if (params) {
        // Active filter (not ended auctions)
        if (params.isActive !== undefined) {
          filteredListings = filteredListings.filter(listing => {
            if (!listing.auction) return true;
            const now = new Date();
            const endTime = new Date(listing.auction.endTime);
            return params.isActive ? endTime > now : endTime <= now;
          });
        }

        if (params.query) {
          const query = params.query.toLowerCase();
          filteredListings = filteredListings.filter(
            listing =>
              listing.title.toLowerCase().includes(query) ||
              listing.description.toLowerCase().includes(query) ||
              listing.tags?.some(tag => tag.toLowerCase().includes(query)) ||
              listing.seller.toLowerCase().includes(query)
          );
        }

        if (params.seller) {
          filteredListings = filteredListings.filter(
            listing => listing.seller === params.seller
          );
        }

        if (params.minPrice !== undefined) {
          filteredListings = filteredListings.filter(listing => {
            const price = listing.auction?.highestBid || listing.price;
            return price >= params.minPrice!;
          });
        }

        if (params.maxPrice !== undefined) {
          filteredListings = filteredListings.filter(listing => {
            const price = listing.auction?.highestBid || listing.price;
            return price <= params.maxPrice!;
          });
        }

        if (params.tags && params.tags.length > 0) {
          filteredListings = filteredListings.filter(listing =>
            listing.tags?.some(tag => params.tags!.includes(tag))
          );
        }

        if (params.isPremium !== undefined) {
          filteredListings = filteredListings.filter(
            listing => listing.isPremium === params.isPremium
          );
        }

        if (params.isAuction !== undefined) {
          filteredListings = filteredListings.filter(
            listing => (params.isAuction ? !!listing.auction : !listing.auction)
          );
        }

        // Sorting
        if (params.sortBy) {
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

        // Pagination
        if (params.page !== undefined && params.limit) {
          const start = params.page * params.limit;
          const end = start + params.limit;
          
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

      return {
        success: true,
        data: filteredListings,
      };
    } catch (error) {
      console.error('Get listings error:', error);
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
      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.GET, { id })
        );
      }

      // Try cache first
      if (this.listingsCache.data) {
        const cachedListing = this.listingsCache.data.find(l => l.id === id);
        if (cachedListing) {
          return {
            success: true,
            data: cachedListing,
          };
        }
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const listing = listings.find(l => l.id === id);

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
      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing[]>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.BY_SELLER, { username })
        );
      }

      // LocalStorage implementation
      return this.getListings({ seller: username });
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
      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing>(API_ENDPOINTS.LISTINGS.CREATE, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      
      const newListing: Listing = {
        id: uuidv4(),
        title: request.title,
        description: request.description,
        price: request.price,
        markedUpPrice: Math.round(request.price * 1.1 * 100) / 100,
        imageUrls: request.imageUrls,
        date: new Date().toISOString(),
        seller: request.seller,
        isVerified: request.isVerified,
        isPremium: request.isPremium,
        tags: request.tags,
        hoursWorn: request.hoursWorn,
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

      listings.push(newListing);
      await storageService.setItem('listings', listings);

      // Invalidate cache
      this.invalidateCache();

      return {
        success: true,
        data: newListing,
      };
    } catch (error) {
      console.error('Create listing error:', error);
      return {
        success: false,
        error: { message: 'Failed to create listing' },
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
      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.UPDATE, { id }),
          {
            method: 'PATCH',
            body: JSON.stringify(updates),
          }
        );
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const index = listings.findIndex(l => l.id === id);

      if (index === -1) {
        return {
          success: false,
          error: { message: 'Listing not found' },
        };
      }

      const updatedListing = {
        ...listings[index],
        ...updates,
        markedUpPrice: updates.price
          ? Math.round(updates.price * 1.1 * 100) / 100
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
   * Delete listing
   */
  async deleteListing(id: string): Promise<ApiResponse<void>> {
    try {
      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<void>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.DELETE, { id }),
          { method: 'DELETE' }
        );
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const filtered = listings.filter(l => l.id !== id);
      
      await storageService.setItem('listings', filtered);

      // Invalidate cache
      this.invalidateCache();

      return { success: true };
    } catch (error) {
      console.error('Delete listing error:', error);
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
      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing[]>(`${API_ENDPOINTS.LISTINGS.LIST}/bulk`, {
          method: 'PATCH',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const updatedListings: Listing[] = [];

      listings.forEach((listing, index) => {
        if (request.listingIds.includes(listing.id)) {
          const updatedListing = {
            ...listing,
            ...request.updates,
            markedUpPrice: request.updates.price
              ? Math.round(request.updates.price * 1.1 * 100) / 100
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
      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing>(
          `${buildApiUrl(API_ENDPOINTS.LISTINGS.GET, { id: listingId })}/bids`,
          {
            method: 'POST',
            body: JSON.stringify({ bidder, amount }),
          }
        );
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const listing = listings.find(l => l.id === listingId);

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
        bidder,
        amount,
        date: new Date().toISOString(),
      };

      listing.auction.bids.push(newBid);
      listing.auction.highestBid = amount;
      listing.auction.highestBidder = bidder;

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
      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<Listing>(
          `${buildApiUrl(API_ENDPOINTS.LISTINGS.GET, { id: listingId })}/auction/cancel`,
          { method: 'POST' }
        );
      }

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      const listing = listings.find(l => l.id === listingId);

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
      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<void>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.VIEWS, { id: update.listingId }),
          {
            method: 'POST',
            body: JSON.stringify({ viewerId: update.viewerId }),
          }
        );
      }

      // LocalStorage implementation
      const viewsData = await storageService.getItem<Record<string, number>>(
        'listing_views',
        {}
      );
      
      viewsData[update.listingId] = (viewsData[update.listingId] || 0) + 1;
      await storageService.setItem('listing_views', viewsData);

      // Invalidate view cache for this listing
      this.viewsCache.delete(update.listingId);

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
      // Check cache first
      const cached = this.viewsCache.get(listingId);
      const now = Date.now();
      
      if (cached && now - cached.timestamp < VIEW_CACHE_DURATION) {
        return {
          success: true,
          data: cached.count,
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        const response = await apiCall<number>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.VIEWS, { id: listingId })
        );
        
        if (response.success && response.data !== undefined) {
          this.viewsCache.set(listingId, { count: response.data, timestamp: now });
        }
        
        return response;
      }

      // LocalStorage implementation
      const viewsData = await storageService.getItem<Record<string, number>>(
        'listing_views',
        {}
      );

      const count = viewsData[listingId] || 0;
      this.viewsCache.set(listingId, { count, timestamp: now });

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
      // Check cache first
      const now = Date.now();
      if (
        this.popularTagsCache.data &&
        now - this.popularTagsCache.timestamp < CACHE_DURATION
      ) {
        return {
          success: true,
          data: this.popularTagsCache.data.slice(0, limit),
        };
      }

      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<PopularTag[]>(
          `${API_ENDPOINTS.LISTINGS.LIST}/tags/popular?limit=${limit}`
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
        .slice(0, limit);

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
      const drafts = await storageService.getItem<ListingDraft[]>('listing_drafts', []);
      
      const existingIndex = drafts.findIndex(d => d.id === draft.id);
      
      if (existingIndex >= 0) {
        drafts[existingIndex] = { ...draft, lastModified: new Date().toISOString() };
      } else {
        drafts.push({ ...draft, lastModified: new Date().toISOString() });
      }
      
      await storageService.setItem('listing_drafts', drafts);
      
      return {
        success: true,
        data: draft,
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
      const drafts = await storageService.getItem<ListingDraft[]>('listing_drafts', []);
      const sellerDrafts = drafts.filter(d => d.seller === seller);
      
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
      const drafts = await storageService.getItem<ListingDraft[]>('listing_drafts', []);
      const filtered = drafts.filter(d => d.id !== draftId);
      
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
      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<void>(`${API_ENDPOINTS.LISTINGS.LIST}/images/delete`, {
          method: 'DELETE',
          body: JSON.stringify({ imageUrl }),
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
    this.listingsCache = { data: null, timestamp: 0 };
    this.popularTagsCache = { data: null, timestamp: 0 };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.invalidateCache();
    this.viewsCache.clear();
  }
}

// Export singleton instance
export const listingsService = new ListingsService();