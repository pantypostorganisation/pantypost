// tests/seller-wallet.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SellerWalletPage from '@/app/wallet/seller/page';

// Mock dependencies
jest.mock('@/components/RequireAuth', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/BanCheck', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/wallet/seller/WalletHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="wallet-header">Seller Wallet</div>,
}));

jest.mock('@/components/wallet/seller/BalanceCard', () => ({
  __esModule: true,
  default: ({ balance }: { balance: number }) => (
    <div data-testid="balance-card">Available: ${balance.toFixed(2)}</div>
  ),
}));

jest.mock('@/components/wallet/seller/EarningsCard', () => ({
  __esModule: true,
  default: ({ totalEarnings, totalWithdrawn, salesCount }: any) => (
    <div data-testid="earnings-card">
      <div>Total Earnings: ${totalEarnings.toFixed(2)}</div>
      <div>Withdrawn: ${totalWithdrawn.toFixed(2)}</div>
      <div>Sales: {salesCount}</div>
    </div>
  ),
}));

jest.mock('@/components/wallet/seller/WithdrawSection', () => ({
  __esModule: true,
  default: ({ balance, withdrawAmount, onAmountChange, onWithdraw, message, messageType }: any) => (
    <div data-testid="withdraw-section">
      <div>Available: ${balance.toFixed(2)}</div>
      <input
        type="number"
        value={withdrawAmount}
        onChange={(e) => onAmountChange(e.target.value)}
        placeholder="Amount to withdraw"
        data-testid="withdraw-input"
      />
      <button onClick={onWithdraw} data-testid="withdraw-button">
        Request Withdrawal
      </button>
      {message && (
        <div data-testid={`message-${messageType}`}>{message}</div>
      )}
    </div>
  ),
}));

