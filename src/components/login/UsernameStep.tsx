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
  return (
    <div className="transition-all duration-300">
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          onKeyDown={onKeyPress}
          placeholder="Enter your username"
          className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors"
          autoFocus
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={isDisabled}
        className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        style={{ color: isDisabled ? undefined : '#000' }}
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}