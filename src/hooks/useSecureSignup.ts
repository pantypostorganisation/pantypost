// src/hooks/useSecureSignup.ts

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { storageService } from '@/services';
import { useValidation } from '@/hooks/useValidation';
import { authSchemas } from '@/utils/validation/schemas';
import { sanitizeUsername, sanitizeEmail } from '@/utils/security/sanitization';
import { validatePasswordStrength } from '@/utils/security/validation';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { SignupState, SignupFormData, FormErrors, UserRole } from '@/types/signup';

interface UseSecureSignupReturn {
  // Original state fields
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole | null;
  termsAccepted: boolean;
  ageVerified: boolean;
  errors: FormErrors;
  isSubmitting: boolean;
  isCheckingUsername: boolean;
  mounted: boolean;
  passwordStrength: number; // Keep as number for compatibility
  
  // Form handlers
  handleUsernameChange: (value: string) => void;
  handleEmailChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;
  handleConfirmPasswordChange: (value: string) => void;
  handleRoleChange: (role: UserRole) => void;
  handleTermsChange: (accepted: boolean) => void;
  handleAgeChange: (verified: boolean) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  
  // Validation state
  validation: ReturnType<typeof useValidation<SignupFormData>>;
  
  // Security features
  passwordStrengthDetails: ReturnType<typeof validatePasswordStrength>;
  isRateLimited: boolean;
  rateLimitMessage?: string;
}

export const useSecureSignup = (): UseSecureSignupReturn => {
  const router = useRouter();
  const { user, login, isAuthReady } = useAuth();
  const { users } = useListings();
  const rateLimiter = getRateLimiter();
  
  const [state, setState] = useState<SignupState>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
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

  // Initialize validation with Zod schema
  const validation = useValidation<SignupFormData>({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: null,
      termsAccepted: false,
      ageVerified: false,
    },
    validationSchema: authSchemas.signupSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      await performSignup(values);
    },
  });

  // Calculate password strength
  const passwordStrengthDetails = validatePasswordStrength(validation.values.password);
  const passwordStrength = passwordStrengthDetails.score; // Convert to number for compatibility

  // Set mounted state
  useEffect(() => {
    setState(prev => ({ ...prev, mounted: true }));
  }, []);
  
  // Redirect if already logged in
  useEffect(() => {
    if (isAuthReady && user) {
      router.push('/');
    }
  }, [isAuthReady, user, router]);
  
  // Debounced username availability check
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const username = validation.values.username;
    if (username && username.length >= 3 && !validation.errors.username) {
      setState(prev => ({ ...prev, isCheckingUsername: true }));
      
      timer = setTimeout(() => {
        const normalizedUsername = username.trim().toLowerCase();
        const userExists = !!users[normalizedUsername];
        
        setState(prev => ({
          ...prev,
          isCheckingUsername: false,
        }));

        if (userExists) {
          validation.setFieldError('username', 'This username is already taken');
        }
      }, 500);
    } else {
      setState(prev => ({ ...prev, isCheckingUsername: false }));
    }
    
    return () => clearTimeout(timer);
  }, [validation.values.username, users, validation.errors.username]);

  // Secure input handlers with sanitization
  const handleUsernameChange = useCallback((value: string) => {
    const sanitized = sanitizeUsername(value);
    validation.handleChange('username', sanitized);
    setState(prev => ({ ...prev, username: sanitized }));
  }, [validation]);

  const handleEmailChange = useCallback((value: string) => {
    const sanitized = sanitizeEmail(value);
    validation.handleChange('email', sanitized);
    setState(prev => ({ ...prev, email: sanitized }));
  }, [validation]);

  const handlePasswordChange = useCallback((value: string) => {
    // Don't sanitize passwords - they should be allowed to contain special chars
    validation.handleChange('password', value);
    setState(prev => ({ ...prev, password: value }));
  }, [validation]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    validation.handleChange('confirmPassword', value);
    setState(prev => ({ ...prev, confirmPassword: value }));
  }, [validation]);

  const handleRoleChange = useCallback((role: UserRole) => {
    validation.handleChange('role', role);
    setState(prev => ({ ...prev, role }));
  }, [validation]);

  const handleTermsChange = useCallback((accepted: boolean) => {
    validation.handleChange('termsAccepted', accepted);
    setState(prev => ({ ...prev, termsAccepted: accepted }));
  }, [validation]);

  const handleAgeChange = useCallback((verified: boolean) => {
    validation.handleChange('ageVerified', verified);
    setState(prev => ({ ...prev, ageVerified: verified }));
  }, [validation]);

  // Perform signup with rate limiting
  const performSignup = async (values: SignupFormData) => {
    // Check rate limit
    const rateLimitResult = rateLimiter.check('SIGNUP', RATE_LIMITS.SIGNUP);
    
    if (!rateLimitResult.allowed) {
      setIsRateLimited(true);
      setRateLimitMessage(
        `Too many signup attempts. Please wait ${rateLimitResult.waitTime} seconds before trying again.`
      );
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // Check if username exists with a different role
      const normalizedUsername = values.username.trim().toLowerCase();
      const existingUser = users[normalizedUsername];
      
      if (existingUser && existingUser.role !== values.role) {
        validation.setFieldError(
          'username',
          'This username is already registered with a different role. Please choose a different username.'
        );
        setState(prev => ({ ...prev, isSubmitting: false }));
        return;
      }
      
      // Store email and password in storage (temporary until backend)
      if (typeof window !== 'undefined') {
        const userCredentials = await storageService.getItem<Record<string, any>>('userCredentials', {});
        userCredentials[normalizedUsername] = {
          email: values.email,
          // In production, passwords should NEVER be stored like this
          password: values.password,
        };
        await storageService.setItem('userCredentials', userCredentials);
      }
      
      // Call login with username and role
      const success = await login(normalizedUsername, values.role as UserRole);
      
      if (success) {
        // Clear rate limit on success
        rateLimiter.reset('SIGNUP');
        router.push('/');
      } else {
        setState(prev => ({ 
          ...prev, 
          errors: { form: 'Registration failed. Please try again.' } 
        }));
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setState(prev => ({ 
        ...prev,
        errors: { 
          form: error.message || 'Registration failed. Please try again.' 
        }
      }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear rate limit error
    setIsRateLimited(false);
    setRateLimitMessage(undefined);
    
    // Use validation's submit handler
    await validation.handleSubmit(e);
  };

  return {
    // Original state fields
    username: validation.values.username,
    email: validation.values.email,
    password: validation.values.password,
    confirmPassword: validation.values.confirmPassword,
    role: validation.values.role,
    termsAccepted: validation.values.termsAccepted,
    ageVerified: validation.values.ageVerified,
    errors: state.errors,
    isSubmitting: state.isSubmitting,
    isCheckingUsername: state.isCheckingUsername,
    mounted: state.mounted,
    passwordStrength, // number for compatibility
    
    // Form handlers
    handleUsernameChange,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleRoleChange,
    handleTermsChange,
    handleAgeChange,
    handleSubmit,
    
    // Validation state
    validation,
    
    // Security features
    passwordStrengthDetails,
    isRateLimited,
    rateLimitMessage,
  };
};