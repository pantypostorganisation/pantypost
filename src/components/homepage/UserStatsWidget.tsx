// src/components/homepage/UserStatsWidget.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, TrendingUp, Award } from 'lucide-react';
import { userStatsService, UserStats } from '@/services/userStats.service';
import { useWebSocket } from '@/context/WebSocketContext';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  delay?: number;
}

function StatCard({ icon, label, value, color, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className="bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-400 text-sm">{label}</p>
          <p className="text-2xl font-bold text-white">
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function UserStatsWidget() {
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    totalBuyers: 0,
    totalSellers: 0,
    verifiedSellers: 0,
    newUsersToday: 0,
    timestamp: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const webSocket = useWebSocket();

  useEffect(() => {
    // Fetch initial stats
    const fetchStats = async () => {
      try {
        const response = await userStatsService.getUserStats();
        if (response.success && response.data) {
          setStats(response.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        setIsLoading(false);
      }
    };

    fetchStats();

    // Subscribe to real-time updates
    if (webSocket) {
      const unsubscribe = webSocket.subscribe('stats:users', (data: UserStats) => {
        setStats(data);
        userStatsService.updateCachedStats(data);
      });

      return () => {
        unsubscribe();
      };
    }
    
    // Return undefined if no websocket (fixes TypeScript error)
    return undefined;
  }, [webSocket]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-black/50 rounded-xl p-4 animate-pulse">
            <div className="w-full h-16 bg-gray-800/50 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2
        className="text-2xl font-bold text-white mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        Community Statistics
      </motion.h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5 text-white" />}
          label="Total Users"
          value={stats.totalUsers}
          color="bg-[#ff950e]/20"
          delay={0}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-green-400" />}
          label="New Today"
          value={stats.newUsersToday}
          color="bg-green-500/20"
          delay={0.1}
        />
        <StatCard
          icon={<UserCheck className="w-5 h-5 text-purple-400" />}
          label="Active Sellers"
          value={stats.totalSellers}
          color="bg-purple-500/20"
          delay={0.2}
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-blue-400" />}
          label="Verified Sellers"
          value={stats.verifiedSellers}
          color="bg-blue-500/20"
          delay={0.3}
        />
      </div>

      {/* Growth indicator */}
      {stats.newUsersToday > 0 && (
        <motion.div
          className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm">
            {stats.newUsersToday} new {stats.newUsersToday === 1 ? 'user' : 'users'} joined today!
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}