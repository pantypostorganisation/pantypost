// src/components/wallet/buyer/RecentPurchases.tsx
'use client';

import { ShoppingBag, ArrowRight, Package, Calendar, ExternalLink } from 'lucide-react';
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
    <div className="bg-gradient-to-br from-[#141414] to-[#0f0f0f] rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-violet-600/20 backdrop-blur-sm">
              <ShoppingBag className="w-6 h-6 text-purple-400" />
            </div>
            Recent Purchases
          </h2>

          <a
            href="/buyers/my-orders"
            className="text-sm text-[#ff950e] hover:text-orange-400 flex items-center gap-2 transition-all duration-200 group"
          >
            View All Orders
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Purchase List */}
        <div className="space-y-3">
          {purchases.map((purchase, index) => (
            <div
              key={index}
              className="group relative bg-black/20 hover:bg-black/40 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600/10 to-violet-600/10 group-hover:from-purple-600/20 group-hover:to-violet-600/20 transition-colors">
                    <Package className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-[#ff950e] transition-colors line-clamp-1">
                      {purchase.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1.5">
                      <p className="text-xs text-gray-500">
                        Seller: <span className="text-gray-400">{purchase.seller}</span>
                      </p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1 opacity-60" />
                        {formatDate(purchase.date)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#ff950e]">
                      ${(purchase.markedUpPrice ?? purchase.price).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Paid</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}