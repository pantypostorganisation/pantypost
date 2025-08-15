// pantypost-backend/routes/listing.routes.js
const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth.middleware');

// ============= LISTING ROUTES =============

// GET /api/listings/debug - Debug endpoint to see all listings
router.get('/debug', async (req, res) => {
  try {
    const listings = await Listing.find({});
    res.json({
      success: true,
      count: listings.length,
      listings: listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/listings - Get all listings with advanced filters
router.get('/', async (req, res) => {
  try {
    const { 
      search,
      seller, 
      tags,
      minPrice, 
      maxPrice, 
      isPremium,
      isAuction,
      status = 'active',
      hoursWorn,
      sort = 'date',
      order = 'desc',
      page = 1,
      limit = 20
    } = req.query;
    
    // Build filter
    let filter = {};
    
    // Status filter
    if (status === 'active') {
      filter.$or = [
        { status: 'active' },
        { status: { $exists: false } }
      ];
    } else if (status) {
      filter.status = status;
    }
    
    // Text search
    if (search) {
      const searchCondition = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
      
      if (filter.$or) {
        const statusCondition = { $or: filter.$or };
        delete filter.$or;
        filter.$and = [statusCondition, searchCondition];
      } else {
        filter.$or = searchCondition.$or;
      }
    }
    
    // Seller filter
    if (seller) filter.seller = seller;
    
    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }
    
    // Premium filter
    if (isPremium !== undefined) filter.isPremium = isPremium === 'true';
    
    // Auction filter
    if (isAuction !== undefined) filter['auction.isAuction'] = isAuction === 'true';
    
    // Price filter
    if (!isAuction || isAuction === 'false') {
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }
    }
    
    // Hours worn filter
    if (hoursWorn) {
      const hours = parseInt(hoursWorn);
      if (hours > 0) {
        filter.hoursWorn = { $gte: hours };
      }
    }
    
    // Build sort
    let sortObj = {};
    switch (sort) {
      case 'date':
        sortObj.createdAt = order === 'asc' ? 1 : -1;
        break;
      case 'price':
        if (isAuction === 'true') {
          sortObj['auction.currentBid'] = order === 'asc' ? 1 : -1;
        } else {
          sortObj.price = order === 'asc' ? 1 : -1;
        }
        break;
      case 'views':
        sortObj.views = order === 'asc' ? 1 : -1;
        break;
      case 'popularity':
        sortObj.views = -1;
        sortObj.createdAt = -1;
        break;
      default:
        sortObj.createdAt = -1;
    }
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute query
    const [listings, totalCount] = await Promise.all([
      Listing.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Listing.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: listings,
      meta: {
        page: pageNum,
        pageSize: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/listings/search-suggestions - Get search suggestions
router.get('/search-suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, suggestions: [] });
    }
    
    const suggestions = await Listing.find({
      status: 'active',
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ]
    })
    .select('title tags')
    .limit(10);
    
    const titleSuggestions = suggestions.map(l => l.title);
    const tagSuggestions = [...new Set(suggestions.flatMap(l => l.tags))];
    
    res.json({
      success: true,
      suggestions: {
        titles: titleSuggestions,
        tags: tagSuggestions.filter(tag => 
          tag.toLowerCase().includes(q.toLowerCase())
        )
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/listings/popular-tags - Get popular tags
router.get('/popular-tags', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const popularTags = await Listing.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$tags' },
      { $group: {
        _id: '$tags',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      { $project: {
        tag: '$_id',
        count: 1,
        _id: 0
      }}
    ]);
    
    res.json({
      success: true,
      data: popularTags
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/listings/stats - Get listing statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalListings,
      activeListings,
      activeAuctions,
      totalSold
    ] = await Promise.all([
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'active' }),
      Listing.countDocuments({ 
        status: 'active', 
        'auction.isAuction': true,
        'auction.status': 'active'
      }),
      Listing.countDocuments({ status: 'sold' })
    ]);
    
    res.json({
      success: true,
      data: {
        total: totalListings,
        active: activeListings,
        activeAuctions: activeAuctions,
        sold: totalSold
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/listings - Create a new listing
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can create listings'
      });
    }
    
    const listingData = req.body;
    listingData.seller = req.user.username;
    
    // Handle images
    if (listingData.imageUrl && !listingData.imageUrls) {
      listingData.imageUrls = [listingData.imageUrl];
      delete listingData.imageUrl;
    }
    
    if (!listingData.imageUrls || listingData.imageUrls.length === 0) {
      listingData.imageUrls = ['https://via.placeholder.com/300'];
    }
    
    // Handle auction data
    if (listingData.isAuction) {
      listingData.auction = {
        isAuction: true,
        startingPrice: listingData.startingPrice || 0,
        reservePrice: listingData.reservePrice,
        endTime: new Date(listingData.endTime),
        currentBid: 0,
        bidCount: 0,
        bids: [],
        status: 'active'
      };
      
      delete listingData.isAuction;
      delete listingData.startingPrice;
      delete listingData.reservePrice;
      delete listingData.endTime;
      delete listingData.price;
    }
    
    const listing = new Listing(listingData);
    await listing.save();
    
    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.emitNewListing(listing);
    }
    
    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/listings/:id - Get a specific listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/listings/:id/views - Track listing view
router.post('/:id/views', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    // Increment views
    listing.views = (listing.views || 0) + 1;
    await listing.save();
    
    res.json({
      success: true,
      views: listing.views
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/listings/:id/views - Get listing views
router.get('/:id/views', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    res.json({
      success: true,
      views: listing.views || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/listings/:id/bid - Place a bid on an auction (NO BUYER FEES)
router.post('/:id/bid', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const bidder = req.user.username;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bid amount'
      });
    }
    
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    if (!listing.auction || !listing.auction.isAuction) {
      return res.status(400).json({
        success: false,
        error: 'This is not an auction listing'
      });
    }
    
    if (listing.auction.status !== 'active' || new Date() >= listing.auction.endTime) {
      return res.status(400).json({
        success: false,
        error: 'Auction has ended'
      });
    }
    
    const buyerWallet = await Wallet.findOne({ username: bidder });
    if (!buyerWallet || !buyerWallet.hasBalance(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance to place this bid'
      });
    }
    
    const previousHighestBidder = listing.auction.highestBidder;
    const previousHighestBid = listing.auction.currentBid;
    
    // Store the current balance before withdrawal
    const bidderPreviousBalance = buyerWallet.balance;
    
    // Check if this is an incremental bid (user raising their own bid)
    const isIncrementalBid = previousHighestBidder === bidder && previousHighestBid > 0;
    
    try {
      await listing.placeBid(bidder, amount);
      
      if (isIncrementalBid) {
        // For incremental bids, only charge the difference (NO FEE)
        const bidDifference = amount - previousHighestBid;
        await buyerWallet.withdraw(bidDifference);
        
        const holdTransaction = new Transaction({
          type: 'bid_hold',
          amount: bidDifference,
          from: bidder,
          to: 'platform_escrow',
          fromRole: 'buyer',
          toRole: 'admin',
          description: `Incremental bid on auction: ${listing.title} (difference only)`,
          status: 'completed',
          metadata: {
            auctionId: listing._id.toString(),
            bidAmount: amount,
            previousBid: previousHighestBid,
            incrementalAmount: bidDifference
          }
        });
        await holdTransaction.save();
        
        console.log(`Incremental bid: charged difference of $${bidDifference} (no fee)`);
        
        // Emit balance update for the bidder
        if (global.webSocketService) {
          global.webSocketService.emitBalanceUpdate(
            bidder, 
            'buyer', 
            bidderPreviousBalance, 
            buyerWallet.balance, 
            `Incremental bid placed on ${listing.title}`
          );
        }
      } else {
        // New bidder - hold exact bid amount (NO FEE)
        await buyerWallet.withdraw(amount);
        
        const holdTransaction = new Transaction({
          type: 'bid_hold',
          amount: amount,
          from: bidder,
          to: 'platform_escrow',
          fromRole: 'buyer',
          toRole: 'admin',
          description: `Bid placed on auction: ${listing.title}`,
          status: 'completed',
          metadata: {
            auctionId: listing._id.toString(),
            bidAmount: amount
          }
        });
        await holdTransaction.save();
        
        // Emit balance update for the new bidder
        if (global.webSocketService) {
          global.webSocketService.emitBalanceUpdate(
            bidder, 
            'buyer', 
            bidderPreviousBalance, 
            buyerWallet.balance, 
            `Bid placed on ${listing.title}`
          );
        }
        
        // Refund previous bidder if there was one
        if (previousHighestBidder && previousHighestBid > 0) {
          const previousBidderWallet = await Wallet.findOne({ username: previousHighestBidder });
          if (previousBidderWallet) {
            const previousBidderOldBalance = previousBidderWallet.balance;
            await previousBidderWallet.deposit(previousHighestBid);
            
            const refundTransaction = new Transaction({
              type: 'bid_refund',
              amount: previousHighestBid,
              from: 'platform_escrow',
              to: previousHighestBidder,
              fromRole: 'admin',
              toRole: 'buyer',
              description: `Outbid refund for auction: ${listing.title}`,
              status: 'completed',
              metadata: {
                auctionId: listing._id.toString(),
                reason: 'outbid',
                newHighestBidder: bidder
              }
            });
            await refundTransaction.save();
            
            // CRITICAL: Emit balance update for the outbid user
            if (global.webSocketService) {
              console.log(`[Auction] Emitting balance update for outbid user ${previousHighestBidder}`);
              
              // Emit the balance update event
              global.webSocketService.emitBalanceUpdate(
                previousHighestBidder, 
                'buyer', 
                previousBidderOldBalance, 
                previousBidderWallet.balance, 
                `Outbid refund for ${listing.title}`
              );
              
              // Also emit a specific refund event
              global.webSocketService.emitToUser(previousHighestBidder, 'wallet:refund', {
                username: previousHighestBidder,
                amount: previousHighestBid,
                balance: previousBidderWallet.balance,
                reason: 'outbid_refund',
                listingId: listing._id.toString(),
                listingTitle: listing.title,
                newBidder: bidder,
                timestamp: new Date()
              });
            }
          }
        }
      }
      
      // Emit WebSocket event for the bid
      if (global.webSocketService) {
        global.webSocketService.emitNewBid(listing, {
          bidder: bidder,
          amount: amount,
          date: new Date()
        });
      }
      
      res.json({
        success: true,
        data: listing,
        message: `Bid placed successfully! You are now the highest bidder at $${amount}!`
      });
    } catch (bidError) {
      return res.status(400).json({
        success: false,
        error: bidError.message
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/listings/:id/end-auction - End an auction (20% SELLER FEE)
router.post('/:id/end-auction', authMiddleware, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    if (listing.seller !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the seller can end their auction'
      });
    }
    
    if (!listing.auction || !listing.auction.isAuction) {
      return res.status(400).json({
        success: false,
        error: 'This is not an auction listing'
      });
    }
    
    if (listing.auction.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Auction is not active'
      });
    }
    
    if (new Date() < listing.auction.endTime && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Auction has not ended yet'
      });
    }
    
    // No bids
    if (!listing.auction.highestBidder || listing.auction.currentBid === 0) {
      listing.auction.status = 'ended';
      listing.status = 'expired';
      await listing.save();
      
      if (global.webSocketService) {
        global.webSocketService.emitAuctionEnded(listing, null, 0);
      }
      
      return res.json({
        success: true,
        message: 'Auction ended with no bids'
      });
    }
    
    // Reserve not met
    if (listing.auction.reservePrice && listing.auction.currentBid < listing.auction.reservePrice) {
      listing.auction.status = 'reserve_not_met';
      listing.status = 'expired';
      await listing.save();
      
      const bidderWallet = await Wallet.findOne({ username: listing.auction.highestBidder });
      if (bidderWallet) {
        const oldBalance = bidderWallet.balance;
        await bidderWallet.deposit(listing.auction.currentBid);
        
        const refundTransaction = new Transaction({
          type: 'bid_refund',
          amount: listing.auction.currentBid,
          from: 'platform_escrow',
          to: listing.auction.highestBidder,
          fromRole: 'admin',
          toRole: 'buyer',
          description: `Refund: Reserve not met for ${listing.title}`,
          status: 'completed',
          metadata: { 
            auctionId: listing._id.toString(),
            reason: 'reserve_not_met'
          }
        });
        await refundTransaction.save();
        
        // Emit balance update for refund
        if (global.webSocketService) {
          global.webSocketService.emitBalanceUpdate(
            listing.auction.highestBidder, 
            'buyer', 
            oldBalance, 
            bidderWallet.balance, 
            `Reserve not met refund for ${listing.title}`
          );
        }
      }
      
      if (global.webSocketService) {
        global.webSocketService.emitAuctionEnded(listing, null, listing.auction.currentBid);
      }
      
      return res.json({
        success: true,
        message: 'Auction ended but reserve price was not met. Bid has been refunded.'
      });
    }
    
    // Create order for winner - UPDATED FOR 20% SELLER FEE
    const winningBid = listing.auction.currentBid;
    const winner = listing.auction.highestBidder;
    
    let sellerWallet = await Wallet.findOne({ username: listing.seller });
    if (!sellerWallet) {
      const sellerUser = await User.findOne({ username: listing.seller });
      sellerWallet = new Wallet({
        username: listing.seller,
        role: sellerUser ? sellerUser.role : 'seller',
        balance: 0
      });
      await sellerWallet.save();
    }
    
    let platformWallet = await Wallet.findOne({ username: 'platform', role: 'admin' });
    if (!platformWallet) {
      platformWallet = new Wallet({
        username: 'platform',
        role: 'admin',
        balance: 0
      });
      await platformWallet.save();
    }
    
    // UPDATED: 20% platform fee from seller (not 10%)
    const AUCTION_PLATFORM_FEE = 0.20; // Changed from 0.10 to 0.20
    const sellerPlatformFee = Math.round(winningBid * AUCTION_PLATFORM_FEE * 100) / 100;
    const sellerEarnings = Math.round((winningBid - sellerPlatformFee) * 100) / 100;
    
    const order = new Order({
      title: listing.title,
      description: listing.description,
      price: winningBid,
      markedUpPrice: winningBid, // No markup for auctions
      seller: listing.seller,
      buyer: winner,
      imageUrl: listing.imageUrls[0],
      tags: listing.tags,
      wasAuction: true,
      finalBid: winningBid,
      // UPDATED: Auction-specific fee structure (20% from seller, 0% from buyer)
      platformFee: sellerPlatformFee,
      sellerPlatformFee: sellerPlatformFee,
      buyerMarkupFee: 0, // No buyer markup for auctions
      sellerEarnings: sellerEarnings,
      tierCreditAmount: 0, // No tier bonuses for auctions
      sellerTier: null, // Don't apply tier for auctions
      paymentStatus: 'completed',
      paymentCompletedAt: new Date(),
      deliveryAddress: {
        fullName: 'To be provided',
        addressLine1: 'To be provided',
        city: 'To be provided',
        state: 'To be provided',
        postalCode: '00000',
        country: 'US'
      }
    });
    
    await order.save();
    
    const sellerOldBalance = sellerWallet.balance;
    const platformOldBalance = platformWallet.balance;
    
    await sellerWallet.deposit(sellerEarnings);
    await platformWallet.deposit(sellerPlatformFee);
    
    const saleTransaction = new Transaction({
      type: 'auction_sale',
      amount: winningBid,
      from: 'platform_escrow', // Money was held in escrow
      to: listing.seller,
      fromRole: 'system',
      toRole: 'seller',
      description: `Auction won: ${listing.title} (20% platform fee applied)`,
      status: 'completed',
      completedAt: new Date(),
      metadata: { 
        orderId: order._id.toString(), 
        auctionId: listing._id.toString(),
        originalAmount: winningBid,
        platformFee: sellerPlatformFee,
        sellerEarnings: sellerEarnings
      }
    });
    await saleTransaction.save();
    
    const feeTransaction = new Transaction({
      type: 'platform_fee',
      amount: sellerPlatformFee,
      from: listing.seller,
      to: 'platform',
      fromRole: 'seller',
      toRole: 'admin',
      description: `Platform fee (20%) for auction: ${listing.title}`,
      status: 'completed',
      completedAt: new Date(),
      metadata: { 
        orderId: order._id.toString(),
        auctionId: listing._id.toString(),
        listingTitle: listing.title,
        seller: listing.seller,
        buyer: winner,
        originalPrice: winningBid,
        sellerFee: sellerPlatformFee,
        totalFee: sellerPlatformFee,
        percentage: 20 // Updated to 20%
      }
    });
    await feeTransaction.save();
    
    order.paymentTransactionId = saleTransaction._id;
    order.feeTransactionId = feeTransaction._id;
    await order.save();
    
    listing.auction.status = 'ended';
    listing.status = 'sold';
    listing.soldAt = new Date();
    await listing.save();
    
    if (global.webSocketService) {
      global.webSocketService.emitAuctionEnded(listing, winner, winningBid);
      global.webSocketService.emitListingSold(listing, winner);
      
      // Emit proper balance update with previous balance
      global.webSocketService.emitBalanceUpdate(
        listing.seller, 
        'seller', 
        sellerOldBalance,
        sellerWallet.balance, 
        `Auction sale completed - received ${sellerEarnings} (after 20% fee)`
      );
    }
    
    res.json({
      success: true,
      message: `Auction ended successfully! Winner: ${winner} at $${winningBid}. Seller receives $${sellerEarnings} (after 20% platform fee).`,
      data: {
        listing: listing,
        order: order,
        sellerEarnings: sellerEarnings,
        platformFee: sellerPlatformFee
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/listings/:id - Update a listing
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    if (listing.seller !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'You can only edit your own listings'
      });
    }
    
    delete req.body.seller;
    
    if (listing.auction && listing.auction.isAuction && 
        listing.auction.status === 'active' && listing.auction.bidCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit an active auction with bids'
      });
    }
    
    Object.assign(listing, req.body);
    await listing.save();
    
    if (global.webSocketService) {
      global.webSocketService.emitListingUpdated(listing);
    }
    
    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/listings/:id - Delete a listing
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    if (listing.seller !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this listing'
      });
    }
    
    if (listing.auction && listing.auction.isAuction && 
        listing.auction.status === 'active' && listing.auction.bidCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete an active auction with bids'
      });
    }
    
    listing.status = 'deleted';
    await listing.save();
    
    if (global.webSocketService) {
      global.webSocketService.emitListingDeleted(listing._id);
    }
    
    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;