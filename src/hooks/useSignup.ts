// src/hooks/useSignup.ts

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import { SignupState, SignupFormData, FormErrors, UserRole } from '@/types/signup';
import { validateForm, calculatePasswordStrength } from '@/utils/signupUtils';

export const useSignup = () => {
  const router = useRouter();
  const { user, login, isAuthReady } = useAuth();
  const { users } = useListings();
  
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
  
  // Debounced username check
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (state.username && state.username.length >= 3) {
      setState(prev => ({ ...prev, isCheckingUsername: true }));
      
      timer = setTimeout(() => {
        const normalizedUsername = state.username.trim().toLowerCase();
        const userExists = !!users[normalizedUsername];
        
        setState(prev => ({
          ...prev,
          isCheckingUsername: false,
          errors: {
            ...prev.errors,
            username: userExists ? 'This username is already taken' : undefined
          }
        }));
      }, 500);
    }
    
    return () => clearTimeout(timer);
  }, [state.username, users]);

  // Update password strength when password changes
  useEffect(() => {
    const strength = calculatePasswordStrength(state.password);
    setState(prev => ({ ...prev, passwordStrength: strength }));
  }, [state.password]);

  // Update form data
  const updateFormData = useCallback((updates: Partial<SignupFormData>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Update specific field
  const updateField = useCallback((field: keyof SignupFormData, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Clear specific error
  const clearError = useCallback((field: keyof FormErrors) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: undefined }
    }));
  }, []);

  // Set errors
  const setErrors = useCallback((errors: FormErrors) => {
    setState(prev => ({ ...prev, errors }));
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    const formData: SignupFormData = {
      username: state.username,
      email: state.email,
      password: state.password,
      confirmPassword: state.confirmPassword,
      role: state.role,
      termsAccepted: state.termsAccepted,
      ageVerified: state.ageVerified
    };

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      // Check if username exists with a different role
      const normalizedUsername = state.username.trim().toLowerCase();
      const existingUser = users[normalizedUsername];
      if (existingUser && existingUser.role !== state.role) {
        setErrors({ 
          form: 'This username is already registered with a different role. Please choose a different username.' 
        });
        setState(prev => ({ ...prev, isSubmitting: false }));
        return;
      }
      
      // Store email and password in localStorage to prepare for backend later
      if (typeof window !== 'undefined') {
        // Store these separately from the user data as they would normally be handled by the backend
        const userCredentials = JSON.parse(localStorage.getItem('userCredentials') || '{}');
        userCredentials[normalizedUsername] = {
          email: state.email,
          // In a real app, you would NEVER store passwords like this - this is temporary
          // until you add a proper backend with password hashing
          password: state.password,
        };
        localStorage.setItem('userCredentials', JSON.stringify(userCredentials));
      }
      
      // Call login with only the parameters it's expecting (username and role)
      const success = await login(normalizedUsername, state.role as UserRole);
      
      if (success) {
        router.push('/');
      } else {
        setErrors({ form: 'Registration failed. Please try again.' });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setErrors({ 
        form: error.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  return {
    // State
    ...state,
    
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