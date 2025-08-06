// src/components/signup/EmailField.tsx
'use client';

import { Mail } from 'lucide-react';
import { EmailFieldProps } from '@/types/signup';

export default function EmailField({ 
  email, 
  error, 
  onChange 
}: EmailFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

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
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
      
      <p className="mt-1.5 text-xs text-gray-500">
        We'll never share your email with anyone
      </p>
    </div>
  );
}
