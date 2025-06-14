// src/components/buyers/dashboard/QuickActions.tsx
'use client';

import Link from 'next/link';
import { ShoppingBag, MessageCircle, Package, Wallet } from 'lucide-react';
import { QuickActionsProps } from '@/types/dashboard';

export default function QuickActions({}: QuickActionsProps) {
  return (
    <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-5">Quick Actions</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link
          href="/browse"
          className="bg-[#111111] border border-gray-700 hover:border-[#ff950e] hover:bg-[#1a1a1a] rounded-lg p-5 transition-all group"
        >
          <ShoppingBag className="w-7 h-7 text-[#ff950e] mb-3 group-hover:scale-110 transition-transform" />
          <p className="text-white font-semibold mb-1 text-sm">Browse</p>
          <p className="text-gray-400 text-xs">Find new items</p>
        </Link>
        
        <Link
          href="/buyers/messages"
          className="bg-[#111111] border border-gray-700 hover:border-blue-400 hover:bg-[#1a1a1a] rounded-lg p-5 transition-all group"
        >
          <MessageCircle className="w-7 h-7 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
          <p className="text-white font-semibold mb-1 text-sm">Messages</p>
          <p className="text-gray-400 text-xs">Chat with sellers</p>
        </Link>
        
        <Link
          href="/buyers/my-orders"
          className="bg-[#111111] border border-gray-700 hover:border-purple-400 hover:bg-[#1a1a1a] rounded-lg p-5 transition-all group"
        >
          <Package className="w-7 h-7 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
          <p className="text-white font-semibold mb-1 text-sm">My Orders</p>
          <p className="text-gray-400 text-xs">Track purchases</p>
        </Link>
        
        <Link
          href="/wallet/buyer"
          className="bg-[#111111] border border-gray-700 hover:border-green-400 hover:bg-[#1a1a1a] rounded-lg p-5 transition-all group"
        >
          <Wallet className="w-7 h-7 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
          <p className="text-white font-semibold mb-1 text-sm">Wallet</p>
          <p className="text-gray-400 text-xs">Manage funds</p>
        </Link>
      </div>
    </div>
  );
}