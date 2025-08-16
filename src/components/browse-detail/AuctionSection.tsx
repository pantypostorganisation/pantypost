// src/components/browse-detail/AuctionSection.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { Clock, TrendingUp, Users, Eye, Shield, Zap, Trophy, AlertCircle } from 'lucide-react';
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
  const [userBidPosition, setUserBidPosition] = useState<number | null>(null);
  const [recentBidAlert, setRecentBidAlert] = useState<string | null>(null);

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
        
        setIsUrgent(timeLeft <= fiveMinutes && timeLeft > 0);
      };
      
      checkUrgency();
      const interval = setInterval(checkUrgency, 1000);
      return () => clearInterval(interval);
    }
    return undefined;
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
        setRecentBidAlert(`${latestBid.bidder} bid $${latestBid.amount.toFixed(2)}!`);
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
    const newBid = Math.ceil(currentBid) + increment;
    handleSecureBidChange(newBid.toString());
  };

  // Get the latest 3 bids for compact display
  const recentBids = mergedBidsHistory?.slice(0, 3) || listing.auction.bids?.slice(0, 3) || [];

  // Determine timer color based on time remaining
  const getTimerColor = () => {
    if (isAuctionEnded) return 'text-gray-400';
    if (isUrgent) return 'text-red-400';
    return 'text-green-400';
  };

  // Calculate minimum bid - ensure it's always an integer
  const getMinimumBid = () => {
    if (listing.auction?.highestBid) {
      // Parse as integer to remove ALL decimals, then add 1
      const currentBid = parseInt(listing.auction.highestBid.toString().split('.')[0]);
      return currentBid + 1;
    }
    const startingPrice = parseInt((listing.auction?.startingPrice || 0).toString().split('.')[0]);
    return startingPrice || 1;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border backdrop-blur-sm transition-all duration-300 ${
        isAuctionEnded ? 'border-gray-700 bg-gray-900/30' : 
        isUrgent ? 'border-red-600/50 bg-red-900/10' : 
        'border-purple-600/50 bg-purple-900/20'
      } p-4`}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white">
            Auction
          </h3>
          {!isAuctionEnded && (
            <motion.span 
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs font-bold"
            >
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
              LIVE
            </motion.span>
          )}
        </div>
        
        {/* Compact Stats */}
        {!isAuctionEnded && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{localViewerCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{bidsCount || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* User Position - More Prominent */}
      {userBidPosition && !isAuctionEnded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-3 p-2 rounded-lg flex items-center justify-center gap-2 ${
            userBidPosition === 1 
              ? 'bg-gradient-to-r from-green-500/30 to-green-600/20 border border-green-500/50 shadow-lg shadow-green-500/20' 
              : 'bg-yellow-500/20 border border-yellow-500/30'
          }`}
        >
          {userBidPosition === 1 ? (
            <>
              <Trophy className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-bold text-sm">✨ You're winning! ✨</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 font-medium text-xs">You're #{userBidPosition}</span>
            </>
          )}
        </motion.div>
      )}
      
      {/* Improved Stats Grid with better spacing */}
      <div className="grid grid-cols-3 gap-2.5 mb-3">
        <div className="bg-black/40 rounded-lg p-2.5 border border-gray-700/50">
          <p className="text-gray-500 text-xs mb-0.5">Start</p>
          <p className="text-sm font-bold text-white">${listing.auction.startingPrice.toFixed(2)}</p>
        </div>
        
        <div className="bg-black/40 rounded-lg p-2.5 border border-gray-700/50">
          <p className="text-gray-500 text-xs mb-0.5 flex items-center gap-1">
            Current
            {listing.auction.highestBid && <TrendingUp className="w-3 h-3 text-green-400" />}
          </p>
          {listing.auction.highestBid ? (
            <motion.p 
              key={listing.auction.highestBid}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-sm font-bold text-green-400"
            >
              ${listing.auction.highestBid.toFixed(2)}
            </motion.p>
          ) : (
            <p className="text-xs text-gray-500 italic">No bids</p>
          )}
        </div>

        <div className="bg-black/40 rounded-lg p-2.5 border border-gray-700/50">
          <p className="text-gray-500 text-xs mb-0.5">Time</p>
          <p className={`text-sm font-bold ${getTimerColor()}`}>
            {formatTimeRemaining(listing.auction.endTime).split(' ').slice(0, 2).join(' ')}
          </p>
        </div>
      </div>

      {/* Timer Progress Bar - Slightly thicker */}
      {!isAuctionEnded && (
        <div className="mb-3">
          <div className="w-full bg-gray-700/50 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              className={`h-1.5 rounded-full transition-all duration-1000 ${
                isUrgent ? 'bg-gradient-to-r from-red-600 to-red-500' : 'bg-gradient-to-r from-purple-600 to-purple-500'
              }`}
              style={{ width: `${getTimerProgress()}%` }}
              animate={isUrgent ? { opacity: [1, 0.7, 1] } : {}}
              transition={isUrgent ? { duration: 1, repeat: Infinity } : {}}
            />
          </div>
        </div>
      )}
      
      {/* Total Payable - Cleaner */}
      <div className="bg-purple-900/20 rounded-lg p-2.5 mb-3 border border-purple-700/30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-purple-200 text-xs">You pay if win:</span>
          </div>
          <span className="text-base font-bold text-white">
            ${currentTotalPayable.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Seller earnings - Compact */}
      {userRole === 'seller' && username === listing.seller && listing.auction.highestBid && (
        <div className="bg-gray-800/50 rounded-lg p-2 mb-3 border border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">You'll receive (80%):</span>
            <span className="text-sm font-bold text-green-400">
              ${(listing.auction.highestBid * 0.8).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Bidding Section - Improved */}
      {canBid && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <SecureInput
              ref={bidInputRef}
              type="number"
              placeholder={`Min: $${getMinimumBid()}`}
              value={bidAmount}
              onChange={handleSecureBidChange}
              onKeyPress={onBidKeyPress}
              min={getMinimumBid().toString()}
              step="1"
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/50 border border-purple-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-all h-[34px]"
              sanitize={false}
            />
            <motion.button
              ref={bidButtonRef}
              onClick={onBidSubmit}
              disabled={isBidding || !biddingEnabled}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-1 rounded-lg font-medium hover:from-purple-500 hover:to-purple-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-lg h-[32px] flex items-center justify-center"
            >
              {isBidding ? 'Placing...' : 'Place Bid'}
            </motion.button>
          </div>
          
          {/* Quick Bid Buttons - Better Layout */}
          <div className="flex gap-2">
            <span className="text-xs text-gray-500 self-center">Quick:</span>
            {[1, 5, 10].map(amount => (
              <motion.button
                key={amount}
                onClick={() => handleQuickBid(amount)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 bg-purple-800/30 hover:bg-purple-700/40 text-purple-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-purple-700/50"
              >
                +${amount}
              </motion.button>
            ))}
          </div>
          
          {/* Status Messages - Compact */}
          <AnimatePresence mode="wait">
            {bidError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="bg-red-900/30 border border-red-800 text-red-400 p-2 rounded-lg text-xs flex items-center gap-1.5"
              >
                <AlertCircle className="w-3 h-3" />
                {bidError}
              </motion.div>
            )}
            
            {bidSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-green-900/30 border border-green-800 text-green-400 p-2 rounded-lg text-xs flex items-center gap-1.5"
              >
                ✓ {bidSuccess}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Recent Bids - Better Contrast */}
      {recentBids.length > 0 && (
        <div className="mt-3 pt-3 border-t border-purple-700/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-300">Recent Bids</p>
            <button
              onClick={onShowBidHistory}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              View All ({bidsCount})
            </button>
          </div>
          
          <div className="space-y-1.5">
            {recentBids.slice(0, 3).map((bid, index) => (
              <motion.div 
                key={`${bid.bidder}-${bid.amount}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                  index === 0 
                    ? 'bg-gradient-to-r from-green-900/30 to-green-800/20 border border-green-700/40' 
                    : 'bg-gray-800/40 border border-gray-700/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${
                    bid.bidder === username ? 'text-purple-400' : 
                    index === 0 ? 'text-green-400' : 'text-gray-300'
                  }`}>
                    {bid.bidder === username ? '👤 You' : 
                     index === 0 ? `👑 ${bid.bidder}` : bid.bidder}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs">
                    {formatRelativeTime(bid.date)}
                  </span>
                  <span className={`font-bold ${
                    index === 0 ? 'text-green-400 text-sm' : 'text-white'
                  }`}>
                    ${bid.amount.toFixed(2)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}