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

const isDev = process.env.NODE_ENV !== 'production';

export default function LoginPage() {
  if (isDev) console.log('[Login] LoginPage component render');

  const router = useRouter();
  const authData = useAuth();
  const { login, isAuthReady, user, error: authError, clearError, loading: authLoading, verifyAdminCode } = authData;

  if (isDev) {
    if (isDev) console.log('[Login] useAuth snapshot:', {
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
  const [errorData, setErrorData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Admin second-factor: set once the password is accepted and a code
  // has been emailed; suppresses PasswordStep and shows the code panel.
  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [showAdminMode, setShowAdminMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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

  // CRITICAL FIX: Sync auth errors and loading state properly
  useEffect(() => {
    if (authError) {
      if (isDev) console.log('[Login] Auth error detected:', authError);
      setError(authError);
      // CRITICAL: Always stop loading when there's an error
      setIsLoading(false);
    }
    
    // CRITICAL: Sync loading state with auth loading
    if (!authLoading && isLoading) {
      if (isDev) console.log('[Login] Auth loading stopped, stopping local loading');
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
    setErrorData(null);
    clearError?.();
    setStep(2);
  }, [username, clearError]);

  const handleVerifyCode = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!twoFactorCode.trim() || isLoading) return;
      setIsLoading(true);
      setError('');
      setErrorData(null);
      try {
        const ok = await verifyAdminCode(username.trim(), twoFactorCode.trim(), rememberMe);
        if (!ok) {
          setError('Incorrect code. Check the email and try again.');
          setIsLoading(false);
        }
        // On success the auth context sets the user and the existing
        // logged-in redirect takes over, same as a normal login.
      } catch (err: any) {
        if (isDev) console.error('[Login] verifyAdminCode threw:', err);
        setError('Verification failed. Please try again.');
        setIsLoading(false);
      }
    },
    [twoFactorCode, isLoading, verifyAdminCode, username, rememberMe]
  );

  const handleLogin = useCallback(
    async (e?: React.FormEvent) => {
      if (isDev)
        if (isDev) console.log('[Login] handleLogin called', {
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
        setErrorData(null);
        setIsLoading(false);
        return;
      }
      if (!password.trim()) {
        setError('Please enter your password');
        setErrorData(null);
        setIsLoading(false);
        return;
      }
      if (!role) {
        setError('Please select a role');
        setErrorData(null);
        setIsLoading(false);
        return;
      }
      if (!login || typeof login !== 'function') {
        if (isDev) console.error('[Login] login() unavailable');
        setError('Authentication system not ready. Please refresh the page.');
        setErrorData(null);
        setIsLoading(false);
        return;
      }

      // CRITICAL FIX: Set loading state and clear all errors before login attempt
      setIsLoading(true);
      setError('');
      setErrorData(null);
      clearError?.();

      let loginWasSuccessful = false;

      try {
        if (isDev) console.log('[Login] Calling login function...');

        const success = await login(username.trim(), password, role, rememberMe);
        loginWasSuccessful = success;

        if (isDev) console.log('[Login] Login result:', success);

        // CRITICAL FIX: Handle both success and failure cases explicitly
        if (success) {
          // Login successful - loading will be cleared by redirect
          if (isDev) console.log('[Login] Login successful');
        } else {
          // CRITICAL FIX: Login failed - show error feedback immediately
          if (isDev) console.log('[Login] Login failed');

          // Use auth error if available, otherwise generic message
          if (authError) {
            setError(authError);
          } else {
            setError('Incorrect username or password. Please try again.');
          }
        }
      } catch (err: any) {
        if (isDev) console.error('[Login] login() threw error:', err);

        // Handle email verification error - silent redirect
        // Admin second factor: password accepted, code emailed.
        // Switch to the code step -- this is progress, not an error.
        if (err?.requiresTwoFactor) {
          setTwoFactorPending(true);
          setTwoFactorCode('');
          setError('');
          setErrorData(null);
          setIsLoading(false);
          return;
        }

        if (err?.requiresVerification) {
          if (isDev) console.log('[Login] Email verification error caught:', {
            requiresVerification: err.requiresVerification,
            email: err.email,
            username: err.username,
            message: err.message
          });
          
          setErrorData({
            requiresVerification: true,
            email: err.email,
            username: err.username
          });
          
          setError(err.message || '');
        } 
        // Handle password reset pending error
        else if (err?.pendingPasswordReset) {
          if (isDev) console.log('[Login] Password reset pending error caught:', {
            pendingPasswordReset: err.pendingPasswordReset,
            email: err.email,
            username: err.username,
            message: err.message
          });
          
          setErrorData({
            pendingPasswordReset: true,
            email: err.email,
            username: err.username
          });
          
          setError(err.message || 'Password reset pending');
        } 
        // CRITICAL FIX: Handle all other errors properly
        else {
          const errorMessage = err?.message || 'An unexpected error occurred. Please try again.';
          if (isDev) console.log('[Login] Setting error message:', errorMessage);
          setError(errorMessage);
        }
      } finally {
        if (!loginWasSuccessful) {
          setIsLoading(false);
        }
      }
    },
    [username, password, role, rememberMe, login, isRateLimited, authError, clearError]
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
    setErrorData(null);
    setIsLoading(false);
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
        setErrorData(null);
        clearError?.();
      }
      if (updates.password !== undefined) {
        setPassword(updates.password);
        setError('');
        setErrorData(null);
        clearError?.();
      }
      if (updates.role !== undefined) {
        setRole(updates.role);
      }
    },
    [clearError]
  );

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
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <FloatingParticle key={i} delay={0} index={i} />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/50 pointer-events-none" />

      <AdminCrownButton showAdminMode={showAdminMode} onToggle={handleCrownClick} />

      <div
        className={`relative z-10 flex items-center justify-center p-4 ${
          step === 1 ? 'min-h-[90vh] pt-4' : 'min-h-screen py-4'
        }`}
      >
        <div className="w-full max-w-md">
          <LoginHeader step={step} showAdminMode={showAdminMode} onLogoClick={() => router.push('/')} />

          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-6 shadow-xl transition-all duration-500">
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

              {step === 2 && !twoFactorPending && (
                <PasswordStep
                  username={username}
                  password={password}
                  error={error}
                  errorData={errorData}
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
                  rememberMe={rememberMe}
                  onRememberMeChange={setRememberMe}
                />
              )}

              {twoFactorPending && (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold text-white">Check your email</h2>
                    <p className="text-sm text-gray-400">
                      Admin sign-in needs a second step: we emailed a 6-digit
                      code to your account address. It expires in 10 minutes.
                    </p>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                    autoFocus
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-gray-600 focus:border-primary focus:outline-none"
                  />
                  {error && (
                    <p className="text-center text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || twoFactorCode.length !== 6}
                    className="w-full rounded-lg bg-gradient-to-r from-primary to-primary-press py-3 font-semibold text-black transition-all hover:from-primary-press hover:to-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying...' : 'Verify and Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorPending(false);
                      setTwoFactorCode('');
                      setError('');
                    }}
                    className="w-full text-center text-sm text-gray-400 transition-colors hover:text-primary-hover"
                  >
                    Back to sign in
                  </button>
                </form>
              )}
            </div>
          </div>

          <LoginFooter step={step} />
          <TrustIndicators />
        </div>
      </div>
    </div>
  );
}




