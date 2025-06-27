// src/components/wallet/buyer/EmptyState.tsx
'use client';

import { ShoppingBag, ArrowRight } from 'lucide-react';

interface EmptyStateProps {
  showEmptyState: boolean;
}

export default function EmptyState({ showEmptyState }: EmptyStateProps) {
  if (!showEmptyState) {
    return null;
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#333] shadow-lg text-center">
      <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-300 mb-2">No purchases yet</h3>
      <p className="text-gray-500 mb-4">Start browsing to find amazing items from verified sellers</p>
      <a 
        href="/browse" 
        className="inline-flex items-center px-4 py-2 bg-[#ff950e] hover:bg-[#e88800] text-black rounded-lg font-medium transition-colors"
      >
        Browse Listings
        <ArrowRight className="w-4 h-4 ml-2" />
      </a>
    </div>
  );
}
