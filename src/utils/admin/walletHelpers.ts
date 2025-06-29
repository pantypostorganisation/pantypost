// src/utils/admin/walletHelpers.ts

import { Order, DepositLog } from '@/context/WalletContext';

/**
 * Admin Action type for analytics
 */
type AdminAction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  targetUser?: string;
  username?: string;
  adminUser: string;
  reason: string;
  date: string;
  role: 'buyer' | 'seller';
};

/**
 * Withdrawal type
 */
type Withdrawal = {
  amount: number;
  date: string;
  status?: 'pending' | 'completed' | 'failed';
  method?: string;
};

/**
 * Time filter type
 */
export type TimeFilter = 'today' | 'week' | 'month' | '3months' | 'year' | 'all';

/**
 * Filtered data result
 */
export interface FilteredData {
  orders: Order[];
  deposits: DepositLog[];
  adminActions: AdminAction[];
  withdrawals: (Withdrawal & { seller: string })[];
  dateRange: {
    start: Date;
    end: Date;
  };
}

/**
 * Revenue chart data point
 */
export interface RevenueDataPoint {
  date: string;
  revenue: number;
  sales: number;
  label?: string;
}

/**
 * Withdrawal metrics result
 */
export interface WithdrawalMetrics {
  totalSellerWithdrawals: number;
  totalAdminWithdrawals: number;
  totalWithdrawals: number;
  withdrawalCount: number;
  averageWithdrawal: number;
}

/**
 * Get time-filtered data for admin analytics
 */
export function getTimeFilteredData(
  orders: Order[],
  deposits: DepositLog[],
  adminActions: AdminAction[],
  timeFilter: TimeFilter
): FilteredData {
  const now = new Date();
  const startDate = new Date();
  const endDate = new Date();

  // Set start date based on filter
  switch (timeFilter) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
      startDate.setFullYear(2020); // Set to a very early date
      break;
  }

  // Filter data by date range
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.date);
    return orderDate >= startDate && orderDate <= endDate;
  });

  const filteredDeposits = deposits.filter(deposit => {
    const depositDate = new Date(deposit.date);
    return depositDate >= startDate && depositDate <= endDate;
  });

  const filteredAdminActions = adminActions.filter(action => {
    const actionDate = new Date(action.date);
    return actionDate >= startDate && actionDate <= endDate;
  });

  // Empty withdrawals for now - to be populated by calling function if needed
  const filteredWithdrawals: (Withdrawal & { seller: string })[] = [];

  return {
    orders: filteredOrders,
    deposits: filteredDeposits,
    adminActions: filteredAdminActions,
    withdrawals: filteredWithdrawals,
    dateRange: {
      start: startDate,
      end: endDate,
    },
  };
}

/**
 * Calculate platform profit from orders
 */
export function calculatePlatformProfit(orders: Order[]): number {
  return orders.reduce((sum, order) => {
    const revenue = order.markedUpPrice || order.price;
    const platformFee = revenue * 0.1; // 10% platform fee
    return sum + platformFee;
  }, 0);
}

/**
 * Calculate total revenue from orders
 */
export function calculateTotalRevenue(orders: Order[]): number {
  return orders.reduce((sum, order) => {
    return sum + (order.markedUpPrice || order.price);
  }, 0);
}

/**
 * Calculate subscription revenue from admin actions
 */
export function calculateSubscriptionRevenue(adminActions: AdminAction[]): number {
  return adminActions
    .filter(action => 
      action.type === 'credit' && 
      action.reason && 
      action.reason.toLowerCase().includes('subscription')
    )
    .reduce((sum, action) => sum + action.amount, 0);
}

/**
 * Calculate subscription profit (platform fee from subscriptions)
 */
export function calculateSubscriptionProfit(adminActions: AdminAction[]): number {
  const subscriptionRevenue = calculateSubscriptionRevenue(adminActions);
  return subscriptionRevenue * 0.25; // 25% platform fee for subscriptions
}

