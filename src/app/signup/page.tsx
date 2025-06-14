// src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import { Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSignup } from '@/hooks/useSignup';
import FloatingParticle from '@/components/signup/FloatingParticle';
import SignupHeader from '@/components/signup/SignupHeader';
import UsernameField from '@/components/signup/UsernameField';
import EmailField from '@/components/signup/EmailField';
import PasswordField from '@/components/signup/PasswordField';
import PasswordStrength from '@/components/signup/PasswordStrength';
import RoleSelector from '@/components/signup/RoleSelector';
import TermsCheckboxes from '@/components/signup/TermsCheckboxes';
import SignupFooter from '@/components/signup/SignupFooter';

export default function SignupPage() {
  const {
    // Form data
    username,
    email,
    password,
    confirmPassword,
    role,
    termsAccepted,
    ageVerified,
    
    // State
    errors,
    isSubmitting,
    isCheckingUsername,
    mounted,
    passwordStrength,
    
    // Actions
    updateField,
    handleSubmit,
    
    // Navigation
    router
  } = useSignup();

  // Local UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <SignupHeader onLogoClick={() => router.push('/')} />
          
          {/* Form Card */}
          <motion.div 
            className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {/* Error Message */}
            <AnimatePresence mode="wait">
              {errors.form && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <p className="text-red-400 text-sm">{errors.form}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Username Field */}
              <UsernameField
                username={username}
                error={errors.username}
                isChecking={isCheckingUsername}
                onChange={(value) => updateField('username', value)}
              />

              {/* Email Field */}
              <EmailField
                email={email}
                error={errors.email}
                onChange={(value) => updateField('email', value)}
              />

              {/* Password Fields */}
              <PasswordField
                password={password}
                confirmPassword={confirmPassword}
                passwordError={errors.password}
                confirmError={errors.confirmPassword}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                onPasswordChange={(value) => updateField('password', value)}
                onConfirmChange={(value) => updateField('confirmPassword', value)}
                onTogglePassword={() => setShowPassword(!showPassword)}
                onToggleConfirm={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              {/* Password Strength Indicator */}
              <PasswordStrength password={password} strength={passwordStrength} />

              {/* Role Selection */}
              <RoleSelector
                role={role}
                error={errors.role}
                onChange={(value) => updateField('role', value)}
              />

              {/* Terms and Age Verification */}
              <TermsCheckboxes
                termsAccepted={termsAccepted}
                ageVerified={ageVerified}
                termsError={errors.termsAccepted}
                ageError={errors.ageVerified}
                onTermsChange={(checked) => updateField('termsAccepted', checked)}
                onAgeChange={(checked) => updateField('ageVerified', checked)}
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isCheckingUsername}
                className="w-full mt-6 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                style={{ color: (isSubmitting || isCheckingUsername) ? undefined : '#000' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Sign Up
                  </>
                )}
              </button>
            </form>
          </motion.div>
          
          {/* Footer */}
          <SignupFooter />
        </div>
      </div>
    </div>
  );
}