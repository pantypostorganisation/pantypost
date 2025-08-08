// src/utils/ordersMigration.ts

import type { Order } from '@/types/wallet';
import { storageService, ordersService, authService } from '@/services';

/**
 * Orders Migration Utilities
 * Ensures smooth transition from direct storage to service-based architecture
 */

/**
 * Check if orders need migration
 */
export async function checkOrdersMigrationNeeded(): Promise<boolean> {
  try {
    // Check if migration flag exists
    const migrationFlag = await storageService.getItem<boolean>('orders_migrated_to_service', false);
    if (migrationFlag) {
      return false; // Already migrated
    }

    // Check if old orders exist in storage
    const oldOrders = await storageService.getItem<Order[]>('wallet_orders', []);
    return oldOrders.length > 0;
  } catch (error) {
    console.error('Error checking orders migration:', error);
    return false;
  }
}

/**
 * Migrate orders from direct storage to service
 */
export async function migrateOrdersToService(): Promise<{ success: boolean; migratedCount: number }> {
  try {
    console.log('[OrdersMigration] Starting orders migration...');

    // CRITICAL FIX: Check if user is authenticated before attempting migration
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      console.log('[OrdersMigration] No authenticated user - skipping API migration');
      await storageService.setItem('orders_migrated_to_service', true);
      return { success: true, migratedCount: 0 };
    }

    // Get existing orders from storage
    const existingOrders = await storageService.getItem<Order[]>('wallet_orders', []);
    
    if (existingOrders.length === 0) {
      console.log('[OrdersMigration] No orders to migrate');
      await storageService.setItem('orders_migrated_to_service', true);
      return { success: true, migratedCount: 0 };
    }

    console.log(`[OrdersMigration] Found ${existingOrders.length} orders to migrate`);

    let migratedCount = 0;
    const errors: string[] = [];

    // Process each order
    for (const order of existingOrders) {
      try {
        // Check if order already exists (by ID)
        const existingResult = await ordersService.getOrder(order.id);
        
        if (existingResult.success && existingResult.data) {
          console.log(`[OrdersMigration] Order ${order.id} already exists, skipping`);
          migratedCount++;
          continue;
        }

        // Create order through service
        const createResult = await ordersService.createOrder({
          title: order.title,
          description: order.description,
          price: order.price,
          markedUpPrice: order.markedUpPrice,
          imageUrl: order.imageUrl,
          seller: order.seller,
          buyer: order.buyer,
          tags: order.tags,
          wearTime: order.wearTime,
          wasAuction: order.wasAuction,
          finalBid: order.finalBid,
          deliveryAddress: order.deliveryAddress,
          tierCreditAmount: order.tierCreditAmount,
          isCustomRequest: order.isCustomRequest,
          originalRequestId: order.originalRequestId,
          listingId: order.listingId,
          listingTitle: order.listingTitle,
          quantity: order.quantity,
          // Ensure shippingStatus is cast correctly including pending-auction
          shippingStatus: order.shippingStatus as 'pending' | 'processing' | 'shipped' | 'pending-auction' | undefined,
        });

        if (createResult.success) {
          migratedCount++;
          
          // If the order has a shipping status, update it
          if (order.shippingStatus && order.shippingStatus !== 'pending') {
            await ordersService.updateOrderStatus(order.id, {
              shippingStatus: order.shippingStatus as 'pending' | 'processing' | 'shipped' | 'pending-auction',
            });
          }
        } else {
          errors.push(`Failed to migrate order ${order.id}: ${createResult.error?.message}`);
        }
      } catch (error) {
        errors.push(`Error migrating order ${order.id}: ${error}`);
      }
    }

    // Log any errors
    if (errors.length > 0) {
      console.error('[OrdersMigration] Migration errors:', errors);
    }

    // Set migration flag
    await storageService.setItem('orders_migrated_to_service', true);

    console.log(`[OrdersMigration] Migration complete. Migrated ${migratedCount}/${existingOrders.length} orders`);

    return {
      success: errors.length === 0,
      migratedCount,
    };
  } catch (error) {
    console.error('[OrdersMigration] Migration failed:', error);
    return { success: false, migratedCount: 0 };
  }
}

/**
 * Sync orders between storage and service
 * Ensures data consistency during transition period
 */
