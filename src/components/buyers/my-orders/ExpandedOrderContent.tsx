// src/components/buyers/my-orders/ExpandedOrderContent.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, DollarSign, Tag, ExternalLink } from 'lucide-react';
import { Order } from '@/context/WalletContext';
import { SecureMessageDisplay, SecureImage } from '@/components/ui/SecureMessageDisplay';
import { sanitizeUsername } from '@/utils/security/sanitization';

interface ExpandedOrderContentProps {
  order: Order;
  type: 'auction' | 'direct' | 'custom';
  sellerProfilePic: string | null;
  isSellerVerified: boolean;
}

export default function ExpandedOrderContent({
  order,
  type,
  sellerProfilePic,
  isSellerVerified,
}: ExpandedOrderContentProps) {
  const isCustom = type === 'custom';
  const sanitizedUsername = sanitizeUsername(order.seller);

  return (
    <div className="border-t border-gray-700 bg-black/20 p-6">
      {/* Seller Info */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/sellers/${sanitizedUsername}`}
          className="flex items-center gap-3 text-white hover:text-[#ff950e] group transition-colors"
        >
          {sellerProfilePic ? (
            <SecureImage
              src={sellerProfilePic}
              alt={order.seller}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-600 group-hover:border-[#ff950e] transition-colors"
              fallbackSrc="/placeholder-avatar.png"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold border-2 border-gray-600 group-hover:border-[#ff950e] transition-colors">
              {order.seller ? order.seller.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <div>
            <div className="font-semibold">
              <SecureMessageDisplay 
                content={order.seller}
                allowBasicFormatting={false}
                as="span"
              />
            </div>
            <div className="text-xs text-gray-400">View seller profile</div>
          </div>
          
          {isSellerVerified && (
            <div className="ml-2">
              <img src="/verification_badge.png" alt="Verified" className="w-5 h-5" />
            </div>
          )}
          
          <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
        
        <Link
          href={`/buyers/messages?thread=${sanitizedUsername}`}
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
                <SecureMessageDisplay 
                  content={tag}
                  allowBasicFormatting={false}
                  as="span"
                />
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
