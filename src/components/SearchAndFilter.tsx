'use client';

import { useState, useEffect } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

export type FilterOptions = {
  search: string;
  priceRange: [number, number];
  categories: string[];
  sortBy: 'newest' | 'price-low-high' | 'price-high-low' | 'popular';
  sellerRating: number | null;
  verifiedOnly: boolean;
};

type SearchAndFilterProps = {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: Partial<FilterOptions>;
  availableCategories: string[];
  maxPrice: number;
};

const DEFAULT_FILTERS: FilterOptions = {
  search: '',
  priceRange: [0, 200],
  categories: [],
  sortBy: 'newest',
  sellerRating: null,
  verifiedOnly: false,
};

export default function SearchAndFilter({
  onFilterChange,
  initialFilters = {},
  availableCategories,
  maxPrice = 200,
}: SearchAndFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
    priceRange: initialFilters.priceRange || [0, maxPrice],
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [priceInputMin, setPriceInputMin] = useState(filters.priceRange[0].toString());
  const [priceInputMax, setPriceInputMax] = useState(filters.priceRange[1].toString());

  // Update parent component when filters change
  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  const handleCategoryToggle = (category: string) => {
    setFilters((prev) => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: newCategories };
    });
  };

  const handleRatingChange = (rating: number | null) => {
    setFilters((prev) => ({ ...prev, sellerRating: rating }));
  };

  const handleVerifiedToggle = () => {
    setFilters((prev) => ({ ...prev, verifiedOnly: !prev.verifiedOnly }));
  };

  const handlePriceRangeChange = () => {
    const min = Math.max(0, parseInt(priceInputMin) || 0);
    const max = Math.min(maxPrice, parseInt(priceInputMax) || maxPrice);
    
    setFilters((prev) => ({
      ...prev,
      priceRange: [min, max > min ? max : min + 1],
    }));
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPriceInputMin('0');
    setPriceInputMax(maxPrice.toString());
  };

  const toggleFilters = () => {
    setShowFilters((prev) => !prev);
  };

  return (
    <div className="w-full bg-gray-900 rounded-lg shadow-md border border-gray-800 overflow-hidden">
      {/* Search Bar */}
      <div className="p-4 flex items-center gap-2">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search listings..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={toggleFilters}
          className={`flex items-center gap-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            showFilters || Object.values(filters).some((val) => 
              val !== DEFAULT_FILTERS.search && 
              val !== DEFAULT_FILTERS.sortBy && 
              (Array.isArray(val) ? val.length > 0 : val !== false)
            )
              ? 'bg-pink-600 text-white'
              : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {showFilters ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-4 border-t border-gray-800 bg-gray-850">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price Range */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Price Range</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  max={maxPrice}
                  value={priceInputMin}
                  onChange={(e) => setPriceInputMin(e.target.value)}
                  onBlur={handlePriceRangeChange}
                  className="w-24 py-1 px-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
                <span className="text-gray-400">to</span>
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  max={maxPrice}
                  value={priceInputMax}
                  onChange={(e) => setPriceInputMax(e.target.value)}
                  onBlur={handlePriceRangeChange}
                  className="w-24 py-1 px-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Sort By</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSortChange('newest')}
                  className={`py-1 px-3 text-sm rounded ${
                    filters.sortBy === 'newest'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
                  }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => handleSortChange('price-low-high')}
                  className={`py-1 px-3 text-sm rounded ${
                    filters.sortBy === 'price-low-high'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
                  }`}
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => handleSortChange('price-high-low')}
                  className={`py-1 px-3 text-sm rounded ${
                    filters.sortBy === 'price-high-low'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
                  }`}
                >
                  Price: High to Low
                </button>
                <button
                  onClick={() => handleSortChange('popular')}
                  className={`py-1 px-3 text-sm rounded ${
                    filters.sortBy === 'popular'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-800 text-gray-300 border border-gray-700'
                  }`}
                >
                  Most Popular
                </button>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryToggle(category)}
                    className={`py-1 px-3 text-sm rounded ${
                      filters.categories.includes(category)
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Seller Rating */}
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Seller Rating</h3>
              <div className="flex gap-2">
                {[4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRatingChange(filters.sellerRating === rating ? null : rating)}
                    className={`py-1 px-3 text-sm rounded ${
                      filters.sellerRating === rating
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-800 text-gray-300 border border-gray-700'
                    }`}
                  >
                    {rating}★+
                  </button>
                ))}
              </div>
            </div>

            {/* Verified Sellers */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={handleVerifiedToggle}
                  className="sr-only"
                />
                <span
                  className={`w-5 h-5 mr-2 flex items-center justify-center rounded border ${
                    filters.verifiedOnly
                      ? 'bg-pink-600 border-pink-600 text-white'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  {filters.verifiedOnly && <span className="text-xs">✓</span>}
                </span>
                <span className="text-sm text-gray-300">Verified Sellers Only</span>
              </label>
            </div>

            {/* Clear Filters */}
            <div>
              <button
                onClick={clearFilters}
                className="py-1 px-3 text-sm text-gray-300 hover:text-white underline underline-offset-2"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}