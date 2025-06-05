// src/context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

export interface User {
  id: string;
  username: string;
  role: 'buyer' | 'seller' | 'admin';
  email?: string;
  profilePicture?: string;
  isVerified: boolean; // ✅ SIMPLIFIED: Single source of truth
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
  
  // ✅ SIMPLIFIED: Consolidated verification properties
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'unverified';
  verificationRequestedAt?: string;
  verificationRejectionReason?: string;
  verificationDocs?: any; // Add this to store docs in auth context
}

interface AuthContextType {
  user: User | null;
  isAuthReady: boolean;
  login: (username: string, role?: 'buyer' | 'seller' | 'admin') => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoggedIn: boolean;
  loading: boolean;
  error: string | null; // ✅ ADDED: Error state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ ADDED: Safe localStorage operations
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }
};

// ✅ ADDED: Input validation
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

  // ✅ IMPROVED: Safe initialization with error handling
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = safeLocalStorage.getItem('currentUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // ✅ ADDED: Validate stored user data
          if (parsedUser && typeof parsedUser === 'object' && parsedUser.username) {
            // ✅ IMPORTANT: Check if we have verification data in the all_users_v2 store
            const allUsersData = safeLocalStorage.getItem('all_users_v2');
            if (allUsersData) {
              try {
                const allUsers = JSON.parse(allUsersData);
                const storedUserData = allUsers[parsedUser.username];
                
                if (storedUserData && storedUserData.verificationStatus) {
                  // Merge verification data from all_users_v2
                  parsedUser.verificationStatus = storedUserData.verificationStatus;
                  parsedUser.verificationRequestedAt = storedUserData.verificationRequestedAt;
                  parsedUser.verificationRejectionReason = storedUserData.verificationRejectionReason;
                  parsedUser.verificationDocs = storedUserData.verificationDocs;
                  parsedUser.isVerified = storedUserData.verificationStatus === 'verified';
                }
              } catch (e) {
                console.error('Error parsing all_users_v2 data:', e);
              }
            }
            
            // ✅ ADDED: Migrate old user data format
            const migratedUser: User = {
              ...parsedUser,
              isVerified: parsedUser.isVerified ?? parsedUser.verified ?? false,
              verificationStatus: parsedUser.verificationStatus ?? (parsedUser.verified ? 'verified' : 'unverified'),
              createdAt: parsedUser.createdAt ?? new Date().toISOString(),
              lastActive: new Date().toISOString(), // Always update last active
            };
            
            setUser(migratedUser);
            
            // ✅ ADDED: Update stored user with migrated data
            safeLocalStorage.setItem('currentUser', JSON.stringify(migratedUser));
          } else {
            // Invalid user data, clear it
            safeLocalStorage.removeItem('currentUser');
          }
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        safeLocalStorage.removeItem('currentUser');
        setError('Failed to load user data');
      } finally {
        setIsAuthReady(true);
      }
    };

    initAuth();
  }, []);

  // ✅ IMPROVED: Better error handling and validation
  const login = useCallback(async (username: string, role: 'buyer' | 'seller' | 'admin' = 'buyer'): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // ✅ ADDED: Input validation
      const usernameError = validateUsername(username);
      if (usernameError) {
        setError(usernameError);
        return false;
      }

      const normalizedUsername = username.trim().toLowerCase();
      
      // Admin users check
      const isAdmin = normalizedUsername === 'oakley' || normalizedUsername === 'gerome';
      const userRole = isAdmin ? 'admin' : role;

      // ✅ IMPORTANT: Check if user already exists in all_users_v2
      let existingVerificationData = null;
      const allUsersData = safeLocalStorage.getItem('all_users_v2');
      if (allUsersData) {
        try {
          const allUsers = JSON.parse(allUsersData);
          const existingUser = allUsers[normalizedUsername];
          if (existingUser && existingUser.verificationStatus) {
            existingVerificationData = {
              verificationStatus: existingUser.verificationStatus,
              verificationRequestedAt: existingUser.verificationRequestedAt,
              verificationRejectionReason: existingUser.verificationRejectionReason,
              verificationDocs: existingUser.verificationDocs,
            };
          }
        } catch (e) {
          console.error('Error checking existing user data:', e);
        }
      }

      // Create user object with proper defaults
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: normalizedUsername,
        role: userRole,
        email: `${normalizedUsername}@pantypost.com`,
        isVerified: existingVerificationData?.verificationStatus === 'verified' || isAdmin,
        tier: userRole === 'seller' ? 'Tease' : undefined,
        subscriberCount: 0,
        totalSales: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        bio: '',
        isBanned: false,
        verificationStatus: existingVerificationData?.verificationStatus || (isAdmin ? 'verified' : 'unverified'),
        verificationRequestedAt: existingVerificationData?.verificationRequestedAt,
        verificationRejectionReason: existingVerificationData?.verificationRejectionReason,
        verificationDocs: existingVerificationData?.verificationDocs,
      };

      // Store in localStorage with error handling
      const success = safeLocalStorage.setItem('currentUser', JSON.stringify(newUser));
      if (!success) {
        setError('Failed to save user data');
        return false;
      }
      
      setUser(newUser);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ IMPROVED: Safe logout with cleanup
  const logout = useCallback(() => {
    try {
      safeLocalStorage.removeItem('currentUser');
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if localStorage fails
      setUser(null);
    }
  }, []);

  // ✅ IMPROVED: Safe user updates with validation and persistence to all_users_v2
  const updateUser = useCallback((updates: Partial<User>) => {
    if (!user) {
      setError('No user to update');
      return;
    }

    try {
      const updatedUser = { 
        ...user, 
        ...updates,
        lastActive: new Date().toISOString() // Always update last active
      };
      
      // Update currentUser in localStorage
      const success = safeLocalStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      // ✅ IMPORTANT: Also update all_users_v2 to maintain consistency
      const allUsersData = safeLocalStorage.getItem('all_users_v2');
      if (allUsersData) {
        try {
          const allUsers = JSON.parse(allUsersData);
          allUsers[user.username] = {
            ...allUsers[user.username],
            ...updatedUser,
          };
          safeLocalStorage.setItem('all_users_v2', JSON.stringify(allUsers));
        } catch (e) {
          console.error('Error updating all_users_v2:', e);
        }
      }
      
      if (success) {
        setUser(updatedUser);
        setError(null);
      } else {
        setError('Failed to update user data');
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
