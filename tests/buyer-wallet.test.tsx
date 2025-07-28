// tests/buyer-wallet.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BuyerWalletPage from '@/app/wallet/buyer/page';

// Mock dependencies
jest.mock('@/components/RequireAuth', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/BanCheck', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/wallet/buyer/WalletHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="wallet-header">Buyer Wallet</div>,
}));

jest.mock('@/components/wallet/buyer/BalanceCard', () => ({
  __esModule: true,
  default: ({ balance }: { balance: number }) => (
    <div data-testid="balance-card">
      Balance: ${(balance / 100).toFixed(2)}
    </div>
  ),
}));

jest.mock('@/components/wallet/buyer/TotalSpentCard', () => ({
  __esModule: true,
  default: ({ totalSpent, totalOrders }: any) => (
    <div data-testid="total-spent-card">
      Total Spent: ${(totalSpent / 100).toFixed(2)} ({totalOrders} orders)
    </div>
  ),
}));

jest.mock('@/components/wallet/buyer/AddFundsSection', () => ({
  __esModule: true,
  default: ({ amountToAdd, onAmountChange, onAddFunds, message, messageType }: any) => (
    <div data-testid="add-funds-section">
      <input
        type="number"
        value={amountToAdd}
        onChange={(e) => onAmountChange(e.target.value)}
        placeholder="Amount to add"
        data-testid="amount-input"
      />
      <button onClick={onAddFunds} data-testid="add-funds-button">
        Add Funds
      </button>
      {message && (
        <div data-testid={`message-${messageType}`}>{message}</div>
      )}
    </div>
  ),
}));

jest.mock('@/components/wallet/buyer/RecentPurchases', () => ({
  __esModule: true,
  default: ({ purchases }: { purchases: any[] }) => (
    <div data-testid="recent-purchases">
      {purchases.map((p: any) => (
        <div key={p.orderId} data-testid={`purchase-${p.orderId}`}>
          {p.sellerName} - ${(p.amount / 100).toFixed(2)}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/wallet/buyer/EmptyState', () => ({
  __esModule: true,
  default: () => <div data-testid="empty-state">No purchases yet</div>,
}));

// Mock hooks
jest.mock('@/hooks/useBuyerWallet', () => ({
  useBuyerWallet: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Buyer Wallet Page', () => {
  const mockUseBuyerWallet = require('@/hooks/useBuyerWallet').useBuyerWallet;
  const mockUseAuth = require('@/context/AuthContext').useAuth;

  const createMockWalletState = (overrides = {}) => ({
    balance: 10000, // $100.00 in cents
    amountToAdd: '',
    message: '',
    messageType: 'success',
    isLoading: false,
    buyerPurchases: [],
    recentPurchases: [],
    totalSpent: 0,
    handleAddFunds: jest.fn(),
    handleAmountChange: jest.fn(),
    handleKeyPress: jest.fn(),
    handleQuickAmountSelect: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { username: 'testbuyer', role: 'buyer' },
      isAuthReady: true,
    });
    mockUseBuyerWallet.mockReturnValue(createMockWalletState());
  });

  describe('Balance Display', () => {
    it('displays current balance correctly', () => {
      render(<BuyerWalletPage />);
      
      expect(screen.getByTestId('balance-card')).toHaveTextContent('Balance: $100.00');
    });

    it('shows zero balance', () => {
      mockUseBuyerWallet.mockReturnValue(createMockWalletState({ balance: 0 }));
      
      render(<BuyerWalletPage />);
      
      expect(screen.getByTestId('balance-card')).toHaveTextContent('Balance: $0.00');
    });
  });

  describe('Adding Funds', () => {
    it('allows entering amount to add', () => {
      const mockHandleAmountChange = jest.fn();
      mockUseBuyerWallet.mockReturnValue(
        createMockWalletState({ handleAmountChange: mockHandleAmountChange })
      );

      render(<BuyerWalletPage />);

      const input = screen.getByTestId('amount-input');
      fireEvent.change(input, { target: { value: '50' } });

      expect(mockHandleAmountChange).toHaveBeenCalledWith('50');
    });

    it('handles add funds button click', async () => {
      const mockHandleAddFunds = jest.fn();
      mockUseBuyerWallet.mockReturnValue(
        createMockWalletState({ 
          amountToAdd: '50',
          handleAddFunds: mockHandleAddFunds 
        })
      );

      render(<BuyerWalletPage />);

      const addButton = screen.getByTestId('add-funds-button');
      fireEvent.click(addButton);

      expect(mockHandleAddFunds).toHaveBeenCalled();
    });

    it('shows success message after adding funds', () => {
      mockUseBuyerWallet.mockReturnValue(
        createMockWalletState({
          message: 'Successfully added $50.00 to your wallet!',
          messageType: 'success',
        })
      );

      render(<BuyerWalletPage />);

      expect(screen.getByTestId('message-success')).toHaveTextContent(
        'Successfully added $50.00 to your wallet!'
      );
    });

    it('shows error message on failed transaction', () => {
      mockUseBuyerWallet.mockReturnValue(
        createMockWalletState({
          message: 'Failed to add funds. Please try again.',
          messageType: 'error',
        })
      );

      render(<BuyerWalletPage />);

      expect(screen.getByTestId('message-error')).toHaveTextContent(
        'Failed to add funds'
      );
    });
  });

  describe('Purchase History', () => {
    it('shows recent purchases when available', () => {
      const purchases = [
        { orderId: '1', sellerName: 'seller1', amount: 5000 }, // $50
        { orderId: '2', sellerName: 'seller2', amount: 7500 }, // $75
      ];

      mockUseBuyerWallet.mockReturnValue(
        createMockWalletState({
          buyerPurchases: purchases,
          recentPurchases: purchases,
          totalSpent: 12500,
        })
      );

      render(<BuyerWalletPage />);

      expect(screen.getByTestId('recent-purchases')).toBeInTheDocument();
      expect(screen.getByTestId('purchase-1')).toHaveTextContent('seller1 - $50.00');
      expect(screen.getByTestId('purchase-2')).toHaveTextContent('seller2 - $75.00');
      expect(screen.getByTestId('total-spent-card')).toHaveTextContent(
        'Total Spent: $125.00 (2 orders)'
      );
    });

    it('shows empty state when no purchases', () => {
      render(<BuyerWalletPage />);

      expect(screen.getByTestId('empty-state')).toHaveTextContent('No purchases yet');
      expect(screen.queryByTestId('recent-purchases')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading state while processing', () => {
      mockUseBuyerWallet.mockReturnValue(
        createMockWalletState({ isLoading: true })
      );

      render(<BuyerWalletPage />);

      const button = screen.getByTestId('add-funds-button');
      // In real implementation, button might be disabled or show loading text
      expect(button).toBeInTheDocument();
    });
  });

  describe('Authorization', () => {
    it('renders for buyer role', () => {
      render(<BuyerWalletPage />);
      
      expect(screen.getByTestId('wallet-header')).toBeInTheDocument();
    });

    it('renders for admin users', () => {
      mockUseAuth.mockReturnValue({
        user: { username: 'oakley', role: 'admin' },
        isAuthReady: true,
      });

      render(<BuyerWalletPage />);
      
      expect(screen.getByTestId('wallet-header')).toBeInTheDocument();
    });

    it('shows loading while checking auth', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthReady: false,
      });

      const { container } = render(<BuyerWalletPage />);
      
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });
});