// src/services/mock/handlers/orders.mock.ts

import { ApiResponse } from '@/types/api';
import { MockHandler } from '../mock-api';
import { mockDataStore } from '../mock.config';
import { Order } from '@/context/WalletContext';
import { DeliveryAddress } from '@/services/orders.service';
import { v4 as uuidv4 } from 'uuid';

// Extend Order type for mock data to include tracking info
interface MockOrder extends Order {
  trackingNumber?: string;
  shippedDate?: string;
}

// Generate mock order
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
    fullName: `${buyer} User`,
    addressLine1: `${Math.floor(Math.random() * 999) + 1} Main St`,
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  };
  
  const order: MockOrder = {
    id: uuidv4(),
    title: titles[index % titles.length],
    description: `Beautiful ${titles[index % titles.length]} from ${seller}`,
    price: Math.round(price * 100) / 100,
    markedUpPrice: Math.round(price * 1.1 * 100) / 100,
    imageUrl: `https://picsum.photos/400/600?random=${index}`,
    date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    seller,
    buyer,
    tags: ['tag1', 'tag2'],
    wasAuction,
    finalBid: wasAuction ? Math.round(price * 100) / 100 : undefined,
    deliveryAddress,
    shippingStatus: statuses[Math.floor(Math.random() * statuses.length)],
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
      
      // Apply filters
      let filteredOrders = [...orders];
      
      if (params?.buyer) {
        filteredOrders = filteredOrders.filter(o => o.buyer === params.buyer);
      }
      
      if (params?.seller) {
        filteredOrders = filteredOrders.filter(o => o.seller === params.seller);
      }
      
      if (params?.status) {
        filteredOrders = filteredOrders.filter(o => o.shippingStatus === params.status);
      }
      
      if (params?.fromDate) {
        filteredOrders = filteredOrders.filter(o => new Date(o.date) >= new Date(params.fromDate!));
      }
      
      if (params?.toDate) {
        filteredOrders = filteredOrders.filter(o => new Date(o.date) <= new Date(params.toDate!));
      }
      
      // Sort by date (newest first)
      filteredOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Pagination
      const page = parseInt(params?.page || '0');
      const limit = parseInt(params?.limit || '20');
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
      // Create order
      const newOrder: MockOrder = {
        id: uuidv4(),
        date: new Date().toISOString(),
        shippingStatus: 'pending',
        ...data,
      };
      
      const orders = await mockDataStore.get<MockOrder[]>('orders', []);
      orders.push(newOrder);
      await mockDataStore.set('orders', orders);
      
      // Update seller stats
      const users = await mockDataStore.get<Record<string, any>>('users', {});
      if (users[data.seller]) {
        users[data.seller].totalSales = (users[data.seller].totalSales || 0) + 1;
        await mockDataStore.set('users', users);
      }
      
      // Remove mock-specific properties before returning
      const { trackingNumber, shippedDate, ...cleanOrder } = newOrder;
      
      // Return array with the new order to match expected type
      return {
        success: true,
        data: [cleanOrder],
      };
    }
    
    return {
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' },
    };
  },
  
  // Get single order
  get: async (method: string, endpoint: string, data?: any, params?: Record<string, string>): Promise<ApiResponse<Order | null>> => {
    const id = params?.id;
    
    if (!id) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Order ID is required' },
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
    
    const orders = await mockDataStore.get<MockOrder[]>('orders', []);
    const buyerOrders = orders
      .filter(o => o.buyer === username)
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
    
    const orders = await mockDataStore.get<MockOrder[]>('orders', []);
    const sellerOrders = orders
      .filter(o => o.seller === username)
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
    const { shippingStatus, trackingNumber, shippedDate } = data;
    
    if (!id || !shippingStatus) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Order ID and status are required' },
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
    
    // Update order
    order.shippingStatus = shippingStatus;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    if (shippedDate) {
      order.shippedDate = shippedDate;
    }
    
    await mockDataStore.set('orders', orders);
    
    // Remove mock-specific properties before returning
    const { trackingNumber: tn, shippedDate: sd, ...cleanOrder } = order;
    
    return {
      success: true,
      data: cleanOrder,
    };
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
    const { deliveryAddress } = data;
    
    if (!id || !deliveryAddress) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Order ID and address are required' },
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
    
    // Validate address
    if (!deliveryAddress.fullName || !deliveryAddress.addressLine1 || 
        !deliveryAddress.city || !deliveryAddress.state || 
        !deliveryAddress.postalCode || !deliveryAddress.country) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'All address fields are required' },
      };
    }
    
    // Update address
    order.deliveryAddress = deliveryAddress;
    await mockDataStore.set('orders', orders);
    
    // Remove mock-specific properties before returning
    const { trackingNumber, shippedDate, ...cleanOrder } = order;
    
    return {
      success: true,
      data: cleanOrder,
    };
  },
} as const;