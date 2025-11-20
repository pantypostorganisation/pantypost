// src/app/signup/page.tsx - FIXED VERSION
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Lock, AlertCircle, Gift, Ticket, CheckCircle2, X, ChevronRight, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
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
import { referralService } from '@/services/referral.service';
import CountrySelect from '@/components/signup/CountrySelect';

// Referral Code Input Component
const ReferralCodeInput: React.FC<{
  referralCode: string;
  onChange: (code: string) => void;
  error?: string;
  isValidating?: boolean;
  referrerInfo?: { username: string; profilePic?: string } | null;
  onClear?: () => void;
  disabled?: boolean;
}> = ({ referralCode, onChange, error, isValidating, referrerInfo, onClear, disabled }) => {
  const [isExpanded, setIsExpanded] = useState(!!referralCode || !!referrerInfo);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    onChange(value.slice(0, 20));
  };

  return (
    <div className="mb-4">
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="w-full p-3 bg-gradient-to-r from-[#ff950e]/10 to-[#ff6b00]/10 border border-[#ff950e]/20 rounded-lg text-left hover:border-[#ff950e]/40 transition-all duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#ff950e]" />
              <span className="text-sm text-gray-300">Have a referral code?</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#ff950e] transition-colors" />
          </div>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">Referral Code (Optional)</label>
            {!disabled && (
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  if (onClear) onClear();
                }}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={referralCode}
              onChange={handleChange}
              placeholder="ENTER-CODE"
              className={`w-full px-4 py-2.5 bg-black/50 border rounded-lg text-white placeholder-gray-500 font-mono tracking-wide focus:outline-none focus:ring-2 transition-all duration-200 pr-10 ${
                error 
                  ? 'border-red-500/50 focus:ring-red-500/50' 
                  : referrerInfo
                  ? 'border-green-500/50 focus:ring-green-500/50'
                  : 'border-gray-700 focus:ring-[#ff950e]/50 focus:border-[#ff950e]'
              }`}
              disabled={disabled}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValidating ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : referrerInfo ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <Ticket className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </div>
          
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
          
          {referrerInfo && !error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg"
            >
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <p className="text-xs text-green-400">
                Valid code from {referrerInfo.username}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Main signup page component - default export for Next.js
export default function SignupPage() {
  const searchParams = useSearchParams();
  const {
    username,
    email,
    password,
    confirmPassword,
    country,
    role,
    termsAccepted,
    ageVerified,
    errors,
    isSubmitting,
    isCheckingUsername,
    mounted,
    passwordStrength,
    updateField,
    handleSubmit,
    router
  } = useSignup();

  // Local UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordWarnings, setPasswordWarnings] = useState<string[]>([]);
  
  // Referral code state - check URL params for ref or referral
  const urlReferralCode = searchParams?.get('ref') || searchParams?.get('referral') || '';
  const [referralCode, setReferralCode] = useState(urlReferralCode);
  const [referrerInfo, setReferrerInfo] = useState<{ username: string; profilePic?: string } | null>(null);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);

  // Form validation
  const validation = useValidation({
    initialValues: {
      username: username || '',
      email: email || '',
      password: password || '',
      confirmPassword: confirmPassword || '',
      country: country || '',
      role: role || null,
      termsAccepted: termsAccepted || false,
      ageVerified: ageVerified || false,
    },
    validationSchema: authSchemas.signupSchema,
    validateOnChange: true,
    validateOnBlur: true,
  });

  // Password security check
  const checkPasswordSecurity = useCallback((pwd: string) => {
    if (!pwd || typeof pwd !== 'string') {
      setPasswordWarnings([]);
      return;
    }

    try {
      const result = securityService.checkPasswordVulnerabilities(pwd, {
        username: username || '',
        email: email || '',
      });
      setPasswordWarnings(result.warnings || []);
    } catch (error) {
      console.error('Error checking password security:', error);
      setPasswordWarnings(['Unable to validate password security']);
    }
  }, [username, email]);

  // Validate referral code
  const validateReferralCode = useCallback(async (code: string) => {
    if (!code || code.length < 6) {
      setReferralError(null);
      setReferrerInfo(null);
      return;
    }

    setIsValidatingReferral(true);
    setReferralError(null);

    try {
      const response = await referralService.validateReferralCode(code);
      
      if (response.success && response.data?.valid) {
        setReferrerInfo(response.data.referrer);
        setReferralError(null);
      } else {
        setReferrerInfo(null);
        setReferralError('Invalid or expired referral code');
      }
    } catch (error) {
      console.error('Error validating referral code:', error);
      setReferrerInfo(null);
      setReferralError('Unable to validate referral code');
    } finally {
      setIsValidatingReferral(false);
    }
  }, []);

  // Debounced referral validation - FIX: Add proper cleanup
  useEffect(() => {
    if (referralCode && referralCode.length >= 6) {
      const timer = setTimeout(() => {
        validateReferralCode(referralCode);
      }, 500);
      return () => clearTimeout(timer);
    }
    // Cleanup function for all paths
    return () => {};
  }, [referralCode, validateReferralCode]);

  // Handle field updates with validation
  const handleFieldUpdate = useCallback((field: string, value: unknown) => {
    if (!field || value === undefined) {
      console.warn('Invalid field update:', { field, value });
      return;
    }

    try {
      validation.handleChange(field as any, value);
      updateField(field as any, value);

      if (field === 'password' && typeof value === 'string') {
        checkPasswordSecurity(value);
      }
    } catch (error) {
      console.error('Error updating field:', error);
    }
  }, [validation, updateField, checkPasswordSecurity]);

  // Handle secure form submission with referral code
  const handleSecureSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      console.warn('Form submission already in progress');
      return;
    }

    // Manual validation check
    const hasErrors = !username || !email || !password || !confirmPassword || !country || !role ||
                     !termsAccepted || !ageVerified || password !== confirmPassword;

    if (hasErrors) {
      if (!username) updateField('username' as any, '');
      if (!email) updateField('email' as any, '');
      if (!password) updateField('password' as any, '');
      if (!confirmPassword) updateField('confirmPassword' as any, '');
      if (!country) updateField('country' as any, '');
      if (!role) updateField('form' as any, 'Please select a role');
      if (!termsAccepted) updateField('form' as any, 'You must accept the terms');
      if (!ageVerified) updateField('form' as any, 'You must confirm you are 18+');
      if (password && confirmPassword && password !== confirmPassword) {
        updateField('form' as any, 'Passwords do not match');
      }
      return;
    }

    try {
      if (passwordWarnings.length > 0) {
        const warningMessage = 'Your password has some security concerns:\n\n' + 
                              passwordWarnings.join('\n') + 
                              '\n\nDo you want to continue anyway?';

        const confirmSubmit = typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm(warningMessage)
          : true;

        if (!confirmSubmit) return;
      }

      // Include referral code if valid and user is signing up as seller
      const finalReferralCode = (referralCode && referrerInfo && !referralError && role === 'seller') 
        ? referralCode 
        : undefined;

      // Call the handleSubmit with the referral code
      await handleSubmit(e, finalReferralCode);
    } catch (error) {
      console.error('Error during form submission:', error);
      updateField('form' as any, 'An error occurred during submission. Please try again.');
    }
  }, [
    isSubmitting, username, email, password, confirmPassword, role,
    termsAccepted, ageVerified, passwordWarnings, updateField,
    handleSubmit, referralCode, referrerInfo, referralError
  ]);

  // Handle logo click
  const handleLogoClick = useCallback(() => {
    if (router) {
      router.push('/');
    }
  }, [router]);

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
          <SignupHeader onLogoClick={handleLogoClick} />

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
              <UsernameField
                username={username || ''}
                error={errors.username}
                isChecking={isCheckingUsername}
                onChange={(value) => handleFieldUpdate('username', value)}
              />

              <EmailField
                email={email || ''}
                error={errors.email}
                onChange={(value) => handleFieldUpdate('email', value)}
              />

              <CountrySelect
                country={country || ''}
                error={errors.country}
                onChange={(value) => handleFieldUpdate('country', value)}
              />

              <PasswordField
                password={password || ''}
                confirmPassword={confirmPassword || ''}
                passwordError={errors.password}
                confirmError={errors.confirmPassword}
                showPassword={showPassword}
                showConfirmPassword={showConfirmPassword}
                onPasswordChange={(value) => handleFieldUpdate('password', value)}
                onConfirmChange={(value) => handleFieldUpdate('confirmPassword', value)}
                onTogglePassword={() => setShowPassword(s => !s)}
                onToggleConfirm={() => setShowConfirmPassword(s => !s)}
              />

              {password && <PasswordStrength password={password} strength={passwordStrength} />}

              {passwordWarnings.length > 0 && password && (
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

              <RoleSelector
                role={role || null}
                error={errors.role}
                onChange={(value) => handleFieldUpdate('role', value)}
              />

              {/* Referral Code Input */}
              <ReferralCodeInput
                referralCode={referralCode}
                onChange={setReferralCode}
                error={referralError || undefined}
                isValidating={isValidatingReferral}
                referrerInfo={referrerInfo}
                onClear={() => {
                  setReferralCode('');
                  setReferrerInfo(null);
                  setReferralError(null);
                }}
                disabled={false}
              />

              {/* Show referral benefit if signing up as seller with valid code */}
              {role === 'seller' && referralCode && referrerInfo && !referralError && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Users className="w-4 h-4 text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-400 text-sm font-medium">Referral Benefits</p>
                      <p className="text-green-400/80 text-xs mt-1">
                        By joining as a seller through this referral, {referrerInfo.username} will 
                        earn 5% commission on your sales, supporting the community!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <TermsCheckboxes
                termsAccepted={termsAccepted || false}
                ageVerified={ageVerified || false}
                termsError={errors.termsAccepted}
                ageError={errors.ageVerified}
                onTermsChange={(checked) => handleFieldUpdate('termsAccepted', checked)}
                onAgeChange={(checked) => handleFieldUpdate('ageVerified', checked)}
              />

              <SecureSubmitButton
                isLoading={isSubmitting || isCheckingUsername}
                disabled={isCheckingUsername || isSubmitting}
                className="w-full mt-6"
                loadingText="Creating Account..."
              >
                <Lock className="w-4 h-4" />
                {referralCode && referrerInfo ? 'Sign Up with Referral' : 'Sign Up'}
              </SecureSubmitButton>
            </SecureForm>
          </motion.div>

          <SignupFooter />
        </div>
      </div>
    </div>
  );
}
