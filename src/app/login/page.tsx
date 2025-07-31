// src/app/login/page.tsx
'use client';

import FloatingParticle from '@/components/login/FloatingParticle';
import LoginHeader from '@/components/login/LoginHeader';
import UsernameStep from '@/components/login/UsernameStep';
import RoleSelectionStep from '@/components/login/RoleSelectionStep';
import AdminCrownButton from '@/components/login/AdminCrownButton';
import LoginFooter from '@/components/login/LoginFooter';
import TrustIndicators from '@/components/login/TrustIndicators';
import { useLogin } from '@/hooks/useLogin';
import { SecureForm } from '@/components/ui/SecureForm';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';
import { useState, useEffect, useRef } from 'react';
import { getRateLimiter } from '@/utils/security/rate-limiter';

export default function LoginPage() {
  const {
    // State
    username,
    role,
    error,
    isLoading,
    step,
    mounted,
    showAdminMode,
    roleOptions,
    
    // Actions
    updateState,
    handleLogin,
    handleUsernameSubmit,
    handleKeyPress,
    goBack,
    handleCrownClick,
    
    // Auth
    user,
    
    // Navigation
    router
  } = useLogin();

  // Track rate limit state
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitWaitTime, setRateLimitWaitTime] = useState(0);
  
  // Use ref to store interval ID for cleanup
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check rate limit status on component mount and when username changes
  useEffect(() => {
    if (step === 2 && username) {
      const limiter = getRateLimiter();
      const result = limiter.check(`LOGIN:${username}`, RATE_LIMITS.LOGIN);
      
      if (!result.allowed && result.waitTime) {
        setIsRateLimited(true);
        setRateLimitWaitTime(result.waitTime);
      } else {
        setIsRateLimited(false);
        setRateLimitWaitTime(0);
      }
    }
  }, [step, username]);

  // Update rate limit status when error changes
  useEffect(() => {
    if (error && error.includes('Too many login attempts')) {
      setIsRateLimited(true);
      // Extract wait time from error message
      const match = error.match(/Please wait (\d+) seconds/);
      if (match) {
        setRateLimitWaitTime(parseInt(match[1]));
      }
    } else if (!error) {
      // Clear rate limit when error is cleared
      setIsRateLimited(false);
      setRateLimitWaitTime(0);
    }
  }, [error]);

  // Countdown timer for rate limit with proper cleanup
  useEffect(() => {
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (isRateLimited && rateLimitWaitTime > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setRateLimitWaitTime((prev) => {
          if (prev <= 1) {
            setIsRateLimited(false);
            // Clear interval when countdown reaches 0
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup function
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isRateLimited, rateLimitWaitTime]);

  // Additional cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  // Wrap handleLogin with rate limiting check
  const handleSecureLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Don't proceed if rate limited
    if (isRateLimited) {
      return;
    }
    
    await handleLogin();
  };

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
            onLogoClick={() => router.push('/')} 
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
                  isDisabled={isLoading}
                />
              )}

              {step === 2 && (
                <SecureForm
                  onSubmit={handleSecureLogin}
                  rateLimitKey={`LOGIN:${username}`}
                  rateLimitConfig={RATE_LIMITS.LOGIN}
                  isRateLimited={isRateLimited}
                  rateLimitWaitTime={rateLimitWaitTime}
                >
                  <RoleSelectionStep
                    role={role}
                    error={error}
                    roleOptions={roleOptions}
                    onRoleSelect={(selectedRole) => updateState({ role: selectedRole })}
                    onBack={goBack}
                    onSubmit={handleSecureLogin}
                    isLoading={isLoading || isRateLimited}
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