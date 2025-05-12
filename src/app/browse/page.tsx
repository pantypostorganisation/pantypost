'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { Listing } from '@/context/ListingContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Crown, Sparkles, Trash2, Clock, ShoppingBag, Lock, Search, X, CheckCircle, BadgeCheck,
  Sliders, Tag, History, Calendar, TrendingUp, Heart, Filter, ChevronDown, ChevronUp, ChevronRight,
  DollarSign, Eye
} from 'lucide-react';

type SellerProfile = {
  bio: string | null;
  pic: string | null;
};

// Enhanced hour range options
const hourRangeOptions = [
  { label: 'Any Hours', min: 0, max: Infinity },
  { label: '12+ Hours', min: 12, max: Infinity },
  { label: '24+ Hours', min: 24, max: Infinity },
  { label: '48+ Hours', min: 48, max: Infinity },
  { label: '72+ Hours', min: 72, max: Infinity },
];

// Sort options
const sortOptions = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'priceAsc' },
  { label: 'Price: High to Low', value: 'priceDesc' },
  { label: 'Most Popular', value: 'popular' },
  { label: 'Most Viewed', value: 'viewed' },
];

// Added new popular tags for better browsing
const popularTags = [
  'thong', 'panties', 'lingerie', 'cotton', 'lace', 'satin', 'gym', 'workout',
  'yoga', 'worn', 'used', 'new', 'black', 'red', 'pink', 'custom'
];

// Price range options
const priceRangeOptions = [
  { label: 'Under $50', min: '', max: '50' },
  { label: '$50 - $100', min: '50', max: '100' },
  { label: '$100 - $200', min: '100', max: '200' },
  { label: '$200+', min: '200', max: '' },
];

const PAGE_SIZE = 40;

