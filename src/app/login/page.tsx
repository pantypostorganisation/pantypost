// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import FloatingParticle from '@/components/login/FloatingParticle';
import LoginHeader from '@/components/login/LoginHeader';
import UsernameStep from '@/components/login/UsernameStep';
import RoleSelectionStep from '@/components/login/RoleSelectionStep';
import AdminCrownButton from '@/components/login/AdminCrownButton';
import LoginFooter from '@/components/login/LoginFooter';
import TrustIndicators from '@/components/login/TrustIndicators';
import { useLogin } from '@/hooks/useLogin';
import { SecureForm } from '@/components/ui/SecureForm';
import { SecureInput } from '@/components/ui/SecureInput';
import { useValidation } from '@/hooks/useValidation';
import { authSchemas } from '@/utils/validation/schemas';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';
import { AlertCircle } from 'lucide-react';

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

  // Validation for username step
  const usernameValidation = useValidation({
    initialValues: { username: '' },
    validationSchema: authSchemas.loginSchema.pick({ username: true }),
    validateOnChange: true,
    validateOnBlur: true,
  });

  // Rate limit error state
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Handle username submission with validation
  const handleSecureUsernameSubmit = async () => {
    const isValid = await usernameValidation.validateForm();
    if (!isValid) return;

    // Clear rate limit error
    setRateLimitError(null);
    
    // Update the main state with validated username
    updateState({ username: usernameValidation.values.username });
    
    // Call original submit handler
    handleUsernameSubmit();
  };

  // Handle secure login with rate limiting
  const handleSecureLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      await handleLogin();
    } catch (error) {
      // Rate limit errors are handled by SecureForm
      console.error('Login error:', error);
    }
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
                <SecureForm
                  onSubmit={handleSecureUsernameSubmit}
                  rateLimitKey="LOGIN"
                  rateLimitConfig={RATE_LIMITS.LOGIN}
                  className="space-y-4"
                >
                  {/* Global Error Message */}
                  {error && !rateLimitError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg transition-all duration-300">
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Enter your username
                    </label>
                    <SecureInput
                      type="text"
                      placeholder="Username"
                      value={usernameValidation.values.username}
                      onChange={(value) => {
                        usernameValidation.handleChange('username', value);
                        updateState({ username: value });
                      }}
                      onBlur={() => usernameValidation.handleBlur('username')}
                      error={usernameValidation.errors.username}
                      touched={usernameValidation.touched.username}
                      autoFocus
                      autoComplete="username"
                      spellCheck={false}
                      maxLength={30}
                      characterCount={false}
                      className="w-full"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && usernameValidation.values.username.trim()) {
                          handleSecureUsernameSubmit();
                        }
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!usernameValidation.values.username.trim() || !usernameValidation.isValid}
                    className={`
                      w-full py-3 px-4 font-medium rounded-lg transition-all duration-300
                      ${!usernameValidation.values.username.trim() || !usernameValidation.isValid
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#ff950e] to-orange-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
                      }
                    `}
                  >
                    Continue
                  </button>
                </SecureForm>
              )}

              {step === 2 && (
                <SecureForm
                  onSubmit={handleSecureLogin}
                  rateLimitKey={`LOGIN:${username}`}
                  rateLimitConfig={RATE_LIMITS.LOGIN}
                  className="space-y-4"
                >
                  {/* Global Error Message */}
                  {error && !rateLimitError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg transition-all duration-300">
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                      </p>
                    </div>
                  )}

                  <RoleSelectionStep
                    role={role}
                    error={error}
                    roleOptions={roleOptions}
                    onRoleSelect={(selectedRole) => updateState({ role: selectedRole })}
                    onBack={goBack}
                    onSubmit={handleSecureLogin}
                    isLoading={isLoading}
                    hasUser={!!user}
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
