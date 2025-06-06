'use client';

import { UserCheck } from 'lucide-react';
import BanCard from './BanCard';
import { BanEntry, FilterOptions } from '@/types/ban';
import { isValidBan } from '@/utils/banUtils';

interface ActiveBansContentProps {
  activeBans: BanEntry[];
  filters: FilterOptions;
  totalCount: number;
  expandedBans: Set<string>;
  onToggleExpand: (banId: string) => void;
  onUnban: (ban: BanEntry) => void;
  onReviewAppeal: (ban: BanEntry) => void;
  onShowEvidence: (evidence: string[]) => void;
}

const filterAndSortBans = (bans: any[], filters: FilterOptions) => {
  if (!Array.isArray(bans)) return [];
  
  let filtered = bans.filter(ban => {
    if (!isValidBan(ban)) return false;
    
    const matchesSearch = filters.searchTerm ? 
      ban.username.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (ban.reason && ban.reason.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
      (ban.customReason && ban.customReason.toLowerCase().includes(filters.searchTerm.toLowerCase())) : true;
    
    const matchesFilter = filters.filterBy === 'all' ? true :
      filters.filterBy === 'temporary' ? ban.banType === 'temporary' :
      ban.banType === 'permanent';
    
    return matchesSearch && matchesFilter;
  });

  filtered.sort((a, b) => {
    let comparison = 0;
    switch (filters.sortBy) {
      case 'username':
        comparison = a.username.localeCompare(b.username);
        break;
      case 'duration':
        const aDuration = a.banType === 'permanent' ? Infinity : (a.remainingHours || 0);
        const bDuration = b.banType === 'permanent' ? Infinity : (b.remainingHours || 0);
        comparison = aDuration - bDuration;
        break;
      case 'date':
      default:
        comparison = new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime();
        break;
    }
    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return filtered;
};

export default function ActiveBansContent({
  activeBans,
  filters,
  totalCount,
  expandedBans,
  onToggleExpand,
  onUnban,
  onReviewAppeal,
  onShowEvidence
}: ActiveBansContentProps) {
  const filteredBans = filterAndSortBans(activeBans, filters);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Active Bans ({totalCount})</h2>
        {totalCount > 0 && (
          <p className="text-sm text-gray-400">
            Click on a ban to expand details
          </p>
        )}
      </div>
      
      {filteredBans.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
          <UserCheck size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No active bans found</p>
          {filters.searchTerm && (
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your search terms or filters
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBans.map((ban) => (
            <BanCard
              key={ban.id}
              ban={ban}
              isExpanded={expandedBans.has(ban.id)}
              onToggleExpand={onToggleExpand}
              onUnban={onUnban}
              onReviewAppeal={onReviewAppeal}
              onShowEvidence={onShowEvidence}
            />
          ))}
        </div>
      )}
    </div>
  );
}
