// src/components/seller/orders/OrderCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Order } from '@/context/WalletContext';
import {
  User,
  Gavel,
  MapPin,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  Truck,
  AlertTriangle,
  Star,
  Settings,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface OrderCardProps {
  order: Order;
  type: 'auction' | 'direct' | 'custom';
  isExpanded: boolean;
  onToggleExpand: () => void;
  renderAddressBlock: (order: Order) => React.ReactNode;
  renderShippingControls: (order: Order) => React.ReactNode;
  getShippingStatusBadge: (status?: string) => React.ReactNode;
}

export default function OrderCard({
  order,
  type,
  isExpanded,
  onToggleExpand,
  renderAddressBlock,
  renderShippingControls,
  getShippingStatusBadge,
}: OrderCardProps) {
  const isAuction = type === 'auction';
  const isCustom = type === 'custom';

  let borderStyle = 'border-gray-700 hover:border-[#ff950e]/50';
  let gradientStyle = 'from-gray-900/50 via-black/30 to-gray-800/50';
  let badgeContent: React.ReactNode = null;

  if (isAuction) {
    borderStyle = 'border-purple-500/30 hover:border-purple-400/50';
    gradientStyle = 'from-purple-900/10 via-gray-900/50 to-blue-900/10';
    badgeContent = (
      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-purple-400 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg flex items-center">
        <Gavel className="w-3 h-3 mr-1" />
        Auction
      </span>
    );
  } else if (isCustom) {
    borderStyle = 'border-blue-500/30 hover:border-blue-400/50';
    gradientStyle = 'from-blue-900/10 via-gray-900/50 to-cyan-900/10';
    badgeContent = (
      <span className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg flex items-center">
        <Settings className="w-3 h-3 mr-1" />
        Custom
      </span>
    );
  }

  const sanitizedTitle = sanitizeStrict(order.title);
  const sanitizedBuyer = sanitizeStrict(order.buyer);
  const buyerParam = encodeURIComponent(order.buyer);

  return (
    <li
      key={order.id + order.date}
      className={`relative border rounded-2xl bg-gradient-to-br overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 ${gradientStyle} ${borderStyle}`}
    >
      {/* Order Header */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Product Image - Hide for custom requests */}
          {!isCustom && (
            <div className="relative">
              <img
                src={order.imageUrl || '/default-image.jpg'}
                alt={sanitizedTitle}
                className="w-24 h-24 object-cover rounded-xl border-2 border-gray-600 shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-image.jpg';
                }}
              />
              {badgeContent}
            </div>
          )}

          {/* For custom requests, show badge without image */}
          {isCustom && badgeContent && (
            <div className="relative w-24 h-24 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl border-2 border-blue-500/30 flex items-center justify-center">
              <Settings className="w-8 h-8 text-blue-400" />
              {badgeContent}
            </div>
          )}

          {/* Order Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="font-bold text-xl text-white truncate">{sanitizedTitle}</h3>
              {isAuction && <Star className="w-5 h-5 text-purple-400 flex-shrink-0" />}
              {isCustom && <Settings className="w-5 h-5 text-blue-400 flex-shrink-0" />}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">Buyer:</span>
                <span className="font-semibold text-white">{sanitizedBuyer}</span>
                <Link
                  href={`/sellers/messages?thread=${buyerParam}`}
                  className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-lg hover:shadow-blue-500/25"
                >
                  <MessageCircle className="w-3 h-3" />
                  Message
                </Link>
              </div>
            </div>

            <div className="text-sm text-gray-400 mb-4">
              {isAuction && 'Won on: '}
              {isCustom && 'Requested on: '}
              {!isAuction && !isCustom && 'Sold on: '}
              <span className="text-gray-300 font-medium">{new Date(order.date).toLocaleDateString()}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {isAuction && (
                <div className="bg-purple-900/30 px-4 py-2 rounded-lg border border-purple-700/50">
                  <span className="text-purple-300 text-sm">Winning bid:</span>
                  <span className="text-purple-200 font-bold text-lg ml-2">
                    ${order.finalBid?.toFixed(2) || order.price.toFixed(2)}
                  </span>
                </div>
              )}

              {isCustom && (
                <div className="bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-700/50">
                  <span className="text-blue-300 text-sm">Agreed price:</span>
                  <span className="text-blue-200 font-bold text-lg ml-2">
                    ${order.price.toFixed(2)}
                  </span>
                </div>
              )}

              {!isAuction && !isCustom && (
                <div className="bg-[#ff950e]/10 px-4 py-2 rounded-lg border border-[#ff950e]/30">
                  <span className="text-[#ff950e] text-sm">Listed price:</span>
                  <span className="text-[#ff950e] font-bold text-lg ml-2">
                    ${order.price.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Show custom request details */}
            {isCustom && order.originalRequestId && (
              <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
                <div className="text-blue-300 text-sm font-medium mb-1">Custom Request Details:</div>
                <div className="text-blue-200 text-sm">
                  <SecureMessageDisplay content={order.description || ''} allowBasicFormatting={false} />
                </div>
                {order.tags && order.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {order.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="bg-blue-800/30 text-blue-200 text-xs px-2 py-0.5 rounded border border-blue-600/50"
                      >
                        {sanitizeStrict(tag)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status & Actions */}
          <div className="flex flex-col items-end gap-4">
            {getShippingStatusBadge(order.shippingStatus)}

            {order.deliveryAddress ? (
              <div className="flex items-center gap-2 bg-green-900/30 px-3 py-2 rounded-lg border border-green-700/50">
                <MapPin className="w-4 h-4 text-green-400" />
                <span className="text-green-300 text-sm font-medium">Address provided</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-yellow-900/30 px-3 py-2 rounded-lg border border-yellow-700/50">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-300 text-sm font-medium">No address yet</span>
              </div>
            )}

            <button
              className={`flex items-center gap-2 font-semibold px-4 py-2 rounded-lg transition-all text-sm ${
                isAuction
                  ? 'text-purple-300 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-700/50 hover:border-purple-600'
                  : isCustom
                  ? 'text-blue-300 bg-blue-900/30 hover:bg-blue-800/50 border border-blue-700/50 hover:border-blue-600'
                  : 'text-[#ff950e] bg-[#ff950e]/10 hover:bg-[#ff950e]/20 border border-[#ff950e]/30 hover:border-[#ff950e]/50'
              }`}
              onClick={onToggleExpand}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show Details
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-700 bg-black/20 p-6">
          {renderAddressBlock(order)}
          {renderShippingControls(order)}
        </div>
      )}
    </li>
  );
}
