// src/components/signup/UsernameField.tsx
'use client';

import { CheckCircle } from 'lucide-react';
import { UsernameFieldProps } from '@/types/signup';

export default function UsernameField({ 
  username, 
  error, 
  isChecking, 
  onChange 
}: UsernameFieldProps) {
  return (
    <div className="mb-4">
      <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
        Username
      </label>
      <div className="relative">
        <input
          id="username"
          name="username"
          type="text"
          value={username}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Choose a username"
          className={`w-full px-3.5 py-2.5 bg-black/50 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
            error
              ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
              : username && !isChecking && username.length >= 3
              ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500'
              : 'border-gray-700 focus:border-[#ff950e] focus:ring-[#ff950e]'
          }`}
        />
        {/* Status indicators */}
        {isChecking && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {!isChecking && username && username.length >= 3 && !error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
      {isChecking && (
        <p className="mt-1 text-xs text-gray-500">Checking availability...</p>
      )}
    </div>
  );
}