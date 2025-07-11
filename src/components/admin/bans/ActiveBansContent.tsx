// src/components/admin/bans/ActiveBansContent.tsx
'use client';

import { UserCheck } from 'lucide-react';
import BanCard from './BanCard';
import { BanEntry, FilterOptions } from '@/types/ban';
import { isValidBan } from '@/utils/banUtils';
import { sanitizeSearchQuery, sanitizeStrict } from '@/utils/security/sanitization';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

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

const VALID_SORT_OPTIONS = ['username', 'duration', 'date'] as const;
const VALID_FILTER_OPTIONS = ['all', 'temporary', 'permanent'] as const;
const VALID_SORT_ORDERS = ['asc', 'desc'] as const;

const filterAndSortBans = (bans: any[], filters: FilterOptions) => {
  if (!Array.isArray(bans)) return [];
  
  // Sanitize and validate filter options
  const sanitizedSearchTerm = filters.searchTerm ? sanitizeSearchQuery(filters.searchTerm) : '';
  const validatedSortBy = VALID_SORT_OPTIONS.includes(filters.sortBy as any) ? filters.sortBy : 'date';
  const validatedFilterBy = VALID_FILTER_OPTIONS.includes(filters.filterBy as any) ? filters.filterBy : 'all';
  const validatedSortOrder = VALID_SORT_ORDERS.includes(filters.sortOrder as any) ? filters.sortOrder : 'desc';
  
  let filtered = bans.filter(ban => {
    if (!isValidBan(ban)) return false;
    
    // Sanitize ban data for safe comparison
    const sanitizedUsername = sanitizeStrict(ban.username || '').toLowerCase();
    const sanitizedReason = sanitizeStrict(ban.reason || '').toLowerCase();
    const sanitizedCustomReason = sanitizeStrict(ban.customReason || '').toLowerCase();
    const searchTermLower = sanitizedSearchTerm.toLowerCase();
    
    const matchesSearch = sanitizedSearchTerm ? 
      sanitizedUsername.includes(searchTermLower) ||
      sanitizedReason.includes(searchTermLower) ||
      sanitizedCustomReason.includes(searchTermLower) : true;
    
    const matchesFilter = validatedFilterBy === 'all' ? true :
      validatedFilterBy === 'temporary' ? ban.banType === 'temporary' :
      ban.banType === 'permanent';
    
    return matchesSearch && matchesFilter;
  });

  filtered.sort((a, b) => {
    let comparison = 0;
    switch (validatedSortBy) {
      case 'username':
        const usernameA = sanitizeStrict(a.username || '');
        const usernameB = sanitizeStrict(b.username || '');
        comparison = usernameA.localeCompare(usernameB);
        break;
      case 'duration':
        const aDuration = a.banType === 'permanent' ? Infinity : (Number(a.remainingHours) || 0);
        const bDuration = b.banType === 'permanent' ? Infinity : (Number(b.remainingHours) || 0);
        comparison = aDuration - bDuration;
        break;
      case 'date':
      default:
        const dateA = new Date(a.startTime || 0).getTime();
        const dateB = new Date(b.startTime || 0).getTime();
        comparison = isNaN(dateA) || isNaN(dateB) ? 0 : dateA - dateB;
        break;
    }
    return validatedSortOrder === 'asc' ? comparison : -comparison;
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
  // Validate totalCount
  const validatedTotalCount = Number.isInteger(totalCount) && totalCount >= 0 ? totalCount : 0;
  
  // Filter and sort bans with sanitized filters
  const filteredBans = filterAndSortBans(activeBans, filters);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">
          Active Bans ({validatedTotalCount})
        </h2>
        {validatedTotalCount > 0 && (
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
              <SecureMessageDisplay 
                content={`Try adjusting your search terms or filters`}
                allowBasicFormatting={false}
              />
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
