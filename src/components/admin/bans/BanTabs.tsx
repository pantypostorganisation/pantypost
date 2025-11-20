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
  historyCount,
}: BanTabsProps) {
  const safeCount = (value: unknown): number => {
    const num = Number(value);
    return Number.isFinite(num) && num >= 0 ? num : 0;
  };

  const tabs: Array<{
    key: TabKey;
    label: string;
    count: number | null;
    icon: React.ComponentType<{ size?: number | string }>;
  }> = [
    { key: 'active', label: 'Active Bans', count: safeCount(banStats?.totalActiveBans), icon: Ban },
    { key: 'expired', label: 'Expired Bans', count: safeCount(expiredCount), icon: Clock },
    { key: 'appeals', label: 'Appeals', count: safeCount(banStats?.pendingAppeals), icon: MessageSquare },
    { key: 'history', label: 'History', count: safeCount(historyCount), icon: FileText },
    { key: 'analytics', label: 'Analytics', count: null, icon: BarChart3 },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Ban tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.key}`}
            onClick={() => onTabChange(tab.key)}
            className={`flex min-w-[140px] flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              isActive
                ? 'border-[#ff950e]/60 bg-[#ff950e]/10 text-[#ff950e]'
                : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.count !== null && <span className="ml-1 text-xs text-zinc-400">({tab.count})</span>}
          </button>
        );
      })}
    </div>
  );
}
