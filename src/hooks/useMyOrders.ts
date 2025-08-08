// src/hooks/useMyOrders.ts

import { useState, useMemo, useCallback, useContext, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WalletContext } from '@/context/WalletContext';
import { ordersService } from '@/services/orders.service';
import type { Order } from '@/types/order';
import { useListings } from '@/context/ListingContext';
import type { DeliveryAddress } from '@/types/order';
import { sanitizeStrict, sanitizeSearchQuery, sanitizeNumber } from '@/utils/security/sanitization';
import { z } from 'zod';

// Order validation schema matching the WalletContext Order type
const OrderSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  price: z.number().positive(),
  markedUpPrice: z.number().positive().optional(),
  imageUrl: z.string().optional(), // FIXED: Changed from imageUrls array to imageUrl string
  seller: z.string(),
  buyer: z.string(),
  date: z.string(),
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'delivered', 'pending-auction']).optional(),
  wasAuction: z.boolean().optional(),
  isCustomRequest: z.boolean().optional(),
  deliveryAddress: z.any().optional(),
  listingId: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippedDate: z.string().optional(),
  deliveredDate: z.string().optional(),
  // Add any other fields that might be on the order
  tags: z.array(z.string()).optional(),
  wearTime: z.string().optional(),
  finalBid: z.number().optional(),
  tierCreditAmount: z.number().optional(),
  originalRequestId: z.string().optional(),
  listingTitle: z.string().optional(),
  quantity: z.number().optional()
});

type ValidatedOrder = z.infer<typeof OrderSchema>;

export interface OrderStats {
  totalSpent: number;
  pendingOrders: number;
  shippedOrders: number;
}

// Helper function to validate and sanitize order
function sanitizeOrder(order: any): ValidatedOrder | null {
  try {
    // Add default description if missing
    const orderWithDefaults = {
      ...order,
      description: order.description || 'No description available'
    };
    
    // Validate order structure
    const validated = OrderSchema.parse(orderWithDefaults);
    
    // Sanitize string fields
    return {
      ...validated,
      title: sanitizeStrict(validated.title),
      description: sanitizeStrict(validated.description),
      seller: sanitizeStrict(validated.seller),
      buyer: sanitizeStrict(validated.buyer),
      price: sanitizeNumber(validated.price, 0, 10000),
      markedUpPrice: validated.markedUpPrice ? sanitizeNumber(validated.markedUpPrice, 0, 10000) : undefined,
      trackingNumber: validated.trackingNumber ? sanitizeStrict(validated.trackingNumber) : undefined,
      imageUrl: validated.imageUrl // Preserve the imageUrl
    };
  } catch (error) {
    console.error('Invalid order data:', error);
    return null;
  }
}

