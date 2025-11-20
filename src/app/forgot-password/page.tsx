// src/app/forgot-password/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, User, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import FloatingParticle from '@/components/login/FloatingParticle';
import { authService } from '@/services/auth.service';
import { sanitizeStrict } from '@/utils/security/sanitization';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const redirectTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for prefilled email/username from login flow
    try {
      const prefillEmail = sessionStorage.getItem('prefillEmail');
      const resetEmail = sessionStorage.getItem('resetEmail');
      
      if (prefillEmail) {
        setEmailOrUsername(prefillEmail);
        sessionStorage.removeItem('prefillEmail');
      } else if (resetEmail) {
        setEmailOrUsername(resetEmail);
      }
    } catch (err) {
      console.error('Error checking prefill:', err);
    }
    
    // Cleanup any pending timer on unmount so we don't push after unmounting
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // NEW: Auto-redirect if password reset was completed in another tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        try {
          const resetComplete = localStorage.getItem('resetComplete');
          if (resetComplete === 'true') {
            console.log('[Forgot Password] Reset completed in another tab, redirecting to login...');
            localStorage.removeItem('resetComplete');
            localStorage.removeItem('resetPending');
            router.push('/login');
          }
        } catch (err) {
          console.error('[Forgot Password] Error checking reset status:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Check immediately on mount
    handleVisibilityChange();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Sanitize & normalize input
    const cleanedInput = sanitizeStrict(emailOrUsername).trim();

    // Basic validation
    if (!cleanedInput) {
      setError('Please enter your email address or username');
      return;
    }

    // Check if it's an email or username
    const isEmail = cleanedInput.includes('@');
    
    if (isEmail) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanedInput.toLowerCase())) {
        setError('Please enter a valid email address');
        return;
      }
    } else {
      // Validate username format
      if (cleanedInput.length < 3 || cleanedInput.length > 20) {
        setError('Username must be between 3 and 20 characters');
        return;
      }
      if (!/^[a-zA-Z0-9._-]+$/.test(cleanedInput)) {
        setError('Username can only contain letters, numbers, periods, underscores, and hyphens');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(cleanedInput);

      if (response.success) {
        // Store the email from response if provided, otherwise use the input if it was an email
        const email = response.data?.email || (isEmail ? cleanedInput.toLowerCase() : '');
        
        setSuccess(true);
        setSentToEmail(email);
        
        // Store email in session storage for the next step
        if (email) {
          try {
            sessionStorage.setItem('resetEmail', email);
          } catch {
            // ignore storage errors (private mode, etc.)
          }
        }

        // NEW: Set localStorage flag that reset is pending
        try {
          localStorage.setItem('resetPending', 'true');
        } catch (err) {
          console.error('[Forgot Password] Error setting resetPending flag:', err);
        }
        
        // FIXED: Navigate to code verification page with email in URL after 2 seconds
        redirectTimerRef.current = window.setTimeout(() => {
          const params = new URLSearchParams();
          if (email) {
            params.set('email', email);
          }
          router.push(`/verify-reset-code?${params.toString()}`);
        }, 2000);
      } else {
        setError(response.error?.message || 'Failed to send reset code. Please try again.');
      }
    } catch {
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
          <h2 className="text-2xl font-bold text-white mb-2">Verification Code Sent!</h2>
          <p className="text-gray-400 mb-6">
            {sentToEmail ? (
              <>
                We've sent a 6-digit verification code to{' '}
                <span className="text-[#ff950e] font-medium">{sentToEmail}</span>
              </>
            ) : (
              'If that account exists, we\'ve sent a verification code to the registered email address.'
            )}
          </p>
          <p className="text-sm text-gray-500 mb-4">Please check your email inbox for the code.</p>
          <p className="text-xs text-gray-600" aria-live="polite">
            Redirecting to verification page...
          </p>
        </div>
      </div>
    );
  }

  // Main form - matching login page layout exactly
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

      {/* Main Content - matching login page structure */}
      <div className="relative z-10 flex items-center justify-center p-4 min-h-[90vh] pt-4">
        <div className="w-full max-w-md">
          {/* Header - matching login page exactly */}
          <div className="text-center mb-4">
            <div className="flex justify-center mb-3">
              <img
                src="/logo.png"
                alt="PantyPost"
                className="object-contain drop-shadow-2xl transition-all duration-500 hover:drop-shadow-[0_0_20px_rgba(255,149,14,0.4)] cursor-pointer hover:scale-105 active:scale-95"
                style={{ width: '220px', height: '220px' }}
                onClick={() => router.push('/')}
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Forgot Your Password?</h1>
            <p className="text-gray-400 text-sm">No worries! We'll send you a verification code.</p>
          </div>

          {/* Form Card - matching login page */}
          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 shadow-xl transition-all duration-500">
            <form onSubmit={handleSubmit} noValidate>
              {/* Error display */}
              {error && (
                <div
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in duration-200"
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {/* Email or Username Field */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="emailOrUsername">
                  Email Address or Username
                </label>
                <div className="relative">
                  <input
                    id="emailOrUsername"
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="Enter email or username"
                    className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors pl-10"
                    disabled={isLoading}
                    autoFocus
                    autoComplete="username email"
                  />
                  {emailOrUsername.includes('@') ? (
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  ) : (
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  We'll send a 6-digit verification code to your registered email address.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !emailOrUsername}
                className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                style={{ color: isLoading || !emailOrUsername ? undefined : '#000' }}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Verification Code
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer - matching login page structure */}
          <div className="text-center mt-6 space-y-3 transition-all duration-500">
            <p className="text-sm">
              <Link href="/login" className="text-gray-400 hover:text-[#ff950e] transition-colors">
                Back to Login
              </Link>
            </p>

            <p className="text-base text-gray-500">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>

          {/* Trust Indicators - matching login page */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600 transition-all duration-500">
            <span>🔒 Secure</span>
            <span>🛡️ Encrypted</span>
            <span>✓ Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
