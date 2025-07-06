// src/app/browse/page.tsx
'use client';

import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import BrowseHeader from '@/components/browse/BrowseHeader';
import BrowseFilters from '@/components/browse/BrowseFilters';
import ListingGrid from '@/components/browse/ListingGrid';
import PaginationControls from '@/components/browse/PaginationControls';
import EmptyState from '@/components/browse/EmptyState';
import { useBrowseListings } from '@/hooks/useBrowseListings';

export default function BrowsePage() {
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
            onClearFilters={resetFilters}
            hasActiveFilters={hasActiveFilters}
          />

          <div className="max-w-[1700px] mx-auto px-6">
            {isLoading ? (
              // Show loading grid
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-gray-900 rounded-lg animate-pulse">
                    <div className="aspect-square bg-gray-800 rounded-t-lg" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-800 rounded w-3/4" />
                      <div className="h-4 bg-gray-800 rounded w-1/2" />
                      <div className="flex justify-between">
                        <div className="h-6 bg-gray-800 rounded w-20" />
                        <div className="h-6 bg-gray-800 rounded w-16" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedListings.length === 0 ? (
              <EmptyState
                searchTerm={searchTerm}
                onResetFilters={resetFilters}
              />
            ) : (
              <>
                <ListingGrid
                  listings={paginatedListings}
                  hoveredListing={hoveredListing}
                  onListingHover={handleMouseEnter}
                  onListingLeave={handleMouseLeave}
                  onListingClick={handleListingClick}
                  onQuickView={handleQuickView}
                  user={user}
                  isSubscribed={isSubscribed}
                  getDisplayPrice={getDisplayPrice}
                  forceUpdateTimer={forceUpdateTimer}
                  formatTimeRemaining={formatTimeRemaining}
                  listingErrors={listingErrors}
                  onListingError={handleListingError}
                />

                <PaginationControls
                  currentPage={page}
                  totalPages={totalPages}
                  filteredListingsCount={filteredListings.length}
                  pageSize={PAGE_SIZE}
                  onPreviousPage={handlePreviousPage}
                  onNextPage={handleNextPage}
                  onPageClick={handlePageClick}
                />
              </>
            )}
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}
