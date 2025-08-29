// src/components/browse/BrowseFilters.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, DollarSign, X, Tag } from 'lucide-react';
import { BrowseFiltersProps } from '@/types/browse';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeCurrency } from '@/utils/security/sanitization';
import { listingsService } from '@/services/listings.service';

interface SearchSuggestion {
  type: 'tag' | 'title';
  value: string;
  count?: number;
}

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
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        // Get popular tags that match the search term
        const tagsResponse = await listingsService.getPopularTags(30);
        if (tagsResponse.success && tagsResponse.data) {
          const matchingTags = tagsResponse.data
            .filter(tag => tag.tag.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 5)
            .map(tag => ({
              type: 'tag' as const,
              value: tag.tag,
              count: tag.count
            }));
          
          setSuggestions(matchingTags);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSearchTermChange(suggestion.value);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

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
          <div className="relative">
            <SecureInput
              ref={searchInputRef}
              value={searchTerm}
              onChange={(value) => {
                onSearchTermChange(value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search by title, description, tags, or seller..."
              className="w-full pl-10 pr-3 py-2 rounded-lg bg-black/50 border border-gray-700 text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-[#ff950e] focus:border-[#ff950e] transition-all"
              maxLength={100}
              aria-label="Search listings"
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden"
              >
                <div className="max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.value}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      className={`
                        w-full px-4 py-2 text-left flex items-center gap-2 transition-colors
                        ${index === selectedSuggestionIndex 
                          ? 'bg-[#ff950e]/20 text-[#ff950e]' 
                          : 'text-gray-300 hover:bg-gray-800'
                        }
                      `}
                    >
                      <Tag className="w-3 h-3 opacity-60" />
                      <span className="flex-1 text-sm">{suggestion.value}</span>
                      {suggestion.count && (
                        <span className="text-xs text-gray-500">
                          {suggestion.count} {suggestion.count === 1 ? 'item' : 'items'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {isLoadingSuggestions && (
                  <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-700">
                    Loading suggestions...
                  </div>
                )}
              </div>
            )}
          </div>
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
