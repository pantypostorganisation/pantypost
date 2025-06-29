// src/services/orders.service.ts

import { Order } from '@/context/WalletContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';

// Define DeliveryAddress type here since it's not exported from WalletContext
export interface DeliveryAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  specialInstructions?: string;
}

export interface CreateOrderRequest {
  title: string;
  description: string;
  price: number;
  markedUpPrice: number;
  imageUrl?: string;
  seller: string;
  buyer: string;
  tags?: string[];
  wearTime?: string;
  wasAuction?: boolean;
  finalBid?: number;
  deliveryAddress?: DeliveryAddress;
  tierCreditAmount?: number;
  isCustomRequest?: boolean;
  originalRequestId?: string;
}

export interface UpdateOrderStatusRequest {
  shippingStatus: 'pending' | 'processing' | 'shipped';
  trackingNumber?: string;
  shippedDate?: string;
}

export interface OrderSearchParams {
  buyer?: string;
  seller?: string;
  status?: 'pending' | 'processing' | 'shipped';
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Orders Service
 * Handles all order-related operations
 */
export class OrdersService {
  /**
   * Get all orders
   */
  async getOrders(params?: OrderSearchParams): Promise<ApiResponse<Order[]>> {
    try {
      if (FEATURES.USE_API_ORDERS) {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
              queryParams.append(key, String(value));
            }
          });
        }
        
