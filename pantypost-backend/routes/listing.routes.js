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

// POST /api/listings/:id/bid - Place a bid on an auction
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
    
    try {
      await listing.placeBid(bidder, amount);
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
      
      // Refund previous bidder
      if (previousHighestBidder && previousHighestBid > 0 && previousHighestBidder !== bidder) {
        const previousBidderWallet = await Wallet.findOne({ username: previousHighestBidder });
        if (previousBidderWallet) {
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
        }
      }
      
      // Emit WebSocket event
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
        message: `Bid placed successfully! $${amount} has been held. You are now the highest bidder!`
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

// POST /api/listings/:id/end-auction - End an auction
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
      }
      
      if (global.webSocketService) {
        global.webSocketService.emitAuctionEnded(listing, null, listing.auction.currentBid);
      }
      
      return res.json({
        success: true,
        message: 'Auction ended but reserve price was not met. Bid has been refunded.'
      });
    }
    
    // Create order for winner
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
    
    const sellerPlatformFee = Math.round(winningBid * 0.1 * 100) / 100;
    const sellerEarnings = Math.round((winningBid - sellerPlatformFee) * 100) / 100;
    
    const order = new Order({
      title: listing.title,
      description: listing.description,
      price: winningBid,
      markedUpPrice: winningBid,
      seller: listing.seller,
      buyer: winner,
      imageUrl: listing.imageUrls[0],
      tags: listing.tags,
      wasAuction: true,
      finalBid: winningBid,
      platformFee: sellerPlatformFee,
      sellerPlatformFee: sellerPlatformFee,
      sellerEarnings: sellerEarnings,
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
    
    await sellerWallet.deposit(sellerEarnings);
    await platformWallet.deposit(sellerPlatformFee);
    
    const saleTransaction = new Transaction({
      type: 'auction_sale',
      amount: sellerEarnings,
      from: winner,
      to: listing.seller,
      fromRole: 'buyer',
      toRole: 'seller',
      description: `Auction won: ${listing.title} (after fees)`,
      status: 'completed',
      completedAt: new Date(),
      metadata: { 
        orderId: order._id.toString(), 
        auctionId: listing._id.toString(),
        originalAmount: winningBid,
        platformFee: sellerPlatformFee
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
      description: `Platform fee (10%) for auction: ${listing.title}`,
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
        totalFee: sellerPlatformFee
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
    }
    
    res.json({
      success: true,
      message: `Auction ended successfully! Winner: ${winner} at $${winningBid}`,
      data: {
        listing: listing,
        order: order
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