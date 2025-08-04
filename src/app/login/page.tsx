// src/app/login/page.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Eye, EyeOff, User, ShoppingBag, Crown, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthReady, user, error: authError, clearError, loading: authLoading } = useAuth();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'admin'>('buyer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthReady && user) {
      console.log('[Login] User already logged in, redirecting...');
      router.replace('/');
    }
  }, [isAuthReady, user, router]);

  // Sync auth errors
  useEffect(() => {
    if (authError) {
      setError(authError);
      setIsLoading(false);
    }
  }, [authError]);

  // Clear errors when user types
  const handleInputChange = useCallback((field: 'username' | 'password', value: string) => {
    if (field === 'username') {
      setUsername(value);
    } else {
      setPassword(value);
    }
    
    // Clear errors
    setError('');
    if (clearError) {
      clearError();
    }
  }, [clearError]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('[Login] Attempting login...');
      const success = await login(username.trim(), password, role);
      
      if (success) {
        console.log('[Login] Success! Redirecting...');
        // The auth context will handle the redirect
      } else {
        // Error will be set by auth context
        console.log('[Login] Failed');
      }
    } catch (err) {
      console.error('[Login] Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [username, password, role, login]);

  // Handle Enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as any);
    }
  }, [isLoading, handleSubmit]);

  // Loading state
  if (!mounted || !isAuthReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-[#ff950e] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-orange-500/10"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-[128px]"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500/20 rounded-full blur-[128px]"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400">Log in to your PantyPost account</p>
          </div>

          {/* Form Card */}
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-800">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-all"
                  disabled={isLoading || authLoading}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-all pr-12"
                    disabled={isLoading || authLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Login as
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`p-3 rounded-lg border transition-all ${
                      role === 'buyer'
                        ? 'bg-[#ff950e]/20 border-[#ff950e] text-[#ff950e]'
                        : 'bg-black/30 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                    disabled={isLoading || authLoading}
                  >
                    <ShoppingBag className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">Buyer</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setRole('seller')}
                    className={`p-3 rounded-lg border transition-all ${
                      role === 'seller'
                        ? 'bg-[#ff950e]/20 border-[#ff950e] text-[#ff950e]'
                        : 'bg-black/30 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                    disabled={isLoading || authLoading}
                  >
                    <User className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">Seller</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-3 rounded-lg border transition-all ${
                      role === 'admin'
                        ? 'bg-[#ff950e]/20 border-[#ff950e] text-[#ff950e]'
                        : 'bg-black/30 border-gray-700 text-gray-400 hover:border-gray-600'
                    }`}
                    disabled={isLoading || authLoading}
                  >
                    <Crown className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs">Admin</span>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || authLoading || !username || !password}
                className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading || authLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Log in as {role}</span>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm">
                <Link href="/forgot-password" className="text-gray-400 hover:text-[#ff950e] transition-colors">
                  Forgot password?
                </Link>
              </p>
              
              <p className="text-base text-gray-500">
                Don't have an account?{' '}
                <Link href="/signup" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600">
            <span>🔒 Secure</span>
            <span>🛡️ Encrypted</span>
            <span>✓ Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}