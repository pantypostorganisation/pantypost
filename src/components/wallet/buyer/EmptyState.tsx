// src/components/wallet/buyer/EmptyState.tsx
'use client';

import { ShoppingBag, ArrowRight } from 'lucide-react';
import { EmptyStateProps } from '@/types/wallet';

export default function EmptyState({ showEmptyState }: EmptyStateProps) {
  if (!showEmptyState) {
    return null;
  }

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur-md opacity-15"></div>
      <div className="relative bg-gradient-to-br from-[#1f1f1f] to-[#2a2a2a] rounded-2xl p-12 border border-purple-500/20 shadow-xl text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-purple-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Start Your Journey</h3>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">Discover exclusive items from our verified sellers. Your first purchase awaits!</p>
        <a 
          href="/browse" 
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/20"
        >
          Browse Marketplace
          <ArrowRight className="w-5 h-5 ml-2" />
        </a>
      </div>
    </div>
  );
}