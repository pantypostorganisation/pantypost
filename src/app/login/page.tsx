// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { User, ShoppingBag, Crown, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Floating particle component
const FloatingParticle = ({ delay = 0 }) => {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  // Random color variation - mix orange and white particles
  const colors = [
    'bg-[#ff950e]/30', // Orange
    'bg-[#ff950e]/20', // Lighter orange
    'bg-white/20',     // White
    'bg-white/30',     // Brighter white
    'bg-[#ff6b00]/25'  // Orange variant
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return (
    <motion.div
      className={`absolute w-1 h-1 ${randomColor} rounded-full`}
      initial={{ 
        x: Math.random() * dimensions.width, 
        y: dimensions.height + 10,
        opacity: 0 
      }}
      animate={{
        y: -10,
        opacity: [0, 1, 1, 0],
        x: Math.random() * dimensions.width,
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        delay: delay,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthReady, user } = useListings();

  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'admin' | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [showAdminMode, setShowAdminMode] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthReady && user) {
      // User is logged in, redirect to home
      router.replace('/');
    }
  }, [isAuthReady, user, router]);

  const handleLogin = async () => {
    if (!username.trim() || !role) {
      setError('Please complete all fields.');
      return;
    }
    if (role === 'admin' && username.trim() !== 'gerome' && username.trim() !== 'oakley') {
      setError('Invalid admin credentials.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Perform login
      login(username.trim(), role);
      
      // Add a small delay to ensure login context updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameSubmit = () => {
    if (username.trim()) {
      setError('');
      setStep(2);
    } else {
      setError('Please enter a username.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (step === 1) {
        handleUsernameSubmit();
      } else if (step === 2 && role) {
        handleLogin();
      }
    }
  };

  const goBack = () => {
    setStep(1);
    setError('');
    setRole(null);
  };

  // Handle secret admin crown click
  const handleCrownClick = () => {
    setShowAdminMode(!showAdminMode);
    if (!showAdminMode) {
      setRole(null); // Reset role when entering admin mode
    }
  };

  const roleOptions = [
    {
      key: 'buyer',
      label: 'Buyer',
      icon: ShoppingBag,
      description: 'Browse and purchase items'
    },
    {
      key: 'seller',
      label: 'Seller',
      icon: User,
      description: 'List and sell your items'
    }
  ];

  // Add admin option if admin mode is enabled
  if (showAdminMode) {
    roleOptions.push({
      key: 'admin',
      label: 'Admin',
      icon: Crown,
      description: 'Platform administration'
    });
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#ff950e]/20 border-t-[#ff950e] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.4} />
        ))}
      </div>

      {/* Secret Admin Crown - Bottom Right */}
      <motion.button
        onClick={handleCrownClick}
        className={`fixed transition-all duration-300 z-50 rounded-full flex items-center justify-center ${
          showAdminMode 
            ? 'bg-[#ff950e]/20 text-[#ff950e] border border-[#ff950e]/50' 
            : 'bg-black/50 text-gray-600 hover:text-gray-400 border border-gray-800 hover:border-gray-600'
        }`}
        style={{
          bottom: '0.8vw',
          right: '0.8vw',
          width: '1.2vw',
          height: '1.2vw',
          minWidth: '12px',
          maxWidth: '16px',
          minHeight: '12px',
          maxHeight: '16px',
          padding: '0'
        }}
        initial={{ opacity: 0.2, scale: 0.7 }}
        animate={{ 
          opacity: showAdminMode ? 1 : 0.2, 
          scale: showAdminMode ? 1 : 0.7 
        }}
        whileHover={{ 
          scale: 1.1, 
          opacity: 1,
          transition: { duration: 0.2 }
        }}
        whileTap={{ scale: 0.8 }}
      >
        <Crown style={{ width: '0.6vw', height: '0.6vw', minWidth: '6px', maxWidth: '10px', minHeight: '6px', maxHeight: '10px' }} />
      </motion.button>

      {/* Main Content */}
      <div className={`relative z-10 flex items-center justify-center p-4 ${step === 1 ? 'min-h-[90vh] pt-4' : 'min-h-screen py-4'}`}>
        <div className="w-full max-w-md">
          {/* Header */}
          <motion.div 
            className={`text-center ${step === 1 ? 'mb-4' : 'mb-8'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className={`flex justify-center ${step === 1 ? 'mb-3' : 'mb-6'}`}>
              <motion.img 
                src="/logo.png" 
                alt="PantyPost" 
                className="object-contain drop-shadow-2xl transition-all duration-500 hover:drop-shadow-[0_0_20px_rgba(255,149,14,0.4)] cursor-pointer"
                style={{ width: '220px', height: '220px' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.2,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
            <p className="text-gray-400 text-sm">Sign in to your PantyPost account</p>
            
            {/* Step Indicators */}
            <div className={`flex justify-center gap-2 ${step === 1 ? 'mt-3' : 'mt-6'}`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-[#ff950e]' : 'bg-gray-600'}`} />
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-[#ff950e]' : 'bg-gray-600'}`} />
            </div>

            {/* Admin Mode Indicator */}
            <AnimatePresence>
              {showAdminMode && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4 text-xs text-[#ff950e] font-medium"
                >
                  🔐 Admin Mode Enabled
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Form Card */}
          <motion.div 
            className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter your username"
                      className="w-full px-4 py-3 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleUsernameSubmit}
                    disabled={!username.trim()}
                    className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    style={{ color: !username.trim() ? undefined : '#000' }}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Back Button */}
                  <button
                    onClick={goBack}
                    className="mb-4 text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2"
                  >
                    ← Back to username
                  </button>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Select your role
                    </label>
                    <div className="space-y-2">
                      {roleOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = role === option.key;
                        const isAdminOption = option.key === 'admin';
                        
                        return (
                          <button
                            key={option.key}
                            onClick={() => setRole(option.key as typeof role)}
                            className={`w-full p-3 rounded-lg border transition-all duration-200 text-left relative overflow-hidden group ${
                              isSelected 
                                ? isAdminOption
                                  ? 'bg-purple-900/20 border-purple-500/70 text-white'
                                  : 'bg-[#ff950e]/10 border-[#ff950e] text-white'
                                : isAdminOption
                                  ? 'bg-purple-900/10 border-purple-500/30 text-purple-300 hover:border-purple-500/50 hover:bg-purple-900/20'
                                  : 'bg-black/50 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-black/70'
                            }`}
                          >
                            {/* Sheen Effect for All Role Options */}
                            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                            
                            <div className="flex items-center gap-3 relative z-10">
                              <div className={`p-2 rounded-lg ${
                                isSelected 
                                  ? 'bg-[#ff950e] text-black' 
                                  : isAdminOption
                                    ? 'bg-purple-800 text-purple-300'
                                    : 'bg-gray-800 text-gray-400'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium">{option.label}</p>
                                <p className="text-xs text-gray-500">{option.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={!role || isLoading || !!user}
                    className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    style={{ color: (!role || isLoading || !!user) ? undefined : '#000' }}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        Signing in...
                      </>
                    ) : user ? (
                      <>
                        <div className="w-4 h-4 text-black">✓</div>
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        Sign In
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer */}
          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="text-base text-gray-500">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <span>🔒 Secure</span>
            <span>🛡️ Encrypted</span>
            <span>✓ Verified</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
