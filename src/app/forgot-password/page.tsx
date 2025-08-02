// src/app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import FloatingParticle from '@/components/login/FloatingParticle';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        setSuccess(true);
      } else {
        setError(response.error?.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-black overflow-hidden relative flex items-center justify-center">
        {/* Floating Particles Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 35 }).map((_, i) => (
            <FloatingParticle key={i} delay={0} index={i} />
          ))}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/50 pointer-events-none" />

        {/* Success Message */}
        <div className="relative z-10 bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 shadow-xl max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Check Your Email!</h2>
          <p className="text-gray-400 mb-6">
            If an account exists with <span className="text-[#ff950e] font-medium">{email}</span>, we've sent password reset instructions to your inbox.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Don't see the email? Check your spam folder or try again.
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <FloatingParticle key={i} delay={0} index={i} />
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/50 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/logo.png" 
                alt="PantyPost" 
                className="object-contain drop-shadow-2xl transition-all duration-500 hover:drop-shadow-[0_0_20px_rgba(255,149,14,0.4)] cursor-pointer hover:scale-105 active:scale-95"
                style={{ width: '180px', height: '180px' }}
                onClick={() => router.push('/')}
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Forgot Your Password?</h1>
            <p className="text-gray-400 text-sm">
              No worries! We'll send you reset instructions.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 shadow-xl">
            <form onSubmit={handleSubmit}>
              {/* Error display */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors pl-10"
                    disabled={isLoading}
                    autoFocus
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  We'll send a password reset link to this email address.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                style={{ color: isLoading || !email ? undefined : '#000' }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Sending Reset Link...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Reset Link
                  </>
                )}
              </button>

              {/* Back to Login Link */}
              <div className="flex items-center justify-between mt-6">
                <Link 
                  href="/login" 
                  className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back to Login
                </Link>
                <Link 
                  href="/signup" 
                  className="text-[#ff950e] hover:text-[#ff6b00] text-sm font-medium transition-colors"
                >
                  Create Account
                </Link>
              </div>
            </form>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600 transition-all duration-500">
            <span>🔒 Secure</span>
            <span>🛡️ Encrypted</span>
            <span>✓ Private</span>
          </div>
        </div>
      </div>
    </div>
  );
}