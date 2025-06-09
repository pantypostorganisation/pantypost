// src/components/browse-detail/BidHistoryModal.tsx
'use client';

import { History, X, Gavel } from 'lucide-react';
import { BidHistoryModalProps } from '@/types/browseDetail';

export default function BidHistoryModal({
  show,
  onClose,
  bidsHistory,
  currentUsername,
  formatBidDate,
  calculateTotalPayable
}: BidHistoryModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl border border-purple-800 w-full max-w-2xl max-h-[70vh] p-6 relative">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            Bid History
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {bidsHistory.length === 0 ? (
          <div className="text-center py-12">
            <Gavel className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No bids placed yet</p>
            <p className="text-gray-500 text-sm">Be the first to bid on this item!</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {bidsHistory.map((bid, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  bid.bidder === currentUsername 
                    ? 'bg-purple-900/30 border-purple-700' 
                    : 'bg-gray-800/50 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      bid.bidder === currentUsername ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-700 text-gray-300'
                    }`}>
                      {bid.bidder === currentUsername ? 'You' : bid.bidder.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        {bid.bidder === currentUsername ? 'Your bid' : bid.bidder}
                      </p>
                      <p className="text-xs text-gray-400">{formatBidDate(bid.date)}</p>
                    </div>
                    {index === 0 && (
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded font-medium">
                        Highest
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${index === 0 ? 'text-green-400' : 'text-white'}`}>
                      ${bid.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Total: ${calculateTotalPayable(bid.amount).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-500 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}