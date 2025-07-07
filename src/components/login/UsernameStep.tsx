// src/components/login/UsernameStep.tsx
'use client';

import { ArrowRight } from 'lucide-react';
import { UsernameStepProps } from '@/types/login';
import { SecureForm } from '@/components/ui/SecureForm';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';

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
      <SecureForm
        onSubmit={handleSubmit}
        rateLimitKey="LOGIN"
        rateLimitConfig={RATE_LIMITS.LOGIN}
      >
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
        </div>
        <button
          type="submit"
          disabled={isDisabled || !username}
          className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={{ color: isDisabled || !username ? undefined : '#000' }}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </SecureForm>
    </div>
  );
}
