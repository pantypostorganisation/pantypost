'use client';

import Link from 'next/link';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { Listing } from '@/context/ListingContext';
import { useState, useEffect } from 'react';
import {
  Crown, Filter, Clock, ShoppingBag, Lock, Search, X
} from 'lucide-react';

type SellerProfile = {
  bio: string | null;
  pic: string | null;
};

const hourRangeOptions = [
  { label: 'Any Hours', min: 0, max: Infinity },
  { label: '12+ Hours', min: 12, max: Infinity },
  { label: '24+ Hours', min: 24, max: Infinity },
  { label: '48+ Hours', min: 48, max: Infinity },
];

const PAGE_SIZE = 40;

export default function BrowsePage() {
  const { listings, removeListing, user, isSubscribed, addSellerNotification } = useListings();
  const { purchaseListing } = useWallet();

  const [filter, setFilter] = useState<'all' | 'standard' | 'premium'>('all');
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [selectedHourRange, setSelectedHourRange] = useState(hourRangeOptions[0]);
  const [sellerProfiles, setSellerProfiles] = useState<{ [key: string]: SellerProfile }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);

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

  // Reset to first page when filters/search change
  useEffect(() => {
    setPage(0);
  }, [filter, activeTagFilters, selectedHourRange, searchTerm, minPrice, maxPrice, sortBy]);

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
    .filter((listing: Listing) => {
      if (listing.isPremium && (!user?.username || !isSubscribed(user.username, listing.seller))) return false;
      if (filter === 'standard' && listing.isPremium) return false;
      if (filter === 'premium' && !listing.isPremium) return false;
      if (activeTagFilters.length > 0 && (!listing.tags || !activeTagFilters.some(tag => listing.tags?.includes(tag)))) {
        return false;
      }
      const hoursWorn = listing.hoursWorn ?? 0;
      if (hoursWorn < selectedHourRange.min || hoursWorn > selectedHourRange.max) {
        return false;
      }
      const matchesSearch = [listing.title, listing.description, ...(listing.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      const price = listing.markedUpPrice || listing.price;
      const min = parseFloat(minPrice) || 0;
      const max = parseFloat(maxPrice) || Infinity;
      if (price < min || price > max) return false;
      return true;
    })
    .sort((a: Listing, b: Listing) => {
      if (sortBy === 'priceAsc') return (a.markedUpPrice ?? a.price) - (b.markedUpPrice ?? b.price);
      if (sortBy === 'priceDesc') return (b.markedUpPrice ?? b.price) - (a.markedUpPrice ?? a.price);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const paginatedListings = filteredListings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE);

  const allTags = Array.from(new Set(listings.flatMap((l: Listing) => l.tags || []))).sort();

  const premiumSellers = listings
    .filter((l: Listing) => l.isPremium)
    .map((l: Listing) => l.seller)
    .filter((seller, i, self) => self.indexOf(seller) === i && (!user?.username || !isSubscribed(user.username, seller)));

  // Helper for pagination display
  function renderPageIndicators() {
    if (totalPages <= 1) return null;
    const indicators = [];
    if (page > 1) {
      indicators.push(
        <span key={0} className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" onClick={() => setPage(0)}>
          1
        </span>
      );
      if (page > 2) {
        indicators.push(
          <span key="start-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
        );
      }
    }
    if (page > 0) {
      indicators.push(
        <span key={page - 1} className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" onClick={() => setPage(page - 1)}>
          {page}
        </span>
      );
    }
    indicators.push(
      <span key={page} className="px-2 py-1 text-sm font-bold text-[#ff950e] border-b-2 border-[#ff950e]">
        {page + 1}
      </span>
    );
    if (page < totalPages - 1) {
      indicators.push(
        <span key={page + 1} className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" onClick={() => setPage(page + 1)}>
          {page + 2}
        </span>
      );
    }
    if (page < totalPages - 2) {
      indicators.push(
        <span key={page + 2} className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" onClick={() => setPage(page + 2)}>
          {page + 3}
        </span>
      );
    }
    if (page < totalPages - 3) {
      indicators.push(
        <span key="end-ellipsis" className="px-2 py-1 text-sm text-gray-500">...</span>
      );
      indicators.push(
        <span key={totalPages - 1} className="px-2 py-1 text-sm text-gray-400 cursor-pointer hover:text-[#ff950e]" onClick={() => setPage(totalPages - 1)}>
          {totalPages}
        </span>
      );
    }
    return (
      <div className="flex justify-center items-center gap-1 mt-4">
        {indicators}
      </div>
    );
  }

  return (
    <RequireAuth role={user?.role || 'buyer'}>
      <main className="relative min-h-screen bg-black text-white pb-16">
        {/* Animated Glow/Gradient Bar */}
        <div className="fixed top-0 left-0 w-full h-2 z-30 bg-gradient-to-r from-[#ff950e] via-pink-500 to-[#ff950e] animate-pulse opacity-70 pointer-events-none" />

        {/* Seller warning */}
        {user?.role === 'seller' && (
          <div className="bg-blue-700 text-white p-4 rounded-xl mb-6 shadow-lg max-w-3xl mx-auto mt-8">
            <p className="text-sm">
              You are viewing this page as a seller. You can browse listings but cannot make purchases.
            </p>
          </div>
        )}

        {/* Sticky/Glassy Filter Bar */}
        <div className="sticky top-4 z-20 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8 max-w-[1700px] mx-auto px-2 sm:px-6">
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ff950e] drop-shadow-[0_2px_8px_rgba(255,149,14,0.18)] relative"
            style={{
              textShadow: '0 2px 8px #ff950e44, 0 1px 0 #ff950e, 0 0px 2px #000'
            }}
          >
            Browse Listings
            <span className="absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-20 h-1 bg-[#ff950e] blur-sm opacity-40 rounded-full pointer-events-none" />
          </h1>
          <div className="flex flex-wrap gap-2 items-center bg-[#181818]/80 backdrop-blur-md p-3 rounded-2xl shadow border border-gray-800 w-full xl:w-auto">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff950e] w-5 h-5" />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search listings..."
                className="pl-10 pr-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ff950e] w-32 sm:w-48"
              />
            </div>
            <input
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              placeholder="Min $"
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-400 w-20"
            />
            <input
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              placeholder="Max $"
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-400 w-20"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
            >
              <option value="newest">Newest</option>
              <option value="priceAsc">Price: Low → High</option>
              <option value="priceDesc">Price: High → Low</option>
            </select>
            <select
              value={selectedHourRange.label}
              onChange={(e) => {
                const selectedOption = hourRangeOptions.find(opt => opt.label === e.target.value);
                if (selectedOption) setSelectedHourRange(selectedOption);
              }}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
            >
              {hourRangeOptions.map(option => (
                <option key={option.label} value={option.label}>{option.label}</option>
              ))}
            </select>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white"
            >
              <option value="all">All</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
            <button
              className="ml-2 xl:hidden flex items-center gap-1 px-3 py-2 rounded-lg bg-[#ff950e] text-black font-bold hover:bg-[#e0850d] transition"
              onClick={() => setShowFilters(f => !f)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Tag filters */}
        {(allTags.length > 0 && (showFilters || typeof window === 'undefined' || window.innerWidth >= 1280)) && (
          <div className="mb-8 max-w-[1700px] mx-auto bg-[#181818]/80 backdrop-blur-md p-4 rounded-2xl shadow border border-gray-800">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-[#ff950e]" />
              <h2 className="text-sm font-semibold text-white">Filter by Tags:</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag: string) => (
                <button
                  key={tag}
                  onClick={() =>
                    setActiveTagFilters((prev: string[]) =>
                      prev.includes(tag)
                        ? prev.filter((t: string) => t !== tag)
                        : [...prev, tag]
                    )
                  }
                  className={`px-3 py-1 text-xs rounded-full border transition ${
                    activeTagFilters.includes(tag)
                      ? 'bg-[#ff950e] text-black border-[#ff950e] shadow'
                      : 'bg-black text-white border-gray-700 hover:bg-[#222]'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {activeTagFilters.length > 0 && (
                <button
                  onClick={() => setActiveTagFilters([])}
                  className="px-3 py-1 text-xs rounded-full bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Premium Seller Prompt */}
        {premiumSellers.length > 0 && (
          <div className="mb-10 max-w-[1700px] mx-auto bg-gradient-to-r from-yellow-700 to-yellow-500 rounded-2xl p-6 border border-yellow-400 shadow-lg text-white">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="text-yellow-200 w-5 h-5" />
              <h2 className="text-lg font-semibold">Unlock Premium Content</h2>
            </div>
            <p className="text-sm mb-4">
              Subscribe to these sellers to unlock their exclusive premium listings!
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {premiumSellers.slice(0, 6).map(seller => {
                const profile = sellerProfiles[seller] || { bio: null, pic: null };
                return (
                  <Link
                    href={`/sellers/${seller}`}
                    key={seller}
                    className="flex items-center gap-3 bg-black p-3 rounded-lg border border-yellow-300 hover:shadow-md transition"
                  >
                    {profile.pic ? (
                      <img
                        src={profile.pic}
                        alt={seller}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center">
                        <span className="text-yellow-400 text-xs font-bold">
                          {seller.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{seller}</h3>
                      <span className="text-xs text-yellow-300 flex items-center">
                        <Lock className="w-3 h-3 mr-1" /> Premium content
                      </span>
                    </div>
                  </Link>
                );
              })}
              {premiumSellers.length > 6 && (
                <div className="flex items-center justify-center bg-black p-3 rounded-lg border border-yellow-300">
                  <span className="text-sm text-yellow-300">+{premiumSellers.length - 6} more</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Listings */}
        <div className="max-w-[1700px] mx-auto">
          {paginatedListings.length === 0 ? (
            <div className="text-center py-20 bg-[#181818] rounded-2xl border border-dashed border-gray-700 shadow-lg mt-10">
              <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-white font-bold text-xl">No listings match your current filters</p>
              <p className="text-md text-gray-400 mt-2">
                Try changing your filter settings or check back later
              </p>
              {filter === 'premium' && (
                <p className="mt-6 text-md text-yellow-400">
                  You may need to subscribe to sellers to see their premium listings
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10">
                {paginatedListings.map((listing) => (
                  <div
                    key={listing.id}
                    className={`relative flex flex-col bg-gradient-to-br from-[#181818] via-black to-[#181818] border border-gray-800 rounded-3xl shadow-2xl hover:shadow-[0_8px_32px_0_rgba(255,149,14,0.25)] transition-all duration-300 overflow-hidden group hover:border-[#ff950e] min-h-[480px]`}
                    style={{
                      boxShadow: '0 4px 32px 0 #000a, 0 2px 8px 0 #ff950e22',
                    }}
                  >
                    {listing.isPremium && (
                      <div className="absolute top-4 right-4 z-10">
                        <span className="bg-[#ff950e] text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow animate-pulse">
                          <Crown className="w-4 h-4 mr-1" /> Premium
                        </span>
                      </div>
                    )}
                    <Link href={`/browse/${listing.id}`}>
                      <div className="relative">
                        {/* Display the first image from the array */}
                        {listing.imageUrls && listing.imageUrls.length > 0 && (
                           <img
                            src={listing.imageUrls[0]}
                            alt={listing.title}
                            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                            style={{ borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}
                          />
                        )}
                      </div>
                    </Link>
                    <div className="p-6 flex flex-col flex-grow">
                      <Link href={`/browse/${listing.id}`}>
                        <h2 className="text-2xl font-bold text-white mb-1">{listing.title}</h2>
                        <p className="text-base text-gray-300 mb-2 line-clamp-2">{listing.description}</p>
                        {listing.tags && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {listing.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="bg-[#232323] text-[#ff950e] text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                                {tag}
                              </span>
                            ))}
                            {listing.tags.length > 3 && (
                              <span className="bg-[#232323] text-[#ff950e] text-xs px-3 py-1 rounded-full font-semibold shadow-sm">
                                +{listing.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                      <div className="flex justify-between items-center mt-auto">
                        <p className="font-bold text-[#ff950e] text-2xl">
                          ${listing.markedUpPrice?.toFixed(2) ?? 'N/A'}
                        </p>
                        <Link
                          href={`/sellers/${listing.seller}`}
                          className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#ff950e] font-semibold group/seller"
                          title={sellerProfiles[listing.seller]?.bio || listing.seller}
                        >
                          {sellerProfiles[listing.seller]?.pic ? (
                            <span className="relative group-hover/seller:ring-2 group-hover/seller:ring-[#ff950e] rounded-full transition">
                              <img
                                src={sellerProfiles[listing.seller]?.pic!}
                                alt={listing.seller}
                                className="w-8 h-8 rounded-full object-cover border-2 border-[#ff950e]"
                              />
                            </span>
                          ) : (
                            <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-[#ff950e] font-bold border-2 border-[#ff950e]">
                              {listing.seller.charAt(0).toUpperCase()}
                            </span>
                          )}
                          {listing.seller}
                        </Link>
                      </div>
                      {user?.role === 'buyer' ? (
                        <button
                          onClick={() => handlePurchase(listing)}
                          className="mt-6 w-full bg-[#ff950e] text-black px-4 py-3 rounded-lg hover:bg-[#e0850d] font-bold transition text-lg shadow focus:scale-105 active:scale-95"
                          style={{
                            boxShadow: '0 2px 12px 0 #ff950e44',
                            transition: 'all 0.15s cubic-bezier(.4,2,.6,1)'
                          }}
                        >
                          Buy Now
                        </button>
                      ) : user?.role === 'seller' ? (
                        <div className="mt-6 text-center text-sm text-gray-500">
                          Sellers cannot purchase listings
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              {/* Pagination */}
              {(filteredListings.length > PAGE_SIZE || page > 0) && (
                <div className="flex flex-col items-center mt-12 gap-2">
                  <div className="flex gap-4">
                    {page > 0 && (
                      <button
                        className="px-8 py-3 rounded-full bg-[#232323] text-white font-bold text-lg shadow-lg hover:bg-[#181818] transition"
                        onClick={() => setPage(page - 1)}
                      >
                        Previous Page
                      </button>
                    )}
                    {filteredListings.length > PAGE_SIZE * (page + 1) && (
                      <button
                        className="px-8 py-3 rounded-full bg-[#ff950e] text-black font-bold text-lg shadow-lg hover:bg-[#e0850d] transition"
                        onClick={() => setPage(page + 1)}
                      >
                        Next Page
                      </button>
                    )}
                  </div>
                  {renderPageIndicators()}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}
