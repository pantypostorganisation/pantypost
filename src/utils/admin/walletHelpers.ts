// src/utils/admin/walletHelpers.ts

// Define types for better type safety
interface Order {
  id?: string;
  title?: string;
  buyer?: string;
  seller?: string;
  price: number;
  markedUpPrice?: number;
  date: string;
  shippingStatus?: string;
  wasAuction?: boolean;
  finalBid?: number;
}

interface AdminAction {
  type: string;
  reason: string;
  amount: number;
  date: string;
}

interface Deposit {
  username: string;
  amount: number;
  date: string;
  status: string;
}

interface Withdrawal {
  seller?: string;
  amount: number;
  date: string;
}

// Helper function to filter out pending auction orders
const isValidRevenueOrder = (order: Order): boolean => {
  // Exclude orders that are pending auction bids
  return order.shippingStatus !== 'pending-auction';
};

// Export all the calculation functions from the original file
export const getTimeFilteredData = (
  timeFilter: string,
  adminActions: AdminAction[],
  orderHistory: Order[],
  depositLogs: Deposit[],
  sellerWithdrawals: Record<string, Withdrawal[]>,
  adminWithdrawals: Withdrawal[]
) => {
  const now = new Date();
  const filterDate = new Date();
  
  switch (timeFilter) {
    case 'today':
      filterDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      filterDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      filterDate.setMonth(now.getMonth() - 1);
      break;
    case '3months':
      filterDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      filterDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      // For 'all' time, filter out pending auction orders but include everything else
      return { 
        actions: adminActions, 
        orders: orderHistory.filter(isValidRevenueOrder), 
        deposits: depositLogs,
        sellerWithdrawals: getAllSellerWithdrawals(sellerWithdrawals),
        adminWithdrawals: adminWithdrawals
      };
  }
  
  const filteredActions = adminActions.filter(action => new Date(action.date) >= filterDate);
  const filteredOrders = orderHistory
    .filter(order => new Date(order.date) >= filterDate)
    .filter(isValidRevenueOrder); // Also filter out pending auction orders
  const filteredDeposits = depositLogs.filter(deposit => new Date(deposit.date) >= filterDate);
  
  const filteredSellerWithdrawals = getAllSellerWithdrawals(sellerWithdrawals).filter(
    withdrawal => new Date(withdrawal.date) >= filterDate
  );
  
  const filteredAdminWithdrawals = adminWithdrawals.filter(
    withdrawal => new Date(withdrawal.date) >= filterDate
  );
  
  return { 
    actions: filteredActions, 
    orders: filteredOrders, 
    deposits: filteredDeposits,
    sellerWithdrawals: filteredSellerWithdrawals,
    adminWithdrawals: filteredAdminWithdrawals
  };
};

