// src/services/mock/handlers/users.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { User } from '@/context/AuthContext';
import { UserProfile, UsersResponse, ProfileResponse, SubscriptionInfo } from '@/types/users';
import { v4 as uuidv4 } from 'uuid';

interface MockUserProfile extends UserProfile {
  username: string;
}

// Extended type for internal mock storage
interface MockSubscriptionInfo extends SubscriptionInfo {
  id?: string;
  cancelledAt?: string;
  nextBillingDate?: string;
}

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
    
    // Apply filters
    if (params?.role) {
      userList = userList.filter(u => u.role === params.role);
    }
    
    if (params?.verified === 'true') {
      userList = userList.filter(u => u.verificationStatus === 'verified');
    }
    
    if (params?.query) {
      const query = params.query.toLowerCase();
      userList = userList.filter(u => 
        u.username.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.bio?.toLowerCase().includes(query)
      );
    }
    
    // Sorting
    if (params?.sortBy) {
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
    
    // Pagination
    const page = parseInt(params?.page || '1');
    const limit = parseInt(params?.limit || '50');
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
    
    const users = await mockDataStore.get<Record<string, User>>('users', {});
    const user = users[username];
    
    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      };
    }
    
    if (method === 'PATCH') {
      // Update profile
      Object.assign(user, data);
      users[username] = user;
      await mockDataStore.set('users', users);
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
    
    const users = await mockDataStore.get<Record<string, User>>('users', {});
    const user = users[username];
    
    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      };
    }
    
    const profiles = await mockDataStore.get<Record<string, MockUserProfile>>('userProfiles', {});
    let profile = profiles[username];
    
    if (!profile) {
      // Create default profile with all required fields
      const missingFields = [];
      if (!user.bio) missingFields.push('bio');
      missingFields.push('galleryImages'); // New profiles always need gallery images
      
      profile = {
        username,
        bio: user.bio || '',
        profilePic: `https://ui-avatars.com/api/?name=${username}&background=random`,
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
      profiles[username] = profile;
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
    
    const users = await mockDataStore.get<Record<string, User>>('users', {});
    const user = users[username];
    
    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      };
    }
    
    if (method === 'POST') {
      // Request verification
      const { codePhoto, idFront, code } = data;
      
      if (!codePhoto || !code || !idFront) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required verification documents',
          },
        };
      }
      
      user.verificationStatus = 'pending';
      user.verificationRequestedAt = new Date().toISOString();
      user.verificationDocs = data;
      
      users[username] = user;
      await mockDataStore.set('users', users);
      
      // Store verification request
      const verificationRequests = await mockDataStore.get<Record<string, any>>('verificationRequests', {});
      verificationRequests[username] = {
        ...data,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      };
      await mockDataStore.set('verificationRequests', verificationRequests);
      
    } else if (method === 'PATCH') {
      // Update verification status (admin)
      const { status, rejectionReason, adminUsername } = data;
      
      user.verificationStatus = status;
      user.isVerified = status === 'verified';
      
      if (status === 'rejected' && rejectionReason) {
        user.verificationRejectionReason = rejectionReason;
      }
      
      users[username] = user;
      await mockDataStore.set('users', users);
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
    const { reason, duration, adminUsername } = data;
    
    if (!username || !reason || !adminUsername) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
      };
    }
    
    const users = await mockDataStore.get<Record<string, User>>('users', {});
    const user = users[username];
    
    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      };
    }
    
    user.isBanned = true;
    user.banReason = reason;
    
    if (duration) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + duration);
      user.banExpiresAt = expiresAt.toISOString();
    }
    
    users[username] = user;
    await mockDataStore.set('users', users);
    
    // Store ban log
    const banLogs = await mockDataStore.get<any[]>('banLogs', []);
    banLogs.push({
      username,
      reason,
      duration,
      bannedBy: adminUsername,
      bannedAt: new Date().toISOString(),
    });
    await mockDataStore.set('banLogs', banLogs);
    
    return { success: true };
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
    
    const users = await mockDataStore.get<Record<string, User>>('users', {});
    const user = users[username];
    
    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      };
    }
    
    user.isBanned = false;
    delete user.banReason;
    delete user.banExpiresAt;
    
    users[username] = user;
    await mockDataStore.set('users', users);
    
    // Update ban log
    const banLogs = await mockDataStore.get<any[]>('banLogs', []);
    banLogs.push({
      username,
      action: 'unban',
      unbannedBy: adminUsername,
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
    
    const subscriptions = await mockDataStore.get<Record<string, MockSubscriptionInfo[]>>('subscriptions', {});
    const userSubs = subscriptions[username] || [];
    
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
    
    const { buyer, seller, price } = data;
    
    if (!buyer || !seller || !price) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' },
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
    
    const newSub: MockSubscriptionInfo = {
      id: `sub_${uuidv4()}`,
      buyer,
      seller,
      price: price.toString(),
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
      users[seller].subscriberCount = (users[seller].subscriberCount || 0) + 1;
      await mockDataStore.set('users', users);
    }
    
    // Remove internal properties before returning
    const { id, nextBillingDate, ...cleanSub } = newSub;
    
    return {
      success: true,
      data: cleanSub,
    };
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
    
    const subscriptions = await mockDataStore.get<Record<string, MockSubscriptionInfo[]>>('subscriptions', {});
    
    if (subscriptions[buyer]) {
      const subIndex = subscriptions[buyer].findIndex(sub => sub.seller === seller);
      if (subIndex !== -1) {
        subscriptions[buyer][subIndex].status = 'cancelled';
        subscriptions[buyer][subIndex].cancelledAt = new Date().toISOString();
        await mockDataStore.set('subscriptions', subscriptions);
        
        // Update subscriber count
        const users = await mockDataStore.get<Record<string, User>>('users', {});
        if (users[seller] && users[seller].subscriberCount) {
          users[seller].subscriberCount = Math.max(0, users[seller].subscriberCount - 1);
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
    
    const subscriptions = await mockDataStore.get<Record<string, MockSubscriptionInfo[]>>('subscriptions', {});
    const buyerSubs = subscriptions[buyer] || [];
    const subscription = buyerSubs.find(sub => sub.seller === seller && sub.status === 'active');
    
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