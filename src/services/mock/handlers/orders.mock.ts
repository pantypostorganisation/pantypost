// src/services/mock/handlers/orders.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { Order } from '@/context/WalletContext';
import { DeliveryAddress } from '@/services/orders.service';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeStrict, sanitizeUsername, sanitizeNumber } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import { z } from 'zod';

// Extend Order type for mock data to include tracking info
interface MockOrder extends Order {
  trackingNumber?: string;
  shippedDate?: string;
}

// Validation schemas
const createOrderSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  price: z.number().positive().max(10000),
  seller: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  buyer: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/),
  tags: z.array(z.string().max(20)).max(10).optional(),
  wasAuction: z.boolean().optional(),
  finalBid: z.number().positive().max(10000).optional(),
  deliveryAddress: z.object({
    fullName: z.string().min(2).max(100),
    addressLine1: z.string().min(5).max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(50),
    postalCode: z.string().min(3).max(20),
    country: z.string().length(2),
  }),
  imageUrl: z.string().url().optional()
});

const updateStatusSchema = z.object({
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'pending-auction']),
  trackingNumber: z.string().max(50).optional(),
  shippedDate: z.string().datetime().optional()
});

const addressSchema = z.object({
  deliveryAddress: z.object({
    fullName: z.string().min(2).max(100),
    addressLine1: z.string().min(5).max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(50),
    postalCode: z.string().min(3).max(20),
    country: z.string().length(2),
  })
});

