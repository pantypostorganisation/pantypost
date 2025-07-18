// src/services/mock/handlers/users.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { User } from '@/context/AuthContext';
import { UserProfile, UsersResponse, ProfileResponse, SubscriptionInfo } from '@/types/users';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeStrict, sanitizeUsername, sanitizeEmail, sanitizeCurrency, sanitizeNumber } from '@/utils/security/sanitization';
import { profileSchemas } from '@/utils/validation/schemas';
import { securityService } from '@/services/security.service';
import { z } from 'zod';

interface MockUserProfile extends UserProfile {
  username: string;
}

// Extended type for internal mock storage
interface MockSubscriptionInfo extends SubscriptionInfo {
  id?: string;
  cancelledAt?: string;
  nextBillingDate?: string;
}

// Validation schemas
const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  profilePic: z.string().url().optional(),
  subscriptionPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  galleryImages: z.array(z.string().url()).max(20).optional()
});

const verificationRequestSchema = z.object({
  codePhoto: z.string().url(),
  idFront: z.string().url(),
  idBack: z.string().url().optional(),
  code: z.string().min(6).max(10)
});

const verificationUpdateSchema = z.object({
  status: z.enum(['pending', 'verified', 'rejected']),
  rejectionReason: z.string().max(500).optional(),
  adminUsername: z.string().min(3).max(20)
});

const banUserSchema = z.object({
  reason: z.string().min(10).max(500),
  duration: z.number().min(1).max(365).optional(),
  adminUsername: z.string().min(3).max(20)
});

const subscriptionSchema = z.object({
  buyer: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  seller: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  price: z.number().positive().max(1000)
});

