'use client';

import { FileText } from 'lucide-react';
import { BanHistoryEntry, FilterOptions } from '@/types/ban';

interface HistoryContentProps {
  banHistory: BanHistoryEntry[];
  filters: FilterOptions;
}

export default function HistoryContent({ banHistory, filters }: HistoryContentProps) {
  const filteredHistory = (banHistory || [])
    .filter(entry => {
      if (!entry || !entry.username) return false;
      return filters.searchTerm ? 
        entry.username.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (entry.details && entry.details.toLowerCase().includes(filters.searchTerm.toLowerCase())) : true;
    })
    .sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 50);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Ban History ({(banHistory || []).length})</h2>
      {filteredHistory.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No ban history found</p>
          <p className="text-gray-500 text-sm mt-2">
            Ban actions will appear here as they occur
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredHistory.map((entry) => {
            if (!entry || !entry.id) return null;
            
            return (
              <div key={entry.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium text-white">{entry.username || 'Unknown'}</span>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        entry.action === 'banned' ? 'bg-red-900/20 text-red-400' :
                        entry.action === 'unbanned' ? 'bg-green-900/20 text-green-400' :
                        entry.action === 'appeal_submitted' ? 'bg-orange-900/20 text-orange-400' :
                        entry.action === 'appeal_approved' ? 'bg-blue-900/20 text-blue-400' :
                        entry.action === 'appeal_rejected' ? 'bg-red-900/20 text-red-400' :
                        'bg-gray-900/20 text-gray-400'
                      }`}>
                        {(entry.action || 'unknown').replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mb-1">{entry.details || 'No details available'}</div>
                    <div className="text-xs text-gray-500">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown time'} by {entry.adminUsername || 'Unknown admin'}
                    </div>
                  </div>
                </div>
              </div>
            );
          }).filter(entry => entry !== null)}
        </div>
      )}
    </div>
  );
}

