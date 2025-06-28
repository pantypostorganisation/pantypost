// src/utils/format.ts

import { Money, ISOTimestamp } from '@/types/common';
import { Transaction } from '@/services/wallet.service.enhanced';

// Define types locally from the Transaction interface
type TransactionType = Transaction['type'];
type TransactionStatus = Transaction['status'];

/**
 * Enhanced formatting utilities with proper Money type support
 */

/**
 * Format Money type to currency string
 * @param amount The Money amount (in cents)
 * @param locale The locale to use (default: 'en-US')
 * @param currency The currency code to use (default: 'USD')
 * @returns A formatted currency string
 */
export function formatMoney(
  amount: Money,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  // Convert from cents to dollars
  const dollars = Money.toDollars(amount);
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(dollars);
}

/**
 * Format Money with sign (+ or -)
 * @param amount The Money amount
 * @param isCredit Whether this is a credit (positive) or debit (negative)
 * @returns Formatted string with sign
 */
export function formatMoneyWithSign(
  amount: Money,
  isCredit: boolean,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  const formatted = formatMoney(amount, locale, currency);
  return isCredit ? `+${formatted}` : `-${formatted}`;
}

/**
 * Format Money range
 * @param min Minimum amount
 * @param max Maximum amount
 * @returns Formatted range string
 */
export function formatMoneyRange(
  min: Money,
  max: Money,
  locale: string = 'en-US',
  currency: string = 'USD'
): string {
  return `${formatMoney(min, locale, currency)} - ${formatMoney(max, locale, currency)}`;
}

/**
 * Format transaction for display
 * @param transaction The transaction to format
 * @param currentUserId The current user's ID to determine credit/debit
 * @returns Formatted transaction display data
 */
export function formatTransaction(
  transaction: Transaction,
  currentUserId?: string
): {
  amount: string;
  type: string;
  status: string;
  date: string;
  time: string;
  description: string;
  isCredit: boolean;
  icon: string;
  color: string;
} {
  // Determine if credit or debit
  const isCredit = transaction.to === currentUserId || 
                   transaction.type === 'deposit' || 
                   transaction.type === 'admin_credit' ||
                   transaction.type === 'tier_credit';

  // Format amount with sign
  const amount = formatMoneyWithSign(transaction.amount, isCredit);

  // Format type
  const typeLabels: Record<TransactionType, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    purchase: 'Purchase',
    sale: 'Sale',
    tip: 'Tip',
    subscription: 'Subscription',
    admin_credit: 'Credit',
    admin_debit: 'Debit',
    refund: 'Refund',
    fee: 'Fee',
    tier_credit: 'Bonus',
  };

  // Format status
  const statusLabels: Record<TransactionStatus, string> = {
    pending: 'Pending',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  };

  // Get icon and color based on type
  const typeConfig = getTransactionTypeConfig(transaction.type);

  return {
    amount,
    type: typeLabels[transaction.type],
    status: statusLabels[transaction.status],
    date: formatShortDate(transaction.createdAt),
    time: formatTime(transaction.createdAt),
    description: transaction.description,
    isCredit,
    icon: typeConfig.icon,
    color: typeConfig.color,
  };
}

/**
 * Get transaction type configuration
 */
function getTransactionTypeConfig(type: TransactionType): {
  icon: string;
  color: string;
} {
  const config: Record<TransactionType, { icon: string; color: string }> = {
    deposit: { icon: 'download', color: 'text-green-500' },
    withdrawal: { icon: 'upload', color: 'text-red-500' },
    purchase: { icon: 'shopping-bag', color: 'text-blue-500' },
    sale: { icon: 'tag', color: 'text-green-500' },
    tip: { icon: 'gift', color: 'text-purple-500' },
    subscription: { icon: 'repeat', color: 'text-indigo-500' },
    admin_credit: { icon: 'plus-circle', color: 'text-green-500' },
    admin_debit: { icon: 'minus-circle', color: 'text-red-500' },
    refund: { icon: 'rotate-ccw', color: 'text-orange-500' },
    fee: { icon: 'percent', color: 'text-gray-500' },
    tier_credit: { icon: 'star', color: 'text-yellow-500' },
  };

  return config[type] || { icon: 'circle', color: 'text-gray-500' };
}

/**
 * Format percentage with proper decimal places
 * @param value The percentage value (0-100)
 * @param decimals Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format transaction fee breakdown
 * @param amount The total amount
 * @param feePercent The fee percentage (0-1)
 * @returns Object with formatted amounts
 */
