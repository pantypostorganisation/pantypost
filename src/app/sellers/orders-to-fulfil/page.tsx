// src/app/sellers/orders-to-fulfil/page.tsx
'use client';

import { useListings } from '@/context/ListingContext';
import { useRequests } from '@/context/RequestContext';
import { useWallet } from '@/context/WalletContext';
import RequireAuth from '@/components/RequireAuth';
import { useEffect, useState } from 'react';
import { 
  Gavel, 
  ShoppingBag, 
  PenLine, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  Truck, 
  Package, 
  AlertTriangle, 
  Copy, 
  Check,
  FileText,
  ShieldAlert,
  Box
} from 'lucide-react';
import { DeliveryAddress } from '@/components/AddressConfirmationModal';

export default function OrdersToFulfilPage() {
  const { user } = useListings();
  const { getRequestsForUser } = useRequests();
  const { orderHistory, updateShippingStatus } = useWallet();

  const [orders, setOrders] = useState<any[]>([]);
  const [auctionOrders, setAuctionOrders] = useState<any[]>([]);
  const [customOrders, setCustomOrders] = useState<any[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Get all accepted custom requests for this seller
    const requests = getRequestsForUser(user.username, 'seller');
    const acceptedCustoms = requests.filter((req) => req.status === 'accepted');

    setCustomOrders(acceptedCustoms);

    // 2. Get all direct sales and auction sales for this seller
    const allSales = orderHistory.filter((order) => order.seller === user.username);
    
    // Separate direct sales from auction sales
    const directSales = allSales.filter(order => !order.wasAuction);
    const auctionSales = allSales.filter(order => order.wasAuction);

    setOrders(directSales);
    setAuctionOrders(auctionSales);
    
  }, [user, getRequestsForUser, orderHistory]);

  const toggleExpand = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
    }
  };

  const handleCopyAddress = async (address: DeliveryAddress) => {
    const formattedAddress = formatAddressForCopy(address);
    
    try {
      await navigator.clipboard.writeText(formattedAddress);
      setCopiedText('address');
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatAddressForCopy = (address: DeliveryAddress): string => {
    const lines = [
      address.fullName,
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country,
    ].filter(Boolean);
    
    return lines.join('\n');
  };

  const handleStatusChange = (orderId: string, status: 'pending' | 'processing' | 'shipped') => {
    updateShippingStatus(orderId, status);
  };

  const renderAddressBlock = (order: any) => {
    if (!order.deliveryAddress) {
      return (
        <div className="mt-4 py-3 px-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-700 font-medium text-sm">Waiting for delivery address</p>
            <p className="text-xs text-yellow-600 mt-1">
              The buyer hasn't provided their shipping address yet.
            </p>
          </div>
        </div>
      );
    }

    const address = order.deliveryAddress;
    return (
      <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-gray-700 mr-1.5" />
            <h4 className="font-medium text-gray-800 text-sm">Shipping Address</h4>
          </div>
          <button 
            onClick={() => handleCopyAddress(address)}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium flex items-center p-2 rounded-md transition-colors"
          >
            {copiedText === 'address' ? (
              <Check className="w-4 h-4 mr-1" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            {copiedText === 'address' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="p-4 bg-white">
          <div className="font-semibold text-base text-gray-900">{address.fullName}</div>
          <div className="text-gray-900 text-base">{address.addressLine1}</div>
          {address.addressLine2 && <div className="text-gray-900 text-base">{address.addressLine2}</div>}
          <div className="text-gray-900 text-base">{address.city}, {address.state} {address.postalCode}</div>
          <div className="text-gray-900 text-base">{address.country}</div>
          {address.specialInstructions && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-sm text-gray-700 font-medium">Special Instructions:</div>
              <p className="text-gray-900 mt-1">{address.specialInstructions}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderShippingControls = (order: any) => {
    if (!order.deliveryAddress) return null;
    
    return (
      <div className="mt-4 border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-gray-800 text-base flex items-center">
            <Truck className="w-4 h-4 mr-1.5 text-gray-600" />
            Shipping Status
          </h4>
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusChange(order.id, 'pending')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                order.shippingStatus === 'pending' || !order.shippingStatus
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => handleStatusChange(order.id, 'processing')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                order.shippingStatus === 'processing'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Processing
            </button>
            <button
              onClick={() => handleStatusChange(order.id, 'shipped')}
              className={`px-4 py-2 rounded text-sm font-medium ${
                order.shippingStatus === 'shipped'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Shipped
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Function to extract the shipping label text that could be printed
  const getShippingLabel = (order: any): string => {
    if (!order.deliveryAddress) return '';

    const address = order.deliveryAddress;
    const lines = [
      address.fullName,
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country,
    ].filter(Boolean);

    return lines.join('\n');
  };

  return (
    <RequireAuth role="seller">
      <main className="p-4 md:p-10 max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 text-white flex items-center">
          <Box className="w-7 h-7 mr-3 text-orange-400" /> 
          Orders to Fulfil
        </h1>

        {/* Auction Sales */}
        {auctionOrders.length > 0 && (
          <section className="mb-8 md:mb-10">
            <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center text-white">
              <Gavel className="w-5 h-5 mr-2 text-purple-400" />
              Auction Sales
            </h2>
            <ul className="space-y-4">
              {auctionOrders.map((order) => (
                <li
                  key={order.id + order.date}
                  className="border rounded-lg bg-gradient-to-r from-purple-50 to-white flex flex-col border-purple-200 overflow-hidden shadow-sm"
                >
                  {/* Order Header (always visible) */}
                  <div 
                    className="p-4 flex flex-col md:flex-row gap-4 items-center cursor-pointer"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <img
                      src={order.imageUrl}
                      alt={order.title}
                      className="w-20 h-20 object-cover rounded-md border border-gray-200"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base md:text-lg text-gray-900">{order.title}</h3>
                        <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full border border-purple-200">
                          Auction
                        </span>
                      </div>
                      <p className="text-sm md:text-base text-gray-700">Buyer: <span className="font-medium">{order.buyer}</span></p>
                      <p className="text-sm md:text-base text-gray-700">Won on: <span className="font-medium">{new Date(order.date).toLocaleDateString()}</span></p>
                      <div className="flex flex-wrap mt-2 gap-x-6">
                        <p className="text-purple-700 font-bold text-sm md:text-base">
                          Winning bid: <span className="text-lg">${order.finalBid?.toFixed(2) || order.price.toFixed(2)}</span>
                        </p>
                        <p className="text-pink-700 font-bold text-sm md:text-base">
                          Total paid: <span className="text-lg">${order.markedUpPrice?.toFixed(2) || (order.price * 1.1).toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={`inline-block px-4 py-2 rounded-md text-sm font-semibold mb-2 ${
                        order.shippingStatus === 'shipped' 
                          ? 'bg-green-500 text-white' 
                          : order.shippingStatus === 'processing'
                            ? 'bg-orange-500 text-white'
                            : 'bg-yellow-500 text-white'
                      }`}>
                        {order.shippingStatus === 'shipped' 
                          ? 'Shipped' 
                          : order.shippingStatus === 'processing'
                            ? 'Processing'
                            : 'Pending Fulfillment'}
                      </span>
                      {order.deliveryAddress ? (
                        <span className="text-sm text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-md">
                          <MapPin className="w-3 h-3 mr-1" />
                          Address provided
                        </span>
                      ) : (
                        <span className="text-sm text-yellow-600 flex items-center bg-yellow-50 px-2 py-1 rounded-md">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          No address yet
                        </span>
                      )}
                      <button
                        className="text-purple-600 hover:text-purple-800 mt-3 text-sm font-medium flex items-center bg-purple-50 px-3 py-1 rounded-md hover:bg-purple-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(order.id);
                        }}
                      >
                        {expandedOrder === order.id ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Show Details
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-purple-100 p-4 bg-white">
                      {renderAddressBlock(order)}
                      {renderShippingControls(order)}

                      {order.deliveryAddress && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-800 text-base flex items-center mb-2">
                            <FileText className="w-4 h-4 mr-1.5 text-gray-600" />
                            Shipping Label
                          </h4>
                          
                          {/* Warning about return address */}
                          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-3 mb-3 flex items-start">
                            <ShieldAlert className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-red-700 font-bold text-sm uppercase tracking-wide">DO NOT WRITE A RETURN ADDRESS ON THE SHIPPING LABEL</p>
                              <p className="text-red-600 text-sm mt-1">
                                For your privacy and safety, never include your personal address on any package.
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-base text-gray-900 whitespace-pre-line">
                            {getShippingLabel(order)}
                          </div>
                          <p className="text-sm text-gray-700 mt-2">
                            This is the exact text you should write on the shipping label.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Direct Sales */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center text-white">
            <ShoppingBag className="w-5 h-5 mr-2 text-pink-400" />
            Direct Sales
          </h2>
          {orders.length === 0 ? (
            <p className="text-gray-300 italic text-base">No direct sales to fulfill yet.</p>
          ) : (
            <ul className="space-y-4">
              {orders.map((order) => (
                <li
                  key={order.id + order.date}
                  className="border rounded-lg bg-white flex flex-col overflow-hidden shadow-sm"
                >
                  {/* Order Header (always visible) */}
                  <div 
                    className="p-4 flex flex-col md:flex-row gap-4 items-center cursor-pointer"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <img
                      src={order.imageUrl}
                      alt={order.title}
                      className="w-20 h-20 object-cover rounded-md border border-gray-200"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-base md:text-lg text-gray-900">{order.title}</h3>
                      <p className="text-sm md:text-base text-gray-700">Buyer: <span className="font-medium">{order.buyer}</span></p>
                      <p className="text-sm md:text-base text-gray-700">Sold on: <span className="font-medium">{new Date(order.date).toLocaleDateString()}</span></p>
                      <p className="text-pink-700 font-bold mt-2 text-base md:text-lg">${order.markedUpPrice?.toFixed(2) ?? order.price.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className={`inline-block px-4 py-2 rounded-md text-sm font-semibold mb-2 ${
                        order.shippingStatus === 'shipped' 
                          ? 'bg-green-500 text-white' 
                          : order.shippingStatus === 'processing'
                            ? 'bg-orange-500 text-white'
                            : 'bg-yellow-500 text-white'
                      }`}>
                        {order.shippingStatus === 'shipped' 
                          ? 'Shipped' 
                          : order.shippingStatus === 'processing'
                            ? 'Processing'
                            : 'Pending Fulfillment'}
                      </span>
                      {order.deliveryAddress ? (
                        <span className="text-sm text-green-600 flex items-center bg-green-50 px-2 py-1 rounded-md">
                          <MapPin className="w-3 h-3 mr-1" />
                          Address provided
                        </span>
                      ) : (
                        <span className="text-sm text-yellow-600 flex items-center bg-yellow-50 px-2 py-1 rounded-md">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          No address yet
                        </span>
                      )}
                      <button
                        className="text-blue-600 hover:text-blue-800 mt-3 text-sm font-medium flex items-center bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(order.id);
                        }}
                      >
                        {expandedOrder === order.id ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Show Details
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-gray-200 p-4 bg-white">
                      {renderAddressBlock(order)}
                      {renderShippingControls(order)}

                      {order.deliveryAddress && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium text-gray-800 text-base flex items-center mb-2">
                            <FileText className="w-4 h-4 mr-1.5 text-gray-600" />
                            Shipping Label
                          </h4>
                          
                          {/* Warning about return address */}
                          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-3 mb-3 flex items-start">
                            <ShieldAlert className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-red-700 font-bold text-sm uppercase tracking-wide">DO NOT WRITE A RETURN ADDRESS ON THE SHIPPING LABEL</p>
                              <p className="text-red-600 text-sm mt-1">
                                For your privacy and safety, never include your personal address on any package.
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 font-mono text-base text-gray-900 whitespace-pre-line">
                            {getShippingLabel(order)}
                          </div>
                          <p className="text-sm text-gray-700 mt-2">
                            This is the exact text you should write on the shipping label.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Accepted Custom Orders */}
        <section>
          <h2 className="text-lg md:text-xl font-semibold mb-4 flex items-center text-white">
            <PenLine className="w-5 h-5 mr-2 text-blue-400" />
            Accepted Custom Orders
          </h2>
          {customOrders.length === 0 ? (
            <p className="text-gray-300 italic text-base">No accepted custom requests to fulfill yet.</p>
          ) : (
            <ul className="space-y-4">
              {customOrders.map((req) => (
                <li
                  key={req.id}
                  className="border rounded-lg p-5 bg-white shadow-sm"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-base md:text-lg text-gray-900">{req.title}</h3>
                    <p className="text-sm md:text-base text-gray-700">Buyer: <span className="font-medium">{req.buyer}</span></p>
                    <p className="text-sm md:text-base text-gray-700">Requested: <span className="font-medium">{new Date(req.date).toLocaleDateString()}</span></p>
                    <p className="text-pink-700 font-bold mt-2 text-base md:text-lg">${req.price.toFixed(2)}</p>
                    {req.tags && req.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {req.tags.map((tag: string, idx: number) => (
                          <span key={idx} className="bg-gray-200 text-gray-700 text-sm px-2 py-0.5 rounded border border-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-gray-900 mt-3 text-base">{req.description}</p>
                    <p className="text-sm bg-yellow-50 text-yellow-700 mt-3 flex items-center p-2 rounded-md border border-yellow-200">
                      <Package className="w-4 h-4 mr-1.5" />
                      <span className="font-semibold">Payment received. Customer waiting for fulfillment.</span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </RequireAuth>
  );
}
