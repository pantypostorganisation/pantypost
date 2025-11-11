// pantypost-backend/routes/crypto.routes.js
const express = require('express');
const router = express.Router();
const CryptoDeposit = require('../models/CryptoDeposit');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');
const QRCode = require('qrcode');

// Get wallet addresses from environment
const WALLET_ADDRESSES = {
  // Polygon Network (CHEAPEST - Priority!)
  USDT_POLYGON: process.env.CRYPTO_WALLET_POLYGON || '0x16305612c67a84fa8ae4cccc50e560b94372d04d',
  USDC_POLYGON: process.env.CRYPTO_WALLET_POLYGON || '0x16305612c67a84fa8ae4cccc50e560b94372d04d', // Same address for both
  
  // Other networks
  USDT_TRC20: process.env.CRYPTO_WALLET_USDT_TRC20 || 'TEnterYourUSDTTRC20AddressHere',
  BTC: process.env.CRYPTO_WALLET_BTC || 'bc1qEnterYourBitcoinAddressHere',
  
  // High-fee networks (kept for compatibility but not recommended)
  ETH: process.env.CRYPTO_WALLET_ETH || '0xEnterYourEthereumAddressHere',
  USDT_ERC20: process.env.CRYPTO_WALLET_USDT_ERC20 || '0xEnterYourUSDTERC20AddressHere'
};

// Exchange rates (you can fetch these from an API later)
// For now, using static rates as examples
const EXCHANGE_RATES = {
  USDT_POLYGON: 1.0,  // 1 USD = 1 USDT
  USDC_POLYGON: 1.0,  // 1 USD = 1 USDC
  USDT_TRC20: 1.0,   // 1 USD = 1 USDT
  USDT_ERC20: 1.0,   // 1 USD = 1 USDT
  BTC: 0.000015,     // 1 USD = 0.000015 BTC (assuming $66,666 per BTC)
  ETH: 0.00025       // 1 USD = 0.00025 ETH (assuming $4,000 per ETH)
};

// Network fee ranges (in USD equivalent) - Polygon is the WINNER!
const NETWORK_FEES = {
  // ULTRA LOW FEES - Recommended!
  USDT_POLYGON: { min: 0.01, max: 0.05, typical: 0.02 },   // 🏆 CHEAPEST!
  USDC_POLYGON: { min: 0.01, max: 0.05, typical: 0.02 },   // 🏆 CHEAPEST!
  
  // Moderate fees
  USDT_TRC20: { min: 0.5, max: 2, typical: 1 },            // Still decent
  BTC: { min: 1, max: 10, typical: 3 },                    // Varies with congestion
  
  // High fees - not recommended
  ETH: { min: 3, max: 20, typical: 8 },                    // Expensive
  USDT_ERC20: { min: 3, max: 15, typical: 7 }              // Expensive
};

// Get fee display string
const getFeeDisplay = (currency) => {
  const fee = NETWORK_FEES[currency];
  if (fee.min === fee.max) {
    return `$${fee.typical.toFixed(2)}`;
  }
  return `$${fee.min.toFixed(2)}-${fee.max.toFixed(2)}`;
};

// Helper function to generate QR code
async function generateQRCode(data) {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 256,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
}

// Helper to check if user is admin
function isAdminUser(user) {
  return user && (user.role === 'admin' || 
         user.username === 'oakley' || 
         user.username === 'gerome');
}

