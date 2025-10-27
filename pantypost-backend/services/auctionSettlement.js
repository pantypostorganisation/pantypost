// pantypost-backend/services/auctionSettlement.js
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { incrementPaymentStats } = require('../utils/paymentStats');

class AuctionSettlementService {
  /**
   * Process ended auction - handle winner, refunds, reserve checks
   */
  static async processEndedAuction(listingId) {
    const listing = await Listing.findById(listingId);
    
    if (!listing || !listing.auction || !listing.auction.isAuction) {
      throw new Error('Invalid auction listing');
    }
    
    // Check for already processed auctions and return success
    if (listing.auction.status !== 'active') {
      console.log(`[Auction] Auction ${listingId} already processed with status: ${listing.auction.status}`);
      
      // CRITICAL: If auction was already processed successfully, check if order exists
      if (listing.auction.status === 'ended' && listing.auction.highestBidder) {
        const existingOrder = await Order.findOne({ 
          listingId: listing._id,
          wasAuction: true 
        });
        
        if (existingOrder) {
          // Emit the order created event for the frontend
          if (global.webSocketService && global.webSocketService.emitOrderCreated) {
            const formattedOrder = this.formatOrderForWebSocket(existingOrder);
            global.webSocketService.emitOrderCreated(formattedOrder);
          }
        }
      }
      
      return {
        success: true,
        message: `Auction already processed with status: ${listing.auction.status}`,
        alreadyProcessed: true,
        data: {
          status: listing.auction.status,
          listingId: listing._id
        }
      };
    }
    
    const now = new Date();
    if (listing.auction.endTime > now) {
      throw new Error('Auction has not ended yet');
    }
    
    // Use atomic update to prevent race conditions
    const updatedListing = await Listing.findOneAndUpdate(
      { 
        _id: listingId,
        'auction.status': 'active'
      },
      { 
        $set: { 'auction.status': 'processing' }
      },
      { new: false }
    );
    
    // If no document was updated, another request already processed it
    if (!updatedListing) {
      console.log(`[Auction] Auction ${listingId} already being processed by another request`);
      
      const currentListing = await Listing.findById(listingId);
      
      // Check if order was created
      if (currentListing?.auction?.status === 'ended' && currentListing?.auction?.highestBidder) {
        const existingOrder = await Order.findOne({ 
          listingId: listing._id,
          wasAuction: true 
        });
        
        if (existingOrder && global.webSocketService && global.webSocketService.emitOrderCreated) {
          const formattedOrder = this.formatOrderForWebSocket(existingOrder);
          global.webSocketService.emitOrderCreated(formattedOrder);
        }
      }
      
      return {
        success: true,
        message: 'Auction already processed',
        alreadyProcessed: true,
        data: {
          status: currentListing?.auction?.status || 'unknown',
          listingId: listingId
        }
      };
    }
    
    try {
      console.log(`[Auction] Processing auction ${listingId}:`, {
        highestBidder: updatedListing.auction.highestBidder,
        currentBid: updatedListing.auction.currentBid,
        highestBid: updatedListing.auction.highestBid,
        bidCount: updatedListing.auction.bidCount,
        bidsArrayLength: updatedListing.auction.bids?.length || 0
      });
      
      // CRITICAL FIX: Check ALL bid indicators properly, including highestBid field
      const hasHighestBidder = updatedListing.auction.highestBidder && 
                               updatedListing.auction.highestBidder.trim().length > 0;
      const hasCurrentBid = updatedListing.auction.currentBid && 
                           updatedListing.auction.currentBid > 0;
      const hasHighestBid = updatedListing.auction.highestBid && 
                           updatedListing.auction.highestBid > 0;
      const hasBidsInArray = updatedListing.auction.bids && 
                             updatedListing.auction.bids.length > 0;
      const hasBidCount = updatedListing.auction.bidCount && 
                         updatedListing.auction.bidCount > 0;
      
      // FIX: Accept ANY of these as valid bid indicators
      const hasValidBids = hasHighestBidder || hasCurrentBid || hasHighestBid || hasBidsInArray || hasBidCount;
      
      // Determine final bid amount - prioritize highestBid field
      let finalBidAmount = updatedListing.auction.highestBid || updatedListing.auction.currentBid || 0;
      let finalBidder = updatedListing.auction.highestBidder;
      
      // If we have a highest bidder but no bid amount, check the bids array
      if (hasHighestBidder && !finalBidAmount && hasBidsInArray) {
        const highestBidFromArray = updatedListing.auction.bids
          .filter(bid => bid.bidder === updatedListing.auction.highestBidder)
          .sort((a, b) => b.amount - a.amount)[0];
        
        if (highestBidFromArray) {
          finalBidAmount = highestBidFromArray.amount;
          console.log(`[Auction] Using bid amount from array: ${finalBidAmount}`);
        }
      }
      
      console.log(`[Auction] Bid validation for ${listingId}:`, {
        hasHighestBidder,
        hasCurrentBid,
        hasHighestBid,
        hasBidsInArray,
        hasBidCount,
        hasValidBids,
        finalBidAmount,
        finalBidder
      });
      
      if (!hasValidBids || !finalBidAmount || !finalBidder) {
        console.log(`[Auction] No valid bids for auction ${listingId}`);
        updatedListing.auction.status = 'ended';
        updatedListing.status = 'expired';
        updatedListing.isActive = false;
        await updatedListing.save();
        
        // Notify seller
        await Notification.create({
          recipient: updatedListing.seller,
          type: 'auction_ended',
          title: 'Auction Ended',
          message: `Your auction for "${updatedListing.title}" ended without any valid bids`,
          metadata: { listingId: updatedListing._id }
        });
        
        // Emit WebSocket event
        if (global.webSocketService) {
          global.webSocketService.broadcast('auction:ended', {
            listingId: updatedListing._id.toString(),
            title: updatedListing.title,
            status: 'no_bids'
          });
        }
        
        return { success: true, message: 'Auction ended with no valid bids' };
      }
      
      // Check reserve price
      if (updatedListing.auction.reservePrice && finalBidAmount < updatedListing.auction.reservePrice) {
        console.log(`[Auction] Reserve not met for auction ${listingId}: bid ${finalBidAmount} < reserve ${updatedListing.auction.reservePrice}`);
        updatedListing.auction.status = 'reserve_not_met';
        updatedListing.status = 'expired';
        updatedListing.isActive = false;
        await updatedListing.save();
        
        // CRITICAL FIX: Only refund the final highest bidder, not all bidders
        // All other bidders were already refunded when they were outbid
        await this.refundBidder(
          finalBidder,
          finalBidAmount,
          updatedListing._id,
          'Reserve price not met'
        );
        
        // Notify seller and final bidder
        await Notification.create({
          recipient: updatedListing.seller,
          type: 'auction_reserve_not_met',
          title: 'Reserve Not Met',
          message: `Auction for "${updatedListing.title}" ended but reserve price of $${updatedListing.auction.reservePrice} was not met`,
          metadata: { 
            listingId: updatedListing._id,
            reservePrice: updatedListing.auction.reservePrice,
            highestBid: finalBidAmount
          }
        });
        
        await Notification.create({
          recipient: finalBidder,
          type: 'bid_refunded',
          title: 'Bid Refunded - Reserve Not Met',
          message: `Your bid of $${finalBidAmount} for "${updatedListing.title}" was refunded - reserve price not met`,
          metadata: { 
            listingId: updatedListing._id, 
            amount: finalBidAmount,
            reservePrice: updatedListing.auction.reservePrice
          }
        });
        
        // Emit WebSocket event
        if (global.webSocketService) {
          global.webSocketService.broadcast('auction:reserve_not_met', {
            listingId: updatedListing._id.toString(),
            title: updatedListing.title,
            reservePrice: updatedListing.auction.reservePrice,
            highestBid: finalBidAmount,
            highestBidder: finalBidder
          });
        }
        
        return { success: true, message: 'Auction ended - reserve not met' };
      }
      
      // Process winning bid with the corrected amounts
      console.log(`[Auction] Processing winning bid for ${listingId}: winner=${finalBidder}, amount=${finalBidAmount}`);
      
      // Update the listing with correct bid data before processing
      updatedListing.auction.currentBid = finalBidAmount;
      updatedListing.auction.highestBid = finalBidAmount;
      updatedListing.auction.highestBidder = finalBidder;
      
      return await this.processWinningBid(updatedListing);
      
    } catch (error) {
      // FIX: Set status to 'error' instead of 'active' to prevent infinite loops
      console.error('[Auction] Error processing auction:', error);
      
      try {
        await Listing.findOneAndUpdate(
          { 
            _id: listingId,
            'auction.status': 'processing'
          },
          { 
            $set: { 'auction.status': 'error' }  // Don't reset to active!
          }
        );
      } catch (resetError) {
        console.error('[Auction] Failed to set error status:', resetError);
      }
      
      throw error;
    }
  }
  
