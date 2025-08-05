// src/app/login/page.tsx
'use client';

import FloatingParticle from '@/components/login/FloatingParticle';
import LoginHeader from '@/components/login/LoginHeader';
import UsernameStep from '@/components/login/UsernameStep';
import PasswordStep from '@/components/login/PasswordStep';
import AdminCrownButton from '@/components/login/AdminCrownButton';
import LoginFooter from '@/components/login/LoginFooter';
import TrustIndicators from '@/components/login/TrustIndicators';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, ShoppingBag, Shield } from 'lucide-react';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';
import { getRateLimiter } from '@/utils/security/rate-limiter';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthReady, user, error: authError, clearError, loading: authLoading } = useAuth();
  
  // Debug: Check if login function exists
  console.log('[Login] useAuth hook returned:', { 
    hasLogin: !!login, 
    loginType: typeof login,
    isAuthReady,
    hasUser: !!user 
  });
  
  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'admin' | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = username, 2 = password/role selection
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
    {
      key: 'buyer',
      label: 'Buyer',
      description: 'Browse and purchase items',
      icon: ShoppingBag,
    },
    {
      key: 'seller',
      label: 'Seller',
      description: 'List and manage products',
      icon: User,
    },
    ...(showAdminMode ? [{
      key: 'admin',
      label: 'Administrator',
      description: 'Full system access',
      icon: Shield,
    }] : [])
  ];

  // Set mounted state
  useEffect(() => {
    setMounted(true);
    return () => {
      isMountedRef.current = false;
      clearCountdownInterval();
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthReady && user) {
      console.log('[Login] User already logged in, redirecting...');
      router.replace('/');
    }
  }, [isAuthReady, user, router]);

  // Sync auth errors
  useEffect(() => {
    if (authError) {
      setError(authError);
      setIsLoading(false);
    }
  }, [authError]);

  // Cleanup function to prevent memory leaks
  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Check rate limit status on component mount and when username changes
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

  // Countdown timer for rate limit with proper cleanup
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

  // Handle username submit
  const handleUsernameSubmit = useCallback(() => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    
    setError('');
    if (clearError) {
      clearError();
    }
    setStep(2);
  }, [username, clearError]);

  // Handle login
  const handleLogin = useCallback(async (e?: React.FormEvent) => {
    console.log('[Login] handleLogin called', {
      hasEvent: !!e,
      username,
      role,
      isRateLimited,
      isMounted: isMountedRef.current,
      isLoading,
      hasPassword: !!password
    });

    if (e) {
      e.preventDefault();
    }
    
    // Don't proceed if rate limited
    if (isRateLimited || !isMountedRef.current) {
      console.log('[Login] Blocked by rate limit or unmounted');
      return;
    }
    
    // Validation
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    if (!role) {
      setError('Please select a role');
      return;
    }
    
    console.log('[Login] Validation passed, setting loading state');
    setIsLoading(true);
    setError('');
    
    try {
      console.log('[Login] Calling auth login function...');
      const success = await login(username.trim(), password, role);
      
      console.log('[Login] Auth login returned:', success);
      
      if (success) {
        console.log('[Login] Success! Redirecting to home...');
        // Manually redirect to home page
        router.push('/');
      } else {
        // Error will be set by auth context
        console.log('[Login] Login failed, error should be set by auth context');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[Login] Caught error:', err);
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  }, [username, password, role, login, isRateLimited, router]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      if (step === 1) {
        handleUsernameSubmit();
      }
    }
  }, [isLoading, step, handleUsernameSubmit]);

  // Handle going back
  const goBack = useCallback(() => {
    setStep(1);
    setPassword('');
    setRole(null);
    setError('');
    if (clearError) {
      clearError();
    }
  }, [clearError]);

  // Handle crown click
  const handleCrownClick = useCallback(() => {
    setShowAdminMode(!showAdminMode);
    if (showAdminMode && role === 'admin') {
      setRole('buyer');
    }
  }, [showAdminMode, role]);

  // Update state helper
  const updateState = useCallback((updates: Partial<{ username: string; password: string; role: 'buyer' | 'seller' | 'admin' | null }>) => {
    if (updates.username !== undefined) {
      setUsername(updates.username);
      setError('');
      if (clearError) {
        clearError();
      }
    }
    if (updates.password !== undefined) {
      setPassword(updates.password);
      setError('');
      if (clearError) {
        clearError();
      }
    }
    if (updates.role !== undefined) {
      setRole(updates.role);
    }
  }, [clearError]);

  // Early return for unmounted state
  if (!mounted || !isAuthReady) {
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
                  error={error}
                  onUsernameChange={(value) => updateState({ username: value })}
                  onSubmit={handleUsernameSubmit}
                  onKeyPress={handleKeyPress}
                  isDisabled={isLoading || authLoading}
                />
              )}

              {step === 2 && (
                <PasswordStep
                  username={username}
                  password={password}
                  error={error}
                  onPasswordChange={(value) => updateState({ password: value })}
                  onBack={goBack}
                  onSubmit={handleLogin}
                  isLoading={isLoading || authLoading}
                  hasUser={!!user}
                  isRateLimited={isRateLimited}
                  rateLimitWaitTime={rateLimitWaitTime}
                  role={role}
                  roleOptions={roleOptions}
                  onRoleSelect={(selectedRole) => setRole(selectedRole as 'buyer' | 'seller' | 'admin')}
                />
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