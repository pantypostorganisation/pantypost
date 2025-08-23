'use client';

import React from 'react';
import Link from 'next/link';
import type { Order } from '@/context/WalletContext';
import {
  AlertTriangle,
  Copy,
  Check,
  FileText,
  ShieldAlert,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface AddressDisplayProps {
  order: Order;
  onCopyAddress: (address: NonNullable<Order['deliveryAddress']>) => void;
  copiedText: string | null;
  getShippingLabel: (order: Order) => string;
}

export default function AddressDisplay({
  order,
  onCopyAddress,
  copiedText,
  getShippingLabel,
}: AddressDisplayProps) {
  const buyerParam = encodeURIComponent(order.buyer);

  if (!order.deliveryAddress) {
    return (
      <div className="mt-4 py-4 px-6 bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-xl flex items-start">
        <AlertTriangle className="w-6 h-6 text-yellow-400 mr-3 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <p className="text-yellow-200 font-semibold text-base mb-2">Waiting for delivery address</p>
          <p className="text-yellow-300/80 text-sm mb-3">
            The buyer hasn&apos;t provided their shipping address yet. You can message them to request it.
          </p>
          <Link
            href={`/sellers/messages?thread=${buyerParam}`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#ff950e] to-[#e0850d] hover:from-[#e0850d] hover:to-[#ff950e] text-black font-bold px-4 py-2 rounded-lg transition-all text-sm shadow-lg hover:shadow-[#ff950e]/25"
          >
            <MessageCircle className="w-4 h-4" />
            Message {sanitizeStrict(order.buyer)}
          </Link>
        </div>
      </div>
    );
  }

  const address = order.deliveryAddress;

  return (
    <>
      <div className="mt-4 border border-gray-700 rounded-xl overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-900/50">
        <div className="bg-gradient-to-r from-[#ff950e]/20 to-[#e0850d]/20 px-6 py-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-[#ff950e] mr-2" />
            <h4 className="font-semibold text-white text-base">📦 Shipping Address</h4>
          </div>
          <button
            onClick={() => onCopyAddress(address)}
            className="bg-gradient-to-r from-[#ff950e] to-[#e0850d] hover:from-[#e0850d] hover:to-[#ff950e] text-black text-sm font-bold flex items-center px-4 py-2 rounded-lg transition-all shadow-lg hover:shadow-[#ff950e]/25"
          >
            {copiedText === 'address' ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </>
            )}
          </button>
        </div>
        <div className="p-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30">
          <div className="font-bold text-lg text-white mb-1">{sanitizeStrict(address.fullName)}</div>
          <div className="text-gray-300 text-base leading-relaxed">
            <div>{sanitizeStrict(address.addressLine1)}</div>
            {address.addressLine2 && <div>{sanitizeStrict(address.addressLine2)}</div>}
            <div>
              {sanitizeStrict(address.city)}, {sanitizeStrict(address.state)} {sanitizeStrict(address.postalCode)}
            </div>
            <div className="font-medium">{sanitizeStrict(address.country)}</div>
          </div>
          {address.specialInstructions && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="text-sm text-[#ff950e] font-semibold mb-2">Special Instructions:</div>
              <p className="text-gray-300 bg-black/20 p-3 rounded-lg border border-gray-600 whitespace-pre-line">
                {sanitizeStrict(address.specialInstructions)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Shipping Label Section */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="font-semibold text-white text-lg flex items-center mb-4">
          <FileText className="w-5 h-5 mr-2 text-[#ff950e]" />
          Shipping Label
        </h4>

        {/* Enhanced Warning */}
        <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border-2 border-red-500 rounded-xl p-4 mb-4 flex items-start">
          <ShieldAlert className="w-6 h-6 text-red-400 mr-3 flex-shrink-0 mt-1" />
          <div>
            <p className="text-red-200 font-bold text-sm uppercase tracking-wide mb-2">
              PRIVACY WARNING - NO RETURN ADDRESS
            </p>
            <p className="text-red-300 text-sm">
              For your safety and privacy, <strong>never include your personal address</strong> on any package.
              Use a PO Box or shipping service if a return address is required.
            </p>
          </div>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600 font-mono text-base text-gray-100 whitespace-pre-line shadow-inner">
          {getShippingLabel(order)}
        </div>
        <p className="text-sm text-gray-400 mt-3 flex items-center">
          <Copy className="w-4 h-4 mr-2" />
          Copy the text above to write on your shipping label
        </p>
      </div>
    </>
  );
}
