// src/app/verify-email/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const verifyEmail = async () => {
      // Get token from URL
      const token = searchParams.get('token');
      
      if (!token) {
        setVerificationStatus('error');
        setErrorMessage('No verification token provided. Please check your email for the correct link.');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (data.success) {
          setVerificationStatus('success');
          
          // Store auth token if provided
          if (data.data?.token) {
            localStorage.setItem('auth_token', data.data.token);
            sessionStorage.setItem('auth_tokens', JSON.stringify({
              token: data.data.token,
              refreshToken: data.data.refreshToken || data.data.token
            }));
          }

          // Redirect to success page after a short delay
          setTimeout(() => {
            router.push('/email-verified');
          }, 2000);
        } else {
          setVerificationStatus('error');
          setErrorMessage(data.error?.message || 'Failed to verify email. The link may be expired or invalid.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setVerificationStatus('error');
        setErrorMessage('Network error. Please check your connection and try again.');
      }
    };

    // Start verification after a short delay for better UX
    const timer = setTimeout(() => {
      verifyEmail();
    }, 1000);

    return () => clearTimeout(timer);
  }, [mounted, searchParams, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#ff950e]/20 border-t-[#ff950e] rounded-full animate-spin"></div>
      </div>
    );
  }

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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
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

        {/* Status Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
          {verificationStatus === 'verifying' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-[#ff950e]/20 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-[#ff950e] animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Verifying Your Email
              </h2>
              <p className="text-gray-400">
                Please wait while we verify your email address...
              </p>
              <div className="mt-6 flex justify-center gap-1">
                <div className="w-2 h-2 bg-[#ff950e] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-[#ff950e] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-[#ff950e] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {verificationStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Email Verified!
              </h2>
              <p className="text-gray-400 mb-6">
                Your email has been successfully verified.
              </p>
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-400 text-sm">
                  Redirecting you to your account...
                </p>
              </div>
            </motion.div>
          )}

          {verificationStatus === 'error' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-400 mb-6">
                {errorMessage}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/verify-email-pending')}
                  className="w-full py-3 bg-[#ff950e] hover:bg-[#ff6b00] text-black font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Request New Verification Email
                </button>
                
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Go to Login
                </button>
              </div>

              <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-xs text-yellow-400">
                  Verification links expire after 24 hours. If your link has expired, please request a new one.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Having trouble?{' '}
            <a
              href="mailto:support@pantypost.com"
              className="text-[#ff950e] hover:text-[#ff6b00] font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}