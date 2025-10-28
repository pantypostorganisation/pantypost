// src/types/wallet.ts

import { Money, UserId, ISOTimestamp, OrderId, ListingId } from './common';

/**
 * Enhanced wallet types with proper financial safety
 */

// Transaction types
export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'purchase' 
  | 'sale' 
  | 'tip' 
  | 'subscription'
  | 'admin_credit' 
  | 'admin_debit' 
  | 'refund' 
  | 'fee' 
  | 'tier_credit';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface TransactionMetadata {
  orderId?: OrderId;
  listingId?: ListingId;
  subscriptionId?: string;
  paymentMethod?: PaymentMethod;
  bankAccount?: BankAccountDetails;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
  platformFee?: Money;
  tierCreditAmount?: Money;
  originalAmount?: Money;
  refundReason?: string;
  adminUsername?: string;
}

export interface BankAccountDetails {
  accountNumber: string; // Masked
  routingNumber: string;
  accountHolderName: string;
  accountType?: 'checking' | 'savings';
  bankName?: string;
  country: string;
  currency?: string;
}

export type PaymentMethod = 
  | 'credit_card' 
  | 'debit_card'
  | 'bank_transfer' 
  | 'paypal'
  | 'crypto' 
  | 'admin_credit';

// Wallet interfaces
export interface WalletBalance {
  userId: UserId;
  balance: Money;
  availableBalance: Money;
  pendingBalance: Money;
  reservedBalance: Money;
  role: 'buyer' | 'seller' | 'admin';
  currency: string;
  lastUpdated: ISOTimestamp;
}

export interface WalletSummary {
  balance: WalletBalance;
  recentTransactions: Transaction[];
  dailyLimits: {
    deposit: { used: Money; limit: Money; remaining: Money };
    withdrawal: { used: Money; limit: Money; remaining: Money };
  };
  monthlyVolume: Money;
  pendingTransactionsCount: number;
}

// Transaction interfaces
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: Money;
  from?: UserId;
  to?: UserId;
  fromRole?: 'buyer' | 'seller' | 'admin';
  toRole?: 'buyer' | 'seller' | 'admin';
  description: string;
  status: TransactionStatus;
  createdAt: ISOTimestamp;
  completedAt?: ISOTimestamp;
  failedAt?: ISOTimestamp;
  cancelledAt?: ISOTimestamp;
  errorMessage?: string;
  errorCode?: string;
  metadata?: TransactionMetadata;
  idempotencyKey?: string;
  reversalOf?: string;
  reversedBy?: string;
  feesApplied?: TransactionFee[];
}

export interface TransactionFee {
  type: 'platform' | 'processing' | 'international' | 'rush';
  amount: Money;
  percentage?: number;
  description: string;
}

// Order type for compatibility
export interface Order {
  id: string;
  title: string;
  description: string;
  price: number;
  markedUpPrice: number;
  imageUrl?: string;
  date: string;
  seller: string;
  buyer: string;
  tags?: string[];
  wearTime?: string;
  wasAuction?: boolean;
  finalBid?: number;
  deliveryAddress?: DeliveryAddress;
  shippingStatus?: 'pending' | 'processing' | 'shipped' | 'pending-auction';
  tierCreditAmount?: number;
  isCustomRequest?: boolean;
  originalRequestId?: string;
  listingId?: string;
  listingTitle?: string;
  quantity?: number;
}

export interface DeliveryAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  specialInstructions?: string;
}

// Request interfaces
export interface DepositRequest {
  userId: UserId;
  amount: Money;
  method: PaymentMethod;
  paymentDetails?: PaymentDetails;
  notes?: string;
  idempotencyKey?: string;
}

