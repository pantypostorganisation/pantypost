// src/components/login/UsernameStep.tsx
'use client';

import { ArrowRight } from 'lucide-react';
import { UsernameStepProps } from '@/types/login';

export default function UsernameStep({
  username,
  error,
  onUsernameChange,
  onSubmit,
  onKeyPress,
  isDisabled
}: UsernameStepProps) {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  // Basic sanitization for username
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .toLowerCase();
    onUsernameChange(value);
  };

  return (
    <div className="transition-all duration-300">
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={handleChange}
            onKeyDown={onKeyPress}
            placeholder="Enter your username"
            className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors"
            autoFocus
          />
          {/* Error display */}
          {error && (
            <p className="mt-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isDisabled || !username}
          className="w-full bg-[#ff950e] hover:bg-[#ff6b00] disabled:bg-gray-700 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
