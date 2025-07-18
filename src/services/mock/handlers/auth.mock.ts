// src/services/mock/handlers/auth.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { v4 as uuidv4 } from 'uuid';
import { User } from '@/context/AuthContext';
import { sanitizeUsername, sanitizeEmail, sanitizeStrict } from '@/utils/security/sanitization';
import { authSchemas } from '@/utils/validation/schemas';
import { securityService } from '@/services/security.service';
import { z } from 'zod';

interface MockUser extends User {
  password?: string;
}

interface AuthTokens {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

// Validation schemas for mock auth
const mockLoginSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  role: z.enum(['buyer', 'seller', 'admin'])
});

const mockSignupSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email().max(100),
  password: z.string().min(8).max(100),
  role: z.enum(['buyer', 'seller'])
});

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
    
    // Validate input
    try {
      const validatedData = mockLoginSchema.parse(data);
      data = validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: sanitizeStrict(error.errors[0].message) || 'Invalid input',
            field: error.errors[0].path[0] as string
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
      };
    }
    
    const { username, role } = data;
    
    // Sanitize username
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid username format',
        },
      };
    }
    
    // Get all users
    const users = await mockDataStore.get<Record<string, MockUser>>('users', {});
    
    // Check if user exists
    let user = users[sanitizedUsername];
    
    if (!user) {
      // Create new user for testing with sanitized data
      const isAdmin = sanitizedUsername === 'oakley' || sanitizedUsername === 'gerome';
      user = {
        id: `user_${uuidv4()}`,
        username: sanitizedUsername,
        role: isAdmin ? 'admin' : role,
        email: sanitizeEmail(`${sanitizedUsername}@example.com`) || `${sanitizedUsername}@example.com`,
        isVerified: isAdmin || sanitizedUsername.includes('verified'),
        tier: role === 'seller' && !isAdmin ? 'Tease' : undefined,
        subscriberCount: Math.floor(Math.random() * 100),
        totalSales: Math.floor(Math.random() * 50),
        rating: 3 + Math.random() * 2,
        reviewCount: Math.floor(Math.random() * 20),
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date().toISOString(),
        bio: sanitizeStrict(`Hi, I'm ${sanitizedUsername}!`) || '',
        isBanned: false,
        verificationStatus: isAdmin || sanitizedUsername.includes('verified') ? 'verified' : 'unverified',
      };
      
      users[sanitizedUsername] = user;
      await mockDataStore.set('users', users);
    }
    
    // Generate secure tokens
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
    
    // Validate input
    try {
      const validatedData = mockSignupSchema.parse(data);
      data = validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: sanitizeStrict(error.errors[0].message) || 'Invalid input',
            field: error.errors[0].path[0] as string
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input' },
      };
    }
    
    const { username, email, password, role } = data;
    
    // Additional security validation
    const contentCheck = securityService.checkContentSecurity(username);
    if (!contentCheck.safe) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username contains invalid content',
          field: 'username',
        },
      };
    }
    
    // Sanitize inputs
    const sanitizedUsername = sanitizeUsername(username);
    const sanitizedEmail = sanitizeEmail(email);
    
    if (!sanitizedUsername || !sanitizedEmail) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input format',
        },
      };
    }
    
    // Check if user exists
    const users = await mockDataStore.get<Record<string, MockUser>>('users', {});
    
    if (users[sanitizedUsername]) {
      return {
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'Username already taken',
          field: 'username',
        },
      };
    }
    
    // Create new user with sanitized data
    const newUser: MockUser = {
      id: `user_${uuidv4()}`,
      username: sanitizedUsername,
      role,
      email: sanitizedEmail,
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
    
    users[sanitizedUsername] = newUser;
    await mockDataStore.set('users', users);
    
    // Generate secure tokens
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
    
    if (!refreshToken || typeof refreshToken !== 'string') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Refresh token is required',
        },
      };
    }
    
    const storedTokens = await mockDataStore.get<AuthTokens | null>('authTokens', null);
    
    if (!storedTokens || storedTokens.refreshToken !== refreshToken) {
      return {
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid refresh token',
        },
      };
    }
    
    // Generate new secure tokens
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
    const rawUsername = params?.username || new URL(endpoint, window.location.origin).searchParams.get('username');
    
    if (!rawUsername) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username is required',
        },
      };
    }
    
    // Validate and sanitize username
    const sanitizedUsername = sanitizeUsername(rawUsername);
    if (!sanitizedUsername) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid username format',
        },
      };
    }
    
    // Check content security
    const contentCheck = securityService.checkContentSecurity(sanitizedUsername);
    if (!contentCheck.safe) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Username contains invalid content',
        },
      };
    }
    
    const users = await mockDataStore.get<Record<string, MockUser>>('users', {});
    const available = !users[sanitizedUsername.toLowerCase()];
    
    return {
      success: true,
      data: {
        available,
        message: available ? 'Username is available' : 'Username is already taken',
      },
    };
  },
} as const;