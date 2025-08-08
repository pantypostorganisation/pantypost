// src/hooks/useMyOrders.ts

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ordersService } from '@/services/orders.service';
import type { Order } from '@/types/order';
import { useListings } from '@/context/ListingContext';
import type { DeliveryAddress } from '@/types/order';
import { sanitizeStrict, sanitizeSearchQuery, sanitizeNumber } from '@/utils/security/sanitization';
import { z } from 'zod';

// ✅ FIXED: Updated validation schema to match backend response format
const OrderSchema = z.object({
  // Backend uses _id (MongoDB) or id, so handle both
  _id: z.string().optional(),
  id: z.string().optional(),
  title: z.string(),
  description: z.string(),
  price: z.number().positive(),
  markedUpPrice: z.number().positive().optional(),
  // ✅ FIXED: Backend returns imageUrl (string), not imageUrls (array)
  imageUrl: z.string().optional(),
  seller: z.string(),
  buyer: z.string(),
  date: z.string(),
  shippingStatus: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  wasAuction: z.boolean().optional(),
  deliveryAddress: z.object({
    fullName: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string()
  }).optional(),
  listingId: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippedDate: z.string().optional(),
  deliveredDate: z.string().optional(),
  tags: z.array(z.string()).optional(),
  finalBid: z.number().optional(),
  tierCreditAmount: z.number().optional(),
  platformFee: z.number().optional(),
  sellerEarnings: z.number().optional(),
  paymentStatus: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  paymentCompletedAt: z.string().optional(),
}).transform((data) => ({
  // ✅ CRITICAL: Ensure we always have an id field
  id: data.id || data._id || `order-${Date.now()}-${Math.random()}`,
  title: data.title,
  description: data.description,
  price: data.price,
  markedUpPrice: data.markedUpPrice || data.price,
  imageUrl: data.imageUrl || '',
  seller: data.seller,
  buyer: data.buyer,
  date: data.date,
  shippingStatus: data.shippingStatus || 'pending',
  wasAuction: data.wasAuction || false,
  deliveryAddress: data.deliveryAddress,
  listingId: data.listingId,
  trackingNumber: data.trackingNumber,
  shippedDate: data.shippedDate,
  deliveredDate: data.deliveredDate,
  tags: data.tags || [],
  finalBid: data.finalBid,
  tierCreditAmount: data.tierCreditAmount,
  platformFee: data.platformFee,
  sellerEarnings: data.sellerEarnings,
  paymentStatus: data.paymentStatus,
  paymentCompletedAt: data.paymentCompletedAt,
}));

type ValidatedOrder = z.infer<typeof OrderSchema>;

export interface OrderStats {
  totalSpent: number;
  pendingOrders: number;
  shippedOrders: number;
}

// ✅ IMPROVED: Better error handling in sanitization
function sanitizeOrder(order: any): ValidatedOrder | null {
  try {
    console.log('[useMyOrders] Sanitizing order:', order);
    
    // ✅ FIXED: Add required defaults for missing fields
    const orderWithDefaults = {
      ...order,
      // Ensure we have an ID from either _id or id field
      id: order.id || order._id || `order-${Date.now()}-${Math.random()}`,
      description: order.description || order.title || 'No description available',
      shippingStatus: order.shippingStatus || 'pending',
      date: order.date || order.createdAt || new Date().toISOString(),
    };
    
    // Validate order structure
    const validated = OrderSchema.parse(orderWithDefaults);
    
    // ✅ FIXED: Type-safe sanitization that preserves the correct types
    const sanitizedMarkedUpPrice = validated.markedUpPrice 
      ? sanitizeNumber(validated.markedUpPrice, 0.01, 100000) 
      : validated.markedUpPrice; // This keeps it as undefined if it was undefined

    // ✅ ADDITIONAL: Sanitize string fields
    return {
      ...validated,
      title: sanitizeStrict(validated.title),
      description: sanitizeStrict(validated.description),
      seller: sanitizeStrict(validated.seller),
      buyer: sanitizeStrict(validated.buyer),
      price: sanitizeNumber(validated.price, 0.01, 100000),
      markedUpPrice: sanitizedMarkedUpPrice,
      trackingNumber: validated.trackingNumber ? sanitizeStrict(validated.trackingNumber) : undefined,
    };
  } catch (error) {
    console.error('[useMyOrders] Invalid order data:', error);
    console.error('[useMyOrders] Raw order data that failed:', order);
    return null;
  }
}

