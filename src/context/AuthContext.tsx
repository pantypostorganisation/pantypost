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

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  }, []);

  // Initialize auth state and set up session monitoring
  useEffect(() => {
    const initAuth = async () => {
      // Prevent double initialization
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        // Check for existing session
        const result = await authService.getCurrentUser();
        if (result.success && result.data) {
          setUser(result.data);
          
          // Set up session monitoring for API mode
          if (process.env.NEXT_PUBLIC_USE_API_AUTH === 'true') {
            // Check session every 5 minutes
            sessionCheckIntervalRef.current = setInterval(async () => {
              const isAuthenticated = await authService.isAuthenticated();
              if (!isAuthenticated) {
                setUser(null);
                clearInterval(sessionCheckIntervalRef.current!);
              } else {
                // Refresh user data
                await refreshSession();
              }
            }, 5 * 60 * 1000); // 5 minutes
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsAuthReady(true);
        initializingRef.current = false;
      }
    };

    initAuth();

    // Cleanup
    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
    };
  }, [refreshSession]);

  // Listen for storage events (for multi-tab logout)
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key === 'currentUser' && e.newValue === null) {
        // User logged out in another tab
        setUser(null);
      } else if (e.key === 'currentUser' && e.newValue) {
        // User logged in or updated in another tab
        try {
          const updatedUser = JSON.parse(e.newValue);
          setUser(updatedUser);
        } catch (error) {
          console.error('Error parsing user from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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
      const result = await authService.login({ username, role });
      
      if (result.success && result.data) {
        setUser(result.data.user);
        
        // Set up session monitoring for API mode
        if (process.env.NEXT_PUBLIC_USE_API_AUTH === 'true' && !sessionCheckIntervalRef.current) {
          sessionCheckIntervalRef.current = setInterval(refreshSession, 5 * 60 * 1000);
        }
        
        return true;
      } else {
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
  }, [refreshSession]);

  // Logout function using auth service
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      setError(null);
      
      // Clear session monitoring
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if service fails
      setUser(null);
      
      // Clear session monitoring
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
    }
  }, []);

  // Update user function using auth service
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      setError('No user to update');
      return;
    }

    try {
      const result = await authService.updateCurrentUser(updates);
      
      if (result.success && result.data) {
        setUser(result.data);
        setError(null);
      } else {
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
