// src/services/subscription.service.ts
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, apiCall, ApiResponse, API_BASE_URL } from './api.config';

export interface SubscriptionInfo {
  seller: string;
  buyer: string;
  price: string;
  subscribedAt: string;
  expiresAt?: string;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'cancelled';
}

// Check if subscriptions feature is enabled - use USE_API_USERS as fallback
const USE_API_SUBSCRIPTIONS = FEATURES.USE_API_USERS;

class SubscriptionService {
  /**
   * Subscribe to a seller
   */
  async subscribe(seller: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      if (USE_API_SUBSCRIPTIONS) {
        return await apiCall<{ success: boolean; message: string }>(
          API_ENDPOINTS.SUBSCRIPTIONS?.SUBSCRIBE || '/api/subscriptions/subscribe',
          {
            method: 'POST',
            body: JSON.stringify({ seller }),
          }
        );
      }

      // LocalStorage implementation
      const subscriptions = await storageService.getItem<Record<string, SubscriptionInfo[]>>(
        'user_subscriptions',
        {}
      );
      
      const currentUser = await storageService.getItem<any>('current_user', null);
      if (!currentUser) {
        return {
          success: false,
          error: { message: 'User not authenticated' }
        };
      }

      const buyerSubs = subscriptions[currentUser.username] || [];
      const existingSub = buyerSubs.find(sub => sub.seller === seller);
      
      if (existingSub && existingSub.status === 'active') {
        return {
          success: false,
          error: { message: 'Already subscribed to this seller' }
        };
      }

      const newSub: SubscriptionInfo = {
        seller,
        buyer: currentUser.username,
        price: '9.99', // Default price
        subscribedAt: new Date().toISOString(),
        autoRenew: true,
        status: 'active'
      };

      buyerSubs.push(newSub);
      subscriptions[currentUser.username] = buyerSubs;
      await storageService.setItem('user_subscriptions', subscriptions);

      return {
        success: true,
        data: { success: true, message: 'Successfully subscribed' }
      };
    } catch (error) {
      console.error('Subscribe error:', error);
      return {
        success: false,
        error: { message: 'Failed to subscribe' }
      };
    }
  }

  /**
   * Unsubscribe from a seller
   */
  async unsubscribe(seller: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      if (USE_API_SUBSCRIPTIONS) {
        return await apiCall<{ success: boolean; message: string }>(
          API_ENDPOINTS.SUBSCRIPTIONS?.UNSUBSCRIBE || '/api/subscriptions/unsubscribe',
          {
            method: 'POST',
            body: JSON.stringify({ seller }),
          }
        );
      }

      // LocalStorage implementation
      const subscriptions = await storageService.getItem<Record<string, SubscriptionInfo[]>>(
        'user_subscriptions',
        {}
      );
      
      const currentUser = await storageService.getItem<any>('current_user', null);
      if (!currentUser) {
        return {
          success: false,
          error: { message: 'User not authenticated' }
        };
      }

      const buyerSubs = subscriptions[currentUser.username] || [];
      const subIndex = buyerSubs.findIndex(sub => sub.seller === seller);
      
      if (subIndex === -1) {
        return {
          success: false,
          error: { message: 'Not subscribed to this seller' }
        };
      }

      buyerSubs[subIndex].status = 'cancelled';
      subscriptions[currentUser.username] = buyerSubs;
      await storageService.setItem('user_subscriptions', subscriptions);

      return {
        success: true,
        data: { success: true, message: 'Successfully unsubscribed' }
      };
    } catch (error) {
      console.error('Unsubscribe error:', error);
      return {
        success: false,
        error: { message: 'Failed to unsubscribe' }
      };
    }
  }

  /**
   * Check if user is subscribed to a seller
   */
  async checkSubscription(seller: string): Promise<ApiResponse<boolean>> {
    try {
      const currentUser = await storageService.getItem<any>('current_user', null);
      if (!currentUser) {
        return { success: true, data: false };
      }

      if (USE_API_SUBSCRIPTIONS) {
        const response = await apiCall<{ isSubscribed: boolean }>(
          API_ENDPOINTS.SUBSCRIPTIONS?.CHECK || '/api/subscriptions/check' + '?seller=' + seller
        );
        return {
          success: response.success,
          data: response.data?.isSubscribed || false,
          error: response.error
        };
      }

      // LocalStorage implementation
      const subscriptions = await storageService.getItem<Record<string, SubscriptionInfo[]>>(
        'user_subscriptions',
        {}
      );
      
      const buyerSubs = subscriptions[currentUser.username] || [];
      const subscription = buyerSubs.find(sub => sub.seller === seller && sub.status === 'active');
      
      return {
        success: true,
        data: !!subscription
      };
    } catch (error) {
      console.error('Check subscription error:', error);
      return {
        success: false,
        error: { message: 'Failed to check subscription' }
      };
    }
  }

  /**
   * Get subscriber count for a seller
   */
  async getSubscriberCount(seller: string): Promise<ApiResponse<{ count: number }>> {
    try {
      if (USE_API_SUBSCRIPTIONS) {
        // FIX: Build the URL properly with the seller parameter
        const baseEndpoint = API_ENDPOINTS.SUBSCRIPTIONS?.LIST || '/api/subscriptions';
        const url = `${API_BASE_URL}${baseEndpoint}/${encodeURIComponent(seller)}/count`;
        
        // Call directly with the full URL
        return await apiCall<{ count: number }>(url);
      }

      // LocalStorage implementation - count all active subscriptions for this seller
      const subscriptions = await storageService.getItem<Record<string, SubscriptionInfo[]>>(
        'user_subscriptions',
        {}
      );
      
      let count = 0;
      Object.values(subscriptions).forEach(userSubs => {
        const activeSub = userSubs.find(sub => sub.seller === seller && sub.status === 'active');
        if (activeSub) count++;
      });
      
      return {
        success: true,
        data: { count }
      };
    } catch (error) {
      console.error('Get subscriber count error:', error);
      // Return 0 count on error instead of failing completely
      return {
        success: true,
        data: { count: 0 }
      };
    }
  }

  /**
   * Get all subscriptions for current user
   */
  async getMySubscriptions(): Promise<ApiResponse<SubscriptionInfo[]>> {
    try {
      const currentUser = await storageService.getItem<any>('current_user', null);
      if (!currentUser) {
        return {
          success: false,
          error: { message: 'User not authenticated' }
        };
      }

      if (USE_API_SUBSCRIPTIONS) {
        return await apiCall<SubscriptionInfo[]>(
          API_ENDPOINTS.SUBSCRIPTIONS?.LIST || '/api/subscriptions'
        );
      }

      // LocalStorage implementation
      const subscriptions = await storageService.getItem<Record<string, SubscriptionInfo[]>>(
        'user_subscriptions',
        {}
      );
      
      const userSubs = subscriptions[currentUser.username] || [];
      
      return {
        success: true,
        data: userSubs
      };
    } catch (error) {
      console.error('Get my subscriptions error:', error);
      return {
        success: false,
        error: { message: 'Failed to get subscriptions' }
      };
    }
  }
}

export const subscriptionService = new SubscriptionService();