  /**
   * Format order for WebSocket emission
   */
  static formatOrderForWebSocket(order) {
    return {
      id: order._id.toString(),
      _id: order._id.toString(),
      title: order.title,
      description: order.description,
      price: order.price,
      markedUpPrice: order.markedUpPrice || order.price,
      imageUrl: order.imageUrl,
      seller: order.seller,
      buyer: order.buyer,
      date: order.date ? order.date.toISOString() : order.createdAt.toISOString(),
      createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
      tags: order.tags || [],
      listingId: order.listingId?.toString(),
      wasAuction: order.wasAuction || false,
      finalBid: order.finalBid,
      shippingStatus: order.shippingStatus || 'pending',
      paymentStatus: order.paymentStatus || 'pending',
      sellerEarnings: order.sellerEarnings,
      platformFee: order.platformFee,
      deliveryAddress: order.deliveryAddress,
      isCustomRequest: order.isCustomRequest || false
    };
  }
  
  /**
   * Process winning bid and create order
   */
  static async processWinningBid(listing) {
    const winningBid = Math.floor(listing.auction.highestBid || listing.auction.currentBid);
    const winner = listing.auction.highestBidder;
    
    console.log(`[Auction] Processing winning bid for auction ${listing._id}: Winner=${winner}, Bid=$${winningBid}`);
    
    // DEBUG: Log the exact winner value
    console.log(`[Auction] DEBUG - Winner username: "${winner}" (length: ${winner ? winner.length : 0})`);
    console.log(`[Auction] DEBUG - Listing highestBidder: "${listing.auction.highestBidder}" (length: ${listing.auction.highestBidder ? listing.auction.highestBidder.length : 0})`);
    
    // FIX: Create wallet for winner if it doesn't exist
    let bidderWallet = await Wallet.findOne({ username: winner });
    if (!bidderWallet) {
      console.log(`[Auction] Creating wallet for winner ${winner}`);
      const winnerUser = await User.findOne({ username: winner });
      bidderWallet = new Wallet({
        username: winner,
        role: winnerUser ? winnerUser.role : 'buyer',
        balance: 0
      });
      await bidderWallet.save();
      console.log(`[Auction] Created wallet for winner ${winner}`);
    }
    
    // Get or create seller wallet
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
    
    // Calculate fees (20% from seller for auctions)
    const AUCTION_PLATFORM_FEE = 0.20;
    const sellerPlatformFee = Math.round(winningBid * AUCTION_PLATFORM_FEE * 100) / 100;
    const sellerEarnings = Math.round((winningBid - sellerPlatformFee) * 100) / 100;
    
    console.log(`[Auction] Creating order for auction ${listing._id}`);
    
    // CRITICAL DEBUG: Log exactly what we're putting in the order
    console.log(`[Auction] CRITICAL DEBUG - Creating order with:`);
    console.log(`  - buyer field: "${winner}"`);
    console.log(`  - seller field: "${listing.seller}"`);
    console.log(`  - title: "${listing.title}"`);
    
    // CRITICAL FIX: Create order with proper date field
    const order = new Order({
      title: listing.title,
      description: listing.description,
      price: winningBid,
      markedUpPrice: winningBid,
      seller: listing.seller,
      buyer: winner,  // This should be the correct username
      imageUrl: listing.imageUrls?.[0] || 'https://via.placeholder.com/300',
      tags: listing.tags || [],
      listingId: listing._id,
      wasAuction: true,
      finalBid: winningBid,
      shippingStatus: 'pending',
      paymentStatus: 'completed',
      paymentCompletedAt: new Date(),
      date: new Date().toISOString(), // CRITICAL: Set date as string
      createdAt: new Date(),
      platformFee: sellerPlatformFee,
      sellerPlatformFee: sellerPlatformFee,
      buyerMarkupFee: 0,
      sellerEarnings: sellerEarnings,
      tierCreditAmount: 0,
      sellerTier: null
    });
    
    // DEBUG: Log the order object before saving
    console.log(`[Auction] Order object before save - buyer: "${order.buyer}"`);
    
    await order.save();
    
    // DEBUG: Log the saved order
    console.log(`[Auction] Order saved with ID: ${order._id}`);
    console.log(`[Auction] Saved order buyer field: "${order.buyer}"`);
    
    // Verify what was actually saved
    const savedOrder = await Order.findById(order._id);
    console.log(`[Auction] Verification - Retrieved saved order buyer: "${savedOrder.buyer}"`);
    
    // CRITICAL FIX: Emit order immediately with proper formatting
    const formattedOrder = {
      _id: order._id.toString(),
      id: order._id.toString(),
      title: order.title,
      description: order.description,
      price: winningBid,
      markedUpPrice: winningBid,
      imageUrl: order.imageUrl,
      seller: listing.seller,
      buyer: winner,
      date: order.date || order.createdAt.toISOString(),
      tags: order.tags || [],
      listingId: listing._id.toString(),
      wasAuction: true,
      finalBid: winningBid,
      shippingStatus: 'pending',
      paymentStatus: 'completed',
      sellerEarnings: sellerEarnings,
      platformFee: sellerPlatformFee,
      deliveryAddress: undefined
    };
    
    // Emit directly to winner FIRST
    if (global.webSocketService && global.webSocketService.emitToUser) {
      global.webSocketService.emitToUser(winner, 'order:created', {
        order: formattedOrder,
        buyer: winner,
        seller: listing.seller
      });
      
      global.webSocketService.emitToUser(winner, 'order:new', {
        order: formattedOrder
      });
      
      console.log(`[Auction] Emitted order:created directly to winner ${winner}`);
    }
    
    // Store old balances for WebSocket events
    const sellerOldBalance = sellerWallet.balance;
    const platformOldBalance = platformWallet.balance;
    
    // Transfer funds (from escrow to seller/platform)
    await sellerWallet.deposit(sellerEarnings);
    await platformWallet.deposit(sellerPlatformFee);
    
    console.log(`[Auction] Funds transferred - Seller: +$${sellerEarnings}, Platform: +$${sellerPlatformFee}`);
    
    // Create transactions
    const saleTransaction = new Transaction({
      type: 'auction_sale',
      amount: winningBid,
      from: 'platform_escrow',
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
        percentage: 20
      }
    });
    await feeTransaction.save();
    
