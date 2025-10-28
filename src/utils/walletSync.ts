// src/utils/walletSync.ts

import { storageService } from '@/services/storage.service';

type SellerBalanceEntry = number | SellerBalanceObject;

interface SellerBalanceObject extends Record<string, unknown> {
  balance?: number;
}

const isSellerBalanceObject = (value: unknown): value is SellerBalanceObject =>
  typeof value === 'object' && value !== null && 'balance' in value;

const toNumericBalance = (entry: unknown): number => {
  if (typeof entry === 'number' && Number.isFinite(entry)) {
    return entry;
  }
  if (isSellerBalanceObject(entry) && typeof entry.balance === 'number' && Number.isFinite(entry.balance)) {
    return entry.balance;
  }
  return 0;
};

/**
 * Force sync wallet balances between enhanced service and WalletContext
 * This ensures both storage mechanisms stay in sync
 */
export async function forceSyncWalletBalance(username: string): Promise<void> {
  try {
    console.log('[ForceSync] Starting wallet sync for:', username);
    
    // Get balance from enhanced service (in cents)
    const balanceKey = `wallet_buyer_${username}`;
    const balanceInCents = localStorage.getItem(balanceKey);
    console.log('[ForceSync] Balance in cents from storage:', balanceInCents);
    
    if (balanceInCents !== null) {
      const balanceInDollars = parseInt(balanceInCents) / 100;
      console.log('[ForceSync] Balance in dollars:', balanceInDollars);
      
      // Update wallet_buyers object
      const buyersJson = localStorage.getItem('wallet_buyers') || '{}';
      const buyers = JSON.parse(buyersJson);
      buyers[username] = balanceInDollars;
      localStorage.setItem('wallet_buyers', JSON.stringify(buyers));
      console.log('[ForceSync] Updated wallet_buyers:', buyers);
      
      // Force a storage event to trigger WalletContext update
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'wallet_buyers',
        newValue: JSON.stringify(buyers),
        url: window.location.href
      }));
      console.log('[ForceSync] Dispatched storage event');
      
      // Also trigger global balance update
      if (typeof window !== 'undefined' && window.__pantypost_balance_context?.forceUpdate) {
        window.__pantypost_balance_context.forceUpdate();
      }
    }
  } catch (error) {
    console.error('[ForceSync] Error syncing wallet:', error);
  }
}

/**
 * Enhanced sync that updates all storage formats and triggers events
 */
export async function enhancedWalletSync(
  username: string, 
  role: 'buyer' | 'seller', 
  newBalance: number
): Promise<void> {
  try {
    console.log('[EnhancedSync] Syncing wallet for:', { username, role, newBalance });
    
    // Update individual key (in cents)
    const balanceInCents = Math.round(newBalance * 100);
    const individualKey = `wallet_${role}_${username}`;
    localStorage.setItem(individualKey, balanceInCents.toString());
    
    // Update collective storage
    const collectiveKey = role === 'buyer' ? 'wallet_buyers' : 'wallet_sellers';
    const collectiveData = JSON.parse(localStorage.getItem(collectiveKey) || '{}');
    
    // FIXED: Always store seller balance as a number, not an object
    collectiveData[username] = newBalance;
    
    localStorage.setItem(collectiveKey, JSON.stringify(collectiveData));
    
    // Dispatch storage event for cross-tab sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: collectiveKey,
      newValue: JSON.stringify(collectiveData),
      url: window.location.href
    }));
    
    // Trigger global update
    if (typeof window !== 'undefined' && window.__pantypost_balance_context?.forceUpdate) {
      window.__pantypost_balance_context.forceUpdate();
    }
    
    // Emit custom event for immediate local updates
    window.dispatchEvent(new CustomEvent('wallet-balance-updated', {
      detail: { username, role, balance: newBalance }
    }));
    
    console.log('[EnhancedSync] Sync completed successfully');
  } catch (error) {
    console.error('[EnhancedSync] Error:', error);
  }
}

/**
 * Subscribe to wallet balance updates
 */
export function subscribeToWalletUpdates(
  callback: (data: { username: string; role: string; balance: number }) => void
): () => void {
  const handleUpdate = (event: Event) => {
    if (event instanceof CustomEvent) {
      callback(event.detail);
    }
  };
  
  window.addEventListener('wallet-balance-updated', handleUpdate);
  
  // Return unsubscribe function
  return () => {
    window.removeEventListener('wallet-balance-updated', handleUpdate);
  };
}

/**
 * Sync all wallet data across storage formats
 */
