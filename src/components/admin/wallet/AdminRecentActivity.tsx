// src/components/admin/wallet/AdminRecentActivity.tsx
'use client';

import { Clock, Download, Upload, Wallet, Activity } from 'lucide-react';

interface AdminRecentActivityProps {
  timeFilter: string;
  filteredDeposits: any[];
  filteredSellerWithdrawals: any[];
  filteredAdminWithdrawals: any[];
}

export default function AdminRecentActivity({
  timeFilter,
  filteredDeposits,
  filteredSellerWithdrawals,
  filteredAdminWithdrawals
}: AdminRecentActivityProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Combine and sort all activities
  const allActivities = [
    ...filteredDeposits
      .filter(deposit => deposit.status === 'completed')
      .map(deposit => ({
        type: 'deposit' as const,
        data: deposit,
        date: deposit.date
      })),
    ...filteredSellerWithdrawals
      .map(withdrawal => ({
        type: 'seller_withdrawal' as const,
        data: withdrawal,
        date: withdrawal.date
      })),
    ...filteredAdminWithdrawals
      .map(withdrawal => ({
        type: 'admin_withdrawal' as const,
        data: withdrawal,
        date: withdrawal.date
      }))
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
                          <p className="text-sm text-gray-400 truncate">
                            {deposit.username} via {deposit.method.replace('_', ' ')}
                          </p>
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
                          <p className="text-sm text-gray-400 truncate">
                            {withdrawal.seller} cashed out
                          </p>
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
                } else {
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
                }
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
