// src/components/login/RoleSelectionStep.tsx
'use client';

import { Lock, AlertCircle } from 'lucide-react';
import { RoleSelectionStepProps } from '@/types/login';

export default function RoleSelectionStep({
  role,
  error,
  roleOptions,
  onRoleSelect,
  onBack,
  onSubmit,
  isLoading,
  hasUser
}: RoleSelectionStepProps) {
  return (
    <div className="transition-all duration-300">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-4 text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2"
      >
        ← Back to username
      </button>

      {/* Error display at the top - MORE VISIBLE */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Select your role
        </label>
        <div className="space-y-2">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = role === option.key;
            const isAdminOption = option.key === 'admin';
            
            return (
              <button
                key={option.key}
                onClick={() => onRoleSelect(option.key as 'buyer' | 'seller' | 'admin')}
                disabled={isLoading}
                className={`w-full p-3 rounded-lg border transition-all duration-200 text-left relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  isSelected 
                    ? isAdminOption
                      ? 'bg-purple-900/20 border-purple-500/70 text-white'
                      : 'bg-[#ff950e]/10 border-[#ff950e] text-white'
                    : isAdminOption
                      ? 'bg-purple-900/10 border-purple-500/30 text-purple-300 hover:border-purple-500/50 hover:bg-purple-900/20'
                      : 'bg-black/50 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-black/70'
                }`}
              >
                {/* Sheen Effect for All Role Options */}
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`p-2 rounded-lg transition-colors ${
                    isSelected 
                      ? 'bg-[#ff950e] text-black' 
                      : isAdminOption
                        ? 'bg-purple-800 text-purple-300'
                        : 'bg-gray-800 text-gray-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!role || isLoading || hasUser}
        className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        style={{ color: (!role || isLoading || hasUser) ? undefined : '#000' }}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
            Signing in...
          </>
        ) : hasUser ? (
          <>
            <div className="w-4 h-4 text-black">✓</div>
            Redirecting...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Sign In
          </>
        )}
      </button>

      {/* Add timeout safety mechanism */}
      {isLoading && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Taking longer than expected? <button 
            onClick={() => window.location.reload()} 
            className="text-[#ff950e] hover:underline"
          >
            Refresh page
          </button>
        </p>
      )}


    </div>

  );
}