export async function syncAllWalletData(): Promise<void> {
  try {
    console.log('[SyncAll] Starting full wallet sync');
    
    // Sync buyer balances
    const buyerBalances = await storageService.getItem<Record<string, number>>('wallet_buyers', {});
    for (const [username, balance] of Object.entries(buyerBalances)) {
      const balanceInCents = Math.round(balance * 100);
      await storageService.setItem(`wallet_buyer_${username}`, balanceInCents);
    }
    
    // Sync seller balances - FIXED to handle both number and object formats
    const sellerBalances = await storageService.getItem<Record<string, SellerBalanceEntry>>('wallet_sellers', {});
    const normalizedSellerBalances: Record<string, number> = {};

    for (const [username, data] of Object.entries(sellerBalances)) {
      const balance = toNumericBalance(data);
      const balanceInCents = Math.round(balance * 100);
      await storageService.setItem(`wallet_seller_${username}`, balanceInCents);
      normalizedSellerBalances[username] = balance;
    }

    // Save the fixed seller balances back
    await storageService.setItem('wallet_sellers', normalizedSellerBalances);
    
    console.log('[SyncAll] Full sync completed');
  } catch (error) {
    console.error('[SyncAll] Error:', error);
  }
}

/**
 * Real-time balance listener for components
 */
export class WalletBalanceListener {
  private listeners: Map<string, Set<(balance: number) => void>> = new Map();
  private currentBalances: Map<string, number> = new Map();
  private pollInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startPolling();
    this.setupEventListeners();
  }
  
  private startPolling() {
    // Poll for balance changes every 2 seconds
    this.pollInterval = setInterval(() => {
      this.checkForBalanceChanges();
    }, 2000);
  }
  
  private setupEventListeners() {
    // Listen for storage events
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Listen for custom wallet update events
    window.addEventListener('wallet-balance-updated', this.handleWalletUpdate.bind(this));
  }
  
  private handleStorageChange(event: StorageEvent) {
    if (event.key === 'wallet_buyers' || event.key === 'wallet_sellers') {
      this.checkForBalanceChanges();
    }
  }
  
  private handleWalletUpdate(event: Event) {
    if (event instanceof CustomEvent) {
      const { username, role, balance } = event.detail;
      const key = `${role}_${username}`;
      this.notifyListeners(key, balance);
    }
  }
  
  private async checkForBalanceChanges() {
    try {
      // Check buyer balances
      const buyers = JSON.parse(localStorage.getItem('wallet_buyers') || '{}');
      for (const [username, balance] of Object.entries(buyers)) {
        const key = `buyer_${username}`;
        const currentBalance = this.currentBalances.get(key);
        if (currentBalance !== balance) {
          this.currentBalances.set(key, balance as number);
          this.notifyListeners(key, balance as number);
        }
      }
      
      // Check seller balances - FIXED to handle both number and object formats
      const sellers = JSON.parse(localStorage.getItem('wallet_sellers') || '{}') as Record<string, unknown>;
      for (const [username, data] of Object.entries(sellers)) {
        const balance = toNumericBalance(data);
        const key = `seller_${username}`;
        const currentBalance = this.currentBalances.get(key);
        if (currentBalance !== balance) {
          this.currentBalances.set(key, balance);
          this.notifyListeners(key, balance);
        }
      }
    } catch (error) {
      console.error('[WalletBalanceListener] Error checking balances:', error);
    }
  }
  
  private notifyListeners(key: string, balance: number) {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(balance);
        } catch (error) {
          console.error('[WalletBalanceListener] Error in callback:', error);
        }
      });
    }
  }
  
  subscribe(username: string, role: 'buyer' | 'seller', callback: (balance: number) => void): () => void {
    const key = `${role}_${username}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(callback);
    
    // Immediately call with current balance
    const currentBalance = this.currentBalances.get(key) || 0;
    callback(currentBalance);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }
  
  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
    window.removeEventListener('wallet-balance-updated', this.handleWalletUpdate.bind(this));
    this.listeners.clear();
    this.currentBalances.clear();
  }
}

// Create a singleton instance
let balanceListenerInstance: WalletBalanceListener | null = null;

export function getWalletBalanceListener(): WalletBalanceListener {
  if (!balanceListenerInstance) {
    balanceListenerInstance = new WalletBalanceListener();
  }
  return balanceListenerInstance;
}

declare global {
  interface Window {
    __pantypost_balance_context?: {
      forceUpdate?: () => void;
    };
    forceSyncWalletBalance?: typeof forceSyncWalletBalance;
    enhancedWalletSync?: typeof enhancedWalletSync;
    syncAllWalletData?: typeof syncAllWalletData;
  }
}

// Add to window for easy testing
if (typeof window !== 'undefined') {
  window.forceSyncWalletBalance = forceSyncWalletBalance;
  window.enhancedWalletSync = enhancedWalletSync;
  window.syncAllWalletData = syncAllWalletData;
}
