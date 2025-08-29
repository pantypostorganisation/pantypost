// src/app/browse/page.tsx
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import BrowseHeader from '@/components/browse/BrowseHeader';
import BrowseFilters from '@/components/browse/BrowseFilters';
import ListingGrid from '@/components/browse/ListingGrid';
import PaginationControls from '@/components/browse/PaginationControls';
import EmptyState from '@/components/browse/EmptyState';
import PopularTags from '@/components/browse/PopularTags';
import { useBrowseListings } from '@/hooks/useBrowseListings';
import { useAnalytics } from '@/hooks/useAnalytics';
import { listingsService } from '@/services/listings.service';

interface PopularTag {
  tag: string;
  count: number;
}

export default function BrowsePage() {
  const { trackEvent, trackSearch } = useAnalytics();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const previousFiltersRef = useRef<string>('');
  
  // Popular tags state
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  
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
      // Clean up any pending timeouts
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

  // Fetch popular tags
  useEffect(() => {
    const fetchPopularTags = async () => {
      if (!isMountedRef.current) return;
      
      setTagsLoading(true);
      setTagsError(null);
      try {
        const response = await listingsService.getPopularTags(15);
        } else if (isMountedRef.current && !response.success) {
          setTagsError('Failed to load popular tags');
        }
      } catch (error) {
        console.error('Error fetching popular tags:', error);
        if (isMountedRef.current) {
          setTagsError('Failed to load popular tags');
        }
      } finally {
        if (isMountedRef.current) {
          setTagsLoading(false);
        }
      }
    };

    fetchPopularTags();
  }, []); // Only fetch once on mount

  // Track page view
  useEffect(() => {
    if (isMountedRef.current) {
      try {
        trackEvent({
          action: 'page_view',
          category: 'navigation',
          label: 'browse_page'
        });
      } catch (error) {
        console.error('Failed to track page view:', error);
      }
    }
  }, [trackEvent]);

  // Track search with debouncing
  useEffect(() => {
    if (searchTerm && isMountedRef.current) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      searchTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          try {
            trackSearch(searchTerm, filteredListings.length);
          } catch (error) {
            console.error('Failed to track search:', error);
          }
        }
      }, 1000);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [searchTerm, filteredListings.length, trackSearch]);

  // Track filter changes with debouncing
  useEffect(() => {
    const currentFilterSignature = JSON.stringify({
      filter,
      searchTerm,
      minPrice,
      maxPrice,
      selectedHourRange: selectedHourRange.label,
      sortBy
    });
    
    if (hasActiveFilters && currentFilterSignature !== previousFiltersRef.current && isMountedRef.current) {
      previousFiltersRef.current = currentFilterSignature;
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
        filterTimeoutRef.current = null;
      }
      filterTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          try {
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
          } catch (error) {
            console.error('Failed to track filter change:', error);
          }
        }
      }, 1500);
    }
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
        filterTimeoutRef.current = null;
      }
    };
  }, [filter, searchTerm, minPrice, maxPrice, selectedHourRange, sortBy, filteredListings.length, hasActiveFilters, trackEvent]);

  // Handler for tag clicks with analytics
  const handleTagClick = useCallback((tag: string) => {
    if (!isMountedRef.current) return;
    
    // Track the tag click
    try {
      trackEvent({
        action: 'select_tag',
        category: 'browse',
        label: tag,
        customData: {
          source: 'popular_tags'
        }
      });
    } catch (error) {
      console.error('Failed to track tag click:', error);
    }
    
    // Add tag to search term if not already present
    if (!searchTerm.includes(tag)) {
      setSearchTerm(searchTerm ? `${searchTerm} ${tag}` : tag);
    }
  }, [searchTerm, setSearchTerm, trackEvent]);

  // Enhanced click handler with analytics
  const handleListingClickWithAnalytics = useCallback((listingId: string) => {
    if (!isMountedRef.current) return;
    
    const listing = filteredListings.find(l => l.id === listingId);
    if (listing) {
      // Robust auction detection (matches detail page logic)
      const isActualAuction = !!(
        listing.auction &&
        (listing.auction.isAuction || listing.auction.startingPrice !== undefined)
      );
      const price =
        typeof listing.price === 'number'
          ? listing.price
          : parseFloat(String(listing.price)) || 0;

      try {
        trackEvent({
          action: 'select_item',
          category: 'browse',
          label: listingId,
          value: price,
          customData: {
            item_name: listing.title || 'Unknown',
            item_category: listing.isPremium ? 'premium' : (isActualAuction ? 'auction' : 'standard'),
            seller_name: listing.seller || 'Unknown',
            seller_verified: (listing as any).isSellerVerified ?? (listing as any).isVerified ?? false,
            position: Math.max(1, paginatedListings.findIndex(l => l.id === listingId) + 1)
          }
        });
      } catch (error) {
        console.error('Failed to track listing click:', error);
      }
    }
    // Pass false for isLocked parameter since we're allowing the click
    handleListingClick(listingId, false);
  }, [filteredListings, paginatedListings, trackEvent, handleListingClick]);

  // Track page navigation
  const handlePageChangeWithAnalytics = useCallback((newPage: number, direction: 'previous' | 'next' | 'direct') => {
    if (!isMountedRef.current) return;
    
    try {
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
    } catch (error) {
      console.error('Failed to track page navigation:', error);
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
    if (!isMountedRef.current) return;
    
    try {
      trackEvent({
        action: 'reset_filters',
        category: 'browse',
        label: 'all_filters'
      });
    } catch (error) {
      console.error('Failed to track filter reset:', error);
    }
    previousFiltersRef.current = '';
    resetFilters();
  }, [trackEvent, resetFilters]);

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

          {/* Popular Tags Section - Only show when no filters are active */}
          {!hasActiveFilters && popularTags.length > 0 && (
            <PopularTags
              tags={popularTags}
              onTagClick={handleTagClick}
              isLoading={tagsLoading}
              error={tagsError}
            />
          )}

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