// Generate mock order with sanitized data
function generateMockOrder(buyer: string, seller: string, index: number): MockOrder {
  const titles = [
    'Lacy Dream Set',
    'Silk Sensation',
    'Cotton Comfort',
    'Satin Surprise',
    'Vintage Romance',
  ];
  
  const price = 30 + Math.random() * 70;
  const wasAuction = Math.random() > 0.7;
  const statuses: Order['shippingStatus'][] = ['pending', 'processing', 'shipped'];
  const daysAgo = Math.floor(Math.random() * 30);
  
  const deliveryAddress: DeliveryAddress = {
    fullName: sanitizeStrict(`${buyer} User`) || 'Anonymous User',
    addressLine1: sanitizeStrict(`${Math.floor(Math.random() * 999) + 1} Main St`) || '1 Main St',
    city: sanitizeStrict('New York') || 'Unknown',
    state: sanitizeStrict('NY') || 'XX',
    postalCode: sanitizeStrict('10001') || '00000',
    country: 'US',
  };
  
  const order: MockOrder = {
    id: uuidv4(),
    title: sanitizeStrict(titles[index % titles.length]) || 'Unknown Item',
    description: sanitizeStrict(`Beautiful ${titles[index % titles.length]} from ${seller}`) || 'No description',
    price: Math.round(price * 100) / 100,
    markedUpPrice: Math.round(price * 1.1 * 100) / 100,
    imageUrl: `https://picsum.photos/400/600?random=${index}`,
    date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    seller: sanitizeUsername(seller) || 'unknown',
    buyer: sanitizeUsername(buyer) || 'unknown',
    tags: ['tag1', 'tag2'].map(tag => sanitizeStrict(tag) || '').filter(Boolean),
    wasAuction,
    finalBid: wasAuction ? Math.round(price * 100) / 100 : undefined,
    deliveryAddress,
    shippingStatus: wasAuction && Math.random() > 0.5 ? 'pending-auction' : statuses[Math.floor(Math.random() * statuses.length)],
    tierCreditAmount: Math.random() > 0.8 ? Math.round(price * 0.1 * 100) / 100 : undefined,
  };
  
  // Add tracking info for shipped orders
  if (order.shippingStatus === 'shipped') {
    order.trackingNumber = `TRACK${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    order.shippedDate = new Date(Date.now() - (daysAgo - 5) * 24 * 60 * 60 * 1000).toISOString();
  }
  
  return order;
}

export const mockOrderHandlers = {
  // List orders
  list: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Order[]>> => {
    if (method === 'GET') {
      let orders = await mockDataStore.get<MockOrder[]>('orders', []);
      
      // Generate initial orders if empty
      if (orders.length === 0) {
        const buyers = ['buyer1', 'buyer2', 'buyer3', 'buyer4', 'buyer5'];
        const sellers = ['alice', 'betty', 'carol', 'diana', 'emma'];
        
        buyers.forEach(buyer => {
          sellers.forEach((seller, index) => {
            if (Math.random() > 0.5) {
              orders.push(generateMockOrder(buyer, seller, index));
            }
          });
        });
        
        await mockDataStore.set('orders', orders);
      }
      
      // Apply filters with sanitization
      let filteredOrders = [...orders];
      
      if (params?.buyer) {
        const sanitizedBuyer = sanitizeUsername(params.buyer);
        if (sanitizedBuyer) {
          filteredOrders = filteredOrders.filter(o => o.buyer === sanitizedBuyer);
        }
      }
      
      if (params?.seller) {
        const sanitizedSeller = sanitizeUsername(params.seller);
        if (sanitizedSeller) {
          filteredOrders = filteredOrders.filter(o => o.seller === sanitizedSeller);
        }
      }
      
      if (params?.status && ['pending', 'processing', 'shipped', 'pending-auction'].includes(params.status)) {
        filteredOrders = filteredOrders.filter(o => o.shippingStatus === params.status);
      }
      
      if (params?.fromDate) {
        try {
          const fromDate = new Date(params.fromDate);
          if (!isNaN(fromDate.getTime())) {
            filteredOrders = filteredOrders.filter(o => new Date(o.date) >= fromDate);
          }
        } catch (e) {
          // Invalid date, ignore filter
        }
      }
      
      if (params?.toDate) {
        try {
          const toDate = new Date(params.toDate);
          if (!isNaN(toDate.getTime())) {
            filteredOrders = filteredOrders.filter(o => new Date(o.date) <= toDate);
          }
        } catch (e) {
          // Invalid date, ignore filter
        }
      }
      
      // Sort by date (newest first)
      filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Pagination with validation
      const page = Math.max(0, parseInt(params?.page || '0'));
      const limit = Math.min(100, Math.max(1, parseInt(params?.limit || '20')));
      const startIndex = page * limit;
      const endIndex = startIndex + limit;
      
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      
      // Remove mock-specific properties before returning
      const cleanOrders: Order[] = paginatedOrders.map(({ trackingNumber, shippedDate, ...order }) => order);
      
      return {
        success: true,
        data: cleanOrders,
        meta: {
          page,
          totalPages: Math.ceil(filteredOrders.length / limit),
          totalItems: filteredOrders.length,
        },
      };
    }
    
    if (method === 'POST') {
      try {
        // Create order with validation
        const validatedData = createOrderSchema.parse(data);
        
        // Additional content security checks
        const titleCheck = securityService.checkContentSecurity(validatedData.title);
        const descCheck = securityService.checkContentSecurity(validatedData.description);
        
        if (!titleCheck.safe || !descCheck.safe) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Content contains prohibited material' },
          };
        }
        
        // Prevent self-ordering
        if (validatedData.buyer === validatedData.seller) {
          return {
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Cannot create order for yourself' },
          };
        }
        
        const newOrder: MockOrder = {
          id: uuidv4(),
          title: sanitizeStrict(validatedData.title) || '',
          description: sanitizeStrict(validatedData.description) || '',
          price: validatedData.price,
          markedUpPrice: Math.round(validatedData.price * 1.1 * 100) / 100,
          imageUrl: validatedData.imageUrl || `https://picsum.photos/400/600?random=${Date.now()}`,
          date: new Date().toISOString(),
          shippingStatus: validatedData.wasAuction ? 'pending-auction' : 'pending',
          seller: sanitizeUsername(validatedData.seller) || '',
          buyer: sanitizeUsername(validatedData.buyer) || '',
          tags: validatedData.tags?.map(tag => sanitizeStrict(tag) || '').filter(Boolean) || [],
          wasAuction: validatedData.wasAuction || false,
          finalBid: validatedData.finalBid,
          deliveryAddress: {
            fullName: sanitizeStrict(validatedData.deliveryAddress.fullName) || '',
            addressLine1: sanitizeStrict(validatedData.deliveryAddress.addressLine1) || '',
            addressLine2: validatedData.deliveryAddress.addressLine2 ? sanitizeStrict(validatedData.deliveryAddress.addressLine2) : undefined,
            city: sanitizeStrict(validatedData.deliveryAddress.city) || '',
            state: sanitizeStrict(validatedData.deliveryAddress.state) || '',
            postalCode: sanitizeStrict(validatedData.deliveryAddress.postalCode) || '',
            country: validatedData.deliveryAddress.country,
          },
        };
        
        const orders = await mockDataStore.get<MockOrder[]>('orders', []);
        
        // Limit orders per user
        const userOrders = orders.filter(o => o.buyer === newOrder.buyer);
        if (userOrders.length >= 1000) {
          return {
            success: false,
            error: { code: 'LIMIT_EXCEEDED', message: 'Order limit reached' },
          };
        }
        
        orders.push(newOrder);
        await mockDataStore.set('orders', orders);
        
        // Update seller stats
        const users = await mockDataStore.get<Record<string, any>>('users', {});
        if (users[validatedData.seller]) {
          users[validatedData.seller].totalSales = (users[validatedData.seller].totalSales || 0) + 1;
          await mockDataStore.set('users', users);
        }
        
        // Remove mock-specific properties before returning
        const { trackingNumber, shippedDate, ...cleanOrder } = newOrder;
        
        // Return array with the new order to match expected type
        return {
          success: true,
          data: [cleanOrder],
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            success: false,
            error: { 
              code: 'VALIDATION_ERROR', 
              message: sanitizeStrict(error.errors[0].message) || 'Invalid order data' 
            },
          };
        }
        return {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid order data' },
        };
      }
    }
    
    return {
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    };
  },
  
  // Get single order
  get: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Order | null>> => {
    const id = params?.id;
    
    if (!id || !id.match(/^[a-f0-9-]{36}$/i)) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid order ID' },
      };
    }
    
    const orders = await mockDataStore.get<MockOrder[]>('orders', []);
    const order = orders.find(o => o.id === id);
    
    if (!order) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' },
      };
    }
    
    // Remove mock-specific properties before returning
    const { trackingNumber, shippedDate, ...cleanOrder } = order;
    
    return {
      success: true,
      data: cleanOrder,
    };
  },
  
  // Get orders by buyer
  getByBuyer: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Order[]>> => {
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
    
    const orders = await mockDataStore.get<MockOrder[]>('orders', []);
    const buyerOrders = orders
      .filter(o => o.buyer === sanitizedUsername)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Remove mock-specific properties before returning
    const cleanOrders: Order[] = buyerOrders.map(({ trackingNumber, shippedDate, ...order }) => order);
    
    return {
      success: true,
      data: cleanOrders,
    };
  },
  
  // Get orders by seller
  getBySeller: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Order[]>> => {
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
    
    const orders = await mockDataStore.get<MockOrder[]>('orders', []);
    const sellerOrders = orders
      .filter(o => o.seller === sanitizedUsername)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Remove mock-specific properties before returning
    const cleanOrders: Order[] = sellerOrders.map(({ trackingNumber, shippedDate, ...order }) => order);
    
    return {
      success: true,
      data: cleanOrders,
    };
  },
  
  // Update order status
  updateStatus: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Order>> => {
    if (method !== 'PATCH') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const id = params?.id;
    
    if (!id || !id.match(/^[a-f0-9-]{36}$/i)) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid order ID' },
      };
    }
    
    try {
      const validatedData = updateStatusSchema.parse(data);
      
      const orders = await mockDataStore.get<MockOrder[]>('orders', []);
      const order = orders.find(o => o.id === id);
      
      if (!order) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Order not found' },
        };
      }
      
      // Update order
      order.shippingStatus = validatedData.shippingStatus;
      if (validatedData.trackingNumber) {
        order.trackingNumber = sanitizeStrict(validatedData.trackingNumber) || undefined;
      }
      if (validatedData.shippedDate) {
        order.shippedDate = validatedData.shippedDate;
      }
      
      await mockDataStore.set('orders', orders);
      
      // Remove mock-specific properties before returning
      const { trackingNumber: tn, shippedDate: sd, ...cleanOrder } = order;
      
      return {
        success: true,
        data: cleanOrder,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: sanitizeStrict(error.errors[0].message) || 'Invalid status data' 
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid status update' },
      };
    }
  },
  
  // Update delivery address
  updateAddress: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Order>> => {
    if (method !== 'PATCH') {
      return {
        success: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
      };
    }
    
    const id = params?.id;
    
    if (!id || !id.match(/^[a-f0-9-]{36}$/i)) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid order ID' },
      };
    }
    
    try {
      const validatedData = addressSchema.parse(data);
      
      const orders = await mockDataStore.get<MockOrder[]>('orders', []);
      const order = orders.find(o => o.id === id);
      
      if (!order) {
        return {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Order not found' },
        };
      }
      
      // Don't allow address update for shipped orders
      if (order.shippingStatus === 'shipped') {
        return {
          success: false,
          error: { code: 'INVALID_STATE', message: 'Cannot update address for shipped orders' },
        };
      }
      
      // Update address with sanitization
      order.deliveryAddress = {
        fullName: sanitizeStrict(validatedData.deliveryAddress.fullName) || '',
        addressLine1: sanitizeStrict(validatedData.deliveryAddress.addressLine1) || '',
        addressLine2: validatedData.deliveryAddress.addressLine2 ? sanitizeStrict(validatedData.deliveryAddress.addressLine2) : undefined,
        city: sanitizeStrict(validatedData.deliveryAddress.city) || '',
        state: sanitizeStrict(validatedData.deliveryAddress.state) || '',
        postalCode: sanitizeStrict(validatedData.deliveryAddress.postalCode) || '',
        country: validatedData.deliveryAddress.country,
      };
      
      await mockDataStore.set('orders', orders);
      
      // Remove mock-specific properties before returning
      const { trackingNumber, shippedDate, ...cleanOrder } = order;
      
      return {
        success: true,
        data: cleanOrder,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: sanitizeStrict(error.errors[0].message) || 'Invalid address data' 
          },
        };
      }
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid address data' },
      };
    }
  },
} as const;