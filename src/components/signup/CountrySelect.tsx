// src/components/signup/CountrySelect.tsx
'use client';

import { Globe } from 'lucide-react';
import { CountryFieldProps } from '@/types/signup';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { countries } from '@/utils/countries';

export default function CountrySelect({ country, error, onChange }: CountryFieldProps) {
  const errorId = error ? 'country-error' : undefined;

  return (
    <div className="mb-4">
      <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
        Country
      </label>
      <div className="relative">
        <select
          id="country"
          name="country"
          value={country}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={errorId}
          className={`w-full appearance-none px-4 py-2.5 bg-black/50 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all duration-200 ${
            error
              ? 'border-red-500/50 focus:ring-red-500/50'
              : 'border-gray-700 focus:ring-[#ff950e]/50 focus:border-[#ff950e]'
          }`}
        >
          <option value="">
            Select your country
          </option>
          {countries.map((option) => (
            <option key={option} value={option} className="bg-[#0b0b0b] text-white">
              {option}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-500">
          <Globe className="w-4 h-4" />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-400">
          <SecureMessageDisplay content={error} allowBasicFormatting={false} />
        </p>
      )}
    </div>
  );
}