/**
 * Calculate total withdrawals with proper typing
 */
export function calculateWithdrawals(
  sellerWithdrawals: { [username: string]: Withdrawal[] },
  adminWithdrawals: Withdrawal[]
): WithdrawalMetrics {
  const sellerWithdrawalsList = getAllSellerWithdrawals(sellerWithdrawals)
    .filter(w => w.status === 'completed');
  
  const completedAdminWithdrawals = adminWithdrawals
    .filter(w => w.status === 'completed');
  
  const totalSellerWithdrawals = sellerWithdrawalsList.reduce((sum, w) => sum + w.amount, 0);
  const totalAdminWithdrawals = completedAdminWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalWithdrawals = totalSellerWithdrawals + totalAdminWithdrawals;
  const withdrawalCount = sellerWithdrawalsList.length + completedAdminWithdrawals.length;
  const averageWithdrawal = withdrawalCount > 0 ? totalWithdrawals / withdrawalCount : 0;

  return {
    totalSellerWithdrawals,
    totalAdminWithdrawals,
    totalWithdrawals,
    withdrawalCount,
    averageWithdrawal,
  };
}

/**
 * Get previous period data for comparison - FIXED signature
 */
export function getPreviousPeriodData(
  orders: Order[],
  deposits: DepositLog[],
  adminActions: AdminAction[],
  timeFilter: TimeFilter
): FilteredData {
  const now = new Date();
  let periodLength: number;
  
  // Calculate period length in days
  switch (timeFilter) {
    case 'today':
      periodLength = 1;
      break;
    case 'week':
      periodLength = 7;
      break;
    case 'month':
      periodLength = 30;
      break;
    case '3months':
      periodLength = 90;
      break;
    case 'year':
      periodLength = 365;
      break;
    default:
      periodLength = 30;
  }

  // Calculate previous period dates
  const previousEndDate = new Date(now);
  previousEndDate.setDate(previousEndDate.getDate() - periodLength);
  
  const previousStartDate = new Date(previousEndDate);
  previousStartDate.setDate(previousStartDate.getDate() - periodLength);

  // Filter data for previous period
  const previousOrders = orders.filter(order => {
    const orderDate = new Date(order.date);
    return orderDate >= previousStartDate && orderDate <= previousEndDate;
  });

  const previousDeposits = deposits.filter(deposit => {
    const depositDate = new Date(deposit.date);
    return depositDate >= previousStartDate && depositDate <= previousEndDate;
  });

  const previousAdminActions = adminActions.filter(action => {
    const actionDate = new Date(action.date);
    return actionDate >= previousStartDate && actionDate <= previousEndDate;
  });

  return {
    orders: previousOrders,
    deposits: previousDeposits,
    adminActions: previousAdminActions,
    withdrawals: [], // Empty for now
    dateRange: {
      start: previousStartDate,
      end: previousEndDate,
    },
  };
}

/**
 * Get revenue by day for charts - FIXED signature
 */
export function getRevenueByDay(orders: Order[], days: number = 30): RevenueDataPoint[] {
  const now = new Date();
  const chartData: RevenueDataPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate.toISOString().split('T')[0] === dateString;
    });

    const revenue = dayOrders.reduce((sum, order) => sum + (order.markedUpPrice || order.price), 0);

    chartData.push({
      date: dateString,
      revenue,
      sales: dayOrders.length,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }

  return chartData;
}

/**
 * Get all seller withdrawals from the complex nested structure
 */
export function getAllSellerWithdrawals(sellerWithdrawals: { [username: string]: Withdrawal[] }): (Withdrawal & { seller: string })[] {
  const allWithdrawals: (Withdrawal & { seller: string })[] = [];

  for (const [seller, withdrawals] of Object.entries(sellerWithdrawals)) {
    if (Array.isArray(withdrawals)) {
      withdrawals.forEach(withdrawal => {
        allWithdrawals.push({
          ...withdrawal,
          seller,
        });
      });
    }
  }

  return allWithdrawals;
}