export function useMyOrders() {
  const { user } = useAuth();
  const walletContext = useContext(WalletContext);
  const { users } = useListings();
  
  // State
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'shipped'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  
  // 🔧 NEW: Direct API order fetching
  const [apiOrders, setApiOrders] = useState<Order[]>([]);
  const [isLoadingApiOrders, setIsLoadingApiOrders] = useState(false);
  
  // 🔧 NEW: Load orders directly from API
  const loadOrdersFromApi = useCallback(async () => {
    if (!user?.username || isLoadingApiOrders) return;
    
    setIsLoadingApiOrders(true);
    try {
      console.log('[useMyOrders] Loading orders from API for buyer:', user.username);
      
      const result = await ordersService.getOrders({ buyer: user.username });
      
      if (result.success && result.data) {
        const sanitizedOrders = result.data
          .map(order => sanitizeOrder(order))
          .filter((order): order is Order => order !== null);
        
        console.log('[useMyOrders] Loaded', sanitizedOrders.length, 'orders from API');
        setApiOrders(sanitizedOrders);
        setErrors([]);
      } else {
        console.warn('[useMyOrders] Failed to load orders:', result.error);
        setErrors([result.error?.message || 'Failed to load orders']);
      }
    } catch (error) {
      console.error('[useMyOrders] Error loading orders:', error);
      setErrors(['Failed to load orders from server']);
    } finally {
      setIsLoadingApiOrders(false);
    }
  }, [user?.username, isLoadingApiOrders]);
  
  // 🔧 NEW: Load orders on mount and when user changes
  useEffect(() => {
    if (user?.username) {
      loadOrdersFromApi();
    }
  }, [user?.username, loadOrdersFromApi]);

  // 🔧 ENHANCED: Combine wallet context orders with API orders, prioritizing API
  const orderHistory = useMemo(() => {
    // If we have API orders, use those. Otherwise fall back to wallet context orders.
    const rawOrders = apiOrders.length > 0 ? apiOrders : (walletContext?.orderHistory || []);
    const validOrders: Order[] = [];
    const invalidCount = { count: 0 };
    
    rawOrders.forEach(order => {
      const sanitized = sanitizeOrder(order);
      if (sanitized) {
        validOrders.push(sanitized as Order);
      } else {
        invalidCount.count++;
      }
    });
    
    if (invalidCount.count > 0) {
      console.warn(`${invalidCount.count} invalid orders filtered out`);
    }
    
    return validOrders;
  }, [apiOrders, walletContext?.orderHistory]);

  // 🔧 ENHANCED: Update order address via API
  const updateOrderAddress = useCallback(async (orderId: string, address: DeliveryAddress) => {
    if (!orderId || !address) {
      console.error('[useMyOrders] Invalid order ID or address');
      return;
    }
    
    try {
      console.log('[useMyOrders] Updating order address via API:', { orderId, address });
      
      const success = await ordersService.updateOrderAddress(orderId, address);
      
      if (success) {
        // Reload orders to get updated data
        await loadOrdersFromApi();
        setErrors([]);
      } else {
        setErrors(['Failed to update delivery address']);
      }
    } catch (error) {
      console.error('[useMyOrders] Error updating order address:', error);
      setErrors(['Failed to update address']);
    }
  }, [loadOrdersFromApi]);

  // Sanitized search query setter
  const handleSearchQueryChange = useCallback((query: string) => {
    const sanitized = sanitizeSearchQuery(query);
    setSearchQuery(sanitized);
  }, []);

  // Filter and sort orders with validation
  const userOrders = useMemo(() => {
    if (!user?.username) return [];
    
    let filtered = orderHistory.filter(order => order.buyer === user.username);
    
    // Apply search filter with sanitized query
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.title.toLowerCase().includes(lowerQuery) ||
        order.seller.toLowerCase().includes(lowerQuery) ||
        order.description.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => {
        if (filterStatus === 'pending') {
          // Include both 'pending' and 'pending-auction' when filtering for pending
          return order.shippingStatus === 'pending' || 
                 order.shippingStatus === 'pending-auction' || 
                 !order.shippingStatus;
        }
        return order.shippingStatus === filterStatus;
      });
    }
    
    // Sort orders with validation
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          try {
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
          } catch {
            aValue = 0;
            bValue = 0;
          }
          break;
        case 'price':
          aValue = a.markedUpPrice || a.price;
          bValue = b.markedUpPrice || b.price;
          break;
        case 'status':
          const statusOrder: Record<string, number> = { 
            'pending': 0,
            'pending-auction': 1,
            'processing': 2,
            'shipped': 3,
            'delivered': 4
          };
          aValue = statusOrder[a.shippingStatus || 'pending'] || 0;
          bValue = statusOrder[b.shippingStatus || 'pending'] || 0;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [user?.username, orderHistory, searchQuery, filterStatus, sortBy, sortOrder]);

  // Separate orders by type with safe filtering
  const directOrders = useMemo(() => 
    userOrders.filter(order => !order.wasAuction && !order.isCustomRequest),
    [userOrders]
  );
  
  const customRequestOrders = useMemo(() => 
    userOrders.filter(order => Boolean(order.isCustomRequest)),
    [userOrders]
  );
  
  const auctionOrders = useMemo(() => 
    userOrders.filter(order => Boolean(order.wasAuction)),
    [userOrders]
  );

  // Calculate stats with validation
  const stats: OrderStats = useMemo(() => {
    const totalSpent = userOrders.reduce((sum, order) => {
      const price = order.markedUpPrice || order.price;
      // Validate price is a positive number
      if (typeof price === 'number' && price > 0 && price <= 10000) {
        return sum + price;
      }
      return sum;
    }, 0);

    return {
      totalSpent: Math.max(0, totalSpent),
      pendingOrders: Math.max(0, userOrders.filter(order => 
        !order.shippingStatus || 
        order.shippingStatus === 'pending' || 
        order.shippingStatus === 'pending-auction'
      ).length),
      shippedOrders: Math.max(0, userOrders.filter(order => order.shippingStatus === 'shipped').length),
    };
  }, [userOrders]);

  // Handlers
  const handleOpenAddressModal = useCallback((orderId: string) => {
    // Validate order exists
    const orderExists = orderHistory.some(order => order.id === orderId);
    if (!orderExists) {
      setErrors(['Invalid order selected']);
      return;
    }
    
    setSelectedOrder(orderId);
    setAddressModalOpen(true);
  }, [orderHistory]);

  const handleConfirmAddress = useCallback(async (address: DeliveryAddress) => {
    if (!selectedOrder) {
      setErrors(['No order selected']);
      return;
    }
    
    // Validate address data
    if (!address || typeof address !== 'object') {
      setErrors(['Invalid address data']);
      return;
    }
    
    try {
      await updateOrderAddress(selectedOrder, address);
      setAddressModalOpen(false);
      setSelectedOrder(null);
      setErrors([]);
    } catch (error) {
      console.error('Error updating address:', error);
      setErrors(['Failed to update address']);
    }
  }, [selectedOrder, updateOrderAddress]);

  const getSelectedOrderAddress = useCallback((): DeliveryAddress | null => {
    if (!selectedOrder) return null;
    
    const order = orderHistory.find(order => order.id === selectedOrder);
    if (!order?.deliveryAddress) return null;
    
    // Return the delivery address as-is since we don't know its exact structure
    // The DeliveryAddress type should handle its own validation
    return order.deliveryAddress;
  }, [selectedOrder, orderHistory]);

  const toggleSort = useCallback((field: 'date' | 'price' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // Safe expanded order toggle - now accepts string | null
  const handleToggleExpanded = useCallback((orderId: string | null) => {
    if (orderId === null) {
      setExpandedOrder(null);
      return;
    }
    
    // Validate order exists
    const orderExists = orderHistory.some(order => order.id === orderId);
    if (!orderExists) {
      setErrors(['Invalid order']);
      return;
    }
    
    setExpandedOrder(prev => prev === orderId ? null : orderId);
  }, [orderHistory]);

  // Safe filter status setter
  const handleFilterStatusChange = useCallback((status: 'all' | 'pending' | 'processing' | 'shipped') => {
    const validStatuses = ['all', 'pending', 'processing', 'shipped'];
    if (validStatuses.includes(status)) {
      setFilterStatus(status);
    }
  }, []);

  // 🔧 NEW: Refresh orders from API
  const refreshOrders = useCallback(async () => {
    await loadOrdersFromApi();
  }, [loadOrdersFromApi]);

  return {
    // Data
    user,
    users,
    userOrders,
    directOrders,
    customRequestOrders,
    auctionOrders,
    stats,
    
    // Loading state
    isLoadingApiOrders,
    
    // UI State
    searchQuery,
    setSearchQuery: handleSearchQueryChange,
    sortBy,
    setSortBy,
    sortOrder,
    filterStatus,
    setFilterStatus: handleFilterStatusChange,
    expandedOrder,
    setExpandedOrder: handleToggleExpanded,
    addressModalOpen,
    setAddressModalOpen,
    selectedOrder,
    errors,
    
    // Handlers
    handleOpenAddressModal,
    handleConfirmAddress,
    toggleSort,
    getSelectedOrderAddress,
    refreshOrders,
  };
}
