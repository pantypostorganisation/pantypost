// src/app/email-verified/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, ShoppingBag, User, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function EmailVerifiedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | null>(null);

  useEffect(() => {
    // Trigger confetti animation
    const triggerConfetti = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ff950e', '#ff6b00', '#ffb347', '#ffd700']
      });
    };

    // Delay confetti slightly for better effect
    const confettiTimer = setTimeout(triggerConfetti, 500);

    // Get role from URL params (passed from verify-email page)
    const roleParam = searchParams.get('role');
    console.log('[Email Verified] Role from URL:', roleParam);
    
    if (roleParam) {
      setUserRole(roleParam as 'buyer' | 'seller');
    } else {
      // Default to buyer if no role specified
      setUserRole('buyer');
    }

    return () => clearTimeout(confettiTimer);
  }, [searchParams]);

  useEffect(() => {
    // Countdown timer for auto-redirect
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    // When countdown reaches 0, redirect to homepage
    handleContinue();
    // No cleanup needed for this path
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  const handleContinue = () => {
    // Always redirect to homepage - user is already logged in!
    router.push('/');
  };

  const features = userRole === 'seller' ? [
    { icon: User, text: 'Create and manage your listings' },
    { icon: ShoppingBag, text: 'Connect with interested buyers' },
    { icon: Sparkles, text: 'Build your reputation and earn' }
  ] : [
    { icon: ShoppingBag, text: 'Browse exclusive listings' },
    { icon: User, text: 'Connect with verified sellers' },
    { icon: Sparkles, text: 'Enjoy a safe, premium experience' }
  ];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      
      {/* Animated Orbs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-[#ff950e]/20 rounded-full blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"
        animate={{
          x: [0, -30, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 w-full max-w-2xl"
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
        </div>

        {/* Success Card - matching login/signup style */}
        <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 md:p-12 shadow-xl">
          {/* Success Icon */}
          <motion.div
            className="flex justify-center mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              delay: 0.2, 
              type: "spring",
              stiffness: 200,
              damping: 10
            }}
          >
            <div className="relative">
              <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              {/* Pulse effect */}
              <div className="absolute inset-0 w-24 h-24 bg-green-500/20 rounded-full animate-ping" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Welcome to PantyPost! 🎉
            </h1>
            <p className="text-lg text-gray-300">
              Your email has been verified successfully
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            className="grid md:grid-cols-3 gap-4 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="text-center p-4 bg-black/30 rounded-xl border border-gray-800"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <div className="w-10 h-10 bg-[#ff950e]/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-[#ff950e]" />
                  </div>
                  <p className="text-sm text-gray-300">{feature.text}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <button
              onClick={handleContinue}
              className="w-full py-4 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] text-black font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 group hover:scale-[1.02] active:scale-[0.98]"
              style={{ color: '#000' }}
            >
              <span className="text-lg">
                Get Started
              </span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Auto-redirecting in{' '}
                <span className="text-[#ff950e] font-semibold">{countdown}</span>{' '}
                seconds...
              </p>
            </div>
          </motion.div>

          {/* Additional Options */}
          <motion.div
            className="mt-8 pt-8 border-t border-gray-800"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => router.push(userRole === 'seller' ? '/sellers/profile' : '/buyers/profile')}
                className="py-3 px-4 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm"
              >
                Complete Your Profile
              </button>
              <button
                onClick={() => router.push(userRole === 'seller' ? '/sellers/verify' : '/browse')}
                className="py-3 px-4 bg-gray-800/50 hover:bg-gray-800 text-white rounded-lg transition-colors text-sm"
              >
                {userRole === 'seller' ? 'Get Verified' : 'Start Browsing'}
              </button>
            </div>
          </motion.div>

          {/* Tips */}
          <motion.div
            className="mt-8 p-4 bg-[#ff950e]/10 border border-[#ff950e]/20 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <p className="text-sm text-[#ff950e] font-semibold mb-2">
              💡 Pro Tip
            </p>
            <p className="text-xs text-gray-300">
              {userRole === 'seller' 
                ? 'Complete your profile and get verified to increase your visibility and build trust with buyers.'
                : 'Add items to your favorites and follow your favorite sellers to get notified of new listings.'}
            </p>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <p className="text-sm text-gray-500">
            Need help getting started?{' '}
            <a href="/help" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
              Visit our Help Center
            </a>
          </p>
        </motion.div>

        {/* Trust Indicators - matching login/signup style */}
        <motion.div
          className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
        >
          <span>🔒 Secure</span>
          <span>🛡️ Encrypted</span>
          <span>✓ Verified</span>
        </motion.div>
      </motion.div>

      {/* Celebration Sparkles */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#ff950e]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}