export default function BrowsePage() {
  const { listings, removeListing, user, users, isSubscribed, addSellerNotification } = useListings();
  const { purchaseListing } = useWallet();
  const router = useRouter();

  // State management for filters
  const [filter, setFilter] = useState<'all' | 'standard' | 'premium'>('all');
  const [selectedHourRange, setSelectedHourRange] = useState(hourRangeOptions[0]);
  const [sellerProfiles, setSellerProfiles] = useState<{ [key: string]: SellerProfile }>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Enhanced price filtering
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [activePriceOption, setActivePriceOption] = useState<string>('');
  
  // Enhanced sort options
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc' | 'popular' | 'viewed'>('newest');
  
  // Date filtering
  const [daysAgo, setDaysAgo] = useState<number | null>(null);
  
  // Tag filtering
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // UI state management
  const [page, setPage] = useState(0);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showPriceRange, setShowPriceRange] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [viewsData, setViewsData] = useState<Record<string, number>>({});
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const priceDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(event.target as Node)) {
        setShowPriceRange(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load seller profiles
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
      
      // Load search history
      const history = localStorage.getItem('search_history');
      if (history) setSearchHistory(JSON.parse(history));
      
      // Load views data
      const views = localStorage.getItem('listing_views');
      if (views) setViewsData(JSON.parse(views));
    }
  }, [listings]);

  // Reset to first page when any filter changes
  useEffect(() => {
    setPage(0);
  }, [filter, selectedHourRange, searchTerm, minPrice, maxPrice, sortBy, daysAgo, selectedTags]);

  // Save search term to history when user searches
  const saveSearchToHistory = useCallback(() => {
    if (!searchTerm.trim()) return;
    
    const updatedHistory = [
      searchTerm,
      ...searchHistory.filter(term => term !== searchTerm)
    ].slice(0, 10); // Keep only 10 most recent searches
    
    setSearchHistory(updatedHistory);
    localStorage.setItem('search_history', JSON.stringify(updatedHistory));
  }, [searchTerm, searchHistory]);

  // Handle search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim()) {
        saveSearchToHistory();
      }
    }, 1000);
    
    return () => clearTimeout(handler);
  }, [searchTerm, saveSearchToHistory]);

  // Purchase handler
  const handlePurchase = (listing: Listing, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!user || !listing.seller) return;
    if (listing.isPremium && !isSubscribed(user.username, listing.seller)) {
      alert('You must be subscribed to this seller to purchase their premium listings.');
      return;
    }
    const success = purchaseListing(listing, user.username);
    if (success) {
      removeListing(listing.id);
      addSellerNotification(listing.seller, `🛍️ ${user.username} purchased: "${listing.title}"`);
      alert('Purchase successful! 🎉');
    } else {
      alert('Insufficient balance. Please top up your wallet.');
    }
  };

  // Increment view count when navigating to a listing
  const handleListingClick = (listingId: string) => {
    // Update view count in localStorage
    const currentViews = viewsData[listingId] || 0;
    const updatedViews = { ...viewsData, [listingId]: currentViews + 1 };
    setViewsData(updatedViews);
    localStorage.setItem('listing_views', JSON.stringify(updatedViews));
    
    // Navigate to listing
    router.push(`/browse/${listingId}`);
  };

  // Apply price range
  const applyPriceRange = (range: { label: string, min: string, max: string }) => {
    setMinPrice(range.min);
    setMaxPrice(range.max);
    setActivePriceOption(range.label);
    setShowPriceRange(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setActivePriceOption('');
    setSelectedHourRange(hourRangeOptions[0]);
    setFilter('all');
    setSortBy('newest');
    setDaysAgo(null);
    setSelectedTags([]);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  // Apply search from history
  const applyHistorySearch = (term: string) => {
    setSearchTerm(term);
    setShowSearchHistory(false);
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search_history');
  };

  // Get price filter display text
  const getPriceDisplayText = () => {
    if (activePriceOption) return activePriceOption;
    if (minPrice && maxPrice) return `$${minPrice} - $${maxPrice}`;
    if (minPrice) return `$${minPrice}+`;
    if (maxPrice) return `Under $${maxPrice}`;
    return 'Price';
  };

  // Apply filters to listings
  const filteredListings = listings
    .filter((listing: Listing) => {
      // Filter by listing type (standard/premium)
      if (filter === 'standard' && listing.isPremium) return false;
      if (filter === 'premium' && !listing.isPremium) return false;
      
      // Filter by hours worn
      const hoursWorn = listing.hoursWorn ?? 0;
      if (hoursWorn < selectedHourRange.min || hoursWorn > selectedHourRange.max) {
        return false;
      }
      
      // Filter by search term (in title, description, or tags)
      const matchesSearch = !searchTerm.trim() || [
        listing.title, 
        listing.description, 
        ...(listing.tags || [])
      ].join(' ').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Filter by price range
      const price = listing.markedUpPrice || listing.price;
      const min = parseFloat(minPrice) || 0;
      const max = parseFloat(maxPrice) || Infinity;
      if (price < min || price > max) return false;
      
      // Filter by date listed
      if (daysAgo !== null) {
        const now = new Date();
        const listingDate = new Date(listing.date);
        const diffTime = Math.abs(now.getTime() - listingDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > daysAgo) return false;
      }
      
      // Filter by selected tags
      if (selectedTags.length > 0) {
        return selectedTags.every(tag => 
          listing.tags && listing.tags.some(t => 
            t.toLowerCase().includes(tag.toLowerCase())
          )
        );
      }
      
      return true;
    })
    .sort((a: Listing, b: Listing) => {
      // Apply sorting options
      switch (sortBy) {
        case 'priceAsc':
          return (a.markedUpPrice ?? a.price) - (b.markedUpPrice ?? b.price);
        case 'priceDesc':
          return (b.markedUpPrice ?? b.price) - (a.markedUpPrice ?? a.price);
        case 'popular':
          // Sort by popularity (seller subscription count + views)
          const aSeller = users[a.seller] || {};
          const bSeller = users[b.seller] || {};
          // Use 'as any' to bypass TypeScript type checking for subscriberCount
          const aPopularity = ((aSeller as any).subscriberCount || 0) + (viewsData[a.id] || 0);
          const bPopularity = ((bSeller as any).subscriberCount || 0) + (viewsData[b.id] || 0);
          return bPopularity - aPopularity;
        case 'viewed':
          // Sort by view count
          return (viewsData[b.id] || 0) - (viewsData[a.id] || 0);
        case 'newest':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  const paginatedListings = filteredListings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredListings.length / PAGE_SIZE);

  // Summary of active filters count
  const getActiveFilterCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (minPrice || maxPrice) count++;
    if (filter !== 'all') count++;
    if (selectedHourRange.label !== 'Any Hours') count++;
    if (daysAgo !== null) count++;
    if (selectedTags.length > 0) count++;
    if (sortBy !== 'newest') count++;
    return count;
  };
  
  const activeFilterCount = getActiveFilterCount();

  // Pagination navigation UI
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
        <div className="fixed top-0 left-0 w-full h-2 z-30 bg-gradient-to-r from-[#ff950e] via-pink-500 to-[#ff950e] animate-pulse opacity-70 pointer-events-none" />

        {user?.role === 'seller' && (
          <div className="bg-blue-700 text-white p-4 rounded-xl mb-6 shadow-lg max-w-3xl mx-auto mt-8">
            <p className="text-sm">
              You are viewing this page as a seller. You can browse listings but cannot make purchases.
            </p>
          </div>
        )}

        {/* Enhanced Search Header - Desktop */}
        <div className="sticky top-4 z-20 flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8 max-w-[1700px] mx-auto px-2 sm:px-6 hidden md:flex">
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#ff950e] drop-shadow-[0_2px_8px_rgba(255,149,14,0.18)] relative"
            style={{
              textShadow: '0 2px 8px #ff950e44, 0 1px 0 #ff950e, 0 0px 2px #000'
            }}
          >
            Browse Listings
            <span className="absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-20 h-1 bg-[#ff950e] blur-sm opacity-40 rounded-full pointer-events-none" />
          </h1>
          
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap gap-2 items-center bg-[#181818]/80 backdrop-blur-md p-3 rounded-2xl shadow border border-gray-800 w-full xl:w-auto">
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff950e] w-5 h-5" />
                <input
                  ref={searchInputRef}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Search listings..."
                  className="pl-10 pr-8 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ff950e] w-32 sm:w-48"
                  onFocus={() => setShowSearchHistory(true)}
                  onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              
              {/* Search History Dropdown */}
              {showSearchHistory && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#222] border border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                  <div className="flex items-center justify-between p-2 border-b border-gray-700">
                    <span className="text-xs text-gray-400">Recent Searches</span>
                    <button 
                      onClick={clearSearchHistory}
                      className="text-xs text-[#ff950e] hover:text-[#e88800]"
                    >
                      Clear All
                    </button>
                  </div>
                  <ul>
                    {searchHistory.map((term, index) => (
                      <li 
                        key={index}
                        className="flex items-center gap-2 p-2 hover:bg-[#333] cursor-pointer text-sm text-gray-300"
                        onClick={() => applyHistorySearch(term)}
                      >
                        <History size={14} className="text-gray-500" />
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Price Filter - COMPLETELY REVAMPED for GOD MODE */}
            <div className="relative" ref={priceDropdownRef}>
              <button 
                onClick={() => setShowPriceRange(!showPriceRange)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg bg-black border ${showPriceRange ? 'border-[#ff950e]' : 'border-gray-700'} text-sm text-white hover:border-[#ff950e] transition-colors`}
              >
                <DollarSign className="w-4 h-4 text-[#ff950e]" />
                <span className="whitespace-nowrap">{getPriceDisplayText()}</span>
                <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${showPriceRange ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Price Range Dropdown - Stylish clean implementation */}
              {showPriceRange && (
                <div className="absolute top-full left-0 mt-2 bg-[#222] border border-gray-700 rounded-lg shadow-xl z-50 p-3 w-64 animate-fadeIn">
                  <div className="pb-3 border-b border-gray-700 mb-3">
                    <h4 className="text-xs font-semibold mb-2 text-gray-400">Custom Range</h4>
                    <div className="flex items-center gap-2">
                      <div className="relative w-full">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          value={minPrice}
                          onChange={e => {
                            setMinPrice(e.target.value);
                            setActivePriceOption('');
                          }}
                          placeholder="Min"
                          className="pl-6 pr-2 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-500 w-full focus:outline-none focus:border-[#ff950e]"
                          type="number"
                          min="0"
                        />
                      </div>
                      <span className="text-gray-500">-</span>
                      <div className="relative w-full">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          value={maxPrice}
                          onChange={e => {
                            setMaxPrice(e.target.value);
                            setActivePriceOption('');
                          }}
                          placeholder="Max"
                          className="pl-6 pr-2 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-500 w-full focus:outline-none focus:border-[#ff950e]"
                          type="number"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="text-xs font-semibold mb-2 text-gray-400">Quick Ranges</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {priceRangeOptions.map(range => (
                      <button 
                        key={range.label}
                        onClick={() => applyPriceRange(range)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activePriceOption === range.label
                            ? 'bg-[#ff950e] text-black'
                            : 'bg-[#333] text-gray-300 hover:bg-[#444]'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-700 flex justify-end">
                    <button
                      onClick={() => {
                        setMinPrice('');
                        setMaxPrice(''); 
                        setActivePriceOption('');
                        setShowPriceRange(false);
                      }}
                      className="text-xs text-[#ff950e] hover:text-[#e88800] mr-3"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setShowPriceRange(false)}
                      className="text-xs text-white bg-[#ff950e] hover:bg-[#e88800] px-3 py-1 rounded-lg font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                paddingRight: '2rem'
              }}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            {/* Hours Worn */}
            <select
              value={selectedHourRange.label}
              onChange={(e) => {
                const selectedOption = hourRangeOptions.find(opt => opt.label === e.target.value);
                if (selectedOption) setSelectedHourRange(selectedOption);
              }}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                paddingRight: '2rem'
              }}
            >
              {hourRangeOptions.map(option => (
                <option key={option.label} value={option.label}>{option.label}</option>
              ))}
            </select>
            
            {/* Listing Type Filter */}
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                paddingRight: '2rem'
              }}
            >
              <option value="all">All Types</option>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
            
            {/* Date Filter */}
            <select
              value={daysAgo === null ? '' : daysAgo.toString()}
              onChange={e => setDaysAgo(e.target.value ? parseInt(e.target.value) : null)}
              className="px-3 py-2 rounded-lg bg-black border border-gray-700 text-sm text-white appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                paddingRight: '2rem'
              }}
            >
              <option value="">Any Time</option>
              <option value="1">Last 24 Hours</option>
              <option value="3">Last 3 Days</option>
              <option value="7">Last Week</option>
              <option value="30">Last Month</option>
            </select>
            
            {/* Tag Selector Button - Keep this orange as requested */}
            <div className="relative">
              <button 
                onClick={() => setShowTagSelector(!showTagSelector)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#ff950e] text-black text-sm font-medium hover:bg-[#e0850d] transition-colors"
              >
                <Tag className="w-4 h-4" />
                Tags
                {selectedTags.length > 0 && (
                  <span className="flex items-center justify-center w-4 h-4 ml-1 bg-black text-white text-xs rounded-full">
                    {selectedTags.length}
                  </span>
                )}
                <ChevronDown size={16} className={`ml-1 transition-transform duration-200 ${showTagSelector ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Tag Selector Dropdown */}
              {showTagSelector && (
                <div className="absolute top-full right-0 mt-2 bg-[#222] border border-gray-700 rounded-lg shadow-xl z-50 p-3 w-64 animate-fadeIn">
                  <h4 className="text-sm font-semibold mb-2 text-gray-300">Filter by Tags</h4>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {popularTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-1 rounded-full text-xs ${
                          selectedTags.includes(tag)
                            ? 'bg-[#ff950e] text-black'
                            : 'bg-[#333] text-gray-300 hover:bg-[#444]'
                        } transition-colors`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Clear Filters Button - Only show when filters are active */}
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-900 hover:bg-red-800 text-white text-sm transition-colors"
              >
                <X size={14} />
                Clear ({activeFilterCount})
              </button>
            )}
          </div>
        </div>
        
        {/* Mobile Search Header */}
        <div className="md:hidden sticky top-0 z-30 bg-black bg-opacity-90 backdrop-blur-sm pb-2 pt-4 px-4">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-bold text-[#ff950e]">Browse Listings</h1>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setMobileFiltersVisible(!mobileFiltersVisible)}
                className={`p-2 rounded-lg ${mobileFiltersVisible ? 'bg-[#ff950e] text-black' : 'bg-[#181818] text-white'} transition-colors`}
              >
                <Filter size={20} />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff950e] w-5 h-5" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search listings..."
              className="w-full py-2 pl-10 pr-8 rounded-lg bg-[#181818] border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Mobile Filters Panel */}
          {mobileFiltersVisible && (
            <div className="bg-[#181818] rounded-xl mt-2 p-3 border border-gray-800 shadow-lg animate-slideDown">
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Price Range</label>
                  <div className="flex items-center gap-1">
                    <div className="relative w-full">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                      <input
                        value={minPrice}
                        onChange={e => {
                          setMinPrice(e.target.value);
                          setActivePriceOption('');
                        }}
                        placeholder="Min"
                        className="pl-5 pr-2 py-1 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-500 w-full"
                        type="number"
                        min="0"
                      />
                    </div>
                    <span className="text-gray-500">-</span>
                    <div className="relative w-full">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                      <input
                        value={maxPrice}
                        onChange={e => {
                          setMaxPrice(e.target.value);
                          setActivePriceOption('');
                        }}
                        placeholder="Max"
                        className="pl-5 pr-2 py-1 rounded-lg bg-black border border-gray-700 text-sm text-white placeholder-gray-500 w-full"
                        type="number"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-2 py-1 rounded-lg bg-black border border-gray-700 text-sm text-white"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Hours Worn</label>
                  <select
                    value={selectedHourRange.label}
                    onChange={(e) => {
                      const selectedOption = hourRangeOptions.find(opt => opt.label === e.target.value);
                      if (selectedOption) setSelectedHourRange(selectedOption);
                    }}
                    className="w-full px-2 py-1 rounded-lg bg-black border border-gray-700 text-sm text-white"
                  >
                    {hourRangeOptions.map(option => (
                      <option key={option.label} value={option.label}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Type</label>
                  <select
                    value={filter}
                    onChange={e => setFilter(e.target.value as any)}
                    className="w-full px-2 py-1 rounded-lg bg-black border border-gray-700 text-sm text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Date Listed</label>
                  <select
                    value={daysAgo === null ? '' : daysAgo.toString()}
                    onChange={e => setDaysAgo(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-2 py-1 rounded-lg bg-black border border-gray-700 text-sm text-white"
                  >
                    <option value="">Any Time</option>
                    <option value="1">Last 24 Hours</option>
                    <option value="3">Last 3 Days</option>
                    <option value="7">Last Week</option>
                    <option value="30">Last Month</option>
                  </select>
                </div>
              </div>
              
              {/* Quick Price Ranges - Mobile */}
              <div className="mb-3">
                <label className="text-xs text-gray-400 block mb-1">Quick Price Ranges</label>
                <div className="flex flex-wrap gap-1">
                  {priceRangeOptions.map(range => (
                    <button 
                      key={range.label}
                      onClick={() => applyPriceRange(range)}
                      className={`px-2 py-1 rounded-lg text-xs ${
                        activePriceOption === range.label
                          ? 'bg-[#ff950e] text-black'
                          : 'bg-[#333] text-gray-300'
                      } transition-colors`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tag Filters - Mobile */}
              <div className="mb-2">
                <label className="text-xs text-gray-400 block mb-1">Popular Tags</label>
                <div className="flex flex-wrap gap-1">
                  {popularTags.slice(0, 10).map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        selectedTags.includes(tag)
                          ? 'bg-[#ff950e] text-black'
                          : 'bg-[#333] text-gray-300'
                      } transition-colors`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Active Filters Summary & Clear Button */}
              <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-gray-700">
                <div>
                  {activeFilterCount === 0 
                    ? 'No filters applied' 
                    : `${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}`}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-[#ff950e]"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Selected Tags Display - When tags are selected */}
        {selectedTags.length > 0 && (
          <div className="max-w-[1700px] mx-auto px-6 mt-4 mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-400">Active Tags:</span>
              {selectedTags.map(tag => (
                <span 
                  key={tag}
                  className="bg-[#ff950e] text-black text-xs px-3 py-1 rounded-full flex items-center gap-1"
                >
                  {tag}
                  <button 
                    onClick={() => toggleTag(tag)}
                    className="ml-1 hover:bg-black hover:text-white rounded-full w-4 h-4 flex items-center justify-center transition-colors"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Results Count */}
        <div className="max-w-[1700px] mx-auto px-6 mt-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {filteredListings.length === 0 ? (
                'No listings found'
              ) : (
                <>
                  Found <span className="text-white font-semibold">{filteredListings.length}</span> listings
                  {searchTerm ? ` matching "${searchTerm}"` : ''}
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="max-w-[1700px] mx-auto px-6">
          {paginatedListings.length === 0 ? (
            <div className="text-center py-20 bg-[#181818] rounded-2xl border border-dashed border-gray-700 shadow-lg mt-10">
              <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-white font-bold text-xl">No listings match your current filters</p>
              <p className="text-md text-gray-400 mt-2">
                Try changing your filter settings or check back later
              </p>
              {filter === 'premium' && (
                <p className="mt-6 text-md text-yellow-400">
                  Premium listings require subscribing to the seller to view fully.
                </p>
              )}
              <button
                onClick={handleClearFilters}
                className="mt-6 px-6 py-2 bg-[#ff950e] text-black rounded-full font-bold transition-colors hover:bg-[#e0850d]"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-10">
                {paginatedListings.map((listing) => {
                  const isLockedPremium = listing.isPremium && (!user?.username || !isSubscribed(user?.username, listing.seller));
                  // Check seller's current verification status from users context
                  const sellerUser = users?.[listing.seller];
                  const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';

                  // Card is a div with onClick, not a Link
                  return (
                    <div
                      key={listing.id}
                      className={`relative flex flex-col bg-gradient-to-br from-[#181818] via-black to-[#181818] border border-gray-800 rounded-3xl shadow-2xl hover:shadow-[0_8px_32px_0_rgba(255,149,14,0.25)] transition-all duration-300 overflow-hidden hover:border-[#ff950e] min-h-[480px] cursor-pointer`}
                      style={{
                        boxShadow: '0 4px 32px 0 #000a, 0 2px 8px 0 #ff950e22',
                      }}
                      tabIndex={0}
                      onClick={() => {
                        if (!isLockedPremium) handleListingClick(listing.id);
                      }}
                    >
                      {listing.isPremium && (
                        <div className="absolute top-4 right-4 z-10">
                          <span className="bg-[#ff950e] text-black text-xs px-3 py-1.5 rounded-full font-bold flex items-center shadow animate-pulse">
                            <Crown className="w-4 h-4 mr-1" /> Premium
                          </span>
                        </div>
                      )}

                      {/* View count badge */}
                      {viewsData[listing.id] && viewsData[listing.id] > 0 && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full flex items-center">
                            <Eye className="w-3 h-3 mr-1 text-gray-400" /> {viewsData[listing.id]}
                          </span>
                        </div>
                      )}

                      {/* Embedded image with 10px padding and matching rounded-3xl, taller image */}
                      <div className="relative p-[10px] pb-0">
                        <div className="relative w-full h-[290px] rounded-3xl overflow-hidden">
                          {listing.imageUrls && listing.imageUrls.length > 0 && (
                            <img
                              src={listing.imageUrls[0]}
                              alt={listing.title}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${isLockedPremium ? 'blur-[4.5px]' : ''} rounded-3xl`}
                            />
                          )}
                          {/* Soft black gradient overlay at the bottom */}
                          <div
                            className="pointer-events-none absolute left-0 bottom-0 w-full h-20 rounded-b-3xl"
                            style={{
                              background: 'linear-gradient(0deg, rgba(0,0,0,0.60) 0%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.00) 100%)'
                            }}
                          />
                          {isLockedPremium && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-4 rounded-3xl z-10">
                              <Lock className="w-10 h-10 text-[#ff950e] mb-3" />
                              <p className="text-sm font-semibold text-white">
                                Subscribe to <Link href={`/sellers/${listing.seller}`} className="underline hover:text-[#ff950e]" onClick={e => e.stopPropagation()}>{listing.seller}</Link> to view
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        <h2 className={`text-2xl font-bold text-white mb-1 group-hover:text-[#ff950e]`}>{listing.title}</h2>
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
                        <div className="flex justify-between items-center mt-auto">
                          <p className="font-bold text-[#ff950e] text-2xl">
                            ${listing.markedUpPrice?.toFixed(2) ?? 'N/A'}
                          </p>
                          <Link
                            href={`/sellers/${listing.seller}`}
                            className="flex items-center gap-2 text-xs text-gray-400 hover:text-[#ff950e] font-semibold group/seller" // Added group/seller here
                            title={sellerProfiles[listing.seller]?.bio || listing.seller}
                            onClick={e => e.stopPropagation()}
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
                            {/* Verified Badge - Check seller's current status */}
                            {isSellerVerified && (
                              <div className="relative"> {/* Removed group here */}
                                <img
                                  src="/verification_badge.png"
                                  alt="Verified"
                                  className="w-4 h-4" // Adjusted size
                                />
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover/seller:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20"> {/* Used group-hover/seller */}
                                  Verified Seller
                                </div>
                              </div>
                            )}
                          </Link>
                        </div>
                        {user?.role === 'buyer' ? (
                          isLockedPremium ? (
                            <Link
                              href={`/sellers/${listing.seller}`}
                              className="mt-6 w-full bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-500 font-bold transition text-lg shadow flex items-center justify-center gap-2"
                              onClick={e => e.stopPropagation()}
                            >
                              <Lock className="w-5 h-5 mr-1" /> Subscribe to Buy
                            </Link>
                          ) : (
                            <button
                              onClick={e => handlePurchase(listing, e)}
                              className="mt-6 w-full bg-[#ff950e] text-black px-4 py-3 rounded-lg hover:bg-[#e0850d] font-bold transition text-lg shadow focus:scale-105 active:scale-95"
                              style={{
                                boxShadow: '0 2px 12px 0 #ff950e44',
                                transition: 'all 0.15s cubic-bezier(.4,2,.6,1)'
                              }}
                            >
                              Buy Now
                            </button>
                          )
                        ) : user?.role === 'seller' ? (
                          <div className="mt-6 text-center text-sm text-gray-500">
                            Sellers cannot purchase listings
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
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

        {/* Mobile Fixed Bottom Navigation */}
        <div className="fixed bottom-0 left-0 w-full z-40 md:hidden bg-black border-t border-gray-800 px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-400">
              {filteredListings.length} listings found
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 rounded-lg bg-red-900 text-white text-xs flex items-center"
                >
                  <X size={12} className="mr-1" /> Clear ({activeFilterCount})
                </button>
              )}
              <button
                onClick={() => setMobileFiltersVisible(!mobileFiltersVisible)}
                className={`px-3 py-1.5 rounded-lg flex items-center text-xs ${
                  mobileFiltersVisible ? 'bg-[#ff950e] text-black' : 'bg-[#232323] text-white'
                }`}
              >
                <Filter size={12} className="mr-1" /> Filters
              </button>
            </div>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}
