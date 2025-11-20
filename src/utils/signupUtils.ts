// src/utils/signupUtils.ts
import { SignupFormData, FormErrors } from '@/types/signup';

/**
 * Validates the entire signup form
 * @param formData - The form data to validate
 * @returns An object containing any validation errors
 */
export const validateForm = (formData: SignupFormData): FormErrors => {
  const errors: FormErrors = {};

  // Username validation
  if (!formData.username || formData.username.trim().length === 0) {
    errors.username = 'Username is required';
  } else if (formData.username.length < 3) {
    errors.username = 'Username must be at least 3 characters';
  } else if (formData.username.length > 30) {
    errors.username = 'Username must not exceed 30 characters';
  } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
    errors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
  }

  // Email validation
  if (!formData.email || formData.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!formData.password || formData.password.length === 0) {
    errors.password = 'Password is required';
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
    errors.password = 'Password must contain uppercase, lowercase, and numbers';
  }

  // Confirm password validation
  if (!formData.confirmPassword || formData.confirmPassword.length === 0) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  // Country validation - MANDATORY
  if (!formData.country || formData.country.trim().length === 0) {
    errors.country = 'Please select your country';
  }

  // Role validation
  if (!formData.role) {
    errors.role = 'Please select a role';
  } else if (formData.role !== 'buyer' && formData.role !== 'seller') {
    errors.role = 'Invalid role selected';
  }

  // Terms acceptance validation
  if (!formData.termsAccepted) {
    errors.termsAccepted = 'You must accept the terms and conditions';
  }

  // Age verification validation
  if (!formData.ageVerified) {
    errors.ageVerified = 'You must confirm you are at least 21 years old';
  }

  return errors;
};

/**
 * Calculates password strength as a percentage (0-100)
 * @param password - The password to evaluate
 * @returns A number between 0 and 100 representing password strength
 */
export const calculatePasswordStrength = (password: string): number => {
  if (!password || typeof password !== 'string') return 0;
  
  let strength = 0;
  
  // Length scoring (max 40 points)
  if (password.length >= 8) strength += 20;
  if (password.length >= 12) strength += 10;
  if (password.length >= 16) strength += 10;
  
  // Character variety scoring (max 40 points)
  if (/[a-z]/.test(password)) strength += 10; // lowercase
  if (/[A-Z]/.test(password)) strength += 10; // uppercase
  if (/\d/.test(password)) strength += 10;    // numbers
  if (/[^a-zA-Z0-9]/.test(password)) strength += 10; // special chars
  
  // Pattern scoring (max 20 points)
  if (!/(.)\1{2,}/.test(password)) strength += 10; // no repeated chars
  if (!/^[a-zA-Z]+$/.test(password)) strength += 10; // not just letters
  
  return Math.min(100, strength);
};

/**
 * Gets the color class for password strength indicator
 * @param strength - Password strength percentage (0-100)
 * @returns Tailwind CSS color class
 */
export const getPasswordStrengthColor = (strength: number): string => {
  if (strength < 30) return 'bg-red-500';
  if (strength < 60) return 'bg-yellow-500';
  if (strength < 90) return 'bg-blue-500';
  return 'bg-green-500';
};

/**
 * Gets the text description for password strength
 * @param strength - Password strength percentage (0-100)
 * @returns Human-readable strength description
 */
export const getPasswordStrengthText = (strength: number): string => {
  if (strength < 30) return 'Weak';
  if (strength < 60) return 'Fair';
  if (strength < 90) return 'Good';
  return 'Strong';
};