    // Link transactions to order
    order.paymentTransactionId = saleTransaction._id;
    order.feeTransactionId = feeTransaction._id;
    await order.save();
    
    // Update listing status
    listing.auction.status = 'ended';
    listing.status = 'sold';
    listing.isActive = false;
    listing.isSold = true;
    listing.soldAt = new Date();
    await listing.save();
    
    console.log(`[Auction] Listing ${listing._id} marked as sold`);
    
    // Create notifications
    await Notification.create({
      recipient: listing.seller,
      type: 'auction_won',
      title: 'Auction Sold!',
      message: `Your auction "${listing.title}" sold for $${winningBid}. You earned $${sellerEarnings} (after 20% platform fee)`,
      metadata: { 
        listingId: listing._id,
        orderId: order._id,
        amount: winningBid,
        earnings: sellerEarnings,
        platformFee: sellerPlatformFee
      }
    });
    
    await Notification.create({
      recipient: winner,
      type: 'auction_winner',
      title: 'Congratulations! You Won!',
      message: `You won the auction for "${listing.title}" at $${winningBid}. Please provide your delivery address.`,
      link: '/buyers/my-orders',
      metadata: { 
        listingId: listing._id,
        orderId: order._id,
        amount: winningBid
      }
    });
    
    console.log(`[Auction] Notifications created for seller and winner`);
    
