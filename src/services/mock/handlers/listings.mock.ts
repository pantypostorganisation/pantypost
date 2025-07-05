// src/services/mock/handlers/listings.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { Listing, AuctionSettings, Bid } from '@/context/ListingContext';
import { v4 as uuidv4 } from 'uuid';
import { PopularTag } from '@/services/listings.service';

// Generate mock listing
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
    title: titles[index % titles.length],
    description: `Beautiful ${titles[index % titles.length]} from ${seller}. Worn with care and ready for a new home.`,
    price: Math.round(basePrice * 100) / 100,
    markedUpPrice: Math.round(basePrice * 1.1 * 100) / 100,
    imageUrls: [
      `https://picsum.photos/400/600?random=${index}`,
      `https://picsum.photos/400/600?random=${index + 1}`,
      `https://picsum.photos/400/600?random=${index + 2}`,
    ],
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    seller,
    isVerified: Math.random() > 0.5,
    isPremium,
    tags: tags[index % tags.length],
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
        bidder: `buyer${Math.floor(Math.random() * 10)}`,
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
      
      // Apply filters
      let filteredListings = [...listings];
      
      if (params?.query) {
        const query = params.query.toLowerCase();
        filteredListings = filteredListings.filter(l =>
          l.title.toLowerCase().includes(query) ||
          l.description.toLowerCase().includes(query) ||
          l.tags?.some(tag => tag.toLowerCase().includes(query)) ||
          l.seller.toLowerCase().includes(query)
        );
      }
      
      if (params?.seller) {
        filteredListings = filteredListings.filter(l => l.seller === params.seller);
      }
      
      if (params?.minPrice) {
        const minPrice = parseFloat(params.minPrice);
        filteredListings = filteredListings.filter(l => l.price >= minPrice);
      }
      
      if (params?.maxPrice) {
        const maxPrice = parseFloat(params.maxPrice);
        filteredListings = filteredListings.filter(l => l.price <= maxPrice);
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
      if (params?.sortBy) {
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
      
      // Pagination
      const page = parseInt(params?.page || '0');
      const limit = parseInt(params?.limit || '20');
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
      // Create listing
      const newListing: Listing = {
        id: uuidv4(),
        ...data,
        date: new Date().toISOString(),
        markedUpPrice: Math.round(data.price * 1.1 * 100) / 100,
      };
      
      const listings = await mockDataStore.get<Listing[]>('listings', []);
      listings.push(newListing);
      await mockDataStore.set('listings', listings);
      
      // Return array with the new listing to match expected type
      return {
        success: true,
        data: [newListing],
      };
    }
    
    return {
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    };
  },
  
  // Get single listing
  get: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Listing | null>> => {
    const id = params?.id;
    
    if (!id) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Listing ID is required' },
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
      // Update listing
      Object.assign(listing, data);
      if (data.price) {
        listing.markedUpPrice = Math.round(data.price * 1.1 * 100) / 100;
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
    
    const listings = await mockDataStore.get<Listing[]>('listings', []);
    const sellerListings = listings.filter(l => l.seller === username);
    
    return {
      success: true,
      data: sellerListings,
    };
  },
  
  // Update views - returns void with view count in separate endpoint
  views: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<any>> => {
    const id = params?.id;
    if (!id) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Listing ID is required' },
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
      // Increment views
      views[id] = (views[id] || 0) + 1;
      await mockDataStore.set('listingViews', views);
      
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
    const { bidder, amount } = data;
    
    if (!listingId || !bidder || !amount) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
      };
    }
    
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
    if (amount <= minBid) {
      return {
        success: false,
        error: { code: 'BID_TOO_LOW', message: 'Bid must be higher than current bid' },
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
    
    await mockDataStore.set('listings', listings);
    
    return {
      success: true,
      data: listing,
    };
  },
  
  // Get popular tags
  popularTags: async (): Promise<ApiResponse<PopularTag[]>> => {
    const listings = await mockDataStore.get<Listing[]>('listings', []);
    const tagCounts = new Map<string, number>();
    
    listings.forEach(listing => {
      listing.tags?.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
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