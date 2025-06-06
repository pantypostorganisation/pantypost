'use client';

import { MessageSquare, Infinity } from 'lucide-react';
import { BanEntry } from '@/types/ban';
import { isValidBan, getBanReasonDisplay } from '@/utils/banUtils';

interface AppealsContentProps {
  pendingAppeals: BanEntry[];
  onReviewAppeal: (ban: BanEntry) => void;
  onShowEvidence: (evidence: string[]) => void;
}

const formatRemainingTime = (ban: BanEntry) => {
  if (!ban || typeof ban !== 'object') return 'Unknown';
  
  if (ban.banType === 'permanent') {
    return <span className="flex items-center gap-1"><Infinity size={14} /> Permanent</span>;
  }
  
  if (!ban.remainingHours || ban.remainingHours <= 0) {
    return <span className="text-gray-500">Expired</span>;
  }
  
  const hours = Number(ban.remainingHours);
  if (hours < 1) {
    const minutes = Math.ceil(hours * 60);
    return <span className="text-yellow-400">{minutes}m remaining</span>;
  }
  
  if (hours < 24) {
    return <span className="text-orange-400">{Math.ceil(hours)}h remaining</span>;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = Math.ceil(hours % 24);
  return <span className="text-red-400">{days}d {remainingHours}h remaining</span>;
};

export default function AppealsContent({
  pendingAppeals,
  onReviewAppeal,
  onShowEvidence
}: AppealsContentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white mb-4">Pending Appeals ({pendingAppeals.length})</h2>
      {pendingAppeals.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
          <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">No pending appeals</p>
          <p className="text-gray-500 text-sm mt-2">
            All appeals have been processed or no appeals have been submitted
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingAppeals.map((ban) => {
            if (!isValidBan(ban)) return null;
            
            return (
              <div key={ban.id} className="bg-[#1a1a1a] border border-orange-800 rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-white">{ban.username}</h3>
                      <span className="px-2 py-1 bg-orange-900/20 text-orange-400 text-xs rounded font-medium">
                        Appeal {ban.appealStatus || 'Pending'}
                      </span>
                    </div>
                    
                    <div className="bg-orange-900/10 border border-orange-800 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-orange-400 font-medium">Appeal Message:</div>
                        {ban.appealEvidence && Array.isArray(ban.appealEvidence) && ban.appealEvidence.length > 0 && (
                          <button
                            onClick={() => onShowEvidence(ban.appealEvidence!)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                          >
                            <span className="w-3 h-3 bg-blue-400 rounded"></span>
                            {ban.appealEvidence.length} Evidence File{ban.appealEvidence.length !== 1 ? 's' : ''}
                          </button>
                        )}
                      </div>
                      <div className="text-sm text-gray-300 mb-2">{ban.appealText || 'No appeal text provided'}</div>
                      <div className="text-xs text-gray-500">
                        Submitted: {ban.appealDate ? new Date(ban.appealDate).toLocaleString() : 'Unknown'}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-2">
                      <span>Original ban reason: </span>
                      <span className="text-gray-300">{getBanReasonDisplay(ban.reason, ban.customReason)}</span>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      <span>Ban type: </span>
                      <span className="text-gray-300">
                        {ban.banType} ({ban.banType === 'permanent' ? 'Permanent' : formatRemainingTime(ban)})
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => onReviewAppeal(ban)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center transition-colors"
                    >
                      <MessageSquare size={12} className="mr-1" />
                      Review Appeal
                    </button>
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

