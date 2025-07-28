// tests/browse-detail.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ListingDetailPage from '@/app/browse/[id]/page';

// Mock components
jest.mock('@/components/BanCheck', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/browse-detail/DetailHeader', () => ({
  __esModule: true,
  default: ({ onBack }: any) => (
    <button onClick={onBack} data-testid="back-button">Back</button>
  ),
}));

jest.mock('@/components/browse-detail/ImageGallery', () => ({
  __esModule: true,
  default: ({ images, listing }: any) => (
    <div data-testid="image-gallery">
      <img src={images[0]} alt={listing.title} />
    </div>
  ),
}));

jest.mock('@/components/browse-detail/ProductInfo', () => ({
  __esModule: true,
  default: ({ listing }: any) => (
    <div data-testid="product-info">
      <h1>{listing.title}</h1>
      <p>{listing.description}</p>
      <span>Condition: {listing.condition}</span>
    </div>
  ),
}));

jest.mock('@/components/browse-detail/PurchaseSection', () => ({
  __esModule: true,
  default: ({ listing, handlePurchase, isProcessing }: any) => (
    <div data-testid="purchase-section">
      <p>${listing.price}</p>
      <button 
        onClick={handlePurchase}
        disabled={isProcessing}
        data-testid="buy-button"
      >
        {isProcessing ? 'Processing...' : 'Buy Now'}
      </button>
    </div>
  ),
}));

jest.mock('@/components/browse-detail/AuctionSection', () => ({
  __esModule: true,
  default: ({ listing, onBidSubmit, bidAmount, onBidAmountChange }: any) => (
    <div data-testid="auction-section">
      <p>Current bid: ${listing.auction.currentBid}</p>
      <input
        type="number"
        value={bidAmount}
        onChange={(e) => onBidAmountChange(e.target.value)}
        data-testid="bid-input"
      />
      <button onClick={onBidSubmit} data-testid="bid-button">
        Place Bid
      </button>
    </div>
  ),
}));

jest.mock('@/components/browse-detail/SellerProfile', () => ({
  __esModule: true,
  default: ({ seller }: any) => (
    <div data-testid="seller-profile">
      Seller: {seller}
    </div>
  ),
}));

jest.mock('@/components/browse-detail/TrustBadges', () => ({
  __esModule: true,
  default: () => <div data-testid="trust-badges">Trust Badges</div>,
}));

// Mock other modal components
jest.mock('@/components/browse-detail/BidHistoryModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/browse-detail/AuctionEndedModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/browse-detail/PurchaseSuccessModal', () => ({
  __esModule: true,
  default: ({ showPurchaseSuccess }: any) => 
    showPurchaseSuccess ? <div data-testid="success-modal">Purchase Successful!</div> : null,
}));

jest.mock('@/components/browse-detail/StickyPurchaseBar', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/browse-detail/PremiumLockMessage', () => ({
  __esModule: true,
  default: () => <div data-testid="premium-lock">Premium content - Subscribe to view</div>,
}));

// Mock hooks
jest.mock('@/hooks/useBrowseDetail', () => ({
  useBrowseDetail: jest.fn(),
}));

