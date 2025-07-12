// src/hooks/useLogin.ts

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, ShoppingBag, Crown } from 'lucide-react';
import { LoginState, RoleOption } from '@/types/login';
import { validateUsername, validateAdminCredentials } from '@/utils/loginUtils';

export const useLogin = () => {
  const router = useRouter();
  const { login, isAuthReady, user } = useAuth();

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

  // Update state helper
  const updateState = useCallback((updates: Partial<LoginState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle login
  const handleLogin = useCallback(async () => {
    const { username, role } = state;
    
    if (!validateUsername(username) || !role) {
      updateState({ error: 'Please complete all fields.' });
      return;
    }

    if (!validateAdminCredentials(username, role)) {
      updateState({ error: 'Invalid admin credentials.' });
      return;
    }
    
    updateState({ error: '', isLoading: true });
    
    try {
      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log('[Login] Attempting login with:', { username: username.trim(), role });
      
      // Perform login
      const success = await login(username.trim(), role);
      
      if (success) {
        console.log('[Login] Login successful, preparing redirect...');
        
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
        updateState({ error: 'Login failed. Please check your credentials and try again.', isLoading: false });
      }
    } catch (error) {
      console.error('[Login] Login error:', error);
      updateState({ error: 'Login failed. Please try again.', isLoading: false });
    }
  }, [state.username, state.role, login, router, updateState]);

  // Handle username submission
  const handleUsernameSubmit = useCallback(() => {
    if (validateUsername(state.username)) {
      updateState({ error: '', step: 2 });
    } else {
      updateState({ error: 'Please enter a username.' });
    }
  }, [state.username, updateState]);

  // Handle key press
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

  // Toggle admin mode
  const handleCrownClick = useCallback(() => {
    updateState({ 
      showAdminMode: !state.showAdminMode,
      role: !state.showAdminMode ? null : state.role
    });
  }, [state.showAdminMode, state.role, updateState]);

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
    goBack,
    handleCrownClick,
    
    // Auth
    user,
    
    // Navigation
    router
  };
};