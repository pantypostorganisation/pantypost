// src/services/mock/handlers/listings.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { Listing, AuctionSettings, Bid } from '@/context/ListingContext';
import { v4 as uuidv4 } from 'uuid';
import { PopularTag } from '@/services/listings.service';
import { sanitizeStrict, sanitizeUsername, sanitizeCurrency, sanitizeNumber } from '@/utils/security/sanitization';
import { listingSchemas } from '@/utils/validation/schemas';
import { securityService } from '@/services/security.service';
import { z } from 'zod';

// Validation schemas for listings
const createListingSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  price: z.number().positive().max(10000),
  tags: z.array(z.string().max(20)).max(10).optional(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
  hoursWorn: z.number().min(0).max(168).optional(),
  isPremium: z.boolean().optional(),
  auction: z.object({
    isAuction: z.boolean(),
    startingPrice: z.number().positive().max(10000),
    reservePrice: z.number().positive().max(10000),
    endTime: z.string().datetime(),
  }).optional()
});

const bidSchema = z.object({
  bidder: z.string().min(3).max(20),
  amount: z.number().positive().max(10000)
});

// Generate mock listing with sanitized data
function generateMockListing(seller: string, index: number): Listing {
  const isAuction = Math.random() > 0.7;
  const isPremium = Math.random() > 0.8;
  const basePrice = 20 + Math.random() * 180;
  
  const titles = [
    'Lacy Dream Set',
    'Silk Sensation',
    'Cotton Comfort',
    'Satin Surprise',
    'Vintage Romance',
    'Athletic Essentials',
    'Designer Delights',
    'Everyday Elegance',
    'Special Collection',
    'Limited Edition',
  ];
  
  const tags = [
    ['lace', 'delicate', 'romantic'],
    ['silk', 'smooth', 'luxury'],
    ['cotton', 'comfortable', 'daily'],
    ['satin', 'shiny', 'special'],
    ['vintage', 'retro', 'unique'],
    ['athletic', 'sporty', 'active'],
    ['designer', 'premium', 'exclusive'],
    ['casual', 'everyday', 'practical'],
    ['special', 'collection', 'rare'],
    ['limited', 'exclusive', 'premium'],
  ];
  
  const hoursWorn = [6, 12, 24, 48, 72];
  
  const listing: Listing = {
    id: uuidv4(),
    title: sanitizeStrict(titles[index % titles.length]) || titles[index % titles.length],
    description: sanitizeStrict(`Beautiful ${titles[index % titles.length]} from ${seller}. Worn with care and ready for a new home.`) || '',
    price: Math.round(basePrice * 100) / 100,
    markedUpPrice: Math.round(basePrice * 1.1 * 100) / 100,
    imageUrls: [
      `https://picsum.photos/400/600?random=${index}`,
      `https://picsum.photos/400/600?random=${index + 1}`,
      `https://picsum.photos/400/600?random=${index + 2}`,
    ],
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    seller: sanitizeUsername(seller) || seller,
    isVerified: Math.random() > 0.5,
    isPremium,
    tags: tags[index % tags.length].map(tag => sanitizeStrict(tag) || tag),
    hoursWorn: hoursWorn[Math.floor(Math.random() * hoursWorn.length)],
  };
  
  if (isAuction) {
    const startingPrice = Math.round(basePrice * 0.5 * 100) / 100;
    const endTime = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    listing.auction = {
      isAuction: true,
      startingPrice,
      reservePrice: Math.round(basePrice * 0.8 * 100) / 100,
      endTime: endTime.toISOString(),
      bids: [],
      status: 'active',
    };
    
    // Add some mock bids
    const bidCount = Math.floor(Math.random() * 5);
    let currentPrice = startingPrice;
    
    for (let i = 0; i < bidCount; i++) {
      currentPrice += Math.round(Math.random() * 20 * 100) / 100;
      const bid: Bid = {
        id: uuidv4(),
        bidder: sanitizeUsername(`buyer${Math.floor(Math.random() * 10)}`) || 'buyer',
        amount: currentPrice,
        date: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      };
      listing.auction.bids.push(bid);
    }
    
    if (bidCount > 0) {
      listing.auction.highestBid = currentPrice;
      listing.auction.highestBidder = listing.auction.bids[bidCount - 1].bidder;
    }
  }
  
  return listing;
}

