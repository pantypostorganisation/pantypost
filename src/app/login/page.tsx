// src/app/login/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // ✅ FIXED: Use AuthContext
import { User, ShoppingBag, Crown, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Enhanced floating particle component with smooth movement
const FloatingParticle = ({ delay = 0, index = 0 }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  // Memoize particle properties to prevent recalculation on every render
  const particleProps = useMemo(() => ({
    size: Math.random() * 2 + 1, // Size between 1px and 3px
    opacity: Math.random() * 0.3 + 0.1, // Opacity between 0.1 and 0.4
    glowIntensity: Math.random() * 0.5 + 0.2, // Glow intensity
  }), [index]);

  // Memoize color selection
  const particleColor = useMemo(() => {
    const colors = [
      { bg: 'bg-[#ff950e]', hex: '#ff950e' }, // Orange
      { bg: 'bg-[#ff6b00]', hex: '#ff6b00' }, // Orange variant
      { bg: 'bg-white', hex: '#ffffff' },     // White
      { bg: 'bg-[#ffb347]', hex: '#ffb347' }, // Light orange
      { bg: 'bg-[#ffa500]', hex: '#ffa500' }  // Another orange variant
    ];
    return colors[index % colors.length];
  }, [index]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
      
      // Set initial random position
      setPosition({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight
      });

      // Set initial random velocity (speed and direction)
      velocityRef.current = {
        x: (Math.random() - 0.5) * 0.8, // Random speed between -0.4 and 0.4
        y: (Math.random() - 0.5) * 0.8
      };
      
      // Add window resize handler
      const handleResize = () => {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Smooth animation loop
  useEffect(() => {
    const animateParticle = () => {
      setPosition(prev => {
        let newX = prev.x + velocityRef.current.x;
        let newY = prev.y + velocityRef.current.y;
        
        // Bounce off edges and slightly randomize velocity
        if (newX <= 0 || newX >= dimensions.width) {
          velocityRef.current.x = -velocityRef.current.x + (Math.random() - 0.5) * 0.1;
          newX = Math.max(0, Math.min(dimensions.width, newX));
        }
        
        if (newY <= 0 || newY >= dimensions.height) {
          velocityRef.current.y = -velocityRef.current.y + (Math.random() - 0.5) * 0.1;
          newY = Math.max(0, Math.min(dimensions.height, newY));
        }

        // Add slight random drift to make movement more organic
        if (Math.random() < 0.02) { // 2% chance each frame
          velocityRef.current.x += (Math.random() - 0.5) * 0.1;
          velocityRef.current.y += (Math.random() - 0.5) * 0.1;
          
          // Keep velocity within reasonable bounds
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

  // Create proper hex color with alpha for box shadow
  const glowColor = `${particleColor.hex}${Math.floor(particleProps.glowIntensity * 255).toString(16).padStart(2, '0')}`;

  return (
    <div
      className={`absolute ${particleColor.bg} rounded-full transition-opacity duration-1000 pointer-events-none`}
      style={{
        left: position.x,
        top: position.y,
        width: particleProps.size,
        height: particleProps.size,
        opacity: particleProps.opacity,
        filter: `blur(0.5px)`,
        boxShadow: `0 0 ${particleProps.glowIntensity * 10}px ${glowColor}`,
        transform: 'translate(-50%, -50%)', // Center the particle on its position
      }}
    />
  );
};

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthReady, user } = useAuth(); // ✅ FIXED: Use AuthContext

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
      const success = await login(username.trim(), role);
      
      if (success) {
        // Add a small delay to ensure login context updates
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Force redirect to home page
        router.push('/');
      } else {
        setError('Login failed. Please try again.');
      }
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
      {/* Enhanced Floating Particles Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={0} // Remove staggered delays so all particles move immediately
            index={i}
          />
        ))}
      </div>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/50 pointer-events-none" />

      {/* Secret Admin Crown - Bottom Right */}
      <button
        onClick={handleCrownClick}
        className={`fixed bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-50 hover:scale-110 active:scale-95 ${
          showAdminMode 
            ? 'bg-[#ff950e]/20 text-[#ff950e] border border-[#ff950e]/50' 
            : 'bg-black/50 text-gray-600 hover:text-gray-400 border border-gray-800 hover:border-gray-600'
        }`}
        style={{
          opacity: showAdminMode ? 1 : 0.2,
          transform: showAdminMode ? 'scale(1)' : 'scale(0.7)'
        }}
      >
        <Crown className="w-5 h-5" />
      </button>

      {/* Main Content */}
      <div className={`relative z-10 flex items-center justify-center p-4 ${step === 1 ? 'min-h-[90vh] pt-4' : 'min-h-screen py-4'}`}>
        <div className="w-full max-w-md">
          {/* Header */}
          <div 
            className={`text-center transition-all duration-500 ${step === 1 ? 'mb-4' : 'mb-8'}`}
          >
            <div className={`flex justify-center ${step === 1 ? 'mb-3' : 'mb-6'}`}>
              <img 
                src="/logo.png" 
                alt="PantyPost" 
                className="object-contain drop-shadow-2xl transition-all duration-500 hover:drop-shadow-[0_0_20px_rgba(255,149,14,0.4)] cursor-pointer hover:scale-105 active:scale-95"
                style={{ width: '220px', height: '220px' }}
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

            {/* Admin Mode Indicator - Fixed CSS */}
            {showAdminMode && (
              <div className="mt-4 text-xs text-[#ff950e] font-medium animate-pulse">
                🔐 Admin Mode Enabled
              </div>
            )}
          </div>

          {/* Form Card */}
          <div 
            className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 shadow-xl transition-all duration-500"
          >
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg transition-all duration-300">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Step Content */}
            <div className="transition-all duration-300">
              {step === 1 && (
                <div className="transition-all duration-300">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={handleKeyPress} // Changed from onKeyPress (deprecated)
                      placeholder="Enter your username"
                      className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors"
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={handleUsernameSubmit}
                    disabled={!username.trim()}
                    className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                    style={{ color: !username.trim() ? undefined : '#000' }}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="transition-all duration-300">
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
                            className={`w-full p-3 rounded-lg border transition-all duration-200 text-left relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] ${
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
                              <div className={`p-2 rounded-lg transition-colors ${
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
                    className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
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
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 transition-all duration-500">
            <p className="text-base text-gray-500">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>

          {/* Trust Indicators */}
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
