// src/hooks/useOrdersService.ts

import { useState, useEffect, useCallback } from 'react';
import { ordersService } from '@/services';
import { Order } from '@/context/WalletContext';
import { DeliveryAddress } from '@/services/orders.service';
import { sanitizeStrict, sanitizeSearchQuery, sanitizeNumber } from '@/utils/security/sanitization';
import { z } from 'zod';

interface UseOrdersServiceOptions {
  buyer?: string;
  seller?: string;
  autoLoad?: boolean;
}

interface UseOrdersServiceResult {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadOrders: () => Promise<void>;
  updateOrderAddress: (orderId: string, address: DeliveryAddress) => Promise<boolean>;
  updateOrderStatus: (orderId: string, status: 'pending' | 'processing' | 'shipped') => Promise<boolean>;
  refreshOrders: () => Promise<void>;
  
  // Filters
  filterByStatus: (status: 'all' | 'pending' | 'processing' | 'shipped') => void;
  sortOrders: (by: 'date' | 'price' | 'status', order?: 'asc' | 'desc') => void;
  searchOrders: (query: string) => void;
  
  // Computed
  filteredOrders: Order[];
  stats: {
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    totalAmount: number;
  };
}

// Order validation schema
const OrderValidationSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number().positive(),
  markedUpPrice: z.number().positive().optional(),
  seller: z.string(),
  buyer: z.string(),
  date: z.string(),
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'delivered', 'pending-auction']).optional(),
  deliveryAddress: z.any().optional(),
  listingId: z.string().optional(),
  wasAuction: z.boolean().optional(),
  isCustomRequest: z.boolean().optional(),
  imageUrls: z.array(z.string()).optional(),
  trackingNumber: z.string().optional(),
  shippedDate: z.string().optional(),
  deliveredDate: z.string().optional()
});

// Valid sort fields
const VALID_SORT_FIELDS = ['date', 'price', 'status'] as const;
const VALID_SORT_ORDERS = ['asc', 'desc'] as const;
const VALID_STATUS_FILTERS = ['all', 'pending', 'processing', 'shipped'] as const;

// Sanitize order data
function sanitizeOrder(order: any): Order | null {
  try {
    // Validate order structure
    const validated = OrderValidationSchema.parse(order);
    
    // Sanitize string fields
    return {
      ...validated,
      title: sanitizeStrict(validated.title),
      description: sanitizeStrict(validated.description),
      seller: sanitizeStrict(validated.seller),
      buyer: sanitizeStrict(validated.buyer),
      price: sanitizeNumber(validated.price, 0, 10000),
      markedUpPrice: validated.markedUpPrice ? sanitizeNumber(validated.markedUpPrice, 0, 10000) : undefined,
      trackingNumber: validated.trackingNumber ? sanitizeStrict(validated.trackingNumber) : undefined
    } as Order;
  } catch (error) {
    console.error('Invalid order data:', error);
    return null;
  }
}

// Sanitize delivery address - return as-is since we don't know the exact structure
function sanitizeDeliveryAddress(address: DeliveryAddress): DeliveryAddress {
  // Since we don't know the exact structure of DeliveryAddress,
  // we'll sanitize common address fields if they exist
  const sanitized: any = { ...address };
  
  // Sanitize string properties that might exist
  const stringFields = ['fullName', 'streetAddress', 'city', 'state', 'postalCode', 'country', 'zipCode', 'apartment', 'phone'];
  
  stringFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeStrict(sanitized[field]);
    }
  });
  
  return sanitized as DeliveryAddress;
}