// POST /api/crypto/create-deposit - Create a new crypto deposit request with UNIQUE AMOUNT
router.post('/create-deposit', authMiddleware, async (req, res) => {
  try {
    const { amount, currency = 'USDT_POLYGON' } = req.body;
    const username = req.user.username;

    // Validate amount
    const numAmount = Number(amount);
    if (!numAmount || numAmount < 10 || numAmount > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be between $10 and $10,000'
      });
    }

    // Check if user has pending deposits
    const pendingDeposit = await CryptoDeposit.findOne({
      username,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (pendingDeposit) {
      return res.status(400).json({
        success: false,
        error: 'You have a pending deposit. Please complete or wait for it to expire.',
        existingDeposit: {
          depositId: pendingDeposit.depositId,
          expiresAt: pendingDeposit.expiresAt
        }
      });
    }

    // IMPORTANT: Generate unique amount to prevent deposit collisions
    // This ensures each deposit has a unique fingerprint
    const uniqueOffset = (Math.floor(Math.random() * 99) + 1) / 10000; // 0.0001 to 0.0099
    const uniqueAmount = numAmount + uniqueOffset;

    // Calculate crypto amount with unique offset
    const exchangeRate = EXCHANGE_RATES[currency];
    const networkFee = NETWORK_FEES[currency].typical;
    const totalUSD = numAmount; // User gets exactly what they want to deposit
    
    // Use 4 decimals for stablecoins, 8 for others
    const decimals = (currency.includes('USDT') || currency.includes('USDC')) ? 4 : 8;
    const cryptoAmount = (uniqueAmount * exchangeRate).toFixed(decimals);
    
    // Get wallet address
    const walletAddress = WALLET_ADDRESSES[currency];

    // Generate payment URI for QR code with exact amount
    let paymentURI = '';
    if (currency === 'BTC') {
      paymentURI = `bitcoin:${walletAddress}?amount=${cryptoAmount}&label=PantyPost%20Deposit`;
    } else if (currency === 'ETH' || currency === 'USDT_ERC20') {
      paymentURI = `ethereum:${walletAddress}?value=${cryptoAmount}`;
    } else {
      // For TRC-20 and Polygon, include amount in a format wallets understand
      paymentURI = `${walletAddress}?amount=${cryptoAmount}`;
    }

    // Generate QR code
    const qrCodeData = await generateQRCode(paymentURI);

    // Create deposit record with unique amount
    const deposit = new CryptoDeposit({
      username,
      amountUSD: numAmount,
      cryptoCurrency: currency,
      expectedCryptoAmount: parseFloat(cryptoAmount),
      walletAddress,
      exchangeRate,
      qrCodeData,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        network: currency.includes('POLYGON') ? 'Polygon' :
                 currency.includes('TRC20') ? 'Tron' : 
                 currency.includes('ERC20') ? 'Ethereum' :
                 currency === 'BTC' ? 'Bitcoin' : 'Ethereum',
        uniqueCode: Math.round(uniqueOffset * 10000) // Store the unique code for reference
      }
    });

    await deposit.save();

    // Calculate expiry time
    const expiryMinutes = 30;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    console.log(`[Crypto] Created unique deposit for ${username}: $${numAmount} = ${cryptoAmount} ${currency} (code: ${deposit.metadata.uniqueCode})`);

    res.json({
      success: true,
      data: {
        depositId: deposit.depositId,
        walletAddress,
        cryptoAmount,
        displayAmount: cryptoAmount, // Exact amount with proper decimals
        cryptoCurrency: currency,
        usdAmount: numAmount,
        networkFeeRange: getFeeDisplay(currency),
        estimatedNetworkFee: `~$${networkFee.toFixed(2)}`,
        qrCode: qrCodeData,
        expiresAt,
        expiryMinutes,
        instructions: getDepositInstructions(currency, cryptoAmount, walletAddress),
        network: deposit.metadata.network,
        exchangeRate: exchangeRate,
        uniqueCode: deposit.metadata.uniqueCode // For debugging
      }
    });

  } catch (error) {
    console.error('[Crypto] Create deposit error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create deposit request'
    });
  }
});

// POST /api/crypto/confirm-deposit - User confirms they sent the payment
router.post('/confirm-deposit', authMiddleware, async (req, res) => {
  try {
    const { depositId, txHash } = req.body;
    const username = req.user.username;

    // Find the deposit
    const deposit = await CryptoDeposit.findOne({
      depositId,
      username,
      status: 'pending'
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        error: 'Deposit request not found or already processed'
      });
    }

    // Check if expired
    if (deposit.isExpired()) {
      deposit.status = 'expired';
      await deposit.save();
      return res.status(400).json({
        success: false,
        error: 'Deposit request has expired. Please create a new one.'
      });
    }

    // Mark as confirming
    await deposit.markAsConfirming(txHash);

    // Send email notification to admins
    // You can implement this based on your email service

    res.json({
      success: true,
      message: 'Payment confirmation received. Your deposit will be automatically verified within 2-5 minutes.',
      data: {
        depositId: deposit.depositId,
        status: 'confirming',
        txHash
      }
    });

  } catch (error) {
    console.error('[Crypto] Confirm deposit error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to confirm deposit'
    });
  }
});

