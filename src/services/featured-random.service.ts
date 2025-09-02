// src/services/featured-random.service.ts
import { z } from 'zod';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { randomInt } from 'crypto';
import { listingsService } from '@/services/listings.service';

// Define the Listing type based on your existing structure
interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice?: number;
  imageUrls: string[];
  seller: string;
  isVerified?: boolean;
  isPremium?: boolean;
  tags?: string[];
  hoursWorn?: number;
  views?: number;
  date: string;
  status?: 'active' | 'sold' | 'expired' | 'cancelled';
  auction?: {
    isAuction: boolean;
    startingPrice: number;
    endTime: string;
    highestBid?: number;
    status: string;
  };
  // For premium content locking
  isLocked?: boolean;
  // Trust signals
  trustSignals?: {
    verified?: boolean;
    responseRate?: number;
    onTime?: number;
    salesCount?: number;
    rating?: number;
  };
}

// Zod schema matching our safe Listing shape
const ListingSafeSchema = z.object({
  id: z.string().min(1),
  title: z.string().transform(sanitizeStrict),
  price: z.number().or(z.string()).transform((v) => Number(v)),
  markedUpPrice: z.number().optional(),
  seller: z.string().transform(sanitizeUsername),
  imageUrls: z.array(z.string()).default([]),
  isPremium: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  featuredRank: z.number().nullable().optional(),
  status: z.enum(['active', 'inactive', 'draft', 'banned', 'sold', 'expired', 'cancelled']).optional().default('active'),
  isLocked: z.boolean().optional(),
  date: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hoursWorn: z.number().optional(),
  views: z.number().optional(),
  isVerified: z.boolean().optional(),
  auction: z.object({
    isAuction: z.boolean(),
    startingPrice: z.number(),
    endTime: z.string(),
    highestBid: z.number().optional(),
    status: z.string(),
  }).optional(),
  trustSignals: z.object({
    verified: z.boolean().optional().default(false),
    responseRate: z.number().min(0).max(100).optional().default(0),
    onTime: z.number().min(0).max(100).optional().default(0),
    salesCount: z.number().min(0).optional().default(0),
    rating: z.number().min(0).max(5).optional().default(0),
  }).optional(),
});

/**
 * Get listings from the service with proper error handling
 */
async function getListings(limit = 200, signal?: AbortSignal): Promise<Listing[]> {
  try {
    // Use the existing listings service to get listings
    const response = await listingsService.getListings({
      limit,
      sortBy: 'date',
      sortOrder: 'desc',
    });

    if (!response.success || !response.data) {
      console.warn('[FeaturedRandom] Failed to get listings from service');
      return [];
    }

    // Validate and sanitize the listings
    const parsed = z.array(ListingSafeSchema).safeParse(response.data);
    
    if (!parsed.success) {
      console.warn('[FeaturedRandom] Listing validation failed:', parsed.error);
      // Return raw data if validation fails but ensure it's an array
      return Array.isArray(response.data) ? response.data : [];
    }

    return parsed.data as Listing[];
  } catch (error) {
    console.error('[FeaturedRandom] Error getting listings:', error);
    return [];
  }
}

/**
 * Cryptographically secure random sampling using Node's crypto module
 */
function randomSample<T>(arr: T[], k: number): T[] {
  const n = arr.length;
  if (k >= n) return [...arr];
  
  const picked = new Set<number>();
  const out: T[] = [];
  
  while (out.length < k) {
    // Use crypto.randomInt for cryptographically secure randomness
    const i = randomInt(0, n); // [0, n)
    if (!picked.has(i)) {
      picked.add(i);
      out.push(arr[i]);
    }
  }
  
  return out;
}

/**
 * Main function to get random featured listings
 */
export async function getRandomFeaturedListings(opts?: {
  limit?: number; // Number of listings to return (3-4)
  poolLimit?: number; // Max upstream fetch (default 200)
  signal?: AbortSignal;
}): Promise<Listing[]> {
  const limit = Math.max(1, Math.min(opts?.limit ?? 4, 4)); // Clamp to 4 max
  const poolLimit = Math.max(20, Math.min(opts?.poolLimit ?? 200, 400)); // Cap at 400

  try {
    // Get listings from the service
    const all = await getListings(poolLimit, opts?.signal);

    // Eligibility filter - adjust to match platform rules
    const eligible = all.filter((listing) => {
      // Check if listing is active (handle both status field and auction status)
      const isActive = listing.status === 'active' || 
                      listing.status === undefined ||
                      (listing.auction && listing.auction.status === 'active');
      
      // Must have at least one image
      const hasImage = listing.imageUrls && listing.imageUrls.length > 0;
      
      // Must have a valid price
      const hasValidPrice = Number.isFinite(listing.price) && listing.price > 0;
      
      // Must have a seller
      const hasSeller = !!listing.seller;
      
      // Don't show sold items
      const notSold = listing.status !== 'sold';
      
      // For auctions, check if they haven't ended
      const auctionNotEnded = !listing.auction || 
        (listing.auction && new Date(listing.auction.endTime) > new Date());

      return isActive && hasImage && hasValidPrice && hasSeller && notSold && auctionNotEnded;
    });

    // If we have fewer eligible listings than requested, return what we have
    if (eligible.length <= limit) {
      return eligible;
    }

    // Randomly sample from eligible listings
    return randomSample(eligible, limit);
  } catch (error) {
    console.error('[FeaturedRandom] Error in getRandomFeaturedListings:', error);
    return [];
  }
}

/**
 * Get random featured listings with caching support (optional)
 * This version includes a short-lived cache to prevent too frequent API calls
 */
let cacheData: { listings: Listing[]; timestamp: number } | null = null;
const CACHE_TTL = 10000; // 10 seconds cache to prevent rapid refreshes

export async function getRandomFeaturedListingsCached(opts?: {
  limit?: number;
  poolLimit?: number;
  signal?: AbortSignal;
  useCache?: boolean;
}): Promise<Listing[]> {
  const now = Date.now();
  
  // Check cache if enabled
  if (opts?.useCache && cacheData && (now - cacheData.timestamp) < CACHE_TTL) {
    const limit = Math.max(1, Math.min(opts?.limit ?? 4, 4));
    return randomSample(cacheData.listings, limit);
  }

  // Get fresh data
  const listings = await getRandomFeaturedListings(opts);
  
  // Update cache if we got results
  if (listings.length > 0 && opts?.useCache) {
    cacheData = {
      listings,
      timestamp: now,
    };
  }

  return listings;
}