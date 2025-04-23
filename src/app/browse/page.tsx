'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useListings } from '@/context/ListingContext';
import ListingCard from '@/components/ListingCard';
import SearchAndFilter, { FilterOptions } from '@/components/SearchAndFilter';
import { ExternalLink, Info, AlertCircle } from 'lucide-react';

export default function Browse() {
  const { listings, user } = useListings();
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    priceRange: [0, 200],
    categories: [],
    sortBy: 'newest',
    sellerRating: null,
    verifiedOnly: false,
  });
  
  // Extract all available categories from listings
  const availableCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    listings.forEach(listing => {
      if (listing.category) {
        categoriesSet.add(listing.category);
      }
    });
    return Array.from(categoriesSet);
  }, [listings]);
  
  // Find maximum price in listings to set filter max
  const maxListingPrice = useMemo(() => {
    let max = 200; // Default maximum
    listings.forEach(listing => {
      if (listing.price > max) {
        max = listing.price;
      }
    });
    return max;
  }, [listings]);
  
  // Filter and sort listings based on current filters
  const filteredListings = useMemo(() => {
    return listings
      .filter(listing => {
        // Filter by search term
        if (filters.search && !listing.title.toLowerCase().includes(filters.search.toLowerCase()) &&
            !listing.description.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        
        // Filter by price range
        if (listing.price < filters.priceRange[0] || listing.price > filters.priceRange[1]) {
          return false;
        }
        
        // Filter by categories
        if (filters.categories.length > 0 && 
            (!listing.category || !filters.categories.includes(listing.category))) {
          return false;
        }
        
        // Filter by seller rating (if implemented)
        if (filters.sellerRating !== null) {
          // This is a placeholder - you'll need to implement seller ratings
          const sellerRating = listing.sellerRating || 0;
          if (sellerRating < filters.sellerRating) {
            return false;
          }
        }
        
        // Filter by verified sellers only (if implemented)
        if (filters.verifiedOnly && !listing.isVerifiedSeller) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by selected option
        switch (filters.sortBy) {
          case 'price-low-high':
            return a.price - b.price;
          case 'price-high-low':
            return b.price - a.price;
          case 'popular':
            // This is a placeholder - you'll need to implement popularity metrics
            return (b.viewCount || 0) - (a.viewCount || 0);
          case 'newest':
          default:
            // Assuming listings have a createdAt timestamp
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
        }
      });
  }, [listings, filters]);
  
  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Browse Listings</h1>
        <p className="text-gray-400 mb-6">
          Find the perfect item from our verified sellers
        </p>
        
        <SearchAndFilter 
          onFilterChange={handleFilterChange}
          availableCategories={availableCategories}
          maxPrice={maxListingPrice}
        />
      </div>
      
      {!user && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="text-blue-400 w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-white">Sign in to see premium content</h3>
            <p className="text-gray-400 text-sm">
              Some listings are only visible to registered users. 
              <Link href="/login" className="text-pink-400 hover:text-pink-300 ml-1">
                Sign in now
              </Link>
            </p>
          </div>
        </div>
      )}
      
      {filteredListings.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 max-w-md mx-auto">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-500 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No listings found</h3>
            <p className="text-gray-400 mb-4">
              We couldn't find any listings matching your current filters.
            </p>
            <button
              onClick={() => setFilters({
                search: '',
                priceRange: [0, maxListingPrice],
                categories: [],
                sortBy: 'newest',
                sellerRating: null,
                verifiedOnly: false,
              })}
              className="text-pink-400 hover:text-pink-300 font-medium"
            >
              Clear all filters
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
      
      {filteredListings.length > 0 && (
        <div className="mt-8 text-center text-gray-500 text-sm">
          Showing {filteredListings.length} of {listings.length} total listings
        </div>
      )}
    </div>
  );
}