export function useMyOrders() {
  const { user } = useAuth();
  const { users } = useListings();
  
  // ✅ SIMPLIFIED: Single source of truth for orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  // UI State
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'shipped'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // ✅ PRIMARY: Load orders from API only
  const loadOrders = useCallback(async () => {
    if (!user?.username || isLoading) return;
    
    setIsLoading(true);
    setErrors([]);
    
    try {
      console.log('[useMyOrders] Loading orders from API for buyer:', user.username);
      
      const result = await ordersService.getOrders({ buyer: user.username });
      
      console.log('[useMyOrders] API response:', result);
      
      if (result.success && result.data) {
        console.log('[useMyOrders] Raw orders from API:', result.data);
        
        // ✅ CRITICAL: Sanitize each order and filter out invalid ones
        const validOrders: Order[] = [];
        const invalidOrders: any[] = [];
        
        result.data.forEach((rawOrder, index) => {
          const sanitized = sanitizeOrder(rawOrder);
          if (sanitized) {
            validOrders.push(sanitized as Order);
          } else {
            invalidOrders.push(rawOrder);
            console.warn(`[useMyOrders] Order ${index} failed validation:`, rawOrder);
          }
        });
        
        console.log('[useMyOrders] Successfully validated', validOrders.length, 'orders');
        if (invalidOrders.length > 0) {
          console.warn('[useMyOrders]', invalidOrders.length, 'orders failed validation');
        }
        
        setOrders(validOrders);
        setErrors([]);
      } else {
        console.error('[useMyOrders] Failed to load orders:', result.error);
        setErrors([result.error?.message || 'Failed to load orders from server']);
        setOrders([]);
      }
    } catch (error) {
      console.error('[useMyOrders] Error loading orders:', error);
      setErrors(['Failed to load orders from server']);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.username, isLoading]);
  
  // ✅ AUTOMATIC: Load orders on mount and when user changes
  useEffect(() => {
    if (user?.username) {
      loadOrders();
    } else {
      setOrders([]);
      setErrors([]);
    }
  }, [user?.username, loadOrders]);

  // ✅ SIMPLIFIED: Use single orders array
  const orderHistory = useMemo(() => orders, [orders]);

  // ✅ IMPROVED: Update order address via API
  const updateOrderAddress = useCallback(async (orderId: string, address: DeliveryAddress) => {
    if (!orderId || !address) {
      console.error('[useMyOrders] Invalid order ID or address');
      setErrors(['Invalid order ID or address']);
      return;
    }
    
    try {
      console.log('[useMyOrders] Updating order address via API:', { orderId, address });
      
      const success = await ordersService.updateOrderAddress(orderId, address);
      
      if (success) {
        // Reload orders to get updated data
        await loadOrders();
        setErrors([]);
        console.log('[useMyOrders] Address updated successfully');
      } else {
        console.error('[useMyOrders] Failed to update address');
        setErrors(['Failed to update delivery address']);
      }
    } catch (error) {
      console.error('[useMyOrders] Error updating order address:', error);
      setErrors(['Failed to update address - please try again']);
    }
  }, [loadOrders]);

  // Sanitized search query setter
  const handleSearchQueryChange = useCallback((query: string) => {
    const sanitized = sanitizeSearchQuery(query);
    setSearchQuery(sanitized);
  }, []);

  // ✅ ENHANCED: Filter and sort orders
  const userOrders = useMemo(() => {
    if (!user?.username) return [];
    
    let filtered = orderHistory.filter(order => order.buyer === user.username);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.title.toLowerCase().includes(lowerQuery) ||
        order.seller.toLowerCase().includes(lowerQuery) ||
        order.description.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => {
        const status = order.shippingStatus || 'pending';
        
        if (filterStatus === 'pending') {
          return status === 'pending' || status === 'pending-auction';
        }
        return status === filterStatus;
      });
    }
    
    // Sort orders
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
          aValue = a.markedUpPrice || a.price || 0;
          bValue = b.markedUpPrice || b.price || 0;
          break;
        case 'status':
          const statusOrder: Record<string, number> = { 
            'pending': 0,
            'processing': 1,
            'shipped': 2,
            'delivered': 3,
            'cancelled': 4
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

  // ✅ ENHANCED: Separate orders by type
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

  // ✅ IMPROVED: Calculate stats with proper validation
  const stats: OrderStats = useMemo(() => {
    const totalSpent = userOrders.reduce((sum, order) => {
      const price = order.markedUpPrice || order.price || 0;
      if (typeof price === 'number' && price > 0) {
        return sum + price;
      }
      return sum;
    }, 0);

    const pendingCount = userOrders.filter(order => {
      const status = order.shippingStatus || 'pending';
      return status === 'pending' || status === 'processing';
    }).length;

    const shippedCount = userOrders.filter(order => 
      order.shippingStatus === 'shipped'
    ).length;

    return {
      totalSpent: Math.max(0, totalSpent),
      pendingOrders: Math.max(0, pendingCount),
      shippedOrders: Math.max(0, shippedCount),
    };
  }, [userOrders]);

  // ✅ ENHANCED: Event handlers with proper validation
  const handleOpenAddressModal = useCallback((orderId: string) => {
    const orderExists = orderHistory.some(order => order.id === orderId);
    if (!orderExists) {
      setErrors(['Invalid order selected']);
      return;
    }
    
    setSelectedOrder(orderId);
    setAddressModalOpen(true);
    setErrors([]);
  }, [orderHistory]);

  const handleConfirmAddress = useCallback(async (address: DeliveryAddress) => {
    if (!selectedOrder) {
      setErrors(['No order selected']);
      return;
    }
    
    if (!address || typeof address !== 'object' || !address.fullName || !address.addressLine1) {
      setErrors(['Please fill in all required address fields']);
      return;
    }
    
    try {
      await updateOrderAddress(selectedOrder, address);
      setAddressModalOpen(false);
      setSelectedOrder(null);
      setErrors([]);
    } catch (error) {
      console.error('[useMyOrders] Error updating address:', error);
    }
  }, [selectedOrder, updateOrderAddress]);

  const getSelectedOrderAddress = useCallback((): DeliveryAddress | null => {
    if (!selectedOrder) return null;
    
    const order = orderHistory.find(order => order.id === selectedOrder);
    return order?.deliveryAddress || null;
  }, [selectedOrder, orderHistory]);

  const toggleSort = useCallback((field: 'date' | 'price' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  const handleToggleExpanded = useCallback((orderId: string | null) => {
    if (orderId === null) {
      setExpandedOrder(null);
      return;
    }
    
    const orderExists = orderHistory.some(order => order.id === orderId);
    if (!orderExists) {
      setErrors(['Invalid order']);
      return;
    }
    
    setExpandedOrder(prev => prev === orderId ? null : orderId);
    setErrors([]);
  }, [orderHistory]);

  const handleFilterStatusChange = useCallback((status: 'all' | 'pending' | 'processing' | 'shipped') => {
    const validStatuses = ['all', 'pending', 'processing', 'shipped'];
    if (validStatuses.includes(status)) {
      setFilterStatus(status);
      setErrors([]);
    }
  }, []);

  // ✅ PUBLIC: Refresh method
  const refreshOrders = useCallback(async () => {
    console.log('[useMyOrders] Manual refresh requested');
    await loadOrders();
  }, [loadOrders]);

  // ✅ PUBLIC: Clear errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    // Data
    user,
    users,
    userOrders,
    directOrders,
    customRequestOrders,
    auctionOrders,
    stats,
    
    // Loading and error state
    isLoading,
    errors,
    
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
    
    // Actions
    handleOpenAddressModal,
    handleConfirmAddress,
    toggleSort,
    getSelectedOrderAddress,
    refreshOrders,
    clearErrors,
  };
}
