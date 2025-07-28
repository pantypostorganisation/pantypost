// tests/browse.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BrowsePage from '@/app/browse/page';

// Mock all the components and hooks
jest.mock('@/components/RequireAuth', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/BanCheck', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/browse/BrowseHeader', () => ({
  __esModule: true,
  default: ({ filteredListingsCount }: any) => (
    <div data-testid="browse-header">
      {filteredListingsCount} listings found
    </div>
  ),
}));

jest.mock('@/components/browse/BrowseFilters', () => ({
  __esModule: true,
  default: ({ searchTerm, onSearchTermChange, onClearFilters }: any) => (
    <div data-testid="browse-filters">
      <input
        placeholder="Search listings..."
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        data-testid="search-input"
      />
      <button onClick={onClearFilters} data-testid="clear-filters">
        Clear Filters
      </button>
    </div>
  ),
}));

jest.mock('@/components/browse/ListingGrid', () => ({
  __esModule: true,
  default: ({ listings, onListingClick }: any) => (
    <div data-testid="listing-grid">
      {listings.map((listing: any) => (
        <div
          key={listing.id}
          data-testid={`listing-${listing.id}`}
          onClick={() => onListingClick(listing.id)}
        >
          <h3>{listing.title}</h3>
          <p>${listing.price}</p>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/browse/EmptyState', () => ({
  __esModule: true,
  default: ({ searchTerm }: any) => (
    <div data-testid="empty-state">
      No listings found {searchTerm && `for "${searchTerm}"`}
    </div>
  ),
}));

jest.mock('@/components/browse/PaginationControls', () => ({
  __esModule: true,
  default: ({ currentPage, totalPages, onNextPage, onPreviousPage }: any) => (
    <div data-testid="pagination">
      <button onClick={onPreviousPage} disabled={currentPage === 1}>
        Previous
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={onNextPage} disabled={currentPage === totalPages}>
        Next
      </button>
    </div>
  ),
}));

// Mock the useBrowseListings hook
jest.mock('@/hooks/useBrowseListings', () => ({
  useBrowseListings: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Browse Page', () => {
  const mockUseBrowseListings = require('@/hooks/useBrowseListings').useBrowseListings;

  const createMockState = (overrides = {}) => ({
    user: { username: 'testuser', role: 'buyer' },
    filter: 'all',
    setFilter: jest.fn(),
    selectedHourRange: { label: 'Any Hours', value: 0 },
    setSelectedHourRange: jest.fn(),
    searchTerm: '',
    setSearchTerm: jest.fn(),
    minPrice: '',
    setMinPrice: jest.fn(),
    maxPrice: '',
    setMaxPrice: jest.fn(),
    sortBy: 'newest',
    setSortBy: jest.fn(),
    page: 1,
    hoveredListing: null,
    listingErrors: {},
    forceUpdateTimer: 0,
    filteredListings: [],
    paginatedListings: [],
    categoryCounts: { all: 0, standard: 0, auction: 0, premium: 0 },
    totalPages: 1,
    handleMouseEnter: jest.fn(),
    handleMouseLeave: jest.fn(),
    handleListingClick: jest.fn(),
    handleQuickView: jest.fn(),
    handleListingError: jest.fn(),
    handlePreviousPage: jest.fn(),
    handleNextPage: jest.fn(),
    handlePageClick: jest.fn(),
    resetFilters: jest.fn(),
    isSubscribed: jest.fn(),
    getDisplayPrice: jest.fn((listing) => listing.price),
    formatTimeRemaining: jest.fn(),
    HOUR_RANGE_OPTIONS: [],
    PAGE_SIZE: 12,
    isLoading: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBrowseListings.mockReturnValue(createMockState());
  });

  describe('Initial Render', () => {
    it('renders browse page with header and filters', () => {
      render(<BrowsePage />);

      expect(screen.getByTestId('browse-header')).toBeInTheDocument();
      expect(screen.getByTestId('browse-filters')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('shows empty state when no listings', () => {
      render(<BrowsePage />);
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('displays listings when available', () => {
      const listings = [
        { id: '1', title: 'Red Panties', price: 50 },
        { id: '2', title: 'Blue Panties', price: 60 },
      ];

      mockUseBrowseListings.mockReturnValue(
        createMockState({
          filteredListings: listings,
          paginatedListings: listings,
          categoryCounts: { all: 2, standard: 2, auction: 0, premium: 0 },
        })
      );

      render(<BrowsePage />);

      expect(screen.getByText('Red Panties')).toBeInTheDocument();
      expect(screen.getByText('Blue Panties')).toBeInTheDocument();
      expect(screen.getByText('$50')).toBeInTheDocument();
      expect(screen.getByText('$60')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('allows searching for listings', () => {
      const mockSetSearchTerm = jest.fn();
      mockUseBrowseListings.mockReturnValue(
        createMockState({ setSearchTerm: mockSetSearchTerm })
      );

      render(<BrowsePage />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'red' } });

      expect(mockSetSearchTerm).toHaveBeenCalledWith('red');
    });

    it('shows filtered results based on search', () => {
      mockUseBrowseListings.mockReturnValue(
        createMockState({
          searchTerm: 'lace',
          filteredListings: [],
          paginatedListings: [],
        })
      );

      render(<BrowsePage />);

      expect(screen.getByText('No listings found for "lace"')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to listing detail when clicked', () => {
      const mockHandleListingClick = jest.fn();
      const listings = [{ id: '1', title: 'Test Listing', price: 50 }];

      mockUseBrowseListings.mockReturnValue(
        createMockState({
          paginatedListings: listings,
          handleListingClick: mockHandleListingClick,
        })
      );

      render(<BrowsePage />);

      const listing = screen.getByTestId('listing-1');
      fireEvent.click(listing);

      expect(mockHandleListingClick).toHaveBeenCalledWith('1');
    });
  });

  describe('Pagination', () => {
    it('shows pagination controls when multiple pages', () => {
      const listings = Array.from({ length: 12 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Listing ${i + 1}`,
        price: 50 + i,
      }));

      mockUseBrowseListings.mockReturnValue(
        createMockState({
          paginatedListings: listings,
          filteredListings: Array.from({ length: 24 }, (_, i) => ({ id: `${i}` })),
          totalPages: 2,
          page: 1,
        })
      );

      render(<BrowsePage />);

      expect(screen.getByTestId('pagination')).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    it('handles page navigation', () => {
      const mockHandleNextPage = jest.fn();
      
      mockUseBrowseListings.mockReturnValue(
        createMockState({
          paginatedListings: [{ id: '1', title: 'Test', price: 50 }],
          totalPages: 2,
          page: 1,
          handleNextPage: mockHandleNextPage,
        })
      );

      render(<BrowsePage />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      expect(mockHandleNextPage).toHaveBeenCalled();
    });
  });

  describe('Filters', () => {
    it('can clear all filters', () => {
      const mockResetFilters = jest.fn();
      
      mockUseBrowseListings.mockReturnValue(
        createMockState({
          searchTerm: 'test',
          minPrice: '10',
          maxPrice: '100',
          resetFilters: mockResetFilters,
        })
      );

      render(<BrowsePage />);

      const clearButton = screen.getByTestId('clear-filters');
      fireEvent.click(clearButton);

      expect(mockResetFilters).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator while fetching', () => {
      mockUseBrowseListings.mockReturnValue(
        createMockState({ isLoading: true })
      );

      // The actual component might show skeletons or loading indicator
      // For now, we're testing that it doesn't show empty state while loading
      render(<BrowsePage />);

      // Empty state should not show while loading
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });
  });
});