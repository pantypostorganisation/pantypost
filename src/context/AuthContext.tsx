// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { authService } from '@/services';

export interface User {
  id: string;
  username: string;
  role: 'buyer' | 'seller' | 'admin';
  email?: string;
  profilePicture?: string;
  isVerified: boolean;
  tier?: 'Tease' | 'Flirt' | 'Obsession' | 'Desire' | 'Goddess';
  subscriberCount?: number;
  totalSales?: number;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  lastActive: string;
  bio?: string;
  isBanned?: boolean;
  banReason?: string;
  banExpiresAt?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'unverified';
  verificationRequestedAt?: string;
  verificationRejectionReason?: string;
  verificationDocs?: any;
}

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
  login: (username: string, role?: 'buyer' | 'seller' | 'admin') => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Input validation
const validateUsername = (username: string): string | null => {
  if (!username || typeof username !== 'string') return 'Username is required';
  if (username.length < 2) return 'Username must be at least 2 characters';
  if (username.length > 50) return 'Username must be less than 50 characters';
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) return 'Username can only contain letters, numbers, underscores, and hyphens';
  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear session monitoring interval
  const clearSessionMonitoring = useCallback(() => {
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        setUser(null);
        clearSessionMonitoring(); // Clear monitoring if no user
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  }, [clearSessionMonitoring]);

  // Set up session monitoring
  const setupSessionMonitoring = useCallback(() => {
    // Clear any existing interval first
    clearSessionMonitoring();
    
    if (process.env.NEXT_PUBLIC_USE_API_AUTH === 'true') {
      // Check session every 5 minutes
      sessionCheckIntervalRef.current = setInterval(async () => {
        const isAuthenticated = await authService.isAuthenticated();
        if (!isAuthenticated) {
          console.log('[Auth] Session expired, clearing user');
          setUser(null);
          clearSessionMonitoring();
        } else {
          // Refresh user data
          await refreshSession();
        }
      }, 5 * 60 * 1000); // 5 minutes
    }
  }, [clearSessionMonitoring, refreshSession]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // Prevent double initialization
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        console.log('[Auth] Starting auth initialization...');
        
        // Check for existing session
        const result = await authService.getCurrentUser();
        console.log('[Auth] getCurrentUser result:', result);
        
        if (result.success && result.data) {
          console.log('[Auth] User found:', { 
            username: result.data.username, 
            role: result.data.role,
            isVerified: result.data.isVerified 
          });
          setUser(result.data);
          
          // Set up session monitoring for API mode
          setupSessionMonitoring();
        } else {
          console.log('[Auth] No user found in session');
        }
      } catch (error) {
        console.error('[Auth] Auth initialization error:', error);
      } finally {
        setIsAuthReady(true);
        initializingRef.current = false;
        console.log('[Auth] Auth initialization complete, isAuthReady: true');
      }
    };

    initAuth();

    // Cleanup
    return () => {
      clearSessionMonitoring();
    };
  }, [setupSessionMonitoring, clearSessionMonitoring]);

  // Listen for storage events (for multi-tab logout)
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'currentUser' && e.newValue === null) {
        // User logged out in another tab
        console.log('[Auth] User logged out in another tab');
        setUser(null);
        clearSessionMonitoring();
      } else if (e.key === 'currentUser' && e.newValue) {
        // User logged in or updated in another tab
        try {
          const updatedUser = JSON.parse(e.newValue);
          console.log('[Auth] User updated in another tab:', { 
            username: updatedUser.username, 
            role: updatedUser.role 
          });
          setUser(updatedUser);
          setupSessionMonitoring();
        } catch (error) {
          console.error('Error parsing user from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setupSessionMonitoring, clearSessionMonitoring]);

  // Login function using auth service
  const login = useCallback(async (username: string, role: 'buyer' | 'seller' | 'admin' = 'buyer'): Promise<boolean> => {
    // Validate input
    const validationError = validateUsername(username);
    if (validationError) {
      setError(validationError);
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[Auth] Attempting login:', { username, role });
      const result = await authService.login({ username, role });
      
      if (result.success && result.data) {
        console.log('[Auth] Login successful:', { 
          username: result.data.user.username, 
          role: result.data.user.role 
        });
        setUser(result.data.user);
        
        // Set up session monitoring for API mode
        setupSessionMonitoring();
        
        return true;
      } else {
        console.error('[Auth] Login failed:', result.error);
        setError(result.error?.message || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setupSessionMonitoring]);

  // Logout function using auth service
  const logout = useCallback(async () => {
    try {
      console.log('[Auth] Logging out...');
      await authService.logout();
      setUser(null);
      setError(null);
      
      // Clear session monitoring
      clearSessionMonitoring();
      
      console.log('[Auth] Logout complete');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if service fails
      setUser(null);
      
      // Clear session monitoring
      clearSessionMonitoring();
    }
  }, [clearSessionMonitoring]);

  // Update user function using auth service
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      setError('No user to update');
      return;
    }

    try {
      console.log('[Auth] Updating user:', updates);
      const result = await authService.updateCurrentUser(updates);
      
      if (result.success && result.data) {
        console.log('[Auth] User updated successfully');
        setUser(result.data);
        setError(null);
      } else {
        console.error('[Auth] User update failed:', result.error);
        setError(result.error?.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Update user error:', error);
      setError('Failed to update user');
    }
  }, [user]);

  const contextValue: AuthContextType = {
    user,
    isAuthReady,
    login,
    logout,
    updateUser,
    isLoggedIn: !!user,
    loading,
    error,
    clearError,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}