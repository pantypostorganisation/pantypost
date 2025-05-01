'use client';

import Link from 'next/link';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { Listing } from '@/context/ListingContext';
import { useState, useEffect } from 'react';
import { Crown, Filter, Clock, ShoppingBag, Lock } from 'lucide-react';

type SellerProfile = {
  bio: string | null;
  pic: string | null;
};

// Define possible wear time options
const wearTimeOptions = ['All', 'New', 'Lightly Used', 'Well Worn'];

export default function BrowsePage() {
  const { listings, removeListing, user, isSubscribed, addSellerNotification } = useListings();
  const { purchaseListing } = useWallet();

  const [filter, setFilter] = useState<'all' | 'standard' | 'premium'>('all');
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]); // Renamed for clarity
  const [selectedWearTime, setSelectedWearTime] = useState<string>('All'); // New state for wear time filter
  const [sellerProfiles, setSellerProfiles] = useState<{ [key: string]: SellerProfile }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sellers = new Set(listings.map(listing => listing.seller));
      const profiles: { [key: string]: SellerProfile } = {};

      sellers.forEach(seller => {
        const bio = sessionStorage.getItem(`profile_bio_${seller}`);
        const pic = sessionStorage.getItem(`profile_pic_${seller}`);
        profiles[seller] = { bio, pic };
      });

      setSellerProfiles(profiles);
    }
  }, [listings]);

  const handlePurchase = (listing: Listing) => {
    if (!user || !listing.seller) return;

    const success = purchaseListing(listing, user.username);

    if (success) {
      removeListing(listing.id);
      addSellerNotification(listing.seller, `🛍️ ${user.username} purchased: "${listing.title}"`);
      alert('Purchase successful! 🎉');
    } else {
      alert('Insufficient balance. Please top up your wallet.');
    }
  };

  const filteredListings = listings
    .filter(listing => {
      // Existing premium filter
      if (listing.isPremium && (!user?.username || !isSubscribed(user.username, listing.seller))) return false;
      if (filter === 'standard' && listing.isPremium) return false;
      if (filter === 'premium' && !listing.isPremium) return false;

      // Existing tag filters (using renamed state)
      if (activeTagFilters.length > 0 && (!listing.tags || !activeTagFilters.some(tag => listing.tags?.includes(tag)))) {
        return false;
      }

      // New wear time filter
      if (selectedWearTime !== 'All') {
        if (!listing.wearTime || listing.wearTime !== selectedWearTime) {
          return false;
        }
      }

      // Existing search filter
      const matchesSearch = [listing.title, listing.description, ...(listing.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Existing price filter
      const price = listing.markedUpPrice || listing.price;
      const min = parseFloat(minPrice) || 0;
      const max = parseFloat(maxPrice) || Infinity;
      if (price < min || price > max) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priceAsc') return (a.markedUpPrice ?? a.price) - (b.markedUpPrice ?? b.price);
      if (sortBy === 'priceDesc') return (b.markedUpPrice ?? b.price) - (a.markedUpPrice ?? a.price);
      return new Date(b.date).getTime() - new Date(b.date).getTime(); // Sort by date (newest first)
    });

  const allTags = Array.from(new Set(listings.flatMap(l => l.tags || []))).sort();

  const premiumSellers = listings
    .filter(l => l.isPremium)
    .map(l => l.seller)
    .filter((seller, i, self) => self.indexOf(seller) === i && (!user?.username || !isSubscribed(user.username, seller)));

  return (
    <RequireAuth role={user?.role || 'buyer'}>
      <main className="p-10 max-w-7xl mx-auto space-y-8">
        {user?.role === 'seller' && (
          <div className="bg-blue-600 text-white p-4 rounded-lg mb-6">
            <p className="text-sm">
              You are viewing this page as a seller. You can browse listings but cannot make purchases.
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Browse Listings</h1>
          <div className="flex gap-2 flex-wrap">
            {/* Search Input */}
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="px-3 py-2 rounded border text-sm"
            />
            {/* Price Inputs */}
            <input
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="Min Price"
              className="px-3 py-2 rounded border text-sm w-24"
            />
            <input
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="Max Price"
              className="px-3 py-2 rounded border text-sm w-24"
            />
            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded border text-sm"
            >
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: Low → High</option>
              <option value="priceDesc">Price: High → Low</option>
            </select>
             {/* Wear Time Filter */}
             <select
              value={selectedWearTime}
              onChange={(e) => setSelectedWearTime(e.target.value)}
              className="px-3 py-2 rounded border text-sm"
            >
              {wearTimeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="mb-6 bg-white p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-gray-700" />
              <h2 className="text-sm font-semibold text-gray-800">Filter by Tags:</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() =>
                    setActiveTagFilters(prev =>
                      prev.includes(tag)
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    )
                  }
                  className={`px-2 py-1 text-xs rounded-full ${
                    activeTagFilters.includes(tag)
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {activeTagFilters.length > 0 && (
                <button
                  onClick={() => setActiveTagFilters([])}
                  className="px-2 py-1 text-xs rounded-full bg-red-600 text-white hover:bg-red-700"
                >
                  Clear Tag Filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Premium Seller Prompt */}
        {premiumSellers.length > 0 && (
          <div className="mb-8 bg-yellow-600 rounded-lg p-5 border border-yellow-500 shadow-sm text-white">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="text-yellow-200 w-5 h-5" />
              <h2 className="text-lg font-semibold">Unlock Premium Content</h2>
            </div>
            <p className="text-sm mb-4">
              Subscribe to these sellers to unlock their exclusive premium listings!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {premiumSellers.slice(0, 4).map(seller => {
                const profile = sellerProfiles[seller] || { bio: null, pic: null };
                return (
                  <Link
                    href={`/sellers/${seller}`}
                    key={seller}
                    className="flex items-center gap-3 bg-white p-3 rounded-lg border border-yellow-300 hover:shadow-md transition"
                  >
                    {profile.pic ? (
                      <img
                        src={profile.pic}
                        alt={seller}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-500 text-xs">
                          {seller.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-800">{seller}</h3>
                      <span className="text-xs text-yellow-600 flex items-center">
                        <Lock className="w-3 h-3 mr-1" /> Premium content
                      </span>
                    </div>
                  </Link>
                );
              })}
              {premiumSellers.length > 4 && (
                <div className="flex items-center justify-center bg-white p-3 rounded-lg border border-yellow-300">
                  <span className="text-sm text-yellow-600">+{premiumSellers.length - 4} more</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listings */}
        {filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No listings match your current filters</p>
            <p className="text-sm text-gray-500 mt-1">
              Try changing your filter settings or check back later
            </p>
            {filter === 'premium' && (
              <p className="mt-4 text-sm text-yellow-600">
                You may need to subscribe to sellers to see their premium listings
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <div
                key={listing.id}
                className="border rounded-xl overflow-hidden shadow hover:shadow-md transition flex flex-col justify-between relative bg-white"
              >
                {listing.isPremium && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center">
                      <Crown className="w-3 h-3 mr-1" /> Premium
                    </span>
                  </div>
                )}

                <div className="listing-content">
                  <Link href={`/browse/${listing.id}`}>
                    <div className="relative">
                      <img
                        src={listing.imageUrl}
                        alt={listing.title}
                        className="w-full h-48 object-cover"
                      />
                      {listing.wearTime && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded flex items-center">
                          <Clock className="w-3 h-3 mr-1" /> {listing.wearTime}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link href={`/browse/${listing.id}`}>
                      <h2 className="text-lg font-semibold text-gray-800">{listing.title}</h2>
                      <p className="text-sm text-gray-700 mt-1 line-clamp-2">{listing.description}</p>
                      {listing.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {listing.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                          {listing.tags.length > 3 && (
                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">
                              +{listing.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>

                    <div className="flex justify-between items-center mt-3">
                      <p className="font-bold text-pink-700">
                        ${listing.markedUpPrice?.toFixed(2) ?? 'N/A'}
                      </p>
                      <Link
                        href={`/sellers/${listing.seller}`}
                        className="text-xs text-gray-600 hover:text-pink-600"
                      >
                        {listing.seller}
                      </Link>
                    </div>

                    {user?.role === 'buyer' ? (
                      <button
                        onClick={() => handlePurchase(listing)}
                        className="mt-4 w-full bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 font-medium"
                      >
                        Buy Now
                      </button>
                    ) : user?.role === 'seller' ? (
                      <div className="mt-4 text-center text-sm text-gray-500">
                        Sellers cannot purchase listings
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
