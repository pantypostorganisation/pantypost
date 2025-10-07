// src/app/verify-email/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { authService } from '@/services/auth.service';

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
      
      console.log('[Verify Email] Starting verification...');
      console.log('[Verify Email] Token from URL:', token ? 'Present' : 'Missing');
      
      if (!token) {
        console.log('[Verify Email] No token provided');
        setVerificationStatus('error');
        setErrorMessage('No verification token provided. Please check your email for the correct link.');
        return;
      }

      try {
        console.log('[Verify Email] Calling authService.verifyEmail...');
        const response = await authService.verifyEmail(token, false);
        console.log('[Verify Email] Response:', response);

        if (response.success && response.data) {
          console.log('[Verify Email] Verification successful!');
          setVerificationStatus('success');

          // Redirect to success page after a short delay
          setTimeout(() => {
            const tokenParam = response.data?.token ? `?token=${encodeURIComponent(response.data.token)}` : '';
            console.log('[Verify Email] Redirecting to email-verified page...');
            router.push(`/email-verified${tokenParam}`);
          }, 2000);
        } else {
          console.log('[Verify Email] Verification failed:', response.error);
          setVerificationStatus('error');
          setErrorMessage(response.error?.message || 'Failed to verify email. The link may be expired or invalid.');
        }
      } catch (error) {
        console.error('[Verify Email] Verification error:', error);
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
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Enhanced Floating Particles Background - matching login/signup */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <FloatingParticle key={i} delay={0} index={i} />
        ))}
      </div>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/50 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center p-4 min-h-screen">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
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
          </div>

          {/* Status Card - matching login/signup style */}
          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 shadow-xl">
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
                    className="w-full py-3 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] text-black font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ color: '#000' }}
                  >
                    <Mail className="w-4 h-4" />
                    Request New Verification Email
                  </button>
                  
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full py-3 bg-black/50 hover:bg-black/70 text-white font-semibold rounded-lg transition-all duration-200 border border-gray-700 hover:border-gray-600"
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

          {/* Footer - matching login/signup style */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-sm text-gray-500">
              Having trouble?{' '}
              <a 
                href="mailto:support@pantypost.com" 
                className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors"
              >
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
        </motion.div>
      </div>
    </div>
  );
}