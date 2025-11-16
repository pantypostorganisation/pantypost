// src/hooks/useSignup.ts

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { sanitizeUsername, sanitizeEmail } from '@/utils/security/sanitization';
import { CSRFTokenManager } from '@/utils/security/validation';
import { useRateLimit } from '@/utils/security/rate-limiter';
import { authSchemas } from '@/utils/validation/schemas';
import { SignupState, SignupFormData, FormErrors, UserRole } from '@/types/signup';
import { validateForm, calculatePasswordStrength } from '@/utils/signupUtils';
import { z } from 'zod';

export const useSignup = () => {
  const router = useRouter();
  const { user, isAuthReady, apiClient } = useAuth();
  
  // Security features
  const [csrfManager] = useState(() => new CSRFTokenManager());
  const [csrfToken, setCsrfToken] = useState('');
  const { checkLimit: checkSignupLimit, resetLimit: resetSignupLimit } = useRateLimit('SIGNUP', {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000 // 1 hour
  });
  
  const [state, setState] = useState<SignupState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: '',
    role: null,
    termsAccepted: false,
    ageVerified: false,
    errors: {},
    isSubmitting: false,
    isCheckingUsername: false,
    mounted: false,
    passwordStrength: 0
  });

  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string>();
  const [passwordWarning, setPasswordWarning] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string>('');

  // Initialize CSRF token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = csrfManager.generateToken();
      setCsrfToken(token);
    }
  }, [csrfManager]);

  // Set mounted state and check for referral code in URL
  useEffect(() => {
    setState(prev => ({ ...prev, mounted: true }));
    
    // Check for referral code in URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref') || urlParams.get('referral');
      if (refCode) {
        setReferralCode(refCode);
        console.log('[useSignup] Referral code detected from URL:', refCode);
      }
    }
  }, []);
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthReady && user) {
      router.push('/');
    }
  }, [isAuthReady, user, router]);
  
  // Debounced username check with backend API
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (state.username && state.username.length >= 3) {
      setState(prev => ({ ...prev, isCheckingUsername: true }));
      
      timer = setTimeout(async () => {
        try {
          // Validate username format first
          const sanitized = sanitizeUsername(state.username);
          authSchemas.username.parse(sanitized);
          
          // Use apiClient which properly constructs URLs
          const response = await apiClient.get<{ available: boolean; message: string }>(
            `/auth/verify-username?username=${encodeURIComponent(sanitized)}`
          );
          
          setState(prev => ({
            ...prev,
            isCheckingUsername: false,
            errors: {
              ...prev.errors,
              username: response.success && response.data && !response.data.available 
                ? 'This username is already taken' 
                : undefined
            }
          }));
        } catch (error) {
          setState(prev => ({
            ...prev,
            isCheckingUsername: false,
            errors: {
              ...prev.errors,
              username: error instanceof z.ZodError ? error.errors[0].message : 'Error checking username'
            }
          }));
        }
      }, 500);
    }
    
    return () => clearTimeout(timer);
  }, [state.username, apiClient]);

  // Update password strength when password changes
  useEffect(() => {
    const strength = calculatePasswordStrength(state.password);
    setState(prev => ({ ...prev, passwordStrength: strength }));
  }, [state.password]);

  // Update specific field with validation
  const updateField = useCallback((field: keyof SignupFormData | 'form', value: any) => {
    if (field === 'form') {
      // Handle form-level errors
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, form: value }
      }));
      return;
    }

    let sanitizedValue = value;
    
    switch (field) {
      case 'username':
        sanitizedValue = sanitizeUsername(value);
        break;
      case 'email':
        // Don't over-sanitize email - just trim whitespace
        sanitizedValue = value.trim();
        break;
      case 'country':
        sanitizedValue = typeof value === 'string' ? value : '';
        break;
      case 'role':
        if (value !== 'buyer' && value !== 'seller') {
          console.error('Invalid role value');
          return;
        }
        break;
      case 'termsAccepted':
      case 'ageVerified':
        sanitizedValue = !!value;
        break;
      case 'password':
      case 'confirmPassword':
        // Don't sanitize passwords
        sanitizedValue = value;
        break;
    }
    
    setState(prev => ({ ...prev, [field]: sanitizedValue }));
  }, []);

  // Function to update referral code
  const updateReferralCode = useCallback((code: string) => {
    setReferralCode(code);
  }, []);

  // UPDATED: Handle signup submission with email verification flow and referral code support
  const handleSubmit = async (e: React.FormEvent, customReferralCode?: string): Promise<void> => {
    e.preventDefault();
    
    // Clear rate limit messages
    setIsRateLimited(false);
    setRateLimitMessage(undefined);
    
    // Verify CSRF token
    if (!csrfManager.validateToken(csrfToken)) {
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, form: 'Security validation failed. Please refresh and try again.' }
      }));
      return;
    }
    
    // Check rate limit
    const rateLimitResult = checkSignupLimit(state.email);
    if (!rateLimitResult.allowed) {
      setIsRateLimited(true);
      const message = `Too many signup attempts. Please wait ${rateLimitResult.waitTime} seconds before trying again.`;
      setRateLimitMessage(message);
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, form: message }
      }));
      return;
    }
    
    const formData: SignupFormData = {
      username: state.username,
      email: state.email,
      password: state.password,
      confirmPassword: state.confirmPassword,
      country: state.country,
      role: state.role,
      termsAccepted: state.termsAccepted,
      ageVerified: state.ageVerified
    };

    // Validate with Zod schema
    try {
      authSchemas.signupSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodErrors: FormErrors = {};
        error.errors.forEach(err => {
          const field = err.path[0] as keyof FormErrors;
          if (!zodErrors[field]) {
            zodErrors[field] = err.message;
          }
        });
        setState(prev => ({ ...prev, errors: zodErrors }));
        return;
      }
    }

    // Additional validation
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setState(prev => ({ ...prev, errors: validationErrors }));
      return;
    }
    
    setState(prev => ({ ...prev, isSubmitting: true, errors: {} }));
    
    try {
      console.log('[useSignup] Making signup request via apiClient');
      
      // Determine which referral code to use (custom parameter takes precedence)
      const finalReferralCode = customReferralCode || referralCode;
      
      // Build signup data object
      const signupData: any = {
        username: state.username,
        email: state.email,
        password: state.password,
        country: state.country,
        role: state.role
      };
      
      // Include referral code if provided and user is signing up as seller
      if (finalReferralCode && state.role === 'seller') {
        // CRITICAL FIX: Sanitize and uppercase the referral code
        signupData.referralCode = finalReferralCode.trim().toUpperCase();
        console.log('[useSignup] Including referral code for seller signup:', signupData.referralCode);
      }
      
      console.log('[useSignup] Signup request payload:', { 
        username: signupData.username,
        email: signupData.email,
        role: signupData.role,
        hasReferralCode: !!signupData.referralCode,
        referralCodeLength: signupData.referralCode ? signupData.referralCode.length : 0
      });
      
      // Use apiClient which properly handles URL construction
      const response = await apiClient.post('/auth/signup', signupData);
      
      console.log('[useSignup] Response received:', { 
        success: response.success,
        hasData: !!response.data,
        requiresVerification: response.data?.requiresVerification,
        referralApplied: response.data?.referralApplied
      });
      
      if (response.success && response.data) {
        console.log('[useSignup] ✅ Account created successfully');
        
        // Clear rate limit on success
        resetSignupLimit(state.email);
        
        // Clear sensitive data from state
        setState(prev => ({
          ...prev,
          password: '',
          confirmPassword: '',
          errors: {}
        }));
        
        // Clear referral code after successful signup
        setReferralCode('');
        
        // Check if email verification is required
        if (response.data.requiresVerification) {
          console.log('[useSignup] Email verification required, redirecting to pending page...');
          
          // Build redirect URL with parameters
          const params = new URLSearchParams({
            email: encodeURIComponent(response.data.email),
            username: encodeURIComponent(response.data.username)
          });
          
          // Add referral success info if applicable
          if (response.data.referralApplied) {
            params.append('referralSuccess', 'true');
            console.log('[useSignup] ✅ Referral was successfully applied!');
            if (response.data.referrerUsername) {
              params.append('referrer', encodeURIComponent(response.data.referrerUsername));
              console.log('[useSignup] Referrer:', response.data.referrerUsername);
            }
          }
          
          router.push(`/verify-email-pending?${params.toString()}`);
        } else {
          // This shouldn't happen with the new flow, but handle it just in case
          console.log('[useSignup] No verification required (unexpected), redirecting to browse...');
          router.push('/browse');
        }
      } else {
        // Handle API error response
        const errorMessage = response.error?.message || 'Registration failed. Please try again.';
        
        console.error('[useSignup] ❌ Signup failed:', errorMessage);
        
        // Handle specific referral code errors
        if (response.error?.code === 'INVALID_REFERRAL_CODE') {
          setState(prev => ({
            ...prev,
            errors: { 
              ...prev.errors, 
              form: 'Invalid or expired referral code. You can still sign up without it.',
              referralCode: 'This referral code is invalid or has expired'
            }
          }));
        } else if (response.error?.code === 'REFERRAL_CODE_MAXED') {
          setState(prev => ({
            ...prev,
            errors: { 
              ...prev.errors, 
              form: 'This referral code has reached its maximum usage limit.',
              referralCode: 'This referral code has been used the maximum number of times'
            }
          }));
        } else {
          setState(prev => ({
            ...prev,
            errors: { 
              ...prev.errors, 
              form: errorMessage,
              // If the error has a field, set that specific field error
              ...(response.error?.field && { [response.error.field]: errorMessage })
            }
          }));
        }
      }
    } catch (error: any) {
      console.error('[useSignup] ❌ Signup error:', error);
      
      // Handle network or unexpected errors
      const errorMessage = error.message?.includes('Network') 
        ? 'Network error. Please check your connection and try again.'
        : 'Registration failed. Please try again.';
        
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, form: errorMessage }
      }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Validate referral code format (optional utility function)
  const validateReferralCode = useCallback((code: string): boolean => {
    // Basic validation - alphanumeric and hyphens, 3-20 characters
    const referralCodePattern = /^[A-Za-z0-9-]{3,20}$/;
    return referralCodePattern.test(code);
  }, []);

  return {
    // State
    ...state,
    
    // Security state
    isRateLimited,
    rateLimitMessage,
    csrfToken,
    passwordWarning,
    
    // Referral state
    referralCode,
    
    // Actions
    updateField,
    handleSubmit,
    updateReferralCode,
    validateReferralCode,
    
    // Navigation
    router
  };
};