    // CRITICAL FIX: DO NOT REFUND OTHER BIDDERS HERE
    // They were already refunded when they were outbid during the auction
    // Only the winner's funds remain held, and they are now being used for the purchase
    console.log(`[Auction] Skipping refund of losing bidders - they were already refunded when outbid`);
    
    // Emit WebSocket events with complete order data
    if (global.webSocketService) {
      console.log(`[Auction] Emitting WebSocket events for auction end`);
      
      // CRITICAL: Use the emitOrderCreated method from websocket service
      if (global.webSocketService.emitOrderCreated) {
        console.log(`[Auction] Calling emitOrderCreated for buyer ${winner}`);
        global.webSocketService.emitOrderCreated(formattedOrder);
      }
      
      // Also emit the raw order:created event
      global.webSocketService.broadcast('order:created', {
        order: formattedOrder,
        buyer: winner,
        seller: listing.seller
      });
      
      // Emit auction ended event
      if (global.webSocketService.emitAuctionEnded) {
        global.webSocketService.emitAuctionEnded(listing, winner, winningBid);
      }
      
      // Listing sold event
      if (global.webSocketService.emitListingSold) {
        global.webSocketService.emitListingSold({
          _id: listing._id,
          title: listing.title,
          seller: listing.seller,
          buyer: winner,
          price: winningBid
        });
      }
      
      // Balance updates
      if (global.webSocketService.emitBalanceUpdate) {
        global.webSocketService.emitBalanceUpdate(
          listing.seller,
          'seller',
          sellerOldBalance,
          sellerWallet.balance,
          `Auction sale completed - earned $${sellerEarnings} (after 20% fee)`
        );
        
        global.webSocketService.emitBalanceUpdate(
          'platform',
          'admin',
          platformOldBalance,
          platformWallet.balance,
          `Platform fee from auction: ${listing.title}`
        );
      }
      
      // Emit specific event for the winner
      if (global.webSocketService.emitToUser) {
        global.webSocketService.emitToUser(winner, 'auction:won', {
          orderId: order._id.toString(),
          listingId: listing._id.toString(),
          title: listing.title,
          amount: winningBid,
          needsAddress: true,
          order: formattedOrder
        });
        
        // Also emit order:new for the buyer
        global.webSocketService.emitToUser(winner, 'order:new', {
          order: formattedOrder
        });
      }
    }

