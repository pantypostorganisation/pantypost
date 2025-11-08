// src/app/verify-reset-code/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ArrowLeft, AlertCircle, Mail, Lock } from 'lucide-react';
import FloatingParticle from '@/components/login/FloatingParticle';
import PublicRouteWrapper from '@/components/PublicRouteWrapper';
import { authService } from '@/services/auth.service';

// Mark this as a public page
if (typeof window !== 'undefined') {
  (window as any).__IS_PUBLIC_PAGE__ = true;
}

function VerifyResetCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Check for email in URL params or session storage
    const checkSession = () => {
      console.log('[Verify Reset Code] Initializing page...');
      
      // First try URL params
      const emailParam = searchParams.get('email');
      console.log('[Verify Reset Code] Email from URL:', emailParam);
      
      if (emailParam) {
        setEmail(decodeURIComponent(emailParam));
        setIsReady(true);
        return;
      }
      
      // Then try session storage
      try {
        const storedEmail = sessionStorage.getItem('resetEmail');
        console.log('[Verify Reset Code] Email from session:', storedEmail);
        
        if (storedEmail) {
          setEmail(storedEmail);
          // Also update URL for consistency
          const params = new URLSearchParams();
          params.set('email', storedEmail);
          router.replace(`/verify-reset-code?${params.toString()}`);
        } else {
          console.log('[Verify Reset Code] No email found, showing email input');
          setNeedsEmail(true);
        }
      } catch (err) {
        console.error('[Verify Reset Code] Session storage error:', err);
        setNeedsEmail(true);
      }
      
      setIsReady(true);
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      checkSession();
    });
  }, [searchParams, router]);

  // NEW: Auto-redirect if password reset was completed in another tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        try {
          const resetComplete = localStorage.getItem('resetComplete');
          if (resetComplete === 'true') {
            console.log('[Verify Reset Code] Reset completed in another tab, redirecting to login...');
            localStorage.removeItem('resetComplete');
            localStorage.removeItem('resetPending');
            router.push('/login');
          }
        } catch (err) {
          console.error('[Verify Reset Code] Error checking reset status:', err);
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

  // NEW: Set localStorage flag that reset is pending
  useEffect(() => {
    if (email) {
      try {
        localStorage.setItem('resetPending', 'true');
      } catch (err) {
        console.error('[Verify Reset Code] Error setting resetPending flag:', err);
      }
    }
  }, [email]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (pastedData.length === 6 && /^\d+$/.test(pastedData)) {
      const newCode = pastedData.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use the auth service to verify the code
      const response = await authService.verifyResetCode(email, fullCode);

      if (response.success && response.data?.valid) {
        // Store both email and code for the final step
        sessionStorage.setItem('resetEmail', email);
        sessionStorage.setItem('resetCode', fullCode);
        
        // Show success briefly then redirect
        setVerificationSuccess(true);
        
        setTimeout(() => {
          // Navigate to password reset page with both email and code in URL as backup
          const params = new URLSearchParams();
          params.set('email', email);
          params.set('code', fullCode);
          router.push(`/reset-password-final?${params.toString()}`);
        }, 500);
      } else {
        setError(response.error?.message || 'Invalid verification code');
        // Clear code on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    // Clear any existing code
    setCode(['', '', '', '', '', '']);
    setError('');
    
    // Navigate back to forgot password page with email prefilled if available
    if (email) {
      sessionStorage.setItem('prefillEmail', email);
    }
    router.push('/forgot-password');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput) {
      setEmail(emailInput);
      setNeedsEmail(false);
      
      // Store in session and update URL
      sessionStorage.setItem('resetEmail', emailInput);
      const params = new URLSearchParams();
      params.set('email', emailInput);
      router.replace(`/verify-reset-code?${params.toString()}`);
    }
  };

  // Don't render until we've checked URL params
  if (!isReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#ff950e]/20 border-t-[#ff950e] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Enhanced Floating Particles Background - matching login/signup */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <FloatingParticle key={i} delay={0} index={i} />
        ))}
      </div>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/50 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo - matching login/signup style */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/logo.png" 
                alt="PantyPost" 
                className="object-contain drop-shadow-2xl transition-all duration-500 hover:drop-shadow-[0_0_20px_rgba(255,149,14,0.4)] cursor-pointer hover:scale-105 active:scale-95"
                style={{ width: '220px', height: '220px' }}
                onClick={() => router.push('/')}
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {verificationSuccess ? 'Code Verified!' : 'Enter Verification Code'}
            </h1>
            <p className="text-gray-400 text-sm">
              {verificationSuccess ? (
                'Redirecting to password reset...'
              ) : email ? (
                <>We sent a 6-digit code to <span className="text-[#ff950e]">{email}</span></>
              ) : (
                'Enter your email and verification code'
              )}
            </p>
          </div>

          {/* Form Card - matching login/signup style */}
          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 shadow-xl">
            {needsEmail ? (
              // Email input form
              <form onSubmit={handleEmailSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors pl-10"
                      required
                      autoFocus
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the email address where you received the verification code
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] text-black font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ color: '#000' }}
                >
                  Continue
                </button>
              </form>
            ) : (
              // Code verification form
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

                {/* Success message */}
                {verificationSuccess && (
                  <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-400">
                      <KeyRound className="w-4 h-4 flex-shrink-0" />
                      <span>Code verified successfully!</span>
                    </div>
                  </div>
                )}

                {/* Code Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
                    Enter 6-digit code
                  </label>
                  <div className="flex justify-center space-x-2">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        className="w-12 h-12 text-center text-xl font-semibold bg-black/50 backdrop-blur-sm border-2 border-gray-700 rounded-lg text-white focus:border-[#ff950e] focus:outline-none focus:ring-1 focus:ring-[#ff950e] transition-all"
                        autoFocus={index === 0}
                        disabled={isLoading || verificationSuccess}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Code expires in 15 minutes
                  </p>
                </div>

                {/* Submit Button - Updated text as requested */}
                <button
                  type="submit"
                  disabled={isLoading || code.some(d => !d) || verificationSuccess}
                  className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={{ color: (isLoading || code.some(d => !d) || verificationSuccess) ? undefined : '#000' }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Verifying...
                    </>
                  ) : verificationSuccess ? (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Reset Password
                    </>
                  )}
                </button>

                {/* Alternative: Direct link to reset if they have the code */}
                {!verificationSuccess && (
                  <div className="text-center mt-4">
                    <p className="text-xs text-gray-500">
                      Already verified your code?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          if (email) {
                            sessionStorage.setItem('resetEmail', email);
                            const fullCode = code.join('');
                            if (fullCode.length === 6) {
                              sessionStorage.setItem('resetCode', fullCode);
                            }
                            const params = new URLSearchParams();
                            params.set('email', email);
                            router.push(`/reset-password-final?${params.toString()}`);
                          }
                        }}
                        className="text-[#ff950e] hover:underline"
                      >
                        Go to password reset
                      </button>
                    </p>
                  </div>
                )}

                {/* Resend Code */}
                {!verificationSuccess && (
                  <div className="text-center space-y-3 mt-6">
                    <p className="text-sm text-gray-400">
                      Didn't receive the code?
                    </p>
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-[#ff950e] hover:text-[#ff6b00] text-sm font-medium transition-colors"
                    >
                      Send new code
                    </button>
                  </div>
                )}

                {/* Back to Login Link */}
                <div className="text-center mt-4">
                  <Link 
                    href="/login" 
                    className="text-gray-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Footer Links - matching login/signup style */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-sm text-gray-500">
              Need help?{' '}
              <a href="mailto:support@pantypost.com" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
                Contact Support
              </a>
            </p>
          </div>

          {/* Trust Indicators - matching login/signup style */}
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

export default function VerifyResetCodePage() {
  return (
    <PublicRouteWrapper>
      <VerifyResetCodeContent />
    </PublicRouteWrapper>
  );
}