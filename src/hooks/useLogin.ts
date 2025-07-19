// src/hooks/useLogin.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, ShoppingBag, Crown } from 'lucide-react';
import { LoginState, RoleOption } from '@/types/login';
import { validateUsername, validateAdminCredentials } from '@/utils/loginUtils';
import { useRateLimit, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { authSchemas } from '@/utils/validation/schemas';
import { sanitizeUsername } from '@/utils/security/sanitization';
import { securityService } from '@/services';

// Constants for security
const MIN_LOGIN_DELAY = 800;
const MAX_LOGIN_DELAY = 1200;

export const useLogin = () => {
  const router = useRouter();
  const { login, isAuthReady, user, error: authError, clearError } = useAuth();
  
  // Rate limiting for login attempts - UPDATED TO USE LOGIN CONFIG
  const { checkLimit: checkLoginLimit, resetLimit: resetLoginLimit } = useRateLimit('LOGIN_HOOK', RATE_LIMITS.LOGIN);
  
  // Track failed attempts for this session
  const failedAttemptsRef = useRef(0);
  const lastAttemptTimeRef = useRef(0);

  const [state, setState] = useState<LoginState>({
    username: '',
    role: null,
    error: '',
    isLoading: false,
    step: 1,
    mounted: false,
    showAdminMode: false
  });

  // Set mounted state and clear any lingering auth errors
  useEffect(() => {
    setState(prev => ({ ...prev, mounted: true }));
    // Clear any auth errors when component mounts
    if (clearError) {
      clearError();
    }
  }, [clearError]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthReady && user) {
      console.log('[useLogin] User already logged in, redirecting...');
      router.replace('/');
    }
  }, [isAuthReady, user, router]);

  // Sync auth context errors - ONLY on step 2 and when relevant
  useEffect(() => {
    // Only sync auth errors when we're on step 2 (role selection)
    // This prevents rate limit errors from showing on the username step
    if (authError && state.step === 2) {
      setState(prev => ({ ...prev, error: authError, isLoading: false }));
    }
  }, [authError, state.step]);

  // Clear auth error when moving between steps
  useEffect(() => {
    if (clearError) {
      clearError();
    }
  }, [state.step, clearError]);

  // Update state helper with sanitization
  const updateState = useCallback((updates: Partial<LoginState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      
      // Sanitize username if it's being updated
      if (updates.username !== undefined) {
        newState.username = sanitizeUsername(updates.username);
      }
      
      return newState;
    });
  }, []);

  // Generate random delay to prevent timing attacks
  const getRandomDelay = useCallback(() => {
    return MIN_LOGIN_DELAY + Math.random() * (MAX_LOGIN_DELAY - MIN_LOGIN_DELAY);
  }, []);

  // Handle login with security enhancements
  const handleLogin = useCallback(async () => {
    const { username, role } = state;
    
    // Clear any previous auth errors
    if (clearError) {
      clearError();
    }
    
    // Clear local error state
    updateState({ error: '' });
    
    // Check rate limit
    const rateLimitResult = checkLoginLimit();
    if (!rateLimitResult.allowed) {
      const errorMsg = `Too many login attempts. Please wait ${rateLimitResult.waitTime} seconds.`;
      updateState({ 
        error: errorMsg,
        isLoading: false 
      });
      return;
    }
    
    // Validate inputs using schema
    const usernameValidation = authSchemas.username.safeParse(username);
    if (!usernameValidation.success) {
      updateState({ error: 'Invalid username format.', isLoading: false });
      return;
    }
    
    if (!role) {
      updateState({ error: 'Please select a role.', isLoading: false });
      return;
    }
    
    // Additional validation for admin role
    if (role === 'admin') {
      // Check failed attempts to prevent brute force
      if (failedAttemptsRef.current >= 3) {
        const timeSinceLastAttempt = Date.now() - lastAttemptTimeRef.current;
        const waitTime = Math.max(0, 30000 - timeSinceLastAttempt); // 30 second lockout
        
        if (waitTime > 0) {
          updateState({ 
            error: `Too many failed admin attempts. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
            isLoading: false 
          });
          return;
        } else {
          // Reset counter after lockout period
          failedAttemptsRef.current = 0;
        }
      }
    }
    
    updateState({ error: '', isLoading: true });
    
    try {
      // Random delay to prevent timing attacks
      const delay = getRandomDelay();
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Sanitize username before login
      const sanitizedUsername = usernameValidation.data;
      
      console.log('[useLogin] Attempting login with:', { 
        username: sanitizedUsername, 
        role,
        hasPassword: false // We're not using passwords in this demo
      });
      
      // Validate admin credentials if admin role
      if (role === 'admin' && !validateAdminCredentials(sanitizedUsername, role)) {
        failedAttemptsRef.current++;
        lastAttemptTimeRef.current = Date.now();
        
        // Generic error message to prevent username enumeration
        updateState({ 
          error: 'Invalid credentials. Please try again.', 
          isLoading: false 
        });
        return;
      }
      
      // Perform login - pass empty string for password (backward compatibility)
      const success = await login(sanitizedUsername, '', role);
      
      if (success) {
        console.log('[useLogin] Login successful, preparing redirect...');
        
        // Reset failed attempts on success
        failedAttemptsRef.current = 0;
        resetLoginLimit(); // Reset rate limit on success
        
        // Clear sensitive data from state
        updateState({ username: '', role: null, error: '', isLoading: false });
        
        // Extended delay to ensure auth context is fully updated
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Use replace to prevent back button issues
        console.log('[useLogin] Redirecting to home page...');
        router.replace('/');
        
      } else {
        console.error('[useLogin] Login failed, authError:', authError);
        
        // Track failed attempts for non-admin roles too
        if (role === 'admin') {
          failedAttemptsRef.current++;
          lastAttemptTimeRef.current = Date.now();
        }
        
        // The error should be set by the useEffect that watches authError
        // But we'll also set it here as a fallback
        if (!state.error && !authError) {
          updateState({ 
            error: 'Login failed. Please try again.', 
            isLoading: false 
          });
        } else {
          // Just ensure loading is false
          updateState({ isLoading: false });
        }
      }
    } catch (error) {
      console.error('[useLogin] Login error:', error);
      
      // Provide more specific error if available
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Rate limit') || error.message.includes('Too many')) {
          errorMessage = error.message;
        }
      }
      
      updateState({ 
        error: errorMessage, 
        isLoading: false 
      });
    }
  }, [state, authError, clearError, login, router, updateState, checkLoginLimit, resetLoginLimit, getRandomDelay]);

  // Handle username submission with validation
  const handleUsernameSubmit = useCallback(() => {
    // Clear any previous errors (including auth errors)
    updateState({ error: '' });
    if (clearError) {
      clearError();
    }
    
    // Validate username using schema
    const validation = authSchemas.username.safeParse(state.username);
    
    if (validation.success) {
      updateState({ error: '', step: 2 });
    } else {
      updateState({ error: validation.error.errors[0]?.message || 'Invalid username.' });
    }
  }, [state.username, updateState, clearError]);

  // Handle key press with rate limit awareness
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !state.isLoading) {
      e.preventDefault(); // Prevent form submission
      if (state.step === 1) {
        handleUsernameSubmit();
      } else if (state.step === 2 && state.role) {
        handleLogin();
      }
    }
  }, [state.step, state.role, state.isLoading, handleUsernameSubmit, handleLogin]);

  // Go back to username step
  const goBack = useCallback(() => {
    updateState({ step: 1, error: '', role: null });
    // Clear auth error when going back
    if (clearError) {
      clearError();
    }
  }, [updateState, clearError]);

  // Toggle admin mode with security considerations
  const handleCrownClick = useCallback(() => {
    // Add a small delay to prevent rapid clicking
    const now = Date.now();
    if (now - lastAttemptTimeRef.current < 500) {
      return;
    }
    lastAttemptTimeRef.current = now;
    
    updateState({ 
      showAdminMode: !state.showAdminMode,
      role: !state.showAdminMode ? null : state.role,
      error: '' // Clear any errors
    });
    
    // Clear auth error when toggling admin mode
    if (clearError) {
      clearError();
    }
  }, [state.showAdminMode, state.role, updateState, clearError]);

  // Handle username input with sanitization
  const handleUsernameChange = useCallback((value: string) => {
    // Apply basic length limit before sanitization
    if (value.length > 30) {
      return;
    }
    
    // Clear error when user types
    updateState({ username: value, error: '' });
    
    // Clear auth error when user types
    if (clearError) {
      clearError();
    }
  }, [updateState, clearError]);

  // Create role options
  const roleOptions: RoleOption[] = [
    {
      key: 'buyer',
      label: 'Buyer',
      icon: ShoppingBag,
      description: 'Browse and purchase items'
    },
    {
      key: 'seller',
      label: 'Seller',
      icon: User,
      description: 'List and sell your items'
    }
  ];

  // Add admin option if admin mode is enabled
  if (state.showAdminMode) {
    roleOptions.push({
      key: 'admin',
      label: 'Admin',
      icon: Crown,
      description: 'Platform administration'
    });
  }

  return {
    // State
    ...state,
    roleOptions,
    
    // Actions
    updateState,
    handleLogin,
    handleUsernameSubmit,
    handleKeyPress,
    handleUsernameChange,
    goBack,
    handleCrownClick,
    
    // Auth
    user,
    
    // Navigation
    router
  };
};