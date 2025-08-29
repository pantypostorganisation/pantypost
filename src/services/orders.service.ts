// src/services/orders.service.ts

import { Order } from '@/context/WalletContext';
import { storageService } from './storage.service';
import { FEATURES, API_ENDPOINTS, buildApiUrl, apiCall, ApiResponse } from './api.config';
import { v4 as uuidv4 } from 'uuid';
import { securityService } from './security.service';
import { sanitizeStrict, sanitizeCurrency, sanitizeUsername, sanitizeUrl } from '@/utils/security/sanitization';
import { getRateLimiter, RATE_LIMITS } from '@/utils/security/rate-limiter';
import { z } from 'zod';
import { validateSchema } from '@/utils/validation/schemas';

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

// NEW: Interface for custom request conversion
export interface CustomRequestOrderRequest {
  requestId: string;
  title: string;
  description: string;
  price: number;
  seller: string;
  buyer: string;
  tags?: string[];
  deliveryAddress?: DeliveryAddress;
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

// Custom delivery address schema that matches the interface
const deliveryAddressSchema = z.object({
  fullName: z.string().min(2).max(100).transform(sanitizeStrict),
  addressLine1: z.string().min(5).max(200).transform(sanitizeStrict),
  addressLine2: z.string().max(200).transform(sanitizeStrict).optional(),
  city: z.string().min(2).max(100).transform(sanitizeStrict),
  state: z.string().min(2).max(100).transform(sanitizeStrict),
  postalCode: z.string().min(3).max(20).regex(/^[A-Z0-9\s-]+$/i).transform(sanitizeStrict),
  country: z.string().min(2).max(100).transform(sanitizeStrict),
  specialInstructions: z.string().max(500).transform(sanitizeStrict).optional(),
});

// Validation schemas
const createOrderSchema = z.object({
  title: z.string().min(1).max(200).transform(sanitizeStrict),
  description: z.string().min(1).max(2000).transform(sanitizeStrict),
  price: z.number().positive().min(0.01).max(100000),
  markedUpPrice: z.number().positive().min(0.01).max(100000),
  imageUrl: z.string().url().optional().or(z.literal('')).transform(url => url ? sanitizeUrl(url) : undefined),
  seller: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).transform(sanitizeUsername),
  buyer: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).transform(sanitizeUsername),
  tags: z.array(z.string().max(30).transform(sanitizeStrict)).max(20).optional(),
  wearTime: z.string().max(50).transform(sanitizeStrict).optional(),
  wasAuction: z.boolean().optional(),
  finalBid: z.number().positive().optional(),
  deliveryAddress: deliveryAddressSchema.optional(),
  tierCreditAmount: z.number().min(0).optional(),
  isCustomRequest: z.boolean().optional(),
  originalRequestId: z.string().uuid().optional(),
  listingId: z.string().max(100).optional(),
  listingTitle: z.string().max(200).transform(sanitizeStrict).optional(),
  quantity: z.number().int().positive().max(100).optional(),
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'pending-auction']).optional(),
}).refine(data => {
  // Ensure markedUpPrice is >= price
  return data.markedUpPrice >= data.price;
}, {
  message: 'Marked up price must be greater than or equal to base price',
  path: ['markedUpPrice'],
});

// NEW: Validation schema for custom request conversion
const customRequestOrderSchema = z.object({
  requestId: z.string().min(1).max(100),
  title: z.string().min(1).max(200).transform(sanitizeStrict),
  description: z.string().min(1).max(2000).transform(sanitizeStrict),
  price: z.number().positive().min(0.01).max(100000),
  seller: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).transform(sanitizeUsername),
  buyer: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/).transform(sanitizeUsername),
  tags: z.array(z.string().max(30).transform(sanitizeStrict)).max(20).optional(),
  deliveryAddress: deliveryAddressSchema.optional(),
});

const updateOrderStatusSchema = z.object({
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'pending-auction']),
  trackingNumber: z.string().max(100).transform(sanitizeStrict).optional(),
  shippedDate: z.string().datetime().optional(),
});

