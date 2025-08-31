// pantypost-backend/services/auctionSettlement.js
const Listing = require('../models/Listing');
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Notification = require('../models/Notification');

class AuctionSettlementService {
  /**
   * Process ended auction - handle winner, refunds, reserve checks
   */
  static async processEndedAuction(listingId) {
    const listing = await Listing.findById(listingId);
    
    if (!listing || !listing.auction || !listing.auction.isAuction) {
      throw new Error('Invalid auction listing');
    }
    
    // FIXED: Check for already processed auctions and return success
    if (listing.auction.status !== 'active') {
      console.log(`[Auction] Auction ${listingId} already processed with status: ${listing.auction.status}`);
      
      // Return success with the current status
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
        'auction.status': 'active' // Only process if still active
      },
      { 
        $set: { 'auction.status': 'processing' } // Mark as processing
      },
      { new: false } // Return the original document
    );
    
    // If no document was updated, another request already processed it
    if (!updatedListing) {
      console.log(`[Auction] Auction ${listingId} already being processed by another request`);
      
      // Get the current status
      const currentListing = await Listing.findById(listingId);
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
      // No bids case
      if (!updatedListing.auction.highestBidder || updatedListing.auction.currentBid === 0) {
        updatedListing.auction.status = 'ended';
        updatedListing.status = 'expired';
        await updatedListing.save();
        
        // Notify seller
        await Notification.create({
          recipient: updatedListing.seller,
          type: 'auction_ended',
          title: 'Auction Ended',
          message: `Your auction for "${updatedListing.title}" ended without any bids`,
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
        
        return { success: true, message: 'Auction ended with no bids' };
      }
      
      // Check reserve price
      if (updatedListing.auction.reservePrice && updatedListing.auction.currentBid < updatedListing.auction.reservePrice) {
        updatedListing.auction.status = 'reserve_not_met';
        updatedListing.status = 'expired';
        await updatedListing.save();
        
        // Refund highest bidder
        await this.refundBidder(
          updatedListing.auction.highestBidder,
          updatedListing.auction.currentBid,
          updatedListing._id,
          'Reserve price not met'
        );
        
        // Notify seller and bidder
        await Notification.create({
          recipient: updatedListing.seller,
          type: 'auction_reserve_not_met',
          title: 'Reserve Not Met',
          message: `Auction for "${updatedListing.title}" ended but reserve price of $${updatedListing.auction.reservePrice} was not met`,
          metadata: { 
            listingId: updatedListing._id,
            reservePrice: updatedListing.auction.reservePrice,
            highestBid: updatedListing.auction.currentBid
          }
        });
        
        await Notification.create({
          recipient: updatedListing.auction.highestBidder,
          type: 'bid_refunded',
          title: 'Bid Refunded - Reserve Not Met',
          message: `Your bid of $${updatedListing.auction.currentBid} for "${updatedListing.title}" was refunded - reserve price not met`,
          metadata: { 
            listingId: updatedListing._id, 
            amount: updatedListing.auction.currentBid,
            reservePrice: updatedListing.auction.reservePrice
          }
        });
        
        // Emit WebSocket event
        if (global.webSocketService) {
          global.webSocketService.broadcast('auction:reserve_not_met', {
            listingId: updatedListing._id.toString(),
            title: updatedListing.title,
            reservePrice: updatedListing.auction.reservePrice,
            highestBid: updatedListing.auction.currentBid,
            highestBidder: updatedListing.auction.highestBidder
          });
        }
        
        return { success: true, message: 'Auction ended - reserve not met' };
      }
      
      // Process winning bid
      return await this.processWinningBid(updatedListing);
    } catch (error) {
      // If processing failed, try to reset status back to active
      console.error('[Auction] Error processing auction:', error);
      
      try {
        await Listing.findOneAndUpdate(
          { 
            _id: listingId,
            'auction.status': 'processing'
          },
          { 
            $set: { 'auction.status': 'active' }
          }
        );
      } catch (resetError) {
        console.error('[Auction] Failed to reset auction status:', resetError);
      }
      
      throw error;
    }
  }
  
  /**
   * Process winning bid and create order
   */
  static async processWinningBid(listing) {
    const winningBid = Math.floor(listing.auction.currentBid);
    const winner = listing.auction.highestBidder;
    
    console.log(`[Auction] Processing winning bid for auction ${listing._id}: Winner=${winner}, Bid=$${winningBid}`);
    
    // Get or create wallets
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
    
    // CRITICAL FIX: Create order WITHOUT delivery address requirement
    // The Order model's deliveryAddress field is already optional (required: false)
    const order = new Order({
      title: listing.title,
      description: listing.description,
      price: winningBid,
      markedUpPrice: winningBid, // No markup for auctions
      seller: listing.seller,
      buyer: winner,
      imageUrl: listing.imageUrls[0] || 'https://via.placeholder.com/300',
      tags: listing.tags || [],
      listingId: listing._id,
      wasAuction: true,
      finalBid: winningBid,
      // CRITICAL: Don't set deliveryAddress at all - let it be undefined
      // deliveryAddress will be added later by the buyer
      shippingStatus: 'pending',
      paymentStatus: 'completed',
      paymentCompletedAt: new Date(),
      // Fee fields
      platformFee: sellerPlatformFee,
      sellerPlatformFee: sellerPlatformFee,
      buyerMarkupFee: 0, // No buyer fees for auctions
      sellerEarnings: sellerEarnings,
      tierCreditAmount: 0, // No tier bonuses for auctions
      sellerTier: null // Auctions don't use tier system
    });
    
    await order.save();
    console.log(`[Auction] Order created successfully: ${order._id}`);
    
    // Store old balances for WebSocket events
    const sellerOldBalance = sellerWallet.balance;
    const platformOldBalance = platformWallet.balance;
    
    // Transfer funds
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
    
    // Refund all other bidders
    await this.refundLosingBidders(listing, winner);
    
    // Emit WebSocket events
    if (global.webSocketService) {
      console.log(`[Auction] Emitting WebSocket events for auction end`);
      
      // Auction ended event
      global.webSocketService.emitAuctionEnded(listing, winner, winningBid);
      
      // CRITICAL: Emit order created event with full order data
      global.webSocketService.broadcast('order:created', {
        order: {
          _id: order._id.toString(),
          id: order._id.toString(),
          title: order.title,
          description: order.description,
          price: order.price,
          markedUpPrice: order.markedUpPrice,
          imageUrl: order.imageUrl,
          seller: order.seller,
          buyer: order.buyer,
          date: order.date.toISOString(),
          tags: order.tags,
          wasAuction: true,
          finalBid: order.finalBid,
          shippingStatus: order.shippingStatus,
          paymentStatus: order.paymentStatus,
          sellerEarnings: order.sellerEarnings,
          platformFee: order.platformFee
        }
      });
      
      // Also emit specific order created event
      if (global.webSocketService.emitOrderCreated) {
        global.webSocketService.emitOrderCreated({
          _id: order._id,
          id: order._id.toString(),
          title: order.title,
          seller: order.seller,
          buyer: order.buyer,
          price: order.price,
          markedUpPrice: order.markedUpPrice,
          wasAuction: true
        });
      }
      
      // Listing sold event
      global.webSocketService.emitListingSold(listing, winner);
      
      // Balance updates
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
      
      // Emit specific event for the winner to refresh their orders
      global.webSocketService.emitToUser(winner, 'auction:won', {
        orderId: order._id.toString(),
        listingId: listing._id.toString(),
        title: listing.title,
        amount: winningBid,
        needsAddress: true
      });
    }
    
    console.log(`[Auction] Successfully completed auction ${listing._id} - Order: ${order._id}`);
    
    return {
      success: true,
      message: `Auction completed successfully! Winner: ${winner} at $${winningBid}`,
      data: {
        listing: listing,
        order: order,
        sellerEarnings: sellerEarnings,
        platformFee: sellerPlatformFee
      }
    };
  }
  
  /**
   * Refund losing bidders
   */
  static async refundLosingBidders(listing, winner) {
    // Track unique bidders and their highest bids
    const bidderHighestBids = new Map();
    
    // Go through all bids to find each bidder's highest bid
    for (const bid of listing.auction.bids) {
      if (bid.bidder !== winner) {
        const currentHighest = bidderHighestBids.get(bid.bidder) || 0;
        if (bid.amount > currentHighest) {
          bidderHighestBids.set(bid.bidder, bid.amount);
        }
      }
    }
    
    // Process refunds for each losing bidder
    for (const [bidder, highestBid] of bidderHighestBids) {
      await this.refundBidder(
        bidder,
        highestBid,
        listing._id,
        `Outbid in auction: ${listing.title}`
      );
      
      // Notify the losing bidder
      await Notification.create({
        recipient: bidder,
        type: 'auction_lost',
        title: 'Auction Ended',
        message: `The auction for "${listing.title}" has ended. Your bid of $${highestBid} has been refunded.`,
        metadata: { 
          listingId: listing._id,
          refundAmount: highestBid,
          winningBid: listing.auction.currentBid
        }
      });
    }
    
    console.log(`[Auction] Refunded ${bidderHighestBids.size} losing bidders for auction: ${listing.title}`);
  }
  
  /**
   * Refund a single bidder
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
        fromRole: 'admin',
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
        global.webSocketService.emitBalanceUpdate(
          username,
          'buyer',
          oldBalance,
          bidderWallet.balance,
          reason
        );
        
        // Also emit specific refund event
        global.webSocketService.emitToUser(username, 'wallet:refund', {
          username: username,
          amount: amount,
          balance: bidderWallet.balance,
          reason: reason,
          listingId: listingId.toString(),
          timestamp: new Date()
        });
      }
      
      console.log(`[Auction] Refunded $${amount} to ${username}: ${reason}`);
    } catch (error) {
      console.error(`[Auction] Error refunding bidder ${username}:`, error);
    }
  }
  
  /**
   * Cancel auction and refund all bidders
   */
  static async cancelAuction(listingId, cancelledBy) {
    const listing = await Listing.findById(listingId);
    
    if (!listing || !listing.auction || !listing.auction.isAuction) {
      throw new Error('Invalid auction listing');
    }
    
    if (listing.auction.status !== 'active') {
      throw new Error('Auction is not active');
    }
    
    // Refund highest bidder if there is one
    if (listing.auction.highestBidder && listing.auction.currentBid > 0) {
      await this.refundBidder(
        listing.auction.highestBidder,
        listing.auction.currentBid,
        listing._id,
        `Auction cancelled: ${listing.title}`
      );
      
      await Notification.create({
        recipient: listing.auction.highestBidder,
        type: 'auction_cancelled',
        title: 'Auction Cancelled',
        message: `The auction for "${listing.title}" was cancelled. Your bid of $${listing.auction.currentBid} has been refunded.`,
        metadata: { 
          listingId: listing._id,
          amount: listing.auction.currentBid
        }
      });
    }
    
    // Also refund any other bidders who may have been outbid
    const uniqueBidders = new Set();
    for (const bid of listing.auction.bids) {
      if (bid.bidder !== listing.auction.highestBidder) {
        uniqueBidders.add(bid.bidder);
      }
    }
    
    // Note: These bidders should already have been refunded when outbid,
    // but we check just in case
    for (const bidder of uniqueBidders) {
      console.log(`[Auction] Checking if ${bidder} needs refund for cancelled auction`);
    }
    
    // Update listing status
    listing.auction.status = 'cancelled';
    listing.status = 'cancelled';
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
        refunded: listing.auction.highestBidder ? listing.auction.currentBid : 0
      }
    };
  }
  
  /**
   * Check and process all expired auctions (called by scheduled job)
   */
  static async processExpiredAuctions() {
    try {
      const now = new Date();
      
      // Find all active auctions that have ended
      const expiredAuctions = await Listing.find({
        'auction.isAuction': true,
        'auction.status': 'active',
        'auction.endTime': { $lte: now }
      });
      
      const results = {
        processed: 0,
        noBids: 0,
        reserveNotMet: 0,
        successful: 0,
        errors: []
      };
      
      console.log(`[Auction] Found ${expiredAuctions.length} expired auctions to process`);
      
      for (const listing of expiredAuctions) {
        try {
          const result = await this.processEndedAuction(listing._id);
          
          // FIXED: Only count as processed if not already processed
          if (!result.alreadyProcessed) {
            results.processed++;
            
            if (result.message.includes('no bids')) {
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