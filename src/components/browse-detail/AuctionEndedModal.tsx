// src/components/browse-detail/AuctionEndedModal.tsx
'use client';

import { AlertCircle, Gavel, Clock, AlertTriangle, Trophy, XCircle } from 'lucide-react';
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
  
  const hasBids = listing.auction.bids && listing.auction.bids.length > 0;
  const isSeller = username === listing.seller;
  const hasUserBid = didUserBid && !isUserHighestBidder;
  
  // Don't show generic screens if the user won (they'll see the winner modal)
  if (userRole === "buyer" && isUserHighestBidder) {
    return null;
  }
  
  // Generic auction ended screen (for sellers and non-bidders)
  if ((isSeller || (!hasUserBid && !isUserHighestBidder))) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 max-w-md w-full text-center"
          >
            <motion.div 
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mb-6"
            >
              {listing.auction.status === 'cancelled' ? (
                <XCircle className="mx-auto w-16 h-16 text-red-500 mb-4" />
              ) : hasBids ? (
                <div className="relative inline-block">
                  <Gavel className="mx-auto w-16 h-16 text-purple-500 mb-4" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="w-20 h-20 border-2 border-purple-500/20 rounded-full" />
                  </motion.div>
                </div>
              ) : (
                <Clock className="mx-auto w-16 h-16 text-[#ff950e] mb-4" />
              )}
              
              <h2 className="text-2xl font-bold text-white mb-2">
                {listing.auction.status === 'cancelled' 
                  ? 'Auction Cancelled' 
                  : 'Auction Ended'}
              </h2>
              
              <div className="text-gray-300">
                {listing.auction.status === 'cancelled' ? (
                  <p>This auction was cancelled by the seller.</p>
                ) : isSeller ? (
                  hasBids ? (
                    <div>
                      Your auction for "<SecureMessageDisplay 
                        content={listing.title}
                        allowBasicFormatting={false}
                        className="text-[#ff950e] inline"
                      />" has ended 
                      with a final bid of <span className="font-bold text-green-400">${listing.auction.highestBid?.toFixed(2)}</span> 
                      from <SecureMessageDisplay 
                        content={listing.auction.highestBidder || ''}
                        allowBasicFormatting={false}
                        className="font-bold inline"
                      />.
                    </div>
                  ) : (
                    <div>
                      Your auction for "<SecureMessageDisplay 
                        content={listing.title}
                        allowBasicFormatting={false}
                        className="text-[#ff950e] inline"
                      />" has ended without 
                      receiving any bids.
                    </div>
                  )
                ) : (
                  hasBids ? (
                    <p>
                      This auction has ended with a final bid of <span className="font-bold text-green-400">${listing.auction.highestBid?.toFixed(2)}</span>.
                    </p>
                  ) : (
                    <p>
                      This auction has ended without receiving any bids.
                    </p>
                  )
                )}
              </div>
            </motion.div>
            
            <motion.button
              onClick={() => onNavigate('/browse')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-3 rounded-full hover:from-purple-500 hover:to-purple-400 font-bold transition text-lg shadow-lg"
            >
              Return to Browse
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }
  
  // Screen for users who bid but didn't win
  if (hasUserBid) {
    return (
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700 max-w-md w-full text-center"
          >
            <motion.div 
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="mb-6"
            >
              <AlertTriangle className="mx-auto w-16 h-16 text-yellow-500 mb-4" />
              
              <h2 className="text-2xl font-bold text-white mb-2">
                Auction Ended
              </h2>
              
              <div className="text-gray-300">
                <p className="mb-2">
                  Your bid of <span className="font-bold text-yellow-400">
                    ${bidsHistory.find(bid => bid.bidder === username)?.amount.toFixed(2) || '0.00'}
                  </span> was not the highest bid.
                </p>
                
                <div>
                  The auction for "<SecureMessageDisplay 
                    content={listing.title}
                    allowBasicFormatting={false}
                    className="text-[#ff950e] inline"
                  />" ended 
                  with a final bid of <span className="font-bold text-green-400">${listing.auction.highestBid?.toFixed(2)}</span> 
                  from <SecureMessageDisplay 
                    content={listing.auction.highestBidder || ''}
                    allowBasicFormatting={false}
                    className="font-bold inline"
                  />.
                </div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                >
                  <p className="text-blue-400 text-sm">
                    💰 Your funds have been automatically refunded to your wallet
                  </p>
                </motion.div>
              </div>
            </motion.div>
            
            <motion.button
              onClick={() => onNavigate('/browse')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-3 rounded-full hover:from-purple-500 hover:to-purple-400 font-bold transition text-lg shadow-lg"
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
