// src/context/WalletContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { v4 as uuidv4 } from "uuid";
import {
  sanitizeStrict,
  sanitizeUsername,
  sanitizeCurrency,
} from "@/utils/security/sanitization";
import { getRateLimiter, RATE_LIMITS } from "@/utils/security/rate-limiter";
import { z } from "zod";
import { useWebSocket } from "@/context/WebSocketContext";
import { WebSocketEvent } from "@/types/websocket";
import { useAuth } from "@/context/AuthContext";
import { securityService } from "@/services/security.service";

// Import shared types
import type {
  Order,
  DeliveryAddress,
  Listing,
  CustomRequestPurchase,
  DepositLog,
} from "@/types/order";
import type { Transaction, WalletBalance } from "@/types/wallet";

// Re-export types for backward compatibility
export type { Order, DeliveryAddress, Listing, CustomRequestPurchase, DepositLog };

// Debug mode helper
const DEBUG_MODE = process.env.NEXT_PUBLIC_DEBUG === "true";
const debugLog = (...args: unknown[]) => {
  if (DEBUG_MODE) {
    console.log("[WalletContext]", ...args);
  }
};

type Withdrawal = {
  amount: number;
  date: string;
  status?: "pending" | "completed" | "failed";
  method?: string;
};

type AdminAction = {
  id?: string;
  _id?: string;
  type: "credit" | "debit";
  amount: number;
  targetUser?: string;
  username?: string;
  adminUser?: string;
  reason: string;
  date: string;
  role?: "buyer" | "seller";
  metadata?: Record<string, unknown>;
};

type DeduplicationEvent = {
  [key: string]: unknown;
  username?: string;
  balance?: number;
  newBalance?: number;
  timestamp?: number;
  id?: string;
  transactionId?: string;
  from?: string;
  to?: string;
  amount?: number;
  buyer?: string;
  seller?: string;
};

type WalletAnalytics = {
  adminBalance: number;
  orderHistory: Order[];
  depositLogs: DepositLog[];
  sellerWithdrawals: Withdrawal[];
  adminWithdrawals: Withdrawal[];
  adminActions: AdminAction[];
  wallet: Record<string, number>;
  users: Record<string, { role: 'buyer' | 'seller' | 'admin' }>;
  summary?: unknown;
};

type RawAdminAction = {
  _id?: string;
  id?: string;
  type: AdminAction['type'];
  amount: number;
  reason: string;
  date: string;
  adminUser?: string;
  metadata?: (AdminAction['metadata'] & {
    seller?: string;
    username?: string;
    role?: 'buyer' | 'seller';
  }) | null;
};

type WalletBalanceEvent = DeduplicationEvent & {
  role?: 'buyer' | 'seller' | 'admin';
  data?: { balance?: number } | null;
};

type WalletTransactionEvent = DeduplicationEvent & {
  from?: string;
  to?: string;
  amount?: number;
};

type OrderCreatedEvent = DeduplicationEvent & {
  order?: Order;
  buyer?: string;
  seller?: string;
};

// Validation schemas for wallet operations
const walletOperationSchemas = {
  transactionAmount: z.number().positive().min(0.01).max(100000),
  balanceAmount: z.number().min(0).max(100000),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  reason: z.string().min(1).max(500),
  withdrawalAmount: z.number().positive().min(10).max(10000),
  tipAmount: z.number().positive().min(1).max(500),
  depositMethod: z.enum(["credit_card", "bank_transfer", "crypto", "admin_credit"]),
};

// Enhanced deduplication manager with configurable expiry
class DeduplicationManager {
  private processedEvents: Map<string, number> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private expiryMs: number;

  constructor(expiryMs: number = 30000) {
    this.expiryMs = expiryMs;
    this.startCleanup();
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const expiredKeys: string[] = [];

      this.processedEvents.forEach((timestamp, key) => {
        if (now - timestamp > this.expiryMs) {
          expiredKeys.push(key);
        }
      });

      expiredKeys.forEach((key) => this.processedEvents.delete(key));
    }, 10000); // Cleanup every 10 seconds
  }

  isDuplicate(eventType: string, data: DeduplicationEvent): boolean {
    // Create composite key based on event type
    let key: string;

    if (eventType === "balance_update") {
      const username = typeof data.username === "string" ? data.username : "unknown";
      const balanceValue =
        typeof data.balance === "number"
          ? data.balance
          : typeof data.newBalance === "number"
          ? data.newBalance
          : 0;
      const timestamp = typeof data.timestamp === "number" ? data.timestamp : Date.now();
      key = `${eventType}_${username}_${balanceValue}_${timestamp}`;
    } else if (eventType === "transaction") {
      const transactionId =
        typeof data.id === "string"
          ? data.id
          : typeof data.transactionId === "string"
          ? data.transactionId
          : "unknown";
      const from = typeof data.from === "string" ? data.from : "unknown";
      const to = typeof data.to === "string" ? data.to : "unknown";
      const amount = typeof data.amount === "number" ? data.amount : 0;
      key = `${eventType}_${transactionId}_${from}_${to}_${amount}`;
    } else if (eventType === "order_created") {
      const orderId =
        typeof data.id === "string"
          ? data.id
          : typeof data._id === "string"
          ? data._id
          : "unknown";
      const buyer = typeof data.buyer === "string" ? data.buyer : "unknown";
      const seller = typeof data.seller === "string" ? data.seller : "unknown";
      key = `${eventType}_${orderId}_${buyer}_${seller}`;
    } else {
      key = `${eventType}_${JSON.stringify(data)}`;
    }

    if (this.processedEvents.has(key)) {
      return true;
    }

    this.processedEvents.set(key, Date.now());
    return false;
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.processedEvents.clear();
  }
}

// Helper function to check if user is admin
const isAdminUser = (username: string): boolean => {
  return (
    username === "oakley" ||
    username === "gerome" ||
    username === "platform" ||
    username === "admin"
  );
};

// Transaction throttle manager
class ThrottleManager {
  private lastCallTimes: Map<string, number> = new Map();

  shouldThrottle(key: string, minIntervalMs: number = 3000): boolean {
    const now = Date.now();
    const lastCall = this.lastCallTimes.get(key) || 0;

    if (now - lastCall < minIntervalMs) {
      return true;
    }

    this.lastCallTimes.set(key, now);
    return false;
  }

  clear() {
    this.lastCallTimes.clear();
  }
}

