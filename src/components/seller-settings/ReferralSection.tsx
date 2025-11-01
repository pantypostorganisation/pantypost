// src/components/seller-settings/ReferralSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Copy, 
  Check,
  ChevronRight,
  Gift,
  Link2,
  Award,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { formatCurrency } from '@/utils/url';
import { useRouter } from 'next/navigation';

// Define types for referral data
interface ReferralCode {
  code: string | null; // Code can be null
  conversionRate: number;
  createdAt: string;
  usedCount: number;
  active: boolean;
}

interface ActiveReferral {
  username: string;
  earnings: number;
  joinedAt: string;
  lastPurchase?: string;
}

interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  monthlyEarnings: number;
  pendingEarnings: number;
  activeReferrals: ActiveReferral[];
  conversionRate: number;
}

interface ReferralData {
  code: ReferralCode;
  stats: ReferralStats;
}

// Props validation schema
const PropsSchema = z.object({
  className: z.string().optional(),
  onViewDetails: z.function().args().returns(z.void()).optional(),
});

interface ReferralSectionProps extends z.infer<typeof PropsSchema> {}

// Mock referral service for now - replace with actual API calls
const referralService = {
  getReferralStats: async (): Promise<{ success: boolean; data?: ReferralData }> => {
    // Simulated API call - replace with actual implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            code: {
              code: 'PANTY' + Math.random().toString(36).substring(2, 7).toUpperCase(),
              conversionRate: 12.5,
              createdAt: new Date().toISOString(),
              usedCount: 23,
              active: true
            },
            stats: {
              totalReferrals: 23,
              totalEarnings: 1250.00,
              monthlyEarnings: 450.00,
              pendingEarnings: 125.00,
              activeReferrals: [
                { username: 'buyer123', earnings: 125.50, joinedAt: '2024-01-15' },
                { username: 'shopper456', earnings: 89.25, joinedAt: '2024-01-20' },
                { username: 'customer789', earnings: 234.75, joinedAt: '2024-01-25' }
              ],
              conversionRate: 12.5
            }
          }
        });
      }, 500);
    });
  },

  copyReferralLink: async (code: string | null): Promise<boolean> => {
    if (!code) return false;
    const url = `${window.location.origin}/signup?ref=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  },

  formatReferralUrl: (code: string | null): string => {
    if (!code) return '';
    return `${window.location.origin}/signup?ref=${code}`;
  }
};

export default function ReferralSection(rawProps: ReferralSectionProps) {
  const parsed = PropsSchema.safeParse(rawProps);
  const { className = '', onViewDetails } = parsed.success ? parsed.data : { className: '', onViewDetails: undefined };
  
  const [stats, setStats] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadReferralStats();
  }, []);

  const loadReferralStats = async () => {
    try {
      const response = await referralService.getReferralStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!stats?.code?.code) return;
    
    const success = await referralService.copyReferralLink(stats.code.code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails();
    } else {
      router.push('/sellers/referrals');
    }
  };

  if (loading) {
    return (
      <div className={`bg-[#1a1a1a] rounded-3xl border border-white/5 p-8 animate-pulse ${sanitizeStrict(className)}`}>
        <div className="h-6 bg-gray-800 rounded w-32 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-800 rounded"></div>
          <div className="h-20 bg-gray-800 rounded"></div>
          <div className="h-20 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#1a1a1a] rounded-3xl border border-white/5 p-8 backdrop-blur ${sanitizeStrict(className)}`}
    >
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[#ff950e]/10 rounded-xl">
            <Gift className="w-6 h-6 text-[#ff950e]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Referral Program</h2>
            <p className="text-sm text-gray-400 mt-1">Earn 5% lifetime commission on every sale</p>
          </div>
        </div>
        <button
          onClick={handleViewDetails}
          className="text-sm text-[#ff950e] hover:text-[#ff8c00] transition-colors flex items-center gap-1 px-4 py-2 rounded-lg hover:bg-[#ff950e]/10"
          type="button"
        >
          View Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Earnings Card */}
        <div className="bg-black/40 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-[#ff950e]/60" />
            <span className="text-xs text-green-400 font-medium">Lifetime</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats?.stats.totalEarnings || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Total Earnings</p>
        </div>

        {/* Monthly Earnings Card */}
        <div className="bg-black/40 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-[#ff950e]/60" />
            <span className="text-xs text-blue-400 font-medium">This Month</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats?.stats.monthlyEarnings || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Monthly Earnings</p>
        </div>

        {/* Total Referrals Card */}
        <div className="bg-black/40 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-[#ff950e]/60" />
            <span className="text-xs text-purple-400 font-medium">Active</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.stats.totalReferrals || 0}
          </p>
          <p className="text-xs text-gray-400 mt-1">Referrals</p>
        </div>

        {/* Conversion Rate Card */}
        <div className="bg-black/40 rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-[#ff950e]/60" />
            <span className="text-xs text-[#ff950e] font-medium">Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats?.code?.conversionRate.toFixed(1) || 0}%
          </p>
          <p className="text-xs text-gray-400 mt-1">Conversion</p>
        </div>
      </div>

      {/* Referral Code Section */}
      {stats?.code && stats.code.code && (
        <div className="bg-gradient-to-r from-[#ff950e]/5 to-[#ff6b00]/5 rounded-2xl border border-[#ff950e]/20 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#ff950e]" />
              <p className="text-sm font-medium text-gray-300">Your Referral Code</p>
            </div>
            {stats.code.active && (
              <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full font-medium">
                Active
              </span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <p className="text-3xl font-mono font-bold text-[#ff950e] mb-2">
                {sanitizeStrict(stats.code.code)}
              </p>
              <p className="text-xs text-gray-500">
                {referralService.formatReferralUrl(stats.code.code)}
              </p>
            </div>
            <button
              onClick={handleCopyCode}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-[#ff950e] text-black hover:bg-[#ff8c00]'
              }`}
              type="button"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Code Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/5">
            <div className="text-center">
              <p className="text-xs text-gray-400">Times Used</p>
              <p className="text-lg font-semibold text-white">{stats.code.usedCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Pending Earnings</p>
              <p className="text-lg font-semibold text-green-400">
                {formatCurrency(stats.stats.pendingEarnings || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Show message if no code */}
      {stats?.code && !stats.code.code && (
        <div className="bg-gradient-to-r from-[#ff950e]/5 to-[#ff6b00]/5 rounded-2xl border border-[#ff950e]/20 p-6 mb-8 text-center">
          <p className="text-gray-400 mb-2">You haven't created a referral code yet</p>
          <button
            onClick={handleViewDetails}
            className="px-6 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#ff8c00] transition-colors font-medium"
            type="button"
          >
            Create Referral Code
          </button>
        </div>
      )}

      {/* Recent Referrals Preview */}
      {stats && stats.stats.activeReferrals.length > 0 && (
        <div className="bg-black/40 rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-[#ff950e]" />
              Recent Referrals
            </h3>
            <span className="text-xs text-gray-500">
              Showing {Math.min(3, stats.stats.activeReferrals.length)} of {stats.stats.activeReferrals.length}
            </span>
          </div>
          <div className="space-y-3">
            {stats.stats.activeReferrals.slice(0, 3).map((referral, index) => (
              <div
                key={`${referral.username}-${index}`}
                className="flex items-center justify-between p-3 rounded-lg bg-black/60 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] flex items-center justify-center text-xs font-bold text-black">
                    {sanitizeStrict(referral.username).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm text-white">{sanitizeStrict(referral.username)}</span>
                    <p className="text-xs text-gray-500">
                      Joined {new Date(referral.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-green-400">
                    +{formatCurrency(referral.earnings)}
                  </span>
                  <p className="text-xs text-gray-500">earned</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call to Action for New Users */}
      {(!stats || stats.stats.totalReferrals === 0) && (
        <div className="mt-6 p-6 bg-gradient-to-r from-[#ff950e]/10 to-[#ff8c00]/10 rounded-2xl border border-[#ff950e]/20">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[#ff950e]/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-[#ff950e]" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-semibold text-white mb-2">Start Earning Passive Income!</h4>
              <p className="text-sm text-gray-300 mb-3">
                Share your unique referral code with potential buyers and earn 5% commission on every purchase they make. 
                Your earnings continue for as long as they remain active on the platform.
              </p>
              <ul className="space-y-1 text-xs text-gray-400">
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-400" />
                  <span>Lifetime commissions on all referred sales</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-400" />
                  <span>Real-time tracking and analytics</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-400" />
                  <span>Monthly payouts directly to your wallet</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}