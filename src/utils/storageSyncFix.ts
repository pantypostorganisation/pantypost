// src/utils/storageSyncFix.ts
import { storageService } from '@/services/storage.service';
import { ordersService } from '@/services/orders.service';

/**
 * Force synchronize all wallet-related localStorage data
 * This ensures all contexts see the same data
 */
export async function forceWalletStorageSync(): Promise<void> {
  console.log('[StorageSync] Starting forced wallet sync...');
  
  // Clear all caches
  ordersService.clearCache();
  
  // Force read current data
  const buyers = await storageService.getItem<Record<string, number>>('wallet_buyers', {});
  const orders = await storageService.getItem<any[]>('wallet_orders', []);
  
  // Re-write to trigger storage events
  await storageService.setItem('wallet_buyers', buyers);
  await storageService.setItem('wallet_orders', orders);
  
  // Dispatch custom events for immediate updates
  window.dispatchEvent(new CustomEvent('wallet-force-sync', {
    detail: { buyers, orders }
  }));
  
  console.log('[StorageSync] Sync complete');
}

/**
 * Atomic refund operation with proper synchronization
 * FIXED: Now properly handles the refund amount
 */
export async function atomicRefundOperation(
  bidder: string,
  listingId: string,
  refundAmount: number
): Promise<boolean> {
  try {
    console.log('[AtomicRefund] Starting atomic refund:', { bidder, listingId, refundAmount });
    
    // CRITICAL FIX: If refundAmount is 0, we need to find the actual amount from orders
    let actualRefundAmount = refundAmount;
    
    if (refundAmount === 0) {
      console.log('[AtomicRefund] Refund amount is 0, fetching from orders...');
      
      // Get all orders
      const orders = await storageService.getItem<any[]>('wallet_orders', []);
      
      // Find the pending auction order for this listing and bidder
      const pendingOrder = orders.find(order => 
        order.buyer === bidder && 
        order.listingId === listingId && 
        order.shippingStatus === 'pending-auction'
      );
      
      if (pendingOrder) {
        // Use markedUpPrice which includes the buyer fee
        actualRefundAmount = pendingOrder.markedUpPrice;
        console.log('[AtomicRefund] Found pending order, actual refund amount:', actualRefundAmount);
      } else {
        console.error('[AtomicRefund] No pending order found for bidder');
        return false;
      }
    }
    
    // Only proceed if we have a valid refund amount
    if (actualRefundAmount <= 0) {
      console.error('[AtomicRefund] Invalid refund amount:', actualRefundAmount);
      return false;
    }
    
    // 1. Get current data
    const buyers = await storageService.getItem<Record<string, number>>('wallet_buyers', {});
    const orders = await storageService.getItem<any[]>('wallet_orders', []);
    
    // 2. Update buyer balance - ONLY for the specific bidder
    const currentBalance = buyers[bidder] || 0;
    const newBalance = currentBalance + actualRefundAmount;
    
    // CRITICAL: Create a new buyers object to avoid reference issues
    const updatedBuyers = { ...buyers };
    updatedBuyers[bidder] = newBalance;
    
    console.log('[AtomicRefund] Updating balance:', {
      bidder,
      currentBalance,
      refundAmount: actualRefundAmount,
      newBalance,
      allBuyersBefore: buyers,
      allBuyersAfter: updatedBuyers
    });
    
    // 3. Remove pending auction orders
    const filteredOrders = orders.filter(order => 
      !(order.buyer === bidder && 
        order.listingId === listingId && 
        order.shippingStatus === 'pending-auction')
    );
    
    console.log('[AtomicRefund] Removed orders:', orders.length - filteredOrders.length);
    
    // 4. Save both updates atomically - use updatedBuyers instead of buyers
    await Promise.all([
      storageService.setItem('wallet_buyers', updatedBuyers),
      storageService.setItem('wallet_orders', filteredOrders)
    ]);
    
    // 5. Clear caches and force sync
    ordersService.clearCache();
    
    // 6. Dispatch multiple storage events to ensure all listeners update
    for (let i = 0; i < 3; i++) {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'wallet_buyers',
        newValue: JSON.stringify(updatedBuyers),
        oldValue: JSON.stringify(buyers),
        url: window.location.href,
        storageArea: localStorage
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'wallet_orders',
        newValue: JSON.stringify(filteredOrders),
        oldValue: JSON.stringify(orders),
        url: window.location.href,
        storageArea: localStorage
      }));
      
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // 7. Force sync
    await forceWalletStorageSync();
    
    console.log('[AtomicRefund] ✅ Refund complete:', {
      bidder,
      refundedAmount: actualRefundAmount,
      newBalance
    });
    
    return true;
  } catch (error) {
    console.error('[AtomicRefund] Error:', error);
    return false;
  }
}