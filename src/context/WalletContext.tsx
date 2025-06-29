// src/context/WalletContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { DeliveryAddress } from '@/components/AddressConfirmationModal';
import { getSellerTierMemoized } from '@/utils/sellerTiers';
import { storageService } from '@/services';
import { v4 as uuidv4 } from 'uuid';
import { WalletRecovery } from '@/utils/walletRecovery';

// Import types safely
let walletService: any = null;
let WalletIntegration: any = null;

// Dynamically import services to avoid SSR issues
if (typeof window !== 'undefined') {
  try {
    import('@/services').then(services => {
      walletService = services.walletService;
    });
    
    import('@/services/wallet.integration').then(integration => {
      WalletIntegration = integration.WalletIntegration;
    });
  } catch (error) {
    console.warn('Could not load wallet services:', error);
  }
}

// Export Order type to make it available to other components
export type Order = {
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
  shippingStatus?: 'pending' | 'processing' | 'shipped';
  tierCreditAmount?: number;
  isCustomRequest?: boolean;
  originalRequestId?: string;
  listingId?: string;
  listingTitle?: string;
  quantity?: number;
};

// Import Listing from ListingContext to avoid conflicts
import { Listing as ListingContextType } from '@/context/ListingContext';

// Use the ListingContext's Listing type directly
type Listing = ListingContextType;

export type CustomRequestPurchase = {
  requestId: string;
  buyer: string;
  seller: string;
  amount: number;
  description: string;
  metadata?: any;
};

type Withdrawal = {
  amount: number;
  date: string;
  status?: 'pending' | 'completed' | 'failed';
  method?: string;
};

// Fixed AdminAction type to match what's used in admin components
type AdminAction = {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  targetUser?: string;  // Made optional for backward compatibility
  username?: string;    // Alternative field used in some places
  adminUser: string;
  reason: string;
  date: string;
  role: 'buyer' | 'seller';
};

export type DepositLog = {
  id: string;
  username: string;
  amount: number;
  method: 'credit_card' | 'bank_transfer' | 'crypto' | 'admin_credit';
  date: string;
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  notes?: string;
};

