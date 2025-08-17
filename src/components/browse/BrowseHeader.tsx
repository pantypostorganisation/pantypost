'use client';

import { Sparkles, Package, ShoppingBag, Crown, Gavel } from 'lucide-react';
import { BrowseHeaderProps } from '@/types/browse';

export default function BrowseHeader({
  user,
  filteredListingsCount,
  filter,
  categoryCounts,
  onFilterChange
}: BrowseHeaderProps) {
  return (
    <>
      {user?.role === 'seller' && (
        <div className="bg-blue-700/20 border border-blue-700 text-blue-400 p-4 rounded-lg mb-6 max-w-3xl mx-auto">
          <p className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            You are viewing this page as a seller. You can browse listings but cannot make purchases.
          </p>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="bg-purple-900/20 border border-purple-700 text-purple-300 p-4 rounded-lg mb-6 max-w-3xl mx-auto">
          <p className="text-sm flex items-center gap-2">
            <Crown className="w-4 h-4" />
            Admins can browse for moderation and analytics, but cannot purchase or bid.
          </p>
        </div>
      )}

      <div className="mb-4 max-w-[1700px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <div className="flex flex-col leading-tight">
            <h1 className="text-2xl font-bold text-white mb-1">
              Browse <span className="text-[#ff950e]">Listings</span>
            </h1>
            <p className="text-gray-400 text-sm">
              Discover {filteredListingsCount} amazing {filter === 'all' ? 'total' : filter} listings from verified sellers
            </p>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFilterChange('all')}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ${
                  filter === 'all'
                    ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105'
                    : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'
                }`}
              >
                <Package className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>All</span>
                <span className="bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {categoryCounts.all}
                </span>
              </button>

              <button
                onClick={() => onFilterChange('standard')}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ${
                  filter === 'standard'
                    ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105'
                    : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Standard</span>
                <span className="bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {categoryCounts.standard}
                </span>
              </button>

              <button
                onClick={() => onFilterChange('premium')}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ${
                  filter === 'premium'
                    ? 'bg-gradient-to-r from-[#ff950e] to-[#ff6b00] text-white border border-white/20 hover:from-[#ff6b00] hover:to-[#ff950e] hover:shadow-2xl hover:shadow-[#ff950e]/30 transform hover:scale-105'
                    : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#ff950e] border border-[#333] hover:border-[#ff950e]/50 hover:shadow-[#ff950e]/20'
                }`}
              >
                <Crown className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Premium</span>
                <span className="bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {categoryCounts.premium}
                </span>
              </button>

              <button
                onClick={() => onFilterChange('auction')}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 shadow-lg text-xs font-medium ${
                  filter === 'auction'
                    ? 'bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white border border-white/20 hover:from-[#7c3aed] hover:to-[#8b5cf6] hover:shadow-2xl hover:shadow-[#8b5cf6]/30 transform hover:scale-105'
                    : 'bg-gradient-to-r from-[#1a1a1a] to-[#222] hover:from-[#222] hover:to-[#333] text-[#8b5cf6] border border-[#333] hover:border-[#8b5cf6]/50 hover:shadow-[#8b5cf6]/20'
                }`}
              >
                <Gavel className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Auctions</span>
                <span className="bg-black/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {categoryCounts.auction}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
