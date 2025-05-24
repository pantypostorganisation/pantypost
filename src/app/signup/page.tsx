// src/app/signup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { User, ShoppingBag, Lock } from 'lucide-react';
import Link from 'next/link';

// Define specific form data type
type UserRole = 'buyer' | 'seller';

interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole | null;
  termsAccepted: boolean;
  ageVerified: boolean;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
  termsAccepted?: string;
  ageVerified?: string;
  form?: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { login, isAuthReady, user, users } = useListings();
  
  const [formData, setFormData] = useState<SignupFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: null,
    termsAccepted: false,
    ageVerified: false,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState<boolean>(false);
  
  useEffect(() => {
    if (isAuthReady && user) {
      router.push('/');
    }
  }, [isAuthReady, user, router]);
  
  // Debounced username check
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const checkUsername = (): void => {
      if (formData.username.trim().length >= 3) {
        setIsCheckingUsername(true);
        
        try {
          // Check if username exists
          const existingUser = users[formData.username.trim().toLowerCase()];
          
          if (existingUser && formData.role && existingUser.role !== formData.role) {
            setErrors(prev => ({
              ...prev,
              username: 'Username already taken with a different role'
            }));
          }
        } catch (error) {
          console.error('Error checking username:', error);
        } finally {
          setIsCheckingUsername(false);
        }
      }
    };
    
    timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [formData.username, formData.role, users]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when field is edited
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };
  
  const handleRoleSelect = (selectedRole: UserRole): void => {
    setFormData(prev => ({
      ...prev,
      role: selectedRole,
    }));
    
    if (errors.role) {
      setErrors(prev => ({
        ...prev,
        role: undefined,
      }));
    }
  };
  
  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Please enter a username';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email';
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
  
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if username exists with a different role
      const normalizedUsername = formData.username.trim().toLowerCase();
      const existingUser = users[normalizedUsername];
      if (existingUser && existingUser.role !== formData.role) {
        setErrors({ 
          form: 'This username is already registered with a different role. Please choose a different username.' 
        });
        setIsSubmitting(false);
        return;
      }
      
      // Store email and password in localStorage to prepare for backend later
      if (typeof window !== 'undefined') {
        // Store these separately from the user data as they would normally be handled by the backend
        const userCredentials = JSON.parse(localStorage.getItem('userCredentials') || '{}');
        userCredentials[normalizedUsername] = {
          email: formData.email,
          // In a real app, you would NEVER store passwords like this - this is temporary
          // until you add a proper backend with password hashing
          password: formData.password,
        };
        localStorage.setItem('userCredentials', JSON.stringify(userCredentials));
      }
      
      // Call login with only the parameters it's expecting (username and role)
      login(normalizedUsername, formData.role as UserRole);
      router.push('/');
    } catch (error: any) {
      console.error('Signup error:', error);
      setErrors({ 
        form: error.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-8">
      <main className="w-full max-w-md mx-auto p-8 bg-[#121212] rounded-3xl shadow-xl">
        {/* Logo + Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 mb-4">
            <img
              src="/logo.png"
              alt="PantyPost Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">PantyPost</h1>
          <p className="text-sm text-[#ff950e] font-medium uppercase tracking-wide">
            MARKETPLACE FOR USED UNDERWEAR
          </p>
        </div>

        <h2 className="text-xl font-bold mb-6 text-white text-center">Create an Account</h2>

        {errors.form && (
          <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
            {errors.form}
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Username input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full p-3 ${isCheckingUsername ? 'pr-10' : ''} border ${errors.username ? 'border-red-500/50' : 'border-gray-700'} rounded-lg bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent`}
                autoComplete="username"
                autoFocus
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            {errors.username && (
              <p className="mt-1.5 text-xs text-red-400">{errors.username}</p>
            )}
          </div>
          
          {/* Email input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Your email address"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-3 border ${errors.email ? 'border-red-500/50' : 'border-gray-700'} rounded-lg bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent`}
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
            )}
          </div>
          
          {/* Password input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-3 border ${errors.password ? 'border-red-500/50' : 'border-gray-700'} rounded-lg bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent`}
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
            )}
          </div>
          
          {/* Confirm Password input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full p-3 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-gray-700'} rounded-lg bg-[#1a1a1a] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent`}
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Role selection */}
          <div>
            <p className="block text-sm font-medium text-gray-300 mb-2">
              I want to:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSelect('buyer')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium border transition ${
                  formData.role === 'buyer'
                    ? 'bg-[#ff950e] text-black border-[#ff950e] shadow-md'
                    : 'bg-[#1a1a1a] text-white border-gray-700 hover:border-gray-500'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                Buyer
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('seller')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg font-medium border transition ${
                  formData.role === 'seller'
                    ? 'bg-[#ff950e] text-black border-[#ff950e] shadow-md'
                    : 'bg-[#1a1a1a] text-white border-gray-700 hover:border-gray-500'
                }`}
              >
                <User className="w-5 h-5" />
                Seller
              </button>
            </div>
            {errors.role && (
              <p className="mt-1.5 text-xs text-red-400">{errors.role}</p>
            )}
          </div>
          
          {/* Terms & Conditions and Age Verification */}
          <div className="space-y-3 pt-1">
            <div className="flex items-start">
              <input
                id="termsAccepted"
                name="termsAccepted"
                type="checkbox"
                checked={formData.termsAccepted}
                onChange={handleChange}
                className="h-4 w-4 mt-1 rounded border-gray-700 text-[#ff950e] focus:ring-[#ff950e] focus:ring-offset-[#121212]"
              />
              <label htmlFor="termsAccepted" className="ml-2 block text-sm text-gray-300">
                I agree to the{' '}
                <Link href="/terms" className="text-[#ff950e] hover:underline">
                  Terms and Conditions
                </Link>
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="mt-0.5 text-xs text-red-400 pl-6">{errors.termsAccepted}</p>
            )}
            
            <div className="flex items-start">
              <input
                id="ageVerified"
                name="ageVerified"
                type="checkbox"
                checked={formData.ageVerified}
                onChange={handleChange}
                className="h-4 w-4 mt-1 rounded border-gray-700 text-[#ff950e] focus:ring-[#ff950e] focus:ring-offset-[#121212]"
              />
              <label htmlFor="ageVerified" className="ml-2 block text-sm text-gray-300">
                I confirm that I am at least 18 years, or of adult age in my jurisdiction
              </label>
            </div>
            {errors.ageVerified && (
              <p className="mt-0.5 text-xs text-red-400 pl-6">{errors.ageVerified}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isCheckingUsername}
            className="w-full mt-6 bg-[#ff950e] text-black font-bold text-lg py-3 rounded-lg hover:bg-[#e68a0c] transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                <span>Sign Up</span>
              </>
            )}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-[#ff950e] hover:underline font-medium">
            Log In
          </Link>
        </div>
      </main>
    </div>
  );
}
