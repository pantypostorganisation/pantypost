// src/types/wallet.ts

export interface BuyerWalletState {
  balance: number;
  amountToAdd: string;
  message: string;
  messageType: 'success' | 'error' | '';
  isLoading: boolean;
  walletUpdateTrigger: number;
}

export interface Purchase {
  title: string;
  seller: string;
  date: string;
  price: number;
  markedUpPrice?: number;
  buyer: string;
}

// Component Props
export interface BalanceCardProps {
  balance: number;
}

export interface TotalSpentCardProps {
  totalSpent: number;
  totalOrders: number;
}

export interface AddFundsSectionProps {
  amountToAdd: string;
  message: string;
  messageType: 'success' | 'error' | '';
  isLoading: boolean;
  onAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onAddFunds: () => void;
  onQuickAmountSelect: (amount: string) => void;
}

export interface RecentPurchasesProps {
  purchases: Purchase[];
}

export interface EmptyStateProps {
  showEmptyState: boolean;
}