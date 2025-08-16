// src/components/browse-detail/AuctionSection.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Gavel, Clock, ArrowUp, BarChart2, TrendingUp, Users, Eye, Shield, Zap, Trophy, AlertCircle, ChevronUp } from 'lucide-react';
import { AuctionSectionProps, BidHistoryItem } from '@/types/browseDetail';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeCurrency } from '@/utils/security/sanitization';
import { formatRelativeTime } from '@/utils/browseDetailUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface ExtendedAuctionSectionProps extends AuctionSectionProps {
  realtimeBids?: BidHistoryItem[];
  mergedBidsHistory?: BidHistoryItem[];
  viewerCount?: number;
}

export default function AuctionSection({
  listing,
  isAuctionEnded,
  formatTimeRemaining,
  currentHighestBid,
  currentTotalPayable,
  getTimerProgress,
  bidAmount,
  onBidAmountChange,
  onBidSubmit,
  onBidKeyPress,
  isBidding,
  biddingEnabled,
  bidError,
  bidSuccess,
  bidStatus,
  suggestedBidAmount,
  onShowBidHistory,
  bidsCount,
  userRole,
  username,
  bidInputRef,
  bidButtonRef,
  realtimeBids,
  mergedBidsHistory,
  viewerCount = 0
}: ExtendedAuctionSectionProps) {
  const [localViewerCount, setLocalViewerCount] = useState(viewerCount || Math.floor(Math.random() * 5) + 2);
  const [isUrgent, setIsUrgent] = useState(false);
  const [showQuickBids, setShowQuickBids] = useState(true);
  const [userBidPosition, setUserBidPosition] = useState<number | null>(null);
  const [recentBidAlert, setRecentBidAlert] = useState<string | null>(null);
  const timerRef = useRef<HTMLDivElement>(null);

  // Defensive checks
  if (!listing.auction) return null;

  const isActualAuction = !!(
    listing.auction.isAuction || 
    listing.auction.startingPrice !== undefined
  );
  
  if (!isActualAuction) return null;

  const isUserSeller = username === listing.seller;
  const canBid = !isAuctionEnded && userRole === 'buyer' && !isUserSeller;

  // Calculate time remaining for urgency
  useEffect(() => {
    if (listing.auction?.endTime) {
      const checkUrgency = () => {
        const endTime = new Date(listing.auction!.endTime).getTime();
        const now = Date.now();
        const timeLeft = endTime - now;
        const fiveMinutes = 5 * 60 * 1000;
        const thirtySeconds = 30 * 1000;
        
        setIsUrgent(timeLeft <= fiveMinutes && timeLeft > 0);
        
        // Add shake animation in final 30 seconds
        if (timeLeft <= thirtySeconds && timeLeft > 0 && timerRef.current) {
          timerRef.current.classList.add('animate-pulse');
        }
      };
      
      checkUrgency();
      const interval = setInterval(checkUrgency, 1000);
      return () => clearInterval(interval);
    }
    return undefined; // Fix: explicitly return undefined
  }, [listing.auction?.endTime]);

  // Calculate user's bid position
  useEffect(() => {
    if (username && mergedBidsHistory) {
      const userBids = mergedBidsHistory.filter(bid => bid.bidder === username);
      if (userBids.length > 0) {
        const sortedBids = [...mergedBidsHistory].sort((a, b) => b.amount - a.amount);
        const position = sortedBids.findIndex(bid => bid.bidder === username) + 1;
        setUserBidPosition(position);
      }
    }
  }, [username, mergedBidsHistory]);

  // Show recent bid alerts
  useEffect(() => {
    if (realtimeBids && realtimeBids.length > 0) {
      const latestBid = realtimeBids[0];
      if (latestBid.bidder !== username) {
        setRecentBidAlert(`${latestBid.bidder} just bid $${latestBid.amount.toFixed(2)}!`);
        setTimeout(() => setRecentBidAlert(null), 5000);
      }
    }
  }, [realtimeBids, username]);

  // Simulate viewer count changes
  useEffect(() => {
    const interval = setInterval(() => {
      setLocalViewerCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(1, prev + change);
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleSecureBidChange = (value: string) => {
    if (value === '') {
      onBidAmountChange('');
    } else {
      const sanitized = sanitizeCurrency(value);
      onBidAmountChange(sanitized.toString());
    }
  };

  const handleQuickBid = (increment: number) => {
    const currentBid = listing.auction?.highestBid || listing.auction?.startingPrice || 0;
    const newBid = (currentBid + increment).toFixed(2);
    handleSecureBidChange(newBid);
  };

  // Get the latest 5 bids for inline display
  const recentBids = mergedBidsHistory?.slice(0, 5) || listing.auction.bids?.slice(0, 5) || [];
  const hasMoreBids = (mergedBidsHistory?.length || listing.auction.bids?.length || 0) > 5;

  // Determine timer color based on time remaining
  const getTimerColor = () => {
    if (isAuctionEnded) return 'text-gray-400';
    if (isUrgent) return 'text-red-400';
    const progress = getTimerProgress();
    if (progress < 25) return 'text-red-400';
    if (progress < 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  // Get border style based on auction state
  const getBorderStyle = () => {
    if (isAuctionEnded) return 'border-gray-700 bg-gray-900/30';
    if (isUrgent) return 'border-red-600 bg-red-900/10 animate-pulse';
    if (realtimeBids && realtimeBids.length > 0) return 'border-purple-600 bg-purple-900/30';
    return 'border-purple-700 bg-purple-900/20';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-5 backdrop-blur-sm transition-all duration-300 ${getBorderStyle()}`}
    >
      {/* Header with Live Indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Gavel className={`w-5 h-5 ${isAuctionEnded ? 'text-gray-400' : 'text-purple-400'}`} />
          <h3 className="text-lg font-bold text-white">
            {isAuctionEnded ? 'Auction Ended' : 'Live Auction'}
          </h3>
          {!isAuctionEnded && (
            <motion.span 
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-bold"
            >
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
              LIVE
            </motion.span>
          )}
        </div>
        
        {/* Viewer Count */}
        {!isAuctionEnded && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Eye className="w-4 h-4" />
              <span>{localViewerCount}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-400 text-sm">
              <Users className="w-4 h-4" />
              <span>{bidsCount || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Recent Bid Alert */}
      <AnimatePresence>
        {recentBidAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-3 p-2 bg-yellow-500/20 border border-yellow-500/30 rounded-lg flex items-center gap-2"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">{recentBidAlert}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Position Indicator */}
      {userBidPosition && !isAuctionEnded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-3 p-2 rounded-lg flex items-center gap-2 ${
            userBidPosition === 1 
              ? 'bg-green-500/20 border border-green-500/30' 
              : 'bg-yellow-500/20 border border-yellow-500/30'
          }`}
        >
          {userBidPosition === 1 ? (
            <>
              <Trophy className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-bold">You're winning!</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">
                You're #{userBidPosition} • Beat by ${((listing.auction?.highestBid || 0) - (bidAmount ? parseFloat(bidAmount) : 0)).toFixed(2)} to lead
              </span>
            </>
          )}
        </motion.div>
      )}
      
      {/* Auction Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-400 text-sm">Starting Bid</p>
          <p className="text-xl font-bold text-white">${listing.auction.startingPrice.toFixed(2)}</p>
        </div>
        
        <div>
          <p className="text-gray-400 text-sm flex items-center gap-1">
            Current Bid 
            {listing.auction.highestBid && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block"
              >
                <TrendingUp className="w-3 h-3 text-green-400" />
              </motion.span>
            )}
          </p>
          {listing.auction.highestBid ? (
            <motion.p 
              key={listing.auction.highestBid}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-xl font-bold text-green-400"
            >
              ${listing.auction.highestBid.toFixed(2)}
            </motion.p>
          ) : (
            <p className="text-gray-400 italic">No bids yet</p>
          )}
        </div>
      </div>

      {/* Time Remaining with Enhanced Display */}
      {!isAuctionEnded && (
        <div className="mb-4" ref={timerRef}>
          <p className="text-gray-400 text-sm mb-1 flex items-center gap-2">
            Time Remaining
            {isUrgent && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
                ENDING SOON!
              </span>
            )}
          </p>
          <p className={`font-bold text-lg mb-2 ${getTimerColor()}`}>
            {formatTimeRemaining(listing.auction.endTime)}
          </p>
          
          {/* Timer Progress Bar */}
          <div className="relative">
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div 
                className={`h-2 rounded-full transition-all duration-1000 ease-linear ${
                  isUrgent ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-to-r from-purple-600 to-purple-500'
                }`}
                style={{ width: `${getTimerProgress()}%` }}
                animate={isUrgent ? { opacity: [1, 0.7, 1] } : {}}
                transition={isUrgent ? { duration: 1, repeat: Infinity } : {}}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Total Payable with Trust Badges */}
      <div className="bg-purple-900/30 rounded-lg p-3 mb-4 border border-purple-700/50">
        <div className="flex justify-between items-center">
          <span className="text-purple-200 text-sm">Amount if you win</span>
          <span className="text-lg font-bold text-white">
            ${currentTotalPayable.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Shield className="w-3 h-3 text-green-400" />
            <span>Secure Escrow</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>Instant Refund</span>
          </div>
        </div>
      </div>

      {/* Seller earnings display */}
      {userRole === 'seller' && username === listing.seller && listing.auction.highestBid && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-800/50 rounded-lg p-3 mb-4 border border-gray-700"
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">You'll receive (after 20% fee)</span>
            <span className="text-lg font-bold text-green-400">
              ${(listing.auction.highestBid * 0.8).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Platform fee: ${(listing.auction.highestBid * 0.2).toFixed(2)}
          </p>
        </motion.div>
      )}

      {/* Bidding Section */}
      {canBid && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <SecureInput
                ref={bidInputRef}
                type="number"
                placeholder={`Min: $${(listing.auction.highestBid ? (listing.auction.highestBid + 0.01) : listing.auction.startingPrice).toFixed(2)}`}
                value={bidAmount}
                onChange={handleSecureBidChange}
                onKeyPress={onBidKeyPress}
                min={listing.auction.highestBid ? (listing.auction.highestBid + 0.01).toString() : listing.auction.startingPrice.toString()}
                step="0.01"
                className="w-full px-3 py-2.5 rounded-lg bg-black/50 border border-purple-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all"
                sanitize={false}
              />
            </div>
            <motion.button
              ref={bidButtonRef}
              onClick={onBidSubmit}
              disabled={isBidding || !biddingEnabled}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-2.5 rounded-lg font-bold hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg"
            >
              {isBidding ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Placing...
                </div>
              ) : (
                'Place Bid'
              )}
            </motion.button>
          </div>
          
          {/* Quick Bid Buttons */}
          {showQuickBids && (
            <div className="flex gap-2">
              <span className="text-xs text-gray-400 self-center">Quick bid:</span>
              {[1, 5, 10, 20].map(amount => (
                <motion.button
                  key={amount}
                  onClick={() => handleQuickBid(amount)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-purple-800/30 hover:bg-purple-700/40 text-purple-300 px-3 py-1.5 rounded text-sm font-medium transition-all border border-purple-700/50"
                >
                  +${amount}
                </motion.button>
              ))}
            </div>
          )}
          
          {/* Status Messages */}
          <AnimatePresence mode="wait">
            {bidError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-900/30 border border-red-800 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {bidError}
              </motion.div>
            )}
            
            {bidSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-green-900/30 border border-green-800 text-green-400 p-3 rounded-lg text-sm flex items-center gap-2"
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  ✓
                </motion.div>
                {bidSuccess}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Recent Bids Section - Enhanced */}
      {recentBids.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 pt-4 border-t border-gray-700/50"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
              Recent Bids
              {realtimeBids && realtimeBids.length > 0 && (
                <motion.span 
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full"
                >
                  LIVE
                </motion.span>
              )}
            </p>
            <p className="text-xs text-gray-500">{bidsCount || recentBids.length} total</p>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {recentBids.map((bid, index) => (
                <motion.div 
                  key={`${bid.bidder}-${bid.amount}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-sm transition-all ${
                    index === 0 
                      ? 'bg-gradient-to-r from-green-900/30 to-green-800/20 border border-green-700/30' 
                      : 'bg-gray-800/30 hover:bg-gray-800/40 border border-gray-700/30'
                  } ${bid.bidder === username ? 'relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-purple-500 before:rounded-l-lg' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 
                        ? 'bg-gradient-to-br from-green-500/30 to-green-600/20 text-green-400 ring-1 ring-green-500/30' 
                        : bid.bidder === username 
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-gray-700/50 text-gray-400'
                    }`}>
                      {bid.bidder === username ? 'You' : bid.bidder.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className={`font-medium ${
                        bid.bidder === username ? 'text-purple-400' : 'text-gray-300'
                      }`}>
                        {bid.bidder === username ? 'You' : bid.bidder}
                      </span>
                      {index === 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-2 text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold"
                        >
                          Leading
                        </motion.span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <motion.span 
                      key={bid.amount}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className={`font-bold ${
                        index === 0 ? 'text-green-400 text-base' : 'text-white'
                      }`}
                    >
                      ${bid.amount.toFixed(2)}
                    </motion.span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatRelativeTime(bid.date)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {/* View Full History Button */}
          {hasMoreBids && (
            <motion.button
              onClick={onShowBidHistory}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-3 w-full bg-gray-800/30 hover:bg-gray-800/50 text-gray-400 hover:text-gray-300 px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2 font-medium border border-gray-700/50"
            >
              <BarChart2 className="w-4 h-4" />
              View Full History ({bidsCount || listing.auction.bids?.length || 0} bids)
            </motion.button>
          )}
        </motion.div>
      )}

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
  );
}