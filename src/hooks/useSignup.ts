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

// 🔧 FIX: Use correct API Base URL (localhost instead of 52.62.54.24)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const useSignup = () => {
  const router = useRouter();
  const { user, isAuthReady, apiClient, login } = useAuth();
  
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
          
          // 🔧 FIX: Use correct endpoint path (remove /api prefix since apiClient adds it)
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

  // 🔧 FIX: Updated handleSubmit to work properly with backend
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
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
      // 🔧 FIX: Call backend signup API directly (not through apiClient to avoid double /api prefix)
      console.log('[Signup] Making signup request to:', `${API_BASE_URL}/api/auth/signup`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: state.username,
          email: state.email,
          password: state.password,
          role: state.role
        })
      });
      
      const data = await response.json();
      console.log('[Signup] Response:', { status: response.status, success: data.success });
      
      if (data.success && data.data) {
        console.log('[Signup] Success! Now logging in...');
        
        // Clear rate limit on success
        resetSignupLimit(state.email);
        
        // Use the login function from AuthContext to properly set up the session
        const loginSuccess = await login(state.username, state.password, state.role || 'buyer');
        
        if (loginSuccess) {
          console.log('[Signup] Auto-login successful, redirecting...');
          
          // Clear sensitive data from state
          setState(prev => ({
            ...prev,
            password: '',
            confirmPassword: '',
            email: '',
            errors: {}
          }));
          
          // Redirect to dashboard
          router.push('/');
        } else {
          // Signup worked but login failed - this shouldn't happen
          setState(prev => ({
            ...prev,
            errors: { 
              form: 'Account created successfully! Please try logging in manually.'
            }
          }));
          
          // Redirect to login page
          setTimeout(() => router.push('/login'), 2000);
        }
      } else {
        // Handle API error response
        const errorMessage = data.error?.message || 'Registration failed. Please try again.';
        setState(prev => ({
          ...prev,
          errors: { 
            ...prev.errors, 
            form: errorMessage,
            // If the error has a field, set that specific field error
            ...(data.error?.field && { [data.error.field]: errorMessage })
          }
        }));
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
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

  return {
    // State
    ...state,
    
    // Security state
    isRateLimited,
    rateLimitMessage,
    csrfToken,
    passwordWarning,
    
    // Actions
    updateField,
    handleSubmit,
    
    // Navigation
    router
  };
};