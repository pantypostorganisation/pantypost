// src/app/browse/page.tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import BrowseHeader from '@/components/browse/BrowseHeader';
import BrowseFilters from '@/components/browse/BrowseFilters';
import ListingGrid from '@/components/browse/ListingGrid';
import PaginationControls from '@/components/browse/PaginationControls';
import EmptyState from '@/components/browse/EmptyState';
import { useBrowseListings } from '@/hooks/useBrowseListings';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function BrowsePage() {
  const { trackEvent, trackSearch } = useAnalytics();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  const {
    user,
    filter,
    setFilter,
    selectedHourRange,
    setSelectedHourRange,
    searchTerm,
    setSearchTerm,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    page,
    hoveredListing,
    listingErrors,
    forceUpdateTimer,
    filteredListings,
    paginatedListings,
    categoryCounts,
    totalPages,
    handleMouseEnter,
    handleMouseLeave,
    handleListingClick,
    handleQuickView,
    handleListingError,
    handlePreviousPage,
    handleNextPage,
    handlePageClick,
    resetFilters,
    isSubscribed,
    getDisplayPrice,
    formatTimeRemaining,
    HOUR_RANGE_OPTIONS,
    PAGE_SIZE,
    isLoading
  } = useBrowseListings();

  const hasActiveFilters = !!(searchTerm || minPrice || maxPrice || selectedHourRange.label !== 'Any Hours' || sortBy !== 'newest');

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Track page view
  useEffect(() => {
    if (isMountedRef.current) {
      trackEvent({
        action: 'page_view',
        category: 'navigation',
        label: 'browse_page'
      });
    }
  }, [trackEvent]);

  // Track search with debouncing
  useEffect(() => {
    if (searchTerm && isMountedRef.current) {
      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Set new timeout to track search after user stops typing
      searchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          trackSearch(searchTerm, filteredListings.length);
        }
      }, 1000); // Wait 1 second after user stops typing
    }
    
    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, filteredListings.length, trackSearch]);

  // Track filter changes with debouncing
  useEffect(() => {
    if (hasActiveFilters && isMountedRef.current) {
      // Clear existing timeout
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      
      // Set new timeout to track filters after changes settle
      filterTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          trackEvent({
            action: 'apply_filters',
            category: 'browse',
            label: filter,
            value: filteredListings.length,
            customData: {
              has_search: !!searchTerm,
              has_price_filter: !!(minPrice || maxPrice),
              price_min: minPrice || 0,
              price_max: maxPrice || 0,
              hour_range: selectedHourRange.label,
              sort_by: sortBy
            }
          });
        }
      }, 1500); // Wait 1.5 seconds after filter changes
    }
    
    // Cleanup function
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [filter, searchTerm, minPrice, maxPrice, selectedHourRange, sortBy, filteredListings.length, hasActiveFilters, trackEvent]);

  // Enhanced click handler with analytics
  const handleListingClickWithAnalytics = useCallback((listingId: string) => {
    const listing = filteredListings.find(l => l.id === listingId);
    if (listing && isMountedRef.current) {
      trackEvent({
        action: 'select_item',
        category: 'browse',
        label: listingId,
        value: listing.price,
        customData: {
          item_name: listing.title,
          item_category: listing.isPremium ? 'premium' : (listing.auction ? 'auction' : 'standard'),
          seller_name: listing.seller,
          position: paginatedListings.findIndex(l => l.id === listingId) + 1
        }
      });
    }
    // Pass false for isLocked parameter since we're allowing the click
    handleListingClick(listingId, false);
  }, [filteredListings, paginatedListings, trackEvent, handleListingClick]);

  // Track page navigation
  const handlePageChangeWithAnalytics = useCallback((newPage: number, direction: 'previous' | 'next' | 'direct') => {
    if (isMountedRef.current) {
      trackEvent({
        action: 'navigate_page',
        category: 'browse',
        label: direction,
        value: newPage,
        customData: {
          from_page: page,
          to_page: newPage
        }
      });
    }
    
    if (direction === 'previous') {
      handlePreviousPage();
    } else if (direction === 'next') {
      handleNextPage();
    } else {
      handlePageClick(newPage);
    }
  }, [page, trackEvent, handlePreviousPage, handleNextPage, handlePageClick]);

  // Track filter reset
  const resetFiltersWithAnalytics = useCallback(() => {
    if (isMountedRef.current) {
      trackEvent({
        action: 'reset_filters',
        category: 'browse',
        label: 'all_filters'
      });
    }
    resetFilters();
  }, [trackEvent, resetFilters]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
        filterTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <BanCheck>
      <RequireAuth role={user?.role || 'buyer'}>
        <main className="min-h-screen bg-black text-white pb-16 pt-8">
          <BrowseHeader
            user={user}
            filteredListingsCount={filteredListings.length}
            filter={filter}
            categoryCounts={categoryCounts}
            onFilterChange={setFilter}
          />

          <BrowseFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            minPrice={minPrice}
            onMinPriceChange={setMinPrice}
            maxPrice={maxPrice}
            onMaxPriceChange={setMaxPrice}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            selectedHourRange={selectedHourRange}
            onHourRangeChange={setSelectedHourRange}
            hourRangeOptions={HOUR_RANGE_OPTIONS}
            onClearFilters={resetFiltersWithAnalytics}
            hasActiveFilters={hasActiveFilters}
          />

          <div className="max-w-[1700px] mx-auto px-6">
            {paginatedListings.length === 0 && !isLoading ? (
              <EmptyState
                searchTerm={searchTerm}
                onResetFilters={resetFiltersWithAnalytics}
              />
            ) : (
              <>
                <ListingGrid
                  listings={paginatedListings}
                  hoveredListing={hoveredListing}
                  onListingHover={handleMouseEnter}
                  onListingLeave={handleMouseLeave}
                  onListingClick={handleListingClickWithAnalytics}
                  onQuickView={handleQuickView}
                  user={user}
                  isSubscribed={isSubscribed}
                  getDisplayPrice={getDisplayPrice}
                  forceUpdateTimer={forceUpdateTimer}
                  formatTimeRemaining={formatTimeRemaining}
                  listingErrors={listingErrors}
                  onListingError={handleListingError}
                />

                {totalPages > 1 && (
                  <PaginationControls
                    currentPage={page}
                    totalPages={totalPages}
                    filteredListingsCount={filteredListings.length}
                    pageSize={PAGE_SIZE}
                    onPreviousPage={() => handlePageChangeWithAnalytics(page - 1, 'previous')}
                    onNextPage={() => handlePageChangeWithAnalytics(page + 1, 'next')}
                    onPageClick={(newPage) => handlePageChangeWithAnalytics(newPage, 'direct')}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}