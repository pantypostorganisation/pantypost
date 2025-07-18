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
import { SecureForm, SecureSubmitButton } from '@/components/ui/SecureForm';
import { useValidation } from '@/hooks/useValidation';
import { authSchemas } from '@/utils/validation/schemas';
import { RATE_LIMITS } from '@/utils/security/rate-limiter';
import { securityService } from '@/services/security.service';
import { AlertCircle } from 'lucide-react';

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
  const [passwordWarnings, setPasswordWarnings] = useState<string[]>([]);

  // Form validation
  const validation = useValidation({
    initialValues: {
      username,
      email,
      password,
      confirmPassword,
      role,
      termsAccepted,
      ageVerified,
    },
    validationSchema: authSchemas.signupSchema,
    validateOnChange: true,
    validateOnBlur: true,
  });

  // Check password vulnerabilities
  const checkPasswordSecurity = (pwd: string) => {
    const result = securityService.checkPasswordVulnerabilities(pwd, {
      username: validation.values.username,
      email: validation.values.email,
    });
    setPasswordWarnings(result.warnings);
  };

  // Handle field updates with validation
  const handleFieldUpdate = (field: string, value: any) => {
    // Update validation state
    validation.handleChange(field as any, value);
    
    // Update original form state
    updateField(field as any, value);
    
    // Check password security if password field
    if (field === 'password') {
      checkPasswordSecurity(value);
    }
  };

  // Handle secure form submission
  const handleSecureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate entire form
    const isValid = await validation.validateForm();
    if (!isValid) {
      // Show first validation error as form error
      const firstError = Object.values(validation.errors)[0];
      if (firstError && updateField) {
        updateField('form' as any, firstError);
      }
      return;
    }
    
    // Check for password warnings
    if (passwordWarnings.length > 0) {
      const confirmSubmit = window.confirm(
        'Your password has some security concerns:\n\n' + 
        passwordWarnings.join('\n') + 
        '\n\nDo you want to continue anyway?'
      );
      if (!confirmSubmit) return;
    }
    
    // Call original submit handler
    await handleSubmit(e);
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
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.form}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Secure Form */}
            <SecureForm
              onSubmit={handleSecureSubmit}
              rateLimitKey="SIGNUP"
              rateLimitConfig={RATE_LIMITS.SIGNUP}
              showSecurityBadge={true}
            >
              {/* Username Field */}
              <UsernameField
                username={validation.values.username}
                error={validation.touched.username ? (validation.errors.username || errors.username) : errors.username}
                isChecking={isCheckingUsername}
                onChange={(value) => handleFieldUpdate('username', value)}
              />

              {/* Email Field */}
              <EmailField
                email={validation.values.email}
                error={validation.touched.email ? (validation.errors.email || errors.email) : errors.email}
                onChange={(value) => handleFieldUpdate('email', value)}
              />

              {/* Password Fields */}
              <PasswordField
                password={validation.values.password}
                confirmPassword={validation.values.confirmPassword}
                passwordError={validation.touched.password ? (validation.errors.password || errors.password) : errors.password}
                confirmError={validation.touched.confirmPassword ? (validation.errors.confirmPassword || errors.confirmPassword) : errors.confirmPassword}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                onPasswordChange={(value) => handleFieldUpdate('password', value)}
                onConfirmChange={(value) => handleFieldUpdate('confirmPassword', value)}
                onTogglePassword={() => setShowPassword(!showPassword)}
                onToggleConfirm={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              {/* Password Strength Indicator */}
              <PasswordStrength password={validation.values.password} strength={passwordStrength} />
              
              {/* Password Security Warnings */}
              {passwordWarnings.length > 0 && validation.touched.password && (
                <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-yellow-400 text-sm font-medium mb-1">Security warnings:</p>
                  <ul className="text-yellow-400/80 text-xs space-y-1">
                    {passwordWarnings.map((warning, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-yellow-400">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Role Selection */}
              <RoleSelector
                role={validation.values.role}
                error={validation.touched.role ? (validation.errors.role || errors.role) : errors.role}
                onChange={(value) => handleFieldUpdate('role', value)}
              />

              {/* Terms and Age Verification */}
              <TermsCheckboxes
                termsAccepted={validation.values.termsAccepted}
                ageVerified={validation.values.ageVerified}
                termsError={validation.touched.termsAccepted ? (validation.errors.termsAccepted || errors.termsAccepted) : errors.termsAccepted}
                ageError={validation.touched.ageVerified ? (validation.errors.ageVerified || errors.ageVerified) : errors.ageVerified}
                onTermsChange={(checked) => handleFieldUpdate('termsAccepted', checked)}
                onAgeChange={(checked) => handleFieldUpdate('ageVerified', checked)}
              />

              {/* Submit Button */}
              <SecureSubmitButton
                isLoading={isSubmitting || isCheckingUsername}
                disabled={!validation.isValid || isCheckingUsername}
                className="w-full mt-6"
                loadingText="Creating Account..."
              >
                <Lock className="w-4 h-4" />
                Sign Up
              </SecureSubmitButton>
            </SecureForm>
          </motion.div>
          
          {/* Footer */}
          <SignupFooter />
        </div>
      </div>
    </div>
  );
}
