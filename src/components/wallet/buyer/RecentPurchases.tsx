'use client';

import { ShoppingBag, ArrowRight, Package, Calendar } from 'lucide-react';
import { Order } from '@/context/WalletContext';

interface RecentPurchasesProps {
  purchases: Order[];
}

export default function RecentPurchases({ purchases }: RecentPurchasesProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (purchases.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all duration-300 relative overflow-hidden group">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center text-white">
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-2 rounded-lg mr-3 shadow-lg shadow-purple-500/20">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            Recent Purchases
          </h2>

          <a
            href="/buyers/my-orders"
            className="text-sm text-[#ff950e] hover:text-[#e88800] flex items-center transition-all duration-200 group/link"
          >
            View All Orders
            <ArrowRight className="w-4 h-4 ml-2 group-hover/link:translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="space-y-4">
          {purchases.map((purchase, index) => (
            <div
              key={index}
              className="bg-black/30 rounded-xl p-5 border border-gray-800 hover:border-gray-700 hover:bg-black/50 transition-all duration-200 group/item"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-purple-600/20 to-purple-500/20 p-2 rounded-lg group-hover/item:from-purple-600/30 group-hover/item:to-purple-500/30 transition-colors">
                    <Package className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover/item:text-[#ff950e] transition-colors">
                      {purchase.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-gray-400">From: {purchase.seller}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(purchase.date)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-[#ff950e]">
                    ${(purchase.markedUpPrice ?? purchase.price).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