// Transaction lock manager for preventing race conditions
type WalletContextType = {
  // Loading state
  isLoading: boolean;
  isInitialized: boolean;
  initializationError: string | null;

  // Balances (cached from API)
  buyerBalances: { [username: string]: number };
  adminBalance: number;
  sellerBalances: { [username: string]: number };

  // Balance operations
  setBuyerBalance: (username: string, balance: number) => Promise<void>;
  getBuyerBalance: (username: string) => number;
  setAdminBalance: (balance: number) => Promise<void>;
  setSellerBalance: (seller: string, balance: number) => Promise<void>;
  getSellerBalance: (seller: string) => number;

  // Purchase operations
  purchaseListing: (listing: Listing, buyerUsername: string) => Promise<boolean>;
  purchaseCustomRequest: (customRequest: CustomRequestPurchase) => Promise<boolean>;
  subscribeToSellerWithPayment: (buyer: string, seller: string, amount: number) => Promise<boolean>;
  unsubscribeFromSeller: (buyer: string, seller: string) => Promise<boolean>;

  // Order management
  orderHistory: Order[];
  addOrder: (order: Order) => Promise<void>;

  // Withdrawals
  sellerWithdrawals: { [username: string]: Withdrawal[] };
  adminWithdrawals: Withdrawal[];
  addSellerWithdrawal: (username: string, amount: number) => Promise<void>;
  addAdminWithdrawal: (amount: number) => Promise<void>;

  // Legacy wallet interface
  wallet: { [username: string]: number };
  updateWallet: (username: string, amount: number, orderToFulfil?: Order) => void;

  // Tips and notifications
  sendTip: (buyer: string, seller: string, amount: number, message?: string) => Promise<boolean>;
  setAddSellerNotificationCallback?: (fn: (seller: string, message: string) => void) => void;

  // Admin actions
  adminCreditUser: (
    username: string,
    role: "buyer" | "seller",
    amount: number,
    reason: string
  ) => Promise<boolean>;
  adminDebitUser: (
    username: string,
    role: "buyer" | "seller",
    amount: number,
    reason: string
  ) => Promise<boolean>;
  adminActions: AdminAction[];

  // Order updates
  updateOrderAddress: (orderId: string, address: DeliveryAddress) => Promise<void>;
  updateShippingStatus: (orderId: string, status: "pending" | "processing" | "shipped") => Promise<void>;

  // Deposits
  depositLogs: DepositLog[];
  addDeposit: (
    username: string,
    amount: number,
    method: DepositLog["method"],
    notes?: string
  ) => Promise<boolean>;
  getDepositsForUser: (username: string) => DepositLog[];
  getTotalDeposits: () => number;
  getDepositsByTimeframe: (timeframe: "today" | "week" | "month" | "year" | "all") => DepositLog[];

  // Auction methods
  holdBidFunds: (listingId: string, bidder: string, amount: number, auctionTitle: string) => Promise<boolean>;
  refundBidFunds: (bidder: string, listingId: string) => Promise<boolean>;
  finalizeAuctionPurchase: (listing: Listing, winnerUsername: string, winningBid: number) => Promise<boolean>;
  placeBid: (listingId: string, bidder: string, amount: number) => Promise<boolean>;
  chargeIncrementalBid: (listingId: string, bidder: string, previousBid: number, newBid: number, listingTitle: string) => Promise<boolean>;
  getAuctionBidders: (listingId: string) => Promise<string[]>;
  cleanupAuctionTracking: (listingId: string, winner?: string) => Promise<void>;

  // Enhanced features
  checkSuspiciousActivity: (username: string) => Promise<{ suspicious: boolean; reasons: string[] }>;
  reconcileBalance: (username: string, role: "buyer" | "seller" | "admin") => Promise<WalletBalance | null>;
  getTransactionHistory: (username?: string, limit?: number) => Promise<Transaction[]>;

  // Admin-specific methods
  refreshAdminData: () => Promise<void>;
  getPlatformTransactions: (limit?: number, page?: number) => Promise<Transaction[]>;
  getAnalyticsData: (timeFilter?: string) => Promise<WalletAnalytics | null>;

  // Data management
  reloadData: () => Promise<void>;
};

