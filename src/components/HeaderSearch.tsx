// src/components/HeaderSearch.tsx
'use client';

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { usersService } from '@/services';
import { sanitizeStrict, sanitizeSearchQuery } from '@/utils/security/sanitization';

type SearchUserResult = {
  username: string;
  role: 'buyer' | 'seller';
  profilePicture: string | null;
  isVerified: boolean;
  profilePictureUpdatedAt: string | null;
};

interface HeaderSearchProps {
  variant: 'desktop' | 'mobile';
  canUseSearch: boolean;
  onResultClick?: () => void;
}

const getCacheBustedUrl = (url: string, updatedAt: string | null): string => {
  if (!updatedAt) {
    return url;
  }

  const parsed = Date.parse(updatedAt);
  const cacheKey = Number.isNaN(parsed) ? encodeURIComponent(updatedAt) : parsed;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${cacheKey}`;
};

// Memoized search component to prevent re-renders
export const HeaderSearch = memo(function HeaderSearch({
  variant,
  canUseSearch,
  onResultClick
}: HeaderSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestSearchId = useRef(0);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout;
    let isTouchScrolling = false;

    const handleScroll = () => {
      isScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 150);
    };

    const handleTouchStart = () => {
      isTouchScrolling = false;
    };

    const handleTouchMove = () => {
      isTouchScrolling = true;
    };

    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if user is scrolling
      if (isScrolling || isTouchScrolling) return;
      
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      // Don't close if user was scrolling
      if (isTouchScrolling) {
        setTimeout(() => {
          isTouchScrolling = false;
        }, 100);
        return;
      }
      
      if (containerRef.current && event.target && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('scroll', handleScroll, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('scroll', handleScroll, true);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // Search logic
  useEffect(() => {
    if (!canUseSearch) {
      setIsSearchingUsers(false);
      setSearchResults([]);
      setSearchError(null);
      setShowDropdown(false);
      return;
    }

    const sanitizedQuery = sanitizeSearchQuery(searchQuery).trim();

    if (!sanitizedQuery) {
      setIsSearchingUsers(false);
      setSearchResults([]);
      setSearchError(null);
      setShowDropdown(false);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      return;
    }

    if (sanitizedQuery.length < 3) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const searchId = ++latestSearchId.current;

    setIsSearchingUsers(true);
    setSearchError(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const debounceTime = variant === 'mobile' ? 800 : 300;
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await usersService.getUsers({ query: sanitizedQuery, limit: 30 });
        if (cancelled || latestSearchId.current !== searchId) return;

        if (response.success && response.data) {
          const mappedResults = Object.values(response.data)
            .filter((rawUser) => rawUser && (rawUser.role === 'buyer' || rawUser.role === 'seller'))
            .map((rawUser) => {
              const safeUsername = sanitizeStrict(rawUser.username);
              if (!safeUsername) {
                return null;
              }

              const picture = rawUser.profilePicture ||
                (rawUser as any)?.profilePic || null;
              const pictureUpdatedRaw =
                (rawUser as any)?.profilePictureUpdatedAt ??
                (rawUser as any)?.profilePicUpdatedAt ??
                (rawUser as any)?.profilePicLastUpdated ??
                (rawUser as any)?.lastUpdated ??
                (rawUser as any)?.updatedAt ??
                null;
              const pictureUpdatedAt =
                typeof pictureUpdatedRaw === 'string' ? sanitizeStrict(pictureUpdatedRaw) : null;
              const verified = Boolean(rawUser.isVerified || rawUser.verificationStatus === 'verified');

              return {
                username: safeUsername,
                role: rawUser.role,
                profilePicture: picture,
                profilePictureUpdatedAt: pictureUpdatedAt,
                isVerified: verified,
              } as SearchUserResult;
            })
            .filter((result): result is SearchUserResult => Boolean(result));

          // Sort results to prioritize:
          // 1. Exact username matches (case-insensitive)
          // 2. Verified users
          // 3. Partial matches
          const sortedResults = mappedResults.sort((a, b) => {
            const queryLower = sanitizedQuery.toLowerCase();
            const aUsernameLower = a.username.toLowerCase();
            const bUsernameLower = b.username.toLowerCase();
            
            // Check for exact matches first
            const aExactMatch = aUsernameLower === queryLower;
            const bExactMatch = bUsernameLower === queryLower;
            
            if (aExactMatch && !bExactMatch) return -1;
            if (!aExactMatch && bExactMatch) return 1;
            
            // Then prioritize verified users
            if (a.isVerified && !b.isVerified) return -1;
            if (!a.isVerified && b.isVerified) return 1;
            
            // Finally, sort alphabetically for consistency
            return aUsernameLower.localeCompare(bUsernameLower);
          });

          setSearchResults(sortedResults.slice(0, 30));
          setSearchError(sortedResults.length === 0 ? 'No matching users found' : null);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
          setSearchError('No matching users found');
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('User search error:', error);
        if (!cancelled && latestSearchId.current === searchId) {
          setSearchResults([]);
          setSearchError('Unable to search users right now');
          setShowDropdown(true);
        }
      } finally {
        if (!cancelled && latestSearchId.current === searchId) {
          setIsSearchingUsers(false);
        }
      }
    }, debounceTime);

    return () => {
      cancelled = true;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [searchQuery, canUseSearch, variant]);

  const handleInputChange = useCallback((value: string) => {
    if (!canUseSearch) return;
    const sanitizedValue = sanitizeSearchQuery(value);
    setSearchQuery(sanitizedValue);
  }, [canUseSearch]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchError(null);
    setIsSearchingUsers(false);
    setShowDropdown(false);
    inputRef.current?.focus();
  }, []);

  const navigateToProfile = useCallback((result: SearchUserResult) => {
    const path = result.role === 'seller' 
      ? `/sellers/${encodeURIComponent(result.username)}` 
      : `/buyers/${encodeURIComponent(result.username)}`;
    
    // Clear search state
    handleClearSearch();
    
    // Call parent callback if provided
    if (onResultClick) {
      onResultClick();
    }
    
    // Navigate using location.href for reliability on mobile
    window.location.href = path;
  }, [handleClearSearch, onResultClick]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setShowDropdown(false);
      inputRef.current?.blur();
    } else if (event.key === 'Enter' && searchResults.length > 0) {
      event.preventDefault();
      navigateToProfile(searchResults[0]);
    }
  }, [searchResults, navigateToProfile]);

  const trimmedQuery = searchQuery.trim();
  const hasMinimumLength = trimmedQuery.length >= 3;
  const shouldShowDropdown = canUseSearch && showDropdown && hasMinimumLength && 
    (isSearchingUsers || searchResults.length > 0 || searchError !== null);

  if (!canUseSearch) return null;

  return (
    <div ref={containerRef} className="relative w-full group">
      <div className="pointer-events-none absolute inset-0 rounded-xl border border-[#ff950e]/15 opacity-0 transition-opacity duration-300 group-focus-within:opacity-100" />
      
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff950e] w-4 h-4 pointer-events-none" aria-hidden="true" />
        
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (trimmedQuery.length >= 3 && searchResults.length > 0) {
              setShowDropdown(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search buyers and sellers..."
          style={{ 
            fontSize: '16px', // Prevent iOS zoom
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
          className={`w-full ${
            variant === 'desktop' 
              ? 'bg-[#111111] text-sm py-2.5' 
              : 'bg-[#121212] py-2.5'
          } border border-[#2a2a2a] focus:border-[#ff950e] focus:ring-2 focus:ring-[#ff950e]/40 text-white placeholder-gray-500 rounded-xl pl-11 pr-14 transition-all duration-200 search-no-native-clear`}
          aria-label="Search users"
          aria-expanded={shouldShowDropdown}
          aria-autocomplete="list"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        
        {/* Grey Clear Button - Keep this one */}
        {trimmedQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        
        {isSearchingUsers && hasMinimumLength && (
          <Loader2 className="absolute right-11 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#ff950e] pointer-events-none" />
        )}
      </div>

      {/* Search Results Dropdown - Increased z-index */}
      {shouldShowDropdown && (
        <div className={`absolute top-full left-0 right-0 mt-2 z-[100] rounded-2xl border border-[#ff950e]/20 bg-gradient-to-b from-[#181818] via-[#101010] to-[#0b0b0b] shadow-2xl ${
          variant === 'desktop' ? 'max-h-[500px]' : 'max-h-[400px]'
        } overflow-y-auto`}>
          {isSearchingUsers && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-300">
              <Loader2 className="w-4 h-4 animate-spin text-[#ff950e]" />
              <span>Searching users...</span>
            </div>
          )}

          {!isSearchingUsers && searchResults.length > 0 && (
            <ul className="divide-y divide-[#ff950e]/10 pb-2" role="listbox">
              {searchResults.map((result) => {
                const initial = result.username.charAt(0).toUpperCase();
                const roleLabel = result.role === 'seller' ? 'Seller profile' : 'Buyer profile';
                const isExactMatch = result.username.toLowerCase() === trimmedQuery.toLowerCase();
                const displayProfilePicture =
                  result.profilePicture
                    ? getCacheBustedUrl(result.profilePicture, result.profilePictureUpdatedAt)
                    : null;

                return (
                  <li key={`${result.role}-${result.username}`}>
                    <button
                      type="button"
                      role="option"
                      onClick={() => navigateToProfile(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#ff950e]/10 text-left"
                    >
                      <div className="w-10 h-10 rounded-full border border-[#ff950e]/30 bg-gradient-to-br from-[#ff950e]/10 to-[#ff6b00]/10 flex items-center justify-center overflow-hidden shadow-inner">
                        {displayProfilePicture ? (
                          <img
                            src={displayProfilePicture}
                            alt={`${result.username}'s avatar`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-[#ff950e]">{initial}</span>
                        )}
                      </div>

                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-white">{result.username}</span>
                          {result.role === 'seller' && result.isVerified && (
                            <img src="/verification_badge.png" alt="Verified" className="w-4 h-4" />
                          )}
                          {isExactMatch && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full border border-green-400/30">
                              Match
                            </span>
                          )}
                        </div>
                        <span className="text-xs uppercase tracking-wide text-gray-400">{roleLabel}</span>
                      </div>

                      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#ff950e] bg-[#ff950e]/10 px-2 py-0.5 rounded-full">
                        View
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!isSearchingUsers && searchError && searchResults.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400">
              <Search className="w-4 h-4 text-[#ff950e]" />
              <span>{searchError}</span>
            </div>
          )}
        </div>
      )}

      {/* CSS to hide native browser clear button */}
      <style jsx>{`
        .search-no-native-clear::-webkit-search-cancel-button,
        .search-no-native-clear::-webkit-search-decoration {
          -webkit-appearance: none;
          appearance: none;
          display: none;
        }
        
        .search-no-native-clear::-ms-clear {
          display: none;
        }
      `}</style>
    </div>
  );
});
