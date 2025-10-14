// src/app/sitemap.ts
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.pantypost.com/api';

// Helper to fetch listings from API (server-side)
async function getListingsForSitemap() {
  try {
    const response = await fetch(`${API_BASE}/listings?status=active&limit=1000`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      console.error('Failed to fetch listings for sitemap');
      return [];
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching listings for sitemap:', error);
    return [];
  }
}

// Helper to fetch sellers from API
async function getSellersForSitemap() {
  try {
    const response = await fetch(`${API_BASE}/users?role=seller&limit=500`, {
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch sellers for sitemap');
      return [];
    }
    
    const data = await response.json();
    return data.users || [];
  } catch (error) {
    console.error('Error fetching sellers for sitemap:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic data
  const listings = await getListingsForSitemap();
  const sellers = await getSellersForSitemap();

  // Static PUBLIC pages only
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/browse`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Dynamic listing pages with REAL IDs
  const listingPages: MetadataRoute.Sitemap = listings
    .filter((listing: any) => listing._id || listing.id)
    .map((listing: any) => {
      const id = listing._id || listing.id;
      
      return {
        url: `${BASE_URL}/browse/${id}`,
        lastModified: listing.updatedAt ? new Date(listing.updatedAt) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      };
    });

  // Dynamic seller pages with REAL usernames
  const sellerPages: MetadataRoute.Sitemap = sellers
    .filter((seller: any) => seller.username)
    .map((seller: any) => ({
      url: `${BASE_URL}/sellers/${seller.username}`,
      lastModified: seller.updatedAt ? new Date(seller.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  // Combine all pages
  return [...staticPages, ...listingPages, ...sellerPages];
}