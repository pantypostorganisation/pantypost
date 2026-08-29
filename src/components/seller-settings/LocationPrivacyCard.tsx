// src/components/seller-settings/LocationPrivacyCard.tsx
'use client';

import { useMemo } from 'react';
import { countriesWithFlags } from '@/utils/countries';
import { filterAllowedCountries } from '@/utils/blockedCountries';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface LocationPrivacyCardProps {
  country: string;
  onCountryChange: (value: string) => void;
  isLocationPublic: boolean;
  onLocationVisibilityChange: (value: boolean) => void;
  error?: string | null;
}

export default function LocationPrivacyCard({
  country,
  onCountryChange,
  isLocationPublic,
  onLocationVisibilityChange,
  error,
}: LocationPrivacyCardProps) {
  // Same allow-list as signup -- see blockedCountries.ts.
  const countryOptions = useMemo(() => filterAllowedCountries(countriesWithFlags), []);
  const sanitizedError = error ? sanitizeStrict(error) : null;

  return (
    <div className="rounded-lg bg-surface-raised p-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary/70">Privacy</p>
          <h2 className="mt-2 text-2xl font-bold">Location &amp; Privacy</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Let buyers know where you ship from while keeping control over what shows on your public profile.
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div>
          <label htmlFor="seller-country" className="flex items-center text-sm font-semibold text-gray-200">
            Country
            <span className="ml-1 text-primary">*</span>
          </label>
          <p className="mt-1 text-xs text-ink-muted">Pick the country you ship from. This helps match you with nearby buyers.</p>
          <div className="mt-3">
            <div className={`rounded-md border ${sanitizedError ? 'border-red-500/70' : 'border-white/10'} bg-surface/40`}> 
              <select
                id="seller-country"
                value={country}
                onChange={(event) => onCountryChange(event.target.value)}
                className="w-full appearance-none rounded-md bg-transparent px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                aria-required="true"
                aria-invalid={Boolean(sanitizedError)}
              >
                <option value="" className="bg-surface text-ink-muted">
                  Select your country
                </option>
                {countryOptions.map((option) => (
                  <option key={option.code} value={option.name} className="bg-surface text-white">
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
            {sanitizedError && (
              <p className="mt-2 text-xs text-red-400" role="alert">
                {sanitizedError}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/5 bg-white/5 bg-gradient-to-br from-black/40 to-black/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Show my location on my public profile</p>
              <p className="mt-1 text-xs text-ink-muted">
                When enabled, your country and flag will be visible to buyers on your profile. When disabled, your location stays
                private.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isLocationPublic}
              onClick={() => onLocationVisibilityChange(!isLocationPublic)}
              className={`relative h-6 w-11 rounded-md transition-colors duration-200 ${
                isLocationPublic ? 'bg-primary' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                  isLocationPublic ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
              <span className="sr-only">Toggle location visibility</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
