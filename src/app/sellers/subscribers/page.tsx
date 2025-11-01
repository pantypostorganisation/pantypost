// src/app/sellers/subscribers/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import RequireAuth from '@/components/RequireAuth';
import BanCheck from '@/components/BanCheck';
import SellerRevenueChart from '@/components/analytics/SellerRevenueChart';
import { analyticsService } from '@/services/analytics.service';
import { referralService, ReferralStats, ReferralCode } from '@/services/referral.service';
import type {
  SellerOverview,
  RevenueData,
  SubscriberAnalytics,
  ProductAnalytics,
  PerformanceComparison
} from '@/services/analytics.service';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import { formatMoney } from '@/utils/format';
import { Money } from '@/types/common';
import { 
  BarChart3, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Download,
  Clock,
  Star,
  Loader2,
  RefreshCw,
  Copy,
  Share2,
  Edit2,
  Check,
  X,
  ExternalLink,
  Calendar,
  Award
} from 'lucide-react';

// Helper function to format currency
function formatCurrency(amount: number): string {
  // Convert to cents for Money type, then format
  const moneyAmount = Math.round(amount * 100) as Money;
  return formatMoney(moneyAmount);
}

// Metric Card Component - matching admin wallet style
function MetricCard({ 
  title, 
  subtitle,
  value, 
  change, 
  prefix = '', 
  suffix = '',
  icon: Icon,
  iconColor,
  bgGradient,
  breakdown
}: { 
  title: string; 
  subtitle?: string;
  value: number | string; 
  change?: number; 
  prefix?: string; 
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgGradient: string;
  breakdown?: { label: string; value: number }[];
}) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'number') {
      return prefix + val.toLocaleString() + suffix;
    }
    return prefix + val + suffix;
  };
  
  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-xl p-6 border relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-black/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 ${iconColor} rounded-lg`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-300">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold text-white">{formatValue(value)}</span>
          {change !== undefined && change !== 0 && (
            <span className={`text-sm flex items-center gap-1 ml-2 ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change).toFixed(1)}%
            </span>
          )}
        </div>

        {breakdown && breakdown.length > 0 && (
          <div className="text-sm text-gray-400 space-y-1">
            {breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.label}:</span>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    delivered: 'bg-green-500/20 text-green-400 border-green-500/30'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
      {status}
    </span>
  );
}

