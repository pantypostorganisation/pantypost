// src/components/signup/CountrySelect.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, AlertCircle, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountryFieldProps } from '@/types/signup';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { countriesWithFlags, getCountryCode } from '@/utils/countries';

export default function CountrySelect({ country, error, onChange }: CountryFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const errorId = error ? 'country-error' : undefined;

  // Get selected country data
  const selectedCountry = countriesWithFlags.find(c => c.name === country);

  // Filter countries based on search
  const filteredCountries = countriesWithFlags.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleSelect = (countryName: string) => {
    onChange(countryName);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  return (
    <div className="mb-4" ref={dropdownRef}>
      <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
        Country
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          aria-invalid={!!error}
          aria-describedby={errorId}
          aria-required="true"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`w-full px-4 py-2.5 pr-16 bg-black/50 border rounded-lg text-left focus:outline-none focus:ring-2 transition-all duration-200 ${
            error
              ? 'border-red-500/50 focus:ring-red-500/50'
              : 'border-gray-700 focus:ring-[#ff950e]/50 focus:border-[#ff950e]'
          }`}
        >
          {selectedCountry ? (
            <span className="text-white flex items-center gap-2">
              <span className={`fi fi-${getCountryCode(selectedCountry.name)} w-5 h-4`}></span>
              <span>{selectedCountry.name}</span>
            </span>
          ) : (
            <span className="text-gray-500">Select your country</span>
          )}
        </button>

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500">
          {selectedCountry && (
            <button
              type="button"
              onClick={handleClear}
              className="pointer-events-auto hover:text-gray-300 transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true" 
          />
          <Globe className="w-4 h-4" aria-hidden="true" />
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-2 bg-[#0b0b0b] border border-gray-700 rounded-lg shadow-xl overflow-hidden"
              role="listbox"
            >
              <div className="p-2 border-b border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search countries..."
                    className="w-full pl-9 pr-3 py-2 bg-black/50 border border-gray-700 rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-[#ff950e]/50 focus:border-[#ff950e]"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => handleSelect(option.name)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-[#ff950e]/10 transition-colors flex items-center gap-2 ${
                        option.name === country
                          ? 'bg-[#ff950e]/20 text-white'
                          : 'text-gray-300'
                      }`}
                      role="option"
                      aria-selected={option.name === country}
                    >
                      <span className={`fi fi-${getCountryCode(option.name)} w-5 h-4`}></span>
                      <span className="text-sm">{option.name}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No countries found
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <SecureMessageDisplay content={error} allowBasicFormatting={false} />
        </p>
      )}

      <p className="mt-1.5 text-xs text-gray-500">
        Required for verification purposes in certain countries
      </p>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0b0b0b;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
}
