// src/utils/walletSync.ts

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
    }
  } catch (error) {
    console.error('[ForceSync] Error syncing wallet:', error);
  }
}

// Add to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).forceSyncWalletBalance = forceSyncWalletBalance;
}