export async function syncOrdersWithService(): Promise<void> {
  try {
    // CRITICAL FIX: Check if user is authenticated before attempting sync
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      console.log('[OrdersSync] No authenticated user - skipping API sync');
      return;
    }

    // Get orders from both sources
    const [storageOrders, serviceResult] = await Promise.all([
      storageService.getItem<Order[]>('wallet_orders', []),
      ordersService.getOrders(),
    ]);

    if (!serviceResult.success || !serviceResult.data) {
      console.error('[OrdersSync] Failed to fetch orders from service');
      return;
    }

    const serviceOrders = serviceResult.data;

    // Create a map of service orders for quick lookup
    const serviceOrderMap = new Map(serviceOrders.map(order => [order.id, order]));

    // Check for orders in storage but not in service
    const ordersToAdd: Order[] = [];
    for (const storageOrder of storageOrders) {
      if (!serviceOrderMap.has(storageOrder.id)) {
        ordersToAdd.push(storageOrder);
      }
    }

    // Add missing orders to service
    if (ordersToAdd.length > 0) {
      console.log(`[OrdersSync] Found ${ordersToAdd.length} orders to sync to service`);
      
      for (const order of ordersToAdd) {
        try {
          await ordersService.createOrder({
            title: order.title,
            description: order.description,
            price: order.price,
            markedUpPrice: order.markedUpPrice,
            imageUrl: order.imageUrl,
            seller: order.seller,
            buyer: order.buyer,
            tags: order.tags,
            wearTime: order.wearTime,
            wasAuction: order.wasAuction,
            finalBid: order.finalBid,
            deliveryAddress: order.deliveryAddress,
            tierCreditAmount: order.tierCreditAmount,
            isCustomRequest: order.isCustomRequest,
            originalRequestId: order.originalRequestId,
            listingId: order.listingId,
            listingTitle: order.listingTitle,
            quantity: order.quantity,
            // Ensure shippingStatus is cast correctly including pending-auction
            shippingStatus: order.shippingStatus as 'pending' | 'processing' | 'shipped' | 'pending-auction' | undefined,
          });
        } catch (error) {
          console.error(`[OrdersSync] Failed to sync order ${order.id}:`, error);
        }
      }
    }

    console.log('[OrdersSync] Sync complete');
  } catch (error) {
    console.error('[OrdersSync] Sync failed:', error);
  }
}

/**
 * Validate order data integrity
 */
export async function validateOrderIntegrity(): Promise<{
  valid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // CRITICAL FIX: Check if user is authenticated before attempting validation
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      console.log('[OrdersIntegrity] No authenticated user - skipping API validation');
      return { valid: true, issues: [] };
    }

    const result = await ordersService.getOrders();
    if (!result.success || !result.data) {
      issues.push('Failed to fetch orders from service');
      return { valid: false, issues };
    }

    const orders = result.data;

    // Check for duplicate orders
    const orderIds = new Set<string>();
    for (const order of orders) {
      if (orderIds.has(order.id)) {
        issues.push(`Duplicate order ID found: ${order.id}`);
      }
      orderIds.add(order.id);
    }

    // Validate required fields
    for (const order of orders) {
      if (!order.id) issues.push('Order missing ID');
      if (!order.title) issues.push(`Order ${order.id} missing title`);
      if (!order.seller) issues.push(`Order ${order.id} missing seller`);
      if (!order.buyer) issues.push(`Order ${order.id} missing buyer`);
      if (typeof order.price !== 'number') issues.push(`Order ${order.id} has invalid price`);
      if (!order.date) issues.push(`Order ${order.id} missing date`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  } catch (error) {
    issues.push(`Validation error: ${error}`);
    return { valid: false, issues };
  }
}

/**
 * Run full orders migration process
 */
export async function runOrdersMigration(): Promise<void> {
  try {
    console.log('[OrdersMigration] Checking if migration is needed...');
    
    // CRITICAL FIX: Check authentication FIRST before any migration logic
    const isAuthenticated = await authService.isAuthenticated();
    if (!isAuthenticated) {
      console.log('[OrdersMigration] No authenticated user - skipping all migration activities');
      // Still set the migration flag to prevent future attempts during this session
      await storageService.setItem('orders_migrated_to_service', true);
      return;
    }

    const needsMigration = await checkOrdersMigrationNeeded();
    
    if (needsMigration) {
      console.log('[OrdersMigration] Migration needed, starting process...');
      
      const result = await migrateOrdersToService();
      
      if (result.success) {
        console.log('[OrdersMigration] Migration successful');
      } else {
        console.error('[OrdersMigration] Migration completed with errors');
      }
    } else {
      console.log('[OrdersMigration] No migration needed');
    }

    // Only run sync and validation if user is authenticated (double-check)
    if (isAuthenticated) {
      // Always run sync to ensure consistency
      await syncOrdersWithService();

      // Validate integrity
      const validation = await validateOrderIntegrity();
      if (!validation.valid) {
        console.error('[OrdersMigration] Integrity issues found:', validation.issues);
      }
    }
  } catch (error) {
    console.error('[OrdersMigration] Migration process failed:', error);
  }
}
