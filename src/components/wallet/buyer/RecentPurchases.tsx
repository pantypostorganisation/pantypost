// src/components/wallet/buyer/RecentPurchases.tsx
'use client';

import { ShoppingBag, ArrowRight } from 'lucide-react';
import { RecentPurchasesProps } from '@/types/wallet';

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
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-md opacity-15 group-hover:opacity-25 transition-opacity duration-500"></div>
      <div className="relative bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-2xl p-8 border border-purple-500/20 shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg shadow-purple-500/10">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Recent Purchases</h2>
          </div>
          
          <a href="/buyers/my-orders" className="group/link flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-purple-400 hover:text-purple-300 transition-all duration-200">
            <span className="text-sm font-medium">View All</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
          </a>
        </div>
        
        <div className="space-y-4">
          {purchases.map((purchase, index) => (
            <div key={index} className="group/item bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a] rounded-xl p-5 border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg mb-1 group-hover/item:text-purple-300 transition-colors">{purchase.title}</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-400">Seller: <span className="text-purple-400">{purchase.seller}</span></span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500">{formatDate(purchase.date)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    ${(purchase.markedUpPrice || purchase.price).toFixed(2)}
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