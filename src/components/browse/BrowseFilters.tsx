// src/components/browse/BrowseFilters.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Tag } from 'lucide-react';
import { BrowseFiltersProps } from '@/types/browse';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeCurrency } from '@/utils/security/sanitization';
import { listingsService } from '@/services/listings.service';

interface SearchSuggestion {
  type: 'tag' | 'title';
  value: string;
  count?: number;
}

/* Shared input styling. Defined once so the search box, price fields
   and selects cannot drift apart. */
const FIELD =
  'rounded-md border border-line bg-surface-overlay text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-0 transition-colors';

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

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const tagsResponse = await listingsService.getPopularTags(30);
        if (tagsResponse.success && tagsResponse.data) {
          const matchingTags = tagsResponse.data
            .filter((tag) => tag.tag.toLowerCase().includes(searchTerm.toLowerCase()))
            .slice(0, 5)
            .map((tag) => ({
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
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

  const handleMinPriceChange = (value: string) => {
    if (value === '') onMinPriceChange('');
    else onMinPriceChange(sanitizeCurrency(value).toString());
  };

  const handleMaxPriceChange = (value: string) => {
    if (value === '') onMaxPriceChange('');
    else onMaxPriceChange(sanitizeCurrency(value).toString());
  };

  return (
    <div className="mx-auto mb-4 max-w-[1700px] px-6">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <SecureInput
            ref={searchInputRef}
            value={searchTerm}
            onChange={(value) => {
              onSearchTermChange(value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search listings, tags or sellers"
            className={`w-full py-2 pl-10 pr-3 ${FIELD}`}
            maxLength={100}
            aria-label="Search listings"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-line-strong bg-surface-raised shadow-overlay"
            >
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.value}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      index === selectedSuggestionIndex
                        ? 'bg-surface-hover text-ink'
                        : 'text-ink-muted'
                    }`}
                  >
                    <Tag className="h-3 w-3 text-ink-faint" />
                    <span className="flex-1">{suggestion.value}</span>
                    {suggestion.count && (
                      <span className="text-xs text-ink-faint">{suggestion.count}</span>
                    )}
                  </button>
                ))}
              </div>
              {isLoadingSuggestions && (
                <div className="border-t border-line px-3 py-2 text-xs text-ink-faint">
                  Loading…
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price range */}
        <div className="flex items-center gap-1.5">
          <SecureInput
            value={minPrice}
            onChange={handleMinPriceChange}
            placeholder="Min $"
            type="number"
            className={`w-24 px-3 py-2 ${FIELD}`}
            min="0"
            max="9999"
            step="0.01"
            inputMode="decimal"
            sanitize={false}
            aria-label="Minimum price"
          />
          <span className="text-ink-faint">–</span>
          <SecureInput
            value={maxPrice}
            onChange={handleMaxPriceChange}
            placeholder="Max $"
            type="number"
            className={`w-24 px-3 py-2 ${FIELD}`}
            min="0"
            max="9999"
            step="0.01"
            inputMode="decimal"
            sanitize={false}
            aria-label="Maximum price"
          />
        </div>

        {/* Sort -- emoji removed. They render inconsistently across
            platforms and read as decoration rather than information. */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as any)}
          className={`cursor-pointer px-3 py-2 ${FIELD}`}
          aria-label="Sort by"
        >
          <option value="newest">Newest first</option>
          <option value="priceAsc">Price: low to high</option>
          <option value="priceDesc">Price: high to low</option>
          <option value="endingSoon">Ending soon</option>
        </select>

        <select
          value={selectedHourRange.label}
          onChange={(e) => {
            const selectedOption = hourRangeOptions.find((opt) => opt.label === e.target.value);
            if (selectedOption) onHourRangeChange(selectedOption);
          }}
          className={`cursor-pointer px-3 py-2 ${FIELD}`}
          aria-label="Wear time filter"
        >
          {hourRangeOptions.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-ink-muted transition-colors hover:text-ink"
            aria-label="Clear filters"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}


