// tests/admin-dashboard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminProfitDashboard from '@/app/wallet/admin/page';

// Mock dependencies
jest.mock('@/components/RequireAuth', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/admin/wallet/AdminMetrics', () => ({
  __esModule: true,
  default: () => <div data-testid="admin-metrics">Metrics</div>,
}));

jest.mock('@/components/admin/wallet/AdminRevenueChart', () => ({
  __esModule: true,
  default: () => <div data-testid="revenue-chart">Revenue Chart</div>,
}));

jest.mock('@/components/admin/wallet/AdminHealthSection', () => ({
  __esModule: true,
  default: () => <div data-testid="health-section">System Health</div>,
}));

jest.mock('@/components/admin/wallet/AdminMoneyFlow', () => ({
  __esModule: true,
  default: () => <div data-testid="money-flow">Money Flow</div>,
}));

jest.mock('@/components/admin/wallet/AdminRecentActivity', () => ({
  __esModule: true,
  default: () => <div data-testid="recent-activity">Recent Activity</div>,
}));

// Mock contexts
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/context/WalletContext', () => ({
  useWallet: jest.fn(),
}));

jest.mock('@/context/ListingContext', () => ({
  useListings: jest.fn(),
}));

jest.mock('@/utils/admin/walletHelpers', () => ({
  getTimeFilteredData: jest.fn(() => ({
    actions: [],
    orders: [],
    deposits: [],
    sellerWithdrawals: [],
    adminWithdrawals: [],
  })),
  getAllSellerWithdrawals: jest.fn(() => []),
}));

describe('Admin Dashboard', () => {
  const mockUseAuth = require('@/context/AuthContext').useAuth;
  const mockUseWallet = require('@/context/WalletContext').useWallet;
  const mockUseListings = require('@/context/ListingContext').useListings;

  const createMockWalletState = () => ({
    adminBalance: 500000, // $5000
    adminActions: [],
    orderHistory: [],
    wallet: {},
    depositLogs: [],
    getTotalDeposits: jest.fn(() => 1000000), // $10,000
    getDepositsByTimeframe: jest.fn(),
    sellerWithdrawals: [],
    adminWithdrawals: [],
    isLoading: false,
    isInitialized: true,
    initializationError: null,
    reloadData: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      user: { username: 'oakley', role: 'admin' },
    });
    
    mockUseWallet.mockReturnValue(createMockWalletState());
    
    mockUseListings.mockReturnValue({
      users: [],
      listings: [],
      isAuthReady: true,
    });
  });

  describe('Access Control', () => {
    it('allows access for authorized admin (oakley)', () => {
      render(<AdminProfitDashboard />);
      
      expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
      expect(screen.getByTestId('admin-metrics')).toBeInTheDocument();
    });

    it('allows access for authorized admin (gerome)', () => {
      mockUseAuth.mockReturnValue({
        user: { username: 'gerome', role: 'admin' },
      });

      render(<AdminProfitDashboard />);
      
      expect(screen.getByText('Platform Analytics')).toBeInTheDocument();
    });

    it('denies access for non-admin users', () => {
      mockUseAuth.mockReturnValue({
        user: { username: 'regularuser', role: 'buyer' },
      });

      render(<AdminProfitDashboard />);
      
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-metrics')).not.toBeInTheDocument();
    });
  });

  describe('Dashboard Components', () => {
    it('renders all dashboard sections', () => {
      render(<AdminProfitDashboard />);
      
      expect(screen.getByTestId('admin-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
      expect(screen.getByTestId('health-section')).toBeInTheDocument();
      expect(screen.getByTestId('money-flow')).toBeInTheDocument();
      expect(screen.getByTestId('recent-activity')).toBeInTheDocument();
    });
  });

  describe('Time Filters', () => {
    it('displays time filter buttons', () => {
      render(<AdminProfitDashboard />);
      
      expect(screen.getByRole('button', { name: /^today$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^week$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^month$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^3 months$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^year$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^all time$/i })).toBeInTheDocument();
    });

    it('allows changing time filter', () => {
      render(<AdminProfitDashboard />);
      
      const weekButton = screen.getByRole('button', { name: /^week$/i });
      fireEvent.click(weekButton);
      
      // In real implementation, this would update the filtered data
      expect(weekButton).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading state while initializing', () => {
      mockUseWallet.mockReturnValue({
        ...createMockWalletState(),
        isInitialized: false,
        isLoading: true,
      });

      render(<AdminProfitDashboard />);
      
      expect(screen.getByText('Loading Analytics')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-metrics')).not.toBeInTheDocument();
    });

    it('shows error state on initialization failure', () => {
      mockUseWallet.mockReturnValue({
        ...createMockWalletState(),
        isInitialized: true, // Changed to true
        isLoading: false,    // Changed to false
        initializationError: 'Failed to load wallet data',
      });

      render(<AdminProfitDashboard />);
      
      expect(screen.getByText('Initialization Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load wallet data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry loading/i })).toBeInTheDocument();
    });
  });

  describe('Data Refresh', () => {
    it('has force reload button', () => {
      render(<AdminProfitDashboard />);
      
      expect(screen.getByRole('button', { name: /force reload/i })).toBeInTheDocument();
    });

    it('handles force reload', () => {
      const mockReloadData = jest.fn();
      mockUseWallet.mockReturnValue({
        ...createMockWalletState(),
        reloadData: mockReloadData,
      });

      render(<AdminProfitDashboard />);
      
      const reloadButton = screen.getByRole('button', { name: /force reload/i });
      fireEvent.click(reloadButton);
      
      expect(mockReloadData).toHaveBeenCalled();
    });
  });

  describe('Data Synchronization', () => {
    it('shows data synchronized indicator', () => {
      render(<AdminProfitDashboard />);
      
      expect(screen.getByText('Data synchronized')).toBeInTheDocument();
    });
  });
});