export default function SellerAnalyticsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [overview, setOverview] = useState<SellerOverview | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [subscriberData, setSubscriberData] = useState<SubscriberAnalytics | null>(null);
  const [productData, setProductData] = useState<ProductAnalytics | null>(null);
  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'products' | 'subscribers' | 'referrals'>('overview');
  
  // Referral-specific state
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [editingCode, setEditingCode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch all analytics data
  const fetchAnalytics = async (showLoading = true, clearCache = false, skipReloadingReset = false) => {
    if (showLoading) setLoading(true);
    setErrorMessage(null);

    try {
      // Clear cache if refresh is requested
      if (clearCache) {
        analyticsService.clearCache();
      }

      const [overviewRes, revenueRes, subscriberRes, productRes, comparisonRes, referralStatsRes, referralCodeRes] = await Promise.all([
        analyticsService.getSellerOverview(),
        analyticsService.getRevenueData(selectedPeriod),
        analyticsService.getSubscriberAnalytics(),
        analyticsService.getProductAnalytics(),
        analyticsService.getPerformanceComparison(30),
        referralService.getReferralStats(),
        referralService.getMyReferralCode()
      ]);

      if (overviewRes.success && overviewRes.data) {
        setOverview(overviewRes.data);
      }
      if (revenueRes.success && revenueRes.data) {
        setRevenueData(revenueRes.data);
      }
      if (subscriberRes.success && subscriberRes.data) {
        setSubscriberData(subscriberRes.data);
      }
      if (productRes.success && productRes.data) {
        setProductData(productRes.data);
      }
      if (comparisonRes.success && comparisonRes.data) {
        setComparison(comparisonRes.data);
      }
      if (referralStatsRes.success && referralStatsRes.data) {
        setReferralStats(referralStatsRes.data);
      }
      if (referralCodeRes.success && referralCodeRes.data) {
        setReferralCode(referralCodeRes.data);
        setNewCode(referralCodeRes.data.code);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setErrorMessage('Failed to load analytics data');
    } finally {
      setLoading(false);
      // Only reset isReloading if not skipped (for manual refresh handling)
      if (!skipReloadingReset) {
        setIsReloading(false);
      }
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'seller') return;
    fetchAnalytics();
  }, [user, selectedPeriod]);

  const handleRefresh = async () => {
    setIsReloading(true);
    
    // Ensure minimum visible loading time for user feedback (1 second for better visibility)
    const startTime = Date.now();
    
    await fetchAnalytics(false, true, true); // Pass true to skip automatic isReloading reset
    
    // Calculate remaining time to reach minimum duration
    const elapsed = Date.now() - startTime;
    const minimumDuration = 1000; // 1 second for clear visibility
    const remainingTime = Math.max(0, minimumDuration - elapsed);
    
    // Wait for remaining time if needed
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, remainingTime));
    }
    
    setIsReloading(false);
  };

  // Referral-specific functions
  const handleUpdateCode = async () => {
    if (!newCode || newCode.length < 3) {
      setCodeError('Code must be at least 3 characters');
      return;
    }

    if (!/^[A-Z0-9_-]+$/i.test(newCode)) {
      setCodeError('Code can only contain letters, numbers, underscore, and hyphen');
      return;
    }

    try {
      setSaving(true);
      setCodeError('');
      
      const response = await referralService.updateReferralCode(newCode);
      
      if (response.success && response.data) {
        setReferralCode(prev => prev ? { ...prev, code: response.data!.code } : null);
        setEditingCode(false);
        success('Referral code updated successfully');
        await fetchAnalytics(false, true, false); // Reload to get updated data
      } else {
        setCodeError(response.error?.message || 'This code is unavailable');
      }
    } catch (err) {
      console.error('Error updating code:', err);
      setCodeError('Failed to update code');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = async (codeType: 'custom' | 'auto') => {
    if (!referralCode) return;
    
    const codeToCopy = codeType === 'custom' ? referralCode.code : referralCode.autoCode;
    const copySuccess = await referralService.copyReferralLink(codeToCopy);
    
    if (copySuccess) {
      setCopiedCode(codeToCopy);
      success('Referral link copied to clipboard!');
      setTimeout(() => setCopiedCode(null), 3000);
    } else {
      error('Failed to copy link');
    }
  };

  const handleShare = (platform: 'twitter' | 'facebook' | 'whatsapp') => {
    if (!referralCode) return;
    
    const shareData = referralService.generateShareText(referralCode.code);
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.twitter)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.facebook)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareData.whatsapp)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Calculate tier bonus display
  const tierBonus = useMemo(() => {
    if (!overview || !user) return 0;
    return analyticsService.calculateTierBonus(overview.revenue.total, user.tier);
  }, [overview, user]);

  if (!user || user.role !== 'seller') {
    return (
      <BanCheck>
        <RequireAuth role="seller">
          <main className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-white">Loading...</div>
          </main>
        </RequireAuth>
      </BanCheck>
    );
  }

  if (loading) {
    return (
      <BanCheck>
        <RequireAuth role="seller">
          <main className="min-h-screen bg-black text-white p-8">
            <div className="max-w-md mx-auto bg-[#1a1a1a] rounded-xl shadow-lg p-8 border border-gray-800">
              <Loader2 className="w-16 h-16 text-[#ff950e] animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-center mb-4">Loading Analytics</h1>
              <p className="text-gray-400 text-center">Calculating your performance metrics...</p>
            </div>
          </main>
        </RequireAuth>
      </BanCheck>
    );
  }

  if (errorMessage) {
    return (
      <BanCheck>
        <RequireAuth role="seller">
          <main className="min-h-screen bg-black p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400">{errorMessage}</p>
              </div>
            </div>
          </main>
        </RequireAuth>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <main className="min-h-screen bg-black text-white py-6 px-4 sm:px-6 overflow-x-hidden">
          {/* Loading overlay for refresh */}
          {isReloading && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 shadow-xl">
                <Loader2 className="w-8 h-8 text-[#ff950e] animate-spin mx-auto mb-3" />
                <p className="text-white font-medium">Refreshing analytics...</p>
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold text-[#ff950e] flex items-center gap-3">
                  <BarChart3 className="h-8 w-8" />
                  Analytics Dashboard
                </h1>
                <p className="text-gray-400 mt-1">Track your sales performance and growth 📈</p>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={isReloading}
                className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 hover:bg-[#252525] text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
              >
                <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
                {isReloading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-800 mb-8">
              <nav className="flex space-x-8 overflow-x-auto">
                {['overview', 'revenue', 'products', 'subscribers', 'referrals'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? 'border-[#ff950e] text-[#ff950e]'
                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && overview && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard
                    title="Total Revenue"
                    subtitle="All-time earnings"
                    value={overview.revenue.total}
                    change={overview.revenue.monthlyGrowth}
                    prefix="$"
                    icon={DollarSign}
                    iconColor="bg-[#ff950e]"
                    bgGradient="from-[#ff950e]/20 to-[#ff6b00]/10 border-[#ff950e]/30"
                  />
                  <MetricCard
                    title="Total Orders"
                    subtitle="Lifetime sales"
                    value={overview.orders.total}
                    change={comparison ? comparison.changes.orders : undefined}
                    icon={ShoppingBag}
                    iconColor="bg-blue-500"
                    bgGradient="from-blue-500/20 to-blue-600/10 border-blue-500/30"
                  />
                  <MetricCard
                    title="Active Listings"
                    subtitle="Currently available"
                    value={overview.listings.active}
                    suffix={` of ${overview.listings.total}`}
                    icon={Package}
                    iconColor="bg-purple-500"
                    bgGradient="from-purple-500/20 to-purple-600/10 border-purple-500/30"
                  />
                  <MetricCard
                    title="Subscribers"
                    subtitle="Monthly recurring"
                    value={overview.subscribers.count}
                    suffix={overview.subscribers.count > 0 ? ` ($${overview.subscribers.subscriptionPrice || 25}/mo)` : ''}
                    icon={Users}
                    iconColor="bg-green-500"
                    bgGradient="from-green-500/20 to-green-600/10 border-green-500/30"
                    breakdown={overview.subscribers.count > 0 ? [
                      { label: 'Total monthly', value: overview.subscribers.monthlyRevenue },
                      { label: 'You keep (75%)', value: overview.subscribers.monthlyRevenue * 0.75 }
                    ] : undefined}
                  />
                </div>

                {/* Revenue & Order Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Breakdown */}
                  <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#ff950e]" />
                      Revenue Breakdown
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-[#252525] rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">This Month</span>
                          <span className="text-xl font-bold text-white">${overview.revenue.thisMonth.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-[#252525] rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Last Month</span>
                          <span className="text-xl font-bold text-white">${overview.revenue.lastMonth.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-[#252525] rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">This Week</span>
                          <span className="text-xl font-bold text-white">${overview.revenue.thisWeek.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="p-4 bg-[#252525] rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Average Order Value</span>
                          <span className="text-xl font-bold text-white">${overview.revenue.averageOrderValue.toLocaleString()}</span>
                        </div>
                      </div>
                      {tierBonus > 0 && (
                        <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span className="text-gray-300">Tier Bonus ({user.tier})</span>
                            </div>
                            <span className="text-xl font-bold text-yellow-400">+${tierBonus.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Status */}
                  <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-[#ff950e]" />
                      Order Status
                    </h3>
                    <div className="space-y-4">
                      {[
                        { status: 'pending', count: overview.orders.pending, color: 'bg-yellow-400' },
                        { status: 'processing', count: overview.orders.processing, color: 'bg-blue-400' },
                        { status: 'shipped', count: overview.orders.shipped, color: 'bg-purple-400' },
                        { status: 'delivered', count: overview.orders.delivered, color: 'bg-green-400' }
                      ].map(({ status, count, color }) => (
                        <div key={status} className="p-4 bg-[#252525] rounded-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${color}`} />
                              <span className="text-gray-300 capitalize">{status}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={status} />
                              <span className="text-xl font-bold text-white">{count}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800">
                  <div className="p-6 border-b border-gray-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[#ff950e]" />
                      Recent Orders
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#252525]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Buyer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {overview.orders.recent.slice(0, 5).map((order, idx) => (
                          <tr key={idx} className="hover:bg-[#252525] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              <SecureMessageDisplay content={order.title} allowBasicFormatting={false} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              <SecureMessageDisplay content={order.buyer} allowBasicFormatting={false} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                              ${order.markedUpPrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={order.shippingStatus} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {order.wasAuction ? (
                                <span className="text-purple-400">🔨 Auction</span>
                              ) : (
                                <span className="text-blue-400">🛍️ Regular</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Tab */}
            {activeTab === 'revenue' && revenueData && (
              <div className="space-y-8">
                {/* Period Selector */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Revenue Analysis</h3>
                  <div className="flex bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden">
                    {[
                      { value: 'daily', label: 'Daily' },
                      { value: 'weekly', label: 'Weekly' },
                      { value: 'monthly', label: 'Monthly' },
                      { value: 'yearly', label: 'Yearly' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSelectedPeriod(option.value as any)}
                        className={`px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                          selectedPeriod === option.value
                            ? 'bg-[#ff950e] text-black'
                            : 'text-gray-300 hover:text-white hover:bg-[#252525]'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Revenue Chart Component */}
                <SellerRevenueChart 
                  data={revenueData.revenueData} 
                  period={selectedPeriod}
                  isLoading={false}
                />

                {/* Revenue Data Table */}
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800">
                  <div className="p-6 border-b border-gray-800">
                    <h3 className="text-lg font-bold text-white">Revenue Details</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#252525]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Period
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Revenue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Orders
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Avg Order Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {revenueData.revenueData.slice(-10).reverse().map((data, idx) => (
                          <tr key={idx} className="hover:bg-[#252525] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                              {data._id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                              ${data.totalRevenue.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {data.orderCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              ${data.avgOrderValue.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && productData && (
              <div className="space-y-8">
                {/* Product Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricCard
                    title="Total Products"
                    subtitle="In your catalog"
                    value={productData.summary.totalProducts}
                    suffix={` (${productData.summary.activeProducts} active)`}
                    icon={Package}
                    iconColor="bg-purple-500"
                    bgGradient="from-purple-500/20 to-purple-600/10 border-purple-500/30"
                  />
                  <MetricCard
                    title="Product Revenue"
                    subtitle="Total earned from products"
                    value={productData.summary.totalRevenue}
                    prefix="$"
                    icon={DollarSign}
                    iconColor="bg-[#ff950e]"
                    bgGradient="from-[#ff950e]/20 to-[#ff6b00]/10 border-[#ff950e]/30"
                  />
                  <MetricCard
                    title="Conversion Rate"
                    subtitle="Views to purchases"
                    value={productData.summary.averageConversionRate}
                    suffix="%"
                    icon={TrendingUp}
                    iconColor="bg-green-500"
                    bgGradient="from-green-500/20 to-green-600/10 border-green-500/30"
                  />
                </div>

                {/* Product Performance Table */}
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800">
                  <div className="p-6 border-b border-gray-800">
                    <h3 className="text-lg font-bold text-white">Product Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#252525]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Views
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Orders
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Revenue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Conversion
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {productData.products.slice(0, 10).map((product) => (
                          <tr key={product.id} className="hover:bg-[#252525] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div>
                                <div className="text-white">
                                  <SecureMessageDisplay content={product.title} allowBasicFormatting={false} />
                                </div>
                                <div className={`text-xs ${
                                  product.status === 'active' ? 'text-green-400' : 'text-gray-500'
                                }`}>
                                  {product.status}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {product.type === 'auction' ? (
                                <span className="text-purple-400">🔨 Auction</span>
                              ) : (
                                <span className="text-blue-400">🛍️ Regular</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {product.views}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {product.orderCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                              ${product.revenue.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {product.conversionRate}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Subscribers Tab */}
            {activeTab === 'subscribers' && subscriberData && (
              <div className="space-y-8">
                {/* Subscriber Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <MetricCard
                    title="Total Subscribers"
                    subtitle="Active subscriptions"
                    value={subscriberData.totalSubscribers}
                    icon={Users}
                    iconColor="bg-green-500"
                    bgGradient="from-green-500/20 to-green-600/10 border-green-500/30"
                  />
                  <MetricCard
                    title="Monthly Recurring"
                    subtitle="Subscription revenue"
                    value={subscriberData.monthlyRecurringRevenue}
                    prefix="$"
                    icon={TrendingUp}
                    iconColor="bg-[#ff950e]"
                    bgGradient="from-[#ff950e]/20 to-[#ff6b00]/10 border-[#ff950e]/30"
                    breakdown={[
                      { label: 'Total revenue', value: subscriberData.monthlyRecurringRevenue },
                      { label: 'You keep (75%)', value: subscriberData.monthlyRecurringRevenue * 0.75 }
                    ]}
                  />
                  <MetricCard
                    title="Avg Subscriber Value"
                    subtitle="Lifetime value"
                    value={subscriberData.averageSubscriberValue}
                    prefix="$"
                    icon={Star}
                    iconColor="bg-yellow-500"
                    bgGradient="from-yellow-500/20 to-yellow-600/10 border-yellow-500/30"
                  />
                  <MetricCard
                    title="Churn Rate"
                    subtitle="Monthly cancellations"
                    value={subscriberData.churnRate}
                    suffix="%"
                    icon={Activity}
                    iconColor="bg-red-500"
                    bgGradient="from-red-500/20 to-red-600/10 border-red-500/30"
                  />
                </div>

                {/* Subscriber List */}
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800">
                  <div className="p-6 border-b border-gray-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#ff950e]" />
                      Subscriber Details
                    </h3>
                  </div>
                  {subscriberData.subscribers.length === 0 ? (
                    <div className="p-12 text-center">
                      <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">No subscribers yet</p>
                      <p className="text-gray-500 text-sm mt-2">Keep creating great content to attract subscribers!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-[#252525]">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Subscriber
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Since
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Total Orders
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Total Spent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                              Last Order
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {subscriberData.subscribers.map((subscriber, idx) => (
                            <tr key={idx} className="hover:bg-[#252525] transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                <SecureMessageDisplay content={subscriber.username} allowBasicFormatting={false} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {new Date(subscriber.subscribedAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {subscriber.totalOrders}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                                ${subscriber.totalSpent.toFixed(2)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {subscriber.lastOrderDate 
                                  ? new Date(subscriber.lastOrderDate).toLocaleDateString()
                                  : 'Never'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Referrals Tab - Integrated from ReferralDashboard */}
            {activeTab === 'referrals' && (
              <div className="space-y-6">
                {/* Referral Header */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <h2 className="text-2xl font-bold mb-2">Referral Program</h2>
                  <p className="text-gray-400">
                    Earn 5% commission on every sale made by sellers you refer - for life!
                  </p>
                </div>

                {/* Referral Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-[#ff6b00]/10 rounded-lg">
                        <DollarSign className="w-6 h-6 text-[#ff6b00]" />
                      </div>
                      <span className="text-xs text-green-400">Lifetime</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(referralStats?.stats.totalEarnings || 0)}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">Total Earnings</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gray-900 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Users className="w-6 h-6 text-blue-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {referralStats?.stats.totalReferrals || 0}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">Active Referrals</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-900 rounded-lg p-6"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-500" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {referralCode?.conversionRate.toFixed(1) || 0}%
                    </div>
                    <p className="text-gray-400 text-sm mt-1">Conversion Rate</p>
                  </motion.div>
                </div>

                {/* Referral Code Section */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Your Referral Code</h3>
                    {!editingCode && (
                      <button
                        onClick={() => setEditingCode(true)}
                        className="text-sm text-[#ff6b00] hover:text-[#ff8c00] transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Code
                      </button>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    {editingCode ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Custom Referral Code (3+ characters)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCode}
                              onChange={(e) => {
                                setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                                setCodeError('');
                              }}
                              maxLength={20}
                              className="flex-1 px-4 py-2 bg-black/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#ff6b00]"
                              placeholder="Enter custom code"
                            />
                            <button
                              onClick={handleUpdateCode}
                              disabled={saving}
                              className="px-4 py-2 bg-[#ff6b00] text-white rounded-lg hover:bg-[#ff8c00] transition-colors disabled:opacity-50"
                            >
                              {saving ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              ) : (
                                <Check className="w-5 h-5" />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setEditingCode(false);
                                setNewCode(referralCode?.code || '');
                                setCodeError('');
                              }}
                              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          {codeError && (
                            <p className="text-red-400 text-sm mt-1">{codeError}</p>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        {/* Custom Code */}
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Custom Code
                          </label>
                          <div className="flex gap-2">
                            <div className="flex-1 px-4 py-2 bg-black/50 border border-gray-700 rounded-lg">
                              <span className="text-xl font-mono font-bold text-[#ff6b00]">
                                {referralCode?.code}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopyCode('custom')}
                              className={`px-4 py-2 rounded-lg transition-colors ${
                                copiedCode === referralCode?.code
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-700 text-white hover:bg-gray-600'
                              }`}
                            >
                              {copiedCode === referralCode?.code ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {referralService.formatReferralUrl(referralCode?.code || '')}
                          </p>
                        </div>

                        {/* Auto-generated Code */}
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Auto-generated Code (Backup)
                          </label>
                          <div className="flex gap-2">
                            <div className="flex-1 px-4 py-2 bg-black/50 border border-gray-700 rounded-lg">
                              <span className="text-sm font-mono text-gray-400">
                                {referralCode?.autoCode}
                              </span>
                            </div>
                            <button
                              onClick={() => handleCopyCode('auto')}
                              className={`px-4 py-2 rounded-lg transition-colors ${
                                copiedCode === referralCode?.autoCode
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-700 text-white hover:bg-gray-600'
                              }`}
                            >
                              {copiedCode === referralCode?.autoCode ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <Copy className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Share Buttons */}
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <p className="text-sm text-gray-400 mb-3">Share your referral link</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleShare('twitter')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Twitter
                      </button>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Facebook
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        WhatsApp
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Referrals */}
                {referralStats && referralStats.stats.activeReferrals.length > 0 && (
                  <div className="bg-gray-900 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Recent Referrals</h3>
                    <div className="space-y-3">
                      {referralStats.stats.activeReferrals.slice(0, 5).map((referral) => (
                        <div
                          key={referral.username}
                          className="flex items-center justify-between p-3 bg-black/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-medium">{referral.username}</p>
                              <p className="text-xs text-gray-400">
                                Joined {new Date(referral.joinedDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-400">
                              {formatCurrency(referral.earnings)}
                            </p>
                            <p className="text-xs text-gray-400">
                              {referral.sales} sales
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-gradient-to-r from-[#ff6b00]/10 to-[#ff8c00]/10 border border-[#ff6b00]/20 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <Award className="w-6 h-6 text-[#ff6b00] mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-2">How the Referral Program Works</h4>
                      <ul className="space-y-1 text-sm text-gray-300">
                        <li>• Share your unique referral code with potential sellers</li>
                        <li>• When they sign up using your code, they become your referral</li>
                        <li>• Earn 5% commission on every sale they make - forever!</li>
                        <li>• Commissions are automatically credited to your wallet</li>
                        <li>• Track your earnings and referrals in real-time</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}
