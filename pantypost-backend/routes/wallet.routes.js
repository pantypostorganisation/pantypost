// pantypost-backend/routes/wallet.routes.js
const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const authMiddleware = require('../middleware/auth.middleware');
const mongoose = require('mongoose');

// ============= HELPER FUNCTIONS FOR UNIFIED ADMIN WALLET =============

// Helper function to get unified admin wallet
async function getUnifiedAdminWallet() {
 // Always use 'platform' as the single admin wallet
 let platformWallet = await Wallet.findOne({ username: 'platform', role: 'admin' });
 
 if (!platformWallet) {
   platformWallet = new Wallet({
     username: 'platform',
     role: 'admin',
     balance: 0
   });
   await platformWallet.save();
   console.log('[Wallet] Created unified platform wallet');
 }
 
 return platformWallet;
}

// Helper function to check if user is admin
function isAdminUser(user) {
 if (!user) return false;
 return user.role === 'admin' || 
        user.username === 'oakley' || 
        user.username === 'gerome' ||
        user.username === 'platform';
}

// Helper to check if a username belongs to an admin
async function isAdminUsername(username) {
 if (username === 'platform' || username === 'oakley' || username === 'gerome') {
   return true;
 }
 const user = await User.findOne({ username });
 return user && user.role === 'admin';
}

// ============= WALLET ROUTES =============

