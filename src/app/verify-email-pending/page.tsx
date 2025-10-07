// src/app/verify-email-pending/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { buildApiUrl } from '@/services/api.config';
import { useAuth } from '@/context/AuthContext';

// Floating particle component - matching login/signup style
function FloatingParticle({ delay = 0, index = 0 }: { delay?: number; index?: number }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      setPosition({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight
      });
      velocityRef.current = {
        x: (Math.random() - 0.5) * 0.8,
        y: (Math.random() - 0.5) * 0.8
      };
      
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined;
  }, []);

  useEffect(() => {
    const animateParticle = () => {
      setPosition(prev => {
        let newX = prev.x + velocityRef.current.x;
        let newY = prev.y + velocityRef.current.y;
        
        if (newX <= 0 || newX >= dimensions.width) {
          velocityRef.current.x = -velocityRef.current.x + (Math.random() - 0.5) * 0.1;
          newX = Math.max(0, Math.min(dimensions.width, newX));
        }
        
        if (newY <= 0 || newY >= dimensions.height) {
          velocityRef.current.y = -velocityRef.current.y + (Math.random() - 0.5) * 0.1;
          newY = Math.max(0, Math.min(dimensions.height, newY));
        }

        if (Math.random() < 0.02) {
          velocityRef.current.x += (Math.random() - 0.5) * 0.1;
          velocityRef.current.y += (Math.random() - 0.5) * 0.1;
          velocityRef.current.x = Math.max(-1, Math.min(1, velocityRef.current.x));
          velocityRef.current.y = Math.max(-1, Math.min(1, velocityRef.current.y));
        }
        
        return { x: newX, y: newY };
      });

      animationRef.current = requestAnimationFrame(animateParticle);
    };

    animationRef.current = requestAnimationFrame(animateParticle);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [dimensions]);

  const colors = ['bg-[#ff950e]/30', 'bg-[#ff950e]/20', 'bg-white/20', 'bg-white/30', 'bg-[#ff6b00]/25'];
  const particleColor = colors[index % colors.length];
  const size = 4 + Math.random() * 4;
  const opacity = 0.3 + Math.random() * 0.4;

  return (
    <div
      className={`absolute ${particleColor} rounded-full transition-opacity duration-1000 pointer-events-none`}
      style={{
        left: position.x,
        top: position.y,
        width: size,
        height: size,
        opacity: opacity,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}

export default function VerifyEmailPendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth(); // CRITICAL: Get refreshSession from AuthContext
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    const emailParam = searchParams.get('email');
    const usernameParam = searchParams.get('username');
    
    if (emailParam) setEmail(decodeURIComponent(emailParam));
    if (usernameParam) setUsername(decodeURIComponent(usernameParam));
    
    if (!emailParam) {
      router.push('/signup');
    }
    return undefined;
  }, [searchParams, router]);

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
      const url = buildApiUrl('/auth/resend-verification');
      console.log('[Resend] Calling URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, username })
      });
      
      const data = await response.json();
      console.log('[Resend] Response:', data);
      
      if (data.success) {
        setResendSuccess(true);
        setResendCooldown(60);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        setResendError(data.error?.message || 'Failed to resend email');
      }
    } catch (error) {
      console.error('Resend error:', error);
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
      const url = buildApiUrl('/auth/verify-email');
      console.log('[Verify] Calling URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code: verificationCode })
      });
      
      const data = await response.json();
      console.log('[Verify] Response:', data);
      
      if (data.success) {
        // CRITICAL FIX: Store token in sessionStorage immediately
        if (data.data?.token) {
          const tokens = {
            token: data.data.token,
            refreshToken: data.data.refreshToken || data.data.token,
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
          };
          sessionStorage.setItem('auth_tokens', JSON.stringify(tokens));
          sessionStorage.setItem('auth_token', data.data.token);
          
          console.log('[Verify] Token stored in sessionStorage');
        }

        // Show success state
        setShowSuccess(true);

        // CRITICAL FIX: Refresh AuthContext to pick up the new token
        console.log('[Verify] Refreshing AuthContext session...');
        await refreshSession();
        console.log('[Verify] AuthContext refreshed - user is now logged in!');

        // Redirect after showing success message
        setTimeout(() => {
          console.log('[Verify] Redirecting to homepage...');
          router.push('/');
        }, 2000);
      } else {
        setVerifyError(data.error?.message || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verify error:', error);
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

  const maskedEmail = email ? 
    email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => 
      a + '*'.repeat(Math.min(b.length - 2, 8)) + (b.length > 2 ? b.slice(-2) : '') + c
    ) : '';

  if (!mounted) {
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
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
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
            <h1 className="text-2xl font-bold text-white mb-1">Verify Your Email</h1>
            <p className="text-gray-400 text-sm">Check your inbox to continue</p>
          </div>

          {/* Main Card - matching login/signup style */}
          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 shadow-xl">
            {!showSuccess ? (
              <>
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-[#ff950e]/20 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-[#ff950e]" />
                  </div>
                </div>

                {/* Email Display */}
                <div className="mb-6">
                  <p className="text-gray-400 text-center text-sm mb-3">
                    We've sent a verification email to:
                  </p>
                  <div className="bg-black/50 border border-gray-700 rounded-lg p-3">
                    <p className="text-[#ff950e] text-center font-mono text-sm break-all">
                      {maskedEmail}
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-3 mb-6 bg-black/30 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300">
                      Check your inbox for an email from PantyPost
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300">
                      Click the verification link in the email
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
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
                      className="flex-1 px-4 py-3 bg-black/50 border border-gray-700 rounded-lg text-white text-center font-mono text-lg placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors"
                    />
                    <button
                      onClick={handleVerifyCode}
                      disabled={verificationCode.length !== 6 || isVerifying}
                      className="px-6 py-3 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                      style={{ color: (verificationCode.length !== 6 || isVerifying) ? undefined : '#000' }}
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
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-red-400 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3" />
                      {verifyError}
                    </motion.p>
                  )}
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#111]/80 text-gray-500">OR</span>
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
                    className="text-[#ff950e] hover:text-[#ff6b00] disabled:text-gray-500 font-medium text-sm transition-colors flex items-center gap-2 mx-auto disabled:cursor-not-allowed"
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
                    <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      The verification link expires in 24 hours. After that, you'll need to request a new one.
                    </span>
                  </p>
                </div>
              </>
            ) : (
              // Success State
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
                  Your email has been successfully verified. You're now logged in!
                </p>
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm">
                    Redirecting you to your account...
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Links - matching login/signup style */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-sm text-gray-500">
              Wrong email?{' '}
              <button
                onClick={() => router.push('/signup')}
                className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors"
              >
                Sign up again
              </button>
            </p>
            <p className="text-base text-gray-500">
              Already verified?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors"
              >
                Log in
              </button>
            </p>
          </div>

          {/* Trust Indicators - matching login/signup style */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600">
            <span>🔒 Secure</span>
            <span>🛡️ Encrypted</span>
            <span>✓ Verified</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
