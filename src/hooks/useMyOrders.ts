// src/hooks/useMyOrders.ts
import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import { DeliveryAddress } from '@/components/AddressConfirmationModal';
import { Order } from '@/context/WalletContext';

export interface OrderStats {
  totalSpent: number;
  pendingOrders: number;
  shippedOrders: number;
}

export function useMyOrders() {
  const { user } = useAuth();
  const { orderHistory, updateOrderAddress } = useWallet();
  const { users } = useListings();
  
  // State
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing' | 'shipped'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort orders
  const userOrders = useMemo(() => {
    if (!user?.username) return [];
    
    let filtered = orderHistory.filter(order => order.buyer === user.username);
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.seller.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.shippingStatus === filterStatus);
    }
    
    // Sort orders
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'price':
          aValue = a.markedUpPrice || a.price;
          bValue = b.markedUpPrice || b.price;
          break;
        case 'status':
          aValue = a.shippingStatus || 'pending';
          bValue = b.shippingStatus || 'pending';
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

  // Separate orders by type
  const directOrders = useMemo(() => 
    userOrders.filter(order => !order.wasAuction && !order.isCustomRequest),
    [userOrders]
  );
  
  const customRequestOrders = useMemo(() => 
    userOrders.filter(order => order.isCustomRequest),
    [userOrders]
  );
  
  const auctionOrders = useMemo(() => 
    userOrders.filter(order => order.wasAuction),
    [userOrders]
  );

  // Calculate stats
  const stats: OrderStats = useMemo(() => ({
    totalSpent: userOrders.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0),
    pendingOrders: userOrders.filter(order => !order.shippingStatus || order.shippingStatus === 'pending').length,
    shippedOrders: userOrders.filter(order => order.shippingStatus === 'shipped').length,
  }), [userOrders]);

  // Handlers
  const handleOpenAddressModal = useCallback((orderId: string) => {
    setSelectedOrder(orderId);
    setAddressModalOpen(true);
  }, []);

  const handleConfirmAddress = useCallback((address: DeliveryAddress) => {
    if (selectedOrder) {
      updateOrderAddress(selectedOrder, address);
    }
    setAddressModalOpen(false);
    setSelectedOrder(null);
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

  return {
    // Data
    user,
    users,
    userOrders,
    directOrders,
    customRequestOrders,
    auctionOrders,
    stats,
    
    // UI State
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortOrder,
    filterStatus,
    setFilterStatus,
    expandedOrder,
    setExpandedOrder,
    addressModalOpen,
    setAddressModalOpen,
    selectedOrder,
    
    // Handlers
    handleOpenAddressModal,
    handleConfirmAddress,
    toggleSort,
    getSelectedOrderAddress,
  };
}