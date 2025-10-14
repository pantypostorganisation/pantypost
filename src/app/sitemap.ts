// src/app/sitemap.ts
import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pantypost.com';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

// Helper to get API base with /api suffix
function getApiBase(): string {
  const trimmed = API_BASE.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

// Helper to fetch listings from API (server-side)
async function getListingsForSitemap() {
  try {
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/listings?status=active&limit=1000`, {
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
    const apiBase = getApiBase();
    const response = await fetch(`${apiBase}/users?role=seller&limit=500`, {
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

  // Static pages with priorities
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
  ];

  // Dynamic listing pages
  const listingPages: MetadataRoute.Sitemap = listings
    .filter((listing: any) => listing._id || listing.id)
    .map((listing: any) => {
      const id = listing._id || listing.id;
      
      return {
        url: `${BASE_URL}/browse/${id}`,
        lastModified: listing.updatedAt ? new Date(listing.updatedAt) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      };
    });

  // Dynamic seller pages
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