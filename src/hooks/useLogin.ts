// src/hooks/useLogin.ts

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, ShoppingBag, Crown } from 'lucide-react';
import { LoginState, RoleOption } from '@/types/login';
import { validateUsername, validateAdminCredentials } from '@/utils/loginUtils';
import { useRateLimit } from '@/utils/security/rate-limiter';
import { authSchemas } from '@/utils/validation/schemas';
import { sanitizeUsername } from '@/utils/security/sanitization';
import { securityService } from '@/services';

// Constants for security
const MIN_LOGIN_DELAY = 800;
const MAX_LOGIN_DELAY = 1200;

export const useLogin = () => {
  const router = useRouter();
  const { login, isAuthReady, user } = useAuth();
  
  // Rate limiting for login attempts
  const { checkLimit: checkLoginLimit } = useRateLimit('LOGIN');
  
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

  // Set mounted state
  useEffect(() => {
    setState(prev => ({ ...prev, mounted: true }));
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthReady && user) {
      router.replace('/');
    }
  }, [isAuthReady, user, router]);

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
    
    // Check rate limit
    const rateLimitResult = checkLoginLimit();
    if (!rateLimitResult.allowed) {
      updateState({ 
        error: `Too many login attempts. Please wait ${rateLimitResult.waitTime} seconds.`,
        isLoading: false 
      });
      return;
    }
    
    // Validate inputs using schema
    const usernameValidation = authSchemas.username.safeParse(username);
    if (!usernameValidation.success) {
      updateState({ error: 'Invalid username format.' });
      return;
    }
    
    if (!role) {
      updateState({ error: 'Please select a role.' });
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
      
      console.log('[Login] Attempting login with sanitized username');
      
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
      
      // Perform login
      const success = await login(sanitizedUsername, role);
      
      if (success) {
        console.log('[Login] Login successful, preparing redirect...');
        
        // Reset failed attempts on success
        failedAttemptsRef.current = 0;
        
        // Clear sensitive data from state
        updateState({ username: '', role: null });
        
        // Extended delay to ensure auth context is fully updated
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Use replace instead of push to prevent back button issues
        console.log('[Login] Redirecting to home page...');
        
        // Use window.location.href as primary method for forced navigation
        window.location.href = '/';
        
        // Backup redirect in case window.location doesn't work
        setTimeout(() => {
          router.replace('/');
        }, 100);
        
      } else {
        console.error('[Login] Login failed - authService returned false');
        
        // Track failed attempts for non-admin roles too
        if (role === 'admin') {
          failedAttemptsRef.current++;
          lastAttemptTimeRef.current = Date.now();
        }
        
        // Generic error message
        updateState({ 
          error: 'Invalid credentials. Please try again.', 
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('[Login] Login error:', error);
      
      // Generic error message
      updateState({ 
        error: 'An error occurred. Please try again.', 
        isLoading: false 
      });
    }
  }, [state.username, state.role, login, router, updateState, checkLoginLimit, getRandomDelay]);

  // Handle username submission with validation
  const handleUsernameSubmit = useCallback(() => {
    // Validate username using schema
    const validation = authSchemas.username.safeParse(state.username);
    
    if (validation.success) {
      updateState({ error: '', step: 2 });
    } else {
      updateState({ error: validation.error.errors[0]?.message || 'Invalid username.' });
    }
  }, [state.username, updateState]);

  // Handle key press with rate limit awareness
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !state.isLoading) {
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
  }, [updateState]);

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
  }, [state.showAdminMode, state.role, updateState]);

  // Handle username input with sanitization
  const handleUsernameChange = useCallback((value: string) => {
    // Apply basic length limit before sanitization
    if (value.length > 30) {
      return;
    }
    
    updateState({ username: value, error: '' });
  }, [updateState]);

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