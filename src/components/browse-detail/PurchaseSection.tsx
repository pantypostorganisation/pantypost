// src/components/browse-detail/PurchaseSection.tsx
'use client';

import Link from 'next/link';
import { ShoppingBag, MessageCircle } from 'lucide-react';
import { PurchaseSectionProps } from '@/types/browseDetail';

export default function PurchaseSection({
  listing,
  isProcessing,
  onPurchase,
  userRole
}: PurchaseSectionProps) {
  return (
    <div className="space-y-3">
      {/* Price Display */}
      <div className="bg-[#ff950e] text-black px-4 py-2 rounded-lg text-center">
        <div className="text-lg font-bold">
          ${listing.markedUpPrice?.toFixed(2) ?? listing.price.toFixed(2)}
        </div>
        <p className="text-xs opacity-75">Includes platform fee</p>
      </div>
      
      {/* Action Buttons */}
      {userRole === 'buyer' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onPurchase}
            disabled={isProcessing}
            className="bg-[#ff950e] text-black px-3 py-2 rounded-lg font-medium hover:bg-[#e88800] transition disabled:opacity-50 flex items-center justify-center gap-1.5 text-sm"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-3.5 w-3.5 border-2 border-black border-t-transparent rounded-full"></div>
                Processing
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                Buy Now
              </>
            )}
          </button>
          
          <Link
            href={`/buyers/messages?thread=${listing.seller}`}
            className="flex items-center justify-center gap-1.5 bg-gray-800 text-white px-3 py-2 rounded-lg font-medium border border-gray-700 hover:bg-gray-700 transition text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Message
          </Link>
        </div>
      )}
    </div>
  );
}