const orderSearchSchema = z.object({
  buyer: z.string().min(3).max(30).transform(sanitizeUsername).optional(),
  seller: z.string().min(3).max(30).transform(sanitizeUsername).optional(),
  status: z.enum(['pending', 'processing', 'shipped']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  page: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

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
  private rateLimiter = getRateLimiter();

  /**
   * Get all orders with caching - accepts OrderSearchParams instead of boolean
   */
  async getOrders(params?: OrderSearchParams): Promise<ApiResponse<Order[]>> {
    try {
      // Validate search params
      let validatedParams: OrderSearchParams | undefined;
      if (params) {
        const validation = validateSchema(orderSearchSchema, params);
        if (!validation.success) {
          return {
            success: false,
            error: { message: 'Invalid search parameters' },
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
          // Sanitize order data
          const sanitizedOrders = response.data.map(order => this.sanitizeOrderData(order));
          
          // Update cache
          this.ordersListCache = {
            data: sanitizedOrders,
            timestamp: now,
            params: paramsString,
          };
          
          return {
            ...response,
            data: sanitizedOrders,
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
   * Get single order by ID with caching
   */
  async getOrder(id: string): Promise<ApiResponse<Order | null>> {
    try {
      // Validate ID
      if (!id || typeof id !== 'string' || id.length > 100) {
        return {
          success: false,
          error: { message: 'Invalid order ID' },
        };
      }

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
          const sanitizedOrder = this.sanitizeOrderData(response.data);
          
          // Update cache
          this.orderCache.set(id, { order: sanitizedOrder, timestamp: now });
          
          return {
            ...response,
            data: sanitizedOrder,
          };
        }

        return response;
      }

      // LocalStorage implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      const order = orderHistory.find(o => o.id === id);

      if (order) {
        const sanitizedOrder = this.sanitizeOrderData(order);
        
        // Update cache
        this.orderCache.set(id, { order: sanitizedOrder, timestamp: now });
        
        return {
          success: true,
          data: sanitizedOrder,
        };
      }

      return {
        success: true,
        data: null,
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
      // Validate username
      const validatedUsername = sanitizeUsername(username);
      if (!validatedUsername || validatedUsername.length < 3 || validatedUsername.length > 30) {
        return {
          success: false,
          error: { message: 'Invalid username' },
        };
      }

      if (FEATURES.USE_API_ORDERS) {
        return await apiCall<Order[]>(
          buildApiUrl(API_ENDPOINTS.ORDERS.BY_BUYER, { username: validatedUsername })
        );
      }

      return this.getOrders({ buyer: validatedUsername });
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
      // Validate username
      const validatedUsername = sanitizeUsername(username);
      if (!validatedUsername || validatedUsername.length < 3 || validatedUsername.length > 30) {
        return {
          success: false,
          error: { message: 'Invalid username' },
        };
      }

      if (FEATURES.USE_API_ORDERS) {
        return await apiCall<Order[]>(
          buildApiUrl(API_ENDPOINTS.ORDERS.BY_SELLER, { username: validatedUsername })
        );
      }

      return this.getOrders({ seller: validatedUsername });
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
      // Check rate limit
      const rateLimitResult = this.rateLimiter.check(
        `order_create_${request.buyer}`,
        { maxAttempts: 20, windowMs: 60 * 60 * 1000 } // 20 orders per hour
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Too many orders. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // Validate and sanitize request
      const validation = validateSchema(createOrderSchema, request);
      if (!validation.success) {
        return {
          success: false,
          error: { message: Object.values(validation.errors || {})[0] || 'Invalid order data' },
        };
      }

      const sanitizedRequest = validation.data!;

      // Additional content security check
      const contentCheck = securityService.checkContentSecurity(
        `${sanitizedRequest.title} ${sanitizedRequest.description}`
      );
      if (!contentCheck.safe) {
        return {
          success: false,
          error: { message: 'Order contains prohibited content' },
        };
      }

      if (FEATURES.USE_API_ORDERS) {
        const response = await apiCall<Order>(API_ENDPOINTS.ORDERS.CREATE, {
          method: 'POST',
          body: JSON.stringify(sanitizedRequest),
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
        title: sanitizedRequest.title,
        description: sanitizedRequest.description,
        price: sanitizedRequest.price,
        markedUpPrice: sanitizedRequest.markedUpPrice,
        imageUrl: sanitizedRequest.imageUrl,
        date: new Date().toISOString(),
        seller: sanitizedRequest.seller,
        buyer: sanitizedRequest.buyer,
        tags: sanitizedRequest.tags,
        wearTime: sanitizedRequest.wearTime,
        wasAuction: sanitizedRequest.wasAuction,
        finalBid: sanitizedRequest.finalBid,
        deliveryAddress: sanitizedRequest.deliveryAddress,
        shippingStatus: sanitizedRequest.shippingStatus || 'pending',
        tierCreditAmount: sanitizedRequest.tierCreditAmount,
        isCustomRequest: sanitizedRequest.isCustomRequest,
        originalRequestId: sanitizedRequest.originalRequestId,
        listingId: sanitizedRequest.listingId,
        listingTitle: sanitizedRequest.listingTitle,
        quantity: sanitizedRequest.quantity,
      };

      orderHistory.push(newOrder);
      
      // CRITICAL FIX: Save immediately to storage to ensure data is persisted
      await this.saveOrderHistoryToStorage(orderHistory);
      
      // CRITICAL FIX: Invalidate cache immediately so next read gets fresh data
      this.invalidateCache();
      
      console.log('[OrdersService] Order created and saved:', {
        orderId: newOrder.id,
        buyer: newOrder.buyer,
        listingId: newOrder.listingId,
        shippingStatus: newOrder.shippingStatus
      });

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
   * NEW: Create order from custom request
   */
  async createOrderFromCustomRequest(request: CustomRequestOrderRequest): Promise<ApiResponse<Order>> {
    try {
      // Check rate limit
      const rateLimitResult = this.rateLimiter.check(
        `custom_request_order_${request.buyer}`,
        { maxAttempts: 10, windowMs: 60 * 60 * 1000 } // 10 custom request orders per hour
      );
      if (!rateLimitResult.allowed) {
        return {
          success: false,
          error: { message: `Too many custom request orders. Please wait ${rateLimitResult.waitTime} seconds.` },
        };
      }

      // Validate and sanitize request
      const validation = validateSchema(customRequestOrderSchema, request);
      if (!validation.success) {
        return {
          success: false,
          error: { message: Object.values(validation.errors || {})[0] || 'Invalid custom request data' },
        };
      }

      const sanitizedRequest = validation.data!;

      // Additional content security check
      const contentCheck = securityService.checkContentSecurity(
        `${sanitizedRequest.title} ${sanitizedRequest.description}`
      );
      if (!contentCheck.safe) {
        return {
          success: false,
          error: { message: 'Custom request contains prohibited content' },
        };
      }

      if (FEATURES.USE_API_ORDERS) {
        // Use the new custom request endpoint
        const response = await apiCall<Order>('/api/orders/custom-request', {
          method: 'POST',
          body: JSON.stringify(sanitizedRequest),
        });

        if (response.success) {
          this.invalidateCache();
          
          // Mark the custom request as paid in localStorage
          try {
            const requests = await storageService.getItem<any[]>('panty_custom_requests', []);
            const updatedRequests = requests.map(req => 
              req.id === sanitizedRequest.requestId 
                ? { ...req, status: 'paid', paid: true, orderId: response.data?.id }
                : req
            );
            await storageService.setItem('panty_custom_requests', updatedRequests);
          } catch (error) {
            console.error('Failed to update custom request status:', error);
          }
        }

        return response;
      }

      // LocalStorage fallback implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      
      const newOrder: Order = {
        id: uuidv4(),
        title: sanitizedRequest.title,
        description: sanitizedRequest.description,
        price: sanitizedRequest.price,
        markedUpPrice: Math.round(sanitizedRequest.price * 1.1 * 100) / 100, // 10% markup
        imageUrl: '/api/placeholder/400/300',
        date: new Date().toISOString(),
        seller: sanitizedRequest.seller,
        buyer: sanitizedRequest.buyer,
        tags: sanitizedRequest.tags,
        deliveryAddress: sanitizedRequest.deliveryAddress,
        shippingStatus: 'pending',
        isCustomRequest: true,
        originalRequestId: sanitizedRequest.requestId,
      };

      orderHistory.push(newOrder);
      await this.saveOrderHistoryToStorage(orderHistory);
      this.invalidateCache();
      
      // Mark the custom request as paid in localStorage
      try {
        const requests = await storageService.getItem<any[]>('panty_custom_requests', []);
        const updatedRequests = requests.map(req => 
          req.id === sanitizedRequest.requestId 
            ? { ...req, status: 'paid', paid: true, orderId: newOrder.id }
            : req
        );
        await storageService.setItem('panty_custom_requests', updatedRequests);
      } catch (error) {
        console.error('Failed to update custom request status:', error);
      }

      console.log('[OrdersService] Custom request order created:', {
        orderId: newOrder.id,
        requestId: sanitizedRequest.requestId,
        buyer: newOrder.buyer,
        seller: newOrder.seller
      });

      return {
        success: true,
        data: newOrder,
      };
    } catch (error) {
      console.error('Create custom request order error:', error);
      return {
        success: false,
        error: { message: 'Failed to create order from custom request' },
      };
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    id: string,
    update: UpdateOrderStatusRequest | { shippingStatus?: 'pending' | 'processing' | 'shipped' | 'pending-auction'; [key: string]: any }
  ): Promise<ApiResponse<Order>> {
    try {
      // Validate ID
      if (!id || typeof id !== 'string' || id.length > 100) {
        return {
          success: false,
          error: { message: 'Invalid order ID' },
        };
      }

      // For backward compatibility, accept both forms
      const statusUpdate = update.shippingStatus ? { shippingStatus: update.shippingStatus } : update;

      // Validate and sanitize update
      const validation = validateSchema(updateOrderStatusSchema, statusUpdate);
      if (!validation.success) {
        return {
          success: false,
          error: { message: 'Invalid status update data' },
        };
      }

      const sanitizedUpdate = validation.data!;

      if (FEATURES.USE_API_ORDERS) {
        const response = await apiCall<Order>(
          buildApiUrl(API_ENDPOINTS.ORDERS.UPDATE_STATUS, { id }),
          {
            method: 'PATCH',
            body: JSON.stringify(sanitizedUpdate),
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

      // Update the order with all properties from update
      orderHistory[orderIndex] = {
        ...orderHistory[orderIndex],
        ...update,
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
  ): Promise<boolean> {
    try {
      // Validate ID
      if (!id || typeof id !== 'string' || id.length > 100) {
        console.error('[OrdersService] Invalid order ID');
        return false;
      }

      // Validate and sanitize address
      const validation = validateSchema(deliveryAddressSchema, address);
      if (!validation.success) {
        console.error('[OrdersService] Invalid address:', validation.errors);
        return false;
      }

      const sanitizedAddress = validation.data!;

      if (FEATURES.USE_API_ORDERS) {
        // Call the new dedicated endpoint for address updates
        const response = await apiCall<Order>(
          `${buildApiUrl(API_ENDPOINTS.ORDERS.GET, { id })}/address`,
          {
            method: 'PUT',
            body: JSON.stringify({ deliveryAddress: sanitizedAddress }),
          }
        );

        if (response.success) {
          this.invalidateCache();
          console.log('[OrdersService] Address updated via API');
          return true;
        }

        console.error('[OrdersService] API address update failed:', response.error);
        return false;
      }

      // LocalStorage implementation
      const orderHistory = await this.getOrderHistoryFromStorage();
      const orderIndex = orderHistory.findIndex(o => o.id === id);

      if (orderIndex === -1) {
        console.error('[OrdersService] Order not found');
        return false;
      }

      orderHistory[orderIndex] = {
        ...orderHistory[orderIndex],
        deliveryAddress: sanitizedAddress,
      };

      await this.saveOrderHistoryToStorage(orderHistory);

      // Invalidate cache
      this.invalidateCache();
      
      console.log('[OrdersService] Address updated in localStorage');
      return true;
    } catch (error) {
      console.error('[OrdersService] Update order address error:', error);
      return false;
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
    // Validate username
    const validatedUsername = sanitizeUsername(username);
    if (!validatedUsername) {
      return {
        totalOrders: 0,
        totalAmount: 0,
        pendingOrders: 0,
        shippedOrders: 0,
        averageOrderValue: 0,
      };
    }

    const params = role === 'buyer' ? { buyer: validatedUsername } : { seller: validatedUsername };
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

    // Validate order IDs
    const validOrderIds = orderIds.filter(id => 
      id && typeof id === 'string' && id.length <= 100
    );

    for (const orderId of validOrderIds) {
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
   * Export orders to CSV with security
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

    // Sanitize data for CSV to prevent injection
    const sanitizeForCSV = (value: any): string => {
      const str = String(value);
      // Remove any formula injection attempts
      if (/^[=+\-@]/.test(str)) {
        return `'${str}`;
      }
      // Escape quotes
      return str.replace(/"/g, '""');
    };

    const rows = orders.map(order => [
      sanitizeForCSV(order.id),
      sanitizeForCSV(new Date(order.date).toLocaleDateString()),
      sanitizeForCSV(order.buyer),
      sanitizeForCSV(order.seller),
      sanitizeForCSV(order.title),
      sanitizeForCSV(order.price.toFixed(2)),
      sanitizeForCSV(order.markedUpPrice.toFixed(2)),
      sanitizeForCSV(order.shippingStatus || 'pending'),
      sanitizeForCSV(order.wasAuction ? 'Auction' : order.isCustomRequest ? 'Custom' : 'Direct'),
    ]);

    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return csv;
  }

  /**
   * Generate idempotency key for order
   */
  generateIdempotencyKey(buyer: string, seller: string, listingId: string): string {
    const sanitizedBuyer = sanitizeUsername(buyer);
    const sanitizedSeller = sanitizeUsername(seller);
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
   * Add this method to force clear cache and sync
   */
  public async forceSync(): Promise<void> {
    this.clearCache();
    
    // Force a storage event to trigger updates in other contexts
    const orders = await this.getOrderHistoryFromStorage();
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'wallet_orders',
      newValue: JSON.stringify(orders),
      url: window.location.href
    }));
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

  /**
   * Sanitize order data
   */
  private sanitizeOrderData(order: Order): Order {
    return {
      ...order,
      title: sanitizeStrict(order.title),
      description: sanitizeStrict(order.description),
      seller: sanitizeUsername(order.seller),
      buyer: sanitizeUsername(order.buyer),
      price: sanitizeCurrency(order.price),
      markedUpPrice: sanitizeCurrency(order.markedUpPrice),
      imageUrl: order.imageUrl ? sanitizeUrl(order.imageUrl) : undefined,
      tags: order.tags?.map(tag => sanitizeStrict(tag)),
      wearTime: order.wearTime ? sanitizeStrict(order.wearTime) : undefined,
      listingTitle: order.listingTitle ? sanitizeStrict(order.listingTitle) : undefined,
      finalBid: order.finalBid ? sanitizeCurrency(order.finalBid) : undefined,
      tierCreditAmount: order.tierCreditAmount ? sanitizeCurrency(order.tierCreditAmount) : undefined,
    };
  }

  // Helper methods for localStorage
  private async getOrderHistoryFromStorage(): Promise<Order[]> {
    // FIXED: Use the same key as WalletContext: 'wallet_orders'
    const orders = await storageService.getItem<Order[]>('wallet_orders', []);
    // Sanitize all orders when loading from storage
    return orders.map(order => this.sanitizeOrderData(order));
  }

  private async saveOrderHistoryToStorage(orders: Order[]): Promise<void> {
    // Sanitize before saving
    const sanitizedOrders = orders.map(order => this.sanitizeOrderData(order));
    // FIXED: Use the same key as WalletContext: 'wallet_orders'
    await storageService.setItem('wallet_orders', sanitizedOrders);
  }
}

// Export singleton instance
export const ordersService = new OrdersService();