    try {
      await incrementPaymentStats();
    } catch (statsError) {
      console.error('[Auction] Failed to increment payment stats:', statsError);
    }

    console.log(`[Auction] Successfully completed auction ${listing._id} - Order: ${order._id}`);
    
    return {
      success: true,
      message: `Auction completed successfully! Winner: ${winner} at $${winningBid}`,
      data: {
        listing: listing,
        order: formattedOrder,
        sellerEarnings: sellerEarnings,
        platformFee: sellerPlatformFee
      }
    };
  }
  
  /**
   * REMOVED: refundLosingBidders function
   * This function was causing the double refund issue.
   * Losing bidders are already refunded in real-time when they are outbid.
   * We should NOT refund them again when the auction ends.
   */
  
  /**
   * Refund a single bidder (used for reserve not met, cancellation, etc.)
   */
  static async refundBidder(username, amount, listingId, reason) {
    try {
      const bidderWallet = await Wallet.findOne({ username });
      if (!bidderWallet) {
        console.error(`[Auction] Wallet not found for bidder: ${username}`);
        return;
      }
      
      const oldBalance = bidderWallet.balance;
      await bidderWallet.deposit(amount);
      
      const refundTransaction = new Transaction({
        type: 'bid_refund',
        amount: amount,
        from: 'platform_escrow',
        to: username,
        fromRole: 'system',
        toRole: 'buyer',
        description: reason,
        status: 'completed',
        completedAt: new Date(),
        metadata: { 
          auctionId: listingId.toString(),
          reason: reason.includes('Outbid') ? 'outbid' : 
                 reason.includes('Reserve') ? 'reserve_not_met' : 
                 reason.includes('cancelled') ? 'cancelled' : 'other'
        }
      });
      await refundTransaction.save();
      
      // Emit WebSocket event for balance update
      if (global.webSocketService) {
        if (global.webSocketService.emitBalanceUpdate) {
          global.webSocketService.emitBalanceUpdate(
            username,
            'buyer',
            oldBalance,
            bidderWallet.balance,
            reason
          );
        }
        
        // Also emit specific refund event
        if (global.webSocketService.emitToUser) {
          global.webSocketService.emitToUser(username, 'wallet:refund', {
            username: username,
            amount: amount,
            balance: bidderWallet.balance,
            reason: reason,
            listingId: listingId.toString(),
            timestamp: new Date()
          });
        }
      }
      
      console.log(`[Auction] Refunded $${amount} to ${username}: ${reason}`);
    } catch (error) {
      console.error(`[Auction] Error refunding bidder ${username}:`, error);
    }
  }
  
  /**
   * Cancel auction and refund highest bidder only
   */
  static async cancelAuction(listingId, cancelledBy) {
    const listing = await Listing.findById(listingId);
    
    if (!listing || !listing.auction || !listing.auction.isAuction) {
      throw new Error('Invalid auction listing');
    }
    
    if (listing.auction.status !== 'active') {
      throw new Error('Auction is not active');
    }
    
    // Refund only the highest bidder if there is one (others were already refunded when outbid)
    const bidAmount = listing.auction.highestBid || listing.auction.currentBid || 0;
    if (listing.auction.highestBidder && bidAmount > 0) {
      await this.refundBidder(
        listing.auction.highestBidder,
        bidAmount,
        listing._id,
        `Auction cancelled: ${listing.title}`
      );
      
      await Notification.create({
        recipient: listing.auction.highestBidder,
        type: 'auction_cancelled',
        title: 'Auction Cancelled',
        message: `The auction for "${listing.title}" was cancelled. Your bid of $${bidAmount} has been refunded.`,
        metadata: { 
          listingId: listing._id,
          amount: bidAmount
        }
      });
    }
    
    // Update listing status
    listing.auction.status = 'cancelled';
    listing.status = 'cancelled';
    listing.isActive = false;
    await listing.save();
    
    // Notify seller
    if (cancelledBy !== listing.seller) {
      await Notification.create({
        recipient: listing.seller,
        type: 'auction_cancelled',
        title: 'Auction Cancelled',
        message: `Your auction "${listing.title}" was cancelled by admin`,
        metadata: { listingId: listing._id }
      });
    }
    
    // Emit WebSocket event
    if (global.webSocketService) {
      global.webSocketService.broadcast('auction:cancelled', {
        listingId: listing._id.toString(),
        title: listing.title,
        cancelledBy: cancelledBy
      });
    }
    
    return { 
      success: true, 
      message: 'Auction cancelled successfully',
      data: {
        listingId: listing._id,
        refunded: listing.auction.highestBidder ? bidAmount : 0
      }
    };
  }
  
  /**
   * PERMANENT FIX: Check and process all expired auctions (called by scheduled job)
   * Now handles stuck auctions and automatic recovery
   */
  static async processExpiredAuctions() {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now - 60000); // 1 minute ago
      
      // CRITICAL FIX: Find expired active auctions OR stuck processing/error auctions
      const expiredAuctions = await Listing.find({
        'auction.isAuction': true,
        $or: [
          // Normal expired auctions
          {
            'auction.status': 'active',
            'auction.endTime': { $lte: now }
          },
          // Stuck processing auctions (older than 1 minute)
          {
            'auction.status': 'processing',
            'auction.endTime': { $lte: oneMinuteAgo }
          },
          // Error state auctions that should be retried
          {
            'auction.status': 'error',
            'auction.endTime': { $lte: now }
          }
        ]
      });
      
      const results = {
        processed: 0,
        noBids: 0,
        reserveNotMet: 0,
        successful: 0,
        errors: []
      };
      
      console.log(`[Auction] Found ${expiredAuctions.length} expired/stuck auctions to process`);
      
      for (const listing of expiredAuctions) {
        try {
          // PERMANENT FIX: Reset stuck auctions before processing
          if (listing.auction.status === 'processing' || listing.auction.status === 'error') {
            console.log(`[Auction] Resetting stuck auction ${listing._id} from status: ${listing.auction.status}`);
            listing.auction.status = 'active';
            await listing.save();
          }
          
          const result = await this.processEndedAuction(listing._id);
          
          // Only count as processed if not already processed
          if (!result.alreadyProcessed) {
            results.processed++;
            
            if (result.message.includes('no valid bids')) {
              results.noBids++;
            } else if (result.message.includes('reserve not met')) {
              results.reserveNotMet++;
            } else {
              results.successful++;
            }
          }
        } catch (error) {
          console.error(`[Auction] Error processing expired auction ${listing._id}:`, error);
          results.errors.push({
            listingId: listing._id,
            title: listing.title,
            error: error.message
          });
        }
      }
      
      if (results.processed > 0) {
        console.log(`[Auction] Processed ${results.processed} expired auctions:`, {
          successful: results.successful,
          noBids: results.noBids,
          reserveNotMet: results.reserveNotMet,
          errors: results.errors.length
        });
      }
      
      return results;
    } catch (error) {
      console.error('[Auction] Error checking expired auctions:', error);
      throw error;
    }
  }
}

module.exports = AuctionSettlementService;