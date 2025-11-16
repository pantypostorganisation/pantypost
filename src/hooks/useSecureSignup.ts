// src/hooks/useSecureSignup.ts

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { storageService } from '@/services';
import { securityService } from '@/services/security.service';
import { useValidation } from '@/hooks/useValidation';
import { authSchemas } from '@/utils/validation/schemas';
import { sanitizeUsername, sanitizeEmail, sanitizeStrict } from '@/utils/security/sanitization';
import { validatePasswordStrength, CSRFTokenManager } from '@/utils/security/validation';
import { getRateLimiter, RATE_LIMITS, getRateLimitMessage } from '@/utils/security/rate-limiter';
import { SignupState, SignupFormData, FormErrors, UserRole } from '@/types/signup';

interface UseSecureSignupReturn {
  // Original state fields
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
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
  handleCountryChange: (value: string) => void;
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
  csrfToken: string;
}

// Helper function to hash password (client-side)
// Note: This is still not secure enough for production - use bcrypt on server
async function hashPassword(password: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback for environments without crypto API
    console.warn('Crypto API not available, using weak hash');
    return btoa(password); // Base64 encode as fallback (NOT SECURE)
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('Error hashing password:', error);
    return btoa(password); // Fallback
  }
}

export const useSecureSignup = (): UseSecureSignupReturn => {
  const router = useRouter();
  const { user, login, isAuthReady } = useAuth();
  const { users } = useListings();
  const rateLimiter = getRateLimiter();
  const [csrfManager] = useState(() => new CSRFTokenManager());
  const [csrfToken, setCsrfToken] = useState('');
  
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
  const [attemptCount, setAttemptCount] = useState(0);

  // Initialize CSRF token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = csrfManager.generateToken();
      setCsrfToken(token);
    }
  }, [csrfManager]);

  // Initialize validation with Zod schema
  const validation = useValidation<SignupFormData>({
    initialValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      country: '',
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

  // Clear rate limit after timeout - FIXED
  useEffect(() => {
    if (isRateLimited && rateLimitMessage) {
      const match = rateLimitMessage.match(/(\d+) seconds/);
      if (match) {
        const seconds = parseInt(match[1], 10);
        const timer = setTimeout(() => {
          setIsRateLimited(false);
          setRateLimitMessage(undefined);
        }, seconds * 1000);
        return () => clearTimeout(timer);
      }
    }
    // Return undefined for all code paths
    return undefined;
  }, [isRateLimited, rateLimitMessage]);

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
    
    // Check for password vulnerabilities
    const vulnerabilities = securityService.checkPasswordVulnerabilities(value, {
      username: validation.values.username,
      email: validation.values.email
    });
    
    if (!vulnerabilities.secure && vulnerabilities.warnings.length > 0) {
      // Show first warning as hint (not error)
      validation.setFieldError('password', vulnerabilities.warnings[0]);
    }
  }, [validation]);

  const handleConfirmPasswordChange = useCallback((value: string) => {
    validation.handleChange('confirmPassword', value);
    setState(prev => ({ ...prev, confirmPassword: value }));
  }, [validation]);

  const handleCountryChange = useCallback((value: string) => {
    validation.handleChange('country', value);
    setState(prev => ({ ...prev, country: value }));
  }, [validation]);

  const handleRoleChange = useCallback((role: UserRole) => {
    // Validate role value
    if (role !== 'buyer' && role !== 'seller') {
      console.error('Invalid role selected');
      return;
    }
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
    // Verify CSRF token
    if (!csrfManager.validateToken(csrfToken)) {
      setState(prev => ({ 
        ...prev,
        errors: { form: 'Security validation failed. Please refresh and try again.' }
      }));
      return;
    }

    // Check rate limit
    const rateLimitResult = rateLimiter.check('SIGNUP', {
      ...RATE_LIMITS.SIGNUP,
      identifier: values.email // Rate limit by email to prevent multiple accounts
    });
    
    if (!rateLimitResult.allowed) {
      setIsRateLimited(true);
      setRateLimitMessage(getRateLimitMessage(rateLimitResult));
      setAttemptCount(prev => prev + 1);
      
      // Log suspicious activity after multiple attempts
      if (attemptCount >= 2) {
        console.warn('Multiple failed signup attempts detected');
      }
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // Additional security checks
      const contentCheck = securityService.checkContentSecurity(
        `${values.username} ${values.email}`
      );
      
      if (!contentCheck.safe) {
        throw new Error('Invalid input detected');
      }

      // Check if username exists with a different role
      const normalizedUsername = values.username.trim().toLowerCase();
      const existingUser = users[normalizedUsername];
      
      if (existingUser && existingUser.role !== values.role) {
        validation.setFieldError(
          'username',
          'This username is already registered. Please choose a different username.'
        );
        setState(prev => ({ ...prev, isSubmitting: false }));
        return;
      }
      
    // Store email and hashed password in storage (temporary until backend)
    if (typeof window !== 'undefined') {
      const userCredentials = await storageService.getItem<Record<string, any>>('userCredentials', {});
        
        // Hash password before storage (still not production-ready)
        const hashedPassword = await hashPassword(values.password);
        
        userCredentials[normalizedUsername] = {
          email: sanitizeEmail(values.email),
          // Store hashed password (in production, this should be done server-side)
          passwordHash: hashedPassword,
          createdAt: new Date().toISOString(),
          role: values.role,
          country: values.country,
        };
        
        await storageService.setItem('userCredentials', userCredentials);
      }
      
      // Call login with username and role
      const success = await login(normalizedUsername, values.role as UserRole);
      
      if (success) {
        // Clear rate limit on success
        rateLimiter.reset('SIGNUP', values.email);
        setAttemptCount(0);
        
        // Clear sensitive data from memory
        validation.handleReset();
        
        router.push('/');
      } else {
        setState(prev => ({ 
          ...prev, 
          errors: { form: 'Registration failed. Please try again.' } 
        }));
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Generic error message to prevent information leakage
      const errorMessage = error.message?.includes('Invalid input') 
        ? error.message 
        : 'Registration failed. Please check your information and try again.';
        
      setState(prev => ({ 
        ...prev,
        errors: { 
          form: errorMessage
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
    country: validation.values.country,
    role: validation.values.role,
    termsAccepted: validation.values.termsAccepted,
    ageVerified: validation.values.ageVerified,
    errors: { ...state.errors, ...validation.errors },
    isSubmitting: state.isSubmitting,
    isCheckingUsername: state.isCheckingUsername,
    mounted: state.mounted,
    passwordStrength, // number for compatibility
    
    // Form handlers
    handleUsernameChange,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleCountryChange,
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
    csrfToken,
  };
};