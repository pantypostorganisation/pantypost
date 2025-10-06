// src/app/verify-email-pending/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';

export default function VerifyEmailPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  useEffect(() => {
    // Get email and username from query params (passed from signup)
    const emailParam = searchParams.get('email');
    const usernameParam = searchParams.get('username');
    
    if (emailParam) setEmail(decodeURIComponent(emailParam));
    if (usernameParam) setUsername(decodeURIComponent(usernameParam));
    
    // If no email provided, redirect to signup
    if (!emailParam) {
      router.push('/signup');
    }
    // No cleanup needed, but return undefined explicitly
    return undefined;
  }, [searchParams, router]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (isResending || resendCooldown > 0) return;
    
    setIsResending(true);
    setResendError('');
    setResendSuccess(false);
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResendSuccess(true);
        setResendCooldown(60); // 60 second cooldown
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        setResendError(data.error?.message || 'Failed to resend email');
      }
    } catch (error) {
      setResendError('Network error. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setVerifyError('Please enter a valid 6-digit code');
      return;
    }
    
    setIsVerifying(true);
    setVerifyError('');
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store token if provided
        if (data.data?.token) {
          localStorage.setItem('auth_token', data.data.token);
          sessionStorage.setItem('auth_tokens', JSON.stringify({
            token: data.data.token,
            refreshToken: data.data.refreshToken || data.data.token
          }));
        }
        
        // Redirect to success page
        router.push('/email-verified');
      } else {
        setVerifyError(data.error?.message || 'Invalid verification code');
      }
    } catch (error) {
      setVerifyError('Network error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(value);
    setVerifyError('');
  };

  // Mask email for display
  const maskedEmail = email ? 
    email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => 
      a + b.replace(/./g, '*').slice(0, -2) + b.slice(-2) + c
    ) : '';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#ff950e]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#ff950e]/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="PantyPost"
            className="w-32 h-32 mx-auto mb-4 drop-shadow-2xl"
            onClick={() => router.push('/')}
            style={{ cursor: 'pointer' }}
          />
        </div>

        {/* Main Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#ff950e]/20 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-[#ff950e]" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Verify Your Email
          </h1>
          
          {/* Description */}
          <p className="text-gray-400 text-center mb-6">
            We've sent a verification email to:
          </p>
          
          {/* Email Display */}
          <div className="bg-black/30 border border-gray-800 rounded-lg p-3 mb-6">
            <p className="text-[#ff950e] text-center font-mono text-sm">
              {maskedEmail}
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-300">
                Check your inbox for an email from PantyPost
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-300">
                Click the verification link in the email
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <p className="text-sm text-gray-300">
                Or enter the 6-digit code below
              </p>
            </div>
          </div>

          {/* Code Input Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Have a verification code?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                className="flex-1 px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white text-center font-mono text-lg placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e]"
              />
              <button
                onClick={handleVerifyCode}
                disabled={verificationCode.length !== 6 || isVerifying}
                className="px-4 py-2 bg-[#ff950e] hover:bg-[#ff6b00] disabled:bg-gray-700 text-black disabled:text-gray-400 font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {isVerifying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                Verify
              </button>
            </div>
            {verifyError && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {verifyError}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-gray-900/50 text-gray-500">OR</span>
            </div>
          </div>

          {/* Resend Section */}
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-3">
              Didn't receive the email? Check your spam folder or
            </p>
            
            {resendSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
              >
                <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Verification email sent successfully!
                </p>
              </motion.div>
            )}
            
            {resendError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
              >
                <p className="text-sm text-red-400 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {resendError}
                </p>
              </motion.div>
            )}
            
            <button
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              className="text-[#ff950e] hover:text-[#ff6b00] disabled:text-gray-500 font-medium text-sm transition-colors flex items-center gap-2 mx-auto"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : resendCooldown > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  Resend in {resendCooldown}s
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Resend verification email
                </>
              )}
            </button>
          </div>

          {/* Timer Notice */}
          <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-400 flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5" />
              <span>
                The verification link expires in 24 hours. After that, you'll need to request a new one.
              </span>
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500">
            Wrong email?{' '}
            <button
              onClick={() => router.push('/signup')}
              className="text-[#ff950e] hover:text-[#ff6b00] font-medium"
            >
              Sign up again
            </button>
          </p>
          <p className="text-sm text-gray-500">
            Already verified?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-[#ff950e] hover:text-[#ff6b00] font-medium"
            >
              Log in
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}