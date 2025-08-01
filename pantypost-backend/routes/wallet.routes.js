// pantypost-backend/routes/wallet.routes.js
const express = require('express');
const router = express.Router();
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');

// ============= WALLET ROUTES =============

// GET /api/wallet/balance/:username - Get wallet balance
router.get('/balance/:username', authMiddleware, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check if user can view this wallet (must be owner or admin)
    if (req.user.username !== username && req.user.role !== 'admin') {
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
    
    // Only buyers can deposit
    if (req.user.role !== 'buyer' && req.user.role !== 'admin') {
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
        paymentMethod: method || 'credit_card'
      }
    });
    await transaction.save();
    
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
    
    // Only sellers can withdraw
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can make withdrawals'
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
    
    // Check balance
    if (!wallet.hasBalance(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }
    
    // Remove money from wallet
    await wallet.withdraw(amount);
    
    // Create transaction record
    const transaction = new Transaction({
      type: 'withdrawal',
      amount,
      from: username,
      fromRole: req.user.role,
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
    
    // Check permissions
    if (req.user.username !== username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only view your own transactions'
      });
    }
    
    // Build query
    const query = {
      $or: [
        { from: username },
        { to: username }
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
    if (req.user.role !== 'admin') {
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
    
    // Create transaction
    const transaction = new Transaction({
      type: action === 'credit' ? 'admin_credit' : 'admin_debit',
      amount,
      from: action === 'debit' ? username : req.user.username,
      to: action === 'credit' ? username : req.user.username,
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

// Export the router
module.exports = router;