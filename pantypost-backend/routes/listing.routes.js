// pantypost-backend/routes/listing.routes.js
const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const authMiddleware = require('../middleware/auth.middleware');
const AuctionSettlementService = require('../services/auctionSettlement');

// ============= HELPER FUNCTIONS FOR PREMIUM CONTENT =============

/**
 * Check if a user is subscribed to a seller
 */
async function isUserSubscribedToSeller(buyer, seller) {
  if (!buyer || !seller) return false;
  
  try {
    const subscription = await Subscription.findOne({
      subscriber: buyer,
      creator: seller,
      status: 'active'
    });
    
    return !!subscription;
  } catch (error) {
    console.error('[Premium] Error checking subscription:', error);
    return false;
  }
}

/**
 * Populate seller profile data for a listing
 */
async function populateSellerProfile(listing) {
  try {
    const seller = await User.findOne({ username: listing.seller });
    if (seller) {
      // Add seller profile data to listing
      listing.sellerProfile = {
        bio: seller.bio || null,
        pic: seller.profilePic || null
      };
      listing.isSellerVerified = seller.isVerified || false;
      listing.sellerSalesCount = await Order.countDocuments({ 
        seller: listing.seller, 
        status: { $in: ['completed', 'delivered'] } 
      });
    }
    return listing;
  } catch (error) {
    console.error('[Listing] Error populating seller profile:', error);
    return listing;
  }
}

/**
 * Filter listing data based on premium access
 * Returns a sanitized version of the listing for non-subscribers
 */
function filterPremiumContent(listing, hasAccess) {
  // If user has access or it's not premium, return full listing
  if (hasAccess || !listing.isPremium) {
    return listing;
  }
  
  // For premium content without access, return limited data
  const sanitized = {
    _id: listing._id,
    id: listing._id || listing.id,
    title: listing.title,
    seller: listing.seller,
    isPremium: true,
    status: listing.status,
    createdAt: listing.createdAt,
    isVerified: listing.isVerified,
    
    // Include seller profile data even for locked content
    sellerProfile: listing.sellerProfile,
    isSellerVerified: listing.isSellerVerified,
    sellerSalesCount: listing.sellerSalesCount,
    
    // Obscure sensitive data
    description: 'Premium content - Subscribe to view full details',
    price: listing.price, // Show price but not allow purchase
    markedUpPrice: listing.markedUpPrice,
    
    // Only show first image blurred (frontend will handle blur)
    imageUrls: listing.imageUrls?.length > 0 ? [listing.imageUrls[0]] : [],
    
    // Hide detailed information
    tags: [],
    hoursWorn: undefined,
    views: listing.views || 0,
    
    // Hide auction details for premium auctions
    auction: listing.auction?.isAuction ? {
      isAuction: true,
      status: listing.auction.status,
      endTime: listing.auction.endTime,
      // Hide bid details
      currentBid: undefined,
      highestBidder: undefined,
      bidCount: 0,
      bids: []
    } : undefined,
    
    // Add flag for frontend to know content is locked
    isLocked: true
  };
  
  return sanitized;
}

/**
 * Middleware to check premium access for a specific listing
 */
