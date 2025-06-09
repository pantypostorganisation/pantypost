// src/types/browse.ts

import { Listing, AuctionSettings } from '@/context/ListingContext';

export interface SellerProfile {
  bio: string | null;
  pic: string | null;
}

export interface ListingWithProfile extends Listing {
  sellerProfile?: SellerProfile;
  sellerSalesCount?: number;
  isSellerVerified?: boolean;
}

export interface FilterOptions {
  filter: 'all' | 'standard' | 'premium' | 'auction';
  searchTerm: string;
  minPrice: string;
  maxPrice: string;
  sortBy: 'newest' | 'priceAsc' | 'priceDesc' | 'endingSoon';
  selectedHourRange: HourRangeOption;
}

export interface HourRangeOption {
  label: string;
  min: number;
  max: number;
}

export interface CategoryCounts {
  all: number;
  standard: number;
  premium: number;
  auction: number;
}

export interface DisplayPrice {
  price: string;
  label: string;
}

// Component Props
export interface BrowseHeaderProps {
  user: any;
  filteredListingsCount: number;
  filter: FilterOptions['filter'];
  categoryCounts: CategoryCounts;
  onFilterChange: (filter: FilterOptions['filter']) => void;
}

export interface BrowseFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  minPrice: string;
  onMinPriceChange: (price: string) => void;
  maxPrice: string;
  onMaxPriceChange: (price: string) => void;
  sortBy: FilterOptions['sortBy'];
  onSortByChange: (sort: FilterOptions['sortBy']) => void;
  selectedHourRange: HourRangeOption;
  onHourRangeChange: (range: HourRangeOption) => void;
  hourRangeOptions: HourRangeOption[];
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export interface ListingCardProps {
  listing: ListingWithProfile;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onQuickView: (e: React.MouseEvent) => void;
  user: any;
  isSubscribed: boolean;
  displayPrice: DisplayPrice;
  forceUpdateTimer: number;
  formatTimeRemaining: (endTime: string) => string;
}

export interface ListingGridProps {
  listings: ListingWithProfile[];
  hoveredListing: string | null;
  onListingHover: (listingId: string) => void;
  onListingLeave: () => void;
  onListingClick: (listingId: string, isLocked: boolean) => void;
  onQuickView: (e: React.MouseEvent, listingId: string) => void;
  user: any;
  isSubscribed: (username: string, seller: string) => boolean;
  getDisplayPrice: (listing: Listing) => DisplayPrice;
  forceUpdateTimer: number;
  formatTimeRemaining: (endTime: string) => string;
  listingErrors: { [listingId: string]: string };
  onListingError: (error: Error, listingId: string) => void;
}

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  filteredListingsCount: number;
  pageSize: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageClick: (page: number) => void;
}

export interface EmptyStateProps {
  searchTerm: string;
  onResetFilters: () => void;
}