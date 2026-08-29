// pantypost-backend/routes/listing.routes.js
const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
const authMiddleware = require('../middleware/auth.middleware');
const AuctionSettlementService = require('../services/auctionSettlement');
const jwt = require('jsonwebtoken');
const {
  markPending,
  hasMaterialChange,
  MATERIAL_LISTING_FIELDS,
} = require('../utils/moderation');

// SECURITY: no fallback secret. Previously this defaulted to the literal
// string 'your-secret-key', which would let anyone forge tokens if the
// environment variable were ever missing. server.js refuses to start
// without a valid JWT_SECRET, so by this point it is guaranteed present.
const JWT_SECRET = process.env.JWT_SECRET;

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
/**
 * Aggregate review ratings for a set of sellers in ONE query.
 *
 * User.rating and User.reviewCount exist on the schema but nothing
 * maintains them â€” there is no post-save hook on Review â€” so they are
 * zero for every seller and cannot be used. Ratings are therefore
 * computed from the Review collection directly.
 *
 * Batched deliberately: calling this per listing would mean twenty
 * aggregations to render one page of browse results.
 *
 * @param {string[]} usernames
 * @returns {Promise<Map<string, {rating:number, reviewCount:number}>>}
 */
async function getSellerRatings(usernames) {
  const map = new Map();
  if (!usernames || usernames.length === 0) return map;

  try {
    const unique = [...new Set(usernames.filter(Boolean))];

    const results = await Review.aggregate([
      // Only approved reviews count. GET /api/reviews/:username already
      // filters this way, so without it a denied review would still move
      // the rating shown on a browse card.
      { $match: { reviewee: { $in: unique }, status: 'approved' } },
      {
        $group: {
          _id: '$reviewee',
          rating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    for (const r of results) {
      map.set(r._id, {
        rating: Math.round(r.rating * 10) / 10,
        reviewCount: r.reviewCount
      });
    }
  } catch (error) {
    console.error('[Listing] Error aggregating seller ratings:', error.message);
  }

  return map;
}

/**
 * @param {object} listing
 * @param {Map} [ratingsMap] Pre-computed ratings. Supply this when
 *   populating many listings; omit it for a single listing and one
 *   aggregation will be run for that seller.
 */
async function populateSellerProfile(listing, ratingsMap) {
  try {
    const seller = await User.findOne({ username: listing.seller });
    if (seller) {
      const ratings =
        ratingsMap || (await getSellerRatings([listing.seller]));
      const sellerRating = ratings.get(listing.seller);

      // Add seller profile data to listing
      listing.sellerProfile = {
        bio: seller.bio || null,
        pic: seller.profilePic || null,
        // Consumed by the browse card's star row. Omitted rather than
        // zeroed when a seller has no reviews, so the UI can hide the
        // row instead of showing an empty rating.
        rating: sellerRating?.rating,
        reviewCount: sellerRating?.reviewCount
      };
      listing.isSellerVerified = seller.isVerified || false;
      // Order has no top-level `status` field â€” it has shippingStatus
      // and paymentStatus â€” so the previous filter on `status` matched
      // nothing and every browse card showed 0 sales. Orders are created
      // with paymentStatus 'completed' and move to 'refunded' if
      // reversed, so this counts paid, unreversed orders. The seller
      // profile header uses the identical query, so the two agree.
      listing.sellerSalesCount = await Order.countDocuments({
        seller: listing.seller,
        paymentStatus: 'completed'
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

    let requester = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        requester = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        requester = null;
      }
    }

    const includeAllApprovals = requester?.role === 'admin' && req.query.includeAllApprovals === 'true';

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

    if (!includeAllApprovals) {
      // =====================================================
      // FAIL-CLOSED VISIBILITY
      //
      // Only explicitly approved listings are public.
      //
      // This previously also treated "approvalStatus missing" and
      // "requiresApproval is not true" as publicly visible, which meant
      // unreviewed content could surface simply by lacking a field.
      // =====================================================
      const approvalConditions = [{ approvalStatus: 'approved' }];

      // Sellers can still see their own listings in any state, so they
      // can track what is pending or fix what was denied.
      if (requester?.role === 'seller' && requester?.username) {
        approvalConditions.push({ seller: requester.username });
      }

      filter.$and = filter.$and || [];
      filter.$and.push({ $or: approvalConditions });
    }

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
      // One aggregation for the whole page, rather than one per listing.
      await (async () => {
        const ratingsMap = await getSellerRatings(listings.map(l => l.seller));
        return listings.map(listing =>
          populateSellerProfile(listing.toObject(), ratingsMap)
        );
      })()
    );
    
    // Check user authentication and subscriptions for premium content filtering
    let processedListings = populatedListings;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, JWT_SECRET);
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

    const sellerRecord = await User.findOne({ username: req.user.username });
    const isSellerVerified = Boolean(sellerRecord?.isVerified || sellerRecord?.verificationStatus === 'verified');

    // =====================================================
    // VERIFICATION REQUIRED TO LIST
    //
    // Only sellers who have completed identity verification may create
    // listings. Previously this value was read but used only to LABEL
    // the listing, so an unverified seller could publish freely.
    //
    // Payment processor rules require uploads be restricted to verified
    // creators, and it is trivially testable â€” someone can simply
    // register and try.
    // =====================================================
    if (!isSellerVerified) {
      return res.status(403).json({
        success: false,
        error: 'Identity verification required',
        message: 'You must complete identity verification before creating listings.',
        requiresVerification: true
      });
    }

    listingData.isVerified = isSellerVerified;
    listingData.verifiedSeller = isSellerVerified;

    // =====================================================
    // PRE-PUBLICATION REVIEW
    //
    // Every listing enters the moderation queue, with no exceptions.
    //
    // Verified sellers previously bypassed review entirely and were
    // auto-approved by 'system'. Verification confirms who someone is;
    // it says nothing about what they are about to upload, so it cannot
    // stand in for content review.
    // =====================================================
    markPending(listingData, 'Awaiting initial review');

    // Handle images
    if (listingData.imageUrl && !listingData.imageUrls) {
      listingData.imageUrls = [listingData.imageUrl];
      delete listingData.imageUrl;
    }
    
    /* A listing with no images used to be given
       `https://via.placeholder.com/300`. That service is retired, so the
       "placeholder" rendered as a broken image on the browse grid and the
       listing page â€” worse than showing nothing.

       Leave the array empty instead and let the client decide what an
       image-less listing looks like. */
    if (!Array.isArray(listingData.imageUrls)) {
      listingData.imageUrls = [];
    }
    
    // Handle auction data
    if (listingData.isAuction) {
      listingData.auction = {
        isAuction: true,
        startingPrice: Math.floor(listingData.startingPrice || 0),
        reservePrice: listingData.reservePrice ? Math.floor(listingData.reservePrice) : undefined,
        buyNowPrice: listingData.buyNowPrice ? Math.floor(listingData.buyNowPrice) : undefined,
        endTime: new Date(listingData.endTime),
        currentBid: 0,
        highestBid: 0,  // Initialize highestBid
        bidCount: 0,
        bids: [],
        status: 'active',
        bidIncrement: 1  // Always use $1 increments
      };
      
      /* A buy-now below the starting price or the reserve would make
         the auction unwinnable and the listing nonsense, so refuse it
         at creation rather than letting a seller publish a trap. */
      const bnp = listingData.auction.buyNowPrice;
      if (bnp !== undefined) {
        if (bnp <= listingData.auction.startingPrice) {
          return res.status(400).json({
            success: false,
            error: 'Buy Now price must be higher than the starting price'
          });
        }
        if (listingData.auction.reservePrice && bnp <= listingData.auction.reservePrice) {
          return res.status(400).json({
            success: false,
            error: 'Buy Now price must be higher than the reserve price'
          });
        }
      }

      delete listingData.isAuction;
      delete listingData.startingPrice;
      delete listingData.reservePrice;
      delete listingData.buyNowPrice;
      delete listingData.endTime;
      delete listingData.price;
    }

    // =====================================================
    // DROP LISTINGS
    //
    // One listing, N numbered units. Validated here so a drop enters
    // the SAME moderation queue as everything else — one admin
    // approval covers the whole run, and there is no per-unit bypass
    // to be tempted into.
    // =====================================================
    if (listingData.isDrop) {
      if (listingData.auction && listingData.auction.isAuction) {
        return res.status(400).json({
          success: false,
          error: 'A listing cannot be both an auction and a drop'
        });
      }

      const totalUnits = parseInt(listingData.totalUnits, 10);
      if (!Number.isInteger(totalUnits) || totalUnits < 2 || totalUnits > 2000) {
        return res.status(400).json({
          success: false,
          error: 'Drop size must be a whole number between 2 and 2000 units'
        });
      }

      const priceNumber = Number(listingData.price);
      if (!(priceNumber > 0)) {
        return res.status(400).json({
          success: false,
          error: 'A drop requires a per-unit price'
        });
      }

      let scheduledFor;
      if (listingData.dropScheduledFor) {
        scheduledFor = new Date(listingData.dropScheduledFor);
        const now = Date.now();
        const maxAhead = 60 * 24 * 60 * 60 * 1000; // 60 days
        if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() <= now || scheduledFor.getTime() > now + maxAhead) {
          return res.status(400).json({
            success: false,
            error: 'Drop open time must be in the future and within 60 days'
          });
        }
      }

      listingData.drop = {
        isDrop: true,
        totalUnits,
        unitsRemaining: totalUnits,
        unitsSold: 0,
        scheduledFor,
        wornOnCamera: true
      };

      delete listingData.isDrop;
      delete listingData.totalUnits;
      delete listingData.dropScheduledFor;
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

    // =====================================================
    // FAIL-CLOSED DIRECT ACCESS
    //
    // Fixing the browse filter alone is not enough: a listing awaiting
    // review or already denied could still be viewed by anyone holding
    // its direct URL, which a seller could simply share.
    //
    // Only the owning seller and admins may view unapproved listings.
    // =====================================================
    if (listing.approvalStatus !== 'approved') {
      let viewerUsername = null;
      let viewerRole = null;

      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          viewerUsername = decoded.username;
          viewerRole = decoded.role;
        } catch (error) {
          // Invalid token is treated as anonymous.
        }
      }

      const isOwner = viewerUsername && viewerUsername === listing.seller;
      const isAdmin = viewerRole === 'admin';

      if (!isOwner && !isAdmin) {
        // Deliberately a 404 rather than 403, so the existence of
        // unapproved listings is not disclosed.
        return res.status(404).json({
          success: false,
          error: 'Listing not found'
        });
      }
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
          const decoded = jwt.verify(token, JWT_SECRET);
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
    // =====================================================
    // ADMIN-ONLY. This endpoint flips a listing to sold WITHOUT moving
    // any money — it was reachable by any authenticated user, letting
    // anyone mark anyone's listing sold for free. No frontend code
    // calls it (verified: standard purchases go through POST
    // /api/orders, which now claims the listing atomically itself).
    // Kept, locked, for manual admin correction only.
    // =====================================================
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'This endpoint is restricted to administrators'
      });
    }

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

    // Drops are multi-unit and settle money server-side; this legacy
    // mark-sold path would flip a 500-unit drop to sold on the first
    // click without touching inventory or a wallet.
    if (listing.drop && listing.drop.isDrop) {
      return res.status(400).json({
        success: false,
        error: 'This is a drop listing. Use the drop purchase flow.'
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

/* =====================================================================
 * POST /api/listings/:id/views -- track a listing view
 *
 * WHY THIS CHANGED
 *
 * The old handler incremented on EVERY request, unconditionally. Three
 * consequences:
 *
 *   1. React StrictMode mounts effects twice in development, so a local
 *      page load counted 2 views. That is the +2 that was noticed.
 *   2. The client also force-tracks on bfcache restore and popstate, so
 *      tabbing back to a listing counted again.
 *   3. Nothing stopped anyone POSTing this endpoint in a loop and
 *      inflating a listing's view count to whatever they liked. On a
 *      marketplace where views are the seller's main signal of interest,
 *      that number has to mean something.
 *
 * Fixed on the SERVER rather than the client, because the client can
 * always be bypassed and because a future caller would reintroduce the
 * bug for free.
 *
 * A view now counts at most once per viewer per listing per window. The
 * viewer is the logged-in username where there is one, otherwise a hash
 * of IP + user agent -- imperfect for guests behind a shared NAT, but
 * far better than counting every request, and it stores no raw IP.
 * ===================================================================== */

// In-memory, because a view is a soft metric and this only needs to be
// approximately right. It also means no schema change and no extra
// collection. Trade-off: a PM2 restart clears the window, and a second
// backend instance would keep its own -- both acceptable for view counts.
const VIEW_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const recentViews = new Map(); // key -> timestamp

// Keep the map from growing without bound.
setInterval(() => {
  const cutoff = Date.now() - VIEW_WINDOW_MS;
  for (const [key, seenAt] of recentViews.entries()) {
    if (seenAt < cutoff) recentViews.delete(key);
  }
}, 10 * 60 * 1000).unref?.();

function viewerFingerprint(req) {
  if (req.user?.username) return `u:${req.user.username}`;

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  const agent = req.headers['user-agent'] || '';

  // Hashed so no raw IP is retained.
  return `a:${crypto.createHash('sha256').update(`${ip}|${agent}`).digest('hex').slice(0, 32)}`;
}

router.post('/:id/views', async (req, res) => {
  try {
    const listingId = req.params.id;
    const key = `${listingId}:${viewerFingerprint(req)}`;
    const now = Date.now();
    const lastSeen = recentViews.get(key);

    /* RESERVE THE KEY SYNCHRONOUSLY -- this line is the whole fix.
     *
     * The first version set it AFTER the await. React StrictMode fires
     * its two effects in the same tick, so both requests arrived within
     * milliseconds, BOTH read an empty map, and BOTH incremented before
     * either could write. A window only blocks a later request; it does
     * nothing about a simultaneous one.
     *
     * Node is single-threaded, so everything between here and the next
     * await runs without interruption. Claiming the key now means the
     * second request sees it and bails, however close behind it is. */
    if (!lastSeen || now - lastSeen >= VIEW_WINDOW_MS) {
      recentViews.set(key, now);
    }

    // Already counted recently: return the current figure without
    // incrementing, so the UI still shows the right number.
    if (lastSeen && now - lastSeen < VIEW_WINDOW_MS) {
      const listing = await Listing.findById(listingId).select('views').lean();
      if (!listing) {
        return res.status(404).json({ success: false, error: 'Listing not found' });
      }
      return res.json({ success: true, views: listing.views || 0, counted: false });
    }

    const listing = await Listing.findByIdAndUpdate(
      listingId,
      { $inc: { views: 1 } },
      { new: true, upsert: false }
    );

    if (!listing) {
      // Release the reservation: nothing was counted, so a later genuine
      // view of a listing that does exist should not be suppressed.
      recentViews.delete(key);
      return res.status(404).json({ success: false, error: 'Listing not found' });
    }

    res.json({ success: true, views: listing.views, counted: true });
  } catch (error) {
    console.error('[Views] Error tracking view:', error);
    res.status(500).json({ success: false, error: error.message });
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

    /* The cap that makes buy-now safe. Bidding can approach the
       buy-now price but never reach it, so there is never a bidder
       holding a bid worth more than an instant purchase, and buy-now
       never has to cancel someone else's winning position. */
    const buyNowPrice = listing.auction.buyNowPrice
      ? Math.floor(listing.auction.buyNowPrice)
      : null;
    if (buyNowPrice && bidAmount >= buyNowPrice) {
      return res.status(400).json({
        success: false,
        error: `Bids must stay under the Buy Now price of $${buyNowPrice}. Use Buy Now to purchase this item instantly.`
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

// CRITICAL FIX: UPDATE LISTING ENDPOINT
// PUT /api/listings/:id - Update a listing (Support both PUT and PATCH)
router.put('/:id', authMiddleware, updateListing);
router.patch('/:id', authMiddleware, updateListing);

async function updateListing(req, res) {
  try {
    console.log('[UPDATE] Updating listing:', req.params.id);
    console.log('[UPDATE] Update data:', req.body);
    
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
    delete req.body._id;
    delete req.body.id;
    
    // Can't edit active auction with bids
    if (listing.auction && listing.auction.isAuction && 
        listing.auction.status === 'active' && listing.auction.bidCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit an active auction with bids'
      });
    }
    
    // =====================================================
    // RE-REVIEW ON MATERIAL EDIT
    //
    // Approval applies to the content that was reviewed, not to the
    // listing in perpetuity. Changing the title, description, tags or
    // images means buyers would see something a moderator never saw.
    //
    // Without this check the entire moderation system is defeated by
    // submitting acceptable content, waiting for approval, then editing
    // it into something else.
    //
    // Price and stock changes are deliberately excluded: they are not
    // moderated content, and forcing re-review on every price tweak
    // would flood the queue.
    // =====================================================
    const needsReReview = hasMaterialChange(listing, req.body, MATERIAL_LISTING_FIELDS);

    // CRITICAL FIX: Ensure price is properly updated and markedUpPrice is recalculated
    if (req.body.price !== undefined) {
      listing.price = Number(req.body.price);
      listing.markedUpPrice = Math.round(listing.price * 1.1 * 100) / 100; // Recalculate markup
      console.log('[UPDATE] Price updated to:', listing.price, 'Markup:', listing.markedUpPrice);
    }
    
    // Update other fields
    const fieldsToUpdate = ['title', 'description', 'tags', 'hoursWorn', 'isPremium', 'imageUrls', 'status'];
    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        listing[field] = req.body[field];
      }
    });

    if (needsReReview) {
      const editor = req.user.role === 'admin' ? `admin:${req.user.username}` : 'seller';
      markPending(listing, `Returned to review after edit by ${editor}`);
      console.log('[UPDATE] Listing returned to moderation queue after material edit:', listing._id);
    }
    
    // Save the updated listing
    await listing.save();
    
    // Populate seller profile for the response
    const populatedListing = await populateSellerProfile(listing.toObject());
    
    console.log('[UPDATE] Listing updated successfully:', populatedListing.price);
    
    // CRITICAL: Emit WebSocket event to update all clients in real-time
    if (global.webSocketService) {
      console.log('[UPDATE] Emitting listing update via WebSocket');
      
      // Emit multiple events to ensure all clients get the update
      global.webSocketService.emitListingUpdated(populatedListing);
      
      // Also emit a specific update event with the full listing data
      global.webSocketService.broadcast('listing:updated', {
        listingId: listing._id.toString(),
        id: listing._id.toString(),
        listing: populatedListing,
        timestamp: new Date()
      });
      
      // Emit to specific listing room if it exists
      global.webSocketService.emitToRoom(`listing:${listing._id}`, 'listing:price_updated', {
        listingId: listing._id.toString(),
        price: listing.price,
        markedUpPrice: listing.markedUpPrice,
        title: listing.title,
        description: listing.description,
        tags: listing.tags,
        imageUrls: listing.imageUrls
      });
    }
    
    // Clear any caching headers to prevent stale data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      success: true,
      data: populatedListing,
      message: 'Listing updated successfully'
    });
  } catch (error) {
    console.error('[UPDATE] Error updating listing:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

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