jest.mock('@/context/FavoritesContext', () => ({
  useFavorites: () => ({
    isFavorited: jest.fn(() => false),
    toggleFavorite: jest.fn(() => true),
    error: null,
  }),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
  }),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('Listing Detail Page', () => {
  const mockUseBrowseDetail = require('@/hooks/useBrowseDetail').useBrowseDetail;

  const createMockListing = (overrides = {}) => ({
    id: '123',
    title: 'Red Lace Panties',
    description: 'Worn for 24 hours',
    price: 50,
    images: ['/image1.jpg', '/image2.jpg'],
    seller: 'hotgirl99',
    condition: 'worn',
    isPremium: false,
    isSellerVerified: true,
    sellerTierInfo: { tier: 'silver' },
    ...overrides,
  });

  const createMockState = (overrides = {}) => ({
    user: { username: 'buyer123', role: 'buyer' },
    listing: createMockListing(),
    listingId: '123',
    images: ['/image1.jpg', '/image2.jpg'],
    isAuctionListing: false,
    isAuctionEnded: false,
    didUserBid: false,
    isUserHighestBidder: false,
    currentHighestBid: 0,
    currentTotalPayable: 0,
    suggestedBidAmount: 0,
    needsSubscription: false,
    currentUsername: 'buyer123',
    purchaseStatus: null,
    isProcessing: false,
    showPurchaseSuccess: false,
    showAuctionSuccess: false,
    sellerProfile: null,
    showStickyBuy: false,
    bidAmount: '',
    bidStatus: null,
    biddingEnabled: true,
    bidsHistory: [],
    showBidHistory: false,
    forceUpdateTimer: 0,
    viewCount: 42,
    isBidding: false,
    bidError: null,
    bidSuccess: null,
    currentImageIndex: 0,
    imageRef: { current: null },
    bidInputRef: { current: null },
    bidButtonRef: { current: null },
    handlePurchase: jest.fn(),
    handleBidSubmit: jest.fn(),
    handleImageNavigation: jest.fn(),
    handleBidAmountChange: jest.fn(),
    updateState: jest.fn(),
    getTimerProgress: jest.fn(),
    formatTimeRemaining: jest.fn(),
    formatBidDate: jest.fn(),
    calculateTotalPayable: jest.fn(),
    router: { push: mockPush },
    rateLimitError: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBrowseDetail.mockReturnValue(createMockState());
  });

  describe('Initial Render', () => {
    it('renders listing details correctly', () => {
      render(<ListingDetailPage />);

      expect(screen.getByTestId('product-info')).toBeInTheDocument();
      expect(screen.getByText('Red Lace Panties')).toBeInTheDocument();
      expect(screen.getByText('Worn for 24 hours')).toBeInTheDocument();
      expect(screen.getByText('Condition: worn')).toBeInTheDocument();
    });

    it('shows loading when listing not found', () => {
      mockUseBrowseDetail.mockReturnValue(createMockState({ listing: null }));

      render(<ListingDetailPage />);

      expect(screen.getByText('Listing not found.')).toBeInTheDocument();
    });

    it('shows error for invalid listing URL', () => {
      mockUseBrowseDetail.mockReturnValue(createMockState({ listingId: null }));

      render(<ListingDetailPage />);

      expect(screen.getByText('Invalid listing URL.')).toBeInTheDocument();
    });
  });

  describe('Standard Listing Purchase', () => {
    it('displays price and buy button', () => {
      render(<ListingDetailPage />);

      expect(screen.getByTestId('purchase-section')).toBeInTheDocument();
      expect(screen.getByText('$50')).toBeInTheDocument();
      expect(screen.getByTestId('buy-button')).toBeInTheDocument();
    });

    it('handles purchase click', async () => {
      const mockHandlePurchase = jest.fn();
      mockUseBrowseDetail.mockReturnValue(
        createMockState({ handlePurchase: mockHandlePurchase })
      );

      render(<ListingDetailPage />);

      const buyButton = screen.getByTestId('buy-button');
      fireEvent.click(buyButton);

      expect(mockHandlePurchase).toHaveBeenCalled();
    });

    it('shows processing state', () => {
      mockUseBrowseDetail.mockReturnValue(
        createMockState({ isProcessing: true })
      );

      render(<ListingDetailPage />);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByTestId('buy-button')).toBeDisabled();
    });

    it('shows success modal after purchase', () => {
      mockUseBrowseDetail.mockReturnValue(
        createMockState({ showPurchaseSuccess: true })
      );

      render(<ListingDetailPage />);

      expect(screen.getByTestId('success-modal')).toBeInTheDocument();
      expect(screen.getByText('Purchase Successful!')).toBeInTheDocument();
    });
  });

  describe('Auction Listing', () => {
    const auctionListing = createMockListing({
      auction: {
        currentBid: 75,
        startingBid: 50,
        endTime: new Date(Date.now() + 3600000).toISOString(),
        bids: [],
      },
    });

    it('shows auction section for auction listings', () => {
      mockUseBrowseDetail.mockReturnValue(
        createMockState({
          listing: auctionListing,
          isAuctionListing: true,
        })
      );

      render(<ListingDetailPage />);

      expect(screen.getByTestId('auction-section')).toBeInTheDocument();
      expect(screen.getByText('Current bid: $75')).toBeInTheDocument();
    });

    it('allows placing bids', () => {
      const mockHandleBidSubmit = jest.fn();
      const mockHandleBidAmountChange = jest.fn();

      mockUseBrowseDetail.mockReturnValue(
        createMockState({
          listing: auctionListing,
          isAuctionListing: true,
          bidAmount: '80',
          handleBidSubmit: mockHandleBidSubmit,
          handleBidAmountChange: mockHandleBidAmountChange,
        })
      );

      render(<ListingDetailPage />);

      const bidInput = screen.getByTestId('bid-input');
      fireEvent.change(bidInput, { target: { value: '85' } });
      
      const bidButton = screen.getByTestId('bid-button');
      fireEvent.click(bidButton);

      expect(mockHandleBidAmountChange).toHaveBeenCalledWith('85');
      expect(mockHandleBidSubmit).toHaveBeenCalled();
    });
  });

  describe('Premium Content', () => {
    it('shows premium lock for non-subscribers', () => {
      mockUseBrowseDetail.mockReturnValue(
        createMockState({
          listing: createMockListing({ isPremium: true }),
          needsSubscription: true,
        })
      );

      render(<ListingDetailPage />);

      expect(screen.getByTestId('premium-lock')).toBeInTheDocument();
      expect(screen.getByText(/subscribe to view/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates back to browse page', () => {
      render(<ListingDetailPage />);

      const backButton = screen.getByTestId('back-button');
      fireEvent.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/browse');
    });
  });

  describe('Error Handling', () => {
    it('displays rate limit error', () => {
      mockUseBrowseDetail.mockReturnValue(
        createMockState({
          rateLimitError: 'Too many requests. Please wait 60 seconds.',
        })
      );

      render(<ListingDetailPage />);

      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
    });

    it('shows purchase error status', () => {
      mockUseBrowseDetail.mockReturnValue(
        createMockState({
          purchaseStatus: 'Purchase failed: Insufficient balance',
        })
      );

      render(<ListingDetailPage />);

      expect(screen.getByText(/purchase failed/i)).toBeInTheDocument();
    });
  });
});