export const getAllSellerWithdrawals = (sellerWithdrawals: Record<string, Withdrawal[]>) => {
  const allWithdrawals: Array<{seller: string, amount: number, date: string}> = [];
  
  Object.entries(sellerWithdrawals).forEach(([seller, withdrawals]) => {
    (withdrawals as Withdrawal[]).forEach(withdrawal => {
      allWithdrawals.push({
        seller,
        amount: withdrawal.amount,
        date: withdrawal.date
      });
    });
  });
  
  return allWithdrawals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const calculatePlatformProfit = (orders: Order[]) => {
  return orders
    .filter(isValidRevenueOrder) // Exclude pending auction orders
    .reduce((sum: number, order: Order) => {
      // For auction orders, use finalBid if available
      const originalPrice = order.wasAuction && order.finalBid ? order.finalBid : order.price;
      const platformProfit = originalPrice * 0.2; // 20% platform fee
      return sum + platformProfit;
    }, 0);
};

export const calculateTotalRevenue = (orders: Order[]) => {
  return orders
    .filter(isValidRevenueOrder) // Exclude pending auction orders
    .reduce((sum: number, order: Order) => {
      // For regular orders, use markedUpPrice or price
      // For auction orders, the markedUpPrice already includes the buyer fee
      return sum + (order.markedUpPrice || order.price);
    }, 0);
};

export const calculateSubscriptionRevenue = (actions: AdminAction[]) => {
  return actions
    .filter((action: AdminAction) => {
      if (action.type !== 'credit') return false;
      const reason = action.reason.toLowerCase();
      return reason.includes('subscription') && reason.includes('revenue') && !reason.includes('refund');
    })
    .reduce((sum: number, action: AdminAction) => {
      // The admin action stores the 25% cut, so multiply by 4 to get full subscription amount
      return sum + (action.amount * 4);
    }, 0);
};

export const calculateSubscriptionProfit = (actions: AdminAction[]) => {
  return actions
    .filter((action: AdminAction) => {
      if (action.type !== 'credit') return false;
      const reason = action.reason.toLowerCase();
      return reason.includes('subscription') && reason.includes('revenue') && !reason.includes('refund');
    })
    .reduce((sum: number, action: AdminAction) => sum + action.amount, 0);
};

export const calculateWithdrawals = (sellerWithdrawals: Withdrawal[], adminWithdrawals: Withdrawal[]) => {
  const totalSellerWithdrawals = sellerWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalAdminWithdrawals = adminWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  const totalWithdrawals = totalSellerWithdrawals + totalAdminWithdrawals;
  const withdrawalCount = sellerWithdrawals.length + adminWithdrawals.length;
  
  return {
    totalSellerWithdrawals,
    totalAdminWithdrawals,
    totalWithdrawals,
    withdrawalCount,
    averageWithdrawal: withdrawalCount > 0 ? totalWithdrawals / withdrawalCount : 0
  };
};

export const getPreviousPeriodData = (
  timeFilter: string, 
  orderHistory: Order[], 
  depositLogs: Deposit[], 
  withdrawals: Withdrawal[], 
  adminActions: AdminAction[]
) => {
  const now = new Date();
  const currentPeriodStart = new Date();
  const previousPeriodStart = new Date();
  const previousPeriodEnd = new Date();
  
  switch (timeFilter) {
    case 'today':
      currentPeriodStart.setHours(0, 0, 0, 0);
      previousPeriodEnd.setTime(currentPeriodStart.getTime() - 1);
      previousPeriodStart.setDate(previousPeriodEnd.getDate());
      previousPeriodStart.setHours(0, 0, 0, 0);
      break;
    case 'week':
      currentPeriodStart.setDate(now.getDate() - 7);
      previousPeriodEnd.setTime(currentPeriodStart.getTime() - 1);
      previousPeriodStart.setDate(previousPeriodEnd.getDate() - 7);
      break;
    case 'month':
      currentPeriodStart.setMonth(now.getMonth() - 1);
      previousPeriodEnd.setTime(currentPeriodStart.getTime() - 1);
      previousPeriodStart.setMonth(previousPeriodEnd.getMonth() - 1);
      break;
    case '3months':
      currentPeriodStart.setMonth(now.getMonth() - 3);
      previousPeriodEnd.setTime(currentPeriodStart.getTime() - 1);
      previousPeriodStart.setMonth(previousPeriodEnd.getMonth() - 3);
      break;
    case 'year':
      currentPeriodStart.setFullYear(now.getFullYear() - 1);
      previousPeriodEnd.setTime(currentPeriodStart.getTime() - 1);
      previousPeriodStart.setFullYear(previousPeriodEnd.getFullYear() - 1);
      break;
    default:
      return { orders: [], deposits: [], withdrawals: [], actions: [] };
  }
  
  const previousOrders = orderHistory
    .filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= previousPeriodStart && orderDate <= previousPeriodEnd;
    })
    .filter(isValidRevenueOrder); // Exclude pending auction orders

  const previousDeposits = depositLogs.filter(deposit => {
    const depositDate = new Date(deposit.date);
    return depositDate >= previousPeriodStart && depositDate <= previousPeriodEnd;
  });

  const previousWithdrawals = withdrawals.filter(withdrawal => {
    const withdrawalDate = new Date(withdrawal.date);
    return withdrawalDate >= previousPeriodStart && withdrawalDate <= previousPeriodEnd;
  });

  const previousActions = adminActions.filter(action => {
    const actionDate = new Date(action.date);
    return actionDate >= previousPeriodStart && actionDate <= previousPeriodEnd;
  });
  
  return { orders: previousOrders, deposits: previousDeposits, withdrawals: previousWithdrawals, actions: previousActions };
};

