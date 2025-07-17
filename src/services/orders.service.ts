// src/services/orders.service.ts

import { Order } from '@/context/WalletContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';
import { securityService } from './security.service';
import { listingSchemas, addressSchemas, financialSchemas } from '@/utils/validation/schemas';
import { sanitizeStrict, sanitizeNumber } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { z } from 'zod';

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
  shippingStatus: 'pending' | 'processing' | 'shipped' | 'pending-auction';
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

// Validation schemas for orders
const createOrderSchema = z.object({
  title: listingSchemas.title,
  description: listingSchemas.description,
  price: z.number().positive().min(0.01).max(10000),
  markedUpPrice: z.number().positive().min(0.01).max(10000),
  imageUrl: z.string().url().optional(),
  seller: z.string().min(1).max(50).transform(s => s.toLowerCase()),
  buyer: z.string().min(1).max(50).transform(s => s.toLowerCase()),
  tags: z.array(z.string().max(30)).max(10).optional(),
  wearTime: z.string().max(50).optional(),
  wasAuction: z.boolean().optional(),
  finalBid: z.number().positive().optional(),
  deliveryAddress: z.object({
    fullName: z.string().min(2).max(100).transform(sanitizeStrict),
    addressLine1: z.string().min(5).max(200).transform(sanitizeStrict),
    addressLine2: z.string().max(200).transform(sanitizeStrict).optional(),
    city: z.string().min(2).max(100).transform(sanitizeStrict),
    state: z.string().min(2).max(100).transform(sanitizeStrict),
    postalCode: z.string().min(3).max(20),
    country: z.string().min(2).max(100).transform(sanitizeStrict),
    specialInstructions: z.string().max(500).transform(sanitizeStrict).optional(),
  }).optional(),
  tierCreditAmount: z.number().min(0).max(1000).optional(),
  isCustomRequest: z.boolean().optional(),
  originalRequestId: z.string().uuid().optional(),
  listingId: z.string().optional(),
  listingTitle: z.string().max(100).transform(sanitizeStrict).optional(),
  quantity: z.number().int().positive().max(10).optional(),
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'pending-auction']).optional(),
}).refine(data => {
  // Ensure markedUpPrice is >= price
  return data.markedUpPrice >= data.price;
}, {
  message: 'Marked up price must be greater than or equal to base price',
  path: ['markedUpPrice'],
});

const updateOrderStatusSchema = z.object({
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'pending-auction']),
  trackingNumber: z.string().max(100).transform(sanitizeStrict).optional(),
  shippedDate: z.string().datetime().optional(),
});

