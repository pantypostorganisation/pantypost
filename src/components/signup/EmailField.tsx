// src/components/signup/EmailField.tsx
'use client';

import { Mail } from 'lucide-react';
import { EmailFieldProps } from '@/types/signup';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

/**
 * Notes:
 * - We don't "sanitize" emails (to avoid stripping valid chars). We trim whitespace only.
 * - Adds accessibility (aria-invalid / aria-describedby), maxLength, inputMode, pattern.
 * - Error messages are rendered via SecureMessageDisplay to avoid any injection.
 */
export default function EmailField({
  email,
  error,
  onChange,
}: EmailFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Trim surrounding spaces only (do NOT strip characters needed for valid emails)
    const next = e.target.value.replace(/\s+/g, ' ').trimStart();
    // Limit to common max length for emails (RFC suggests 254)
    onChange(next.slice(0, 254));
  };

  const errorId = error ? 'email-error' : undefined;

  return (
    <div className="mb-4">
      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
        Email Address
      </label>
      <div className="relative">
        <input
          id="email"
          name="email"
          type="email"
          value={email || ''}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          aria-invalid={!!error}
          aria-describedby={errorId}
          // A conservative pattern; server-side validation should still be the source of truth.
          pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
          className={`w-full px-4 py-2.5 bg-black/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
            error
              ? 'border-red-500/50 focus:ring-red-500/50'
              : 'border-gray-700 focus:ring-[#ff950e]/50 focus:border-[#ff950e]'
          }`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Mail className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-400">
          <SecureMessageDisplay content={error} allowBasicFormatting={false} />
        </p>
      )}

      <p className="mt-1.5 text-xs text-gray-500">We'll never share your email with anyone</p>
    </div>
  );
}
