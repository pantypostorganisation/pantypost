// src/hooks/useSignup.ts

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { storageService } from '@/services';
import { securityService } from '@/services/security.service';
import { sanitizeUsername, sanitizeEmail, sanitizeStrict } from '@/utils/security/sanitization';
import { CSRFTokenManager } from '@/utils/security/validation';
import { useRateLimit } from '@/utils/security/rate-limiter';
import { authSchemas } from '@/utils/validation/schemas';
import { SignupState, SignupFormData, FormErrors, UserRole } from '@/types/signup';
import { validateForm, calculatePasswordStrength } from '@/utils/signupUtils';
import { z } from 'zod';

// Helper function to hash password (client-side)
// Note: This is still not secure enough for production - use bcrypt on server
async function hashPassword(password: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    console.warn('Crypto API not available, using weak hash');
    return btoa(password);
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
    return btoa(password);
  }
}

export const useSignup = () => {
  const router = useRouter();
  const { user, login, isAuthReady } = useAuth();
  const { users } = useListings();
  
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

  // Initialize CSRF token
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = csrfManager.generateToken();
      setCsrfToken(token);
    }
  }, [csrfManager]);

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
  
  // Debounced username check with validation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (state.username && state.username.length >= 3) {
      setState(prev => ({ ...prev, isCheckingUsername: true }));
      
      timer = setTimeout(() => {
        // Validate username format first
        try {
          const sanitized = sanitizeUsername(state.username);
          authSchemas.username.parse(sanitized);
          
          const normalizedUsername = sanitized.toLowerCase();
          const userExists = !!users[normalizedUsername];
          
          setState(prev => ({
            ...prev,
            isCheckingUsername: false,
            errors: {
              ...prev.errors,
              username: userExists ? 'This username is already taken' : undefined
            }
          }));
        } catch (error) {
          setState(prev => ({
            ...prev,
            isCheckingUsername: false,
            errors: {
              ...prev.errors,
              username: error instanceof z.ZodError ? error.errors[0].message : 'Invalid username'
            }
          }));
        }
      }, 500);
    }
    
    return () => clearTimeout(timer);
  }, [state.username, users]);

  // Update password strength when password changes
  useEffect(() => {
    const strength = calculatePasswordStrength(state.password);
    setState(prev => ({ ...prev, passwordStrength: strength }));
    
    // Check for password vulnerabilities
    if (state.password) {
      const vulnerabilities = securityService.checkPasswordVulnerabilities(state.password, {
        username: state.username,
        email: state.email
      });
      
      if (!vulnerabilities.secure && vulnerabilities.warnings.length > 0) {
        setPasswordWarning(vulnerabilities.warnings[0]);
      } else {
        setPasswordWarning(null);
      }
    } else {
      setPasswordWarning(null);
    }
  }, [state.password, state.username, state.email]);

  // Update form data with sanitization
  const updateFormData = useCallback((updates: Partial<SignupFormData>) => {
    const sanitizedUpdates: Partial<SignupFormData> = {};
    
    if ('username' in updates && updates.username !== undefined) {
      sanitizedUpdates.username = sanitizeUsername(updates.username);
    }
    
    if ('email' in updates && updates.email !== undefined) {
      sanitizedUpdates.email = sanitizeEmail(updates.email);
    }
    
    if ('password' in updates) {
      sanitizedUpdates.password = updates.password; // Don't sanitize passwords
    }
    
    if ('confirmPassword' in updates) {
      sanitizedUpdates.confirmPassword = updates.confirmPassword;
    }
    
    if ('role' in updates && updates.role) {
      // Validate role
      if (updates.role === 'buyer' || updates.role === 'seller') {
        sanitizedUpdates.role = updates.role;
      }
    }
    
    if ('termsAccepted' in updates) {
      sanitizedUpdates.termsAccepted = !!updates.termsAccepted;
    }
    
    if ('ageVerified' in updates) {
      sanitizedUpdates.ageVerified = !!updates.ageVerified;
    }
    
    setState(prev => ({ ...prev, ...sanitizedUpdates }));
  }, []);

  // Update specific field with validation
  const updateField = useCallback((field: keyof SignupFormData, value: any) => {
    let sanitizedValue = value;
    
    switch (field) {
      case 'username':
        sanitizedValue = sanitizeUsername(value);
        break;
      case 'email':
        sanitizedValue = sanitizeEmail(value);
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
    }
    
    setState(prev => ({ ...prev, [field]: sanitizedValue }));
  }, []);

  // Clear specific error
  const clearError = useCallback((field: keyof FormErrors) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: undefined }
    }));
  }, []);

  // Set errors with sanitization
  const setErrors = useCallback((errors: FormErrors) => {
    // Sanitize error messages to prevent XSS
    const sanitizedErrors: FormErrors = {};
    
    Object.entries(errors).forEach(([key, value]) => {
      if (value) {
        sanitizedErrors[key as keyof FormErrors] = sanitizeStrict(value);
      }
    });
    
    setState(prev => ({ ...prev, errors: sanitizedErrors }));
  }, []);

  // Handle form submission with security
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Clear rate limit messages
    setIsRateLimited(false);
    setRateLimitMessage(undefined);
    
    // Verify CSRF token
    if (!csrfManager.validateToken(csrfToken)) {
      setErrors({ form: 'Security validation failed. Please refresh and try again.' });
      return;
    }
    
    // Check rate limit
    const rateLimitResult = checkSignupLimit(state.email);
    if (!rateLimitResult.allowed) {
      setIsRateLimited(true);
      const message = `Too many signup attempts. Please wait ${rateLimitResult.waitTime} seconds before trying again.`;
      setRateLimitMessage(message);
      setErrors({ form: message });
      return;
    }
    
    const formData: SignupFormData = {
      username: state.username,
      email: state.email,
      password: state.password,
      confirmPassword: state.confirmPassword,
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
        setErrors(zodErrors);
        return;
      }
    }

    // Additional validation
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Check content security
    const contentCheck = securityService.checkContentSecurity(
      `${formData.username} ${formData.email}`
    );
    
    if (!contentCheck.safe) {
      setErrors({ form: 'Invalid input detected. Please check your information.' });
      return;
    }
    
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // Check if username exists with a different role
      const normalizedUsername = state.username.trim().toLowerCase();
      const existingUser = users[normalizedUsername];
      
      if (existingUser && existingUser.role !== state.role) {
        setErrors({ 
          form: 'This username is already registered. Please choose a different username.' 
        });
        setState(prev => ({ ...prev, isSubmitting: false }));
        return;
      }
      
      // Store email and hashed password in storage
      if (typeof window !== 'undefined') {
        const userCredentials = await storageService.getItem<Record<string, any>>('userCredentials', {});
        
        // Hash password before storage
        const hashedPassword = await hashPassword(state.password);
        
        userCredentials[normalizedUsername] = {
          email: sanitizeEmail(state.email),
          passwordHash: hashedPassword,
          createdAt: new Date().toISOString(),
          role: state.role,
          // Store security metadata
          signupIp: 'unknown', // Would get from server in production
          userAgent: navigator.userAgent,
        };
        
        await storageService.setItem('userCredentials', userCredentials);
      }
      
      // Call login with username and role
      const success = await login(normalizedUsername, state.role as UserRole);
      
      if (success) {
        // Clear rate limit on success
        resetSignupLimit(state.email);
        
        // Clear sensitive data from state
        setState(prev => ({
          ...prev,
          password: '',
          confirmPassword: '',
          email: ''
        }));
        
        router.push('/');
      } else {
        setErrors({ form: 'Registration failed. Please try again.' });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Generic error message to prevent information leakage
      const errorMessage = error.message?.includes('Invalid') 
        ? error.message 
        : 'Registration failed. Please check your information and try again.';
        
      setErrors({ form: errorMessage });
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return {
    // State
    ...state,
    
    // Security state
    isRateLimited,
    rateLimitMessage,
    csrfToken,
    passwordWarning, // Separate from errors
    
    // Actions
    updateFormData,
    updateField,
    clearError,
    setErrors,
    handleSubmit,
    
    // Navigation
    router
  };
};