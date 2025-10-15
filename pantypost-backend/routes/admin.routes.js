// pantypost-backend/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const AdminAction = require('../models/AdminAction');
const Listing = require('../models/Listing');
const AuctionSettlementService = require('../services/auctionSettlement');
const { ERROR_CODES } = require('../utils/constants');

// GET /api/admin/actions - Get all admin actions
router.get('/actions', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const { limit = 100, page = 1, type, startDate, endDate } = req.query;
    
    // Build query
    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Get admin actions with pagination
    const skip = (page - 1) * limit;
    const adminActions = await AdminAction.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await AdminAction.countDocuments(query);
    
    res.json({
      success: true,
      data: adminActions,
      meta: {
        page: parseInt(page),
        pageSize: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('[Admin] Error fetching admin actions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch admin actions'
      }
    });
  }
});

// POST /api/admin/actions - Create admin action (for manual entries)
router.post('/actions', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const { type, amount, reason, metadata } = req.body;
    
    // Validate required fields
    if (!type || !amount || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: ERROR_CODES.MISSING_REQUIRED_FIELD,
          message: 'Type, amount, and reason are required'
        }
      });
    }
    
    // Create admin action
    const adminAction = new AdminAction({
      type,
      amount,
      reason,
      metadata: metadata || {},
      date: new Date()
    });
    
    await adminAction.save();
    
    res.json({
      success: true,
      data: adminAction
    });
    
  } catch (error) {
    console.error('[Admin] Error creating admin action:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to create admin action'
      }
    });
  }
});

// GET /api/admin/stats - Get admin statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    // Get aggregated stats
    const stats = await AdminAction.aggregate([
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Get recent tier credits
    const recentTierCredits = await AdminAction.find({
      type: 'debit',
      reason: { $regex: /tier/i }
    })
    .sort({ date: -1 })
    .limit(10);

    const totalTierCredits = recentTierCredits.reduce((sum, action) => sum + Math.abs(action.amount), 0);

    res.json({
      success: true,
      data: {
        stats,
        recentTierCredits,
        totalTierCreditsIssued: totalTierCredits
      }
    });
    
  } catch (error) {
    console.error('[Admin] Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch admin statistics'
      }
    });
  }
});

// POST /api/admin/auctions/fix-stuck - Fix stuck auctions
router.post('/auctions/fix-stuck', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    const { listingId } = req.body;
    
    if (!listingId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Listing ID required' 
      });
    }

    console.log(`[Admin] Attempting to fix stuck auction: ${listingId}`);

    // Find the stuck auction
    const listing = await Listing.findById(listingId);
    
    if (!listing || !listing.auction) {
      return res.status(404).json({ 
        success: false, 
        error: 'Auction listing not found' 
      });
    }

    console.log(`[Admin] Found auction with status: ${listing.auction.status}`);

    // If it's stuck in processing or error, reset to active and reprocess
    if (listing.auction.status === 'processing' || listing.auction.status === 'error') {
      // First, reset to active
      listing.auction.status = 'active';
      await listing.save();
      
      console.log(`[Admin] Reset auction to active, now processing...`);
      
      // Now process it properly
      const result = await AuctionSettlementService.processEndedAuction(listingId);
      
      console.log(`[Admin] Auction processing result:`, result);
      
      return res.json({
        success: true,
        message: 'Auction fixed and processed successfully',
        data: result
      });
    }
    
    // If already ended, check if order exists
    if (listing.auction.status === 'ended') {
      const Order = require('../models/Order');
      const existingOrder = await Order.findOne({ 
        listingId: listing._id,
        wasAuction: true 
      });
      
      if (existingOrder) {
        return res.json({
          success: true,
          message: 'Auction already processed successfully',
          data: {
            orderId: existingOrder._id,
            status: 'completed'
          }
        });
      } else {
        // Auction ended but no order - reset and reprocess
        listing.auction.status = 'active';
        await listing.save();
        
        const result = await AuctionSettlementService.processEndedAuction(listingId);
        
        return res.json({
          success: true,
          message: 'Auction reprocessed successfully',
          data: result
        });
      }
    }
    
    return res.status(400).json({
      success: false,
      error: `Auction is in ${listing.auction.status} status - manual intervention may be required`
    });

  } catch (error) {
    console.error('[Admin] Error fixing stuck auction:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: error.message || 'Failed to fix auction'
      }
    });
  }
});

// GET /api/admin/auctions/stuck - Get all stuck auctions
router.get('/auctions/stuck', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS,
          message: 'Admin access required'
        }
      });
    }

    // Find auctions stuck in processing or error state
    const stuckAuctions = await Listing.find({
      'auction.isAuction': true,
      'auction.status': { $in: ['processing', 'error'] }
    }).select('_id title seller auction.status auction.endTime auction.highestBidder auction.currentBid');

    // Also find ended auctions that should have been processed
    const endedButNotProcessed = await Listing.find({
      'auction.isAuction': true,
      'auction.status': 'active',
      'auction.endTime': { $lte: new Date() }
    }).select('_id title seller auction.status auction.endTime auction.highestBidder auction.currentBid');

    res.json({
      success: true,
      data: {
        stuckInProcessing: stuckAuctions,
        endedButActive: endedButNotProcessed,
        totalStuck: stuckAuctions.length + endedButNotProcessed.length
      }
    });

  } catch (error) {
    console.error('[Admin] Error fetching stuck auctions:', error);
    res.status(500).json({
      success: false,
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'Failed to fetch stuck auctions'
      }
    });
  }
});

module.exports = router;