// src/services/listings.service.ts

import { Listing, AuctionSettings, Bid } from '@/context/ListingContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';

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
  sortBy?: 'date' | 'price' | 'views';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ListingViewUpdate {
  listingId: string;
  viewerId?: string;
}

/**
 * Listings Service
 * Handles all listing-related operations
 */
export class ListingsService {
  /**
   * Get all listings
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

      // LocalStorage implementation
      const listings = await storageService.getItem<Listing[]>('listings', []);
      let filteredListings = [...listings];

      // Apply filters
      if (params) {
        if (params.query) {
          const query = params.query.toLowerCase();
          filteredListings = filteredListings.filter(
            listing =>
              listing.title.toLowerCase().includes(query) ||
              listing.description.toLowerCase().includes(query) ||
              listing.tags?.some(tag => tag.toLowerCase().includes(query))
          );
        }

        if (params.seller) {
          filteredListings = filteredListings.filter(
            listing => listing.seller === params.seller
          );
        }

        if (params.minPrice !== undefined) {
          filteredListings = filteredListings.filter(
            listing => listing.price >= params.minPrice!
          );
        }

        if (params.maxPrice !== undefined) {
          filteredListings = filteredListings.filter(
            listing => listing.price <= params.maxPrice!
          );
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
                compareValue = a.price - b.price;
                break;
              case 'views':
                // Would need to load views data
                compareValue = 0;
                break;
            }

            return params.sortOrder === 'desc' ? -compareValue : compareValue;
          });
        }

        // Pagination
        if (params.page && params.limit) {
          const start = (params.page - 1) * params.limit;
          const end = start + params.limit;
          filteredListings = filteredListings.slice(start, end);
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
   * Get listing views
   */
  async getListingViews(listingId: string): Promise<ApiResponse<number>> {
    try {
      if (FEATURES.USE_API_LISTINGS) {
        return await apiCall<number>(
          buildApiUrl(API_ENDPOINTS.LISTINGS.VIEWS, { id: listingId })
        );
      }

      // LocalStorage implementation
      const viewsData = await storageService.getItem<Record<string, number>>(
        'listing_views',
        {}
      );

      return {
        success: true,
        data: viewsData[listingId] || 0,
      };
    } catch (error) {
      console.error('Get listing views error:', error);
      return {
        success: false,
        error: { message: 'Failed to get listing views' },
      };
    }
  }
}

// Export singleton instance
export const listingsService = new ListingsService();