// src/components/browse-detail/PurchaseSuccessModal.tsx
'use client';

import { useEffect } from 'react';
import { PurchaseSuccessModalProps } from '@/types/browseDetail';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

const Award = dynamic(() => import('lucide-react').then((mod) => ({ default: mod.Award })), { ssr: false });
const ShoppingBag = dynamic(() => import('lucide-react').then((mod) => ({ default: mod.ShoppingBag })), { ssr: false });
const Trophy = dynamic(() => import('lucide-react').then((mod) => ({ default: mod.Trophy })), { ssr: false });
const Sparkles = dynamic(() => import('lucide-react').then((mod) => ({ default: mod.Sparkles })), { ssr: false });

const TrophyIcon = () => (
  <svg className="w-20 h-20 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShoppingBagIcon = () => (
  <svg className="w-16 h-16 text-[#ff950e] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const CelebrationEffect = () => (
  <div className="fixed inset-0 pointer-events-none z-[60]">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2"
        initial={{
          x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
          y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
          scale: 0,
          rotate: 0,
        }}
        animate={{
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
          y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
          scale: [0, 1, 0],
          rotate: Math.random() * 360,
          backgroundColor: ['#fbbf24', '#f59e0b', '#eab308', '#facc15', '#fde047'][Math.floor(Math.random() * 5)],
        }}
        transition={{ duration: 2, delay: Math.random() * 0.5, ease: 'easeOut' }}
        style={{ borderRadius: Math.random() > 0.5 ? '50%' : '0%' }}
      />
    ))}
  </div>
);

export default function PurchaseSuccessModal({
  showPurchaseSuccess,
  showAuctionSuccess,
  isAuctionListing,
  listing,
  isUserHighestBidder,
  userRole,
  calculateTotalPayable,
  onNavigate,
}: PurchaseSuccessModalProps) {
  useEffect(() => {
    if (showAuctionSuccess && isUserHighestBidder) {
      if (typeof window !== 'undefined' && 'Audio' in window) {
        try {
          const audio = new Audio('/sounds/success.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {}
      }
    }
  }, [showAuctionSuccess, isUserHighestBidder]);

  // Auction winner
  if (showAuctionSuccess && isAuctionListing && listing && userRole === 'buyer' && isUserHighestBidder) {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <CelebrationEffect />
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-8 rounded-3xl shadow-2xl border border-yellow-500/30 max-w-md w-full text-center relative overflow-hidden z-[55]"
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-32 h-32 bg-yellow-500 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <motion.div initial={{ rotate: -180, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="mb-4">
                <div className="relative inline-block">
                  {Trophy ? <Trophy className="w-20 h-20 text-yellow-500 mx-auto" /> : <TrophyIcon />}
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 flex items-center justify-center">
                    {Sparkles ? <Sparkles className="w-24 h-24 text-yellow-400/50" /> : null}
                  </motion.div>
                </div>
              </motion.div>

              <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                🎉 Congratulations! 🎉
              </motion.h2>

              <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-xl text-yellow-400 mb-4 font-semibold">
                You Won the Auction!
              </motion.p>

              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-black/40 backdrop-blur p-4 rounded-2xl space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Winning Bid:</span>
                  <span className="font-bold text-yellow-400 text-lg">${listing.auction?.highestBid?.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-600 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total Paid:</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                      ${listing.auction?.highestBid?.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Secure Payment</span>
                  </div>
                  <span>•</span>
                  <span>No additional fees</span>
                </div>
              </motion.div>

              <div className="space-y-3">
                <motion.button onClick={() => onNavigate('/buyers/my-orders')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-3 rounded-xl hover:from-green-500 hover:to-green-400 font-bold transition shadow-lg">
                  View My Orders
                </motion.button>

                <motion.button onClick={() => onNavigate('/browse')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-purple-600/20 border border-purple-600 text-purple-400 px-4 py-3 rounded-xl hover:bg-purple-600/30 font-bold transition">
                  Browse More Auctions
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Standard purchase success
  if (showPurchaseSuccess && !isAuctionListing && listing) {
    return (
      <AnimatePresence>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-[#ff950e]/30 max-w-md w-full text-center shadow-2xl"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="mb-4">
              {ShoppingBag ? <ShoppingBag className="w-16 h-16 text-[#ff950e] mx-auto" /> : <ShoppingBagIcon />}
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-2">🎉 Purchase Successful!</h2>

            <div className="bg-black/40 p-4 rounded-xl mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400">Seller:</span>
                <SecureMessageDisplay content={listing.seller} allowBasicFormatting={false} className="font-bold text-white" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Paid:</span>
                <span className="text-xl font-bold text-[#ff950e]">
                  ${listing.markedUpPrice?.toFixed(2) ?? (listing.price * 1.1).toFixed(2)}
                </span>
              </div>
            </div>

            <motion.button onClick={() => onNavigate('/buyers/my-orders')} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full bg-gradient-to-r from-[#ff950e] to-[#e88800] text-black px-4 py-3 rounded-xl hover:from-[#e88800] hover:to-[#d77700] font-bold transition shadow-lg">
              Go to My Orders
            </motion.button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