export const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user, apiClient } = useAuth();
  const webSocketContext = useWebSocket();

  // Extract properties from WebSocket context safely
  const sendMessage = webSocketContext?.sendMessage;
  const subscribe = webSocketContext?.subscribe;
  const isConnected = webSocketContext?.isConnected || false;

  // State management
  const [buyerBalances, setBuyerBalancesState] = useState<{ [username: string]: number }>({});
  const [adminBalance, setAdminBalanceState] = useState<number>(0);
  const [sellerBalances, setSellerBalancesState] = useState<{ [username: string]: number }>({});
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [sellerWithdrawals, setSellerWithdrawals] = useState<{ [username: string]: Withdrawal[] }>({});
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [depositLogs, setDepositLogs] = useState<DepositLog[]>([]);
  const [addSellerNotification, setAddSellerNotification] = useState<
    ((seller: string, message: string) => void) | null
  >(null);

  // Loading and initialization state
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Refs
  const initializingRef = useRef(false);
  const rateLimiter = useRef(getRateLimiter());
  const deduplicationManager = useRef(new DeduplicationManager(30000));
  const throttleManager = useRef(new ThrottleManager());

  // FIX: Add refs to track last fetched data for deduplication
  const lastFiredBalanceRef = useRef<{ balance: number; timestamp: number } | null>(null);
  const lastPlatformBalanceFetch = useRef<{ balance: number; timestamp: number } | null>(null);
  const lastAdminActionsFetch = useRef<number>(0);

  const setAddSellerNotificationCallback = (fn: (seller: string, message: string) => void) => {
    setAddSellerNotification(() => fn);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      deduplicationManager.current.destroy();
      throttleManager.current.clear();
    };
  }, []);

  // Fire admin balance update event (deduped)
  const fireAdminBalanceUpdateEvent = useCallback((balance: number) => {
    if (typeof window !== "undefined") {
      const now = Date.now();
      if (lastFiredBalanceRef.current) {
        const { balance: lastBalance, timestamp: lastTime } = lastFiredBalanceRef.current;
        if (lastBalance === balance && now - lastTime < 1000) {
          debugLog("Skipping duplicate admin balance event:", balance);
          return;
        }
      }

      debugLog("Firing admin balance update event:", balance);
      lastFiredBalanceRef.current = { balance, timestamp: now };

      window.dispatchEvent(
        new CustomEvent("wallet:admin-balance-updated", {
          detail: { balance, timestamp: now },
        })
      );
    }
  }, []);

  // Helpers
  const validateTransactionAmount = (amount: number): number => {
    const validation = walletOperationSchemas.transactionAmount.safeParse(amount);
    if (!validation.success) {
      throw new Error("Invalid transaction amount: " + validation.error.errors[0]?.message);
    }
    return sanitizeCurrency(validation.data);
  };

  const validateUsername = (username: string): string => {
    const validation = walletOperationSchemas.username.safeParse(username);
    if (!validation.success) {
      throw new Error("Invalid username: " + validation.error.errors[0]?.message);
    }
    return sanitizeUsername(validation.data);
  };

  const checkRateLimit = (operation: string, identifier?: string): void => {
    const rateLimitConfig = RATE_LIMITS[operation as keyof typeof RATE_LIMITS] || RATE_LIMITS.API_CALL;
    const result = rateLimiter.current.check(operation, { ...rateLimitConfig, identifier });

    if (!result.allowed) {
      throw new Error(`Rate limit exceeded. Please wait ${result.waitTime} seconds before trying again.`);
    }
  };

  // ---------- MOVED UP: fetchBalance (so it's defined before any usage) ----------
  const fetchBalance = useCallback(
    async (username: string): Promise<number> => {
      try {
        debugLog("Fetching balance for:", username);

        // For admin users, always fetch platform wallet
        if (isAdminUser(username)) {
          debugLog("Admin user detected, fetching unified platform wallet");

          const response = await apiClient.get<{ balance: number }>("/wallet/admin-platform-balance");

          if (response.success && response.data) {
            const balance = response.data.balance || 0;
            debugLog("Unified platform wallet balance:", balance);
            return balance;
          }

          console.warn("[WalletContext] Platform balance fetch failed:", response.error);
          return 0;
        }

        // For regular users, fetch their individual wallet
        const response = await apiClient.get<{ balance: number }>(`/wallet/balance/${username}`);

        debugLog("Balance response:", response);

        if (response.success && response.data) {
          return response.data.balance || 0;
        }

        console.warn("[WalletContext] Balance fetch failed:", response.error);
        return 0;
      } catch (error) {
        console.error(`[WalletContext] Failed to fetch balance for ${username}:`, error);
        return 0;
      }
    },
    [apiClient]
  );
  // ------------------------------------------------------------------------------

  // Orders & transactions fetchers
  const fetchOrderHistory = useCallback(
    async (username: string) => {
      try {
        debugLog("Fetching orders for:", username);
        const response = await apiClient.get<Order[]>(`/orders?buyer=${username}`);
        debugLog("Orders response:", response);

        if (response.success && response.data) {
          setOrderHistory(response.data);
          debugLog("Order history updated:", response.data.length, "orders");
        }
      } catch (error) {
        console.error("[WalletContext] Failed to fetch order history:", error);
      }
    },
    [apiClient]
  );

  const fetchTransactionHistory = useCallback(
    async (username: string) => {
      try {
        debugLog("Fetching transactions for:", username);

        // For admin users, fetch platform transactions
        const queryUsername = isAdminUser(username) ? "platform" : username;

        const response = await apiClient.get<Transaction[]>(`/wallet/transactions/${queryUsername}`);
        debugLog("Transactions response:", response);
      } catch (error) {
        console.error("[WalletContext] Failed to fetch transaction history:", error);
      }
    },
    [apiClient]
  );

  // Admin platform balance
  const fetchAdminPlatformBalance = useCallback(async (): Promise<number> => {
    if (!user || (user.role !== "admin" && !isAdminUser(user.username))) {
      debugLog("Not admin user, skipping platform balance fetch");
      return 0;
    }

    const now = Date.now();
    if (lastPlatformBalanceFetch.current) {
      const { balance: lastBalance, timestamp: lastTime } = lastPlatformBalanceFetch.current;
      if (now - lastTime < 5000) {
        debugLog("Returning cached platform balance (throttled):", lastBalance);
        return lastBalance;
      }
    }

    const throttleKey = "admin_platform_balance_fetch";
    if (throttleManager.current.shouldThrottle(throttleKey, 5000)) {
      debugLog("Platform balance fetch throttled, returning current balance:", adminBalance);
      return adminBalance;
    }

    try {
      console.log("[Wallet] Admin requesting unified platform wallet balance...");
      const response = await apiClient.get<{ balance: number }>("/wallet/admin-platform-balance");
      debugLog("Unified platform balance response:", response);

      if (response.success && response.data) {
        const balance = response.data.balance || 0;
        console.log("[Wallet] Unified platform wallet balance:", balance);

        lastPlatformBalanceFetch.current = { balance, timestamp: now };

        if (balance !== adminBalance) {
          setAdminBalanceState(balance);
          fireAdminBalanceUpdateEvent(balance);
        } else {
          debugLog("Balance unchanged, skipping state update");
        }

        return balance;
      }

      console.warn("[Wallet] Platform balance fetch failed:", response.error);
      return adminBalance;
    } catch (error) {
      console.error("[Wallet] Error fetching platform balance:", error);
      return adminBalance;
    }
  }, [user, apiClient, fireAdminBalanceUpdateEvent, adminBalance]);

  // Admin actions
  const fetchAdminActions = useCallback(async (): Promise<void> => {
    if (!user || (user.role !== "admin" && !isAdminUser(user.username))) {
      debugLog("Not admin user, skipping admin actions fetch");
      return;
    }

    const now = Date.now();
    if (now - lastAdminActionsFetch.current < 30000) {
      debugLog("Admin actions fetch throttled");
      return;
    }

    try {
      debugLog("Fetching admin actions...");
      lastAdminActionsFetch.current = now;

      const response = await apiClient.get<RawAdminAction[]>("/admin/actions?limit=100");
      debugLog("Admin actions response:", response);

      if (response.success && response.data) {
        const normalizedActions: AdminAction[] = response.data.map((action) => ({
          id: action._id || action.id,
          _id: action._id || action.id,
          type: action.type,
          amount: action.amount,
          reason: action.reason,
          date: action.date,
          metadata: action.metadata ?? {},
          targetUser: action.metadata?.seller || action.metadata?.username,
          username: action.metadata?.seller || action.metadata?.username,
          adminUser: action.adminUser || "platform",
          role: action.metadata?.role,
        }));

        setAdminActions(normalizedActions);
        debugLog("Admin actions loaded:", normalizedActions.length);
      } else {
        console.warn("[WalletContext] Admin actions fetch failed:", response.error);
      }
    } catch (error) {
      console.error("[WalletContext] Error fetching admin actions:", error);
    }
  }, [user, apiClient]);

  // WebSocket handlers
  const handleWalletBalanceUpdate = useCallback(
    (data: WalletBalanceEvent) => {
      debugLog("Received wallet:balance_update:", data);

      if (deduplicationManager.current.isDuplicate("balance_update", data)) {
        debugLog("Skipping duplicate balance update");
        return;
      }

      try {
        const sanitizedUsername = data.username ? sanitizeUsername(data.username) : null;
        if (!sanitizedUsername) {
          console.error("[WalletContext] Invalid username in balance update");
          return;
        }

        let balanceValue: number;
        if (typeof data.balance === "number") {
          balanceValue = data.balance;
        } else if (typeof data.newBalance === "number") {
          balanceValue = data.newBalance;
        } else if (data.data && typeof data.data.balance === "number") {
          balanceValue = data.data.balance;
        } else {
          console.warn("[WalletContext] No valid balance in update data:", data);
          balanceValue = 0;
        }

        const balanceValidation = walletOperationSchemas.balanceAmount.safeParse(balanceValue);
        if (!balanceValidation.success) {
          console.error("[WalletContext] Invalid balance amount:", balanceValidation.error);
          return;
        }

        const validatedBalance = balanceValidation.data;

        if (
          data.role === "admin" ||
          sanitizedUsername === "platform" ||
          isAdminUser(sanitizedUsername)
        ) {
          if (user && (user.role === "admin" || isAdminUser(user.username))) {
            if (adminBalance !== validatedBalance) {
              debugLog("Updating admin balance to:", validatedBalance);
              setAdminBalanceState(validatedBalance);
              fireAdminBalanceUpdateEvent(validatedBalance);
            }
          }
        } else if (data.role === "buyer") {
          setBuyerBalancesState((prev) => ({
            ...prev,
            [sanitizedUsername]: validatedBalance,
          }));

          if (user && user.username === sanitizedUsername) {
            window.dispatchEvent(
              new CustomEvent("wallet:buyer-balance-updated", {
                detail: { balance: validatedBalance, timestamp: Date.now() },
              })
            );
          }
        } else if (data.role === "seller") {
          setSellerBalancesState((prev) => ({
            ...prev,
            [sanitizedUsername]: validatedBalance,
          }));

          if (user && user.username === sanitizedUsername) {
            window.dispatchEvent(
              new CustomEvent("wallet:seller-balance-updated", {
                detail: { balance: validatedBalance, timestamp: Date.now() },
              })
            );
          }
        }
      } catch (error) {
        console.error("[WalletContext] Error processing balance update:", error);
      }
    },
    [user, fireAdminBalanceUpdateEvent, adminBalance]
  );

  const handlePlatformBalanceUpdate = useCallback(
    (data: WalletBalanceEvent) => {
      debugLog("Received platform:balance_update:", data);

      if (deduplicationManager.current.isDuplicate("platform_balance", data)) {
        debugLog("Skipping duplicate platform balance update");
        return;
      }

      let balanceValue: number;

      if (typeof data.balance === "number") {
        balanceValue = data.balance;
      } else if (typeof data.newBalance === "number") {
        balanceValue = data.newBalance;
      } else if (data.data && typeof data.data.balance === "number") {
        balanceValue = data.data.balance;
      } else {
        console.warn("[WalletContext] No valid balance in platform update:", data);
        balanceValue = 0;
      }

      const balanceValidation = walletOperationSchemas.balanceAmount.safeParse(balanceValue);
      if (!balanceValidation.success) {
        console.error("[WalletContext] Invalid platform balance:", balanceValidation.error);
        return;
      }

      if (user && (user.role === "admin" || isAdminUser(user.username))) {
        const newBalance = balanceValidation.data;
        if (adminBalance !== newBalance) {
          debugLog("Updating platform balance to:", newBalance);
          setAdminBalanceState(newBalance);
          fireAdminBalanceUpdateEvent(newBalance);
        }
      }
    },
    [user, fireAdminBalanceUpdateEvent, adminBalance]
  );

  const handleOrderCreated = useCallback(
    (data: OrderCreatedEvent) => {
      debugLog("Received order:created event:", data);

      if (deduplicationManager.current.isDuplicate("order_created", data)) {
        debugLog("Skipping duplicate order created event");
        return;
      }

      const orderPayload = data.order ?? (data as Partial<Order>);

      if (
        user &&
        (orderPayload?.buyer === user.username || orderPayload?.seller === user.username)
      ) {
        debugLog("[WalletContext] New order for current user, refreshing orders");
        fetchOrderHistory(user.username);
      }
    },
    [user, fetchOrderHistory]
  );

  const handleWalletTransaction = useCallback(
    async (data: WalletTransactionEvent) => {
      debugLog("Received wallet:transaction:", data);

      if (deduplicationManager.current.isDuplicate("transaction", data)) {
        debugLog("Skipping duplicate transaction");
        return;
      }

      try {
        const sanitizedFrom = data.from ? sanitizeUsername(data.from) : null;
        const sanitizedTo = data.to ? sanitizeUsername(data.to) : null;

        if (data.amount !== undefined) {
          const amountValidation = walletOperationSchemas.transactionAmount.safeParse(data.amount);
          if (!amountValidation.success) {
            console.error("[WalletContext] Invalid transaction amount:", amountValidation.error);
            return;
          }
        }

        if (user && (sanitizedFrom === user.username || sanitizedTo === user.username)) {
          if (!throttleManager.current.shouldThrottle("user_data_refresh", 5000)) {
            await fetchTransactionHistory(user.username);
            await fetchOrderHistory(user.username);
          } else {
            debugLog("Throttled user data refresh");
          }
        }

        if (
          (sanitizedFrom === "platform" || sanitizedTo === "platform") &&
          user &&
          (user.role === "admin" || isAdminUser(user.username))
        ) {
          if (!throttleManager.current.shouldThrottle("admin_platform_balance", 3000)) {
            await fetchAdminPlatformBalance();
            await fetchAdminActions();
          } else {
            debugLog("Throttled admin platform balance refresh");
          }
        }
      } catch (error) {
        console.error("[WalletContext] Error processing transaction:", error);
      }
    },
    [user, fetchTransactionHistory, fetchOrderHistory, fetchAdminPlatformBalance, fetchAdminActions]
  );

  // WebSocket subscriptions
  useEffect(() => {
    if (!isConnected || !subscribe) return;

    debugLog("Setting up WebSocket subscriptions for wallet updates");

    const unsubBalance = subscribe("wallet:balance_update" as WebSocketEvent, handleWalletBalanceUpdate);
    const unsubPlatform = subscribe("platform:balance_update" as WebSocketEvent, handlePlatformBalanceUpdate);
    const unsubTransaction = subscribe("wallet:transaction" as WebSocketEvent, handleWalletTransaction);
    const unsubOrderCreated = subscribe("order:created" as WebSocketEvent, handleOrderCreated);

    return () => {
      unsubBalance();
      unsubPlatform();
      unsubTransaction();
      unsubOrderCreated();
    };
  }, [
    isConnected,
    subscribe,
    handleWalletBalanceUpdate,
    handlePlatformBalanceUpdate,
    handleWalletTransaction,
    handleOrderCreated,
  ]);

  // Custom DOM events (back-compat)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBalanceUpdate = (event: CustomEvent) => {
      const data = event.detail;
      debugLog("Received custom balance update event:", data);
      handleWalletBalanceUpdate(data);
    };

    const handleTransaction = (event: CustomEvent) => {
      debugLog("Received custom transaction event:", event.detail);
      handleWalletTransaction(event.detail);
    };

    const handleOrderEvent = (event: CustomEvent) => {
      debugLog("Received custom order event:", event.detail);
      handleOrderCreated(event.detail);
    };

    window.addEventListener("wallet:balance_update", handleBalanceUpdate as EventListener);
    window.addEventListener("wallet:transaction", handleTransaction as EventListener);
    window.addEventListener("order:created", handleOrderEvent as EventListener);

    return () => {
      window.removeEventListener("wallet:balance_update", handleBalanceUpdate as EventListener);
      window.removeEventListener("wallet:transaction", handleTransaction as EventListener);
      window.removeEventListener("order:created", handleOrderEvent as EventListener);
    };
  }, [handleWalletBalanceUpdate, handleWalletTransaction, handleOrderCreated]);

  // Helper to emit wallet balance updates
  const emitBalanceUpdate = useCallback(
    (username: string, role: "buyer" | "seller" | "admin", balance: number) => {
      if (isConnected && sendMessage) {
        sendMessage(WebSocketEvent.WALLET_BALANCE_UPDATE, {
          username,
          role,
          balance,
          timestamp: Date.now(),
        });
      }
    },
    [isConnected, sendMessage]
  );

  // Tips
  const sendTip = useCallback(
    async (fromUsername: string, toUsername: string, amount: number, message?: string): Promise<boolean> => {
      try {
        checkRateLimit("TIP", fromUsername);

        if (!fromUsername || !toUsername || amount <= 0) return false;

        const validatedFrom = validateUsername(fromUsername);
        const validatedTo = validateUsername(toUsername);
        const validatedAmount = validateTransactionAmount(amount);

        const tipValidation = walletOperationSchemas.tipAmount.safeParse(validatedAmount);
        if (!tipValidation.success) return false;

        const senderBalance = buyerBalances[validatedFrom] || 0;
        if (senderBalance < validatedAmount) return false;

        const response = await apiClient.post<unknown>("/tips/send", {
          amount: validatedAmount,
          recipientUsername: validatedTo,
          message: message ? sanitizeStrict(message) : undefined,
        });

        if (!response.success) {
          console.error("[Wallet] Tip failed:", response.error);
          return false;
        }

        setBuyerBalancesState((prev) => ({
          ...prev,
          [validatedFrom]: prev[validatedFrom] - validatedAmount,
        }));

        setSellerBalancesState((prev) => ({
          ...prev,
          [validatedTo]: (prev[validatedTo] || 0) + validatedAmount,
        }));

        emitBalanceUpdate(validatedFrom, "buyer", senderBalance - validatedAmount);
        emitBalanceUpdate(validatedTo, "seller", (sellerBalances[validatedTo] || 0) + validatedAmount);

        const tipLog: DepositLog = {
          id: response.data?.transaction?.id || uuidv4(),
          username: validatedFrom,
          amount: validatedAmount,
          method: "credit_card",
          date: new Date().toISOString(),
          status: "completed",
          transactionId: response.data?.transaction?.id || uuidv4(),
          notes: `Tip to ${validatedTo}`,
        };

        setDepositLogs((prev) => [...prev, tipLog]);

        debugLog(`[Wallet] Tip sent: $${validatedAmount} from ${validatedFrom} to ${validatedTo}`);
        return true;
      } catch (error) {
        console.error("[Wallet] Error sending tip:", error);
        return false;
      }
    },
    [buyerBalances, sellerBalances, apiClient, emitBalanceUpdate]
  );

  // Platform transactions (admin)
  const getPlatformTransactions = useCallback(
    async (limit: number = 100, page: number = 1): Promise<Transaction[]> => {
      if (!user || (user.role !== "admin" && !isAdminUser(user.username))) {
        debugLog("Not admin user, skipping platform transactions fetch");
        return [];
      }

      try {
        debugLog("Fetching platform transactions...");
        const response = await apiClient.get<Transaction[]>(
          `/wallet/platform-transactions?limit=${limit}&page=${page}`
        );
        debugLog("Platform transactions response:", response);

        if (response.success && response.data) {
          return response.data;
        }

        console.warn("[WalletContext] Platform transactions fetch failed:", response.error);
        return [];
      } catch (error) {
        console.error("[WalletContext] Error fetching platform transactions:", error);
        return [];
      }
    },
    [user, apiClient]
  );

  // Admin analytics
  const fetchAdminAnalytics = useCallback(
    async (timeFilter: string = "all"): Promise<WalletAnalytics | null> => {
      if (!user || (user.role !== "admin" && !isAdminUser(user.username))) {
        debugLog("Not admin user, skipping analytics fetch");
        return null;
      }

      try {
        debugLog("Fetching admin analytics data with filter:", timeFilter);
      const response = await apiClient.get<WalletAnalytics>(
        `/wallet/admin/analytics?timeFilter=${timeFilter}`
      );
        debugLog("Admin analytics response:", response);

        if (response.success && response.data) {
          const data = response.data;

          if (data.adminBalance !== adminBalance) {
            setAdminBalanceState(data.adminBalance);
            fireAdminBalanceUpdateEvent(data.adminBalance);
          }

          setOrderHistory(data.orderHistory);
          setDepositLogs(data.depositLogs);
          setSellerWithdrawals(data.sellerWithdrawals);
          setAdminWithdrawals(data.adminWithdrawals);

          if (data.adminActions && data.adminActions.length > 0) {
            setAdminActions(data.adminActions);
          } else {
            await fetchAdminActions();
          }

          if (data.wallet) {
            Object.entries(data.wallet).forEach(([username, balance]) => {
              if (data.users[username]) {
                const userRole = data.users[username].role;
                if (userRole === "admin" || isAdminUser(username)) {
                  return;
                } else if (userRole === "buyer") {
                  setBuyerBalancesState((prev) => ({ ...prev, [username]: balance as number }));
                } else if (userRole === "seller") {
                  setSellerBalancesState((prev) => ({ ...prev, [username]: balance as number }));
                }
              }
            });
          }

          debugLog("Analytics data loaded:", {
            adminBalance: data.adminBalance,
            orders: data.orderHistory.length,
            deposits: data.depositLogs.length,
            adminActions: adminActions.length,
            summary: data.summary,
          });

          return data;
        }

        console.warn("[WalletContext] Analytics fetch failed:", response.error);
        return null;
      } catch (error) {
        console.error("[WalletContext] Error fetching analytics:", error);
        return null;
      }
    },
    [user, apiClient, fireAdminBalanceUpdateEvent, fetchAdminActions, adminActions.length, adminBalance]
  );

  const getAnalyticsData = useCallback(
    async (timeFilter: string = "all") => {
      if (!user || (user.role !== "admin" && !isAdminUser(user.username))) {
        debugLog("Not admin, cannot get analytics");
        return null;
      }
      return await fetchAdminAnalytics(timeFilter);
    },
    [user, fetchAdminAnalytics]
  );

  // Load all data from API
  const loadAllData = useCallback(async () => {
    if (!user) {
      debugLog("No user, skipping data load");
      return false;
    }

    try {
      debugLog("Loading wallet data from API for user:", user.username);

      if (user.role === "admin" || isAdminUser(user.username)) {
        debugLog("Admin detected - fetching unified platform wallet...");

        const platformBalance = await fetchAdminPlatformBalance();
        await fetchAdminActions();
        const analyticsData = await fetchAdminAnalytics("all");

        if (analyticsData) {
          if (platformBalance !== adminBalance) {
            setAdminBalanceState(platformBalance);
            fireAdminBalanceUpdateEvent(platformBalance);
          }

          debugLog("Admin analytics loaded with unified balance:", platformBalance);
        }

        return true;
      }

      const balance = await fetchBalance(user.username);
      debugLog("Fetched balance:", balance, "for role:", user.role);

      if (user.role === "buyer") {
        setBuyerBalancesState((prev) => ({ ...prev, [user.username]: balance }));
      } else if (user.role === "seller") {
        setSellerBalancesState((prev) => ({ ...prev, [user.username]: balance }));
      }

      await fetchOrderHistory(user.username);
      await fetchTransactionHistory(user.username);

      debugLog("Data loaded successfully");
      return true;
    } catch (error) {
      console.error("[WalletContext] Error loading wallet data:", error);
      setInitializationError("Failed to load wallet data");
      return false;
    }
  }, [
    user,
    fetchBalance,
    fetchAdminPlatformBalance,
    fetchAdminAnalytics,
    fetchOrderHistory,
    fetchTransactionHistory,
    fireAdminBalanceUpdateEvent,
    fetchAdminActions,
    adminBalance,
  ]);

  // Admin refresh
  const refreshAdminData = useCallback(async () => {
    if (!user || (user.role !== "admin" && !isAdminUser(user.username))) {
      debugLog("Not admin, skipping admin data refresh");
      return;
    }

    if (throttleManager.current.shouldThrottle("refresh_admin_data", 10000)) {
      debugLog("Admin data refresh throttled");
      return;
    }

    try {
      debugLog("Refreshing admin data...");

      const platformBalance = await fetchAdminPlatformBalance();

      if (!throttleManager.current.shouldThrottle("fetch_admin_actions", 30000)) {
        await fetchAdminActions();
      }

      if (!throttleManager.current.shouldThrottle("fetch_analytics", 60000)) {
        const analyticsData = await fetchAdminAnalytics("all");

        if (analyticsData && analyticsData.adminBalance !== platformBalance) {
          setAdminBalanceState(platformBalance);
          fireAdminBalanceUpdateEvent(platformBalance);
        }

        debugLog("Admin data refreshed with unified balance:", platformBalance);
      }
    } catch (error) {
      console.error("[WalletContext] Error refreshing admin data:", error);
    }
  }, [user, fetchAdminPlatformBalance, fetchAdminAnalytics, fireAdminBalanceUpdateEvent, fetchAdminActions]);

  // Initialize on login/logout
  useEffect(() => {
    const initializeWallet = async () => {
      if (initializingRef.current || !user) return;

      initializingRef.current = true;
      setIsLoading(true);
      setInitializationError(null);

      try {
        debugLog("Initializing wallet for user:", user.username);
        const loadSuccess = await loadAllData();

        if (loadSuccess) {
          setIsInitialized(true);
          debugLog("Wallet initialization complete");
        }
      } catch (error) {
        console.error("[WalletContext] Initialization error:", error);
        setInitializationError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    if (user) {
      initializeWallet();
    } else {
      // Clear on logout
      setBuyerBalancesState({});
      setSellerBalancesState({});
      setAdminBalanceState(0);
      setOrderHistory([]);
      setIsInitialized(false);
      deduplicationManager.current.destroy();
      deduplicationManager.current = new DeduplicationManager(30000);
      throttleManager.current.clear();
      lastPlatformBalanceFetch.current = null;
      lastFiredBalanceRef.current = null;
      lastAdminActionsFetch.current = 0;
    }
  }, [user, loadAllData]);

  // Balance getters
  const getBuyerBalance = useCallback(
    (username: string): number => {
      try {
        const validatedUsername = validateUsername(username);
        if (isAdminUser(validatedUsername)) return 0;
        return buyerBalances[validatedUsername] || 0;
      } catch {
        return 0;
      }
    },
    [buyerBalances]
  );

  const getSellerBalance = useCallback(
    (seller: string): number => {
      try {
        const validatedSeller = validateUsername(seller);
        if (isAdminUser(validatedSeller)) return 0;
        return sellerBalances[validatedSeller] || 0;
      } catch {
        return 0;
      }
    },
    [sellerBalances]
  );

  // Balance setters (local cache + WS emit)
  const setBuyerBalance = useCallback(
    async (username: string, balance: number) => {
      if (isAdminUser(username)) {
        debugLog("Skipping buyer balance update for admin user");
        return;
      }

      const validatedUsername = validateUsername(username);
      setBuyerBalancesState((prev) => ({
        ...prev,
        [validatedUsername]: balance,
      }));

      emitBalanceUpdate(validatedUsername, "buyer", balance);
    },
    [emitBalanceUpdate]
  );

  const setSellerBalance = useCallback(
    async (seller: string, balance: number) => {
      if (isAdminUser(seller)) {
        debugLog("Skipping seller balance update for admin user");
        return;
      }

      const validatedSeller = validateUsername(seller);
      setSellerBalancesState((prev) => ({
        ...prev,
        [validatedSeller]: balance,
      }));

      emitBalanceUpdate(validatedSeller, "seller", balance);
    },
    [emitBalanceUpdate]
  );

  const setAdminBalance = useCallback(
    async (balance: number) => {
      if (adminBalance !== balance) {
        setAdminBalanceState(balance);
        fireAdminBalanceUpdateEvent(balance);
        emitBalanceUpdate("platform", "admin", balance);
      }
    },
    [emitBalanceUpdate, fireAdminBalanceUpdateEvent, adminBalance]
  );

  // Create order via API
  const addOrder = useCallback(
    async (order: Order) => {
      try {
        debugLog("Creating order via API:", order);

        const orderPayload = {
          title: order.title,
          description: order.description,
          price: order.price,
          markedUpPrice: order.markedUpPrice,
          seller: order.seller,
          buyer: order.buyer,
          tags: order.tags || [],
          wasAuction: order.wasAuction || false,
          imageUrl: order.imageUrl,
          listingId: order.listingId,
          deliveryAddress: order.deliveryAddress || {
            fullName: "John Doe",
            addressLine1: "123 Main St",
            city: "New York",
            state: "NY",
            postalCode: "10001",
            country: "US",
          },
        };

        const response = await apiClient.post<unknown>("/orders", orderPayload);
        debugLog("Order creation response:", response);

        if (response.success && response.data) {
          const orderWithTier = {
            ...response.data,
            sellerTier: response.data.sellerTier,
            tierCreditAmount: response.data.tierCreditAmount || 0,
          };

          setOrderHistory((prev) => [...prev, orderWithTier]);

          if (user?.username) {
            const newBalance = await fetchBalance(user.username);

            if (user.role === "buyer") {
              setBuyerBalancesState((prev) => ({ ...prev, [user.username]: newBalance }));
            } else if (user.role === "seller") {
              setSellerBalancesState((prev) => ({ ...prev, [user.username]: newBalance }));
            } else if (user.role === "admin" || isAdminUser(user.username)) {
              await refreshAdminData();
            }
          }

          if (user?.role === "admin" || isAdminUser(user?.username || "")) {
            await fetchAdminActions();
          }

          if (user?.username) {
            if (!throttleManager.current.shouldThrottle("order_refresh", 3000)) {
              await fetchOrderHistory(user.username);
            }
          }

          debugLog("Order created and balance updated");
        } else {
          const errorMessage = response.error?.message || response.error || "Order creation failed";
          console.error("[WalletContext] Order creation failed:", errorMessage);
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("[WalletContext] Failed to create order:", error);
        throw error;
      }
    },
    [apiClient, fetchBalance, fetchOrderHistory, refreshAdminData, user, fetchAdminActions]
  );

  // Custom request purchase
  const purchaseCustomRequest = useCallback(
    async (request: CustomRequestPurchase): Promise<boolean> => {
      console.log("[WalletContext] Processing custom request purchase:", request);

      try {
        const orderRequest = {
          requestId: request.requestId,
          title: request.description || "Custom Request",
          description: request.metadata?.description || request.description,
          price: request.amount,
          seller: request.seller,
          buyer: request.buyer,
          tags: request.metadata?.tags || [],
          deliveryAddress: undefined,
        };

        const response = await apiClient.post<unknown>("/orders/custom-request", orderRequest);
        debugLog("Custom request order response:", response);

        if (response.success && response.data) {
          const orderWithDetails = {
            ...response.data,
            isCustomRequest: true,
            originalRequestId: request.requestId,
          };
          setOrderHistory((prev) => [...prev, orderWithDetails]);

          await loadAllData();

          window.dispatchEvent(
            new CustomEvent("custom_request:paid", {
              detail: {
                requestId: request.requestId,
                orderId: response.data.id,
                buyer: request.buyer,
                seller: request.seller,
                amount: request.amount,
              },
            })
          );

          if (addSellerNotification) {
            addSellerNotification(
              request.seller,
              `💰 Custom request "${request.description}" has been paid! Check your orders to fulfill.`
            );
          }

          return true;
        } else {
          console.error("[WalletContext] Failed to create custom request order:", response.error);
          if (response.error?.message?.includes("Insufficient balance")) {
            throw new Error(response.error.message);
          }
          return false;
        }
      } catch (error) {
        console.error("[WalletContext] Error processing custom request purchase:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to process custom request payment");
      }
    },
    [apiClient, loadAllData, addSellerNotification]
  );

  // Deposits
  const addDeposit = useCallback(
    async (
      username: string,
      amount: number,
      method: DepositLog["method"],
      notes?: string
    ): Promise<boolean> => {
      try {
        checkRateLimit("DEPOSIT", username);

        const validatedUsername = validateUsername(username);
        const validatedAmount = validateTransactionAmount(amount);

        const response = await apiClient.post<unknown>("/wallet/deposit", {
          amount: validatedAmount,
          method,
          notes,
        });

        debugLog("Deposit response:", response);

        if (response.success) {
          await new Promise((resolve) => setTimeout(resolve, 500));

          const newBalance = await fetchBalance(validatedUsername);
          debugLog("New balance after deposit:", newBalance);

          if (!isAdminUser(validatedUsername)) {
            setBuyerBalancesState((prev) => ({ ...prev, [validatedUsername]: newBalance }));
          }

          const depositLog: DepositLog = {
            id: response.data?.id || uuidv4(),
            username: validatedUsername,
            amount: validatedAmount,
            method,
            date: response.data?.createdAt || new Date().toISOString(),
            status: "completed",
            transactionId: response.data?.id || uuidv4(),
            notes,
          };

          setDepositLogs((prev) => [...prev, depositLog]);

          if (!isAdminUser(validatedUsername)) {
            emitBalanceUpdate(validatedUsername, "buyer", newBalance);
          }

          debugLog("Deposit successful");
          return true;
        } else {
          console.error("[WalletContext] Deposit failed:", response.error);
          if (response.error?.message) throw new Error(response.error.message);
          return false;
        }
      } catch (error) {
        console.error("[WalletContext] Error processing deposit:", error);
        throw error;
      }
    },
    [apiClient, fetchBalance, emitBalanceUpdate, user]
  );

  // Purchase listing
  const purchaseListing = useCallback(
    async (listing: Listing, buyerUsername: string): Promise<boolean> => {
      try {
        checkRateLimit("API_CALL", buyerUsername);

        const validatedBuyer = validateUsername(buyerUsername);
        const validatedSeller = validateUsername(listing.seller);

        const priceValidation = securityService.validateAmount(listing.price, {
          min: 0.01,
          max: 100000,
        });
        if (!priceValidation.valid) {
          throw new Error(priceValidation.error || "Invalid listing price");
        }

        await addOrder({
          id: listing.id || uuidv4(),
          title: listing.title,
          description: listing.description,
          price: listing.price,
          markedUpPrice: listing.markedUpPrice || listing.price,
          seller: validatedSeller,
          buyer: validatedBuyer,
          imageUrl: listing.imageUrls?.[0],
          date: new Date().toISOString(),
          shippingStatus: "pending",
          tags: listing.tags || [],
          listingId: listing.id,
          deliveryAddress: {
            fullName: "John Doe",
            addressLine1: "123 Main St",
            city: "New York",
            state: "NY",
            postalCode: "10001",
            country: "US",
          },
        });

        debugLog("Purchase successful");
        return true;
      } catch (error) {
        console.error("[Purchase] Error:", error);
        throw error;
      }
    },
    [addOrder]
  );

  // Withdrawals
  const addSellerWithdrawal = useCallback(
    async (username: string, amount: number) => {
      try {
        checkRateLimit("WITHDRAWAL", username);

        const validatedUsername = validateUsername(username);
        const validatedAmount = validateTransactionAmount(amount);

        const response = await apiClient.post<unknown>("/wallet/withdraw", {
          username: validatedUsername,
          amount: validatedAmount,
          accountDetails: {
            accountNumber: "****1234",
            routingNumber: "123456789",
            accountType: "checking",
          },
        });

        debugLog("Withdrawal response:", response);

        if (response.success) {
          const newWithdrawal: Withdrawal = {
            amount: validatedAmount,
            date: response.data?.createdAt || new Date().toISOString(),
            status: response.data?.status || "pending",
          };

          setSellerWithdrawals((prev) => ({
            ...prev,
            [validatedUsername]: [...(prev[validatedUsername] || []), newWithdrawal],
          }));

          const newBalance = await fetchBalance(validatedUsername);
          if (!isAdminUser(validatedUsername)) {
            setSellerBalancesState((prev) => ({ ...prev, [validatedUsername]: newBalance }));
          }

          debugLog("Withdrawal successful");
        } else {
          console.error("[WalletContext] Withdrawal failed:", response.error);
          throw new Error(response.error?.message || "Withdrawal failed");
        }
      } catch (error) {
        console.error("[WalletContext] Withdrawal error:", error);
        throw error;
      }
    },
    [apiClient, fetchBalance]
  );

  // Admin credit/debit
  const adminCreditUser = useCallback(
    async (
      username: string,
      role: "buyer" | "seller",
      amount: number,
      reason: string
    ): Promise<boolean> => {
      try {
        checkRateLimit("REPORT_ACTION", "admin");

        const validatedUsername = validateUsername(username);
        const validatedAmount = validateTransactionAmount(amount);
        const sanitizedReason = sanitizeStrict(reason);

        const response = await apiClient.post<unknown>("/wallet/admin-actions", {
          action: "credit",
          username: validatedUsername,
          amount: validatedAmount,
          reason: sanitizedReason,
          adminUsername: user?.username || "platform",
        });

        debugLog("Admin credit response:", response);

        if (response.success) {
          const newBalance = await fetchBalance(validatedUsername);

          if (role === "buyer" && !isAdminUser(validatedUsername)) {
            setBuyerBalancesState((prev) => ({ ...prev, [validatedUsername]: newBalance }));
          } else if (role === "seller" && !isAdminUser(validatedUsername)) {
            setSellerBalancesState((prev) => ({ ...prev, [validatedUsername]: newBalance }));
          }

          if (user?.role === "admin" || isAdminUser(user?.username || "")) {
            await fetchAdminPlatformBalance();
            await fetchAdminActions();
          }

          const action: AdminAction = {
            id: response.data?.id || uuidv4(),
            type: "credit",
            amount: validatedAmount,
            targetUser: validatedUsername,
            username: validatedUsername,
            adminUser: user?.username || "platform",
            reason: sanitizedReason,
            date: response.data?.createdAt || new Date().toISOString(),
            role,
          };

          setAdminActions((prev) => [...prev, action]);

          debugLog("Admin credit successful");
          return true;
        }

        console.error("[WalletContext] Admin credit failed:", response.error);
        return false;
      } catch (error) {
        console.error("Admin credit error:", error);
        return false;
      }
    },
    [user, apiClient, fetchBalance, fetchAdminPlatformBalance, fetchAdminActions]
  );

  const adminDebitUser = useCallback(
    async (
      username: string,
      role: "buyer" | "seller",
      amount: number,
      reason: string
    ): Promise<boolean> => {
      try {
        checkRateLimit("REPORT_ACTION", "admin");

        const validatedUsername = validateUsername(username);
        const validatedAmount = validateTransactionAmount(amount);
        const sanitizedReason = sanitizeStrict(reason);

        const response = await apiClient.post<unknown>("/wallet/admin-actions", {
          action: "debit",
          username: validatedUsername,
          amount: validatedAmount,
          reason: sanitizedReason,
          adminUsername: user?.username || "platform",
        });

        debugLog("Admin debit response:", response);

        if (response.success) {
          const newBalance = await fetchBalance(validatedUsername);

          if (role === "buyer" && !isAdminUser(validatedUsername)) {
            setBuyerBalancesState((prev) => ({ ...prev, [validatedUsername]: newBalance }));
          } else if (role === "seller" && !isAdminUser(validatedUsername)) {
            setSellerBalancesState((prev) => ({ ...prev, [validatedUsername]: newBalance }));
          }

          if (user?.role === "admin" || isAdminUser(user?.username || "")) {
            await fetchAdminPlatformBalance();
            await fetchAdminActions();
          }

          const action: AdminAction = {
            id: response.data?.id || uuidv4(),
            type: "debit",
            amount: validatedAmount,
            targetUser: validatedUsername,
            username: validatedUsername,
            adminUser: user?.username || "platform",
            reason: sanitizedReason,
            date: response.data?.createdAt || new Date().toISOString(),
            role,
          };

          setAdminActions((prev) => [...prev, action]);

          debugLog("Admin debit successful");
          return true;
        }

        console.error("[WalletContext] Admin debit failed:", response.error);
        return false;
      } catch (error) {
        console.error("Admin debit error:", error);
        return false;
      }
    },
    [user, apiClient, fetchBalance, fetchAdminPlatformBalance, fetchAdminActions]
  );

  // Transactions for a user
  const getTransactionHistory = useCallback(
    async (username?: string, limit?: number): Promise<Transaction[]> => {
      try {
        const targetUsername = username || user?.username;
        if (!targetUsername) {
          console.warn("[WalletContext] No username for transaction history");
          return [];
        }

        const queryUsername = isAdminUser(targetUsername) ? "platform" : targetUsername;
        const endpoint = `/wallet/transactions/${queryUsername}${limit ? `?limit=${limit}` : ""}`;
        debugLog("Fetching transaction history:", endpoint);

        const response = await apiClient.get<Transaction[]>(endpoint);
        debugLog("Transaction history response:", response);

        if (response.success && response.data) {
          return response.data;
        }

        return [];
      } catch (error) {
        console.error("Error getting transaction history:", error);
        return [];
      }
    },
    [apiClient, user]
  );

  // Reload data wrapper
  const reloadData = useCallback(async () => {
    if (isLoading) {
      debugLog("Already loading, skipping reload");
      return;
    }

    setIsLoading(true);
    try {
      await loadAllData();
      if (user?.role === "admin" || isAdminUser(user?.username || "")) {
        await fetchAdminActions();
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadAllData, isLoading, user, fetchAdminActions]);

  // Subscriptions
  const subscribeToSellerWithPayment = useCallback(
    async (buyer: string, seller: string, amount: number): Promise<boolean> => {
      try {
        debugLog("Processing subscription via API:", { buyer, seller, amount });

        const response = await apiClient.post<unknown>("/subscriptions/subscribe", {
          seller,
          price: amount,
        });

        debugLog("Subscription response:", response);

        if (response.success) {
          const newBalance = await fetchBalance(buyer);
          if (!isAdminUser(buyer)) {
            setBuyerBalancesState((prev) => ({ ...prev, [buyer]: newBalance }));
          }
          return true;
        }

        return false;
      } catch (error) {
        console.error("Subscription error:", error);
        return false;
      }
    },
    [apiClient, fetchBalance]
  );

  const unsubscribeFromSeller = useCallback(
    async (buyer: string, seller: string): Promise<boolean> => {
      try {
        debugLog("Processing unsubscribe via API:", { buyer, seller });

        const response = await apiClient.post<unknown>("/subscriptions/unsubscribe", {
          seller,
        });

        debugLog("Unsubscribe response:", response);

        if (response.success) {
          if (buyer === user?.username) {
            const newBalance = await fetchBalance(buyer);
            if (!isAdminUser(buyer)) {
              setBuyerBalancesState((prev) => ({ ...prev, [buyer]: newBalance }));
            }
          }

          return true;
        }

        console.error("[WalletContext] Unsubscribe failed:", response.error);
        return false;
      } catch (error) {
        console.error("[WalletContext] Unsubscribe error:", error);
        return false;
      }
    },
    [apiClient, fetchBalance, user]
  );

  // Admin withdrawal
  const addAdminWithdrawal = useCallback(
    async (amount: number) => {
      try {
        debugLog("Processing admin withdrawal from unified platform wallet");

        const response = await apiClient.post<unknown>("/wallet/admin-withdraw", {
          amount,
          accountDetails: {
            accountNumber: "****9999",
            accountType: "business",
          },
          notes: `Platform withdrawal by ${user?.username}`,
        });

        if (response.success) {
          const withdrawal: Withdrawal = {
            amount,
            date: new Date().toISOString(),
            status: "completed",
            method: "bank_transfer",
          };

          setAdminWithdrawals((prev) => [...prev, withdrawal]);

          await fetchAdminPlatformBalance();

          debugLog("Admin withdrawal successful");
        } else {
          console.error("[WalletContext] Admin withdrawal failed:", response.error);
          throw new Error(response.error?.message || "Withdrawal failed");
        }
      } catch (error) {
        console.error("[WalletContext] Admin withdrawal error:", error);
        throw error;
      }
    },
    [apiClient, fetchAdminPlatformBalance, user]
  );

  // Order updates
  const updateOrderAddress = useCallback(
    async (orderId: string, address: DeliveryAddress) => {
      try {
        debugLog("Updating order address:", orderId);

        const response = await apiClient.post<unknown>(`/orders/${orderId}/address`, {
          deliveryAddress: address,
        });

        if (response.success) {
          setOrderHistory((prev) =>
            prev.map((order) => (order.id === orderId ? { ...order, deliveryAddress: address } : order))
          );

          debugLog("Order address updated successfully");
        } else {
          throw new Error(response.error?.message || "Failed to update address");
        }
      } catch (error) {
        console.error("[WalletContext] Error updating order address:", error);
        throw error;
      }
    },
    [apiClient]
  );

  const updateShippingStatus = useCallback(
    async (orderId: string, status: "pending" | "processing" | "shipped") => {
      try {
        debugLog("Updating shipping status:", orderId, status);

        const response = await apiClient.post<unknown>(`/orders/${orderId}/shipping`, {
          shippingStatus: status,
        });

        if (response.success) {
          setOrderHistory((prev) =>
            prev.map((order) => (order.id === orderId ? { ...order, shippingStatus: status } : order))
          );

          debugLog("Shipping status updated successfully");
        } else {
          throw new Error(response.error?.message || "Failed to update shipping status");
        }
      } catch (error) {
        console.error("[WalletContext] Error updating shipping status:", error);
        throw error;
      }
    },
    [apiClient]
  );

  // Auction stubs
  const holdBidFunds = useCallback(async (): Promise<boolean> => {
    debugLog("Auction features not fully implemented in API yet");
    return false;
  }, []);

  const refundBidFunds = useCallback(async (): Promise<boolean> => {
    debugLog("Auction features not fully implemented in API yet");
    return false;
  }, []);

  const placeBid = useCallback(async (): Promise<boolean> => {
    debugLog("Auction features not fully implemented in API yet");
    return false;
  }, []);

  const finalizeAuctionPurchase = useCallback(async (): Promise<boolean> => {
    debugLog("Auction features not fully implemented in API yet");
    return false;
  }, []);

  // Enhanced features stubs
  const checkSuspiciousActivity = useCallback(async (username: string) => {
    return { suspicious: false, reasons: [] };
  }, []);

  const reconcileBalance = useCallback(async (username: string, role: "buyer" | "seller" | "admin") => {
    return null;
  }, []);

  const contextValue: WalletContextType = {
    // Loading state
    isLoading,
    isInitialized,
    initializationError,

    // Core functionality
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
    unsubscribeFromSeller,
    orderHistory,
    addOrder,
    sellerWithdrawals,
    adminWithdrawals,
    addSellerWithdrawal,
    addAdminWithdrawal,
    wallet: { ...buyerBalances, ...sellerBalances, admin: adminBalance },
    updateWallet: () => {
      console.warn("updateWallet is deprecated - use API methods instead");
    },
    sendTip,
    setAddSellerNotificationCallback,
    adminCreditUser,
    adminDebitUser,
    adminActions,
    updateOrderAddress,
    updateShippingStatus,
    depositLogs,
    addDeposit,
    getDepositsForUser: (username: string) => depositLogs.filter((log) => log.username === username),
    getTotalDeposits: () => depositLogs.reduce((sum, log) => sum + log.amount, 0),
    getDepositsByTimeframe: () => depositLogs,

    // Auction methods (stubs for now)
    holdBidFunds,
    refundBidFunds,
    finalizeAuctionPurchase,
    placeBid,
    chargeIncrementalBid: async () => false,
    getAuctionBidders: async () => [],
    cleanupAuctionTracking: async () => {},

    // Enhanced features
    checkSuspiciousActivity,
    reconcileBalance,
    getTransactionHistory,

    // Admin-specific methods
    refreshAdminData,
    getPlatformTransactions,
    getAnalyticsData,

    // Data management
    reloadData,
  };

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
}

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
