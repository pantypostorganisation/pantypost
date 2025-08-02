// src/app/verify-reset-code/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import FloatingParticle from '@/components/login/FloatingParticle';

export default function VerifyResetCodePage() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Get email from session storage
    const storedEmail = sessionStorage.getItem('resetEmail');
    console.log('Verify Reset Code Page - Stored email:', storedEmail);
    console.log('Verify Reset Code Page - needsEmail before:', needsEmail);
    
    if (!storedEmail) {
      // If no email in session, ask for it
      console.log('No email found, setting needsEmail to true');
      setNeedsEmail(true);
    } else {
      console.log('Email found:', storedEmail);
      setEmail(storedEmail);
    }
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode })
      });

      const result = await response.json();

      if (result.success) {
        // Store verification data for the next step
        sessionStorage.setItem('resetCode', fullCode);
        router.push('/reset-password-final');
      } else {
        setError(result.error?.message || 'Invalid verification code');
        // Clear code on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    router.push('/forgot-password');
  };

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
            <h1 className="text-2xl font-bold text-white mb-1">Enter Verification Code</h1>
            <p className="text-gray-400 text-sm">
              {email ? (
                <>We sent a 6-digit code to <span className="text-[#ff950e]">{email}</span></>
              ) : (
                'Enter your email and verification code'
              )}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 shadow-xl">
            {needsEmail ? (
              // Email input form
              <form onSubmit={(e) => {
                e.preventDefault();
                if (emailInput) {
                  sessionStorage.setItem('resetEmail', emailInput);
                  setEmail(emailInput);
                  setNeedsEmail(false);
                }
              }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the email address where you received the verification code
                  </p>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] text-black font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Code expires in 15 minutes
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || code.some(d => !d)}
                  className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={{ color: isLoading || code.some(d => !d) ? undefined : '#000' }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      Verify Code
                    </>
                  )}
                </button>

                {/* Resend Code */}
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

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600 transition-all duration-500">
            <span>🔒 Secure</span>
            <span>🛡️ 2FA Protected</span>
            <span>✓ Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}