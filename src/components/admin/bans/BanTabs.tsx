// src/components/admin/bans/BanTabs.tsx
'use client';

import { Ban, Clock, MessageSquare, FileText, BarChart3 } from 'lucide-react';
import { BanStats } from '@/types/ban';

type TabKey = 'active' | 'expired' | 'appeals' | 'history' | 'analytics';

interface BanTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  banStats: BanStats;
  expiredCount: number;
  historyCount: number;
}

export default function BanTabs({
  activeTab,
  onTabChange,
  banStats,
  expiredCount,
  historyCount
}: BanTabsProps) {
  // Ensure counts are valid numbers
  const safeCount = (value: any): number => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  };

  const tabs = [
    { 
      key: 'active' as TabKey, 
      label: 'Active Bans', 
      count: safeCount(banStats?.totalActiveBans), 
      icon: Ban 
    },
    { 
      key: 'expired' as TabKey, 
      label: 'Expired Bans', 
      count: safeCount(expiredCount), 
      icon: Clock 
    },
    { 
      key: 'appeals' as TabKey, 
      label: 'Appeals', 
      count: safeCount(banStats?.pendingAppeals), 
      icon: MessageSquare 
    },
    { 
      key: 'history' as TabKey, 
      label: 'History', 
      count: safeCount(historyCount), 
      icon: FileText 
    },
    { 
      key: 'analytics' as TabKey, 
      label: 'Analytics', 
      count: null, 
      icon: BarChart3 
    }
  ];

  return (
    <div className="flex flex-wrap gap-1 bg-[#1a1a1a] border border-gray-800 rounded-lg p-1 mb-6">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === tab.key 
              ? 'bg-[#ff950e] text-black shadow-lg' 
              : 'text-gray-300 hover:text-white hover:bg-[#333]'
          }`}
        >
          <tab.icon size={16} />
          <span className="hidden sm:inline">{tab.label}</span>
          {tab.count !== null && <span className="ml-1">({tab.count})</span>}
        </button>
      ))}
    </div>
  );
}