type WalletContextType = {
  // Existing interface remains the same for backward compatibility
  buyerBalances: { [username: string]: number };
  adminBalance: number;
  sellerBalances: { [username: string]: number };
  setBuyerBalance: (username: string, balance: number) => Promise<void>;
  getBuyerBalance: (username: string) => number;
  setAdminBalance: (balance: number) => Promise<void>;
  setSellerBalance: (seller: string, balance: number) => Promise<void>;
  getSellerBalance: (seller: string) => number;
  purchaseListing: (listing: Listing, buyerUsername: string) => Promise<boolean>;
  purchaseCustomRequest: (customRequest: CustomRequestPurchase) => Promise<boolean>;
  subscribeToSellerWithPayment: (
    buyer: string,
    seller: string,
    amount: number
  ) => Promise<boolean>;
  orderHistory: Order[];
  addOrder: (order: Order) => Promise<void>;
  sellerWithdrawals: { [username: string]: Withdrawal[] };
  adminWithdrawals: Withdrawal[];
  addSellerWithdrawal: (username: string, amount: number) => Promise<void>;
  addAdminWithdrawal: (amount: number) => Promise<void>;
  wallet: { [username: string]: number };
  updateWallet: (username: string, amount: number, orderToFulfil?: Order) => void;
  sendTip: (buyer: string, seller: string, amount: number) => Promise<boolean>;
  setAddSellerNotificationCallback?: (fn: (seller: string, message: string) => void) => void;
  adminCreditUser: (username: string, role: 'buyer' | 'seller', amount: number, reason: string) => Promise<boolean>;
  adminDebitUser: (username: string, role: 'buyer' | 'seller', amount: number, reason: string) => Promise<boolean>;
  adminActions: AdminAction[];
  updateOrderAddress: (orderId: string, address: DeliveryAddress) => Promise<void>;
  updateShippingStatus: (orderId: string, status: 'pending' | 'processing' | 'shipped') => Promise<void>;
  depositLogs: DepositLog[];
  addDeposit: (username: string, amount: number, method: DepositLog['method'], notes?: string) => Promise<boolean>;
  getDepositsForUser: (username: string) => DepositLog[];
  getTotalDeposits: () => number;
  getDepositsByTimeframe: (timeframe: 'today' | 'week' | 'month' | 'year' | 'all') => DepositLog[];
  
  // New enhanced features
  checkSuspiciousActivity: (username: string) => Promise<{ suspicious: boolean; reasons: string[] }>;
  reconcileBalance: (username: string, role: 'buyer' | 'seller' | 'admin') => Promise<any>;
  getTransactionHistory: (username?: string, limit?: number) => Promise<any[]>;
};

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  // State management
  const [buyerBalances, setBuyerBalancesState] = useState<{ [username: string]: number }>({});
  const [adminBalance, setAdminBalanceState] = useState<number>(0);
  const [sellerBalances, setSellerBalancesState] = useState<{ [username: string]: number }>({});
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerWithdrawals, setSellerWithdrawals] = useState<{ [username: string]: Withdrawal[] }>({});
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [depositLogs, setDepositLogs] = useState<DepositLog[]>([]);
  const [addSellerNotification, setAddSellerNotification] = useState<((seller: string, message: string) => void) | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const setAddSellerNotificationCallback = (fn: (seller: string, message: string) => void) => {
    setAddSellerNotification(() => fn);
  };

  // Data cleanup and corruption prevention
  const cleanupCorruptedData = useCallback(async () => {
    console.log('🔍 Running wallet data cleanup...');
    
    try {
      // Use the recovery utility to clean up corrupted data
      WalletRecovery.cleanupCorrupted();
      
      console.log('✅ Wallet data cleanup completed');
    } catch (error) {
      console.error('❌ Error during wallet cleanup:', error);
    }
  }, []);

  // Initialize enhanced wallet service
  useEffect(() => {
    const initializeServices = async () => {
      if (isInitialized) return;
      
      try {
        console.log('🚀 Initializing wallet services...');
        
        // Step 1: Clean up any corrupted data first
        await cleanupCorruptedData();
        
        // Step 2: Initialize wallet service if available
        if (typeof walletService?.initialize === 'function') {
          await walletService.initialize();
        }
        
        // Step 3: Set initialized BEFORE loading data to prevent race conditions
        setIsInitialized(true);
        
        console.log('✅ Wallet services initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize wallet service:', error);
        // Continue with fallback - don't block the app
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initializeServices();
    }
  }, [isInitialized, cleanupCorruptedData]);

  // Helper function to get balance key (matching enhanced wallet service)
  const getBalanceKey = (username: string, role: string): string => {
    if (username === 'admin') return 'wallet_admin';
    return `wallet_${role}_${username}`;
  };

  // FIXED: Load data with proper corruption prevention
  useEffect(() => {
    if (typeof window === 'undefined' || !isInitialized) return;

    const loadData = async () => {
      try {
        console.log('📥 Loading wallet data from localStorage...');
        
        // STEP 1: Load admin balance with corruption protection
        let adminBalanceValue = 0;
        
        // Try legacy format first (this is the authoritative source)
        const adminLegacy = localStorage.getItem("wallet_admin");
        if (adminLegacy && adminLegacy !== 'NaN' && !isNaN(parseFloat(adminLegacy))) {
          const parsedBalance = parseFloat(adminLegacy);
          // SAFETY: If admin balance is suspiciously high (>$50k), reset to 0
          if (parsedBalance > 50000) {
            console.warn('⚠️ Admin balance appears corrupted, resetting to 0:', parsedBalance);
            localStorage.setItem("wallet_admin", "0");
            adminBalanceValue = 0;
          } else {
            adminBalanceValue = parsedBalance;
          }
        }
        
        console.log('💰 Admin balance loaded:', adminBalanceValue);
        
        // STEP 2: Load buyer/seller balances with validation
        const buyersLegacy = localStorage.getItem("wallet_buyers");
        const sellersLegacy = localStorage.getItem("wallet_sellers");
        
        const buyersMap: { [username: string]: number } = buyersLegacy ? 
          JSON.parse(buyersLegacy) : {};
        const sellersMap: { [username: string]: number } = sellersLegacy ? 
          JSON.parse(sellersLegacy) : {};
        
        // Validate and clean up buyer/seller data
        for (const [username, balance] of Object.entries(buyersMap)) {
          if (typeof balance !== 'number' || isNaN(balance) || balance < 0) {
            console.warn('⚠️ Invalid buyer balance for', username, balance);
            delete buyersMap[username];
          }
        }
        
        for (const [username, balance] of Object.entries(sellersMap)) {
          if (typeof balance !== 'number' || isNaN(balance) || balance < 0) {
            console.warn('⚠️ Invalid seller balance for', username, balance);
            delete sellersMap[username];
          }
        }
        
        // STEP 3: Set state with validated data
        setBuyerBalancesState(buyersMap);
        setSellerBalancesState(sellersMap);
        setAdminBalanceState(adminBalanceValue);

        // STEP 4: Load all other wallet data with better error handling
        try {
          const orders = await storageService.getItem<Order[]>("wallet_orders", []);
          setOrderHistory(Array.isArray(orders) ? orders : []);
          console.log('📦 Loaded orders:', orders.length);
        } catch (error) {
          console.error('❌ Error loading orders:', error);
          setOrderHistory([]);
        }

        try {
          const sellerWds = await storageService.getItem<{ [username: string]: Withdrawal[] }>("wallet_sellerWithdrawals", {});
          setSellerWithdrawals(typeof sellerWds === 'object' ? sellerWds : {});
        } catch (error) {
          console.error('❌ Error loading seller withdrawals:', error);
          setSellerWithdrawals({});
        }

        try {
          const adminWds = await storageService.getItem<Withdrawal[]>("wallet_adminWithdrawals", []);
          setAdminWithdrawals(Array.isArray(adminWds) ? adminWds : []);
        } catch (error) {
          console.error('❌ Error loading admin withdrawals:', error);
          setAdminWithdrawals([]);
        }

        try {
          const actions = await storageService.getItem<AdminAction[]>("wallet_adminActions", []);
          const normalizedActions = Array.isArray(actions) ? actions.map(action => ({
            ...action,
            targetUser: action.targetUser || action.username,
            username: action.username || action.targetUser,
          })) : [];
          setAdminActions(normalizedActions);
          console.log('👑 Loaded admin actions:', normalizedActions.length);
        } catch (error) {
          console.error('❌ Error loading admin actions:', error);
          setAdminActions([]);
        }

        try {
          const deposits = await storageService.getItem<DepositLog[]>("wallet_depositLogs", []);
          setDepositLogs(Array.isArray(deposits) ? deposits : []);
          console.log('💳 Loaded deposit logs:', deposits.length);
        } catch (error) {
          console.error('❌ Error loading deposit logs:', error);
          setDepositLogs([]);
        }

        console.log('✅ Wallet data loading complete:', {
          buyers: Object.keys(buyersMap).length,
          sellers: Object.keys(sellersMap).length,
          admin: adminBalanceValue,
          orders: orderHistory.length,
          adminActions: adminActions.length,
          deposits: depositLogs.length
        });
      } catch (error) {
        console.error('❌ Error loading wallet data:', error);
      }
    };

    // Load data immediately when initialized
    loadData();
  }, [isInitialized]);

  // FIXED: Save functions with validation
  const saveBuyerBalance = useCallback(async (username: string, balance: number) => {
    try {
      // Validate balance before saving
      if (isNaN(balance) || balance < 0) {
        console.error('❌ Invalid buyer balance:', balance);
        return;
      }
      
      // Update state immediately
      setBuyerBalancesState(prev => ({ ...prev, [username]: balance }));
      
      // Save to localStorage with all current balances
      const currentBalances = { ...buyerBalances, [username]: balance };
      localStorage.setItem("wallet_buyers", JSON.stringify(currentBalances));
      
      console.log('💾 Buyer balance saved:', username, balance);
    } catch (error) {
      console.error('❌ Error saving buyer balance:', error);
    }
  }, [buyerBalances]);

  const saveSellerBalance = useCallback(async (username: string, balance: number) => {
    try {
      // Validate balance before saving
      if (isNaN(balance) || balance < 0) {
        console.error('❌ Invalid seller balance:', balance);
        return;
      }
      
      // Update state immediately
      setSellerBalancesState(prev => ({ ...prev, [username]: balance }));
      
      // Save to localStorage with all current balances
      const currentBalances = { ...sellerBalances, [username]: balance };
      localStorage.setItem("wallet_sellers", JSON.stringify(currentBalances));
      
      console.log('💾 Seller balance saved:', username, balance);
    } catch (error) {
      console.error('❌ Error saving seller balance:', error);
    }
  }, [sellerBalances]);

  const saveAdminBalance = useCallback(async (balance: number) => {
    try {
      // Validate balance before saving
      if (isNaN(balance) || balance < 0) {
        console.error('❌ Invalid admin balance:', balance);
        return;
      }
      
      // Safety check - prevent suspicious amounts
      if (balance > 50000) {
        console.error('❌ Admin balance too high, not saving:', balance);
        return;
      }
      
      // Save to primary storage (legacy format) - this is the authoritative source
      localStorage.setItem('wallet_admin', balance.toString());
      
      console.log('💾 Admin balance saved:', balance);
    } catch (error) {
      console.error('❌ Error saving admin balance:', error);
    }
  }, []);

  // IMPROVED: Persistence hooks with debouncing and validation
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    
    const saveBuyerData = async () => {
      try {
        // Validate data before saving
        const validatedBuyers: { [username: string]: number } = {};
        
        for (const [username, balance] of Object.entries(buyerBalances)) {
          if (typeof balance === 'number' && !isNaN(balance) && balance >= 0) {
            validatedBuyers[username] = balance;
          }
        }
        
        localStorage.setItem("wallet_buyers", JSON.stringify(validatedBuyers));
      } catch (error) {
        console.error('❌ Error persisting buyer balances:', error);
      }
    };
    
    // Debounce saves to prevent excessive writes
    const timeoutId = setTimeout(saveBuyerData, 500);
    return () => clearTimeout(timeoutId);
  }, [buyerBalances, isInitialized]);

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    
    const saveSellerData = async () => {
      try {
        // Validate data before saving
        const validatedSellers: { [username: string]: number } = {};
        
        for (const [username, balance] of Object.entries(sellerBalances)) {
          if (typeof balance === 'number' && !isNaN(balance) && balance >= 0) {
            validatedSellers[username] = balance;
          }
        }
        
        localStorage.setItem("wallet_sellers", JSON.stringify(validatedSellers));
      } catch (error) {
        console.error('❌ Error persisting seller balances:', error);
      }
    };
    
    // Debounce saves to prevent excessive writes
    const timeoutId = setTimeout(saveSellerData, 500);
    return () => clearTimeout(timeoutId);
  }, [sellerBalances, isInitialized]);

  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    
    const saveAdminData = async () => {
      try {
        // Validate admin balance before saving
        if (typeof adminBalance === 'number' && !isNaN(adminBalance) && adminBalance >= 0 && adminBalance <= 50000) {
          localStorage.setItem("wallet_admin", adminBalance.toString());
          console.log('💾 Admin balance persisted:', adminBalance);
        }
      } catch (error) {
        console.error('❌ Error persisting admin balance:', error);
      }
    };
    
    // Debounce saves to prevent excessive writes
    const timeoutId = setTimeout(saveAdminData, 500);
    return () => clearTimeout(timeoutId);
  }, [adminBalance, isInitialized]);

  // Enhanced persistence for critical data (orders, deposits, etc.)
  useEffect(() => {
    if (!isInitialized) return;
    
    const saveOrderData = async () => {
      try {
        await storageService.setItem("wallet_orders", orderHistory);
      } catch (error) {
        console.error('❌ Error persisting orders:', error);
      }
    };
    
    const timeoutId = setTimeout(saveOrderData, 1000);
    return () => clearTimeout(timeoutId);
  }, [orderHistory, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    
    const saveDepositData = async () => {
      try {
        await storageService.setItem("wallet_depositLogs", depositLogs);
      } catch (error) {
        console.error('❌ Error persisting deposits:', error);
      }
    };
    
    const timeoutId = setTimeout(saveDepositData, 1000);
    return () => clearTimeout(timeoutId);
  }, [depositLogs, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    
    const saveAdminActions = async () => {
      try {
        await storageService.setItem("wallet_adminActions", adminActions);
      } catch (error) {
        console.error('❌ Error persisting admin actions:', error);
      }
    };
    
    const timeoutId = setTimeout(saveAdminActions, 1000);
    return () => clearTimeout(timeoutId);
  }, [adminActions, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    
    const saveWithdrawalData = async () => {
      try {
        await storageService.setItem("wallet_sellerWithdrawals", sellerWithdrawals);
        await storageService.setItem("wallet_adminWithdrawals", adminWithdrawals);
      } catch (error) {
        console.error('❌ Error persisting withdrawals:', error);
      }
    };
    
    const timeoutId = setTimeout(saveWithdrawalData, 1000);
    return () => clearTimeout(timeoutId);
  }, [sellerWithdrawals, adminWithdrawals, isInitialized]);

  // Force update Header balance when context updates
  useEffect(() => {
    if (!isInitialized || typeof window === 'undefined') return;
    
    // Trigger a custom event to update the header
    const event = new CustomEvent('walletUpdate', { 
      detail: { buyerBalances, sellerBalances, adminBalance } 
    });
    window.dispatchEvent(event);
  }, [buyerBalances, sellerBalances, adminBalance, isInitialized]);

  // Helper functions
  const getBuyerBalance = useCallback((username: string): number => {
    return buyerBalances[username] || 0;
  }, [buyerBalances]);

  const setBuyerBalance = useCallback(async (username: string, balance: number) => {
    try {
      await saveBuyerBalance(username, balance);
    } catch (error) {
      console.error('❌ Error setting buyer balance:', error);
    }
  }, [saveBuyerBalance]);

  const getSellerBalance = useCallback((seller: string): number => {
    return sellerBalances[seller] || 0;
  }, [sellerBalances]);

  const setSellerBalance = useCallback(async (seller: string, balance: number) => {
    try {
      await saveSellerBalance(seller, balance);
    } catch (error) {
      console.error('❌ Error setting seller balance:', error);
    }
  }, [saveSellerBalance]);

  const setAdminBalance = useCallback(async (balance: number) => {
    try {
      // Update state immediately
      setAdminBalanceState(balance);
      // Save will happen via useEffect hook
      await saveAdminBalance(balance);
    } catch (error) {
      console.error('❌ Error setting admin balance:', error);
    }
  }, [saveAdminBalance]);

  const addOrder = useCallback(async (order: Order) => {
    try {
      setOrderHistory((prev) => [...prev, order]);
    } catch (error) {
      console.error('❌ Error adding order:', error);
    }
  }, []);

  const addDeposit = useCallback(async (
    username: string, 
    amount: number, 
    method: DepositLog['method'], 
    notes?: string
  ): Promise<boolean> => {
    try {
      const deposit: DepositLog = {
        id: uuidv4(),
        username,
        amount,
        method,
        date: new Date().toISOString(),
        status: 'completed',
        notes,
      };

      setDepositLogs((prev) => [...prev, deposit]);
      return true;
    } catch (error) {
      console.error('❌ Error adding deposit:', error);
      return false;
    }
  }, []);

  const addSellerWithdrawal = useCallback(async (username: string, amount: number) => {
    try {
      const withdrawal: Withdrawal = {
        amount,
        date: new Date().toISOString(),
        status: 'completed',
        method: 'bank_transfer',
      };

      setSellerWithdrawals((prev) => ({
        ...prev,
        [username]: [...(prev[username] || []), withdrawal],
      }));
    } catch (error) {
      console.error('❌ Error adding seller withdrawal:', error);
    }
  }, []);

  const addAdminWithdrawal = useCallback(async (amount: number) => {
    try {
      const withdrawal: Withdrawal = {
        amount,
        date: new Date().toISOString(),
        status: 'completed',
        method: 'bank_transfer',
      };

      setAdminWithdrawals((prev) => [...prev, withdrawal]);
    } catch (error) {
      console.error('❌ Error adding admin withdrawal:', error);
    }
  }, []);

  // Enhanced wallet operations (unchanged from original but with better error handling)
  const purchaseListing = useCallback(async (listing: Listing, buyerUsername: string): Promise<boolean> => {
    try {
      const buyerBalance = getBuyerBalance(buyerUsername);
      const markedUpPrice = listing.markedUpPrice || listing.price * 1.1;

      if (buyerBalance < markedUpPrice) {
        return false;
      }

      // Process the transaction
      await setBuyerBalance(buyerUsername, buyerBalance - markedUpPrice);
      const sellerBalance = getSellerBalance(listing.seller);
      const sellerEarnings = markedUpPrice * 0.9; // 10% platform fee
      await setSellerBalance(listing.seller, sellerBalance + sellerEarnings);

      // Add to admin balance (platform fee)
      const platformFee = markedUpPrice * 0.1;
      await setAdminBalance(adminBalance + platformFee);

      // Create order record
      const order: Order = {
        id: uuidv4(),
        title: listing.title,
        description: listing.description,
        price: listing.price,
        markedUpPrice,
        imageUrl: listing.imageUrls?.[0],
        date: new Date().toISOString(),
        seller: listing.seller,
        buyer: buyerUsername,
        tags: listing.tags,
        listingId: listing.id,
      };

      await addOrder(order);

      // Notify seller if callback is available
      if (addSellerNotification) {
        addSellerNotification(
          listing.seller,
          `New order: ${listing.title} for $${markedUpPrice.toFixed(2)}`
        );
      }

      return true;
    } catch (error) {
      console.error('❌ Error processing listing purchase:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance, adminBalance, setAdminBalance, addOrder, addSellerNotification]);

  const purchaseCustomRequest = useCallback(async (customRequest: CustomRequestPurchase): Promise<boolean> => {
    try {
      const buyerBalance = getBuyerBalance(customRequest.buyer);

      if (buyerBalance < customRequest.amount) {
        return false;
      }

      // Process the transaction
      await setBuyerBalance(customRequest.buyer, buyerBalance - customRequest.amount);
      const sellerBalance = getSellerBalance(customRequest.seller);
      const sellerEarnings = customRequest.amount * 0.9; // 10% platform fee
      await setSellerBalance(customRequest.seller, sellerBalance + sellerEarnings);

      // Add to admin balance (platform fee)
      const platformFee = customRequest.amount * 0.1;
      await setAdminBalance(adminBalance + platformFee);

      // Create order record
      const order: Order = {
        id: uuidv4(),
        title: `Custom Request: ${customRequest.description}`,
        description: customRequest.description,
        price: customRequest.amount,
        markedUpPrice: customRequest.amount,
        date: new Date().toISOString(),
        seller: customRequest.seller,
        buyer: customRequest.buyer,
        isCustomRequest: true,
        originalRequestId: customRequest.requestId,
      };

      await addOrder(order);

      return true;
    } catch (error) {
      console.error('❌ Error processing custom request purchase:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance, adminBalance, setAdminBalance, addOrder]);

  const subscribeToSellerWithPayment = useCallback(async (
    buyer: string,
    seller: string,
    amount: number
  ): Promise<boolean> => {
    try {
      const buyerBalance = getBuyerBalance(buyer);

      if (buyerBalance < amount) {
        return false;
      }

      // Process subscription payment
      await setBuyerBalance(buyer, buyerBalance - amount);
      const sellerBalance = getSellerBalance(seller);
      const sellerEarnings = amount * 0.75; // 25% platform fee for subscriptions
      await setSellerBalance(seller, sellerBalance + sellerEarnings);

      // Add to admin balance (subscription fee)
      const subscriptionFee = amount * 0.25;
      await setAdminBalance(adminBalance + subscriptionFee);

      // Record admin action for subscription
      const action: AdminAction = {
        id: uuidv4(),
        type: 'credit',
        amount: sellerEarnings,
        targetUser: seller,
        username: seller,
        adminUser: 'system',
        reason: `Subscription payment from ${buyer}`,
        date: new Date().toISOString(),
        role: 'seller',
      };

      setAdminActions((prev) => [...prev, action]);

      return true;
    } catch (error) {
      console.error('❌ Error processing subscription payment:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance, adminBalance, setAdminBalance]);

  const sendTip = useCallback(async (buyer: string, seller: string, amount: number): Promise<boolean> => {
    try {
      const buyerBalance = getBuyerBalance(buyer);

      if (buyerBalance < amount) {
        return false;
      }

      // Process tip
      await setBuyerBalance(buyer, buyerBalance - amount);
      const sellerBalance = getSellerBalance(seller);
      const sellerEarnings = amount * 0.95; // 5% platform fee for tips
      await setSellerBalance(seller, sellerBalance + sellerEarnings);

      // Add to admin balance (tip fee)
      const tipFee = amount * 0.05;
      await setAdminBalance(adminBalance + tipFee);

      return true;
    } catch (error) {
      console.error('❌ Error processing tip:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance, adminBalance, setAdminBalance]);

  const updateWallet = useCallback((username: string, amount: number, orderToFulfil?: Order) => {
    try {
      // This function appears to be for backward compatibility
      // Implementation depends on the user role - defaulting to buyer
      const currentBalance = getBuyerBalance(username);
      setBuyerBalance(username, currentBalance + amount);
    } catch (error) {
      console.error('❌ Error updating wallet:', error);
    }
  }, [getBuyerBalance, setBuyerBalance]);

  const adminCreditUser = useCallback(async (
    username: string,
    role: 'buyer' | 'seller',
    amount: number,
    reason: string
  ): Promise<boolean> => {
    try {
      // Credit the user
      if (role === 'buyer') {
        const currentBalance = getBuyerBalance(username);
        await setBuyerBalance(username, currentBalance + amount);
      } else {
        const currentBalance = getSellerBalance(username);
        await setSellerBalance(username, currentBalance + amount);
      }

      // Deduct from admin balance
      await setAdminBalance(adminBalance - amount);

      // Record the action
      const action: AdminAction = {
        id: uuidv4(),
        type: 'credit',
        amount,
        targetUser: username,
        username,
        adminUser: 'admin',
        reason,
        date: new Date().toISOString(),
        role,
      };

      setAdminActions((prev) => [...prev, action]);

      return true;
    } catch (error) {
      console.error('❌ Error crediting user:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance, adminBalance, setAdminBalance]);

  const adminDebitUser = useCallback(async (
    username: string,
    role: 'buyer' | 'seller',
    amount: number,
    reason: string
  ): Promise<boolean> => {
    try {
      // Check if user has sufficient balance
      const currentBalance = role === 'buyer' ? getBuyerBalance(username) : getSellerBalance(username);
      
      if (currentBalance < amount) {
        return false;
      }

      // Debit the user
      if (role === 'buyer') {
        await setBuyerBalance(username, currentBalance - amount);
      } else {
        await setSellerBalance(username, currentBalance - amount);
      }

      // Add to admin balance
      await setAdminBalance(adminBalance + amount);

      // Record the action
      const action: AdminAction = {
        id: uuidv4(),
        type: 'debit',
        amount,
        targetUser: username,
        username,
        adminUser: 'admin',
        reason,
        date: new Date().toISOString(),
        role,
      };

      setAdminActions((prev) => [...prev, action]);

      return true;
    } catch (error) {
      console.error('❌ Error debiting user:', error);
      return false;
    }
  }, [getBuyerBalance, setBuyerBalance, getSellerBalance, setSellerBalance, adminBalance, setAdminBalance]);

  const updateOrderAddress = useCallback(async (orderId: string, address: DeliveryAddress) => {
    const updatedOrders = orderHistory.map(order =>
      order.id === orderId ? { ...order, deliveryAddress: address } : order
    );
    setOrderHistory(updatedOrders);
  }, [orderHistory]);

  const updateShippingStatus = useCallback(async (orderId: string, status: 'pending' | 'processing' | 'shipped') => {
    const updatedOrders = orderHistory.map(order =>
      order.id === orderId ? { ...order, shippingStatus: status } : order
    );
    setOrderHistory(updatedOrders);
  }, [orderHistory]);

  const getDepositsForUser = useCallback((username: string): DepositLog[] => {
    return depositLogs.filter(log => log.username === username);
  }, [depositLogs]);

  const getTotalDeposits = useCallback((): number => {
    return depositLogs
      .filter(log => log.status === 'completed')
      .reduce((sum, log) => sum + log.amount, 0);
  }, [depositLogs]);

  const getDepositsByTimeframe = useCallback((timeframe: 'today' | 'week' | 'month' | 'year' | 'all'): DepositLog[] => {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        return depositLogs.filter(log => log.status === 'completed');
    }
    
    return depositLogs.filter(log => 
      log.status === 'completed' && 
      new Date(log.date) >= startDate
    );
  }, [depositLogs]);

  // New enhanced features
  const checkSuspiciousActivity = useCallback(async (username: string) => {
    try {
      if (walletService?.checkSuspiciousActivity) {
        const result = await walletService.checkSuspiciousActivity(username);
        return {
          suspicious: result.suspicious,
          reasons: result.reasons,
        };
      }
    } catch (error) {
      console.error('❌ Error checking suspicious activity:', error);
    }
    return { suspicious: false, reasons: [] };
  }, []);

  const reconcileBalance = useCallback(async (
    username: string, 
    role: 'buyer' | 'seller' | 'admin'
  ) => {
    try {
      if (typeof WalletIntegration?.reconcileBalance === 'function') {
        return await WalletIntegration.reconcileBalance(username, role);
      }
    } catch (error) {
      console.error('❌ Error reconciling balance:', error);
    }
    return null;
  }, []);

  const getTransactionHistory = useCallback(async (username?: string, limit?: number) => {
    try {
      if (typeof WalletIntegration?.getFormattedTransactionHistory === 'function') {
        return await WalletIntegration.getFormattedTransactionHistory(username, { limit });
      }
    } catch (error) {
      console.error('❌ Error getting transaction history:', error);
    }
    return [];
  }, []);

  const contextValue: WalletContextType = {
    buyerBalances,
    adminBalance,
    sellerBalances,
    setBuyerBalance,
    getBuyerBalance,
    setAdminBalance,
    setSellerBalance,
    getSellerBalance,
    purchaseListing,
    purchaseCustomRequest,
    subscribeToSellerWithPayment,
    orderHistory,
    addOrder,
    sellerWithdrawals,
    adminWithdrawals,
    addSellerWithdrawal,
    addAdminWithdrawal,
    wallet: { ...buyerBalances, ...sellerBalances, admin: adminBalance },
    updateWallet,
    sendTip,
    setAddSellerNotificationCallback,
    adminCreditUser,
    adminDebitUser,
    adminActions,
    updateOrderAddress,
    updateShippingStatus,
    depositLogs,
    addDeposit,
    getDepositsForUser,
    getTotalDeposits,
    getDepositsByTimeframe,
    
    // New enhanced features
    checkSuspiciousActivity,
    reconcileBalance,
    getTransactionHistory,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