/**
 * Calculate revenue metrics for a time period
 */
export function calculateRevenueMetrics(orders: Order[]): {
  totalSales: number;
  totalRevenue: number;
  platformFees: number;
  averageOrderValue: number;
  sellerEarnings: number;
} {
  const totalSales = orders.length;
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + (order.markedUpPrice || order.price);
  }, 0);

  // Assuming 10% platform fee
  const platformFees = totalRevenue * 0.1;
  const sellerEarnings = totalRevenue * 0.9;
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

  return {
    totalSales,
    totalRevenue,
    platformFees,
    averageOrderValue,
    sellerEarnings,
  };
}

/**
 * Calculate deposit metrics
 */
export function calculateDepositMetrics(deposits: DepositLog[]): {
  totalDeposits: number;
  completedDeposits: number;
  pendingDeposits: number;
  failedDeposits: number;
  totalAmount: number;
  averageAmount: number;
} {
  const completedDeposits = deposits.filter(d => d.status === 'completed');
  const pendingDeposits = deposits.filter(d => d.status === 'pending');
  const failedDeposits = deposits.filter(d => d.status === 'failed');

  const totalAmount = completedDeposits.reduce((sum, deposit) => sum + deposit.amount, 0);
  const averageAmount = completedDeposits.length > 0 ? totalAmount / completedDeposits.length : 0;

  return {
    totalDeposits: deposits.length,
    completedDeposits: completedDeposits.length,
    pendingDeposits: pendingDeposits.length,
    failedDeposits: failedDeposits.length,
    totalAmount,
    averageAmount,
  };
}

/**
 * Get top sellers by revenue
 */
export function getTopSellers(orders: Order[], limit: number = 10): {
  seller: string;
  totalSales: number;
  totalRevenue: number;
  averageOrderValue: number;
}[] {
  const sellerStats: { [seller: string]: { sales: number; revenue: number } } = {};

  orders.forEach(order => {
    if (!sellerStats[order.seller]) {
      sellerStats[order.seller] = { sales: 0, revenue: 0 };
    }
    
    sellerStats[order.seller].sales += 1;
    sellerStats[order.seller].revenue += (order.markedUpPrice || order.price);
  });

  return Object.entries(sellerStats)
    .map(([seller, stats]) => ({
      seller,
      totalSales: stats.sales,
      totalRevenue: stats.revenue,
      averageOrderValue: stats.sales > 0 ? stats.revenue / stats.sales : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
}

/**
 * Get top buyers by spending
 */
export function getTopBuyers(orders: Order[], limit: number = 10): {
  buyer: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
}[] {
  const buyerStats: { [buyer: string]: { orders: number; spent: number } } = {};

  orders.forEach(order => {
    if (!buyerStats[order.buyer]) {
      buyerStats[order.buyer] = { orders: 0, spent: 0 };
    }
    
    buyerStats[order.buyer].orders += 1;
    buyerStats[order.buyer].spent += (order.markedUpPrice || order.price);
  });

  return Object.entries(buyerStats)
    .map(([buyer, stats]) => ({
      buyer,
      totalOrders: stats.orders,
      totalSpent: stats.spent,
      averageOrderValue: stats.orders > 0 ? stats.spent / stats.orders : 0,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

/**
 * Generate daily revenue chart data
 */
export function generateDailyRevenueData(orders: Order[], days: number = 30): RevenueDataPoint[] {
  return getRevenueByDay(orders, days);
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
}

/**
 * Get date range display text
 */
export function getDateRangeText(timeFilter: TimeFilter): string {
  const now = new Date();
  
  switch (timeFilter) {
    case 'today':
      return now.toLocaleDateString();
    case 'week':
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return `${weekAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;
    case 'month':
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return `${monthAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;
    case '3months':
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return `${threeMonthsAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;
    case 'year':
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return `${yearAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`;
    case 'all':
      return 'All Time';
    default:
      return 'Unknown Range';
  }
}
