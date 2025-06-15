// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { safeStorage } from '@/utils/safeStorage';

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
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate or get user ID
const getUserId = (): string => {
  let userId = safeStorage.getItem<string>('user_device_id', '');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    safeStorage.setItem('user_device_id', userId);
  }
  return userId;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user data on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        setLoading(true);
        setError(null);
        
        const storedUser = safeStorage.getItem<User | null>('user', null);
        
        if (storedUser) {
          // Check if user is banned
          if (storedUser.isBanned && storedUser.banExpiresAt) {
            const banExpiry = new Date(storedUser.banExpiresAt);
            if (banExpiry > new Date()) {
              // Still banned
              setUser(storedUser);
            } else {
              // Ban expired, update user
              const updatedUser = { ...storedUser, isBanned: false, banReason: undefined, banExpiresAt: undefined };
              setUser(updatedUser);
              safeStorage.setItem('user', updatedUser);
            }
          } else {
            setUser(storedUser);
          }
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
        setIsAuthReady(true);
      }
    };

    loadUser();
  }, []);

  const login = useCallback(async (username: string, role: 'buyer' | 'seller' | 'admin' = 'buyer'): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Check if user exists in the users store
      const allUsers = safeStorage.getItem<Record<string, any>>('all_users_v2', {}) || {};
      const existingUser = allUsers[username.toLowerCase()];

      if (existingUser) {
        // Check if user is banned
        if (existingUser.isBanned && existingUser.banExpiresAt) {
          const banExpiry = new Date(existingUser.banExpiresAt);
          if (banExpiry > new Date()) {
            setError(`Account banned until ${banExpiry.toLocaleDateString()}. Reason: ${existingUser.banReason || 'Violation of terms'}`);
            return false;
          }
        }

        // User exists, use their stored data
        const userData: User = {
          ...existingUser,
          lastActive: new Date().toISOString(),
        };
        
        setUser(userData);
        safeStorage.setItem('user', userData);
        
        // Update user in allUsers
        allUsers[username.toLowerCase()] = userData;
        safeStorage.setItem('all_users_v2', allUsers);
        
        return true;
      }

      // Admin check
      const isAdmin = username.toLowerCase() === 'oakley' || username.toLowerCase() === 'gerome';
      if (isAdmin) {
        role = 'admin';
      }

      // Create new user
      const newUser: User = {
        id: getUserId(),
        username: username.toLowerCase(),
        role: isAdmin ? 'admin' : role,
        isVerified: false,
        verificationStatus: 'unverified',
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        tier: role === 'seller' ? 'Tease' : undefined,
        subscriberCount: 0,
        totalSales: 0,
        rating: 0,
        reviewCount: 0,
      };

      // Save new user
      allUsers[username.toLowerCase()] = newUser;
      safeStorage.setItem('all_users_v2', allUsers);
      
      setUser(newUser);
      safeStorage.setItem('user', newUser);
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to log in');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    safeStorage.removeItem('user');
    setError(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    // Save to storage
    safeStorage.setItem('user', updatedUser);
    
    // Update in allUsers
    const allUsers = safeStorage.getItem<Record<string, any>>('all_users_v2', {}) || {};
    allUsers[user.username] = updatedUser;
    safeStorage.setItem('all_users_v2', allUsers);
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