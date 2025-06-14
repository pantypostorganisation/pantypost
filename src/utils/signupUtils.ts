// src/utils/signupUtils.ts

import { SignupFormData, FormErrors } from '@/types/signup';

export const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  return Math.round((strength / 6) * 100);
};

export const validateForm = (formData: SignupFormData): FormErrors => {
  const newErrors: FormErrors = {};
  
  // Username validation
  if (!formData.username) {
    newErrors.username = 'Please choose a username';
  } else if (formData.username.length < 3) {
    newErrors.username = 'Username must be at least 3 characters';
  } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
    newErrors.username = 'Username can only contain letters, numbers, and underscores';
  }
  
  // Email validation
  if (!formData.email) {
    newErrors.email = 'Please enter your email address';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Please enter a valid email address';
  }
  
  // Password validation
  if (!formData.password) {
    newErrors.password = 'Please create a password';
  } else if (formData.password.length < 8) {
    newErrors.password = 'Password must be at least 8 characters';
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
    newErrors.password = 'Password must include uppercase, lowercase, and numbers';
  }
  
  // Confirm password
  if (!formData.confirmPassword) {
    newErrors.confirmPassword = 'Please confirm your password';
  } else if (formData.password !== formData.confirmPassword) {
    newErrors.confirmPassword = 'Passwords do not match';
  }
  
  // Role validation
  if (!formData.role) {
    newErrors.role = 'Please select a role';
  }
  
  // Terms and age verification
  if (!formData.termsAccepted) {
    newErrors.termsAccepted = 'You must accept the terms and conditions';
  }
  
  if (!formData.ageVerified) {
    newErrors.ageVerified = 'You must confirm you are of legal age';
  }
  
  return newErrors;
};

export const getPasswordStrengthColor = (strength: number): string => {
  if (strength < 30) return 'bg-red-500';
  if (strength < 60) return 'bg-yellow-500';
  if (strength < 90) return 'bg-blue-500';
  return 'bg-green-500';
};

export const getPasswordStrengthText = (strength: number): string => {
  if (strength < 30) return 'Weak';
  if (strength < 60) return 'Fair';
  if (strength < 90) return 'Good';
  return 'Strong';
};