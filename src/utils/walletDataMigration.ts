// src/utils/walletDataMigration.ts

/**
 * Utility to migrate wallet data from enhanced format to legacy format
 * This ensures all data is properly consolidated and persisted
 */
export const migrateWalletData = () => {
  console.log('Starting wallet data migration...');
  
  try {
    // 1. Migrate buyer balances
    const buyerBalances: { [username: string]: number } = {};
    const existingBuyers = localStorage.getItem('wallet_buyers');
    if (existingBuyers) {
      Object.assign(buyerBalances, JSON.parse(existingBuyers));
    }
    
    // Check for enhanced format buyer balances
    const allKeys = Object.keys(localStorage);
    const buyerKeys = allKeys.filter(key => key.startsWith('wallet_buyer_'));
    
    buyerKeys.forEach(key => {
      const username = key.replace('wallet_buyer_', '');
      const balanceStr = localStorage.getItem(key);
      if (balanceStr) {
        const balanceInCents = parseInt(balanceStr, 10);
        const balanceInDollars = balanceInCents / 100;
        buyerBalances[username] = Math.max(buyerBalances[username] || 0, balanceInDollars);
      }
    });
    
    if (Object.keys(buyerBalances).length > 0) {
      localStorage.setItem('wallet_buyers', JSON.stringify(buyerBalances));
      console.log('Migrated buyer balances:', buyerBalances);
    }
    
    // 2. Migrate seller balances
    const sellerBalances: { [username: string]: number } = {};
    const existingSellers = localStorage.getItem('wallet_sellers');
    if (existingSellers) {
      Object.assign(sellerBalances, JSON.parse(existingSellers));
    }
    
    const sellerKeys = allKeys.filter(key => key.startsWith('wallet_seller_'));
    
    sellerKeys.forEach(key => {
      const username = key.replace('wallet_seller_', '');
      const balanceStr = localStorage.getItem(key);
      if (balanceStr) {
        const balanceInCents = parseInt(balanceStr, 10);
        const balanceInDollars = balanceInCents / 100;
        sellerBalances[username] = Math.max(sellerBalances[username] || 0, balanceInDollars);
      }
    });
    
    if (Object.keys(sellerBalances).length > 0) {
      localStorage.setItem('wallet_sellers', JSON.stringify(sellerBalances));
      console.log('Migrated seller balances:', sellerBalances);
    }
    
    // 3. Migrate admin balance (check both formats)
    let adminBalance = 0;
    const existingAdmin = localStorage.getItem('wallet_admin');
    if (existingAdmin) {
      adminBalance = parseFloat(existingAdmin);
    }
    
    // Also check for enhanced format (might be in cents)
    const enhancedAdmin = localStorage.getItem('wallet_admin_enhanced');
    if (enhancedAdmin) {
      const enhancedBalance = parseInt(enhancedAdmin, 10) / 100;
      adminBalance = Math.max(adminBalance, enhancedBalance);
    }
    
    localStorage.setItem('wallet_admin', adminBalance.toString());
    console.log('Admin balance:', adminBalance);
    
    // 4. Clean up enhanced format keys (optional - comment out if you want to keep them)
    // buyerKeys.forEach(key => localStorage.removeItem(key));
    // sellerKeys.forEach(key => localStorage.removeItem(key));
    // localStorage.removeItem('wallet_admin_enhanced');
    
    console.log('Wallet data migration complete');
    return true;
  } catch (error) {
    console.error('Error during wallet data migration:', error);
    return false;
  }
};

/**
 * Check if migration is needed
 */
export const needsWalletMigration = () => {
  const allKeys = Object.keys(localStorage);
  const hasEnhancedKeys = allKeys.some(key => 
    key.startsWith('wallet_buyer_') || 
    key.startsWith('wallet_seller_') ||
    key === 'wallet_admin_enhanced'
  );
  
  return hasEnhancedKeys;
};

/**
 * Run migration if needed (call this on app startup)
 */
export const runWalletMigrationIfNeeded = () => {
  if (needsWalletMigration()) {
    console.log('Wallet migration needed, running...');
    return migrateWalletData();
  }
  return false;
};

/**
 * Debug function to check wallet data
 */
export const debugWalletData = () => {
  console.log('=== Wallet Data Debug ===');
  
  // Check legacy format
  const buyers = localStorage.getItem('wallet_buyers');
  const sellers = localStorage.getItem('wallet_sellers');
  const admin = localStorage.getItem('wallet_admin');
  const orders = localStorage.getItem('wallet_orders');
  const adminActions = localStorage.getItem('wallet_adminActions');
  const depositLogs = localStorage.getItem('wallet_depositLogs');
  
  console.log('Legacy format data:');
  console.log('- Buyers:', buyers ? JSON.parse(buyers) : 'None');
  console.log('- Sellers:', sellers ? JSON.parse(sellers) : 'None');
  console.log('- Admin balance:', admin || 'None');
  console.log('- Orders count:', orders ? JSON.parse(orders).length : 0);
  console.log('- Admin actions count:', adminActions ? JSON.parse(adminActions).length : 0);
  console.log('- Deposit logs count:', depositLogs ? JSON.parse(depositLogs).length : 0);
  
  // Check enhanced format
  const allKeys = Object.keys(localStorage);
  const enhancedBuyerKeys = allKeys.filter(key => key.startsWith('wallet_buyer_'));
  const enhancedSellerKeys = allKeys.filter(key => key.startsWith('wallet_seller_'));
  
  console.log('\nEnhanced format keys:');
  console.log('- Buyer keys:', enhancedBuyerKeys);
  console.log('- Seller keys:', enhancedSellerKeys);
  
  console.log('===================');
};