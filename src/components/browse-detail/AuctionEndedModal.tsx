// src/components/browse-detail/AuctionEndedModal.tsx
'use client';

import { AlertTriangle, Gavel, Clock, XCircle, Target, RefreshCw, DollarSign } from 'lucide-react';
import { AuctionEndedModalProps } from '@/types/browseDetail';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuctionEndedModal({
  isAuctionListing,
  isAuctionEnded,
  listing,
  isUserHighestBidder,
  didUserBid,
  userRole,
  username,
  bidsHistory,
  onNavigate
}: AuctionEndedModalProps) {
  if (!isAuctionListing || !isAuctionEnded || !listing.auction) return null;

  const hasBids = !!(listing.auction.bids && listing.auction.bids.length > 0);
  const isSeller = username === listing.seller;
  const hasUserBid = !!(didUserBid && !isUserHighestBidder);
  
  // Check reserve status
  const hasReserve = listing.auction.reservePrice !== undefined && listing.auction.reservePrice > 0;
  const reserveMet = !hasReserve || (listing.auction.highestBid && listing.auction.highestBid >= listing.auction.reservePrice!);
  const isReserveNotMet = hasReserve && !reserveMet;
  const cancelled = listing.auction.status === 'cancelled';
  const reserveNotMetStatus = listing.auction.status === 'reserve_not_met';

  // If buyer won and reserve was met, they'll get the winner flow elsewhere
  if (userRole === 'buyer' && isUserHighestBidder && reserveMet && !cancelled && !reserveNotMetStatus) return null;

  // Reserve not met - highest bidder view
  if (userRole === 'buyer' && isUserHighestBidder && (isReserveNotMet || reserveNotMetStatus)) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reserve price not met"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl border border-yellow-700/50 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mb-6"
            >
              <div className="relative inline-block">
                <Target className="mx-auto w-16 h-16 text-yellow-500 mb-4" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 flex items-center justify-center"
                  aria-hidden
                >
                  <div className="w-20 h-20 border-2 border-yellow-500/20 rounded-full" />
                </motion.div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Reserve Price Not Met</h2>

              <div className="text-gray-300 space-y-3">
                <p>
                  Although you had the highest bid of{' '}
                  <span className="font-bold text-yellow-400">
                    ${listing.auction.highestBid?.toFixed(2)}
                  </span>
                  , the auction for "
                  <SecureMessageDisplay
                    content={listing.title}
                    allowBasicFormatting={false}
                    className="text-[#ff950e] inline"
                  />
                  " did not meet the reserve price of{' '}
                  <span className="font-bold text-red-400">
                    ${listing.auction.reservePrice?.toFixed(2)}
                  </span>
                  .
                </p>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                >
                  <div className="flex items-center justify-center gap-2 text-blue-400">
                    <RefreshCw className="w-4 h-4" />
                    <p className="text-sm font-medium">Full Refund Processing</p>
                  </div>
                  <p className="text-xs text-blue-300 mt-1">
                    Your bid amount has been refunded to your wallet
                  </p>
                </motion.div>

                <div className="text-xs text-gray-400 p-2 bg-gray-800/50 rounded-lg">
                  The seller set a minimum reserve price that needed to be met for the auction to complete.
                </div>
              </div>
            </motion.div>

            <motion.button
              onClick={() => onNavigate('/browse')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-white px-4 py-3 rounded-full hover:from-yellow-500 hover:to-yellow-400 font-bold transition text-lg shadow-lg"
              aria-label="Return to browse"
            >
              Find More Auctions
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Seller view - reserve not met
  if (isSeller && (isReserveNotMet || reserveNotMetStatus)) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Auction ended - reserve not met"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl border border-yellow-700/50 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mb-6"
            >
              <Target className="mx-auto w-16 h-16 text-yellow-500 mb-4" />

              <h2 className="text-2xl font-bold text-white mb-2">Reserve Not Met</h2>

              <div className="text-gray-300 space-y-3">
                <p>
                  Your auction for "
                  <SecureMessageDisplay
                    content={listing.title}
                    allowBasicFormatting={false}
                    className="text-[#ff950e] inline"
                  />
                  " ended with a highest bid of{' '}
                  <span className="font-bold text-yellow-400">
                    ${listing.auction.highestBid?.toFixed(2)}
                  </span>
                  , which did not meet your reserve price of{' '}
                  <span className="font-bold text-red-400">
                    ${listing.auction.reservePrice?.toFixed(2)}
                  </span>
                  .
                </p>

                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-400">
                    The highest bidder has been refunded. You may relist this item with a lower reserve price or no reserve.
                  </p>
                </div>

                <div className="text-xs text-gray-500">
                  Missed by: ${((listing.auction.reservePrice || 0) - (listing.auction.highestBid || 0)).toFixed(2)}
                </div>
              </div>
            </motion.div>

            <div className="space-y-2">
              <motion.button
                onClick={() => onNavigate('/sellers/my-listings')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-[#ff950e] to-[#e88800] text-black px-4 py-3 rounded-full hover:from-[#e88800] hover:to-[#d77700] font-bold transition text-lg shadow-lg"
                aria-label="Go to my listings"
              >
                Relist Item
              </motion.button>
              
              <motion.button
                onClick={() => onNavigate('/browse')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-full hover:bg-gray-600 font-bold transition"
                aria-label="Return to browse"
              >
                Back to Browse
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Generic: seller or viewer (no relevant losing-bidder state) for completed/cancelled auctions
  if (isSeller || (!hasUserBid && !isUserHighestBidder)) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Auction ended"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mb-6"
            >
              {cancelled ? (
                <XCircle className="mx-auto w-16 h-16 text-red-500 mb-4" />
              ) : hasBids ? (
                <div className="relative inline-block">
                  <Gavel className="mx-auto w-16 h-16 text-purple-500 mb-4" />
                  <motion.div
                    aria-hidden
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-20 h-20 border-2 border-purple-500/20 rounded-full" />
                  </motion.div>
                </div>
              ) : (
                <Clock className="mx-auto w-16 h-16 text-[#ff950e] mb-4" />
              )}

              <h2 className="text-2xl font-bold text-white mb-2">
                {cancelled ? 'Auction Cancelled' : 'Auction Ended'}
              </h2>

              <div className="text-gray-300">
                {cancelled ? (
                  <p>This auction was cancelled by the seller.</p>
                ) : isSeller ? (
                  hasBids ? (
                    <div>
                      Your auction for "
                      <SecureMessageDisplay
                        content={listing.title}
                        allowBasicFormatting={false}
                        className="text-[#ff950e] inline"
                      />
                      " has ended with a final bid of{' '}
                      <span className="font-bold text-green-400">
                        ${listing.auction.highestBid?.toFixed(2)}
                      </span>{' '}
                      from{' '}
                      <SecureMessageDisplay
                        content={listing.auction.highestBidder || ''}
                        allowBasicFormatting={false}
                        className="font-bold inline"
                      />
                      .
                    </div>
                  ) : (
                    <div>
                      Your auction for "
                      <SecureMessageDisplay
                        content={listing.title}
                        allowBasicFormatting={false}
                        className="text-[#ff950e] inline"
                      />
                      " has ended without receiving any bids.
                    </div>
                  )
                ) : hasBids ? (
                  <p>
                    This auction has ended with a final bid of{' '}
                    <span className="font-bold text-green-400">
                      ${listing.auction.highestBid?.toFixed(2)}
                    </span>
                    .
                  </p>
                ) : (
                  <p>This auction has ended without receiving any bids.</p>
                )}
              </div>
            </motion.div>

            <motion.button
              onClick={() => onNavigate('/browse')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-3 rounded-full hover:from-purple-500 hover:to-purple-400 font-bold transition text-lg shadow-lg"
              aria-label="Return to browse"
            >
              Return to Browse
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Buyer who bid but didn't win
  if (hasUserBid) {
    const myBid = bidsHistory.find((b) => b.bidder === username)?.amount;
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="You were outbid"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mb-6"
            >
              <AlertTriangle className="mx-auto w-16 h-16 text-yellow-500 mb-4" />

              <h2 className="text-2xl font-bold text-white mb-2">Auction Ended</h2>

              <div className="text-gray-300">
                <p className="mb-2">
                  Your bid of{' '}
                  <span className="font-bold text-yellow-400">
                    ${typeof myBid === 'number' ? myBid.toFixed(2) : '0.00'}
                  </span>{' '}
                  was not the highest bid.
                </p>

                <div>
                  The auction for "
                  <SecureMessageDisplay
                    content={listing.title}
                    allowBasicFormatting={false}
                    className="text-[#ff950e] inline"
                  />
                  " ended with a final bid of{' '}
                  <span className="font-bold text-green-400">
                    ${listing.auction.highestBid?.toFixed(2)}
                  </span>{' '}
                  from{' '}
                  <SecureMessageDisplay
                    content={listing.auction.highestBidder || ''}
                    allowBasicFormatting={false}
                    className="font-bold inline"
                  />
                  .
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                >
                  <div className="flex items-center justify-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-400" />
                    <p className="text-blue-400 text-sm">Funds have been refunded to your wallet.</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.button
              onClick={() => onNavigate('/browse')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-3 rounded-full hover:from-purple-500 hover:to-purple-400 font-bold transition text-lg shadow-lg"
              aria-label="Browse more auctions"
            >
              Browse More Auctions
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