export const mockListingHandlers = {
  // List listings
  list: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Listing[]>> => {
    if (method === 'GET') {
      let listings = await mockDataStore.get<Listing[]>('listings', []);
      
      // Generate initial listings if empty
      if (listings.length === 0) {
        const sellers = ['alice', 'betty', 'carol', 'diana', 'emma', 'fiona', 'grace', 'helen'];
        listings = [];
        
        sellers.forEach(seller => {
          for (let i = 0; i < 5; i++) {
            listings.push(generateMockListing(seller, i));
          }
        });
        
        await mockDataStore.set('listings', listings);
      }
      
      // Apply filters with sanitization
      let filteredListings = [...listings];
      
      if (params?.query) {
        const sanitizedQuery = sanitizeStrict(params.query.toLowerCase());
        if (sanitizedQuery) {
          filteredListings = filteredListings.filter(l =>
            l.title.toLowerCase().includes(sanitizedQuery) ||
            l.description.toLowerCase().includes(sanitizedQuery) ||
            l.tags?.some(tag => tag.toLowerCase().includes(sanitizedQuery)) ||
            l.seller.toLowerCase().includes(sanitizedQuery)
          );
        }
      }
      
      if (params?.seller) {
        const sanitizedSeller = sanitizeUsername(params.seller);
        if (sanitizedSeller) {
          filteredListings = filteredListings.filter(l => l.seller === sanitizedSeller);
        }
      }
      
      if (params?.minPrice) {
        const minPrice = sanitizeNumber(parseFloat(params.minPrice));
        if (minPrice !== null && minPrice >= 0) {
          filteredListings = filteredListings.filter(l => l.price >= minPrice);
        }
      }
      
      if (params?.maxPrice) {
        const maxPrice = sanitizeNumber(parseFloat(params.maxPrice));
        if (maxPrice !== null && maxPrice >= 0) {
          filteredListings = filteredListings.filter(l => l.price <= maxPrice);
        }
      }
      
      if (params?.isPremium === 'true') {
        filteredListings = filteredListings.filter(l => l.isPremium);
      } else if (params?.isPremium === 'false') {
        filteredListings = filteredListings.filter(l => !l.isPremium);
      }
      
      if (params?.isAuction === 'true') {
        filteredListings = filteredListings.filter(l => !!l.auction);
      } else if (params?.isAuction === 'false') {
        filteredListings = filteredListings.filter(l => !l.auction);
      }
      
      if (params?.isActive === 'true') {
        const now = new Date();
        filteredListings = filteredListings.filter(l => {
          if (!l.auction) return true;
          return new Date(l.auction.endTime) > now;
        });
      }
      
      // Sorting
      if (params?.sortBy && ['price', 'date', 'endingSoon'].includes(params.sortBy)) {
        filteredListings.sort((a, b) => {
          switch (params.sortBy) {
            case 'price':
              const aPrice = a.auction?.highestBid || a.price;
              const bPrice = b.auction?.highestBid || b.price;
              return aPrice - bPrice;
            case 'date':
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            case 'endingSoon':
              if (a.auction && b.auction) {
                return new Date(a.auction.endTime).getTime() - new Date(b.auction.endTime).getTime();
              }
              return a.auction ? -1 : b.auction ? 1 : 0;
            default:
              return 0;
          }
        });
        
        if (params.sortOrder === 'desc' && params.sortBy !== 'endingSoon') {
          filteredListings.reverse();
        }
      }
      
      // Pagination with validation
      const page = Math.max(0, parseInt(params?.page || '0'));
      const limit = Math.min(100, Math.max(1, parseInt(params?.limit || '20')));
      const startIndex = page * limit;
      const endIndex = startIndex + limit;
      
      const paginatedListings = filteredListings.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: paginatedListings,
        meta: {
          page,
          totalPages: Math.ceil(filteredListings.length / limit),
          totalItems: filteredListings.length,
        },
      };
    }
    
    if (method === 'POST') {
      // Create listing with validation
      try {
        const validatedData = createListingSchema.parse(data);
        
        // Additional content security check
        const titleCheck = securityService.checkContentSecurity(validatedData.title);
        const descCheck = securityService.checkContentSecurity(validatedData.description);
        
        if (!titleCheck.safe || !descCheck.safe) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Content contains prohibited material' },
          };
        }
        
        const newListing: Listing = {
          id: uuidv4(),
          title: sanitizeStrict(validatedData.title) || '',
          description: sanitizeStrict(validatedData.description) || '',
          price: validatedData.price,
          markedUpPrice: Math.round(validatedData.price * 1.1 * 100) / 100,
          imageUrls: validatedData.imageUrls || [],
          date: new Date().toISOString(),
          seller: sanitizeUsername(data.seller) || 'unknown',
          isVerified: false,
          isPremium: validatedData.isPremium || false,
          tags: validatedData.tags?.map(tag => sanitizeStrict(tag) || '').filter(Boolean) || [],
          hoursWorn: validatedData.hoursWorn,
          auction: validatedData.auction ? {
            ...validatedData.auction,
            bids: [],
            status: 'active'
          } : undefined
        };
        
        const listings = await mockDataStore.get<Listing[]>('listings', []);
        listings.push(newListing);
        await mockDataStore.set('listings', listings);
        
        // Return array with the new listing to match expected type
        return {
          success: true,
          data: [newListing],
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: { 
              code: 'VALIDATION_ERROR', 
              message: sanitizeStrict(error.errors[0].message) || 'Invalid input'
            },
          };
        }
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid listing data' },
        };
      }
    }
    
    return {
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    };
  },
  
  // Get single listing
  get: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Listing | null>> => {
    const id = params?.id;
    
    if (!id || !id.match(/^[a-f0-9-]{36}$/i)) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid listing ID' },
      };
    }
    
    const listings = await mockDataStore.get<Listing[]>('listings', []);
    const listing = listings.find(l => l.id === id);
    
    if (!listing) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Listing not found' },
      };
    }
    
    if (method === 'GET') {
      return {
        success: true,
        data: listing,
      };
    }
    
    if (method === 'PATCH') {
      // Update listing with validation
      if (data.title) {
        const titleCheck = securityService.checkContentSecurity(data.title);
        if (!titleCheck.safe) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Title contains prohibited content' },
          };
        }
        listing.title = sanitizeStrict(data.title) || listing.title;
      }
      
      if (data.description) {
        const descCheck = securityService.checkContentSecurity(data.description);
        if (!descCheck.safe) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Description contains prohibited content' },
          };
        }
        listing.description = sanitizeStrict(data.description) || listing.description;
      }
      
      if (data.price) {
        const price = sanitizeNumber(data.price);
        if (price !== null && price > 0 && price <= 10000) {
          listing.price = price;
          listing.markedUpPrice = Math.round(price * 1.1 * 100) / 100;
        }
      }
      
      if (data.tags) {
        listing.tags = data.tags.map((tag: string) => sanitizeStrict(tag) || '').filter(Boolean);
      }
      
      await mockDataStore.set('listings', listings);
      
      return {
        success: true,
        data: listing,
      };
    }
    
    if (method === 'DELETE') {
      // Delete listing
      const index = listings.findIndex(l => l.id === id);
      if (index !== -1) {
        listings.splice(index, 1);
        await mockDataStore.set('listings', listings);
      }
      
      return { success: true };
    }
    
    return {
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    };
  },
  
  // Get listings by seller
  getBySeller: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Listing[]>> => {
    const username = params?.username;
    
    if (!username) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username is required' },
      };
    }
    
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
      };
    }
    
    const listings = await mockDataStore.get<Listing[]>('listings', []);
    const sellerListings = listings.filter(l => l.seller === sanitizedUsername);
    
    return {
      success: true,
      data: sellerListings,
    };
  },
  
  // Update views - returns void with view count in separate endpoint
  views: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<any>> => {
    const id = params?.id;
    
    if (!id || !id.match(/^[a-f0-9-]{36}$/i)) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid listing ID' },
      };
    }
    
    const views = await mockDataStore.get<Record<string, number>>('listingViews', {});
    
    if (method === 'GET') {
      // Get view count - return as object with count property
      return {
        success: true,
        data: { views: views[id] || 0 },
      };
    }
    
    if (method === 'POST') {
      // Increment views with rate limiting check
      const currentViews = views[id] || 0;
      if (currentViews < 1000000) { // Prevent overflow
        views[id] = currentViews + 1;
        await mockDataStore.set('listingViews', views);
      }
      
      // Return void response
      return { success: true };
    }
    
    return {
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    };
  },
  
  // Place bid
  placeBid: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Listing>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const listingId = params?.id;
    
    if (!listingId || !listingId.match(/^[a-f0-9-]{36}$/i)) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid listing ID' },
      };
    }
    
    // Validate bid data
    try {
      const validatedBid = bidSchema.parse(data);
      
      const listings = await mockDataStore.get<Listing[]>('listings', []);
      const listing = listings.find(l => l.id === listingId);
      
      if (!listing || !listing.auction) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Auction not found' },
        };
      }
      
      if (listing.auction.status !== 'active') {
        return {
          success: false,
          error: { code: 'AUCTION_ENDED', message: 'Auction is not active' },
        };
      }
      
      const now = new Date();
      const endTime = new Date(listing.auction.endTime);
      if (endTime <= now) {
        return {
          success: false,
          error: { code: 'AUCTION_ENDED', message: 'Auction has ended' },
        };
      }
      
      const minBid = listing.auction.highestBid || listing.auction.startingPrice;
      if (validatedBid.amount <= minBid) {
        return {
          success: false,
          error: { code: 'BID_TOO_LOW', message: 'Bid must be higher than current bid' },
        };
      }
      
      // Prevent self-bidding
      if (sanitizeUsername(validatedBid.bidder) === listing.seller) {
        return {
          success: false,
          error: { code: 'INVALID_BID', message: 'Cannot bid on your own listing' },
        };
      }
      
      const newBid: Bid = {
        id: uuidv4(),
        bidder: sanitizeUsername(validatedBid.bidder) || 'anonymous',
        amount: validatedBid.amount,
        date: new Date().toISOString(),
      };
      
      listing.auction.bids.push(newBid);
      listing.auction.highestBid = validatedBid.amount;
      listing.auction.highestBidder = newBid.bidder;
      
      await mockDataStore.set('listings', listings);
      
      return {
        success: true,
        data: listing,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: sanitizeStrict(error.errors[0].message) || 'Invalid bid data' 
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid bid data' },
      };
    }
  },
  
  // Get popular tags
  popularTags: async (): Promise<ApiResponse<PopularTag[]>> => {
    const listings = await mockDataStore.get<Listing[]>('listings', []);
    const tagCounts = new Map<string, number>();
    
    listings.forEach(listing => {
      listing.tags?.forEach(tag => {
        const sanitizedTag = sanitizeStrict(tag);
        if (sanitizedTag) {
          tagCounts.set(sanitizedTag, (tagCounts.get(sanitizedTag) || 0) + 1);
        }
      });
    });
    
    const popularTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      success: true,
      data: popularTags,
    };
  },
} as const;