export const mockUserHandlers = {
  // List users
  list: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<UsersResponse>> => {
    if (method !== 'GET') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const users = await mockDataStore.get<Record<string, User>>('users', {});
    let userList = Object.values(users);
    
    // Apply filters with sanitization
    if (params?.role && ['buyer', 'seller', 'admin'].includes(params.role)) {
      userList = userList.filter(u => u.role === params.role);
    }
    
    if (params?.verified === 'true') {
      userList = userList.filter(u => u.verificationStatus === 'verified');
    }
    
    if (params?.query) {
      const sanitizedQuery = sanitizeStrict(params.query.toLowerCase());
      if (sanitizedQuery) {
        userList = userList.filter(u => 
          u.username.toLowerCase().includes(sanitizedQuery) ||
          u.email?.toLowerCase().includes(sanitizedQuery) ||
          u.bio?.toLowerCase().includes(sanitizedQuery)
        );
      }
    }
    
    // Sorting
    if (params?.sortBy && ['username', 'joinDate', 'rating', 'sales'].includes(params.sortBy)) {
      userList.sort((a, b) => {
        switch (params.sortBy) {
          case 'username':
            return a.username.localeCompare(b.username);
          case 'joinDate':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'sales':
            return (b.totalSales || 0) - (a.totalSales || 0);
          default:
            return 0;
        }
      });
      
      if (params.sortOrder === 'desc') {
        userList.reverse();
      }
    }
    
    // Pagination with validation
    const page = Math.max(1, parseInt(params?.page || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(params?.limit || '50')));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedUsers = userList.slice(startIndex, endIndex);
    
    return {
      success: true,
      data: {
        users: paginatedUsers,
        total: userList.length,
        page,
        totalPages: Math.ceil(userList.length / limit),
      },
    };
  },
  
  // Get user profile
  getProfile: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<User | null>> => {
    const username = params?.username;
    
    if (!username) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username is required' },
      };
    }
    
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
      };
    }
    
    const users = await mockDataStore.get<Record<string, User>>('users', {});
    const user = users[sanitizedUsername];
    
    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      };
    }
    
    if (method === 'PATCH') {
      try {
        // Update profile with validation
        const validatedData = updateProfileSchema.parse(data);
        
        if (validatedData.bio) {
          const bioCheck = securityService.checkContentSecurity(validatedData.bio);
          if (!bioCheck.safe) {
            return {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'Bio contains prohibited content' },
            };
          }
          user.bio = sanitizeStrict(validatedData.bio) || '';
        }
        
        users[sanitizedUsername] = user;
        await mockDataStore.set('users', users);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: { 
              code: 'VALIDATION_ERROR', 
              message: sanitizeStrict(error.errors[0].message) || 'Invalid profile data' 
            },
          };
        }
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid profile data' },
        };
      }
    }
    
    return {
      success: true,
      data: user,
    };
  },
  
  // Get full profile (with UserProfile data)
  getFullProfile: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<ProfileResponse>> => {
    const username = params?.username;
    
    if (!username) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username is required' },
      };
    }
    
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
      };
    }
    
    const users = await mockDataStore.get<Record<string, User>>('users', {});
    const user = users[sanitizedUsername];
    
    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      };
    }
    
    const profiles = await mockDataStore.get<Record<string, MockUserProfile>>('userProfiles', {});
    let profile = profiles[sanitizedUsername];
    
    if (!profile) {
      // Create default profile with all required fields
      const missingFields = [];
      if (!user.bio) missingFields.push('bio');
      missingFields.push('galleryImages'); // New profiles always need gallery images
      
      profile = {
        username: sanitizedUsername,
        bio: user.bio || '',
        profilePic: `https://ui-avatars.com/api/?name=${sanitizedUsername}&background=random`,
        subscriptionPrice: '10',
        galleryImages: [],
        completeness: {
          percentage: 50,
          missingFields,
          suggestions: [
            'Add a profile picture to increase visibility',
            'Write a compelling bio to attract more buyers',
            'Upload gallery images to showcase your style',
          ],
        },
      };
      profiles[sanitizedUsername] = profile;
      await mockDataStore.set('userProfiles', profiles);
    }
    
    return {
      success: true,
      data: {
        user,
        profile,
      },
    };
  },
  
  // Handle verification
  verification: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<void>> => {
    const username = params?.username;
    
    if (!username) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username is required' },
      };
    }
    
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
      };
    }
    
    const users = await mockDataStore.get<Record<string, User>>('users', {});
    const user = users[sanitizedUsername];
    
    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      };
    }
    
    if (method === 'POST') {
      try {
        // Request verification
        const validatedData = verificationRequestSchema.parse(data);
        
        user.verificationStatus = 'pending';
        user.verificationRequestedAt = new Date().toISOString();
        user.verificationDocs = validatedData;
        
        users[sanitizedUsername] = user;
        await mockDataStore.set('users', users);
        
        // Store verification request
        const verificationRequests = await mockDataStore.get<Record<string, any>>('verificationRequests', {});
        verificationRequests[sanitizedUsername] = {
          ...validatedData,
          requestedAt: new Date().toISOString(),
          status: 'pending',
        };
        await mockDataStore.set('verificationRequests', verificationRequests);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: { 
              code: 'VALIDATION_ERROR', 
              message: 'Missing or invalid verification documents' 
            },
          };
        }
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid verification data' },
        };
      }
      
    } else if (method === 'PATCH') {
      try {
        // Update verification status (admin)
        const validatedData = verificationUpdateSchema.parse(data);
        
        user.verificationStatus = validatedData.status;
        user.isVerified = validatedData.status === 'verified';
        
        if (validatedData.status === 'rejected' && validatedData.rejectionReason) {
          const reasonCheck = securityService.checkContentSecurity(validatedData.rejectionReason);
          if (!reasonCheck.safe) {
            return {
              success: false,
              error: { code: 'VALIDATION_ERROR', message: 'Rejection reason contains prohibited content' },
            };
          }
          user.verificationRejectionReason = sanitizeStrict(validatedData.rejectionReason) || '';
        }
        
        users[sanitizedUsername] = user;
        await mockDataStore.set('users', users);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid verification update' },
          };
        }
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid verification data' },
        };
      }
    }
    
    return { success: true };
  },
  
  // Ban user
  ban: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const username = params?.username;
    
    if (!username) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username is required' },
      };
    }
    
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
      };
    }
    
    try {
      const validatedData = banUserSchema.parse(data);
      
      // Check ban reason content
      const reasonCheck = securityService.checkContentSecurity(validatedData.reason);
      if (!reasonCheck.safe) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Ban reason contains prohibited content' },
        };
      }
      
      const users = await mockDataStore.get<Record<string, User>>('users', {});
      const user = users[sanitizedUsername];
      
      if (!user) {
        return {
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
        };
      }
      
      // Prevent banning admins
      if (user.role === 'admin') {
        return {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Cannot ban admin users' },
        };
      }
      
      user.isBanned = true;
      user.banReason = sanitizeStrict(validatedData.reason) || '';
      
      if (validatedData.duration) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + validatedData.duration);
        user.banExpiresAt = expiresAt.toISOString();
      }
      
      users[sanitizedUsername] = user;
      await mockDataStore.set('users', users);
      
      // Store ban log
      const banLogs = await mockDataStore.get<any[]>('banLogs', []);
      banLogs.push({
        username: sanitizedUsername,
        reason: sanitizeStrict(validatedData.reason) || '',
        duration: validatedData.duration,
        bannedBy: sanitizeUsername(validatedData.adminUsername) || '',
        bannedAt: new Date().toISOString(),
      });
      await mockDataStore.set('banLogs', banLogs);
      
      return { success: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: sanitizeStrict(error.errors[0].message) || 'Invalid ban data' 
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid ban data' },
      };
    }
  },
  
  // Unban user
  unban: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const username = params?.username;
    const { adminUsername } = data;
    
    if (!username || !adminUsername) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
      };
    }
    
    const sanitizedUsername = sanitizeUsername(username);
    const sanitizedAdminUsername = sanitizeUsername(adminUsername);
    
    if (!sanitizedUsername || !sanitizedAdminUsername) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
      };
    }
    
    const users = await mockDataStore.get<Record<string, User>>('users', {});
    const user = users[sanitizedUsername];
    
    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      };
    }
    
    user.isBanned = false;
    delete user.banReason;
    delete user.banExpiresAt;
    
    users[sanitizedUsername] = user;
    await mockDataStore.set('users', users);
    
    // Update ban log
    const banLogs = await mockDataStore.get<any[]>('banLogs', []);
    banLogs.push({
      username: sanitizedUsername,
      action: 'unban',
      unbannedBy: sanitizedAdminUsername,
      unbannedAt: new Date().toISOString(),
    });
    await mockDataStore.set('banLogs', banLogs);
    
    return { success: true };
  },
  
  // Get user subscriptions
  subscriptions: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<SubscriptionInfo[]>> => {
    const username = params?.username;
    
    if (!username) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Username is required' },
      };
    }
    
    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
      };
    }
    
    const subscriptions = await mockDataStore.get<Record<string, MockSubscriptionInfo[]>>('subscriptions', {});
    const userSubs = subscriptions[sanitizedUsername] || [];
    
    // Remove internal properties before returning
    const cleanSubs: SubscriptionInfo[] = userSubs.map(({ id, cancelledAt, nextBillingDate, ...sub }) => sub);
    
    return {
      success: true,
      data: cleanSubs,
    };
  },
  
  // Subscribe to user
  subscribe: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<SubscriptionInfo>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    try {
      const validatedData = subscriptionSchema.parse(data);
      
      const buyer = sanitizeUsername(validatedData.buyer);
      const seller = sanitizeUsername(validatedData.seller);
      
      if (!buyer || !seller) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
        };
      }
      
      // Prevent self-subscription
      if (buyer === seller) {
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Cannot subscribe to yourself' },
        };
      }
      
      const subscriptions = await mockDataStore.get<Record<string, MockSubscriptionInfo[]>>('subscriptions', {});
      
      if (!subscriptions[buyer]) {
        subscriptions[buyer] = [];
      }
      
      // Check if already subscribed
      const existing = subscriptions[buyer].find(sub => sub.seller === seller);
      if (existing && existing.status === 'active') {
        return {
          success: false,
          error: { code: 'ALREADY_SUBSCRIBED', message: 'Already subscribed to this seller' },
        };
      }
      
      // Limit subscriptions per user
      const activeSubscriptions = subscriptions[buyer].filter(sub => sub.status === 'active');
      if (activeSubscriptions.length >= 100) {
        return {
          success: false,
          error: { code: 'LIMIT_EXCEEDED', message: 'Subscription limit reached' },
        };
      }
      
      // Convert price to string format
      const priceResult = sanitizeCurrency(validatedData.price.toString());
      const priceString = typeof priceResult === 'string' ? priceResult : priceResult.toString();
      
      const newSub: MockSubscriptionInfo = {
        id: `sub_${uuidv4()}`,
        buyer,
        seller,
        price: priceString,
        status: 'active',
        subscribedAt: new Date().toISOString(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        autoRenew: true, // Default to auto-renew enabled
      };
      
      subscriptions[buyer].push(newSub);
      await mockDataStore.set('subscriptions', subscriptions);
      
      // Update subscriber count
      const users = await mockDataStore.get<Record<string, User>>('users', {});
      if (users[seller]) {
        users[seller].subscriberCount = Math.min(1000000, (users[seller].subscriberCount || 0) + 1);
        await mockDataStore.set('users', users);
      }
      
      // Remove internal properties before returning
      const { id, nextBillingDate, ...cleanSub } = newSub;
      
      return {
        success: true,
        data: cleanSub,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: sanitizeStrict(error.errors[0].message) || 'Invalid subscription data' 
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid subscription data' },
      };
    }
  },
  
  // Unsubscribe
  unsubscribe: async (method: string, endpoint: string, data?: any): Promise<ApiResponse<void>> => {
    if (method !== 'POST') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const { buyer, seller } = data;
    
    if (!buyer || !seller) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
      };
    }
    
    const sanitizedBuyer = sanitizeUsername(buyer);
    const sanitizedSeller = sanitizeUsername(seller);
    
    if (!sanitizedBuyer || !sanitizedSeller) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
      };
    }
    
    const subscriptions = await mockDataStore.get<Record<string, MockSubscriptionInfo[]>>('subscriptions', {});
    
    if (subscriptions[sanitizedBuyer]) {
      const subIndex = subscriptions[sanitizedBuyer].findIndex(sub => sub.seller === sanitizedSeller);
      if (subIndex !== -1) {
        subscriptions[sanitizedBuyer][subIndex].status = 'cancelled';
        subscriptions[sanitizedBuyer][subIndex].cancelledAt = new Date().toISOString();
        await mockDataStore.set('subscriptions', subscriptions);
        
        // Update subscriber count
        const users = await mockDataStore.get<Record<string, User>>('users', {});
        if (users[sanitizedSeller] && users[sanitizedSeller].subscriberCount) {
          users[sanitizedSeller].subscriberCount = Math.max(0, users[sanitizedSeller].subscriberCount - 1);
          await mockDataStore.set('users', users);
        }
      }
    }
    
    return { success: true };
  },
  
  // Check subscription
  checkSubscription: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<SubscriptionInfo | null>> => {
    const buyer = params?.buyer;
    const seller = params?.seller;
    
    if (!buyer || !seller) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Buyer and seller are required' },
      };
    }
    
    const sanitizedBuyer = sanitizeUsername(buyer);
    const sanitizedSeller = sanitizeUsername(seller);
    
    if (!sanitizedBuyer || !sanitizedSeller) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid username format' },
      };
    }
    
    const subscriptions = await mockDataStore.get<Record<string, MockSubscriptionInfo[]>>('subscriptions', {});
    const buyerSubs = subscriptions[sanitizedBuyer] || [];
    const subscription = buyerSubs.find(sub => sub.seller === sanitizedSeller && sub.status === 'active');
    
    if (!subscription) {
      return {
        success: true,
        data: null,
      };
    }
    
    // Remove internal properties before returning
    const { id, cancelledAt, nextBillingDate, ...cleanSub } = subscription;
    
    return {
      success: true,
      data: cleanSub,
    };
  },
} as const;