export interface PaymentDetails {
  cardLast4?: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  billingAddress?: BillingAddress;
  cryptoWallet?: string;
  cryptoTransactionHash?: string;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface WithdrawalRequest {
  userId: UserId;
  amount: Money;
  method: 'bank_transfer' | 'paypal' | 'crypto' | 'check';
  accountDetails: BankAccountDetails | PayPalDetails | CryptoDetails;
  priority?: 'standard' | 'rush';
  idempotencyKey?: string;
}

export interface PayPalDetails {
  email: string;
  accountId?: string;
}

export interface CryptoDetails {
  walletAddress: string;
  network: 'bitcoin' | 'ethereum' | 'usdc' | 'other';
  memo?: string;
}

export interface TransferRequest {
  from: UserId;
  to: UserId;
  amount: Money;
  type: 'purchase' | 'tip' | 'subscription' | 'refund';
  description: string;
  metadata?: TransactionMetadata;
  idempotencyKey?: string;
  platformFeePercent?: number;
  skipFees?: boolean;
}

// Financial reports
export interface FinancialReport {
  period: {
    start: ISOTimestamp;
    end: ISOTimestamp;
  };
  summary: {
    totalRevenue: Money;
    totalFees: Money;
    totalWithdrawals: Money;
    totalDeposits: Money;
    netIncome: Money;
    transactionCount: number;
    uniqueUsers: number;
    averageTransactionSize: Money;
  };
  breakdown: {
    byType: Record<TransactionType, { count: number; total: Money; fees: Money }>;
    byDay: Array<{ date: string; revenue: Money; transactions: number }>;
    byUser: Array<{ userId: UserId; total: Money; count: number }>;
  };
  trends: {
    revenueGrowth: number; // Percentage
    userGrowth: number; // Percentage
    averageOrderValue: Money;
  };
}

// Risk and compliance
export interface RiskAssessment {
  userId: UserId;
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  recommendedActions: string[];
  lastAssessment: ISOTimestamp;
}

export interface RiskFactor {
  type: 'velocity' | 'amount' | 'pattern' | 'location' | 'device';
  description: string;
  severity: 'low' | 'medium' | 'high';
  score: number;
  details?: any;
}

export interface ComplianceCheck {
  userId: UserId;
  checkType: 'kyc' | 'aml' | 'sanctions' | 'pep';
  status: 'pending' | 'passed' | 'failed' | 'review';
  checkedAt: ISOTimestamp;
  expiresAt?: ISOTimestamp;
  details?: any;
}

// Reconciliation
export interface ReconciliationResult {
  userId: UserId;
  role: 'buyer' | 'seller' | 'admin';
  period?: {
    start: ISOTimestamp;
    end: ISOTimestamp;
  };
  currentBalance: Money;
  calculatedBalance: Money;
  discrepancy: Money;
  isReconciled: boolean;
  details: {
    totalCredits: Money;
    totalDebits: Money;
    pendingCredits: Money;
    pendingDebits: Money;
    transactionCount: number;
  };
  discrepancies?: Array<{
    transactionId: string;
    expected: Money;
    actual: Money;
    difference: Money;
    reason?: string;
  }>;
}

// Limits and restrictions
export interface WalletLimits {
  daily: {
    deposit: Money;
    withdrawal: Money;
    transfer: Money;
  };
  monthly: {
    deposit: Money;
    withdrawal: Money;
    transfer: Money;
  };
  perTransaction: {
    minDeposit: Money;
    maxDeposit: Money;
    minWithdrawal: Money;
    maxWithdrawal: Money;
    minTransfer: Money;
    maxTransfer: Money;
  };
}

export interface WalletRestriction {
  userId: UserId;
  type: 'freeze' | 'limit' | 'review';
  reason: string;
  appliedAt: ISOTimestamp;
  expiresAt?: ISOTimestamp;
  appliedBy: UserId;
  restrictions: {
    canDeposit: boolean;
    canWithdraw: boolean;
    canTransfer: boolean;
    customLimits?: Partial<WalletLimits>;
  };
}

// Notifications
export interface WalletNotification {
  id: string;
  userId: UserId;
  type: 'transaction' | 'limit' | 'security' | 'promotion';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  transactionId?: string;
  read: boolean;
  createdAt: ISOTimestamp;
  expiresAt?: ISOTimestamp;
  actionUrl?: string;
  actionLabel?: string;
}

// Analytics
export interface WalletAnalytics {
  userId: UserId;
  period: {
    start: ISOTimestamp;
    end: ISOTimestamp;
  };
  metrics: {
    totalDeposited: Money;
    totalWithdrawn: Money;
    totalSpent: Money;
    totalEarned: Money;
    netFlow: Money;
    transactionCount: number;
    averageTransactionSize: Money;
    largestTransaction: Money;
    mostFrequentTransactionType: TransactionType;
  };
  patterns: {
    peakActivityHour: number; // 0-23
    peakActivityDay: number; // 0-6 (Sunday-Saturday)
    averageTimeBetweenTransactions: number; // minutes
    favoritePaymentMethod?: PaymentMethod;
  };
  comparisons: {
    previousPeriod: {
      percentageChange: number;
      absoluteChange: Money;
    };
    peerGroup: {
      percentile: number; // 0-100
      averagePeerSpending: Money;
    };
  };
}

// Error types
export enum WalletErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  DAILY_LIMIT_EXCEEDED = 'DAILY_LIMIT_EXCEEDED',
  MONTHLY_LIMIT_EXCEEDED = 'MONTHLY_LIMIT_EXCEEDED',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_ACCOUNT = 'INVALID_ACCOUNT',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  ACCOUNT_FROZEN = 'ACCOUNT_FROZEN',
  VERIFICATION_REQUIRED = 'VERIFICATION_REQUIRED',
  INVALID_PAYMENT_METHOD = 'INVALID_PAYMENT_METHOD',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface WalletError {
  code: WalletErrorCode;
  message: string;
  details?: any;
  transactionId?: string;
  timestamp: ISOTimestamp;
}

// Deposit log type
export interface DepositLog {
  id: string;
  username: string;
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'crypto' | 'admin_credit';
  date: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  notes?: string;
  // NEW: role information from the backend analytics payload (non-breaking)
  role?: 'buyer' | 'seller' | 'admin';
}

// Custom request purchase
export interface CustomRequestPurchase {
  requestId: string;
  buyer: string;
  seller: string;
  amount: number;
  description: string;
  metadata?: any;
}

// Helper type guards
export const isTransactionType = (value: unknown): value is TransactionType => {
  const validTypes: TransactionType[] = [
    'deposit', 'withdrawal', 'purchase', 'sale', 'tip', 
    'subscription', 'admin_credit', 'admin_debit', 'refund', 
    'fee', 'tier_credit'
  ];
  return typeof value === 'string' && validTypes.includes(value as TransactionType);
};

export const isTransactionStatus = (value: unknown): value is TransactionStatus => {
  const validStatuses: TransactionStatus[] = ['pending', 'completed', 'failed', 'cancelled'];
  return typeof value === 'string' && validStatuses.includes(value as TransactionStatus);
};

export const isPaymentMethod = (value: unknown): value is PaymentMethod => {
  const validMethods: PaymentMethod[] = [
    'credit_card', 'debit_card', 'bank_transfer', 
    'paypal', 'crypto', 'admin_credit'
  ];
  return typeof value === 'string' && validMethods.includes(value as PaymentMethod);
};
