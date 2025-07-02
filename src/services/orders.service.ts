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
  listingId?: string;
  listingTitle?: string;
  quantity?: number;
  shippingStatus?: 'pending' | 'processing' | 'shipped' | 'pending-auction';
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
 * Handles all order-related operations with caching and enhanced features
 */
export class OrdersService {
  // Cache configuration
  private orderCache: Map<string, { order: Order; timestamp: number }> = new Map();
  private ordersListCache: { data: Order[] | null; timestamp: number; params: string } = {
    data: null,
    timestamp: 0,
    params: '',
  };
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get all orders with caching
   */
  async getOrders(params?: OrderSearchParams): Promise<ApiResponse<Order[]>> {
    try {
      // Check cache first
      const paramsString = JSON.stringify(params || {});
      const now = Date.now();
      
      if (
        this.ordersListCache.data &&
        this.ordersListCache.params === paramsString &&
        now - this.ordersListCache.timestamp < this.CACHE_DURATION
      ) {
        return {
          success: true,
          data: this.ordersListCache.data,
        };
      }

      if (FEATURES.USE_API_ORDERS) {
        const queryParams = new URLSearchParams();
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
              queryParams.append(key, String(value));
            }
          });
        }
        
        const response = await apiCall<Order[]>(
          `${API_ENDPOINTS.ORDERS.LIST}?${queryParams.toString()}`
        );

        if (response.success && response.data) {
          // Update cache
          this.ordersListCache = {
            data: response.data,
            timestamp: now,
            params: paramsString,
          };
        }

        return response;
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
        if (params.page !== undefined && params.limit) {
          const start = params.page * params.limit;
          const end = start + params.limit;
          
          const paginatedData = orderHistory.slice(start, end);
          
          return {
            success: true,
            data: paginatedData,
            meta: {
              page: params.page,
              totalPages: Math.ceil(orderHistory.length / params.limit),
              totalItems: orderHistory.length,
            },
          };
        }
      }

      // Update cache
      this.ordersListCache = {
        data: orderHistory,
        timestamp: now,
        params: paramsString,
      };

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
   * Get single order by ID with caching
   */
  async getOrder(id: string): Promise<ApiResponse<Order | null>> {
    try {
      // Check cache first
      const cached = this.orderCache.get(id);
      const now = Date.now();
      
      if (cached && now - cached.timestamp < this.CACHE_DURATION) {
        return {
          success: true,
          data: cached.order,
        };
      }

      if (FEATURES.USE_API_ORDERS) {
        const response = await apiCall<Order>(
          buildApiUrl(API_ENDPOINTS.ORDERS.GET, { id })
        );

        if (response.success && response.data) {
          // Update cache
          this.orderCache.set(id, { order: response.data, timestamp: now });
        }

        return response;
      }

      // LocalStorage implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      const order = orderHistory.find(o => o.id === id);

      if (order) {
        // Update cache
        this.orderCache.set(id, { order, timestamp: now });
      }

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
        const response = await apiCall<Order>(API_ENDPOINTS.ORDERS.CREATE, {
          method: 'POST',
          body: JSON.stringify(request),
        });

        if (response.success) {
          this.invalidateCache();
        }

        return response;
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
        shippingStatus: request.shippingStatus || 'pending',
        tierCreditAmount: request.tierCreditAmount,
        isCustomRequest: request.isCustomRequest,
        originalRequestId: request.originalRequestId,
        listingId: request.listingId,
        listingTitle: request.listingTitle,
        quantity: request.quantity,
      };

      orderHistory.push(newOrder);
      await this.saveOrderHistoryToStorage(orderHistory);

      // Invalidate cache
      this.invalidateCache();

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
        const response = await apiCall<Order>(
          buildApiUrl(API_ENDPOINTS.ORDERS.UPDATE_STATUS, { id }),
          {
            method: 'PATCH',
            body: JSON.stringify(update),
          }
        );

        if (response.success) {
          this.invalidateCache();
        }

        return response;
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

      // Invalidate cache
      this.invalidateCache();

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
        const response = await apiCall<Order>(
          `${buildApiUrl(API_ENDPOINTS.ORDERS.GET, { id })}/address`,
          {
            method: 'PATCH',
            body: JSON.stringify({ deliveryAddress: address }),
          }
        );

        if (response.success) {
          this.invalidateCache();
        }

        return response;
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

      // Invalidate cache
      this.invalidateCache();

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
   * Get order statistics
   */
  async getOrderStats(username: string, role: 'buyer' | 'seller'): Promise<{
    totalOrders: number;
    totalAmount: number;
    pendingOrders: number;
    shippedOrders: number;
    averageOrderValue: number;
  }> {
    const params = role === 'buyer' ? { buyer: username } : { seller: username };
    const result = await this.getOrders(params);
    
    if (!result.success || !result.data) {
      return {
        totalOrders: 0,
        totalAmount: 0,
        pendingOrders: 0,
        shippedOrders: 0,
        averageOrderValue: 0,
      };
    }

    const orders = result.data;
    const totalAmount = orders.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);

    return {
      totalOrders: orders.length,
      totalAmount,
      pendingOrders: orders.filter(o => !o.shippingStatus || o.shippingStatus === 'pending').length,
      shippedOrders: orders.filter(o => o.shippingStatus === 'shipped').length,
      averageOrderValue: orders.length > 0 ? totalAmount / orders.length : 0,
    };
  }

  /**
   * Batch update order statuses
   */
  async batchUpdateOrderStatuses(
    orderIds: string[],
    status: 'pending' | 'processing' | 'shipped'
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    for (const orderId of orderIds) {
      const result = await this.updateOrderStatus(orderId, { shippingStatus: status });
      if (result.success) {
        successful.push(orderId);
      } else {
        failed.push(orderId);
      }
    }

    return { successful, failed };
  }

  /**
   * Export orders to CSV
   */
  async exportOrdersToCSV(params?: OrderSearchParams): Promise<string> {
    const result = await this.getOrders(params);
    if (!result.success || !result.data) {
      throw new Error('Failed to fetch orders for export');
    }

    const orders = result.data;
    const headers = [
      'Order ID',
      'Date',
      'Buyer',
      'Seller',
      'Title',
      'Price',
      'Marked Up Price',
      'Status',
      'Type',
    ];

    const rows = orders.map(order => [
      order.id,
      new Date(order.date).toLocaleDateString(),
      order.buyer,
      order.seller,
      order.title,
      order.price.toFixed(2),
      order.markedUpPrice.toFixed(2),
      order.shippingStatus || 'pending',
      order.wasAuction ? 'Auction' : order.isCustomRequest ? 'Custom' : 'Direct',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
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

  /**
   * Clear cache
   */
  clearCache(): void {
    this.orderCache.clear();
    this.invalidateCache();
  }

  /**
   * Invalidate list cache
   */
  private invalidateCache(): void {
    this.ordersListCache = {
      data: null,
      timestamp: 0,
      params: '',
    };
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