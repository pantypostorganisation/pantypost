// src/components/signup/EmailField.tsx
'use client';

import { EmailFieldProps } from '@/types/signup';

export default function EmailField({ 
  email, 
  error, 
  onChange 
}: EmailFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
        Email Address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => onChange(e.target.value)}
        placeholder="you@example.com"
        className={`w-full px-3.5 py-2.5 bg-black/50 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
          error
            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-700 focus:border-[#ff950e] focus:ring-[#ff950e]'
        }`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}