export const getRevenueByDay = (
  timeFilter: string, 
  orderHistory: Order[], 
  adminActions: AdminAction[]
) => {
  const periods = [];
  const now = new Date();
  let periodsToShow = 30;
  
  // Filter out pending auction orders from the start
  const validOrders = orderHistory.filter(isValidRevenueOrder);
  
  switch (timeFilter) {
    case 'today':
      periodsToShow = 24;
      break;
    case 'week':
      periodsToShow = 7;
      break;
    case 'month':
      periodsToShow = 30;
      break;
    case '3months':
      periodsToShow = 90;
      break;
    case 'year':
      periodsToShow = 12;
      break;
  }
  
  for (let i = periodsToShow - 1; i >= 0; i--) {
    const date = new Date();
    
    if (timeFilter === 'today') {
      date.setHours(now.getHours() - i);
      const hourOrders = validOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getHours() === date.getHours() && 
               orderDate.toDateString() === date.toDateString();
      });
      
      const hourActions = adminActions.filter(action => {
        const actionDate = new Date(action.date);
        return actionDate.getHours() === date.getHours() && 
               actionDate.toDateString() === date.toDateString() &&
               action.reason.toLowerCase().includes('subscription') &&
               action.reason.toLowerCase().includes('revenue');
      });
      
      const hourSalesRevenue = calculateTotalRevenue(hourOrders);
      const hourSubRevenue = calculateSubscriptionRevenue(hourActions);
      const hourTotalRevenue = hourSalesRevenue + hourSubRevenue;
      
      periods.push({
        date: date.toLocaleTimeString('en-US', { hour: 'numeric' }),
        revenue: hourTotalRevenue,
        transactions: hourOrders.length
      });
    } else if (timeFilter === 'year') {
      date.setMonth(now.getMonth() - i);
      const monthOrders = validOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.getMonth() === date.getMonth() && 
               orderDate.getFullYear() === date.getFullYear();
      });
      
      const monthActions = adminActions.filter(action => {
        const actionDate = new Date(action.date);
        return actionDate.getMonth() === date.getMonth() && 
               actionDate.getFullYear() === date.getFullYear() &&
               action.reason.toLowerCase().includes('subscription') &&
               action.reason.toLowerCase().includes('revenue');
      });
      
      const monthSalesRevenue = calculateTotalRevenue(monthOrders);
      const monthSubRevenue = calculateSubscriptionRevenue(monthActions);
      const monthTotalRevenue = monthSalesRevenue + monthSubRevenue;
      
      periods.push({
        date: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthTotalRevenue,
        transactions: monthOrders.length
      });
    } else {
      date.setDate(now.getDate() - i);
      const dayOrders = validOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate.toDateString() === date.toDateString();
      });
      
      const dayActions = adminActions.filter(action => {
        const actionDate = new Date(action.date);
        return actionDate.toDateString() === date.toDateString() &&
               action.reason.toLowerCase().includes('subscription') &&
               action.reason.toLowerCase().includes('revenue');
      });
      
      const daySalesRevenue = calculateTotalRevenue(dayOrders);
      const daySubRevenue = calculateSubscriptionRevenue(dayActions);
      const dayTotalRevenue = daySalesRevenue + daySubRevenue;
      
      periods.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayTotalRevenue,
        transactions: dayOrders.length
      });
    }
  }
  return periods;
};

// New helper function to get auction-specific metrics
export const getAuctionMetrics = (orders: Order[]) => {
  const auctionOrders = orders.filter(order => 
    order.wasAuction && isValidRevenueOrder(order)
  );
  
  const totalAuctionRevenue = auctionOrders.reduce((sum, order) => {
    return sum + (order.markedUpPrice || order.price);
  }, 0);
  
  const totalAuctionProfit = auctionOrders.reduce((sum, order) => {
    const bidAmount = order.finalBid || order.price;
    return sum + (bidAmount * 0.2); // 20% platform fee
  }, 0);
  
  const averageAuctionPrice = auctionOrders.length > 0 
    ? totalAuctionRevenue / auctionOrders.length 
    : 0;
  
  return {
    totalAuctions: auctionOrders.length,
    totalAuctionRevenue,
    totalAuctionProfit,
    averageAuctionPrice
  };
};