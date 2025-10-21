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

async function populateSellerProfile(listing) {
  try {
    const seller = await User.findOne({ username: listing.seller });
    if (seller) {
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

function filterPremiumContent(listing, hasAccess) {
  if (hasAccess || !listing.isPremium) {
    return listing;
  }
  
  const sanitized = {
    _id: listing._id,
    id: listing._id || listing.id,
    title: listing.title,
    seller: listing.seller,
    isPremium: true,
    status: listing.status,
    createdAt: listing.createdAt,
    isVerified: listing.isVerified,
    sellerProfile: listing.sellerProfile,
    isSellerVerified: listing.isSellerVerified,
    sellerSalesCount: listing.sellerSalesCount,
    description: 'Premium content - Subscribe to view full details',
    price: listing.price,
    markedUpPrice: listing.markedUpPrice,
    imageUrls: listing.imageUrls?.length > 0 ? [listing.imageUrls[0]] : [],
    tags: [],
    hoursWorn: undefined,
    views: listing.views || 0,
    auction: listing.auction?.isAuction ? {
      isAuction: true,
      status: listing.auction.status,
      endTime: listing.auction.endTime,
      currentBid: undefined,
      highestBidder: undefined,
      bidCount: 0,
      bids: []
    } : undefined,
    isLocked: true
  };
  
  return sanitized;
}

// ============= LISTING ROUTES =============

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
    
    let filter = {};
    
    if (status === 'active') {
      filter.$or = [
        { status: 'active' },
        { status: { $exists: false } }
      ];
    } else if (status) {
      filter.status = status;
    }
    
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
    
    if (seller) filter.seller = seller;
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }
    
    if (isPremium !== undefined) filter.isPremium = isPremium === 'true';
    
    if (isAuction !== undefined) filter['auction.isAuction'] = isAuction === 'true';
    
    if (!isAuction || isAuction === 'false') {
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = parseFloat(minPrice);
        if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
      }
    }
    
    if (hoursWorn) {
      const hours = parseInt(hoursWorn);
      if (hours > 0) {
        filter.hoursWorn = { $gte: hours };
      }
    }
    
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
    
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;
    
    const [listings, totalCount] = await Promise.all([
      Listing.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum),
      Listing.countDocuments(filter)
    ]);
    
    const populatedListings = await Promise.all(
      listings.map(listing => populateSellerProfile(listing.toObject()))
    );
    
    let processedListings = populatedListings;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const username = decoded.username;
        const role = decoded.role;
        
        processedListings = await Promise.all(populatedListings.map(async (listing) => {
          if (!listing.isPremium) return listing;
          
          if (username === listing.seller) return listing;
          
          if (role === 'admin') return listing;
          
          if (role === 'buyer') {
            const hasAccess = await isUserSubscribedToSeller(username, listing.seller);
            return filterPremiumContent(listing, hasAccess);
          }
          
          return filterPremiumContent(listing, false);
        }));
      } catch (error) {
        processedListings = populatedListings.map(listing => 
          filterPremiumContent(listing, false)
        );
      }
    } else {
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
    
    if (listingData.imageUrl && !listingData.imageUrls) {
      listingData.imageUrls = [listingData.imageUrl];
      delete listingData.imageUrl;
    }
    
    if (!listingData.imageUrls || listingData.imageUrls.length === 0) {
      listingData.imageUrls = ['https://via.placeholder.com/300'];
    }
    
    if (listingData.isAuction) {
      listingData.auction = {
        isAuction: true,
        startingPrice: Math.floor(listingData.startingPrice || 0),
        reservePrice: listingData.reservePrice ? Math.floor(listingData.reservePrice) : undefined,
        endTime: new Date(listingData.endTime),
        currentBid: 0,
        highestBid: 0,
        bidCount: 0,
        bids: [],
        status: 'active',
        bidIncrement: 1
      };
      
      delete listingData.isAuction;
      delete listingData.startingPrice;
      delete listingData.reservePrice;
      delete listingData.endTime;
      delete listingData.price;
    }
    
    const listing = new Listing(listingData);
    await listing.save();
    
    const populatedListing = await populateSellerProfile(listing.toObject());
    
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

router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    const populatedListing = await populateSellerProfile(listing.toObject());
    
    let hasAccess = true;
    
    if (listing.isPremium) {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          const username = decoded.username;
          const role = decoded.role;
          
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

router.post('/:id/purchase', authMiddleware, async (req, res) => {
  try {
    const { buyerId } = req.body;
    const listingId = req.params.id;
    
    const buyerUsername = buyerId || req.user.username;
    if (!buyerUsername) {
      return res.status(400).json({
        success: false,
        error: 'Buyer information required'
      });
    }
    
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
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
    
    if (listing.status === 'sold') {
      return res.status(400).json({
        success: false,
        error: 'This item has already been sold'
      });
    }
    
    if (listing.auction && listing.auction.isAuction) {
      return res.status(400).json({
        success: false,
        error: 'This is an auction listing. Please use the bid system.'
      });
    }
    
    if (listing.seller === buyerUsername) {
      return res.status(400).json({
        success: false,
        error: 'You cannot purchase your own listing'
      });
    }
    
    listing.status = 'sold';
    listing.buyerId = buyerUsername;
    listing.soldAt = new Date();
    await listing.save();
    
    if (global.webSocketService) {
      global.webSocketService.emitListingSold(listing, buyerUsername);
      
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

// CRITICAL FIX: POST /api/listings/:id/views - Track listing view with atomic increment
router.post('/:id/views', async (req, res) => {
  try {
    const listingId = req.params.id;
    
    console.log('[Views] Tracking view for listing:', listingId);
    
    const listing = await Listing.findById(listingId);
    
    if (!listing) {
      console.log('[Views] Listing not found:', listingId);
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    // CRITICAL FIX: Use findByIdAndUpdate with $inc for atomic increment
    // This prevents race conditions and ensures views are properly tracked
    const updatedListing = await Listing.findByIdAndUpdate(
      listingId,
      { $inc: { views: 1 } },
      { new: true }
    );
    
    console.log('[Views] View incremented. New count:', updatedListing.views);
    
    res.json({
      success: true,
      views: updatedListing.views
    });
  } catch (error) {
    console.error('[Views] Error tracking view:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// CRITICAL FIX: GET /api/listings/:id/views - Get listing views
router.get('/:id/views', async (req, res) => {
  try {
    const listingId = req.params.id;
    
    const listing = await Listing.findById(listingId).select('views');
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    console.log('[Views] Retrieved view count for', listingId, ':', listing.views);
    
    res.json({
      success: true,
      views: listing.views || 0
    });
  } catch (error) {
    console.error('[Views] Error getting views:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/:id/bid', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const bidder = req.user.username;
    
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
    
    const bidderPreviousBalance = buyerWallet.balance;
    
    const isIncrementalBid = previousHighestBidder === bidder && previousHighestBid > 0;
    
    try {
      listing.auction.currentBid = bidAmount;
      listing.auction.highestBid = bidAmount;
      listing.auction.highestBidder = bidder;
      listing.auction.bidCount += 1;
      
      listing.auction.bids.push({
        bidder: bidder,
        amount: bidAmount,
        date: new Date()
      });
      
      await listing.save();
      
      const populatedListing = await populateSellerProfile(listing.toObject());
      
      await Notification.createBidNotification(listing.seller, bidder, listing, bidAmount);
      console.log('[Bid] Created database notification for seller');
      
      if (isIncrementalBid) {
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
        
        if (global.webSocketService) {
          global.webSocketService.emitBalanceUpdate(
            bidder, 
            'buyer', 
            bidderPreviousBalance, 
            buyerWallet.balance, 
            `Bid placed on ${listing.title}`
          );
        }
        
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
            
            if (global.webSocketService) {
              console.log(`[Auction] Emitting balance update for outbid user ${previousHighestBidder}`);
              
              global.webSocketService.emitBalanceUpdate(
                previousHighestBidder, 
                'buyer', 
                previousBidderOldBalance, 
                previousBidderWallet.balance, 
                `Outbid refund for ${listing.title}`
              );
              
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

router.post('/:id/end-auction', async (req, res) => {
  try {
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
    
    const now = new Date();
    if (listing.auction.endTime > now) {
      const timeLeft = Math.floor((listing.auction.endTime - now) / 1000);
      return res.status(400).json({
        success: false,
        error: `Auction has not ended yet. ${timeLeft} seconds remaining.`
      });
    }
    
    const updatedListing = await Listing.findOneAndUpdate(
      { 
        _id: req.params.id,
        'auction.status': 'active'
      },
      { 
        $set: { 'auction.status': 'processing' }
      },
      { new: false }
    );
    
    if (!updatedListing) {
      console.log(`[Auction] Auction ${req.params.id} already being processed by another request`);
      
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
    
    const result = await AuctionSettlementService.processEndedAuction(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('[Auction] Error ending auction:', error);
    
    try {
      await Listing.findOneAndUpdate(
        { 
          _id: req.params.id,
          'auction.status': 'processing'
        },
        { 
          $set: { 'auction.status': 'error' }
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

router.post('/:id/cancel-auction', authMiddleware, async (req, res) => {
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