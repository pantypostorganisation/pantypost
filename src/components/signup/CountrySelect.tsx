// src/components/signup/CountrySelect.tsx
'use client';

import { Globe, ChevronDown, AlertCircle } from 'lucide-react';
import { CountryFieldProps } from '@/types/signup';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { countriesWithFlags } from '@/utils/countries';

export default function CountrySelect({ country, error, onChange }: CountryFieldProps) {
  const errorId = error ? 'country-error' : undefined;

  return (
    <div className="mb-4">
      <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
        Country <span className="text-red-400">*</span>
      </label>
      <div className="relative">
        <select
          id="country"
          name="country"
          value={country}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={errorId}
          aria-required="true"
          className={`w-full appearance-none px-4 py-2.5 pr-16 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
            error
              ? 'border-red-500/50 focus:ring-red-500/50'
              : 'border-gray-700 focus:ring-[#ff950e]/50 focus:border-[#ff950e]'
          } ${!country ? 'text-gray-500' : 'text-white'}`}
        >
          <option value="" disabled className="bg-[#0b0b0b] text-gray-500">
            Select your country
          </option>
          {countriesWithFlags.map((option) => (
            <option 
              key={option.name} 
              value={option.name} 
              className="bg-[#0b0b0b] text-white"
            >
              {option.flag} {option.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500">
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
          <Globe className="w-4 h-4" aria-hidden="true" />
        </div>
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
    </div>
  );
}
