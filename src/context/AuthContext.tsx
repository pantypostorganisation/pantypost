// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { usePathname } from 'next/navigation';

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
  getAuthToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Direct API URL - no environment variables, no complications
const API_BASE_URL = 'http://localhost:5000/api';

// Simple fetch wrapper with auth token
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error?.message || 'API request failed');
  }

  return data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get auth token
  const getAuthToken = useCallback(() => {
    return localStorage.getItem('auth_token');
  }, []);

  // Refresh session - fetch current user
  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await fetchWithAuth('/auth/me');
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setUser(null);
      // Clear invalid token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log('[Auth] Initializing...');
      
      try {
        await refreshSession();
      } catch (error) {
        console.error('[Auth] Init error:', error);
      } finally {
        setIsAuthReady(true);
        console.log('[Auth] Ready');
      }
    };

    initAuth();
  }, [refreshSession]);

  // Login function
  const login = useCallback(async (
    username: string, 
    password: string = '', 
    role: 'buyer' | 'seller' | 'admin' = 'buyer'
  ): Promise<boolean> => {
    console.log('[Auth] Login attempt:', { username, role });
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();
      console.log('[Auth] Login response:', data);

      if (data.success && data.data) {
        // Store tokens
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('refresh_token', data.data.refreshToken);
        
        // Set user state
        setUser(data.data.user);
        
        console.log('[Auth] Login successful');
        setLoading(false);
        return true;
      } else {
        setError(data.error?.message || 'Login failed');
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      setError('Network error. Please try again.');
      setLoading(false);
      return false;
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    console.log('[Auth] Logging out...');
    
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Call logout endpoint
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('[Auth] Logout API error:', error);
    }

    // Clear local state regardless of API response
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.clear();
    setUser(null);
    setError(null);
    
    console.log('[Auth] Logout complete');
  }, []);

  // Update user function
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) {
      setError('No user to update');
      return;
    }

    try {
      const response = await fetchWithAuth(`/users/${user.username}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });

      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setError(response.error?.message || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Update user error:', error);
      setError(error.message || 'Failed to update user');
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
    getAuthToken,
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
