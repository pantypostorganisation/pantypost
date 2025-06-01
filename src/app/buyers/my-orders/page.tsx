// src/app/buyers/my-orders/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useWallet } from '@/context/WalletContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import Link from 'next/link';
import AddressConfirmationModal, { DeliveryAddress } from '@/components/AddressConfirmationModal';
import { 
  User, 
  Award, 
  Gavel, 
  MapPin, 
  Truck, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  Star,
  MessageCircle,
  DollarSign,
  Calendar,
  Tag,
  Filter,
  ArrowUpDown,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShoppingBag,
  Search
} from 'lucide-react';

export default function MyOrdersPage() {
  const { orderHistory, updateOrderAddress } = useWallet();
  const { user, users } = useListings();
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
  const auctionOrders = userOrders.filter(order => order.wasAuction);
  const customRequestOrders = userOrders.filter(order => order.isCustomRequest);
  const directOrders = userOrders.filter(order => !order.wasAuction && !order.isCustomRequest);

  const handleOpenAddressModal = (orderId: string) => {
    setSelectedOrder(orderId);
    setAddressModalOpen(true);
  };

  const handleConfirmAddress = (address: DeliveryAddress) => {
    if (selectedOrder) {
      updateOrderAddress(selectedOrder, address);
    }
    setAddressModalOpen(false);
    setSelectedOrder(null);
  };

  const getSelectedOrderAddress = (): DeliveryAddress | null => {
    if (!selectedOrder) return null;
    
    const order = orderHistory.find(order => order.id === selectedOrder);
    return order?.deliveryAddress || null;
  };

  const getShippingStatusBadge = (status?: string) => {
    if (!status || status === 'pending') {
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Awaiting Shipment
        </div>
      );
    } else if (status === 'processing') {
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
          <Package className="w-3 h-3 mr-1" />
          Preparing
        </div>
      );
    } else if (status === 'shipped') {
      return (
        <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/30">
          <Truck className="w-3 h-3 mr-1" />
          Shipped
        </div>
      );
    }
  };

  const toggleSort = (field: 'date' | 'price' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderOrderCard = (order: any, type: 'auction' | 'direct' | 'custom') => {
    const isAuction = type === 'auction';
    const isCustom = type === 'custom';
    const isExpanded = expandedOrder === order.id;
    
    // Get seller info from users context
    const sellerUser = users?.[order.seller ?? ''];
    const isSellerVerified = sellerUser?.verified || sellerUser?.verificationStatus === 'verified';
    const sellerProfilePic = sessionStorage.getItem(`profile_pic_${order.seller}`);
    const hasDeliveryAddress = !!order.deliveryAddress;
    
    let borderStyle = 'border-gray-700 hover:border-[#ff950e]/50';
    let gradientStyle = 'from-gray-900/50 via-black/30 to-gray-800/50';
    let badgeContent = null;
    let accentColor = '#ff950e';
    
    if (isAuction) {
      borderStyle = 'border-purple-500/30 hover:border-purple-400/50';
      gradientStyle = 'from-purple-900/10 via-gray-900/50 to-blue-900/10';
      accentColor = '#a855f7';
      badgeContent = (
        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-purple-400 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg flex items-center">
          <Gavel className="w-3 h-3 mr-1" />
          Auction
        </span>
      );
    } else if (isCustom) {
      borderStyle = 'border-blue-500/30 hover:border-blue-400/50';
      gradientStyle = 'from-blue-900/10 via-gray-900/50 to-cyan-900/10';
      accentColor = '#3b82f6';
      badgeContent = (
        <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg flex items-center">
          <Settings className="w-3 h-3 mr-1" />
          Custom
        </span>
      );
    }

    return (
      <div
        key={`${order.id}-${order.date}`}
        className={`relative border rounded-2xl bg-gradient-to-br overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${gradientStyle} ${borderStyle}`}
      >
        {/* Order Header */}
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Product Image or Custom Request Icon */}
            <div className="relative">
              {isCustom ? (
                // Custom request gets a special icon instead of image
                <div className="w-24 h-24 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl border-2 border-blue-500/30 flex items-center justify-center shadow-lg">
                  <Settings className="w-10 h-10 text-blue-400" />
                </div>
              ) : (
                // Regular orders show actual product images
                <img
                  src={order.imageUrl || '/default-image.jpg'}
                  alt={order.title}
                  className="w-24 h-24 object-cover rounded-xl border-2 border-gray-600 shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-image.jpg';
                  }}
                />
              )}
              {badgeContent}
            </div>

            {/* Order Details - Takes up most space */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-xl text-white truncate">{order.title}</h3>
                  {isAuction && <Star className="w-5 h-5 text-purple-400 flex-shrink-0" />}
                  {isCustom && <Settings className="w-5 h-5 text-blue-400 flex-shrink-0" />}
                </div>
                
                {/* Total Paid - Top Right */}
                <div className="bg-[#ff950e]/10 border border-[#ff950e]/30 rounded-lg px-3 py-2 ml-4">
                  <div className="text-xs text-[#ff950e]/80 font-medium text-center">Total Paid</div>
                  <div className="text-[#ff950e] font-bold text-lg text-center">
                    ${(order.markedUpPrice || order.price).toFixed(2)}
                  </div>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">{order.description}</p>
              
              {/* Order Meta Info */}
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(order.date)}</span>
                </div>
                
                {order.tags && order.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {order.tags.slice(0, 2).join(', ')}
                      {order.tags.length > 2 && '...'}
                    </span>
                  </div>
                )}
              </div>

              {/* Order Type Specific Information */}
              {isAuction && (
                <div className="bg-purple-900/30 p-3 rounded-lg mb-4 border border-purple-700/50">
                  <p className="text-sm font-semibold text-purple-300 mb-1">
                    🏆 Winning bid: ${order.finalBid?.toFixed(2) || order.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-400/80">
                    Auction won on {formatDate(order.date)}
                  </p>
                </div>
              )}

              {isCustom && (
                <div className="bg-blue-900/30 p-3 rounded-lg mb-4 border border-blue-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-blue-400" />
                    <p className="text-sm font-semibold text-blue-300">Custom Request Order</p>
                  </div>
                  <p className="text-xs text-blue-400/80">
                    Fulfilled on {formatDate(order.date)}
                  </p>
                  {order.originalRequestId && (
                    <p className="text-xs text-blue-400 mt-1 font-mono">
                      ID: {order.originalRequestId.slice(0, 8)}...
                    </p>
                  )}
                </div>
              )}

              {/* Bottom Row - Status and Actions spread across */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left side - Status indicators */}
                <div className="flex flex-wrap items-center gap-3">
                  {getShippingStatusBadge(order.shippingStatus)}
                  
                  {hasDeliveryAddress ? (
                    <div className="flex items-center gap-2 bg-green-900/30 px-3 py-1.5 rounded-lg border border-green-700/50">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-300 text-xs font-medium">Address confirmed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenAddressModal(order.id)}
                      className="flex items-center gap-2 bg-yellow-900/30 hover:bg-yellow-800/50 px-3 py-1.5 rounded-lg border border-yellow-700/50 hover:border-yellow-600 text-yellow-300 hover:text-yellow-200 transition-all text-xs font-medium"
                    >
                      <MapPin className="w-4 h-4" />
                      Add Address
                    </button>
                  )}
                </div>
                
                {/* Right side - Action button */}
                <button
                  className="flex items-center gap-2 text-[#ff950e] bg-[#ff950e]/10 hover:bg-[#ff950e]/20 border border-[#ff950e]/30 hover:border-[#ff950e]/50 font-semibold px-4 py-2 rounded-lg transition-all text-sm"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      View Details
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-700 bg-black/20 p-6">
            {/* Seller Info */}
            <div className="flex items-center justify-between mb-6">
              <Link
                href={`/sellers/${order.seller}`}
                className="flex items-center gap-3 text-white hover:text-[#ff950e] group transition-colors"
              >
                {sellerProfilePic ? (
                  <img
                    src={sellerProfilePic}
                    alt={order.seller}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-600 group-hover:border-[#ff950e] transition-colors"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold border-2 border-gray-600 group-hover:border-[#ff950e] transition-colors">
                    {order.seller ? order.seller.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{order.seller}</p>
                  <p className="text-xs text-gray-400">View seller profile</p>
                </div>
                
                {isSellerVerified && (
                  <div className="ml-2">
                    <img src="/verification_badge.png" alt="Verified" className="w-5 h-5" />
                  </div>
                )}
                
                <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link
                href={`/buyers/messages?thread=${order.seller}`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg transition-all shadow-lg"
              >
                <MessageCircle className="w-4 h-4" />
                Message Seller
              </Link>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-[#ff950e]" />
                Payment Details
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Item Price:</span>
                  <span className="text-white font-semibold">${order.price.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Platform Fee (10%):</span>
                  <span className="text-gray-300">${((order.markedUpPrice || order.price) - order.price).toFixed(2)}</span>
                </div>
                
                {order.tierCreditAmount && order.tierCreditAmount > 0 && (
                  <div className="flex justify-between items-center text-green-400">
                    <span>Seller Tier Bonus:</span>
                    <span>+${order.tierCreditAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total Paid:</span>
                    <span className="text-[#ff950e] font-bold text-lg">
                      ${(order.markedUpPrice || order.price).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Request Tags */}
            {isCustom && order.tags && order.tags.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-white mb-2 flex items-center">
                  <Tag className="w-4 h-4 mr-2 text-blue-400" />
                  Request Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {order.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-blue-900/30 text-blue-200 text-xs px-3 py-1 rounded-full border border-blue-700/50"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const OrderStats = () => {
    const totalSpent = userOrders.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);
    const pendingOrders = userOrders.filter(order => !order.shippingStatus || order.shippingStatus === 'pending').length;
    const shippedOrders = userOrders.filter(order => order.shippingStatus === 'shipped').length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-[#ff950e]/10 to-[#ff6b00]/10 p-6 rounded-xl border border-[#ff950e]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#ff950e] text-sm font-medium">Total Spent</p>
              <p className="text-white text-2xl font-bold">${totalSpent.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-[#ff950e] drop-shadow-lg drop-shadow-[#ff950e]/50" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 p-6 rounded-xl border border-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-300 text-sm font-medium">Pending Orders</p>
              <p className="text-white text-2xl font-bold">{pendingOrders}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400 drop-shadow-lg drop-shadow-yellow-400/50" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6 rounded-xl border border-green-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-300 text-sm font-medium">Shipped Orders</p>
              <p className="text-white text-2xl font-bold">{shippedOrders}</p>
            </div>
            <Truck className="w-8 h-8 text-green-400 drop-shadow-lg drop-shadow-green-400/50" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <BanCheck>
      <RequireAuth role="buyer">
        <main className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 p-4 md:p-10">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center mb-4">
                <ShoppingBag className="w-8 h-8 mr-3 text-[#ff950e] drop-shadow-lg drop-shadow-[#ff950e]/50" />
                My Orders
              </h1>
              <p className="text-gray-300 text-lg">
                Track your purchases, manage delivery addresses, and stay updated on order status.
              </p>
            </div>

            {/* Order Statistics */}
            <OrderStats />

            {/* Filters and Search */}
            <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:border-transparent focus:shadow-lg focus:shadow-[#ff950e]/20"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e] focus:shadow-lg focus:shadow-[#ff950e]/20"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                  </select>
                  
                  <button
                    onClick={() => toggleSort('date')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      sortBy === 'date' ? 'bg-[#ff950e] text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    Date
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                  
                  <button
                    onClick={() => toggleSort('price')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                      sortBy === 'price' ? 'bg-[#ff950e] text-black' : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    Price
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Purchases - TOP PRIORITY */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
                <div className="bg-gradient-to-r from-[#ff950e] to-[#e0850d] p-2 rounded-lg mr-3 shadow-lg">
                  <ShoppingBag className="w-6 h-6 text-black" />
                </div>
                Direct Purchases ({directOrders.length})
              </h2>
              {directOrders.length === 0 ? (
                <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-700">
                  <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-xl mb-2">No direct purchases yet</p>
                  <p className="text-gray-500">Items you buy directly from the browse page will appear here</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {directOrders.map((order) => renderOrderCard(order, 'direct'))}
                </div>
              )}
            </section>

            {/* Custom Request Orders Section - SECOND */}
            {customRequestOrders.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-2 rounded-lg mr-3 shadow-lg">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  Custom Request Orders ({customRequestOrders.length})
                </h2>
                <div className="space-y-6">
                  {customRequestOrders.map((order) => renderOrderCard(order, 'custom'))}
                </div>
              </section>
            )}

            {/* Auction Purchases Section - LAST */}
            {auctionOrders.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center text-white">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-2 rounded-lg mr-3 shadow-lg">
                    <Gavel className="w-6 h-6 text-white" />
                  </div>
                  Auction Purchases ({auctionOrders.length})
                </h2>
                <div className="space-y-6">
                  {auctionOrders.map((order) => renderOrderCard(order, 'auction'))}
                </div>
              </section>
            )}

            {/* No orders message */}
            {userOrders.length === 0 && (
              <div className="text-center py-20 bg-gray-900/30 rounded-2xl border border-gray-700">
                <Package className="w-24 h-24 text-gray-600 mx-auto mb-8" />
                <h3 className="text-2xl font-bold text-gray-400 mb-4">No orders yet</h3>
                <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
                  Your purchases from direct sales, auctions, and custom requests will appear here once you start shopping.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] text-black font-bold px-8 py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105"
                  >
                    <Package className="w-5 h-5" />
                    Browse Listings
                  </Link>
                  <Link
                    href="/buyers/messages"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-xl"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Send Custom Requests
                  </Link>
                </div>
              </div>
            )}

            {/* Address Confirmation Modal */}
            <AddressConfirmationModal
              isOpen={addressModalOpen}
              onClose={() => {
                setAddressModalOpen(false);
                setSelectedOrder(null);
              }}
              onConfirm={handleConfirmAddress}
              existingAddress={getSelectedOrderAddress()}
              orderId={selectedOrder || ''}
            />
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}
