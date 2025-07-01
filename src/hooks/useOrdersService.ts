// src/hooks/useOrdersService.ts

import { useState, useEffect, useCallback } from 'react';
import { ordersService } from '@/services';
import { Order } from '@/context/WalletContext';
import { DeliveryAddress } from '@/services/orders.service';

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

export function useOrdersService(options: UseOrdersServiceOptions = {}): UseOrdersServiceResult {
  const { buyer, seller, autoLoad = true } = options;
  
  // State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load orders
  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params = {
        buyer,
        seller,
      };
      
      const result = await ordersService.getOrders(params);
      
      if (result.success && result.data) {
        setOrders(result.data);
      } else {
        throw new Error(result.error?.message || 'Failed to load orders');
      }
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [buyer, seller]);
  
  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && (buyer || seller)) {
      loadOrders();
    }
  }, [autoLoad, buyer, seller, loadOrders]);
  
  // Update order address
  const updateOrderAddress = useCallback(async (
    orderId: string, 
    address: DeliveryAddress
  ): Promise<boolean> => {
    try {
      const result = await ordersService.updateOrderAddress(orderId, address);
      
      if (result.success && result.data) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, deliveryAddress: address } : order
        ));
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error updating order address:', err);
      return false;
    }
  }, []);
  
  // Update order status
  const updateOrderStatus = useCallback(async (
    orderId: string,
    status: 'pending' | 'processing' | 'shipped'
  ): Promise<boolean> => {
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
  
  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      // Status filter
      if (statusFilter !== 'all' && order.shippingStatus !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          order.title.toLowerCase().includes(query) ||
          order.seller.toLowerCase().includes(query) ||
          order.buyer.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'date':
          compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'price':
          compareValue = (a.markedUpPrice || a.price) - (b.markedUpPrice || b.price);
          break;
        case 'status':
          const statusOrder = { 'pending': 0, 'processing': 1, 'shipped': 2 };
          const aStatus = a.shippingStatus || 'pending';
          const bStatus = b.shippingStatus || 'pending';
          compareValue = statusOrder[aStatus] - statusOrder[bStatus];
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  
  // Calculate stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => !o.shippingStatus || o.shippingStatus === 'pending').length,
    processing: orders.filter(o => o.shippingStatus === 'processing').length,
    shipped: orders.filter(o => o.shippingStatus === 'shipped').length,
    totalAmount: orders.reduce((sum, o) => sum + (o.markedUpPrice || o.price), 0),
  };
  
  // Filter actions
  const filterByStatus = useCallback((status: 'all' | 'pending' | 'processing' | 'shipped') => {
    setStatusFilter(status);
  }, []);
  
  const sortOrders = useCallback((by: 'date' | 'price' | 'status', order: 'asc' | 'desc' = 'desc') => {
    setSortBy(by);
    setSortOrder(order);
  }, []);
  
  const searchOrders = useCallback((query: string) => {
    setSearchQuery(query);
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
