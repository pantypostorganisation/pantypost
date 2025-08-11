// src/components/admin/wallet/AdminRecentActivity.tsx
'use client';

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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
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

  // Ensure arrays are valid arrays before using them
  const safeDeposits = Array.isArray(filteredDeposits) ? filteredDeposits : [];
  const safeSellerWithdrawals = Array.isArray(filteredSellerWithdrawals) ? filteredSellerWithdrawals : [];
  const safeAdminWithdrawals = Array.isArray(filteredAdminWithdrawals) ? filteredAdminWithdrawals : [];
  const safeActions = Array.isArray(filteredActions) ? filteredActions : [];
  const safeOrders = Array.isArray(filteredOrders) ? filteredOrders : [];

  // Get subscription revenue actions with null checks
  const subscriptionActions = safeActions.filter(action => 
    action && 
    action.type === 'credit' && 
    action.reason && 
    action.reason.toLowerCase().includes('subscription') && 
    action.reason.toLowerCase().includes('revenue')
  );

  // Get tier credit actions (debit from admin for tier bonuses paid out)
  const tierCreditActions = safeActions.filter(action => 
    action && 
    action.type === 'debit' && 
    action.reason && 
    (action.reason.toLowerCase().includes('tier') || 
     action.reason.toLowerCase().includes('bonus'))
  );

  // Get auction completions (not pending auction orders) with null checks
  const auctionCompletions = safeOrders.filter(order => 
    order && 
    order.wasAuction && 
    order.shippingStatus !== 'pending-auction'
  );

  // Get regular sales (not auctions) with null checks
  const regularSales = safeOrders.filter(order => 
    order && 
    !order.wasAuction && 
    order.shippingStatus !== 'pending-auction'
  );

  // Combine and sort all activities
  const allActivities = [
    ...safeDeposits
      .filter(deposit => deposit && deposit.status === 'completed' && deposit.date)
      .map(deposit => ({
        type: 'deposit' as const,
        data: deposit,
        date: deposit.date
      })),
    ...safeSellerWithdrawals
      .filter(withdrawal => withdrawal && withdrawal.date)
      .map(withdrawal => ({
        type: 'seller_withdrawal' as const,
        data: withdrawal,
        date: withdrawal.date
      })),
    ...safeAdminWithdrawals
      .filter(withdrawal => withdrawal && withdrawal.date)
      .map(withdrawal => ({
        type: 'admin_withdrawal' as const,
        data: withdrawal,
        date: withdrawal.date
      })),
    ...subscriptionActions
      .filter(action => action && action.date)
      .map(action => ({
        type: 'subscription' as const,
        data: action,
        date: action.date
      })),
    ...tierCreditActions
      .filter(action => action && action.date)
      .map(action => ({
        type: 'tier_credit' as const,
        data: action,
        date: action.date
      })),
    ...auctionCompletions
      .filter(order => order && order.date)
      .map(order => ({
        type: 'auction_completion' as const,
        data: order,
        date: order.date
      })),
    ...regularSales
      .filter(order => order && order.date)
      .map(order => ({
        type: 'regular_sale' as const,
        data: order,
        date: order.date
      }))
  ]
    .filter(item => item && item.date)
    .sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch {
        return 0;
      }
    })
    .slice(0, 20);

  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#ff950e]" />
          Recent Money Activity
        </h3>
        <div className="text-sm text-gray-400">
          Recent transactions {timeFilter !== 'all' ? `(${getPeriodDisplayName()})` : ''}
        </div>
      </div>
      
      {allActivities.length > 0 ? (
        <div className="overflow-hidden">
          <div className="max-h-80 overflow-y-auto">
            <div className="space-y-3">
              {allActivities.map((item, index) => {
                if (!item || !item.data) return null;

                if (item.type === 'deposit') {
                  const deposit = item.data;
                  return (
                    <div key={`deposit-${index}`} className="flex items-center justify-between p-4 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors border-l-4 border-blue-500/50">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="p-2 rounded-lg flex-shrink-0 bg-blue-500/20 text-blue-400">
                          <Download className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">
                            💳 Deposit Received
                          </p>
                          <div className="text-sm text-gray-400 truncate">
                            <SecureMessageDisplay 
                              content={deposit.username || 'Unknown'} 
                              allowBasicFormatting={false}
                              className="inline"
                            />
                            <span> via {deposit.method?.replace('_', ' ') || 'unknown'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-blue-400">
                          +{formatCurrency(deposit.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(deposit.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'seller_withdrawal') {
                  const withdrawal = item.data;
                  return (
                    <div key={`seller-withdrawal-${index}`} className="flex items-center justify-between p-4 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors border-l-4 border-red-500/50">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="p-2 rounded-lg flex-shrink-0 bg-red-500/20 text-red-400">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">
                            💸 Seller Withdrawal
                          </p>
                          <div className="text-sm text-gray-400 truncate">
                            <SecureMessageDisplay 
                              content={withdrawal.seller || 'Unknown'} 
                              allowBasicFormatting={false}
                              className="inline"
                            />
                            <span> cashed out</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-red-400">
                          -{formatCurrency(withdrawal.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(withdrawal.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'admin_withdrawal') {
                  const withdrawal = item.data;
                  return (
                    <div key={`admin-withdrawal-${index}`} className="flex items-center justify-between p-4 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors border-l-4 border-purple-500/50">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="p-2 rounded-lg flex-shrink-0 bg-purple-500/20 text-purple-400">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">
                            👑 Admin Withdrawal
                          </p>
                          <p className="text-sm text-gray-400 truncate">
                            Platform profit withdrawal
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-purple-400">
                          -{formatCurrency(withdrawal.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(withdrawal.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'subscription') {
                  const action = item.data;
                  // Extract buyer and seller from the reason
                  const match = action.reason?.match(/from (.+) to (.+) - \$/);
                  const buyer = match ? match[1] : 'Unknown';
                  const seller = match ? match[2] : 'Unknown';
                  const fullAmount = (action.amount || 0) * 4; // Admin gets 25%, so multiply by 4 for full amount
                  
                  return (
                    <div key={`subscription-${index}`} className="flex items-center justify-between p-4 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors border-l-4 border-pink-500/50">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="p-2 rounded-lg flex-shrink-0 bg-pink-500/20 text-pink-400">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">
                            🎉 Subscription Revenue
                          </p>
                          <div className="text-sm text-gray-400 truncate">
                            <SecureMessageDisplay 
                              content={buyer} 
                              allowBasicFormatting={false}
                              className="inline"
                            />
                            <span> → </span>
                            <SecureMessageDisplay 
                              content={seller} 
                              allowBasicFormatting={false}
                              className="inline"
                            />
                            <span> ({formatCurrency(fullAmount)}/mo)</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-pink-400">
                          +{formatCurrency(action.amount)}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(action.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'tier_credit') {
                  const action = item.data;
                  // Extract seller from the reason (e.g., "Tier bonus paid to seller123")
                  const sellerMatch = action.reason?.match(/to\s+(\S+)/i) || 
                                     action.reason?.match(/for\s+(\S+)/i) ||
                                     action.reason?.match(/seller:\s*(\S+)/i);
                  const seller = sellerMatch ? sellerMatch[1] : 'seller';
                  
                  // Extract tier info from reason if available
                  const tierMatch = action.reason?.match(/(Tease|Flirt|Obsession|Desire|Goddess)/i);
                  const tierName = tierMatch ? tierMatch[1] : '';
                  
                  // Extract percentage from reason if available
                  const percentMatch = action.reason?.match(/(\d+)%/);
                  const bonusPercent = percentMatch ? percentMatch[1] : '';
                  
                  return (
                    <div key={`tier-credit-${index}`} className="flex items-center justify-between p-4 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors border-l-4 border-yellow-500/50">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="p-2 rounded-lg flex-shrink-0 bg-yellow-500/20 text-yellow-400">
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">
                            🏆 Tier Credit Paid Out
                          </p>
                          <div className="text-sm text-gray-400 truncate">
                            <span>To </span>
                            <SecureMessageDisplay 
                              content={seller} 
                              allowBasicFormatting={false}
                              className="inline"
                            />
                            {tierName && <span> ({tierName} tier)</span>}
                            {bonusPercent && <span> • {bonusPercent}% bonus</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-yellow-400">
                          -{formatCurrency(Math.abs(action.amount))}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(action.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'auction_completion') {
                  const order = item.data;
                  const platformProfit = ((order.finalBid || order.price || 0)) * 0.2; // 20% platform fee
                  
                  return (
                    <div key={`auction-${index}`} className="flex items-center justify-between p-4 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors border-l-4 border-purple-500/50">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="p-2 rounded-lg flex-shrink-0 bg-purple-500/20 text-purple-400">
                          <Gavel className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">
                            🔨 Auction Completed
                          </p>
                          <div className="text-sm text-gray-400 truncate">
                            <SecureMessageDisplay 
                              content={order.buyer || 'Unknown'} 
                              allowBasicFormatting={false}
                              className="inline"
                            />
                            <span> won "</span>
                            <SecureMessageDisplay 
                              content={order.title || 'Unknown Item'} 
                              allowBasicFormatting={false}
                              className="inline"
                              maxLength={50}
                            />
                            <span>" for {formatCurrency(order.finalBid || order.price)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-purple-400">
                          +{formatCurrency(platformProfit)}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(order.date)}</p>
                      </div>
                    </div>
                  );
                } else if (item.type === 'regular_sale') {
                  const order = item.data;
                  const platformProfit = (order.price || 0) * 0.2; // 20% platform fee
                  
                  return (
                    <div key={`sale-${index}`} className="flex items-center justify-between p-4 bg-[#252525] rounded-lg hover:bg-[#2a2a2a] transition-colors border-l-4 border-green-500/50">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="p-2 rounded-lg flex-shrink-0 bg-green-500/20 text-green-400">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white truncate">
                            🛍️ Regular Sale
                          </p>
                          <div className="text-sm text-gray-400 truncate">
                            <SecureMessageDisplay 
                              content={order.buyer || 'Unknown'} 
                              allowBasicFormatting={false}
                              className="inline"
                            />
                            <span> bought "</span>
                            <SecureMessageDisplay 
                              content={order.title || 'Unknown Item'} 
                              allowBasicFormatting={false}
                              className="inline"
                              maxLength={50}
                            />
                            <span>" for {formatCurrency(order.price)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <p className="font-bold text-green-400">
                          +{formatCurrency(platformProfit)}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(order.date)}</p>
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
        <div className="text-center py-12 text-gray-500">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-600" />
          <h4 className="text-lg font-medium text-gray-400 mb-2">No Activity Yet</h4>
          <p className="text-sm">
            {timeFilter === 'all' ? 
              'Start making money and it\'ll show up here! 🚀' : 
              `No activity for ${getPeriodDisplayName().toLowerCase()}`
            }
          </p>
        </div>
      )}
    </div>
  );
}
