// src/components/seller-profile/TipStats.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Heart, TrendingUp, Users, DollarSign } from 'lucide-react';
import { tipService, TipStats } from '@/services/tip.service';
import { sanitizeStrict } from '@/utils/security/sanitization';

interface TipStatsProps {
  username: string;
  isOwnProfile?: boolean;
}

export default function TipStatsComponent({ username, isOwnProfile = false }: TipStatsProps) {
  const [stats, setStats] = useState<TipStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!username) return;
      
      try {
        const data = await tipService.getTipStats(username);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch tip stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [username]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (!stats || stats.totalTips === 0) {
    if (!isOwnProfile) return null;
    
    return (
      <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
          <Heart className="w-5 h-5 text-pink-500" />
          Tips Received
        </h3>
        <p className="text-gray-400">No tips received yet</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
        <Heart className="w-5 h-5 text-pink-500" />
        Tips Received
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900/50 rounded p-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Total Earned
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${stats.totalAmount.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded p-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            Average Tip
          </div>
          <div className="text-2xl font-bold text-white">
            ${stats.averageTip.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/50 rounded p-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Heart className="w-4 h-4" />
            Total Tips
          </div>
          <div className="text-xl font-semibold text-white">
            {stats.totalTips}
          </div>
        </div>
        
        <div className="bg-gray-900/50 rounded p-3">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Users className="w-4 h-4" />
            Unique Tippers
          </div>
          <div className="text-xl font-semibold text-white">
            {stats.uniqueTippers}
          </div>
        </div>
      </div>
      
      {stats.recentTips.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Recent Tips</h4>
          <div className="space-y-2">
            {stats.recentTips.slice(0, 3).map((tip, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-300">
                  {sanitizeStrict(tip.from)}
                </span>
                <span className="text-green-400 font-medium">
                  ${tip.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}