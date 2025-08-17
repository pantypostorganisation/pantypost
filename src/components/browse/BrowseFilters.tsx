'use client';

import { Search, DollarSign, X } from 'lucide-react';
import { BrowseFiltersProps } from '@/types/browse';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeCurrency } from '@/utils/security/sanitization';

export default function BrowseFilters({
  searchTerm,
  onSearchTermChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  sortBy,
  onSortByChange,
  selectedHourRange,
  onHourRangeChange,
  hourRangeOptions,
  onClearFilters,
  hasActiveFilters
}: BrowseFiltersProps) {
  // Handle secure price changes
  const handleMinPriceChange = (value: string) => {
    if (value === '') {
      onMinPriceChange('');
    } else {
      const sanitized = sanitizeCurrency(value);
      onMinPriceChange(sanitized.toString());
    }
  };

  const handleMaxPriceChange = (value: string) => {
    if (value === '') {
      onMaxPriceChange('');
    } else {
      const sanitized = sanitizeCurrency(value);
      onMaxPriceChange(sanitized.toString());
    }
  };

  return (
    <div className="max-w-[1700px] mx-auto px-6 mb-6">
      <div className="flex flex-wrap gap-3 items-center bg-gradient-to-r from-[#1a1a1a]/80 to-[#222]/80 backdrop-blur-sm p-3 rounded-lg border border-gray-800 shadow-lg">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 z-10" />
          <SecureInput
            value={searchTerm}
            onChange={onSearchTermChange}
            placeholder="Search by title, description, tags, or seller..."
            className="w-full pl-10 pr-3 py-2 rounded-lg bg-black/50 border border-gray-700 text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
            maxLength={100}
            aria-label="Search listings"
          />
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1 text-gray-400">
            <DollarSign size={14} />
            <span className="text-xs font-medium">Price</span>
          </div>
          <SecureInput
            value={minPrice}
            onChange={handleMinPriceChange}
            placeholder="Min"
            type="number"
            className="px-2 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white placeholder-gray-400 w-16 focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
            min="0"
            max="9999"
            step="0.01"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            sanitize={false}
            aria-label="Minimum price"
          />
          <span className="text-gray-500 text-xs">—</span>
          <SecureInput
            value={maxPrice}
            onChange={handleMaxPriceChange}
            placeholder="Max"
            type="number"
            className="px-2 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white placeholder-gray-400 w-16 focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
            min="0"
            max="9999"
            step="0.01"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            sanitize={false}
            aria-label="Maximum price"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as any)}
          className="px-3 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white cursor-pointer focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
          aria-label="Sort by"
        >
          <option value="newest">🕒 Newest First</option>
          <option value="priceAsc">💰 Price: Low → High</option>
          <option value="priceDesc">💎 Price: High → Low</option>
          <option value="endingSoon">⏰ Ending Soon</option>
        </select>

        <select
          value={selectedHourRange.label}
          onChange={(e) => {
            const selectedOption = hourRangeOptions.find(opt => opt.label === e.target.value);
            if (selectedOption) onHourRangeChange(selectedOption);
          }}
          className="px-3 py-2 rounded-lg bg-black/50 border border-gray-700 text-xs text-white cursor-pointer focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
          aria-label="Delivery time filter"
        >
          {hourRangeOptions.map(option => (
            <option key={option.label} value={option.label}>
              {option.label === 'Any Hours' ? '⏱️ Any Hours' : `⏱️ ${option.label}`}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-3 py-2 rounded-lg bg-red-600/20 border border-red-700 text-red-400 hover:bg-red-600/30 text-xs transition-all flex items-center gap-1 font-medium"
            aria-label="Clear filters"
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
