// src/app/login/page.tsx
'use client';

import FloatingParticle from '@/components/login/FloatingParticle';
import LoginHeader from '@/components/login/LoginHeader';
import UsernameStep from '@/components/login/UsernameStep';
import RoleSelectionStep from '@/components/login/RoleSelectionStep'; // FIXED: Changed from PasswordStep
import AdminCrownButton from '@/components/login/AdminCrownButton';
import LoginFooter from '@/components/login/LoginFooter';
import TrustIndicators from '@/components/login/TrustIndicators';
import { useAuth } from '@/context/AuthContext'; // DIRECT AUTH CONTEXT
import { SecureForm } from '@/components/ui/SecureForm';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';
import { useState, useEffect, useRef, useCallback } from 'react';
import { getRateLimiter } from '@/utils/security/rate-limiter';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, login, loading, error, clearError } = useAuth();
  const router = useRouter();
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'admin' | null>(null); // ADDED: role state
  const [step, setStep] = useState(1); // 1 = username, 2 = role selection
  const [mounted, setMounted] = useState(false);
  const [showAdminMode, setShowAdminMode] = useState(false);
  
  // Track rate limit state
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitWaitTime, setRateLimitWaitTime] = useState(0);
  
  // Use ref to store interval ID for cleanup
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Role options configuration
  const roleOptions = [
    { key: 'buyer', label: 'Buyer', description: 'Browse and purchase items', icon: require('lucide-react').ShoppingBag },
    { key: 'seller', label: 'Seller', description: 'List and sell your items', icon: require('lucide-react').User },
    ...(showAdminMode ? [{ key: 'admin', label: 'Admin', description: 'Administrator access', icon: require('lucide-react').Shield }] : [])
  ];

  // Cleanup function to prevent memory leaks
  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Component mount/unmount
  useEffect(() => {
    setMounted(true);
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearCountdownInterval();
    };
  }, [clearCountdownInterval]);

  // Redirect if already logged in
  useEffect(() => {
    if (user && mounted) {
      console.log('[Login] User already logged in, redirecting...');
      router.push(user.role === 'admin' ? '/admin' : user.role === 'seller' ? '/seller' : '/buyer');
    }
  }, [user, mounted, router]);

  // Check rate limit status when entering role selection step
  useEffect(() => {
    if (step === 2 && username && isMountedRef.current) {
      try {
        const limiter = getRateLimiter();
        const result = limiter.check(`LOGIN:${username}`, RATE_LIMITS.LOGIN);
        
        if (!isMountedRef.current) return;
        
        if (!result.allowed && result.waitTime && result.waitTime > 0) {
          setIsRateLimited(true);
          setRateLimitWaitTime(result.waitTime);
        } else {
          setIsRateLimited(false);
          setRateLimitWaitTime(0);
        }
      } catch (error) {
        console.error('Error checking rate limit:', error);
        if (isMountedRef.current) {
          setIsRateLimited(false);
          setRateLimitWaitTime(0);
        }
      }
    }
  }, [step, username]);

  // Update rate limit status when error changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    
    if (error && error.includes('Too many login attempts')) {
      setIsRateLimited(true);
      const match = error.match(/Please wait (\d+) seconds/);
      if (match && match[1]) {
        const waitTime = parseInt(match[1], 10);
        if (!isNaN(waitTime) && waitTime > 0) {
          setRateLimitWaitTime(waitTime);
        }
      }
    } else if (!error) {
      setIsRateLimited(false);
      setRateLimitWaitTime(0);
    }
  }, [error]);

  // Countdown timer for rate limit
  useEffect(() => {
    clearCountdownInterval();

    if (isRateLimited && rateLimitWaitTime > 0 && isMountedRef.current) {
      countdownIntervalRef.current = setInterval(() => {
        if (!isMountedRef.current) {
          clearCountdownInterval();
          return;
        }
        
        setRateLimitWaitTime((prev) => {
          if (prev <= 1) {
            setIsRateLimited(false);
            clearCountdownInterval();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return clearCountdownInterval;
  }, [isRateLimited, rateLimitWaitTime, clearCountdownInterval]);

  // Handle username submission (Step 1 → Step 2)
  const handleUsernameSubmit = useCallback(() => {
    if (!username.trim()) return;
    
    clearError();
    setStep(2);
    console.log('[Login] Moving to role selection step for:', username);
  }, [username, clearError]);

  // Handle role selection submission (Step 2 → Login)
  const handleRoleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!username.trim() || !role || isRateLimited || !isMountedRef.current) {
      return;
    }
    
    try {
      console.log('[Login] Attempting login with role:', role);
      // Note: The actual login function might need to be updated to accept role
      // For now, assuming password is handled differently or not needed
      const success = await login(username.trim(), password || '', role);
      
      if (success && isMountedRef.current) {
        console.log('[Login] Login successful, redirecting...');
        // Redirect handled by useEffect above
      } else {
        console.log('[Login] Login failed');
      }
    } catch (error) {
      console.error('[Login] Login error:', error);
    }
  }, [username, password, role, login, isRateLimited]);

  // Go back to username step
  const goBack = useCallback(() => {
    setStep(1);
    setRole(null);
    clearError();
  }, [clearError]);

  // Handle crown click for admin mode
  const handleCrownClick = useCallback(() => {
    setShowAdminMode(!showAdminMode);
  }, [showAdminMode]);

  // Handle key press in username field
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUsernameSubmit();
    }
  }, [handleUsernameSubmit]);

  // Early return for unmounted state
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
            delay={0}
            index={i}
          />
        ))}
      </div>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/50 pointer-events-none" />

      {/* Secret Admin Crown - Bottom Right */}
      <AdminCrownButton 
        showAdminMode={showAdminMode} 
        onToggle={handleCrownClick} 
      />

      {/* Main Content */}
      <div className={`relative z-10 flex items-center justify-center p-4 ${step === 1 ? 'min-h-[90vh] pt-4' : 'min-h-screen py-4'}`}>
        <div className="w-full max-w-md">
          {/* Header */}
          <LoginHeader 
            step={step} 
            showAdminMode={showAdminMode} 
            onLogoClick={() => router?.push?.('/')} 
          />

          {/* Form Card */}
          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 shadow-xl transition-all duration-500">
            {/* Step Content */}
            <div className="transition-all duration-300">
              {step === 1 && (
                <UsernameStep
                  username={username}
                  error={error || ''}
                  onUsernameChange={setUsername}
                  onSubmit={handleUsernameSubmit}
                  onKeyPress={handleKeyPress}
                  isDisabled={loading}
                />
              )}

              {step === 2 && (
                <SecureForm
                  onSubmit={handleRoleSubmit}
                  rateLimitKey={`LOGIN:${username}`}
                  rateLimitConfig={RATE_LIMITS.LOGIN}
                  isRateLimited={isRateLimited}
                  rateLimitWaitTime={rateLimitWaitTime}
                >
                  <RoleSelectionStep
                    role={role}
                    error={error || ''}
                    roleOptions={roleOptions}
                    onRoleSelect={setRole}
                    onBack={goBack}
                    onSubmit={handleRoleSubmit}
                    isLoading={loading || isRateLimited}
                    hasUser={!!user}
                    isRateLimited={isRateLimited}
                    rateLimitWaitTime={rateLimitWaitTime}
                  />
                </SecureForm>
              )}
            </div>
          </div>

          {/* Footer */}
          <LoginFooter step={step} />

          {/* Trust Indicators */}
          <TrustIndicators />
        </div>
      </div>
    </div>
  );
}