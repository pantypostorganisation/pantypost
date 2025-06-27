// src/components/wallet/buyer/RecentPurchases.tsx
'use client';

import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Order } from '@/context/WalletContext.enhanced';

interface RecentPurchasesProps {
  purchases: Order[];
}

export default function RecentPurchases({ purchases }: RecentPurchasesProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (purchases.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <ShoppingBag className="w-5 h-5 mr-2 text-[#ff950e]" />
          Recent Purchases
        </h2>
        
        <a href="/buyers/my-orders" className="text-sm text-[#ff950e] hover:text-[#e88800] flex items-center transition-colors">
          View All
          <ArrowRight className="w-4 h-4 ml-1" />
        </a>
      </div>
      
      <div className="space-y-4">
        {purchases.map((purchase, index) => (
          <div key={index} className="bg-[#222] rounded-lg p-4 border border-[#333] hover:border-[#444] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-white">{purchase.title}</h3>
                <p className="text-sm text-gray-400">From: {purchase.seller}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(purchase.date)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#ff950e]">
                  ${(purchase.markedUpPrice || purchase.price).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
