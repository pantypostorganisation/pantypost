// src/app/admin/withdrawals/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Filter,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

interface Withdrawal {
  id: string;
  username: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'processing';
  createdAt: string;
  completedAt?: string;
  metadata?: {
    accountDetails?: any;
    notes?: string;
    adminUsername?: string;
  };
  sellerDetails?: {
    email: string;
    verified: boolean;
    tier: string;
  };
}

interface WeeklyData {
  weekStart: Date;
  weekEnd: Date;
  weekLabel: string;
  pendingWithdrawals: Withdrawal[];
  completedWithdrawals: Withdrawal[];
  totalPending: number;
  totalCompleted: number;
  sellerCount: number;
  averageAmount: number;
}

const TIMEZONE = 'America/Chicago'; // Central Time

export default function AdminWithdrawalsPage() {
  const { user, apiClient } = useAuth();
  const router = useRouter();
  
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState<'pending' | 'completed' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalPendingAmount: 0,
    totalCompletedThisWeek: 0,
    pendingCount: 0,
    averageWithdrawal: 0,
    weekOverWeekChange: 0
  });

  // Check if user is admin
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.username !== 'oakley' && user.username !== 'gerome')) {
      router.push('/');
    }
  }, [user, router]);

  // Get current week boundaries in CST
  const getWeekBoundaries = useCallback((weekOffset: number = 0) => {
    const now = new Date();
    const cstNow = toZonedTime(now, TIMEZONE);
    
    // Adjust for week offset
    const targetDate = weekOffset === 0 ? cstNow : addWeeks(cstNow, weekOffset);
    
    // Get Monday 00:00:00 CST
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const weekStartCST = startOfDay(weekStart);
    
    // Get Sunday 23:59:59 CST
    const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
    const weekEndCST = endOfDay(weekEnd);
    
    return { weekStart: weekStartCST, weekEnd: weekEndCST };
  }, []);

  // Fetch withdrawals from API
  const fetchWithdrawals = useCallback(async () => {
    if (!apiClient) return;
    
    try {
      // Fetch all withdrawals (both seller and admin)
      const response = await apiClient.get('/wallet/admin/analytics?timeFilter=all');
      
      if (response.success && response.data) {
        const allWithdrawals: Withdrawal[] = [];
        
        // Process seller withdrawals
        if (response.data.sellerWithdrawals) {
          Object.entries(response.data.sellerWithdrawals).forEach(([username, userWithdrawals]: [string, any]) => {
            if (Array.isArray(userWithdrawals)) {
              userWithdrawals.forEach((w: any) => {
                allWithdrawals.push({
                  id: `${username}_${w.date}`,
                  username,
                  amount: w.amount,
                  status: w.status || 'pending',
                  createdAt: w.date,
                  completedAt: w.status === 'completed' ? w.date : undefined,
                  metadata: {
                    accountDetails: w.accountDetails,
                    notes: w.notes
                  },
                  sellerDetails: response.data.users?.[username] ? {
                    email: response.data.users[username].email || '',
                    verified: response.data.users[username].verified || false,
                    tier: response.data.users[username].tier || 'Tease'
                  } : undefined
                });
              });
            }
          });
        }
        
        // Sort by date (newest first)
        allWithdrawals.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        setWithdrawals(allWithdrawals);
      }
    } catch (error) {
      console.error('Failed to fetch withdrawals:', error);
    }
  }, [apiClient]);

  // Load data on mount and when refreshing
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchWithdrawals();
      setLoading(false);
    };
    
    loadData();
  }, [fetchWithdrawals]);

  // Calculate weekly data
  const weeklyData = useMemo((): WeeklyData => {
    const { weekStart, weekEnd } = getWeekBoundaries(selectedWeekOffset);
    
    // Filter withdrawals for the selected week
    const weekWithdrawals = withdrawals.filter(w => {
      const withdrawalDate = toZonedTime(parseISO(w.createdAt), TIMEZONE);
      return isWithinInterval(withdrawalDate, { start: weekStart, end: weekEnd });
    });
    
    const pendingWithdrawals = weekWithdrawals.filter(w => w.status === 'pending');
    const completedWithdrawals = weekWithdrawals.filter(w => w.status === 'completed');
    
    const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalCompleted = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    const uniqueSellers = new Set(weekWithdrawals.map(w => w.username));
    const averageAmount = weekWithdrawals.length > 0 
      ? (totalPending + totalCompleted) / weekWithdrawals.length 
      : 0;
    
    const weekLabel = selectedWeekOffset === 0 
      ? 'Current Week'
      : selectedWeekOffset > 0
      ? `Week of ${format(weekStart, 'MMM d')}`
      : `Week of ${format(weekStart, 'MMM d')}`;
    
    return {
      weekStart,
      weekEnd,
      weekLabel,
      pendingWithdrawals,
      completedWithdrawals,
      totalPending,
      totalCompleted,
      sellerCount: uniqueSellers.size,
      averageAmount
    };
  }, [withdrawals, selectedWeekOffset, getWeekBoundaries]);

  // Filter displayed withdrawals
  const displayedWithdrawals = useMemo(() => {
    let filtered = viewMode === 'pending' 
      ? weeklyData.pendingWithdrawals
      : viewMode === 'completed'
      ? weeklyData.completedWithdrawals
      : [...weeklyData.pendingWithdrawals, ...weeklyData.completedWithdrawals];
    
    if (searchTerm) {
      filtered = filtered.filter(w => 
        w.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [weeklyData, viewMode, searchTerm]);

  // Calculate stats
  useEffect(() => {
    const allPending = withdrawals.filter(w => w.status === 'pending');
    const totalPendingAmount = allPending.reduce((sum, w) => sum + w.amount, 0);
    
    // Get previous week data for comparison
    const { weekStart: prevWeekStart, weekEnd: prevWeekEnd } = getWeekBoundaries(-1);
    const prevWeekWithdrawals = withdrawals.filter(w => {
      const date = toZonedTime(parseISO(w.createdAt), TIMEZONE);
      return isWithinInterval(date, { start: prevWeekStart, end: prevWeekEnd });
    });
    const prevWeekTotal = prevWeekWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    const currentWeekTotal = weeklyData.totalPending + weeklyData.totalCompleted;
    const weekOverWeekChange = prevWeekTotal > 0 
      ? ((currentWeekTotal - prevWeekTotal) / prevWeekTotal) * 100 
      : 0;
    
    setStats({
      totalPendingAmount,
      totalCompletedThisWeek: weeklyData.totalCompleted,
      pendingCount: allPending.length,
      averageWithdrawal: withdrawals.length > 0 
        ? totalPendingAmount / allPending.length 
        : 0,
      weekOverWeekChange
    });
  }, [withdrawals, weeklyData, getWeekBoundaries]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchWithdrawals();
    setRefreshing(false);
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvData = displayedWithdrawals.map(w => ({
      'Seller': w.username,
      'Amount': `$${w.amount.toFixed(2)}`,
      'Status': w.status,
      'Date Requested': format(parseISO(w.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      'Week': weeklyData.weekLabel
    }));
    
    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `withdrawals_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-[#ff950e] animate-spin" />
          <p className="text-gray-400">Loading withdrawal data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#111]/90 to-[#1a1a1a]/90 rounded-2xl p-6 border border-[#ff950e]/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Tracking</h1>
              <p className="text-gray-400">Manage weekly seller payouts and track withdrawal requests</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-[#1a1a1a] border border-[#ff950e]/30 text-[#ff950e] rounded-lg hover:bg-[#222] transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-[#ff950e] text-black rounded-lg hover:bg-[#ff6b00] transition-colors flex items-center gap-2 font-semibold"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-black/40 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total to Pay</p>
                  <p className="text-2xl font-bold text-[#ff950e]">
                    ${weeklyData.totalPending.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {weeklyData.pendingWithdrawals.length} pending requests
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-[#ff950e]/50" />
              </div>
            </div>

            <div className="bg-black/40 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Week Total</p>
                  <p className="text-2xl font-bold text-white">
                    ${(weeklyData.totalPending + weeklyData.totalCompleted).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {weeklyData.sellerCount} sellers
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-white/50" />
              </div>
            </div>

            <div className="bg-black/40 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Average Amount</p>
                  <p className="text-2xl font-bold text-white">
                    ${weeklyData.averageAmount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">per withdrawal</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400/50" />
              </div>
            </div>

            <div className="bg-black/40 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Week Change</p>
                  <p className="text-2xl font-bold text-white flex items-center gap-1">
                    {stats.weekOverWeekChange > 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    )}
                    {Math.abs(stats.weekOverWeekChange).toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">vs last week</p>
                </div>
                <Wallet className="w-8 h-8 text-purple-400/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="bg-[#111]/90 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedWeekOffset(selectedWeekOffset - 1)}
              className="p-2 bg-[#1a1a1a] border border-[#ff950e]/30 text-[#ff950e] rounded-lg hover:bg-[#222] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">{weeklyData.weekLabel}</h2>
              <p className="text-sm text-gray-400">
                {formatInTimeZone(weeklyData.weekStart, TIMEZONE, 'MMM d, yyyy')} - {formatInTimeZone(weeklyData.weekEnd, TIMEZONE, 'MMM d, yyyy')}
              </p>
              <p className="text-xs text-gray-500 mt-1">Central Time (CST)</p>
            </div>
            
            <button
              onClick={() => setSelectedWeekOffset(selectedWeekOffset + 1)}
              disabled={selectedWeekOffset >= 0}
              className="p-2 bg-[#1a1a1a] border border-[#ff950e]/30 text-[#ff950e] rounded-lg hover:bg-[#222] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {selectedWeekOffset !== 0 && (
            <button
              onClick={() => setSelectedWeekOffset(0)}
              className="w-full mt-3 py-2 bg-[#ff950e]/10 border border-[#ff950e]/30 text-[#ff950e] rounded-lg hover:bg-[#ff950e]/20 transition-colors text-sm"
            >
              Return to Current Week
            </button>
          )}
        </div>

        {/* Important Notice */}
        {weeklyData.totalPending > 0 && selectedWeekOffset === 0 && (
          <div className="bg-gradient-to-r from-[#ff950e]/20 to-[#ff6b00]/20 rounded-xl p-4 border border-[#ff950e]/40">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#ff950e] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-[#ff950e] mb-1">Action Required for Monday Payout</h3>
                <p className="text-sm text-gray-300">
                  Transfer <span className="font-bold text-white">${weeklyData.totalPending.toFixed(2)}</span> from Mercury to Wise 
                  to cover {weeklyData.pendingWithdrawals.length} pending withdrawal{weeklyData.pendingWithdrawals.length !== 1 ? 's' : ''}.
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Cutoff: Sunday 11:59 PM CST • Next payout: Monday
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters and View Mode */}
        <div className="bg-[#111]/90 rounded-xl p-4 border border-white/10">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setViewMode('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'pending'
                    ? 'bg-[#ff950e] text-black'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                Pending ({weeklyData.pendingWithdrawals.length})
              </button>
              <button
                onClick={() => setViewMode('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                Completed ({weeklyData.completedWithdrawals.length})
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                All ({weeklyData.pendingWithdrawals.length + weeklyData.completedWithdrawals.length})
              </button>
            </div>
            
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by seller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-[#ff950e]/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Withdrawals List */}
        <div className="bg-[#111]/90 rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Seller</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Date Requested</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-400">Details</th>
                </tr>
              </thead>
              <tbody>
                {displayedWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <Wallet className="w-12 h-12 text-gray-600" />
                        <p>No withdrawals found for this period</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#ff950e]/20 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-[#ff950e]" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{withdrawal.username}</p>
                            {withdrawal.sellerDetails && (
                              <p className="text-xs text-gray-500">
                                {withdrawal.sellerDetails.verified && '✓ Verified'} • Tier: {withdrawal.sellerDetails.tier}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-semibold text-white">
                          ${withdrawal.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                          withdrawal.status === 'pending'
                            ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-400/30'
                            : withdrawal.status === 'completed'
                            ? 'bg-green-900/30 text-green-400 border border-green-400/30'
                            : withdrawal.status === 'processing'
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-400/30'
                            : 'bg-red-900/30 text-red-400 border border-red-400/30'
                        }`}>
                          {withdrawal.status === 'pending' && <Clock className="w-3 h-3" />}
                          {withdrawal.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {withdrawal.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-400">
                          {formatInTimeZone(parseISO(withdrawal.createdAt), TIMEZONE, 'MMM d, yyyy')}
                          <br />
                          <span className="text-xs text-gray-500">
                            {formatInTimeZone(parseISO(withdrawal.createdAt), TIMEZONE, 'h:mm a zzz')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-[#ff950e] hover:text-[#ff6b00] text-sm font-medium transition-colors">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        {displayedWithdrawals.length > 0 && (
          <div className="bg-gradient-to-r from-[#111]/90 to-[#1a1a1a]/90 rounded-xl p-6 border border-[#ff950e]/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Displayed Total</p>
                <p className="text-2xl font-bold text-white">
                  ${displayedWithdrawals.reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Number of Requests</p>
                <p className="text-2xl font-bold text-white">{displayedWithdrawals.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Unique Sellers</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(displayedWithdrawals.map(w => w.username)).size}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}