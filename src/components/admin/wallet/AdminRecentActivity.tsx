// src/components/admin/wallet/AdminRecentActivity.tsx
'use client';

import { useMemo } from 'react';
import { Clock, Download, Upload, Wallet, Activity, TrendingUp, Gavel, ShoppingBag, Award } from 'lucide-react';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

interface AdminRecentActivityProps {
  timeFilter: string;
  filteredDeposits?: any[];
  filteredSellerWithdrawals?: any[];
  filteredAdminWithdrawals?: any[];
  filteredActions?: any[];
  filteredOrders?: any[];
}

export default function AdminRecentActivity({
  timeFilter = 'all',
  filteredDeposits = [],
  filteredSellerWithdrawals = [],
  filteredAdminWithdrawals = [],
  filteredActions = [],
  filteredOrders = []
}: AdminRecentActivityProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number.isFinite(amount) ? amount : 0);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return 'Invalid date';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getPeriodDisplayName = () => {
    switch (timeFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case '3months': return 'Last 3 Months';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  const allActivities = useMemo(() => {
    const safeDeposits = Array.isArray(filteredDeposits) ? filteredDeposits : [];
    const safeSellerWithdrawals = Array.isArray(filteredSellerWithdrawals) ? filteredSellerWithdrawals : [];
    const safeAdminWithdrawals = Array.isArray(filteredAdminWithdrawals) ? filteredAdminWithdrawals : [];
    const safeActions = Array.isArray(filteredActions) ? filteredActions : [];
    const safeOrders = Array.isArray(filteredOrders) ? filteredOrders : [];

    const subscriptionActions = safeActions.filter(
      (action) =>
        action &&
        action.type === 'credit' &&
        action.reason &&
        action.reason.toLowerCase().includes('subscription') &&
        action.reason.toLowerCase().includes('revenue')
    );

    const tierCreditActions = safeActions.filter(
      (action) =>
        action &&
        action.type === 'debit' &&
        action.reason &&
        (action.reason.toLowerCase().includes('tier') ||
          action.reason.toLowerCase().includes('bonus'))
    );

    const auctionCompletions = safeOrders.filter((order) => order && order.wasAuction && order.shippingStatus !== 'pending-auction');
    const regularSales = safeOrders.filter((order) => order && !order.wasAuction && order.shippingStatus !== 'pending-auction');

    return [
      ...safeDeposits
        .filter((deposit) => deposit && deposit.status === 'completed' && deposit.date)
        .map((deposit) => ({ type: 'deposit' as const, data: deposit, date: deposit.date })),
      ...safeSellerWithdrawals
        .filter((withdrawal) => withdrawal && withdrawal.date)
        .map((withdrawal) => ({ type: 'seller_withdrawal' as const, data: withdrawal, date: withdrawal.date })),
      ...safeAdminWithdrawals
        .filter((withdrawal) => withdrawal && withdrawal.date)
        .map((withdrawal) => ({ type: 'admin_withdrawal' as const, data: withdrawal, date: withdrawal.date })),
      ...subscriptionActions
        .filter((action) => action && action.date)
        .map((action) => ({ type: 'subscription' as const, data: action, date: action.date })),
      ...tierCreditActions
        .filter((action) => action && action.date)
        .map((action) => ({ type: 'tier_credit' as const, data: action, date: action.date })),
      ...auctionCompletions
        .filter((order) => order && order.date)
        .map((order) => ({ type: 'auction_completion' as const, data: order, date: order.date })),
      ...regularSales
        .filter((order) => order && order.date)
        .map((order) => ({ type: 'regular_sale' as const, data: order, date: order.date }))
    ]
      .filter((item) => item && item.date)
      .sort((a, b) => {
        try {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } catch {
          return 0;
        }
      })
      .slice(0, 20);
  }, [filteredDeposits, filteredSellerWithdrawals, filteredAdminWithdrawals, filteredActions, filteredOrders]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-sm shadow-xl shadow-black/30">
      <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[#ff6b00]/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-56 w-56 rounded-full bg-purple-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative mb-6 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
          <Clock className="h-5 w-5 text-[#ffbf7f]" />
          Recent Money Activity
        </h3>
        <div className="text-sm text-gray-400">
          Recent transactions {timeFilter !== 'all' ? `(${getPeriodDisplayName()})` : ''}
        </div>
      </div>

      {allActivities.length > 0 ? (
        <div className="relative overflow-hidden">
          <div className="max-h-80 overflow-y-auto pr-1">
            <div className="space-y-3">
              {allActivities.map((item, index) => {
                if (!item || !item.data) return null;

                if (item.type === 'deposit') {
                  const deposit = item.data;
                  const method = typeof deposit?.method === 'string' ? deposit.method.replace('_', ' ') : 'unknown';
                  return (
                    <div
                      key={`deposit-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 transition-colors hover:border-blue-400/40"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-4">
                        <div className="flex-shrink-0 rounded-xl bg-blue-500/20 p-2 text-blue-300">
                          <Download className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">💳 Deposit Received</p>
                          <div className="truncate text-sm text-gray-300">
                            <SecureMessageDisplay content={deposit?.username || 'Unknown'} allowBasicFormatting={false} className="inline" />
                            <span> via {method}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="font-bold text-blue-300">+{formatCurrency(Number(deposit?.amount) || 0)}</p>
                        <p className="text-xs text-gray-400">{formatDate(deposit?.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'seller_withdrawal') {
                  const withdrawal = item.data;
                  return (
                    <div
                      key={`seller-withdrawal-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-4 transition-colors hover:border-red-400/40"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-4">
                        <div className="flex-shrink-0 rounded-xl bg-red-500/20 p-2 text-red-300">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">💸 Seller Withdrawal</p>
                          <div className="truncate text-sm text-gray-300">
                            <SecureMessageDisplay content={withdrawal?.seller || 'Unknown'} allowBasicFormatting={false} className="inline" />
                            <span> cashed out</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="font-bold text-red-300">-{formatCurrency(Number(withdrawal?.amount) || 0)}</p>
                        <p className="text-xs text-gray-400">{formatDate(withdrawal?.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'admin_withdrawal') {
                  const withdrawal = item.data;
                  return (
                    <div
                      key={`admin-withdrawal-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 transition-colors hover:border-purple-400/40"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-4">
                        <div className="flex-shrink-0 rounded-xl bg-purple-500/20 p-2 text-purple-200">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">👑 Admin Withdrawal</p>
                          <p className="truncate text-sm text-gray-300">Platform profit withdrawal</p>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="font-bold text-purple-200">-{formatCurrency(Number(withdrawal?.amount) || 0)}</p>
                        <p className="text-xs text-gray-400">{formatDate(withdrawal?.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'subscription') {
                  const action = item.data;
                  const match = typeof action?.reason === 'string' ? action.reason.match(/from (.+) to (.+) - \$/) : null;
                  const buyer = match ? match[1] : 'Unknown';
                  const seller = match ? match[2] : 'Unknown';
                  const adminShare = Number(action?.amount) || 0;
                  const fullAmount = adminShare * 4; // 25% admin share → full price approx
                  return (
                    <div
                      key={`subscription-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-pink-500/30 bg-pink-500/5 p-4 transition-colors hover:border-pink-400/40"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-4">
                        <div className="flex-shrink-0 rounded-xl bg-pink-500/20 p-2 text-pink-300">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">🎉 Subscription Revenue</p>
                          <div className="truncate text-sm text-gray-300">
                            <SecureMessageDisplay content={buyer} allowBasicFormatting={false} className="inline" />
                            <span> → </span>
                            <SecureMessageDisplay content={seller} allowBasicFormatting={false} className="inline" />
                            <span> ({formatCurrency(fullAmount)}/mo)</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="font-bold text-pink-300">+{formatCurrency(adminShare)}</p>
                        <p className="text-xs text-gray-400">{formatDate(action?.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'tier_credit') {
                  const action = item.data;
                  const sellerMatch =
                    (typeof action?.reason === 'string' && (action.reason.match(/to\s+(\S+)/i) || action.reason.match(/for\s+(\S+)/i) || action.reason.match(/seller:\s*(\S+)/i))) ||
                    null;
                  const seller = sellerMatch ? sellerMatch[1] : 'seller';
                  const tierMatch = typeof action?.reason === 'string' ? action.reason.match(/(Tease|Flirt|Obsession|Desire|Goddess)/i) : null;
                  const tierName = tierMatch ? tierMatch[1] : '';
                  const percentMatch = typeof action?.reason === 'string' ? action.reason.match(/(\d+)%/) : null;
                  const bonusPercent = percentMatch ? percentMatch[1] : '';

                  return (
                    <div
                      key={`tier-credit-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4 transition-colors hover:border-yellow-400/40"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-4">
                        <div className="flex-shrink-0 rounded-xl bg-yellow-500/20 p-2 text-yellow-200">
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">🏆 Tier Credit Paid Out</p>
                          <div className="truncate text-sm text-gray-300">
                            <span>To </span>
                            <SecureMessageDisplay content={seller} allowBasicFormatting={false} className="inline" />
                            {tierName && <span> ({tierName} tier)</span>}
                            {bonusPercent && <span> • {bonusPercent}% bonus</span>}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="font-bold text-yellow-200">-{formatCurrency(Math.abs(Number(action?.amount) || 0))}</p>
                        <p className="text-xs text-gray-400">{formatDate(action?.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'auction_completion') {
                  const order = item.data;
                  const base = Number(order?.finalBid ?? order?.price ?? 0);
                  const platformProfit = base * 0.2;
                  return (
                    <div
                      key={`auction-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 transition-colors hover:border-purple-400/40"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-4">
                        <div className="flex-shrink-0 rounded-xl bg-purple-500/20 p-2 text-purple-200">
                          <Gavel className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">🔨 Auction Completed</p>
                          <div className="truncate text-sm text-gray-300">
                            <SecureMessageDisplay content={order?.buyer || 'Unknown'} allowBasicFormatting={false} className="inline" />
                            <span> won "</span>
                            <SecureMessageDisplay content={order?.title || 'Unknown Item'} allowBasicFormatting={false} className="inline" maxLength={50} />
                            <span>" for {formatCurrency(base)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="font-bold text-purple-200">+{formatCurrency(platformProfit)}</p>
                        <p className="text-xs text-gray-400">{formatDate(order?.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'regular_sale') {
                  const order = item.data;
                  const price = Number(order?.price) || 0;
                  const platformProfit = price * 0.2;
                  return (
                    <div
                      key={`sale-${index}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-green-500/30 bg-green-500/5 p-4 transition-colors hover:border-green-400/40"
                    >
                      <div className="min-w-0 flex-1 flex items-center gap-4">
                        <div className="flex-shrink-0 rounded-xl bg-green-500/20 p-2 text-green-300">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">🛍️ Regular Sale</p>
                          <div className="truncate text-sm text-gray-300">
                            <SecureMessageDisplay content={order?.buyer || 'Unknown'} allowBasicFormatting={false} className="inline" />
                            <span> bought "</span>
                            <SecureMessageDisplay content={order?.title || 'Unknown Item'} allowBasicFormatting={false} className="inline" maxLength={50} />
                            <span>" for {formatCurrency(price)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="font-bold text-green-300">+{formatCurrency(platformProfit)}</p>
                        <p className="text-xs text-gray-400">{formatDate(order?.date)}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-12 text-center text-gray-400">
          <Activity className="mx-auto mb-4 h-12 w-12 text-gray-600" />
          <h4 className="mb-2 text-lg font-medium text-gray-300">No Activity Yet</h4>
          <p className="text-sm text-gray-400">
            {timeFilter === 'all'
              ? "Start making money and it'll show up here! 🚀"
              : `No activity for ${getPeriodDisplayName().toLowerCase()}`}
          </p>
        </div>
      )}
    </div>
  );
}