export function formatFeeBreakdown(
  amount: Money,
  feePercent: number
): {
  total: string;
  fee: string;
  net: string;
  feePercentage: string;
} {
  const fee = Math.floor(amount * feePercent) as Money;
  const net = (amount - fee) as Money;

  return {
    total: formatMoney(amount),
    fee: formatMoney(fee),
    net: formatMoney(net),
    feePercentage: formatPercentage(feePercent * 100),
  };
}

/**
 * Format wallet balance with status
 * @param balance Current balance
 * @param available Available balance
 * @param pending Pending balance
 * @returns Formatted balance display
 */
export function formatWalletBalance(
  balance: Money,
  available: Money,
  pending: Money
): {
  balance: string;
  available: string;
  pending: string;
  hasRestriction: boolean;
  restrictionAmount: string;
} {
  const restriction = balance - available - pending;
  
  return {
    balance: formatMoney(balance),
    available: formatMoney(available),
    pending: formatMoney(pending),
    hasRestriction: restriction > 0,
    restrictionAmount: formatMoney(restriction as Money),
  };
}

/**
 * Format daily/monthly limits
 * @param used Amount used
 * @param limit Total limit
 * @returns Formatted limit display
 */
export function formatLimit(
  used: Money,
  limit: Money
): {
  used: string;
  limit: string;
  remaining: string;
  percentage: number;
  percentageFormatted: string;
  isExceeded: boolean;
} {
  const remaining = Math.max(0, limit - used) as Money;
  const percentage = limit > 0 ? (Money.toDollars(used) / Money.toDollars(limit)) * 100 : 0;
  
  return {
    used: formatMoney(used),
    limit: formatMoney(limit),
    remaining: formatMoney(remaining),
    percentage,
    percentageFormatted: formatPercentage(percentage),
    isExceeded: used > limit,
  };
}

/**
 * Format risk score
 * @param score Risk score (0-100)
 * @returns Formatted risk display
 */
export function formatRiskScore(score: number): {
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  color: string;
  label: string;
} {
  let level: 'low' | 'medium' | 'high' | 'critical';
  let color: string;
  let label: string;

  if (score < 25) {
    level = 'low';
    color = 'text-green-500';
    label = 'Low Risk';
  } else if (score < 50) {
    level = 'medium';
    color = 'text-yellow-500';
    label = 'Medium Risk';
  } else if (score < 75) {
    level = 'high';
    color = 'text-orange-500';
    label = 'High Risk';
  } else {
    level = 'critical';
    color = 'text-red-500';
    label = 'Critical Risk';
  }

  return { score, level, color, label };
}

/**
 * Format reconciliation result
 * @param current Current balance
 * @param calculated Calculated balance
 * @returns Formatted reconciliation display
 */
export function formatReconciliation(
  current: Money,
  calculated: Money
): {
  current: string;
  calculated: string;
  discrepancy: string;
  isReconciled: boolean;
  discrepancyType: 'over' | 'under' | 'none';
} {
  const discrepancy = (current - calculated) as Money;
  
  return {
    current: formatMoney(current),
    calculated: formatMoney(calculated),
    discrepancy: formatMoney(Math.abs(discrepancy) as Money),
    isReconciled: discrepancy === 0,
    discrepancyType: discrepancy > 0 ? 'over' : discrepancy < 0 ? 'under' : 'none',
  };
}

/**
 * Format date helpers (enhanced versions)
 */
export function formatShortDate(date: string | Date | ISOTimestamp): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return dateObj.toLocaleDateString(undefined, { weekday: 'long' });
  }
  
  return dateObj.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatTime(date: string | Date | ISOTimestamp): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid time';
  }
  
  return dateObj.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format transaction summary
 * @param transactions Array of transactions
 * @returns Summary statistics
 */
export function formatTransactionSummary(
  transactions: Transaction[]
): {
  totalIn: string;
  totalOut: string;
  netFlow: string;
  count: number;
  averageSize: string;
} {
  let totalIn = 0;
  let totalOut = 0;
  
  transactions.forEach(t => {
    if (t.status === 'completed') {
      if (t.type === 'deposit' || t.type === 'admin_credit' || t.type === 'tier_credit') {
        totalIn += t.amount;
      } else if (t.type === 'withdrawal' || t.type === 'admin_debit') {
        totalOut += t.amount;
      }
    }
  });
  
  const netFlow = (totalIn - totalOut) as Money;
  const averageSize = transactions.length > 0 
    ? Math.floor(transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length) as Money
    : 0 as Money;
  
  return {
    totalIn: formatMoney(totalIn as Money),
    totalOut: formatMoney(totalOut as Money),
    netFlow: formatMoneyWithSign(netFlow, netFlow >= 0),
    count: transactions.length,
    averageSize: formatMoney(averageSize),
  };
}

// Re-export original format utilities
