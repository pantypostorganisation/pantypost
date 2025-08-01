// pantypost-backend/routes/listing.routes.js
const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/auth.middleware');

// ============= LISTING ROUTES =============

// GET /api/listings - Get all listings with filters
router.get('/', async (req, res) => {
  try {
    const { 
      seller, 
      tag, 
      minPrice, 
      maxPrice, 
      isPremium,
      isAuction,
      status = 'active',
      sort = 'date',
      order = 'desc' 
    } = req.query;
    
    // Build filter
    let filter = { status };
    if (seller) filter.seller = seller;
    if (tag) filter.tags = tag;
    if (isPremium !== undefined) filter.isPremium = isPremium === 'true';
    if (isAuction !== undefined) filter['auction.isAuction'] = isAuction === 'true';
    
    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Build sort
    let sortObj = {};
    if (sort === 'date') sortObj.createdAt = order === 'asc' ? 1 : -1;
    else if (sort === 'price') sortObj.price = order === 'asc' ? 1 : -1;
    else if (sort === 'views') sortObj.views = order === 'asc' ? 1 : -1;
    
    const listings = await Listing.find(filter).sort(sortObj);
    
    res.json({
      success: true,
      listings: listings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/listings - Create a new listing (regular or auction)
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Only sellers can create listings
    if (req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        error: 'Only sellers can create listings'
      });
    }
    
    const listingData = req.body;
    
    // Set seller from authenticated user
    listingData.seller = req.user.username;
    
    // If imageUrl provided (old format), convert to imageUrls array
    if (listingData.imageUrl && !listingData.imageUrls) {
      listingData.imageUrls = [listingData.imageUrl];
      delete listingData.imageUrl;
    }
    
    // Default image if none provided
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
      
      // Remove the flat fields
      delete listingData.isAuction;
      delete listingData.startingPrice;
      delete listingData.reservePrice;
      delete listingData.endTime;
      
      // Auctions don't have a fixed price
      delete listingData.price;
    }
    
    // Create listing
    const listing = new Listing(listingData);
    await listing.save();
    
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
    
    // Increment views
    listing.views = (listing.views || 0) + 1;
    await listing.save();
    
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

// POST /api/listings/:id/bid - Place a bid on an auction (with bid holding)
router.post('/:id/bid', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const bidder = req.user.username;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bid amount'
      });
    }
    
    // Get listing
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    // Check if it's an auction
    if (!listing.auction || !listing.auction.isAuction) {
      return res.status(400).json({
        success: false,
        error: 'This is not an auction listing'
      });
    }
    
    // Check if auction is active
    if (listing.auction.status !== 'active' || new Date() >= listing.auction.endTime) {
      return res.status(400).json({
        success: false,
        error: 'Auction has ended'
      });
    }
    
    // Check buyer has enough balance
    const buyerWallet = await Wallet.findOne({ username: bidder });
    if (!buyerWallet || !buyerWallet.hasBalance(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance to place this bid'
      });
    }
    
    // Store previous highest bidder info (for refund)
    const previousHighestBidder = listing.auction.highestBidder;
    const previousHighestBid = listing.auction.currentBid;
    
    // Place the bid using the model method
    try {
      await listing.placeBid(bidder, amount);
      
      // HOLD THE BID AMOUNT (deduct from bidder's wallet)
      await buyerWallet.withdraw(amount);
      
      // Create transaction for bid hold
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
      
      // REFUND PREVIOUS HIGHEST BIDDER (if exists and not same person)
      if (previousHighestBidder && previousHighestBid > 0 && previousHighestBidder !== bidder) {
        const previousBidderWallet = await Wallet.findOne({ username: previousHighestBidder });
        if (previousBidderWallet) {
          await previousBidderWallet.deposit(previousHighestBid);
          
          // Create refund transaction
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
      
      res.json({
        success: true,
        data: listing,
        message: `Bid placed successfully! ${amount} has been held. You are now the highest bidder!`
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

// POST /api/listings/:id/end-auction - End an auction and create order for winner
router.post('/:id/end-auction', authMiddleware, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }
    
    // Check if user is the seller or admin
    if (listing.seller !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Only the seller can end their auction'
      });
    }
    
    // Check if it's an auction
    if (!listing.auction || !listing.auction.isAuction) {
      return res.status(400).json({
        success: false,
        error: 'This is not an auction listing'
      });
    }
    
    // Check if auction is active
    if (listing.auction.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Auction is not active'
      });
    }
    
    // Check if auction time has passed
    if (new Date() < listing.auction.endTime && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Auction has not ended yet'
      });
    }
    
    // Check if there are any bids
    if (!listing.auction.highestBidder || listing.auction.currentBid === 0) {
      listing.auction.status = 'ended';
      listing.status = 'expired';
      await listing.save();
      
      return res.json({
        success: true,
        message: 'Auction ended with no bids'
      });
    }
    
    // Check if reserve price is met
    if (listing.auction.reservePrice && listing.auction.currentBid < listing.auction.reservePrice) {
      listing.auction.status = 'reserve_not_met';
      listing.status = 'expired';
      await listing.save();
      
      // REFUND THE HIGHEST BIDDER since reserve not met
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
      
      return res.json({
        success: true,
        message: 'Auction ended but reserve price was not met. Bid has been refunded.'
      });
    }
    
    // Create order for the winner
    const winningBid = listing.auction.currentBid;
    const winner = listing.auction.highestBidder;
    
    // Get seller's wallet
    const sellerWallet = await Wallet.findOne({ username: listing.seller });
    if (!sellerWallet) {
      // Create seller wallet if it doesn't exist
      sellerWallet = new Wallet({
        username: listing.seller,
        role: 'seller',
        balance: 0
      });
      await sellerWallet.save();
    }
    
    // Calculate fees
    const platformFee = Math.round(winningBid * 0.1 * 100) / 100;
    const sellerEarnings = Math.round((winningBid - platformFee) * 100) / 100;
    
    // Create order
    const order = new Order({
      title: listing.title,
      description: listing.description,
      price: winningBid,
      seller: listing.seller,
      buyer: winner,
      imageUrl: listing.imageUrls[0],
      tags: listing.tags,
      wasAuction: true,
      finalBid: winningBid,
      platformFee: platformFee,
      sellerEarnings: sellerEarnings,
      paymentStatus: 'completed', // Payment already held
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
    
    // Transfer held bid to seller (minus fees)
    // Note: Buyer's money was already deducted when they placed the winning bid
    await sellerWallet.deposit(sellerEarnings);
    
    // Create transactions for the sale
    const saleTransaction = new Transaction({
      type: 'auction_sale',
      amount: sellerEarnings,
      from: winner,
      to: listing.seller,
      fromRole: 'buyer',
      toRole: 'seller',
      description: `Auction won: ${listing.title} (after fees)`,
      status: 'completed',
      metadata: { 
        orderId: order._id.toString(), 
        auctionId: listing._id.toString(),
        originalAmount: winningBid,
        platformFee: platformFee
      }
    });
    await saleTransaction.save();
    
    // Create platform fee transaction
    const feeTransaction = new Transaction({
      type: 'fee',
      amount: platformFee,
      from: listing.seller,
      to: 'platform',
      fromRole: 'seller',
      toRole: 'admin',
      description: `Platform fee (10%) for auction: ${listing.title}`,
      status: 'completed',
      metadata: { 
        orderId: order._id.toString(),
        auctionId: listing._id.toString()
      }
    });
    await feeTransaction.save();
    
    // Update order with transaction references
    order.paymentTransactionId = saleTransaction._id;
    order.feeTransactionId = feeTransaction._id;
    await order.save();
    
    // Update listing
    listing.auction.status = 'ended';
    listing.status = 'sold';
    listing.soldAt = new Date();
    await listing.save();
    
    res.json({
      success: true,
      message: `Auction ended successfully! Winner: ${winner} at ${winningBid}`,
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
    
    // Check if user owns the listing or is admin
    if (listing.seller !== req.user.username && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this listing'
      });
    }
    
    // Don't allow deletion of active auctions with bids
    if (listing.auction && listing.auction.isAuction && 
        listing.auction.status === 'active' && listing.auction.bidCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete an active auction with bids'
      });
    }
    
    await listing.deleteOne();
    
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