        return await apiCall<Order[]>(
          `${API_ENDPOINTS.ORDERS.LIST}?${queryParams.toString()}`
        );
      }

      // LocalStorage implementation
      let orderHistory = await this.getOrderHistoryFromStorage();
      
      // Apply filters
      if (params) {
        if (params.buyer) {
          orderHistory = orderHistory.filter(order => order.buyer === params.buyer);
        }
        
        if (params.seller) {
          orderHistory = orderHistory.filter(order => order.seller === params.seller);
        }
        
        if (params.status) {
          orderHistory = orderHistory.filter(
            order => order.shippingStatus === params.status
          );
        }
        
        if (params.fromDate) {
          orderHistory = orderHistory.filter(
            order => new Date(order.date) >= new Date(params.fromDate!)
          );
        }
        
        if (params.toDate) {
          orderHistory = orderHistory.filter(
            order => new Date(order.date) <= new Date(params.toDate!)
          );
        }

        // Pagination
        if (params.page && params.limit) {
          const start = (params.page - 1) * params.limit;
          const end = start + params.limit;
          orderHistory = orderHistory.slice(start, end);
        }
      }

      return {
        success: true,
        data: orderHistory,
      };
    } catch (error) {
      console.error('Get orders error:', error);
      return {
        success: false,
        error: { message: 'Failed to get orders' },
      };
    }
  }

  /**
   * Get single order by ID
   */
  async getOrder(id: string): Promise<ApiResponse<Order | null>> {
    try {
      if (FEATURES.USE_API_ORDERS) {
        return await apiCall<Order>(
          buildApiUrl(API_ENDPOINTS.ORDERS.GET, { id })
        );
      }

      // LocalStorage implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      const order = orderHistory.find(o => o.id === id);

      return {
        success: true,
        data: order || null,
      };
    } catch (error) {
      console.error('Get order error:', error);
      return {
        success: false,
        error: { message: 'Failed to get order' },
      };
    }
  }

  /**
   * Get orders by buyer
   */
  async getOrdersByBuyer(username: string): Promise<ApiResponse<Order[]>> {
    try {
      if (FEATURES.USE_API_ORDERS) {
        return await apiCall<Order[]>(
          buildApiUrl(API_ENDPOINTS.ORDERS.BY_BUYER, { username })
        );
      }

      return this.getOrders({ buyer: username });
    } catch (error) {
      console.error('Get orders by buyer error:', error);
      return {
        success: false,
        error: { message: 'Failed to get buyer orders' },
      };
    }
  }

  /**
   * Get orders by seller
   */
  async getOrdersBySeller(username: string): Promise<ApiResponse<Order[]>> {
    try {
      if (FEATURES.USE_API_ORDERS) {
        return await apiCall<Order[]>(
          buildApiUrl(API_ENDPOINTS.ORDERS.BY_SELLER, { username })
        );
      }

      return this.getOrders({ seller: username });
    } catch (error) {
      console.error('Get orders by seller error:', error);
      return {
        success: false,
        error: { message: 'Failed to get seller orders' },
      };
    }
  }

  /**
   * Create new order
   */
  async createOrder(request: CreateOrderRequest): Promise<ApiResponse<Order>> {
    try {
      if (FEATURES.USE_API_ORDERS) {
        return await apiCall<Order>(API_ENDPOINTS.ORDERS.CREATE, {
          method: 'POST',
          body: JSON.stringify(request),
        });
      }

      // LocalStorage implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      
      const newOrder: Order = {
        id: uuidv4(),
        title: request.title,
        description: request.description,
        price: request.price,
        markedUpPrice: request.markedUpPrice,
        imageUrl: request.imageUrl,
        date: new Date().toISOString(),
        seller: request.seller,
        buyer: request.buyer,
        tags: request.tags,
        wearTime: request.wearTime,
        wasAuction: request.wasAuction,
        finalBid: request.finalBid,
        deliveryAddress: request.deliveryAddress,
        shippingStatus: 'pending',
        tierCreditAmount: request.tierCreditAmount,
        isCustomRequest: request.isCustomRequest,
        originalRequestId: request.originalRequestId,
      };

      orderHistory.push(newOrder);
      await this.saveOrderHistoryToStorage(orderHistory);

      return {
        success: true,
        data: newOrder,
      };
    } catch (error) {
      console.error('Create order error:', error);
      return {
        success: false,
        error: { message: 'Failed to create order' },
      };
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: string,
    update: UpdateOrderStatusRequest
  ): Promise<ApiResponse<Order>> {
    try {
      if (FEATURES.USE_API_ORDERS) {
        return await apiCall<Order>(
          buildApiUrl(API_ENDPOINTS.ORDERS.UPDATE_STATUS, { id }),
          {
            method: 'PATCH',
            body: JSON.stringify(update),
          }
        );
      }

      // LocalStorage implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      const orderIndex = orderHistory.findIndex(o => o.id === id);

      if (orderIndex === -1) {
        return {
          success: false,
          error: { message: 'Order not found' },
        };
      }

      orderHistory[orderIndex] = {
        ...orderHistory[orderIndex],
        shippingStatus: update.shippingStatus,
      };

      await this.saveOrderHistoryToStorage(orderHistory);

      return {
        success: true,
        data: orderHistory[orderIndex],
      };
    } catch (error) {
      console.error('Update order status error:', error);
      return {
        success: false,
        error: { message: 'Failed to update order status' },
      };
    }
  }

  /**
   * Update order delivery address
   */
  async updateOrderAddress(
    id: string,
    address: DeliveryAddress
  ): Promise<ApiResponse<Order>> {
    try {
      if (FEATURES.USE_API_ORDERS) {
        return await apiCall<Order>(
          `${buildApiUrl(API_ENDPOINTS.ORDERS.GET, { id })}/address`,
          {
            method: 'PATCH',
            body: JSON.stringify({ deliveryAddress: address }),
          }
        );
      }

      // LocalStorage implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      const orderIndex = orderHistory.findIndex(o => o.id === id);

      if (orderIndex === -1) {
        return {
          success: false,
          error: { message: 'Order not found' },
        };
      }

      orderHistory[orderIndex] = {
        ...orderHistory[orderIndex],
        deliveryAddress: address,
      };

      await this.saveOrderHistoryToStorage(orderHistory);

      return {
        success: true,
        data: orderHistory[orderIndex],
      };
    } catch (error) {
      console.error('Update order address error:', error);
      return {
        success: false,
        error: { message: 'Failed to update order address' },
      };
    }
  }

  /**
   * Generate idempotency key for order
   */
  generateIdempotencyKey(buyer: string, seller: string, listingId: string): string {
    return `order_${buyer}_${seller}_${listingId}_${Date.now()}`;
  }

  /**
   * Check if order exists (for idempotency)
   */
  async checkOrderExists(idempotencyKey: string): Promise<boolean> {
    try {
      const processedOrders = await storageService.getItem<string[]>(
        'processed_orders',
        []
      );
      return processedOrders.includes(idempotencyKey);
    } catch (error) {
      console.error('Check order exists error:', error);
      return false;
    }
  }

  /**
   * Mark order as processed (for idempotency)
   */
  async markOrderProcessed(idempotencyKey: string): Promise<void> {
    try {
      const processedOrders = await storageService.getItem<string[]>(
        'processed_orders',
        []
      );
      processedOrders.push(idempotencyKey);
      await storageService.setItem('processed_orders', processedOrders);
    } catch (error) {
      console.error('Mark order processed error:', error);
    }
  }

  // Helper methods for localStorage
  private async getOrderHistoryFromStorage(): Promise<Order[]> {
    // FIXED: Use the same key as WalletContext: 'wallet_orders'
    return await storageService.getItem<Order[]>('wallet_orders', []);
  }

  private async saveOrderHistoryToStorage(orders: Order[]): Promise<void> {
    // FIXED: Use the same key as WalletContext: 'wallet_orders'
    await storageService.setItem('wallet_orders', orders);
  }
}

// Export singleton instance
export const ordersService = new OrdersService();