async function checkPremiumAccess(req, res, next) {
  try {
    const listing = req.listing; // Assumes listing is attached by previous middleware
    
    if (!listing || !listing.isPremium) {
      req.hasPremiumAccess = true;
      return next();
    }
    
    // Check if user is authenticated
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      req.hasPremiumAccess = false;
      return next();
    }
    
    // Decode token to get user (without failing the request)
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const username = decoded.username;
      
      // Seller always has access to their own listings
      if (username === listing.seller) {
        req.hasPremiumAccess = true;
        return next();
      }
      
      // Admin always has access
      if (decoded.role === 'admin') {
        req.hasPremiumAccess = true;
        return next();
      }
      
      // Check subscription for buyers
      if (decoded.role === 'buyer') {
        req.hasPremiumAccess = await isUserSubscribedToSeller(username, listing.seller);
      } else {
        req.hasPremiumAccess = false;
      }
      
    } catch (error) {
      // Token invalid or expired
      req.hasPremiumAccess = false;
    }
    
    next();
  } catch (error) {
    console.error('[Premium] Error in checkPremiumAccess middleware:', error);
    req.hasPremiumAccess = false;
    next();
  }
}

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
    
    // Populate seller profiles for all listings
    const populatedListings = await Promise.all(
      listings.map(listing => populateSellerProfile(listing.toObject()))
    );
    
    // Check user authentication and subscriptions for premium content filtering
    let processedListings = populatedListings;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const username = decoded.username;
        const role = decoded.role;
        
        // Process each listing for premium content
        processedListings = await Promise.all(populatedListings.map(async (listing) => {
          if (!listing.isPremium) return listing;
          
          // Seller sees their own listings
          if (username === listing.seller) return listing;
          
          // Admin sees everything
          if (role === 'admin') return listing;
          
          // Check subscription for buyers
          if (role === 'buyer') {
            const hasAccess = await isUserSubscribedToSeller(username, listing.seller);
            return filterPremiumContent(listing, hasAccess);
          }
          
          // Others get filtered content
          return filterPremiumContent(listing, false);
        }));
      } catch (error) {
        // Invalid token - filter all premium content
        processedListings = populatedListings.map(listing => 
          filterPremiumContent(listing, false)
        );
      }
    } else {
      // No token - filter all premium content
      processedListings = populatedListings.map(listing => 
        filterPremiumContent(listing, false)
      );
    }
    
    res.json({
      success: true,
      data: processedListings,
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
        startingPrice: Math.floor(listingData.startingPrice || 0),
        reservePrice: listingData.reservePrice ? Math.floor(listingData.reservePrice) : undefined,
        endTime: new Date(listingData.endTime),
        currentBid: 0,
        highestBid: 0,  // Initialize highestBid
        bidCount: 0,
        bids: [],
        status: 'active',
        bidIncrement: 1  // Always use $1 increments
      };
      
      delete listingData.isAuction;
      delete listingData.startingPrice;
      delete listingData.reservePrice;
      delete listingData.endTime;
      delete listingData.price;
    }
    
    const listing = new Listing(listingData);
    await listing.save();
    
    // Populate seller profile for the response
    const populatedListing = await populateSellerProfile(listing.toObject());
    
    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.emitNewListing(populatedListing);
    }
    
    res.json({
      success: true,
      data: populatedListing
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/listings/:id - Get a specific listing with premium enforcement
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    // Populate seller profile
    const populatedListing = await populateSellerProfile(listing.toObject());
    
    // Check premium access
    let hasAccess = true;
    
    if (listing.isPremium) {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          const username = decoded.username;
          const role = decoded.role;
          
          // Check access
          if (username === listing.seller || role === 'admin') {
            hasAccess = true;
          } else if (role === 'buyer') {
            hasAccess = await isUserSubscribedToSeller(username, listing.seller);
          } else {
            hasAccess = false;
          }
        } catch (error) {
          hasAccess = false;
        }
      } else {
        hasAccess = false;
      }
    }
    
    const responseData = filterPremiumContent(populatedListing, hasAccess);
    
    res.json({
      success: true,
      data: responseData,
      premiumAccess: hasAccess
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/listings/:id/purchase - Direct purchase endpoint with premium check
router.post('/:id/purchase', authMiddleware, async (req, res) => {
  try {
    const { buyerId } = req.body;
    const listingId = req.params.id;
    
    // Validate buyer
    const buyerUsername = buyerId || req.user.username;
    if (!buyerUsername) {
      return res.status(400).json({
        success: false,
        error: 'Buyer information required'
      });
    }
    
    // Get listing
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    // PREMIUM CHECK: Prevent purchase of premium items without subscription
    if (listing.isPremium) {
      const isSubscribed = await isUserSubscribedToSeller(buyerUsername, listing.seller);
      
      if (!isSubscribed) {
        return res.status(403).json({
          success: false,
          error: 'You must be subscribed to this seller to purchase premium content',
          requiresSubscription: true,
          seller: listing.seller
        });
      }
    }
    
    // Check if already sold
    if (listing.status === 'sold') {
      return res.status(400).json({
        success: false,
        error: 'This item has already been sold'
      });
    }
    
    // Check if it's an auction
    if (listing.auction && listing.auction.isAuction) {
      return res.status(400).json({
        success: false,
        error: 'This is an auction listing. Please use the bid system.'
      });
    }
    
    // Check if buyer is the seller
    if (listing.seller === buyerUsername) {
      return res.status(400).json({
        success: false,
        error: 'You cannot purchase your own listing'
      });
    }
    
    // Mark as sold immediately to prevent race conditions
    listing.status = 'sold';
    listing.buyerId = buyerUsername;
    listing.soldAt = new Date();
    await listing.save();
    
    // Emit WebSocket event immediately so UI updates right away
    if (global.webSocketService) {
      global.webSocketService.emitListingSold(listing, buyerUsername);
      
      // Also emit a specific event for the listing being removed
      global.webSocketService.broadcast('listing:sold', {
        listingId: listing._id.toString(),
        id: listing._id.toString(),
        buyer: buyerUsername,
        seller: listing.seller,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Purchase marked as complete',
      data: {
        listing: listing,
        status: 'sold',
        buyer: buyerUsername
      }
    });
  } catch (error) {
    console.error('[Purchase] Error in purchase endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/listings/:id/views - Track listing view (CRITICAL FIX: Always increment)
router.post('/:id/views', async (req, res) => {
  try {
    const listingId = req.params.id;
    
    console.log('[Views] Tracking view for listing:', listingId);
    
    // CRITICAL FIX: Use findByIdAndUpdate with $inc to atomically increment the view count
    // This ensures the counter increments properly even with concurrent requests
    const listing = await Listing.findByIdAndUpdate(
      listingId,
      { $inc: { views: 1 } }, // Atomically increment views by 1
      { new: true, upsert: false } // Return the updated document
    );
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    console.log('[Views] View count updated:', listing.views);
    
    res.json({
      success: true,
      views: listing.views
    });
  } catch (error) {
    console.error('[Views] Error tracking view:', error);
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

// POST /api/listings/:id/bid - Place a bid on an auction with premium check
router.post('/:id/bid', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const bidder = req.user.username;
    
    // CRITICAL FIX: Ensure amount is always an integer
    const bidAmount = Math.floor(Number(amount));
    
    if (!bidAmount || bidAmount <= 0) {
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
    
    // PREMIUM CHECK: Prevent bidding on premium auctions without subscription
    if (listing.isPremium) {
      const isSubscribed = await isUserSubscribedToSeller(bidder, listing.seller);
      
      if (!isSubscribed) {
        return res.status(403).json({
          success: false,
          error: 'You must be subscribed to this seller to bid on premium auctions',
          requiresSubscription: true,
          seller: listing.seller
        });
      }
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
    
    // Validate minimum bid with integer math
    const currentBid = Math.floor(listing.auction.highestBid || listing.auction.currentBid || 0);
    const startingPrice = Math.floor(listing.auction.startingPrice || 0);
    const minimumBid = currentBid > 0 ? currentBid + 1 : startingPrice;
    
    if (bidAmount < minimumBid) {
      return res.status(400).json({
        success: false,
        error: `Minimum bid is $${minimumBid}`
      });
    }
    
    const buyerWallet = await Wallet.findOne({ username: bidder });
    if (!buyerWallet || !buyerWallet.hasBalance(bidAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance to place this bid'
      });
    }
    
    const previousHighestBidder = listing.auction.highestBidder;
    const previousHighestBid = Math.floor(listing.auction.highestBid || listing.auction.currentBid || 0);
    
    // Store the current balance before withdrawal
    const bidderPreviousBalance = buyerWallet.balance;
    
    // Check if this is an incremental bid (user raising their own bid)
    const isIncrementalBid = previousHighestBidder === bidder && previousHighestBid > 0;
    
    try {
      // CRITICAL FIX: Update BOTH currentBid and highestBid fields
      listing.auction.currentBid = bidAmount;
      listing.auction.highestBid = bidAmount;  // ALWAYS update highestBid
      listing.auction.highestBidder = bidder;
      listing.auction.bidCount += 1;
      
      // Add to bids array
      listing.auction.bids.push({
        bidder: bidder,
        amount: bidAmount,
        date: new Date()
      });
      
      await listing.save();
      
      // Populate seller profile for the response
      const populatedListing = await populateSellerProfile(listing.toObject());
      
      // Create database notification for seller about new bid
      await Notification.createBidNotification(listing.seller, bidder, listing, bidAmount);
      console.log('[Bid] Created database notification for seller');
      
      if (isIncrementalBid) {
        // For incremental bids, only charge the difference (NO FEE)
        const bidDifference = bidAmount - previousHighestBid;
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
            bidAmount: bidAmount,
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
        await buyerWallet.withdraw(bidAmount);
        
        const holdTransaction = new Transaction({
          type: 'bid_hold',
          amount: bidAmount,
          from: bidder,
          to: 'platform_escrow',
          fromRole: 'buyer',
          toRole: 'admin',
          description: `Bid placed on auction: ${listing.title}`,
          status: 'completed',
          metadata: {
            auctionId: listing._id.toString(),
            bidAmount: bidAmount
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
              
              // Create notification for outbid user
              await Notification.createNotification({
                recipient: previousHighestBidder,
                type: 'outbid',
                title: 'You were outbid!',
                message: `You were outbid on "${listing.title}". Your bid of $${previousHighestBid} has been refunded.`,
                metadata: {
                  listingId: listing._id.toString(),
                  refundAmount: previousHighestBid,
                  newBidAmount: bidAmount,
                  newBidder: bidder
                },
                priority: 'high',
                relatedId: listing._id.toString(),
                relatedType: 'auction'
              });
            }
          }
        }
      }
      
      // Emit WebSocket event for the bid
      if (global.webSocketService) {
        global.webSocketService.emitNewBid(populatedListing, {
          bidder: bidder,
          amount: bidAmount,
          date: new Date()
        });
      }
      
      res.json({
        success: true,
        data: populatedListing,
        message: `Bid placed successfully! You are now the highest bidder at $${bidAmount}!`
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

// POST /api/listings/:id/end-auction - End an auction using settlement service (with race condition prevention)
router.post('/:id/end-auction', async (req, res) => {
  try {
    // First check if auction exists and is still active
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
    
    // Check if already processed
    if (listing.auction.status !== 'active') {
      console.log(`[Auction] Auction ${req.params.id} already processed with status: ${listing.auction.status}`);
      return res.json({
        success: true,
        message: 'Auction already processed',
        data: {
          status: listing.auction.status,
          listingId: listing._id
        }
      });
    }
    
    // Check if auction has actually ended
    const now = new Date();
    if (listing.auction.endTime > now) {
      const timeLeft = Math.floor((listing.auction.endTime - now) / 1000);
      return res.status(400).json({
        success: false,
        error: `Auction has not ended yet. ${timeLeft} seconds remaining.`
      });
    }
    
    // Use atomic update to prevent race conditions
    const updatedListing = await Listing.findOneAndUpdate(
      { 
        _id: req.params.id,
        'auction.status': 'active' // Only process if still active
      },
      { 
        $set: { 'auction.status': 'processing' } // Mark as processing
      },
      { new: false } // Return the original document
    );
    
    // If no document was updated, another request already processed it
    if (!updatedListing) {
      console.log(`[Auction] Auction ${req.params.id} already being processed by another request`);
      
      // Get the current status
      const currentListing = await Listing.findById(req.params.id);
      return res.json({
        success: true,
        message: 'Auction already processed',
        data: {
          status: currentListing?.auction?.status || 'unknown',
          listingId: req.params.id
        }
      });
    }
    
    // Now process the auction
    const result = await AuctionSettlementService.processEndedAuction(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('[Auction] Error ending auction:', error);
    
    // Try to reset status if processing failed
    try {
      await Listing.findOneAndUpdate(
        { 
          _id: req.params.id,
          'auction.status': 'processing'
        },
        { 
          $set: { 'auction.status': 'error' }  // Set to error state, not active
        }
      );
    } catch (resetError) {
      console.error('[Auction] Failed to set error status:', resetError);
    }
    
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/listings/:id/cancel-auction - Cancel an auction
router.post('/:id/cancel-auction', authMiddleware, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    // Only seller or admin can cancel
    if (listing.seller !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this auction'
      });
    }
    
    const result = await AuctionSettlementService.cancelAuction(
      req.params.id,
      req.user.username
    );
    
    res.json(result);
  } catch (error) {
    console.error('[Auction] Error cancelling auction:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PATCH /api/listings/:id - Update a listing (FIXED: Changed from PUT to PATCH)
router.patch('/:id', authMiddleware, async (req, res) => {
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
    
    // Populate seller profile for the response
    const populatedListing = await populateSellerProfile(listing.toObject());
    
    if (global.webSocketService) {
      global.webSocketService.emitListingUpdated(populatedListing);
    }
    
    res.json({
      success: true,
      data: populatedListing
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
