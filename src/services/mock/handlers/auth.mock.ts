// src/services/mock/handlers/auth.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/context/AuthContext';

interface MockUser extends User {
  password?: string;
}

interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

// Mock auth state
let currentUser: MockUser | null = null;
let authTokens: AuthTokens | null = null;

export const mockAuthHandlers = {
  // Login handler
  login: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<any>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const { username, role } = data;
    
    if (!username || !role) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username and role are required',
        },
      };
    }
    
    // Get all users
    const users = await mockDataStore.get<Record<string, MockUser>>('users', {});
    
    // Check if user exists
    let user = users[username];
    
    if (!user) {
      // Create new user for testing
      const isAdmin = username === 'oakley' || username === 'gerome';
      user = {
        id: `user_${uuidv4()}`,
        username,
        role: isAdmin ? 'admin' : role,
        email: `${username}@example.com`,
        isVerified: isAdmin || username.includes('verified'),
        tier: role === 'seller' && !isAdmin ? 'Tease' : undefined,
        subscriberCount: Math.floor(Math.random() * 100),
        totalSales: Math.floor(Math.random() * 50),
        rating: 3 + Math.random() * 2,
        reviewCount: Math.floor(Math.random() * 20),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date().toISOString(),
        bio: `Hi, I'm ${username}!`,
        isBanned: false,
        verificationStatus: isAdmin || username.includes('verified') ? 'verified' : 'unverified',
      };
      
      users[username] = user;
      await mockDataStore.set('users', users);
    }
    
    // Generate tokens
    const token = `mock_token_${uuidv4()}`;
    const refreshToken = `mock_refresh_${uuidv4()}`;
    
    authTokens = {
      token,
      refreshToken,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
    };
    
    currentUser = user;
    await mockDataStore.set('currentUser', user);
    await mockDataStore.set('authTokens', authTokens);
    
    return {
      success: true,
      data: {
        user,
        token,
        refreshToken,
      },
    };
  },
  
  // Signup handler
  signup: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<any>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const { username, email, password, role } = data;
    
    // Validation
    if (!username || !email || !password || !role) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required',
        },
      };
    }
    
    if (username.length < 3) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username must be at least 3 characters',
          field: 'username',
        },
      };
    }
    
    if (!email.includes('@')) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid email format',
          field: 'email',
        },
      };
    }
    
    if (password.length < 8) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters',
          field: 'password',
        },
      };
    }
    
    // Check if user exists
    const users = await mockDataStore.get<Record<string, MockUser>>('users', {});
    
    if (users[username]) {
      return {
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Username already taken',
          field: 'username',
        },
      };
    }
    
    // Create new user
    const newUser: MockUser = {
      id: `user_${uuidv4()}`,
      username,
      role,
      email,
      password, // In real implementation, this would be hashed
      isVerified: false,
      tier: role === 'seller' ? 'Tease' : undefined,
      subscriberCount: 0,
      totalSales: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      bio: '',
      isBanned: false,
      verificationStatus: 'unverified',
    };
    
    users[username] = newUser;
    await mockDataStore.set('users', users);
    
    // Generate tokens
    const token = `mock_token_${uuidv4()}`;
    const refreshToken = `mock_refresh_${uuidv4()}`;
    
    authTokens = {
      token,
      refreshToken,
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
    
    currentUser = newUser;
    await mockDataStore.set('currentUser', newUser);
    await mockDataStore.set('authTokens', authTokens);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    
    return {
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        refreshToken,
      },
    };
  },
  
  // Logout handler
  logout: async (method: string): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    currentUser = null;
    authTokens = null;
    await mockDataStore.set('currentUser', null);
    await mockDataStore.set('authTokens', null);
    
    return { success: true };
  },
  
  // Get current user
  me: async (): Promise<ApiResponse<User | null>> => {
    const storedUser = await mockDataStore.get<MockUser | null>('currentUser', null);
    const storedTokens = await mockDataStore.get<AuthTokens | null>('authTokens', null);
    
    if (!storedUser || !storedTokens) {
      return {
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Not authenticated',
        },
      };
    }
    
    // Check token expiry
    if (storedTokens.expiresAt < Date.now()) {
      return {
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token expired',
        },
      };
    }
    
    // Update last active
    const users = await mockDataStore.get<Record<string, MockUser>>('users', {});
    if (users[storedUser.username]) {
      users[storedUser.username].lastActive = new Date().toISOString();
      await mockDataStore.set('users', users);
    }
    
    // Remove password if present
    const { password, ...userWithoutPassword } = storedUser;
    
    return {
      success: true,
      data: userWithoutPassword as User,
    };
  },
  
  // Refresh token
  refresh: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<any>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const { refreshToken } = data;
    const storedTokens = await mockDataStore.get<AuthTokens | null>('authTokens', null);
    
    if (!refreshToken || !storedTokens || storedTokens.refreshToken !== refreshToken) {
      return {
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token',
        },
      };
    }
    
    // Generate new tokens
    const newToken = `mock_token_${uuidv4()}`;
    const newRefreshToken = `mock_refresh_${uuidv4()}`;
    
    const newTokens: AuthTokens = {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresAt: Date.now() + 30 * 60 * 1000,
    };
    
    await mockDataStore.set('authTokens', newTokens);
    
    return {
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    };
  },
  
  // Verify username availability
  verifyUsername: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<any>> => {
    const username = params?.username || new URL(endpoint, window.location.origin).searchParams.get('username');
    
    if (!username) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username is required',
        },
      };
    }
    
    const users = await mockDataStore.get<Record<string, MockUser>>('users', {});
    const available = !users[username.toLowerCase()];
    
    return {
      success: true,
      data: {
        available,
        message: available ? 'Username is available' : 'Username is already taken',
      },
    };
  },
} as const;