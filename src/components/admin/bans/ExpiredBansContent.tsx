'use client';

import { Clock } from 'lucide-react';
import { BanEntry, FilterOptions } from '@/types/ban';
import { isValidBan, getBanReasonDisplay } from '@/utils/banUtils';

interface ExpiredBansContentProps {
  expiredBans: BanEntry[];
  filters: FilterOptions;
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
    const comparison = new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime();
    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return filtered;
};

export default function ExpiredBansContent({ expiredBans, filters }: ExpiredBansContentProps) {
  const filteredBans = filterAndSortBans(expiredBans, filters);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Expired Bans ({expiredBans.length})</h2>
      {filteredBans.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
          <Clock size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No expired bans found</p>
          {filters.searchTerm && (
            <p className="text-gray-500 text-sm mt-2">
              Try adjusting your search terms or filters
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBans.map((ban) => {
            if (!isValidBan(ban)) return null;
            
            return (
              <div key={ban.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 opacity-75">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{ban.username}</h3>
                      <span className="px-2 py-1 bg-gray-900/20 text-gray-400 text-xs rounded font-medium">
                        Expired/Lifted
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Reason:</span>
                        <span className="text-gray-300 ml-2">{getBanReasonDisplay(ban.reason, ban.customReason)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-gray-300 ml-2">
                          {ban.banType === 'permanent' ? 'Permanent' : 
                            ban.endTime && ban.startTime ? 
                              `${Math.ceil((new Date(ban.endTime).getTime() - new Date(ban.startTime).getTime()) / (1000 * 60 * 60))} hours` :
                              'Unknown'
                          }
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Start:</span>
                        <span className="text-gray-300 ml-2">
                          {ban.startTime ? new Date(ban.startTime).toLocaleString() : 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">End:</span>
                        <span className="text-gray-300 ml-2">
                          {ban.endTime ? new Date(ban.endTime).toLocaleString() : 'Manually lifted'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          }).filter(ban => ban !== null)}
        </div>
      )}
    </div>
  );
}

