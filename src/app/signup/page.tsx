// src/app/signup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useListings } from '@/context/ListingContext';
import { User, ShoppingBag, Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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

// Floating particle component
const FloatingParticle = ({ delay = 0 }) => {
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    }
  }, []);

  // Random color variation - mix orange and white particles
  const colors = [
    'bg-[#ff950e]/30', // Orange
    'bg-[#ff950e]/20', // Lighter orange
    'bg-white/20',     // White
    'bg-white/30',     // Brighter white
    'bg-[#ff6b00]/25'  // Orange variant
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return (
    <motion.div
      className={`absolute w-1 h-1 ${randomColor} rounded-full`}
      initial={{ 
        x: Math.random() * dimensions.width, 
        y: dimensions.height + 10,
        opacity: 0 
      }}
      animate={{
        y: -10,
        opacity: [0, 1, 1, 0],
        x: Math.random() * dimensions.width,
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        delay: delay,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
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
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-4">
              <motion.img 
                src="/logo.png" 
                alt="PantyPost" 
                className="object-contain drop-shadow-2xl transition-all duration-500 hover:drop-shadow-[0_0_20px_rgba(255,149,14,0.4)] cursor-pointer"
                style={{ width: '160px', height: '160px' }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.2,
                  ease: [0.16, 1, 0.3, 1]
                }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/')}
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Join PantyPost</h1>
            <p className="text-gray-400 text-sm">Create your account to get started</p>
            
            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-[#ff950e]" />
                Secure
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-[#ff950e]" />
                Private
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-[#ff950e]" />
                Verified
              </span>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div 
            className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Error Message */}
            <AnimatePresence>
              {errors.form && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <p className="text-red-400 text-sm">{errors.form}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Username input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="username">
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
                    className={`w-full px-4 py-3 ${isCheckingUsername ? 'pr-10' : ''} bg-black border ${errors.username ? 'border-red-500/50' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors`}
                    autoComplete="username"
                    autoFocus
                  />
                  {isCheckingUsername && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                {errors.username && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.username}</p>
                )}
              </div>
              
              {/* Email input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Your email address"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-black border ${errors.email ? 'border-red-500/50' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors`}
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
                )}
              </div>
              
              {/* Password input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-black border ${errors.password ? 'border-red-500/50' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors`}
                  autoComplete="new-password"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
                )}
              </div>
              
              {/* Confirm Password input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-black border ${errors.confirmPassword ? 'border-red-500/50' : 'border-gray-700'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors`}
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Role selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  I want to be a:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('buyer')}
                    className={`p-3 rounded-lg border transition-all duration-200 text-left relative overflow-hidden group ${
                      formData.role === 'buyer'
                        ? 'bg-[#ff950e]/10 border-[#ff950e] text-white'
                        : 'bg-black/50 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-black/70'
                    }`}
                  >
                    {/* Sheen Effect */}
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`p-2 rounded-lg ${
                        formData.role === 'buyer'
                          ? 'bg-[#ff950e] text-black'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">Buyer</p>
                        <p className="text-xs text-gray-500">Browse and purchase</p>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleRoleSelect('seller')}
                    className={`p-3 rounded-lg border transition-all duration-200 text-left relative overflow-hidden group ${
                      formData.role === 'seller'
                        ? 'bg-[#ff950e]/10 border-[#ff950e] text-white'
                        : 'bg-black/50 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-black/70'
                    }`}
                  >
                    {/* Sheen Effect */}
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
                    
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`p-2 rounded-lg ${
                        formData.role === 'seller'
                          ? 'bg-[#ff950e] text-black'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium">Seller</p>
                        <p className="text-xs text-gray-500">List and sell items</p>
                      </div>
                    </div>
                  </button>
                </div>
                {errors.role && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.role}</p>
                )}
              </div>
              
              {/* Terms & Conditions and Age Verification */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start">
                  <input
                    id="termsAccepted"
                    name="termsAccepted"
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                    className="h-4 w-4 mt-1 rounded border-gray-700 text-[#ff950e] focus:ring-[#ff950e] focus:ring-offset-[#111]"
                  />
                  <label htmlFor="termsAccepted" className="ml-3 block text-sm text-gray-300">
                    I agree to the{' '}
                    <Link href="/terms" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
                      Terms and Conditions
                    </Link>
                  </label>
                </div>
                {errors.termsAccepted && (
                  <p className="mt-0.5 text-xs text-red-400 pl-7">{errors.termsAccepted}</p>
                )}
                
                <div className="flex items-start">
                  <input
                    id="ageVerified"
                    name="ageVerified"
                    type="checkbox"
                    checked={formData.ageVerified}
                    onChange={handleChange}
                    className="h-4 w-4 mt-1 rounded border-gray-700 text-[#ff950e] focus:ring-[#ff950e] focus:ring-offset-[#111]"
                  />
                  <label htmlFor="ageVerified" className="ml-3 block text-sm text-gray-300">
                    I confirm that I am at least 21 years old
                  </label>
                </div>
                {errors.ageVerified && (
                  <p className="mt-0.5 text-xs text-red-400 pl-7">{errors.ageVerified}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isCheckingUsername}
                className="w-full mt-6 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                style={{ color: (isSubmitting || isCheckingUsername) ? undefined : '#000' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Sign Up
                  </>
                )}
              </button>
            </form>
          </motion.div>
          
          {/* Footer */}
          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
                Log In
              </Link>
            </p>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div 
            className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <span>🔒 Secure</span>
            <span>🛡️ Encrypted</span>
            <span>✓ Verified</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
