// src/components/signup/PasswordField.tsx
'use client';

import { Eye, EyeOff } from 'lucide-react';
import { PasswordFieldProps } from '@/types/signup';

export default function PasswordField({
  password,
  confirmPassword,
  passwordError,
  confirmError,
  showPassword,
  showConfirmPassword,
  onPasswordChange,
  onConfirmChange,
  onTogglePassword,
  onToggleConfirm
}: PasswordFieldProps) {
  return (
    <>
      {/* Password Field */}
      <div className="mb-4">
        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Create a strong password"
            className={`w-full px-3.5 py-2.5 pr-10 bg-black/50 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
              passwordError
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-700 focus:border-[#ff950e] focus:ring-[#ff950e]'
            }`}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {passwordError && (
          <p className="mt-1 text-xs text-red-400">{passwordError}</p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="mb-4">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => onConfirmChange(e.target.value)}
            placeholder="Confirm your password"
            className={`w-full px-3.5 py-2.5 pr-10 bg-black/50 backdrop-blur-sm border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors ${
              confirmError
                ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-700 focus:border-[#ff950e] focus:ring-[#ff950e]'
            }`}
          />
          <button
            type="button"
            onClick={onToggleConfirm}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {confirmError && (
          <p className="mt-1 text-xs text-red-400">{confirmError}</p>
        )}
      </div>
    </>
  );
}