jest.mock('@/components/wallet/seller/RecentWithdrawals', () => ({
  __esModule: true,
  default: ({ withdrawals }: { withdrawals: any[] }) => (
    <div data-testid="recent-withdrawals">
      {withdrawals.map((w: any) => (
        <div key={w.id} data-testid={`withdrawal-${w.id}`}>
          ${w.amount.toFixed(2)} - {w.status}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('@/components/wallet/seller/EmptyState', () => ({
  __esModule: true,
  default: () => <div data-testid="empty-state">No withdrawals yet</div>,
}));

jest.mock('@/components/wallet/seller/WithdrawConfirmModal', () => ({
  __esModule: true,
  default: ({ showConfirmation, withdrawAmount, handleConfirmWithdraw, setShowConfirmation }: any) => 
    showConfirmation ? (
      <div data-testid="confirm-modal">
        <p>Confirm withdrawal of ${withdrawAmount}?</p>
        <button onClick={handleConfirmWithdraw} data-testid="confirm-button">
          Confirm
        </button>
        <button onClick={() => setShowConfirmation(false)} data-testid="cancel-button">
          Cancel
        </button>
      </div>
    ) : null,
}));

// Mock hooks
jest.mock('@/hooks/useSellerWallet', () => ({
  useSellerWallet: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/context/WalletContext', () => ({
  useWallet: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('Seller Wallet Page', () => {
  const mockUseSellerWallet = require('@/hooks/useSellerWallet').useSellerWallet;
  const mockUseAuth = require('@/context/AuthContext').useAuth;

  const createMockWalletState = (overrides = {}) => ({
    balance: 250,
    withdrawAmount: '',
    message: '',
    messageType: 'success',
    isLoading: false,
    showConfirmation: false,
    sortedWithdrawals: [],
    totalWithdrawn: 0,
    totalEarnings: 250,
    recentWithdrawals: [],
    sellerSales: [],
    todaysWithdrawals: 0,
    remainingDailyLimit: 10000,
    withdrawalLimits: {
      MIN_AMOUNT: 20,
      MAX_AMOUNT: 10000,
      DAILY_LIMIT: 10000,
      MIN_BALANCE_REMAINING: 0,
    },
    validationError: null,
    handleWithdrawClick: jest.fn(),
    handleConfirmWithdraw: jest.fn(),
    handleAmountChange: jest.fn(),
    handleKeyPress: jest.fn(),
    handleQuickAmountSelect: jest.fn(),
    setShowConfirmation: jest.fn(),
    setWithdrawAmount: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { username: 'testseller', role: 'seller' },
      isAuthReady: true,
    });
    mockUseSellerWallet.mockReturnValue(createMockWalletState());
  });

  describe('Balance and Earnings Display', () => {
    it('displays current balance correctly', () => {
      render(<SellerWalletPage />);
      
      expect(screen.getByTestId('balance-card')).toHaveTextContent('Available: $250.00');
    });

    it('displays earnings information', () => {
      mockUseSellerWallet.mockReturnValue(
        createMockWalletState({
          totalEarnings: 500,
          totalWithdrawn: 250,
          sellerSales: [1, 2, 3], // 3 sales
        })
      );

      render(<SellerWalletPage />);
      
      const earningsCard = screen.getByTestId('earnings-card');
      expect(earningsCard).toHaveTextContent('Total Earnings: $500.00');
      expect(earningsCard).toHaveTextContent('Withdrawn: $250.00');
      expect(earningsCard).toHaveTextContent('Sales: 3');
    });
  });

  describe('Withdrawal Process', () => {
    it('allows entering withdrawal amount', () => {
      const mockHandleAmountChange = jest.fn();
      mockUseSellerWallet.mockReturnValue(
        createMockWalletState({ handleAmountChange: mockHandleAmountChange })
      );

      render(<SellerWalletPage />);

      const input = screen.getByTestId('withdraw-input');
      fireEvent.change(input, { target: { value: '100' } });

      expect(mockHandleAmountChange).toHaveBeenCalledWith('100');
    });

    it('shows confirmation modal when withdraw is clicked', () => {
      const mockHandleWithdrawClick = jest.fn();
      mockUseSellerWallet.mockReturnValue(
        createMockWalletState({ 
          withdrawAmount: '100',
          handleWithdrawClick: mockHandleWithdrawClick 
        })
      );

      render(<SellerWalletPage />);

      const withdrawButton = screen.getByTestId('withdraw-button');
      fireEvent.click(withdrawButton);

      expect(mockHandleWithdrawClick).toHaveBeenCalled();
    });

    it('displays confirmation modal with correct amount', () => {
      mockUseSellerWallet.mockReturnValue(
        createMockWalletState({
          showConfirmation: true,
          withdrawAmount: '100',
        })
      );

      render(<SellerWalletPage />);

      expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      expect(screen.getByText('Confirm withdrawal of $100?')).toBeInTheDocument();
    });

    it('handles withdrawal confirmation', () => {
      const mockHandleConfirmWithdraw = jest.fn();
      mockUseSellerWallet.mockReturnValue(
        createMockWalletState({
          showConfirmation: true,
          withdrawAmount: '100',
          handleConfirmWithdraw: mockHandleConfirmWithdraw,
        })
      );

      render(<SellerWalletPage />);

      const confirmButton = screen.getByTestId('confirm-button');
      fireEvent.click(confirmButton);

      expect(mockHandleConfirmWithdraw).toHaveBeenCalled();
    });

    it('allows canceling withdrawal', () => {
      const mockSetShowConfirmation = jest.fn();
      mockUseSellerWallet.mockReturnValue(
        createMockWalletState({
          showConfirmation: true,
          setShowConfirmation: mockSetShowConfirmation,
        })
      );

      render(<SellerWalletPage />);

      const cancelButton = screen.getByTestId('cancel-button');
      fireEvent.click(cancelButton);

      expect(mockSetShowConfirmation).toHaveBeenCalledWith(false);
    });
  });

  describe('Withdrawal History', () => {
    it('shows recent withdrawals', () => {
        const withdrawals = [
          { id: '1', amount: 100, status: 'completed' },
          { id: '2', amount: 150, status: 'pending' },
      ];

      mockUseSellerWallet.mockReturnValue(
        createMockWalletState({
          sortedWithdrawals: withdrawals,
          recentWithdrawals: withdrawals,
          totalWithdrawn: 250,
        })
      );

      render(<SellerWalletPage />);

      expect(screen.getByTestId('recent-withdrawals')).toBeInTheDocument();
      expect(screen.getByTestId('withdrawal-1')).toHaveTextContent('$100.00 - completed');
      expect(screen.getByTestId('withdrawal-2')).toHaveTextContent('$150.00 - pending');
    });

    it('shows empty state when no withdrawals', () => {
      render(<SellerWalletPage />);

      expect(screen.getByTestId('empty-state')).toHaveTextContent('No withdrawals yet');
    });
  });

  describe('Error Handling', () => {
    it('shows error message on failed withdrawal', () => {
      mockUseSellerWallet.mockReturnValue(
        createMockWalletState({
          message: 'Insufficient balance for withdrawal',
          messageType: 'error',
        })
      );

      render(<SellerWalletPage />);

      expect(screen.getByTestId('message-error')).toHaveTextContent(
        'Insufficient balance for withdrawal'
      );
    });

    it('shows success message after withdrawal', () => {
      mockUseSellerWallet.mockReturnValue(
        createMockWalletState({
          message: 'Withdrawal request submitted successfully!',
          messageType: 'success',
        })
      );

      render(<SellerWalletPage />);

      expect(screen.getByTestId('message-success')).toHaveTextContent(
        'Withdrawal request submitted successfully!'
      );
    });
  });

  describe('Authorization', () => {
    it('renders for seller role', () => {
      render(<SellerWalletPage />);
      
      expect(screen.getByTestId('wallet-header')).toBeInTheDocument();
    });

    it('renders for admin users', () => {
      mockUseAuth.mockReturnValue({
        user: { username: 'gerome', role: 'admin' },
        isAuthReady: true,
      });

      render(<SellerWalletPage />);
      
      expect(screen.getByTestId('wallet-header')).toBeInTheDocument();
    });
  });

  describe('Balance Validation', () => {
    it('prevents withdrawal exceeding balance', () => {
        mockUseSellerWallet.mockReturnValue(
          createMockWalletState({
            balance: 50,
            withdrawAmount: '100',
          message: 'Amount exceeds available balance',
          messageType: 'error',
        })
      );

      render(<SellerWalletPage />);

      expect(screen.getByTestId('message-error')).toHaveTextContent(
        'Amount exceeds available balance'
      );
    });
  });
});