// GET /api/wallet/balance - Get wallet balance with query params
router.get('/balance', authMiddleware, async (req, res) => {
 try {
   const { username, role } = req.query;
   
   // For ANY admin user or admin role request, return unified platform wallet
   if (isAdminUser(req.user)) {
     if (role === 'admin' || username === 'platform' || await isAdminUsername(username)) {
       const platformWallet = await getUnifiedAdminWallet();
       
       return res.json({
         success: true,
         data: {
           username: 'platform',
           balance: platformWallet.balance,
           role: 'admin'
         }
       });
     }
   }
   
   // Regular user wallet
   if (!username) {
     return res.status(400).json({
       success: false,
       error: 'Username is required'
     });
   }
   
   // Check if user can view this wallet
   if (req.user.username !== username && !isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'You can only view your own wallet'
     });
   }
   
   let wallet = await Wallet.findOne({ username });
   
   if (!wallet) {
     const user = await User.findOne({ username });
     if (!user) {
       return res.status(404).json({
         success: false,
         error: 'User not found'
       });
     }
     
     wallet = new Wallet({
       username,
       role: user.role,
       balance: 0
     });
     await wallet.save();
   }
   
   res.json({
     success: true,
     data: {
       username: wallet.username,
       balance: wallet.balance,
       role: wallet.role
     }
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// GET /api/wallet/balance/:username - Get wallet balance by username
router.get('/balance/:username', authMiddleware, async (req, res) => {
 try {
   const { username } = req.params;
   
   // If requesting admin balance, always return unified platform wallet
   if (await isAdminUsername(username)) {
     const platformWallet = await getUnifiedAdminWallet();
     
     return res.json({
       success: true,
       data: {
         username: 'platform',
         balance: platformWallet.balance,
         role: 'admin'
       }
     });
   }
   
   // Check if user can view this wallet (must be owner or admin)
   if (req.user.username !== username && !isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'You can only view your own wallet'
     });
   }
   
   // Find or create wallet
   let wallet = await Wallet.findOne({ username });
   
   if (!wallet) {
     // Get user to know their role
     const user = await User.findOne({ username });
     if (!user) {
       return res.status(404).json({
         success: false,
         error: 'User not found'
       });
     }
     
     // Create wallet if it doesn't exist
     wallet = new Wallet({
       username,
       role: user.role,
       balance: 0
     });
     await wallet.save();
   }
   
   res.json({
     success: true,
     data: {
       username: wallet.username,
       balance: wallet.balance,
       role: wallet.role
     }
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// POST /api/wallet/deposit - Add money to wallet (buyers only)
router.post('/deposit', authMiddleware, async (req, res) => {
 try {
   const { amount, method, notes } = req.body;
   const username = req.user.username;
   
   // Validate amount
   if (!amount || amount <= 0) {
     return res.status(400).json({
       success: false,
       error: 'Invalid amount'
     });
   }
   
   // Check limits
   if (amount < 1 || amount > 5000) {
     return res.status(400).json({
       success: false,
       error: 'Deposit amount must be between $1 and $5,000'
     });
   }
   
   // Only buyers can deposit (admins don't need to deposit)
   if (req.user.role !== 'buyer' && !isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'Only buyers can make deposits'
     });
   }
   
   // Find or create wallet
   let wallet = await Wallet.findOne({ username });
   if (!wallet) {
     wallet = new Wallet({
       username,
       role: req.user.role,
       balance: 0
     });
   }
   
   // Check max balance
   if (wallet.balance + amount > 1000000) {
     return res.status(400).json({
       success: false,
       error: 'Would exceed maximum balance of $1,000,000'
     });
   }
   
   // Store previous balance for WebSocket event
   const previousBalance = wallet.balance;
   
   // Add money to wallet
   await wallet.deposit(amount);
   
   // Create transaction record
   const transaction = new Transaction({
     type: 'deposit',
     amount,
     to: username,
     toRole: req.user.role,
     description: `Deposit via ${method || 'credit_card'}${notes ? ' - ' + notes : ''}`,
     status: 'completed',
     completedAt: new Date(),
     metadata: {
       paymentMethod: method || 'credit_card',
       notes: notes
     }
   });
   await transaction.save();
   
   // WEBSOCKET: Emit balance update
   if (global.webSocketService) {
     global.webSocketService.emitBalanceUpdate(
       username,
       wallet.role,
       previousBalance,
       wallet.balance,
       'deposit'
     );
     
     // WEBSOCKET: Emit transaction event
     global.webSocketService.emitTransaction(transaction);
   }
   
   res.json({
     success: true,
     data: transaction
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// POST /api/wallet/withdraw - Take money out (sellers only)
router.post('/withdraw', authMiddleware, async (req, res) => {
 try {
   const { amount, accountDetails } = req.body;
   const username = req.user.username;
   
   // Validate amount
   if (!amount || amount <= 0) {
     return res.status(400).json({
       success: false,
       error: 'Invalid amount'
     });
   }
   
   // Check limits
   if (amount < 20 || amount > 10000) {
     return res.status(400).json({
       success: false,
       error: 'Withdrawal amount must be between $20 and $10,000'
     });
   }
   
   // Only sellers and admins can withdraw
   if (req.user.role !== 'seller' && !isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'Only sellers can make withdrawals'
     });
   }
   
   // For admin users, use platform wallet
   let wallet;
   if (isAdminUser(req.user)) {
     wallet = await getUnifiedAdminWallet();
   } else {
     wallet = await Wallet.findOne({ username });
     if (!wallet) {
       return res.status(404).json({
         success: false,
         error: 'Wallet not found'
       });
     }
   }
   
   // Check balance
   if (!wallet.hasBalance(amount)) {
     return res.status(400).json({
       success: false,
       error: 'Insufficient balance'
     });
   }
   
   // Store previous balance for WebSocket event
   const previousBalance = wallet.balance;
   
   // Remove money from wallet
   await wallet.withdraw(amount);
   
   // Create transaction record
   const transaction = new Transaction({
     type: 'withdrawal',
     amount,
     from: isAdminUser(req.user) ? 'platform' : username,
     fromRole: isAdminUser(req.user) ? 'admin' : req.user.role,
     description: 'Withdrawal request',
     status: 'pending', // Withdrawals start as pending
     metadata: {
       accountDetails: {
         accountNumber: accountDetails?.accountNumber?.slice(-4) ? `****${accountDetails.accountNumber.slice(-4)}` : '****',
         accountType: accountDetails?.accountType || 'checking'
       }
     }
   });
   await transaction.save();
   
   // WEBSOCKET: Emit balance update
   if (global.webSocketService) {
     global.webSocketService.emitBalanceUpdate(
       isAdminUser(req.user) ? 'platform' : username,
       wallet.role,
       previousBalance,
       wallet.balance,
       'withdrawal'
     );
     
     // WEBSOCKET: Emit transaction event
     global.webSocketService.emitTransaction(transaction);
   }
   
   res.json({
     success: true,
     data: transaction
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// GET /api/wallet/transactions/:username - Get transaction history
router.get('/transactions/:username', authMiddleware, async (req, res) => {
 try {
   const { username } = req.params;
   const { type, status, startDate, endDate, page = 1, limit = 50 } = req.query;
   
   // For admin usernames, use platform
   const queryUsername = await isAdminUsername(username) ? 'platform' : username;
   
   // Check permissions
   if (req.user.username !== username && !isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'You can only view your own transactions'
     });
   }
   
   // Build query
   const query = {
     $or: [
       { from: queryUsername },
       { to: queryUsername }
     ]
   };
   
   if (type) query.type = type;
   if (status) query.status = status;
   
   if (startDate || endDate) {
     query.createdAt = {};
     if (startDate) query.createdAt.$gte = new Date(startDate);
     if (endDate) query.createdAt.$lte = new Date(endDate);
   }
   
   // Get transactions with pagination
   const skip = (page - 1) * limit;
   const transactions = await Transaction.find(query)
     .sort({ createdAt: -1 })
     .skip(skip)
     .limit(parseInt(limit));
   
   // Get total count for pagination
   const total = await Transaction.countDocuments(query);
   
   res.json({
     success: true,
     data: transactions,
     meta: {
       page: parseInt(page),
       pageSize: parseInt(limit),
       total,
       totalPages: Math.ceil(total / limit)
     }
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// POST /api/wallet/admin-actions - Admin credit/debit (admin only)
router.post('/admin-actions', authMiddleware, async (req, res) => {
 try {
   const { action, username, amount, reason } = req.body;
   
   // Check if admin
   if (!isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'Admin access required'
     });
   }
   
   // Validate inputs
   if (!['credit', 'debit'].includes(action)) {
     return res.status(400).json({
       success: false,
       error: 'Invalid action. Must be credit or debit'
     });
   }
   
   if (!amount || amount <= 0) {
     return res.status(400).json({
       success: false,
       error: 'Invalid amount'
     });
   }
   
   if (!reason || reason.length < 10) {
     return res.status(400).json({
       success: false,
       error: 'Reason must be at least 10 characters'
     });
   }
   
   // Get wallet
   const wallet = await Wallet.findOne({ username });
   if (!wallet) {
     return res.status(404).json({
       success: false,
       error: 'Wallet not found'
     });
   }
   
   // Store previous balance for WebSocket event
   const previousBalance = wallet.balance;
   
   // Perform action
   if (action === 'credit') {
     await wallet.deposit(amount);
   } else {
     if (!wallet.hasBalance(amount)) {
       return res.status(400).json({
         success: false,
         error: 'Insufficient balance for debit'
       });
     }
     await wallet.withdraw(amount);
   }
   
   // Create transaction - always use platform for admin
   const transaction = new Transaction({
     type: action === 'credit' ? 'admin_credit' : 'admin_debit',
     amount,
     from: action === 'debit' ? username : 'platform',
     to: action === 'credit' ? username : 'platform',
     fromRole: action === 'debit' ? wallet.role : 'admin',
     toRole: action === 'credit' ? wallet.role : 'admin',
     description: `Admin ${action}: ${reason}`,
     status: 'completed',
     completedAt: new Date(),
     metadata: {
       adminUsername: req.user.username,
       reason
     }
   });
   await transaction.save();
   
   // WEBSOCKET: Emit balance update
   if (global.webSocketService) {
     global.webSocketService.emitBalanceUpdate(
       username,
       wallet.role,
       previousBalance,
       wallet.balance,
       action === 'credit' ? 'admin_credit' : 'admin_debit'
     );
     
     // WEBSOCKET: Emit transaction event
     global.webSocketService.emitTransaction(transaction);
   }
   
   res.json({
     success: true,
     data: transaction
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// GET /api/wallet/admin/platform - Get unified platform wallet balance (admin only)
router.get('/admin/platform', authMiddleware, async (req, res) => {
 try {
   // Only admins can access platform wallet
   if (!isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'Admin access required'
     });
   }

   // Get unified platform wallet
   const platformWallet = await getUnifiedAdminWallet();

   // Calculate total platform revenue from all platform fees
   const totalRevenue = await Transaction.aggregate([
     {
       $match: {
         type: 'platform_fee',
         status: 'completed',
         to: 'platform'
       }
     },
     {
       $group: {
         _id: null,
         total: { $sum: '$amount' }
       }
     }
   ]);

   const revenue = totalRevenue[0]?.total || 0;

   res.json({
     success: true,
     data: {
       balance: platformWallet.balance,
       revenue: revenue,
       wallet: {
         username: platformWallet.username,
         role: platformWallet.role,
         balance: platformWallet.balance,
         createdAt: platformWallet.createdAt,
         updatedAt: platformWallet.updatedAt
       }
     }
   });

 } catch (error) {
   console.error('[Wallet] Error fetching platform balance:', error);
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// GET /api/wallet/admin-platform-balance - Always return unified platform wallet
router.get('/admin-platform-balance', authMiddleware, async (req, res) => {
 try {
   // Only admins can check platform balance
   if (!isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'Admin access required'
     });
   }
   
   console.log('[Wallet] Admin requesting unified platform wallet balance...');
   
   // Always get unified platform wallet
   const platformWallet = await getUnifiedAdminWallet();
   
   console.log('[Wallet] Unified platform wallet balance:', platformWallet.balance);
   
   res.json({
     success: true,
     data: {
       balance: platformWallet.balance,
       username: 'platform',
       role: 'admin',
       source: 'platform_wallet',
       lastTransaction: platformWallet.lastTransaction
     }
   });
   
 } catch (error) {
   console.error('[Wallet] Error fetching platform balance:', error);
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// GET /api/wallet/platform-transactions - Get platform fee transactions
router.get('/platform-transactions', authMiddleware, async (req, res) => {
 try {
   // Only admins can view platform transactions
   if (!isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'Admin access required'
     });
   }
   
   const { limit = 100, page = 1 } = req.query;
   const skip = (page - 1) * limit;
   
   console.log('[Wallet] Fetching platform transactions...');
   
   // Find all platform fee transactions
   const transactions = await Transaction.find({
     $or: [
       { type: 'platform_fee' },
       { type: 'fee', to: 'platform' },
       { to: 'platform', toRole: 'admin' }
     ]
   })
   .sort({ createdAt: -1 })
   .limit(parseInt(limit))
   .skip(skip);
   
   // Get total count for pagination
   const totalCount = await Transaction.countDocuments({
     $or: [
       { type: 'platform_fee' },
       { type: 'fee', to: 'platform' },
       { to: 'platform', toRole: 'admin' }
     ]
   });
   
   // Calculate total platform revenue
   const totalRevenue = await Transaction.aggregate([
     {
       $match: {
         $or: [
           { type: 'platform_fee' },
           { type: 'fee', to: 'platform' },
           { to: 'platform', toRole: 'admin' }
         ],
         status: 'completed'
       }
     },
     {
       $group: {
         _id: null,
         total: { $sum: '$amount' }
       }
     }
   ]);
   
   console.log('[Wallet] Found', transactions.length, 'platform transactions');
   
   res.json({
     success: true,
     data: transactions,
     meta: {
       total: totalCount,
       page: parseInt(page),
       limit: parseInt(limit),
       totalRevenue: totalRevenue[0]?.total || 0
     }
   });
   
 } catch (error) {
   console.error('[Wallet] Error fetching platform transactions:', error);
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// POST /api/wallet/admin-withdraw - Admin withdraw from unified platform wallet
router.post('/admin-withdraw', authMiddleware, async (req, res) => {
 try {
   // Only admins can withdraw from platform wallet
   if (!isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'Admin access required'
     });
   }
   
   const { amount, accountDetails, notes } = req.body;
   
   // Validate amount
   if (!amount || amount <= 0) {
     return res.status(400).json({
       success: false,
       error: 'Invalid withdrawal amount'
     });
   }
   
   // Get unified platform wallet
   const platformWallet = await getUnifiedAdminWallet();
   
   // Check if platform wallet has sufficient balance
   if (!platformWallet.hasBalance(amount)) {
     return res.status(400).json({
       success: false,
       error: `Insufficient balance. Platform wallet has $${platformWallet.balance.toFixed(2)}`
     });
   }
   
   // Store previous balance for WebSocket event
   const previousBalance = platformWallet.balance;
   
   // Process withdrawal
   await platformWallet.withdraw(amount);
   
   // Create withdrawal transaction
   const withdrawalTransaction = new Transaction({
     type: 'withdrawal',
     amount: amount,
     from: 'platform',
     to: req.user.username, // Admin who initiated withdrawal
     fromRole: 'admin',
     toRole: 'admin',
     description: `Platform wallet withdrawal by ${req.user.username}`,
     status: 'completed',
     completedAt: new Date(),
     metadata: {
       accountDetails: accountDetails,
       notes: notes,
       adminUsername: req.user.username
     }
   });
   await withdrawalTransaction.save();
   
   // WEBSOCKET: Emit balance update
   if (global.webSocketService) {
     global.webSocketService.emitBalanceUpdate(
       'platform',
       'admin',
       previousBalance,
       platformWallet.balance,
       'withdrawal'
     );
     
     // WEBSOCKET: Emit transaction event
     global.webSocketService.emitTransaction(withdrawalTransaction);
   }
   
   console.log('[Wallet] Platform withdrawal processed:', {
     amount,
     previousBalance,
     newBalance: platformWallet.balance,
     admin: req.user.username
   });
   
   res.json({
     success: true,
     data: {
       withdrawal: withdrawalTransaction,
       newBalance: platformWallet.balance
     }
   });
   
 } catch (error) {
   console.error('[Wallet] Admin withdrawal error:', error);
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// ============= ADMIN ANALYTICS ROUTES =============

// GET /api/wallet/admin/analytics - Complete analytics data for admin dashboard
router.get('/admin/analytics', authMiddleware, async (req, res) => {
 try {
   // Only admins can access analytics
   if (!isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'Admin access required'
     });
   }

   const { timeFilter = 'all' } = req.query;
   
   // Get date range based on filter
   const now = new Date();
   let startDate = null;
   
   switch (timeFilter) {
     case 'today':
       startDate = new Date(now);
       startDate.setHours(0, 0, 0, 0);
       break;
     case 'week':
       startDate = new Date(now);
       startDate.setDate(now.getDate() - 7);
       break;
     case 'month':
       startDate = new Date(now);
       startDate.setMonth(now.getMonth() - 1);
       break;
     case '3months':
       startDate = new Date(now);
       startDate.setMonth(now.getMonth() - 3);
       break;
     case 'year':
       startDate = new Date(now);
       startDate.setFullYear(now.getFullYear() - 1);
       break;
     default: // 'all'
       startDate = null;
   }

   // Build query filter
   const dateFilter = startDate ? { createdAt: { $gte: startDate } } : {};
   const orderDateFilter = startDate ? { date: { $gte: startDate } } : {};

   // 1. Get unified platform wallet balance (admin profit)
   const platformWallet = await getUnifiedAdminWallet();
   const adminBalance = platformWallet.balance;

   // 2. Get all orders with date filter
   const orders = await Order.find(orderDateFilter)
     .sort({ date: -1 })
     .limit(1000);

   // 3. Get deposit transactions
   const deposits = await Transaction.find({
     type: 'deposit',
     status: 'completed',
     ...dateFilter
   }).sort({ createdAt: -1 });

   // 4. Get seller withdrawals
   const sellerWithdrawals = await Transaction.find({
     type: 'withdrawal',
     fromRole: 'seller',
     ...dateFilter
   }).sort({ createdAt: -1 });

   // 5. Get admin withdrawals (platform withdrawals)
   const adminWithdrawals = await Transaction.find({
     type: 'withdrawal',
     from: 'platform',
     ...dateFilter
   }).sort({ createdAt: -1 });

   // 6. Get subscription transactions
   const subscriptionTransactions = await Transaction.find({
     type: 'subscription',
     status: 'completed',
     ...dateFilter
   }).sort({ createdAt: -1 });

   // 7. Get platform fee transactions
   const platformFeeTransactions = await Transaction.find({
     $or: [
       { type: 'platform_fee' },
       { type: 'fee', to: 'platform' }
     ],
     status: 'completed',
     ...dateFilter
   }).sort({ createdAt: -1 });

   // 8. Get all users
   const users = await User.find({});
   const usersObject = {};
   users.forEach(user => {
     usersObject[user.username] = {
       username: user.username,
       role: user.role,
       verified: user.verified || false,
       verificationStatus: user.verificationStatus || 'unverified',
       createdAt: user.createdAt
     };
   });

   // 9. Get all active listings (check if Listing model exists)
   let listings = [];
   try {
     const ListingModel = mongoose.models.Listing || require('../models/Listing');
     listings = await ListingModel.find({ status: 'active' });
   } catch (error) {
     console.log('[Analytics] Listing model not found, skipping listings');
   }

   // 10. Get all wallets for balance info
   const wallets = await Wallet.find({});
   const walletBalances = {};
   wallets.forEach(wallet => {
     // For admin wallets, always use platform balance
     if (wallet.role === 'admin' || isAdminUser({ username: wallet.username })) {
       walletBalances[wallet.username] = platformWallet.balance;
     } else {
       walletBalances[wallet.username] = wallet.balance;
     }
   });

   // 11. Format admin actions from admin credit/debit transactions
   const adminTransactions = await Transaction.find({
     type: { $in: ['admin_credit', 'admin_debit'] },
     ...dateFilter
   }).sort({ createdAt: -1 });

   const formattedAdminActions = adminTransactions.map(action => ({
     id: action._id.toString(),
     type: action.type === 'admin_credit' ? 'credit' : 'debit',
     amount: action.amount,
     targetUser: action.type === 'admin_credit' ? action.to : action.from,
     username: action.type === 'admin_credit' ? action.to : action.from,
     adminUser: action.metadata?.adminUsername || 'admin',
     reason: action.metadata?.reason || action.description,
     date: action.createdAt.toISOString(),
     role: action.type === 'admin_credit' ? action.toRole : action.fromRole
   }));

   // CRITICAL FIX: Fetch tier credit actions from AdminAction collection
   const AdminAction = require('../models/AdminAction');
   const adminActionDateFilter = startDate ? { date: { $gte: startDate } } : {};
   const tierCreditActions = await AdminAction.find({
     ...adminActionDateFilter
   }).sort({ date: -1 });

   // Merge all admin actions including tier credits
   const allAdminActions = [
     ...formattedAdminActions,
     ...tierCreditActions.map(action => ({
       id: action._id.toString(),
       _id: action._id.toString(),
       type: action.type,
       amount: action.amount,
       reason: action.reason,
       date: action.date || action.createdAt,
       metadata: action.metadata || {},
       targetUser: action.metadata?.seller,
       username: action.metadata?.seller,
       adminUser: 'platform',
       role: 'seller'
     }))
   ];

   // 12. Format seller withdrawals by username
   const sellerWithdrawalsByUser = {};
   sellerWithdrawals.forEach(withdrawal => {
     const username = withdrawal.from;
     if (!sellerWithdrawalsByUser[username]) {
       sellerWithdrawalsByUser[username] = [];
     }
     sellerWithdrawalsByUser[username].push({
       amount: withdrawal.amount,
       date: withdrawal.createdAt.toISOString(),
       status: withdrawal.status,
       seller: username
     });
   });

   // 13. Format deposit logs
   const depositLogs = deposits.map(deposit => ({
     id: deposit._id.toString(),
     username: deposit.to,
     amount: deposit.amount,
     method: deposit.metadata?.paymentMethod || 'credit_card',
     date: deposit.createdAt.toISOString(),
     status: deposit.status,
     transactionId: deposit._id.toString(),
     notes: deposit.metadata?.notes
   }));

   // 14. Format order history WITH TIER INFORMATION
   const orderHistory = orders.map(order => ({
     id: order._id.toString(),
     title: order.title,
     description: order.description,
     price: order.price,
     markedUpPrice: order.markedUpPrice,
     date: order.date.toISOString(),
     seller: order.seller,
     buyer: order.buyer,
     shippingStatus: order.shippingStatus,
     wasAuction: order.wasAuction || false,
     finalBid: order.finalBid,
     imageUrl: order.imageUrl,
     tags: order.tags || [],
     deliveryAddress: order.deliveryAddress,
     listingId: order.listingId,
     // Include tier information
     sellerTier: order.sellerTier,
     tierCreditAmount: order.tierCreditAmount || 0
   }));

   // 15. Format admin withdrawals array
   const formattedAdminWithdrawals = adminWithdrawals.map(withdrawal => ({
     amount: withdrawal.amount,
     date: withdrawal.createdAt.toISOString(),
     status: withdrawal.status,
     method: 'bank_transfer'
   }));

   // Calculate subscription revenue from subscription transactions
   const subscriptionRevenue = subscriptionTransactions.reduce((sum, tx) => {
     // Platform gets 25% of subscription amount
     return sum + (tx.amount * 0.25);
   }, 0);

   // Add subscription revenue actions to admin actions for display
   subscriptionTransactions.forEach(tx => {
     const platformAmount = tx.amount * 0.25;
     allAdminActions.push({
       id: `sub_${tx._id.toString()}`,
       type: 'credit',
       amount: platformAmount,
       targetUser: 'platform',
       username: 'platform',
       adminUser: 'system',
       reason: `Subscription revenue (25% of $${tx.amount.toFixed(2)}) from ${tx.from} to ${tx.to}`,
       date: tx.createdAt.toISOString(),
       role: 'admin'
     });
   });

   // Calculate summary statistics
   const totalDeposits = deposits.reduce((sum, d) => sum + d.amount, 0);
   const totalWithdrawals = sellerWithdrawals.reduce((sum, w) => sum + w.amount, 0);
   const totalAdminWithdrawals = adminWithdrawals.reduce((sum, w) => sum + w.amount, 0);

   // Send response
   res.json({
     success: true,
     data: {
       adminBalance,
       orderHistory,
       depositLogs,
       sellerWithdrawals: sellerWithdrawalsByUser,
       adminWithdrawals: formattedAdminWithdrawals,
       adminActions: allAdminActions, // Now includes tier credits from AdminAction collection
       users: usersObject,
       listings: listings.map(l => ({
         id: l._id.toString(),
         title: l.title,
         price: l.price,
         seller: l.seller,
         status: l.status
       })),
       wallet: walletBalances,
       summary: {
         totalDeposits,
         totalWithdrawals,
         totalAdminWithdrawals,
         totalOrders: orders.length,
         totalUsers: users.length,
         totalListings: listings.length,
         platformProfit: adminBalance,
         subscriptionRevenue
       }
     }
   });
 } catch (error) {
   console.error('[Analytics] Error:', error);
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// GET /api/wallet/admin/revenue-chart - Get revenue data for chart
router.get('/admin/revenue-chart', authMiddleware, async (req, res) => {
 try {
   // Only admins can access
   if (!isAdminUser(req.user)) {
     return res.status(403).json({
       success: false,
       error: 'Admin access required'
     });
   }

   const { timeFilter = 'month' } = req.query;
   
   // Determine aggregation period and date range
   let groupBy = {};
   let startDate = new Date();
   
   switch (timeFilter) {
     case 'today':
       // Group by hour for today
       startDate.setHours(0, 0, 0, 0);
       groupBy = {
         year: { $year: '$createdAt' },
         month: { $month: '$createdAt' },
         day: { $dayOfMonth: '$createdAt' },
         hour: { $hour: '$createdAt' }
       };
       break;
     case 'week':
       // Group by day for last week
       startDate.setDate(startDate.getDate() - 7);
       groupBy = {
         year: { $year: '$createdAt' },
         month: { $month: '$createdAt' },
         day: { $dayOfMonth: '$createdAt' }
       };
       break;
     case 'month':
       // Group by day for last month
       startDate.setMonth(startDate.getMonth() - 1);
       groupBy = {
         year: { $year: '$createdAt' },
         month: { $month: '$createdAt' },
         day: { $dayOfMonth: '$createdAt' }
       };
       break;
     case '3months':
       // Group by week for last 3 months
       startDate.setMonth(startDate.getMonth() - 3);
       groupBy = {
         year: { $year: '$createdAt' },
         week: { $week: '$createdAt' }
       };
       break;
     case 'year':
       // Group by month for last year
       startDate.setFullYear(startDate.getFullYear() - 1);
       groupBy = {
         year: { $year: '$createdAt' },
         month: { $month: '$createdAt' }
       };
       break;
     default:
       // Default to last 30 days grouped by day
       startDate.setDate(startDate.getDate() - 30);
       groupBy = {
         year: { $year: '$createdAt' },
         month: { $month: '$createdAt' },
         day: { $dayOfMonth: '$createdAt' }
       };
   }

   // Get revenue from platform fees and subscriptions
   const revenueData = await Transaction.aggregate([
     {
       $match: {
         $or: [
           { type: 'platform_fee', status: 'completed' },
           { type: 'fee', to: 'platform', status: 'completed' },
           { type: 'subscription', status: 'completed' }
         ],
         createdAt: { $gte: startDate }
       }
     },
     {
       $project: {
         createdAt: 1,
         revenue: {
           $cond: {
             if: { $eq: ['$type', 'subscription'] },
             then: { $multiply: ['$amount', 0.25] }, // 25% of subscription
             else: '$amount' // Full amount for platform fees
           }
         }
       }
     },
     {
       $group: {
         _id: groupBy,
         revenue: { $sum: '$revenue' },
         transactions: { $sum: 1 }
       }
     },
     {
       $sort: { 
         '_id.year': 1, 
         '_id.month': 1, 
         '_id.week': 1,
         '_id.day': 1, 
         '_id.hour': 1 
       }
     }
   ]);

   // Format the response for the chart
   const formattedData = revenueData.map(item => {
     let date = '';
     if (timeFilter === 'today') {
       date = `${item._id.hour}:00`;
     } else if (timeFilter === '3months' && item._id.week) {
       date = `Week ${item._id.week}`;
     } else if (timeFilter === 'year') {
       const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
       date = monthNames[item._id.month - 1];
     } else {
       const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
       date = `${monthNames[item._id.month - 1]} ${item._id.day}`;
     }
     
     return {
       date,
       revenue: item.revenue,
       transactions: item.transactions
     };
   });

   res.json({
     success: true,
     data: formattedData
   });
 } catch (error) {
   console.error('[Revenue Chart] Error:', error);
   res.status(500).json({
     success: false,
     error: error.message
   });
 }
});

// Export the router
module.exports = router;