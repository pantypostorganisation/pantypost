// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { authService } from '@/services';
import { sanitizeUsername, sanitizeStrict } from '@/utils/security/sanitization';
import { authSchemas } from '@/utils/validation/schemas';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';

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
  login: (username: string, password?: string, role?: 'buyer' | 'seller' | 'admin') => Promise<boolean>;
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
  const validation = authSchemas.username.safeParse(username);
  if (!validation.success) {
    return validation.error.errors[0]?.message || 'Invalid username';
  }
  return null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const rateLimiter = getRateLimiter();

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

  // Login function using auth service with rate limiting
  const login = useCallback(async (
    username: string, 
    password: string = '', // Default for backward compatibility
    role: 'buyer' | 'seller' | 'admin' = 'buyer'
  ): Promise<boolean> => {
    console.log('[AuthContext] Login called with:', { username, hasPassword: !!password, role });
    
    // Check rate limit in context as well
    const rateLimitResult = rateLimiter.check('LOGIN_CONTEXT', {
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000 // 15 minutes
    });

    if (!rateLimitResult.allowed) {
      setError(`Too many login attempts. Please wait ${rateLimitResult.waitTime} seconds.`);
      return false;
    }

    // Validate and sanitize input
    const validationError = validateUsername(username);
    if (validationError) {
      console.error('[AuthContext] Validation error:', validationError);
      setError(sanitizeStrict(validationError));
      return false;
    }

    // Sanitize username
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      console.error('[AuthContext] Username sanitization failed');
      setError('Invalid username format');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('[AuthContext] Attempting login:', { username: sanitizedUsername, role });
      
      // Add error handling wrapper around authService call
      let result;
      try {
        console.log('[AuthContext] Calling authService.login with:', { 
          username: sanitizedUsername, 
          hasPassword: !!password,
          role 
        });
        
        result = await authService.login({ 
          username: sanitizedUsername, 
          password, // Include password for enhanced security
          role 
        });
        
        console.log('[AuthContext] authService.login returned:', {
          success: result?.success,
          hasData: !!result?.data,
          hasError: !!result?.error
        });
      } catch (authError) {
        console.error('[AuthContext] AuthService error:', authError);
        setError('Authentication service error. Please try again.');
        setLoading(false);
        return false;
      }
      
      if (result.success && result.data) {
        console.log('[AuthContext] Login successful, setting user:', { 
          username: result.data.user.username, 
          role: result.data.user.role 
        });
        
        setUser(result.data.user);
        setLoading(false); // Important: Clear loading state before return
        
        // Set up session monitoring for API mode
        setupSessionMonitoring();
        
        console.log('[AuthContext] Login process completed successfully');
        return true;
      } else {
        console.error('[AuthContext] Login failed:', {
          result,
          error: result.error,
          success: result.success,
          data: result.data,
          errorMessage: result.error?.message,
          errorCode: result.error?.code
        });
        setError(sanitizeStrict(result.error?.message || 'Login failed'));
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      setError('Login failed. Please try again.');
      setLoading(false);
      return false;
    }
  }, [setupSessionMonitoring, rateLimiter]);

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

  // Update user function using auth service with validation
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      setError('No user to update');
      return;
    }

    // Validate updates
    const sanitizedUpdates: Partial<User> = {};
    
    // Sanitize string fields
    if (updates.bio !== undefined) {
      sanitizedUpdates.bio = sanitizeStrict(updates.bio);
    }
    if (updates.username !== undefined) {
      const usernameError = validateUsername(updates.username);
      if (usernameError) {
        setError(usernameError);
        return;
      }
      sanitizedUpdates.username = sanitizeUsername(updates.username);
    }
    
    // Copy safe fields directly
    const safeFields = ['profilePicture', 'isVerified', 'tier', 'subscriberCount', 
                       'totalSales', 'rating', 'reviewCount'] as const;
    
    for (const field of safeFields) {
      if (field in updates) {
        (sanitizedUpdates as any)[field] = updates[field];
      }
    }

    try {
      console.log('[Auth] Updating user:', sanitizedUpdates);
      const result = await authService.updateCurrentUser(sanitizedUpdates);
      
      if (result.success && result.data) {
        console.log('[Auth] User updated successfully');
        setUser(result.data);
        setError(null);
      } else {
        console.error('[Auth] User update failed:', result.error);
        setError(sanitizeStrict(result.error?.message || 'Failed to update user'));
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