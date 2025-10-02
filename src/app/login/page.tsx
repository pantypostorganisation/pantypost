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
import { AUTH_ERROR_FALLBACK, normalizeAuthError } from '@/utils/authErrors';

const isDev = process.env.NODE_ENV !== 'production';

export default function LoginPage() {
  if (isDev) console.log('[Login] LoginPage component render');

  const router = useRouter();
  const authData = useAuth();
  const { login, isAuthReady, user, error: authError, clearError, loading: authLoading } = authData;

  if (isDev) {
    console.log('[Login] useAuth snapshot:', {
      hasLogin: !!login,
      loginType: typeof login,
      isAuthReady,
      hasUser: !!user,
      authError,
      authLoading
    });
  }

  // State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'buyer' | 'seller' | 'admin' | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [showAdminMode, setShowAdminMode] = useState(false);

  // Rate limiting
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitWaitTime, setRateLimitWaitTime] = useState(0);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

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
    ...(showAdminMode
      ? [
          {
            key: 'admin',
            label: 'Administrator',
            description: 'Full system access',
            icon: Shield,
          },
        ]
      : []),
  ];

  // Mounted state
  useEffect(() => {
    if (isDev) console.log('[Login] Mount effect');
    setMounted(true);
    isMountedRef.current = true;

    return () => {
      if (isDev) console.log('[Login] Unmount cleanup');
      isMountedRef.current = false;
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isDev) console.log('[Login] Auth check:', { isAuthReady, hasUser: !!user });
    if (isAuthReady && user) {
      router.replace('/');
    }
  }, [isAuthReady, user, router]);

  // Sync auth errors and loading state
  useEffect(() => {
    if (authError) {
      if (isDev) console.log('[Login] Auth error:', authError);
      const normalized = normalizeAuthError(authError) ?? authError;
      setError(normalized);
      setIsLoading(false); // IMPORTANT: Clear loading state when error occurs
    }
    
    // Also sync loading state from auth context
    if (!authLoading && isLoading) {
      setIsLoading(false);
    }
  }, [authError, authLoading, isLoading]);

  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Check rate limit status on step 2 & username changes
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
      } catch (e) {
        if (isDev) console.error('[Login] Rate limit check failed:', e);
        if (isMountedRef.current) {
          setIsRateLimited(false);
          setRateLimitWaitTime(0);
        }
      }
    }
  }, [step, username]);

  // Update rate limit state based on error message
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

  const handleUsernameSubmit = useCallback(() => {
    if (isDev) console.log('[Login] Username submit:', username);
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }

    setError('');
    clearError?.();
    setStep(2);
  }, [username, clearError]);

  const handleLogin = useCallback(
    async (e?: React.FormEvent) => {
      if (isDev)
        console.log('[Login] handleLogin', {
          hasEvent: !!e,
          username,
          role,
          isRateLimited,
          mounted: isMountedRef.current,
          isLoading,
          hasPassword: !!password,
          loginExists: !!login,
          loginType: typeof login,
        });

      if (e) e.preventDefault();

      if (isRateLimited || !isMountedRef.current) return;

      if (!username.trim()) {
        setError('Please enter your username');
        return;
      }
      if (!password.trim()) {
        setError('Please enter your password');
        return;
      }
      if (!role) {
        setError('Please select a role');
        return;
      }
      if (!login || typeof login !== 'function') {
        if (isDev) console.error('[Login] login() unavailable');
        setError('Authentication system not ready. Please refresh the page.');
        return;
      }

      setIsLoading(true);
      setError('');
      clearError?.();
      
      try {
        const success = await login(username.trim(), password, role);
        
        if (isDev) console.log('[Login] Login result:', success);
        
        if (!success) {
          // Login failed - auth context has set the error
          // Make sure we're not stuck in loading state
          setIsLoading(false);
          
          // If auth context didn't provide an error, set a generic one
          const normalized = normalizeAuthError(authError) ?? authError;
          if (normalized) {
            setError(normalized);
          } else {
            setError(AUTH_ERROR_FALLBACK);
          }
        }
        // If success is true, user will be redirected by the useEffect
      } catch (err) {
        if (isDev) console.error('[Login] login() error:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsLoading(false);
      }
    },
    [username, password, role, login, isRateLimited, authError, clearError]
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLoading) {
        if (step === 1) {
          handleUsernameSubmit();
        }
      }
    },
    [isLoading, step, handleUsernameSubmit]
  );

  const goBack = useCallback(() => {
    if (isDev) console.log('[Login] Back to step 1');
    setStep(1);
    setPassword('');
    setRole(null);
    setError('');
    setIsLoading(false); // Clear loading state when going back
    clearError?.();
  }, [clearError]);

  const handleCrownClick = useCallback(() => {
    setShowAdminMode((prev) => !prev);
    if (showAdminMode && role === 'admin') {
      setRole('buyer');
    }
  }, [showAdminMode, role]);

  const updateState = useCallback(
    (updates: Partial<{ username: string; password: string; role: 'buyer' | 'seller' | 'admin' | null }>) => {
      if (updates.username !== undefined) {
        setUsername(updates.username);
        setError('');
        clearError?.();
      }
      if (updates.password !== undefined) {
        setPassword(updates.password);
        setError('');
        clearError?.();
      }
      if (updates.role !== undefined) {
        setRole(updates.role);
      }
    },
    [clearError]
  );

  // Early wait UI
  if (!mounted || !isAuthReady) {
    if (isDev) console.log('[Login] waiting...', { mounted, isAuthReady });
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#ff950e]/20 border-t-[#ff950e] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isDev) console.log('[Login] render body step=', step);

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Enhanced Floating Particles Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <FloatingParticle key={i} delay={0} index={i} />
        ))}
      </div>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/50 pointer-events-none" />

      {/* Secret Admin Crown - Bottom Right */}
      <AdminCrownButton showAdminMode={showAdminMode} onToggle={handleCrownClick} />

      {/* Main Content */}
      <div
        className={`relative z-10 flex items-center justify-center p-4 ${
          step === 1 ? 'min-h-[90vh] pt-4' : 'min-h-screen py-4'
        }`}
      >
        <div className="w-full max-w-md">
          {/* Header */}
          <LoginHeader step={step} showAdminMode={showAdminMode} onLogoClick={() => router.push('/')} />

          {/* Form Card */}
          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 shadow-xl transition-all duration-500">
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