// GET /api/crypto/deposit-status/:depositId - Check deposit status
router.get('/deposit-status/:depositId', authMiddleware, async (req, res) => {
  try {
    const { depositId } = req.params;
    const username = req.user.username;

    const deposit = await CryptoDeposit.findOne({
      depositId,
      $or: [
        { username },
        { verifiedBy: username } // Admins can check any deposit
      ]
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        error: 'Deposit not found'
      });
    }

    res.json({
      success: true,
      data: {
        depositId: deposit.depositId,
        status: deposit.status,
        amountUSD: deposit.amountUSD,
        cryptoCurrency: deposit.cryptoCurrency,
        expectedCryptoAmount: deposit.expectedCryptoAmount,
        actualCryptoReceived: deposit.actualCryptoReceived,
        actualUSDCredited: deposit.actualUSDCredited,
        txHash: deposit.txHash,
        createdAt: deposit.createdAt,
        expiresAt: deposit.expiresAt,
        completedAt: deposit.completedAt,
        rejectionReason: deposit.rejectionReason
      }
    });

  } catch (error) {
    console.error('[Crypto] Get deposit status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get deposit status'
    });
  }
});

// GET /api/crypto/my-deposits - Get user's deposit history
router.get('/my-deposits', authMiddleware, async (req, res) => {
  try {
    const username = req.user.username;
    const { status, limit = 20, offset = 0 } = req.query;

    const query = { username };
    if (status) query.status = status;

    const deposits = await CryptoDeposit.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await CryptoDeposit.countDocuments(query);

    res.json({
      success: true,
      data: deposits.map(d => ({
        depositId: d.depositId,
        status: d.status,
        amountUSD: d.amountUSD,
        cryptoCurrency: d.cryptoCurrency,
        expectedCryptoAmount: d.expectedCryptoAmount,
        actualUSDCredited: d.actualUSDCredited,
        txHash: d.txHash,
        createdAt: d.createdAt,
        completedAt: d.completedAt,
        expiresAt: d.expiresAt
      })),
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('[Crypto] Get deposits error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get deposits'
    });
  }
});

// ============= ADMIN ROUTES =============

// GET /api/crypto/admin/pending-deposits - Get all pending deposits (admin only)
router.get('/admin/pending-deposits', authMiddleware, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const deposits = await CryptoDeposit.find({
      status: { $in: ['pending', 'confirming'] }
    }).sort({ 
      status: -1, // 'confirming' first (user claims they sent)
      createdAt: -1 
    });

    // Get user details
    const usernames = [...new Set(deposits.map(d => d.username))];
    const users = await User.find({ username: { $in: usernames } })
      .select('username email role');

    const userMap = {};
    users.forEach(u => {
      userMap[u.username] = {
        email: u.email,
        role: u.role
      };
    });

    res.json({
      success: true,
      data: deposits.map(d => ({
        depositId: d.depositId,
        username: d.username,
        userEmail: userMap[d.username]?.email,
        status: d.status,
        amountUSD: d.amountUSD,
        cryptoCurrency: d.cryptoCurrency,
        expectedCryptoAmount: d.expectedCryptoAmount,
        walletAddress: d.walletAddress,
        txHash: d.txHash,
        createdAt: d.createdAt,
        expiresAt: d.expiresAt,
        isExpired: d.isExpired(),
        uniqueCode: d.metadata?.uniqueCode // Show unique code for debugging
      }))
    });

  } catch (error) {
    console.error('[Crypto Admin] Get pending deposits error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get pending deposits'
    });
  }
});

