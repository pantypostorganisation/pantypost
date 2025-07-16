// src/services/auth.service.ts

import { User } from '@/context/AuthContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, API_BASE_URL, buildApiUrl, apiCall, ApiResponse, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from './api.config';
import { authSchemas } from '@/utils/validation/schemas';
import { sanitizeUsername, sanitizeEmail, sanitizeStrict } from '@/utils/security/sanitization';
import { securityService } from './security.service';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { z } from 'zod';

export interface LoginRequest {
  username: string;
  password?: string; // Made optional for backward compatibility
  role: 'buyer' | 'seller' | 'admin';
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  role: 'buyer' | 'seller';
}

export interface AuthResponse {
  user: User;
  token?: string;
  refreshToken?: string;
}

export interface UsernameCheckResponse {
  available: boolean;
  message?: string;
}

/**
 * Authentication Service with security enhancements
 */
export class AuthService {
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private rateLimiter = getRateLimiter();
  private readonly TOKEN_REFRESH_INTERVAL = 25 * 60 * 1000; // 25 minutes
  private readonly MAX_TOKEN_AGE = 30 * 60 * 1000; // 30 minutes
  private readonly SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private sessionCheckTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize interceptor on service creation
    if (typeof window !== 'undefined') {
      this.initializeInterceptor();
      this.initializeSessionPersistence();
      this.startSessionValidation();
    }
  }

  /**
   * Initialize fetch interceptor for auth headers
   */
  private initializeInterceptor() {
    // Store original fetch
    const originalFetch = window.fetch;

    // Override fetch to add auth headers and security headers
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Get token from storage
      const token = await this.getValidToken();
      
      // Add auth header if token exists and this is an API call
      if (token && FEATURES.USE_API_AUTH && API_BASE_URL) {
        const url = typeof input === 'string' ? input : input.toString();
        if (url.startsWith(API_BASE_URL)) {
          init = init || {};
          init.headers = {
            ...init.headers,
            'Authorization': `Bearer ${token}`,
            // Add security headers
            ...securityService.getSecureHeaders(),
          };
        }
      }

      // Make the request
      const response = await originalFetch(input, init);

      // Handle 401 responses (unauthorized)
      if (response.status === 401 && FEATURES.USE_API_AUTH) {
        // Only try to refresh if we're not already refreshing
        if (!this.isRefreshing) {
          this.isRefreshing = true;

          try {
            // Try to refresh token
            const refreshResult = await this.refreshToken();
            
            if (refreshResult.success && refreshResult.data) {
              // Store new tokens securely
              await this.storeTokens(refreshResult.data.token, refreshResult.data.refreshToken);

              // Notify all subscribers
              this.refreshSubscribers.forEach(callback => callback(refreshResult.data!.token));
              this.refreshSubscribers = [];

              // Retry original request with new token
              if (init?.headers) {
                (init.headers as any)['Authorization'] = `Bearer ${refreshResult.data.token}`;
              }
              return originalFetch(input, init);
            } else {
              // Refresh failed, logout user
              await this.logout();
              window.location.href = '/login';
            }
          } finally {
            this.isRefreshing = false;
          }
        } else {
          // Wait for token refresh to complete
          return new Promise((resolve) => {
            this.refreshSubscribers.push((token: string) => {
              if (init?.headers) {
                (init.headers as any)['Authorization'] = `Bearer ${token}`;
              }
              resolve(originalFetch(input, init));
            });
          });
        }
      }

      return response;
    };
  }

  /**
   * Start periodic session validation
   */
  private startSessionValidation() {
    this.sessionCheckTimer = setInterval(async () => {
      const isValid = await this.validateSession();
      if (!isValid) {
        await this.logout();
        window.location.href = '/login';
      }
    }, this.SESSION_CHECK_INTERVAL);
  }

  /**
   * Validate current session
   */
  private async validateSession(): Promise<boolean> {
    try {
      const token = await this.getValidToken();
      const user = await storageService.getItem<User | null>('currentUser', null);
      
      if (!token || !user) {
        return false;
      }

      // Check for session hijacking by validating stored session fingerprint
      const sessionFingerprint = await this.getSessionFingerprint();
      const storedFingerprint = await storageService.getItem<string | null>('session_fingerprint', null);
      
      if (storedFingerprint && storedFingerprint !== sessionFingerprint) {
        console.warn('Session fingerprint mismatch - possible session hijacking');
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate session fingerprint for security
   */
  private async getSessionFingerprint(): Promise<string> {
    if (typeof window === 'undefined') return '';
    
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
    ].join('|');

    // Hash the components
    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(components);
      const hash = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }

    return components;
  }

  /**
   * Get valid token with expiry check
   */
  private async getValidToken(): Promise<string | null> {
    const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY, null);
    if (!token) return null;

    // Check token age
    const tokenData = await storageService.getItem<{ token: string; timestamp: number } | null>('auth_token_data', null);
    if (tokenData && Date.now() - tokenData.timestamp > this.MAX_TOKEN_AGE) {
      // Token expired, try to refresh
      const refreshResult = await this.refreshToken();
      if (refreshResult.success && refreshResult.data) {
        return refreshResult.data.token;
      }
      return null;
    }

    return token;
  }

  /**
   * Store tokens securely
   */
  private async storeTokens(token: string, refreshToken?: string): Promise<void> {
    await storageService.setItem(AUTH_TOKEN_KEY, token);
    await storageService.setItem('auth_token_data', {
      token,
      timestamp: Date.now()
    });
    
    if (refreshToken) {
      await storageService.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    // Store session fingerprint
    const fingerprint = await this.getSessionFingerprint();
    await storageService.setItem('session_fingerprint', fingerprint);
  }

  /**
   * Initialize session persistence
   */
  private async initializeSessionPersistence() {
    try {
      const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY, null);
      const user = await storageService.getItem<User | null>('currentUser', null);

      if (token && user && FEATURES.USE_API_AUTH) {
        // Verify token is still valid
        const result = await apiCall<User>(API_ENDPOINTS.AUTH.ME);
        
        if (result.success && result.data) {
          // Sanitize and update user data with fresh data from server
          const sanitizedUser = this.sanitizeUserData(result.data);
          await storageService.setItem('currentUser', sanitizedUser);
          
          // Set up token refresh timer
          this.setupTokenRefreshTimer();
        } else {
          // Token invalid, clear auth state
          await this.clearAuthState();
        }
      }
    } catch (error) {
      console.error('Session persistence error:', error);
      await this.clearAuthState();
    }
  }

  /**
   * Set up automatic token refresh
   */
  private setupTokenRefreshTimer() {
    // Clear existing timer
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    // Refresh token before expiry
    this.tokenRefreshTimer = setTimeout(async () => {
      const result = await this.refreshToken();
      if (result.success) {
        this.setupTokenRefreshTimer();
      }
    }, this.TOKEN_REFRESH_INTERVAL);
  }

  /**
   * Clear authentication state
   */
  private async clearAuthState() {
    await storageService.removeItem('currentUser');
    await storageService.removeItem(AUTH_TOKEN_KEY);
    await storageService.removeItem(REFRESH_TOKEN_KEY);
    await storageService.removeItem('auth_token_data');
    await storageService.removeItem('session_fingerprint');
    
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    if (this.sessionCheckTimer) {
      clearInterval(this.sessionCheckTimer);
      this.sessionCheckTimer = null;
    }
  }

  /**
   * Sanitize user data to prevent XSS
   */
  private sanitizeUserData(user: User): User {
    return {
      ...user,
      username: user.username ? sanitizeUsername(user.username) : user.username,
      email: user.email ? sanitizeEmail(user.email) : user.email,
      bio: user.bio ? sanitizeStrict(user.bio) : '',
      verificationRejectionReason: user.verificationRejectionReason ? sanitizeStrict(user.verificationRejectionReason) : undefined,
      banReason: user.banReason ? sanitizeStrict(user.banReason) : undefined,
    };
  }

  /**
   * Login user with validation and rate limiting
   */
  async login(request: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // Check rate limit
      const rateLimitResult = this.rateLimiter.check('LOGIN', RATE_LIMITS.LOGIN);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: {
            message: `Too many login attempts. Please wait ${rateLimitResult.waitTime} seconds.`,
            code: 'RATE_LIMIT_EXCEEDED',
          },
        };
      }

      // For localStorage implementation, we only need username validation
      // For API implementation, we need full validation including password
      const isApiMode = FEATURES.USE_API_AUTH;
      
      let validatedUsername: string;
      let validatedPassword: string | undefined;
      
      if (isApiMode) {
        // Full validation for API mode
        const validation = authSchemas.loginSchema.safeParse({
          username: request.username,
          password: request.password || '',
        });

        if (!validation.success) {
          return {
            success: false,
            error: {
              message: validation.error.errors[0].message,
              field: validation.error.errors[0].path[0] as string,
            },
          };
        }
        
        validatedUsername = validation.data.username;
        validatedPassword = validation.data.password;
      } else {
        // Simplified validation for localStorage mode (no password required)
        const usernameValidation = authSchemas.username.safeParse(request.username);
        
        if (!usernameValidation.success) {
          return {
            success: false,
            error: {
              message: usernameValidation.error.errors[0].message,
              field: 'username',
            },
          };
        }
        
        validatedUsername = usernameValidation.data;
        validatedPassword = request.password;
      }

      if (FEATURES.USE_API_AUTH) {
        const response = await apiCall<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
          method: 'POST',
          body: JSON.stringify({
            username: validatedUsername,
            password: validatedPassword,
            role: request.role,
          }),
        });

        if (response.success && response.data) {
          // Store tokens securely
          if (response.data.token) {
            await this.storeTokens(response.data.token, response.data.refreshToken);
          }

          // Sanitize and store user
          const sanitizedUser = this.sanitizeUserData(response.data.user);
          await storageService.setItem('currentUser', sanitizedUser);

          // Set up token refresh
          this.setupTokenRefreshTimer();

          return {
            ...response,
            data: {
              ...response.data,
              user: sanitizedUser,
            },
          };
        }

        return response;
      }

      // LocalStorage implementation
      const { role } = request;
      
      // Check if user exists in all_users_v2
      const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
      const existingUser = allUsers[validatedUsername];

      // Verify password if user exists and password is provided
      if (existingUser && validatedPassword) {
        const credentials = await storageService.getItem<Record<string, any>>('userCredentials', {});
        const userCreds = credentials[validatedUsername];
        
        if (userCreds && userCreds.password) {
          const hashedInput = await this.hashPassword(validatedPassword);
          if (hashedInput !== userCreds.password) {
            return {
              success: false,
              error: {
                message: 'Invalid username or password',
                field: 'password',
              },
            };
          }
        }
      }

      const isAdmin = validatedUsername === 'oakley' || validatedUsername === 'gerome';
      
      // Create or update user
      const user: User = {
        id: existingUser?.id || `user_${Date.now()}`,
        username: validatedUsername,
        role: isAdmin ? 'admin' : role,
        email: existingUser?.email || `${validatedUsername}@example.com`,
        isVerified: existingUser?.verificationStatus === 'verified' || isAdmin,
        tier: role === 'seller' && !isAdmin ? 'Tease' : undefined,
        subscriberCount: existingUser?.subscriberCount || 0,
        totalSales: existingUser?.totalSales || 0,
        rating: existingUser?.rating || 0,
        reviewCount: existingUser?.reviewCount || 0,
        createdAt: existingUser?.createdAt || new Date().toISOString(),
        lastActive: new Date().toISOString(),
        bio: existingUser?.bio || '',
        isBanned: existingUser?.isBanned || false,
        verificationStatus: existingUser?.verificationStatus || (isAdmin ? 'verified' : 'unverified'),
        verificationRequestedAt: existingUser?.verificationRequestedAt,
        verificationRejectionReason: existingUser?.verificationRejectionReason,
        verificationDocs: existingUser?.verificationDocs,
      };

      // Sanitize user data
      const sanitizedUser = this.sanitizeUserData(user);

      // Update all_users_v2
      allUsers[validatedUsername] = sanitizedUser;
      await storageService.setItem('all_users_v2', allUsers);

      // Set current user
      await storageService.setItem('currentUser', sanitizedUser);

      // Store session fingerprint
      const fingerprint = await this.getSessionFingerprint();
      await storageService.setItem('session_fingerprint', fingerprint);

      console.log('[Auth] Login successful, saved user:', { username: sanitizedUser.username, role: sanitizedUser.role });

      return {
        success: true,
        data: { user: sanitizedUser },
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: {
          message: 'Login failed. Please try again.',
        },
      };
    }
  }

  /**
   * Sign up new user with validation and security
   */
  async signup(request: SignupRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      // Validate request
      const validation = authSchemas.signupSchema.safeParse({
        ...request,
        confirmPassword: request.password, // For validation only
        termsAccepted: true,
        ageVerified: true,
      });

      if (!validation.success) {
        return {
          success: false,
          error: {
            message: validation.error.errors[0].message,
            field: validation.error.errors[0].path[0] as string,
          },
        };
      }

      // Check rate limit
      const rateLimitResult = this.rateLimiter.check('SIGNUP', RATE_LIMITS.SIGNUP);
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: {
            message: `Too many signup attempts. Please wait ${rateLimitResult.waitTime} seconds.`,
            code: 'RATE_LIMIT_EXCEEDED',
          },
        };
      }

      // Check password vulnerabilities
      const passwordCheck = securityService.checkPasswordVulnerabilities(request.password, {
        username: request.username,
        email: request.email,
      });

      if (!passwordCheck.secure) {
        return {
          success: false,
          error: {
            message: passwordCheck.warnings[0],
            field: 'password',
          },
        };
      }

      if (FEATURES.USE_API_AUTH) {
        const response = await apiCall<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, {
          method: 'POST',
          body: JSON.stringify(validation.data),
        });

        if (response.success && response.data) {
          // Store tokens securely
          if (response.data.token) {
            await this.storeTokens(response.data.token, response.data.refreshToken);
          }

          // Sanitize and store user
          const sanitizedUser = this.sanitizeUserData(response.data.user);
          await storageService.setItem('currentUser', sanitizedUser);

          // Set up token refresh
          this.setupTokenRefreshTimer();

          return {
            ...response,
            data: {
              ...response.data,
              user: sanitizedUser,
            },
          };
        }

        return response;
      }

      // LocalStorage implementation
      const { username, email, role } = validation.data;
      
      // Check if username exists
      const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
      if (allUsers[username]) {
        return {
          success: false,
          error: {
            message: 'Username already exists',
            field: 'username',
          },
        };
      }

      // Hash password with salt (enhanced security)
      const hashedPassword = await this.hashPasswordWithSalt(request.password);

      // Store credentials separately (temporary - will be handled by backend)
      const credentials = await storageService.getItem<Record<string, any>>('userCredentials', {});
      credentials[username] = { 
        email: sanitizeEmail(email), 
        password: hashedPassword 
      };
      await storageService.setItem('userCredentials', credentials);

      // Create new user
      const user: User = {
        id: `user_${Date.now()}`,
        username,
        role: role as 'buyer' | 'seller',
        email,
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

      // Sanitize user data
      const sanitizedUser = this.sanitizeUserData(user);

      // Save to all_users_v2
      allUsers[username] = sanitizedUser;
      await storageService.setItem('all_users_v2', allUsers);

      // Set as current user
      await storageService.setItem('currentUser', sanitizedUser);

      // Store session fingerprint
      const fingerprint = await this.getSessionFingerprint();
      await storageService.setItem('session_fingerprint', fingerprint);

      return {
        success: true,
        data: { user: sanitizedUser },
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: {
          message: 'Signup failed. Please try again.',
        },
      };
    }
  }

  /**
   * Simple password hashing (for demo only - use bcrypt in production)
   */
  private async hashPassword(password: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hash = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return password; // Fallback (not secure)
  }

  /**
   * Enhanced password hashing with salt
   */
  private async hashPasswordWithSalt(password: string): Promise<string> {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      // Generate salt
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const saltStr = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Combine password with salt
      const encoder = new TextEncoder();
      const data = encoder.encode(password + saltStr);
      const hash = await window.crypto.subtle.digest('SHA-256', data);
      const hashStr = Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // Return salt + hash
      return saltStr + ':' + hashStr;
    }
    return this.hashPassword(password); // Fallback
  }

  /**
   * Logout current user
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      if (FEATURES.USE_API_AUTH) {
        await apiCall(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
        });
      }

      // Clear auth state
      await this.clearAuthState();

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      await this.clearAuthState();
      return { success: true };
    }
  }

  /**
   * Get current authenticated user with security
   */
  async getCurrentUser(): Promise<ApiResponse<User | null>> {
    try {
      // Validate session first
      const isValid = await this.validateSession();
      if (!isValid) {
        await this.clearAuthState();
        return { success: true, data: null };
      }

      if (FEATURES.USE_API_AUTH) {
        const token = await storageService.getItem<string | null>(AUTH_TOKEN_KEY, null);
        if (!token) {
          return { success: true, data: null };
        }

        const response = await apiCall<User>(API_ENDPOINTS.AUTH.ME);
        if (response.success && response.data) {
          const sanitizedUser = this.sanitizeUserData(response.data);
          return {
            ...response,
            data: sanitizedUser,
          };
        }
        return response;
      }

      // LocalStorage implementation
      const user = await storageService.getItem<User | null>('currentUser', null);
      
      if (user) {
        try {
          // Check if user data in all_users_v2 has been updated
          const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
          const storedUserData = allUsers[user.username];
          
          if (storedUserData) {
            const now = new Date().toISOString();
            
            const mergedUser: User = {
              // Core auth fields from current session
              id: user.id || `user_${Date.now()}`,
              username: user.username,
              role: user.role,
              email: user.email || storedUserData.email || `${user.username}@example.com`,
              
              // Profile fields from stored data
              bio: storedUserData.bio !== undefined ? storedUserData.bio : (user.bio || ''),
              profilePicture: storedUserData.profilePicture || user.profilePicture,
              
              // Verification fields
              verificationStatus: storedUserData.verificationStatus || user.verificationStatus || 'unverified',
              isVerified: storedUserData.verificationStatus === 'verified' || user.isVerified || false,
              verificationRequestedAt: storedUserData.verificationRequestedAt || user.verificationRequestedAt,
              verificationRejectionReason: storedUserData.verificationRejectionReason || user.verificationRejectionReason,
              verificationDocs: storedUserData.verificationDocs || user.verificationDocs,
              
              // Seller-specific fields
              tier: storedUserData.tier || user.tier,
              subscriberCount: typeof storedUserData.subscriberCount === 'number' ? storedUserData.subscriberCount : (user.subscriberCount || 0),
              totalSales: typeof storedUserData.totalSales === 'number' ? storedUserData.totalSales : (user.totalSales || 0),
              rating: typeof storedUserData.rating === 'number' ? storedUserData.rating : (user.rating || 0),
              reviewCount: typeof storedUserData.reviewCount === 'number' ? storedUserData.reviewCount : (user.reviewCount || 0),
              
              // Ban status
              isBanned: storedUserData.isBanned === true || user.isBanned === true || false,
              banReason: storedUserData.banReason || user.banReason,
              banExpiresAt: storedUserData.banExpiresAt || user.banExpiresAt,
              
              // Timestamps
              createdAt: user.createdAt || storedUserData.createdAt || now,
              lastActive: now,
            };
            
            // Sanitize merged user
            const sanitizedUser = this.sanitizeUserData(mergedUser);
            
            // Only update storage if there are actual changes
            try {
              if (JSON.stringify(user) !== JSON.stringify(sanitizedUser)) {
                await storageService.setItem('currentUser', sanitizedUser);
              }
            } catch (storageError) {
              console.warn('[AuthService] Failed to update currentUser in storage:', storageError);
            }
            
            return {
              success: true,
              data: sanitizedUser,
            };
          }
        } catch (mergeError) {
          console.error('[AuthService] Error during user data merge:', mergeError);
        }
      }

      return {
        success: true,
        data: user ? this.sanitizeUserData(user) : null,
      };
    } catch (error) {
      console.error('[AuthService] Get current user error:', error);
      return {
        success: false,
        error: { message: 'Failed to get current user' },
      };
    }
  }

  /**
   * Update current user with validation
   */
  async updateCurrentUser(updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const currentUserResult = await this.getCurrentUser();
      if (!currentUserResult.success || !currentUserResult.data) {
        return {
          success: false,
          error: { message: 'No user to update' },
        };
      }

      const currentUser = currentUserResult.data;
      
      // Sanitize updates
      const sanitizedUpdates: Partial<User> = {};
      
      if (updates.bio !== undefined) {
        sanitizedUpdates.bio = sanitizeStrict(updates.bio);
      }
      if (updates.username !== undefined) {
        sanitizedUpdates.username = sanitizeUsername(updates.username);
      }
      if (updates.email !== undefined) {
        sanitizedUpdates.email = sanitizeEmail(updates.email);
      }
      
      // Copy other safe fields
      const safeFields = ['profilePicture', 'isVerified', 'tier', 'subscriberCount', 
                         'totalSales', 'rating', 'reviewCount'] as const;
      
      for (const field of safeFields) {
        if (field in updates) {
          (sanitizedUpdates as any)[field] = updates[field];
        }
      }

      const updatedUser = {
        ...currentUser,
        ...sanitizedUpdates,
        lastActive: new Date().toISOString(),
      };

      if (FEATURES.USE_API_AUTH) {
        const response = await apiCall<User>(
          buildApiUrl(API_ENDPOINTS.USERS.UPDATE_PROFILE, { username: currentUser.username }),
          {
            method: 'PATCH',
            body: JSON.stringify(sanitizedUpdates),
          }
        );

        if (response.success && response.data) {
          const sanitizedUser = this.sanitizeUserData(response.data);
          await storageService.setItem('currentUser', sanitizedUser);
          return {
            ...response,
            data: sanitizedUser,
          };
        }

        return response;
      }

      // LocalStorage implementation
      const sanitizedUser = this.sanitizeUserData(updatedUser);
      
      // Update currentUser
      await storageService.setItem('currentUser', sanitizedUser);

      // Also update in all_users_v2
      const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
      allUsers[currentUser.username] = sanitizedUser;
      await storageService.setItem('all_users_v2', allUsers);

      return {
        success: true,
        data: sanitizedUser,
      };
    } catch (error) {
      console.error('Update user error:', error);
      return {
        success: false,
        error: { message: 'Failed to update user' },
      };
    }
  }

  /**
   * Check if username is available with validation
   */
  async checkUsername(username: string): Promise<ApiResponse<UsernameCheckResponse>> {
    try {
      // Validate username
      const validation = authSchemas.username.safeParse(username);
      if (!validation.success) {
        return {
          success: true,
          data: {
            available: false,
            message: validation.error.errors[0].message,
          },
        };
      }

      if (FEATURES.USE_API_AUTH) {
        return await apiCall<UsernameCheckResponse>(
          `${API_ENDPOINTS.AUTH.VERIFY_USERNAME}?username=${encodeURIComponent(validation.data)}`
        );
      }

      // LocalStorage implementation
      const allUsers = await storageService.getItem<Record<string, any>>('all_users_v2', {});
      const available = !allUsers[validation.data];

      return {
        success: true,
        data: {
          available,
          message: available ? 'Username is available' : 'Username is already taken',
        },
      };
    } catch (error) {
      console.error('Check username error:', error);
      return {
        success: false,
        error: { message: 'Failed to check username availability' },
      };
    }
  }

  /**
   * Refresh authentication token with security
   */
  async refreshToken(): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    try {
      if (FEATURES.USE_API_AUTH) {
        const refreshToken = await storageService.getItem<string | null>(REFRESH_TOKEN_KEY, null);
        if (!refreshToken) {
          return {
            success: false,
            error: { message: 'No refresh token available' },
          };
        }

        const response = await apiCall<{ token: string; refreshToken: string }>(
          API_ENDPOINTS.AUTH.REFRESH,
          {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
          }
        );

        if (response.success && response.data) {
          // Store new tokens securely
          await this.storeTokens(response.data.token, response.data.refreshToken);
        }

        return response;
      }

      // LocalStorage doesn't need token refresh
      return {
        success: true,
        data: { token: 'mock_token', refreshToken: 'mock_refresh_token' },
      };
    } catch (error) {
      console.error('Refresh token error:', error);
      return {
        success: false,
        error: { message: 'Failed to refresh token' },
      };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (FEATURES.USE_API_AUTH) {
      const token = await this.getValidToken();
      return !!token;
    }

    const user = await storageService.getItem<User | null>('currentUser', null);
    return !!user;
  }

  /**
   * Get stored auth token
   */
  async getAuthToken(): Promise<string | null> {
    return this.getValidToken();
  }
}

// Export singleton instance
export const authService = new AuthService();