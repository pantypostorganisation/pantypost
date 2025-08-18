'use client';

import { History, X, Gavel, Trophy, TrendingUp } from 'lucide-react';
import { BidHistoryModalProps } from '@/types/browseDetail';
import { motion, AnimatePresence } from 'framer-motion';

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
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Bid history"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl border border-purple-800 w-full max-w-2xl max-h-[70vh] p-6 relative shadow-2xl"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" />
              Bid History
              {bidsHistory.length > 0 && (
                <span className="text-sm bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                  {bidsHistory.length} bids
                </span>
              )}
            </h3>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="text-gray-400 hover:text-white p-1 transition-colors"
              aria-label="Close bid history"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {bidsHistory.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <Gavel className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No bids placed yet</p>
              <p className="text-gray-500 text-sm">Be the first to bid on this item!</p>
            </motion.div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {bidsHistory.map((bid, index) => (
                <motion.div
                  key={`${bid.bidder}-${bid.amount}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg border transition-all ${
                    index === 0
                      ? 'bg-gradient-to-r from-green-900/30 to-green-800/20 border-green-700/50'
                      : bid.bidder === currentUsername
                      ? 'bg-purple-900/30 border-purple-700'
                      : 'bg-gray-800/50 border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-gradient-to-br from-green-500/30 to-green-600/20 text-green-400 ring-2 ring-green-500/30'
                            : bid.bidder === currentUsername
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {index === 0 ? <Trophy className="w-5 h-5" /> : bid.bidder === currentUsername ? 'You' : bid.bidder.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white text-sm">{bid.bidder === currentUsername ? 'Your bid' : bid.bidder}</p>
                        <p className="text-xs text-gray-400">{formatBidDate(bid.date)}</p>
                      </div>
                      {index === 0 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Highest
                        </motion.span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${index === 0 ? 'text-green-400 text-lg' : 'text-white'}`}>${bid.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">Total: ${calculateTotalPayable(bid.amount).toFixed(2)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-700">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-2.5 px-4 rounded-lg font-medium hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg"
            >
              Close
            </motion.button>
          </div>

          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(0, 0, 0, 0.2);
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(139, 92, 246, 0.3);
              border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(139, 92, 246, 0.5);
            }
          `}</style>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