// POST /api/crypto/admin/verify-deposit - Verify and complete a deposit (admin only)
router.post('/admin/verify-deposit', authMiddleware, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { depositId, actualAmount, notes } = req.body;

    const deposit = await CryptoDeposit.findOne({ depositId });
    if (!deposit) {
      return res.status(404).json({
        success: false,
        error: 'Deposit not found'
      });
    }

    if (deposit.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Deposit already completed'
      });
    }

    // Complete the deposit
    await deposit.complete(actualAmount || deposit.expectedCryptoAmount, req.user.username, notes);

    // Credit the user's wallet
    const userWallet = await Wallet.findOne({ username: deposit.username });
    if (!userWallet) {
      return res.status(404).json({
        success: false,
        error: 'User wallet not found'
      });
    }

    const previousBalance = userWallet.balance;
    await userWallet.deposit(deposit.amountUSD);

    // Create transaction record
    const transaction = new Transaction({
      type: 'deposit',
      amount: deposit.amountUSD,
      to: deposit.username,
      toRole: userWallet.role,
      description: `Crypto deposit (${deposit.cryptoCurrency})`,
      status: 'completed',
      completedAt: new Date(),
      metadata: {
        paymentMethod: 'crypto',
        cryptoCurrency: deposit.cryptoCurrency,
        txHash: deposit.txHash,
        depositId: deposit.depositId,
        actualCryptoAmount: actualAmount || deposit.expectedCryptoAmount,
        verifiedBy: req.user.username
      }
    });
    await transaction.save();

    // Emit WebSocket events
    if (global.webSocketService) {
      global.webSocketService.emitBalanceUpdate(
        deposit.username,
        userWallet.role,
        previousBalance,
        userWallet.balance,
        'deposit'
      );
      global.webSocketService.emitTransaction(transaction);
    }

    res.json({
      success: true,
      message: `Deposit verified and $${deposit.amountUSD} credited to ${deposit.username}`,
      data: {
        depositId: deposit.depositId,
        amountCredited: deposit.amountUSD,
        newBalance: userWallet.balance,
        transactionId: transaction._id
      }
    });

  } catch (error) {
    console.error('[Crypto Admin] Verify deposit error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify deposit'
    });
  }
});

// POST /api/crypto/admin/reject-deposit - Reject a deposit (admin only)
router.post('/admin/reject-deposit', authMiddleware, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { depositId, reason } = req.body;

    if (!reason || reason.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a detailed rejection reason'
      });
    }

    const deposit = await CryptoDeposit.findOne({ depositId });
    if (!deposit) {
      return res.status(404).json({
        success: false,
        error: 'Deposit not found'
      });
    }

    if (deposit.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Cannot reject a completed deposit'
      });
    }

    await deposit.reject(reason, req.user.username);

    res.json({
      success: true,
      message: 'Deposit rejected',
      data: {
        depositId: deposit.depositId,
        status: 'rejected',
        reason
      }
    });

  } catch (error) {
    console.error('[Crypto Admin] Reject deposit error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reject deposit'
    });
  }
});

// GET /api/crypto/admin/deposit-history - Get all deposits (admin only)
router.get('/admin/deposit-history', authMiddleware, async (req, res) => {
  try {
    if (!isAdminUser(req.user)) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const { status, username, startDate, endDate, limit = 100, offset = 0 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (username) query.username = username;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const deposits = await CryptoDeposit.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await CryptoDeposit.countDocuments(query);

    // Calculate statistics
    const stats = await CryptoDeposit.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalUSD: { $sum: '$actualUSDCredited' }
        }
      }
    ]);

    res.json({
      success: true,
      data: deposits,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        stats
      }
    });

  } catch (error) {
    console.error('[Crypto Admin] Get deposit history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get deposit history'
    });
  }
});