const orderSearchSchema = z.object({
  buyer: z.string().max(50).transform(s => s.toLowerCase()).optional(),
  seller: z.string().max(50).transform(s => s.toLowerCase()).optional(),
  status: z.enum(['pending', 'processing', 'shipped']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.number().int().min(0).max(1000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/**
 * Orders Service
 * Handles all order-related operations with security and validation
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
  private rateLimiter = getRateLimiter();

  /**
   * Get all orders with validation and caching
   */
  async getOrders(params?: OrderSearchParams): Promise<ApiResponse<Order[]>> {
    try {
      // Validate search params
      let validatedParams: OrderSearchParams | undefined;
      if (params) {
        const validation = securityService.validateAndSanitize(params, orderSearchSchema);
        if (!validation.success) {
          return {
            success: false,
            error: { message: 'Invalid search parameters', details: validation.errors },
          };
        }
        validatedParams = validation.data;
      }

      // Check cache first
      const paramsString = JSON.stringify(validatedParams || {});
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
        if (validatedParams) {
          Object.entries(validatedParams).forEach(([key, value]) => {
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
      if (validatedParams) {
        if (validatedParams.buyer) {
          orderHistory = orderHistory.filter(order => order.buyer === validatedParams.buyer);
        }
        
        if (validatedParams.seller) {
          orderHistory = orderHistory.filter(order => order.seller === validatedParams.seller);
        }
        
        if (validatedParams.status) {
          orderHistory = orderHistory.filter(
            order => order.shippingStatus === validatedParams.status
          );
        }
        
        if (validatedParams.fromDate) {
          orderHistory = orderHistory.filter(
            order => new Date(order.date) >= new Date(validatedParams.fromDate!)
          );
        }
        
        if (validatedParams.toDate) {
          orderHistory = orderHistory.filter(
            order => new Date(order.date) <= new Date(validatedParams.toDate!)
          );
        }

        // Pagination
        if (validatedParams.page !== undefined && validatedParams.limit) {
          const start = validatedParams.page * validatedParams.limit;
          const end = start + validatedParams.limit;
          
          const paginatedData = orderHistory.slice(start, end);
          
          return {
            success: true,
            data: paginatedData,
            meta: {
              page: validatedParams.page,
              totalPages: Math.ceil(orderHistory.length / validatedParams.limit),
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
   * Get single order by ID with validation and caching
   */
  async getOrder(id: string): Promise<ApiResponse<Order | null>> {
    try {
      // Validate order ID
      const sanitizedId = sanitizeStrict(id);
      if (!sanitizedId || sanitizedId.length > 50) {
        return {
          success: false,
          error: { message: 'Invalid order ID' },
        };
      }

      // Check cache first
      const cached = this.orderCache.get(sanitizedId);
      const now = Date.now();
      
      if (cached && now - cached.timestamp < this.CACHE_DURATION) {
        return {
          success: true,
          data: cached.order,
        };
      }

      if (FEATURES.USE_API_ORDERS) {
        const response = await apiCall<Order>(
          buildApiUrl(API_ENDPOINTS.ORDERS.GET, { id: sanitizedId })
        );

        if (response.success && response.data) {
          // Update cache
          this.orderCache.set(sanitizedId, { order: response.data, timestamp: now });
        }

        return response;
      }

      // LocalStorage implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      const order = orderHistory.find(o => o.id === sanitizedId);

      if (order) {
        // Update cache
        this.orderCache.set(sanitizedId, { order, timestamp: now });
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
   * Get orders by buyer with validation
   */
  async getOrdersByBuyer(username: string): Promise<ApiResponse<Order[]>> {
    try {
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      if (!sanitizedUsername || sanitizedUsername.length > 50) {
        return {
          success: false,
          error: { message: 'Invalid username' },
        };
      }

      if (FEATURES.USE_API_ORDERS) {
        return await apiCall<Order[]>(
          buildApiUrl(API_ENDPOINTS.ORDERS.BY_BUYER, { username: sanitizedUsername })
        );
      }

      return this.getOrders({ buyer: sanitizedUsername });
    } catch (error) {
      console.error('Get orders by buyer error:', error);
      return {
        success: false,
        error: { message: 'Failed to get buyer orders' },
      };
    }
  }

  /**
   * Get orders by seller with validation
   */
  async getOrdersBySeller(username: string): Promise<ApiResponse<Order[]>> {
    try {
      const sanitizedUsername = sanitizeStrict(username).toLowerCase();
      if (!sanitizedUsername || sanitizedUsername.length > 50) {
        return {
          success: false,
          error: { message: 'Invalid username' },
        };
      }

      if (FEATURES.USE_API_ORDERS) {
        return await apiCall<Order[]>(
          buildApiUrl(API_ENDPOINTS.ORDERS.BY_SELLER, { username: sanitizedUsername })
        );
      }

      return this.getOrders({ seller: sanitizedUsername });
    } catch (error) {
      console.error('Get orders by seller error:', error);
      return {
        success: false,
        error: { message: 'Failed to get seller orders' },
      };
    }
  }

  /**
   * Create new order with validation and rate limiting
   */
  async createOrder(request: CreateOrderRequest): Promise<ApiResponse<Order>> {
    try {
      // Validate request
      const validation = securityService.validateAndSanitize(request, createOrderSchema);
      if (!validation.success || !validation.data) {
        return {
          success: false,
          error: { message: 'Invalid order data', details: validation.errors },
        };
      }

      const validatedRequest = validation.data;

      // Check rate limit
      const rateLimitKey = `order_create_${validatedRequest.buyer}`;
      const rateLimitResult = this.rateLimiter.check(rateLimitKey, {
        maxAttempts: 20,
        windowMs: 60 * 60 * 1000, // 20 orders per hour
      });
      
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Too many orders. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // Additional validation for price consistency
      if (validatedRequest.wasAuction && validatedRequest.finalBid) {
        if (validatedRequest.finalBid < validatedRequest.price) {
          return {
            success: false,
            error: { message: 'Final bid cannot be less than starting price' },
          };
        }
      }

      // Check for duplicate orders (idempotency)
      const idempotencyKey = this.generateIdempotencyKey(
        validatedRequest.buyer,
        validatedRequest.seller,
        validatedRequest.listingId || validatedRequest.title
      );
      
      if (await this.checkOrderExists(idempotencyKey)) {
        return {
          success: false,
          error: { message: 'This order has already been created' },
        };
      }

      if (FEATURES.USE_API_ORDERS) {
        const response = await apiCall<Order>(API_ENDPOINTS.ORDERS.CREATE, {
          method: 'POST',
          body: JSON.stringify(validatedRequest),
        });

        if (response.success) {
          this.invalidateCache();
          await this.markOrderProcessed(idempotencyKey);
        }

        return response;
      }

      // LocalStorage implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      
      const newOrder: Order = {
        id: uuidv4(),
        title: validatedRequest.title,
        description: validatedRequest.description,
        price: validatedRequest.price,
        markedUpPrice: validatedRequest.markedUpPrice,
        imageUrl: validatedRequest.imageUrl,
        date: new Date().toISOString(),
        seller: validatedRequest.seller,
        buyer: validatedRequest.buyer,
        tags: validatedRequest.tags,
        wearTime: validatedRequest.wearTime,
        wasAuction: validatedRequest.wasAuction,
        finalBid: validatedRequest.finalBid,
        deliveryAddress: validatedRequest.deliveryAddress,
        shippingStatus: validatedRequest.shippingStatus || 'pending',
        tierCreditAmount: validatedRequest.tierCreditAmount,
        isCustomRequest: validatedRequest.isCustomRequest,
        originalRequestId: validatedRequest.originalRequestId,
        listingId: validatedRequest.listingId,
        listingTitle: validatedRequest.listingTitle,
        quantity: validatedRequest.quantity,
      };

      orderHistory.push(newOrder);
      await this.saveOrderHistoryToStorage(orderHistory);

      // Mark as processed
      await this.markOrderProcessed(idempotencyKey);

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
   * Update order status with validation
   */
  async updateOrderStatus(
    id: string,
    update: UpdateOrderStatusRequest
  ): Promise<ApiResponse<Order>> {
    try {
      // Validate ID
      const sanitizedId = sanitizeStrict(id);
      if (!sanitizedId || sanitizedId.length > 50) {
        return {
          success: false,
          error: { message: 'Invalid order ID' },
        };
      }

      // Validate update request
      const validation = securityService.validateAndSanitize(update, updateOrderStatusSchema);
      if (!validation.success || !validation.data) {
        return {
          success: false,
          error: { message: 'Invalid status update data', details: validation.errors },
        };
      }

      const validatedUpdate = validation.data;

      if (FEATURES.USE_API_ORDERS) {
        const response = await apiCall<Order>(
          buildApiUrl(API_ENDPOINTS.ORDERS.UPDATE_STATUS, { id: sanitizedId }),
          {
            method: 'PATCH',
            body: JSON.stringify(validatedUpdate),
          }
        );

        if (response.success) {
          this.invalidateCache();
        }

        return response;
      }

      // LocalStorage implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      const orderIndex = orderHistory.findIndex(o => o.id === sanitizedId);

      if (orderIndex === -1) {
        return {
          success: false,
          error: { message: 'Order not found' },
        };
      }

      orderHistory[orderIndex] = {
        ...orderHistory[orderIndex],
        shippingStatus: validatedUpdate.shippingStatus,
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
   * Update order delivery address with validation
   */
  async updateOrderAddress(
    id: string,
    address: DeliveryAddress
  ): Promise<ApiResponse<Order>> {
    try {
      // Validate ID
      const sanitizedId = sanitizeStrict(id);
      if (!sanitizedId || sanitizedId.length > 50) {
        return {
          success: false,
          error: { message: 'Invalid order ID' },
        };
      }

      // Validate address using the address schema
      const addressValidation = securityService.validateAndSanitize(
        address,
        z.object({
          fullName: z.string().min(2).max(100).transform(sanitizeStrict),
          addressLine1: z.string().min(5).max(200).transform(sanitizeStrict),
          addressLine2: z.string().max(200).transform(sanitizeStrict).optional(),
          city: z.string().min(2).max(100).transform(sanitizeStrict),
          state: z.string().min(2).max(100).transform(sanitizeStrict),
          postalCode: z.string().min(3).max(20),
          country: z.string().min(2).max(100).transform(sanitizeStrict),
          specialInstructions: z.string().max(500).transform(sanitizeStrict).optional(),
        })
      );

      if (!addressValidation.success || !addressValidation.data) {
        return {
          success: false,
          error: { message: 'Invalid address data', details: addressValidation.errors },
        };
      }

      const validatedAddress = addressValidation.data;

      if (FEATURES.USE_API_ORDERS) {
        const response = await apiCall<Order>(
          `${buildApiUrl(API_ENDPOINTS.ORDERS.GET, { id: sanitizedId })}/address`,
          {
            method: 'PATCH',
            body: JSON.stringify({ deliveryAddress: validatedAddress }),
          }
        );

        if (response.success) {
          this.invalidateCache();
        }

        return response;
      }

      // LocalStorage implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      const orderIndex = orderHistory.findIndex(o => o.id === sanitizedId);

      if (orderIndex === -1) {
        return {
          success: false,
          error: { message: 'Order not found' },
        };
      }

      orderHistory[orderIndex] = {
        ...orderHistory[orderIndex],
        deliveryAddress: validatedAddress,
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
   * Get order statistics with validation
   */
  async getOrderStats(username: string, role: 'buyer' | 'seller'): Promise<{
    totalOrders: number;
    totalAmount: number;
    pendingOrders: number;
    shippedOrders: number;
    averageOrderValue: number;
  }> {
    const sanitizedUsername = sanitizeStrict(username).toLowerCase();
    if (!sanitizedUsername) {
      return {
        totalOrders: 0,
        totalAmount: 0,
        pendingOrders: 0,
        shippedOrders: 0,
        averageOrderValue: 0,
      };
    }

    const params = role === 'buyer' ? { buyer: sanitizedUsername } : { seller: sanitizedUsername };
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
      totalAmount: sanitizeNumber(totalAmount, 0, 1000000, 2),
      pendingOrders: orders.filter(o => !o.shippingStatus || o.shippingStatus === 'pending').length,
      shippedOrders: orders.filter(o => o.shippingStatus === 'shipped').length,
      averageOrderValue: orders.length > 0 ? sanitizeNumber(totalAmount / orders.length, 0, 100000, 2) : 0,
    };
  }

  /**
   * Batch update order statuses with validation
   */
  async batchUpdateOrderStatuses(
    orderIds: string[],
    status: 'pending' | 'processing' | 'shipped'
  ): Promise<{ successful: string[]; failed: string[] }> {
    const successful: string[] = [];
    const failed: string[] = [];

    // Validate status
    if (!['pending', 'processing', 'shipped'].includes(status)) {
      return { successful: [], failed: orderIds };
    }

    // Limit batch size
    const limitedOrderIds = orderIds.slice(0, 50);

    for (const orderId of limitedOrderIds) {
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
   * Export orders to CSV with sanitization
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
      sanitizeStrict(order.id),
      new Date(order.date).toLocaleDateString(),
      sanitizeStrict(order.buyer),
      sanitizeStrict(order.seller),
      sanitizeStrict(order.title),
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
    const sanitizedBuyer = sanitizeStrict(buyer).toLowerCase();
    const sanitizedSeller = sanitizeStrict(seller).toLowerCase();
    const sanitizedListingId = sanitizeStrict(listingId);
    return `order_${sanitizedBuyer}_${sanitizedSeller}_${sanitizedListingId}_${Date.now()}`;
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
      
      // Limit the size of processed orders list
      const recentOrders = processedOrders.slice(-1000);
      recentOrders.push(idempotencyKey);
      
      await storageService.setItem('processed_orders', recentOrders);
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