// src/components/login/PasswordStep.tsx
'use client';

import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface PasswordStepProps {
  username: string;
  password: string;
  error: string | null;
  onPasswordChange: (password: string) => void;
  onBack: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  hasUser: boolean;
  isRateLimited?: boolean;
  rateLimitWaitTime?: number;
  role: 'buyer' | 'seller' | 'admin' | null;
  roleOptions: Array<{
    key: string;
    label: string;
    description: string;
    icon: any;
  }>;
  onRoleSelect: (role: string) => void;
}

export default function PasswordStep({
  username,
  password,
  error,
  onPasswordChange,
  onBack,
  onSubmit,
  isLoading,
  hasUser,
  isRateLimited = false,
  rateLimitWaitTime = 0,
  role,
  roleOptions,
  onRoleSelect
}: PasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  // Format wait time for display
  const formatWaitTime = (totalSeconds: number): string => {
    if (totalSeconds < 60) {
      return `${totalSeconds} second${totalSeconds === 1 ? '' : 's'}`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} minute${minutes === 1 ? '' : 's'} ${seconds} second${seconds === 1 ? '' : 's'}`;
  };

  // Basic sanitization for password
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/<[^>]*>/g, ''); // Remove HTML tags
    onPasswordChange(value);
  };

  // Handle Enter key in password field
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && password && role && !isLoading && !isRateLimited) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  // Handle form submission - FIXED
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[PasswordStep] Form submitted', { 
      password: !!password, 
      role, 
      isLoading, 
      isRateLimited,
      onSubmitType: typeof onSubmit,
      onSubmitExists: !!onSubmit
    });
    
    if (!isLoading && !isRateLimited && role) {
      console.log('[PasswordStep] Calling onSubmit...');
      try {
        onSubmit(e);
      } catch (error) {
        console.error('[PasswordStep] Error calling onSubmit:', error);
      }
    } else {
      console.log('[PasswordStep] Not submitting because:', {
        isLoading,
        isRateLimited,
        hasPassword: !!password,
        hasRole: !!role
      });
    }
  };
  
  return (
    <div className="transition-all duration-300">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="mb-4 text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2"
      >
        ← Back to username
      </button>

      {/* Username Display */}
      <div className="mb-4 p-3 bg-[#ff950e]/10 border border-[#ff950e]/30 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Signing in as:</span>
          <span className="text-[#ff950e] font-medium">{username}</span>
        </div>
      </div>

      {/* Error display */}
      {error && !error.includes('Too many') && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Rate limit warning */}
      {((isRateLimited && rateLimitWaitTime > 0) || (error && error.includes('Too many'))) && (
        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-orange-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Too many attempts. Please wait {formatWaitTime(rateLimitWaitTime || 0)} before trying again.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Remove the TEST BUTTON section - it's not needed */}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password (Optional)
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter any password (not validated)"
              className="w-full px-4 py-3 pr-10 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors"
              autoFocus
              disabled={isLoading || isRateLimited}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              disabled={isLoading || isRateLimited}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Demo mode: Enter any password, it's not validated by the backend
          </p>
        </div>

        {/* Role Selection */}
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
                  type="button"
                  onClick={() => onRoleSelect(option.key)}
                  disabled={isLoading || isRateLimited}
                  className={`w-full p-3 rounded-lg border transition-all duration-200 text-left relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] ${
                    isLoading || isRateLimited ? 'opacity-50 cursor-not-allowed' : ''
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
          type="submit"
          disabled={!role || isLoading || hasUser || isRateLimited}
          className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={{ color: (!role || isLoading || hasUser || isRateLimited) ? undefined : '#000' }}
        >
          {isRateLimited ? (
            <>
              <AlertCircle className="w-4 h-4" />
              Too Many Attempts
            </>
          ) : isLoading ? (
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
      </form>

      {/* Timeout safety mechanism */}
      {isLoading && !isRateLimited && (
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