// Helper function to generate deposit instructions with UNIQUE AMOUNT emphasis
function getDepositInstructions(currency, amount, address) {
  const baseInstructions = {
    USDT_POLYGON: {
      title: 'USDT (Polygon) Deposit Instructions - CHEAPEST OPTION! 🏆',
      steps: [
        `Send EXACTLY ${amount} USDT to the address below (all decimals matter!)`,
        'Use the POLYGON network - NOT Ethereum!',
        'Network fees are only $0.01-0.05',
        'The exact amount including decimals identifies YOUR deposit',
        'Click "I\'ve Sent Payment" after sending',
        'Auto-verification happens within 2-5 minutes'
      ],
      warning: 'Must send the EXACT amount shown! Even 0.0001 difference may cause issues.',
      confirmations: '30-60 seconds (super fast!)'
    },
    USDC_POLYGON: {
      title: 'USDC (Polygon) Deposit Instructions - CHEAPEST OPTION! 🏆',
      steps: [
        `Send EXACTLY ${amount} USDC to the address below (all decimals matter!)`,
        'Use the POLYGON network - NOT Ethereum!',
        'Network fees are only $0.01-0.05',
        'The exact amount including decimals identifies YOUR deposit',
        'Click "I\'ve Sent Payment" after sending',
        'Auto-verification happens within 2-5 minutes'
      ],
      warning: 'Must send the EXACT amount shown! Even 0.0001 difference may cause issues.',
      confirmations: '30-60 seconds (super fast!)'
    },
    USDT_TRC20: {
      title: 'USDT (TRC-20) Deposit Instructions',
      steps: [
        `Send EXACTLY ${amount} USDT to the address below`,
        'Use the TRC-20 network (Tron) - NOT ERC-20!',
        'Include network fees in your wallet balance',
        'The exact amount identifies YOUR deposit',
        'Click "I\'ve Sent Payment" after sending',
        'Admin will verify within 1-2 hours'
      ],
      warning: 'Only send USDT on TRC-20 network! Other tokens or networks will be lost!',
      confirmations: '1-3 confirmations (~1 minute)'
    },
    USDT_ERC20: {
      title: 'USDT (ERC-20) Deposit Instructions',
      steps: [
        `Send EXACTLY ${amount} USDT to the address below`,
        'Use the ERC-20 network (Ethereum) - NOT TRC-20!',
        'Ensure you have enough ETH for gas fees',
        'Double-check the address before sending',
        'Click "I\'ve Sent Payment" after sending',
        'Admin will verify within 1-2 hours'
      ],
      warning: 'Only send USDT on ERC-20 network! Other tokens or networks will be lost!',
      confirmations: '12 confirmations (~3 minutes)'
    },
    BTC: {
      title: 'Bitcoin Deposit Instructions',
      steps: [
        `Send EXACTLY ${amount} BTC to the address below`,
        'Include network fees in your transaction',
        'Use a reasonable fee for faster confirmation',
        'Double-check the address before sending',
        'Click "I\'ve Sent Payment" after sending',
        'Admin will verify after 3 confirmations'
      ],
      warning: 'Only send Bitcoin! Other cryptocurrencies will be lost!',
      confirmations: '3 confirmations (~30 minutes)'
    },
    ETH: {
      title: 'Ethereum Deposit Instructions',
      steps: [
        `Send EXACTLY ${amount} ETH to the address below`,
        'Include gas fees in your wallet balance',
        'Double-check the address before sending',
        'Click "I\'ve Sent Payment" after sending',
        'Admin will verify within 1-2 hours'
      ],
      warning: 'Only send Ethereum! ERC-20 tokens will be lost!',
      confirmations: '12 confirmations (~3 minutes)'
    }
  };

  return baseInstructions[currency] || baseInstructions.USDT_POLYGON;
}

// Get blockchain explorer URL
const getExplorerUrl = (txHash, currency) => {
  if (!txHash) return null;
  
  if (currency === 'USDT_POLYGON' || currency === 'USDC_POLYGON') {
    return `https://polygonscan.com/tx/${txHash}`;
  } else if (currency === 'USDT_TRC20') {
    return `https://tronscan.org/#/transaction/${txHash}`;
  } else if (currency === 'BTC') {
    return `https://blockchair.com/bitcoin/transaction/${txHash}`;
  } else if (currency === 'ETH' || currency === 'USDT_ERC20') {
    return `https://etherscan.io/tx/${txHash}`;
  }
  return null;
};

module.exports = router;