export function useOrdersService(options: UseOrdersServiceOptions = {}): UseOrdersServiceResult {
  const { buyer, seller, autoLoad = true } = options;
  
  // Sanitize options
  const sanitizedBuyer = buyer ? sanitizeStrict(buyer) : undefined;
  const sanitizedSeller = seller ? sanitizeStrict(seller) : undefined;
  
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state with validation
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load orders with sanitization
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = {
        buyer: sanitizedBuyer,
        seller: sanitizedSeller,
      };
      
      const result = await ordersService.getOrders(params);
      
      if (result.success && result.data) {
        // Sanitize all orders
        const sanitizedOrders = result.data
          .map(order => sanitizeOrder(order))
          .filter((order): order is Order => order !== null);
        
        setOrders(sanitizedOrders);
      } else {
        throw new Error('Failed to load orders');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      // Generic error message to prevent information leakage
      setError('Unable to load orders. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [sanitizedBuyer, sanitizedSeller]);
  
  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && (sanitizedBuyer || sanitizedSeller)) {
      loadOrders();
    }
  }, [autoLoad, sanitizedBuyer, sanitizedSeller, loadOrders]);
  
  // Update order address with validation
  const updateOrderAddress = useCallback(async (
    orderId: string, 
    address: DeliveryAddress
  ): Promise<boolean> => {
    // Validate order ID
    if (!orderId || typeof orderId !== 'string') {
      console.error('Invalid order ID');
      return false;
    }
    
    // Validate address exists
    if (!address || typeof address !== 'object') {
      console.error('Invalid address data');
      return false;
    }
    
    try {
      // Sanitize address data
      const sanitizedAddress = sanitizeDeliveryAddress(address);
      
      const result = await ordersService.updateOrderAddress(orderId, sanitizedAddress);
      
      if (result.success && result.data) {
        // Update local state with sanitized address
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, deliveryAddress: sanitizedAddress } : order
        ));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error updating order address:', err);
      return false;
    }
  }, []);
  
  // Update order status with validation
  const updateOrderStatus = useCallback(async (
    orderId: string,
    status: 'pending' | 'processing' | 'shipped'
  ): Promise<boolean> => {
    // Validate order ID
    if (!orderId || typeof orderId !== 'string') {
      console.error('Invalid order ID');
      return false;
    }
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped'];
    if (!validStatuses.includes(status)) {
      console.error('Invalid status');
      return false;
    }
    
    try {
      const result = await ordersService.updateOrderStatus(orderId, { shippingStatus: status });
      
      if (result.success && result.data) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, shippingStatus: status } : order
        ));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error updating order status:', err);
      return false;
    }
  }, []);
  
  // Refresh orders
  const refreshOrders = useCallback(async () => {
    await loadOrders();
  }, [loadOrders]);
  
  // Filter and sort orders with validation
  const filteredOrders = orders
    .filter(order => {
      // Status filter - exclude pending-auction from normal filters
      if (statusFilter !== 'all') {
        const orderStatus = order.shippingStatus || 'pending';
        // Don't show pending-auction orders in normal filters
        if (orderStatus === 'pending-auction') return false;
        if (orderStatus !== statusFilter) return false;
      }
      
      // Search filter with sanitized query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          order.title.toLowerCase().includes(query) ||
          order.seller.toLowerCase().includes(query) ||
          order.buyer.toLowerCase().includes(query) ||
          order.description.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          try {
            compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
          } catch {
            compareValue = 0;
          }
          break;
        case 'price':
          compareValue = (a.markedUpPrice || a.price) - (b.markedUpPrice || b.price);
          break;
        case 'status':
          const statusOrder: Record<string, number> = { 
            'pending': 0, 
            'processing': 1, 
            'shipped': 2,
            'delivered': 3,
            'pending-auction': 4
          };
          const aStatus = a.shippingStatus || 'pending';
          const bStatus = b.shippingStatus || 'pending';
          // Use default value of 99 for unknown statuses
          compareValue = (statusOrder[aStatus] ?? 99) - (statusOrder[bStatus] ?? 99);
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  
  // Calculate stats with validation (excluding pending-auction orders)
  const stats = {
    total: Math.max(0, orders.filter(o => o.shippingStatus !== 'pending-auction').length),
    pending: Math.max(0, orders.filter(o => !o.shippingStatus || o.shippingStatus === 'pending').length),
    processing: Math.max(0, orders.filter(o => o.shippingStatus === 'processing').length),
    shipped: Math.max(0, orders.filter(o => o.shippingStatus === 'shipped').length),
    totalAmount: Math.max(0, orders
      .filter(o => o.shippingStatus !== 'pending-auction')
      .reduce((sum, o) => {
        const price = o.markedUpPrice || o.price;
        return sum + (typeof price === 'number' && price > 0 ? price : 0);
      }, 0)),
  };
  
  // Filter actions with validation
  const filterByStatus = useCallback((status: 'all' | 'pending' | 'processing' | 'shipped') => {
    if (VALID_STATUS_FILTERS.includes(status)) {
      setStatusFilter(status);
    } else {
      console.error('Invalid status filter:', status);
    }
  }, []);
  
  const sortOrders = useCallback((by: 'date' | 'price' | 'status', order: 'asc' | 'desc' = 'desc') => {
    if (VALID_SORT_FIELDS.includes(by)) {
      setSortBy(by);
    } else {
      console.error('Invalid sort field:', by);
    }
    
    if (VALID_SORT_ORDERS.includes(order)) {
      setSortOrder(order);
    } else {
      console.error('Invalid sort order:', order);
    }
  }, []);
  
  const searchOrders = useCallback((query: string) => {
    // Sanitize search query
    const sanitized = sanitizeSearchQuery(query);
    setSearchQuery(sanitized);
  }, []);
  
  return {
    orders,
    isLoading,
    error,
    loadOrders,
    updateOrderAddress,
    updateOrderStatus,
    refreshOrders,
    filterByStatus,
    sortOrders,
    searchOrders,
    filteredOrders,
    stats,
  };
}
