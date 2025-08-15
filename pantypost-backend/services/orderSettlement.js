// pantypost-backend/services/orderSettlement.js
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const tierService = require('./tierService');

class OrderSettlementService {
  /**
   * Process automatic auction completion (called by cron job or scheduler)
   * UPDATED FOR 20% SELLER FEE MODEL
   */
  async processEndedAuctions() {
    try {
      console.log('[OrderSettlement] Checking for ended auctions...');
      
      // Find all active auctions that have ended
      const endedAuctions = await Listing.find({
        'auction.isAuction': true,
        'auction.status': 'active',
        'auction.endTime': { $lte: new Date() }
      });
      
      console.log(`[OrderSettlement] Found ${endedAuctions.length} ended auctions to process`);
      
      for (const listing of endedAuctions) {
        try {
          await this.settleAuction(listing);
        } catch (error) {
          console.error(`[OrderSettlement] Error settling auction ${listing._id}:`, error);
        }
      }
      
      return endedAuctions.length;
    } catch (error) {
      console.error('[OrderSettlement] Error processing ended auctions:', error);
      throw error;
    }
  }
  
  /**
   * Settle a single auction
   * UPDATED FOR 20% SELLER FEE MODEL
   */
  async settleAuction(listing) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Check if auction has bids
      if (!listing.auction.highestBidder || listing.auction.currentBid === 0) {
        // No bids - just mark as ended
        listing.auction.status = 'ended';
        listing.status = 'expired';
        await listing.save({ session });
        
        await session.commitTransaction();
        console.log(`[OrderSettlement] Auction ${listing._id} ended with no bids`);
        
        // Emit WebSocket event
        if (global.webSocketService) {
          global.webSocketService.emitAuctionEnded(listing, null, 0);
        }
        
        return { success: true, message: 'Auction ended with no bids' };
      }
      
      // Check reserve price
      if (listing.auction.reservePrice && listing.auction.currentBid < listing.auction.reservePrice) {
        // Reserve not met - refund highest bidder
        listing.auction.status = 'reserve_not_met';
        listing.status = 'expired';
        await listing.save({ session });
        
        // Refund the highest bidder
        const bidderWallet = await Wallet.findOne({ username: listing.auction.highestBidder }).session(session);
        if (bidderWallet) {
          bidderWallet.balance += listing.auction.currentBid;
          await bidderWallet.save({ session });
          
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
          await refundTransaction.save({ session });
        }
        
        await session.commitTransaction();
        console.log(`[OrderSettlement] Auction ${listing._id} ended - reserve not met`);
        
        // Emit WebSocket event
        if (global.webSocketService) {
          global.webSocketService.emitAuctionEnded(listing, null, listing.auction.currentBid);
        }
        
        return { success: true, message: 'Auction ended - reserve not met' };
      }
      
      // Auction successful - create order
      const winningBid = listing.auction.currentBid;
      const winner = listing.auction.highestBidder;
      
      console.log(`[OrderSettlement] Processing successful auction: ${listing._id}, winner: ${winner}, bid: $${winningBid}`);
      
      // Get or create wallets
      let sellerWallet = await Wallet.findOne({ username: listing.seller }).session(session);
      if (!sellerWallet) {
        const sellerUser = await User.findOne({ username: listing.seller }).session(session);
        sellerWallet = new Wallet({
          username: listing.seller,
          role: sellerUser ? sellerUser.role : 'seller',
          balance: 0
        });
        await sellerWallet.save({ session });
      }
      
      let platformWallet = await Wallet.findOne({ username: 'platform', role: 'admin' }).session(session);
      if (!platformWallet) {
        platformWallet = new Wallet({
          username: 'platform',
          role: 'admin',
          balance: 0
        });
        await platformWallet.save({ session });
      }
      
      // CRITICAL: 20% platform fee from seller for auctions (not 10%)
      const AUCTION_PLATFORM_FEE = 0.20; // 20% for auctions
      const sellerPlatformFee = Math.round(winningBid * AUCTION_PLATFORM_FEE * 100) / 100;
      const sellerEarnings = Math.round((winningBid - sellerPlatformFee) * 100) / 100;
      
      // Create order with auction-specific fee structure
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
        // CRITICAL: Auction-specific fee fields
        platformFee: sellerPlatformFee,
        sellerPlatformFee: sellerPlatformFee,
        buyerMarkupFee: 0, // No buyer fees for auctions
        sellerEarnings: sellerEarnings,
        tierCreditAmount: 0, // No tier bonuses for auctions
        sellerTier: null, // Auctions don't use tier system
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
      
      await order.save({ session });
      
      // Update wallet balances
      sellerWallet.balance += sellerEarnings;
      await sellerWallet.save({ session });
      
      platformWallet.balance += sellerPlatformFee;
      await platformWallet.save({ session });
      
      // Create transaction records
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
      await saleTransaction.save({ session });
      
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
          percentage: 20, // 20% for auctions
          wasAuction: true
        }
      });
      await feeTransaction.save({ session });
      
      // Link transactions to order
      order.paymentTransactionId = saleTransaction._id;
      order.feeTransactionId = feeTransaction._id;
      await order.save({ session });
      
      // Update listing status
      listing.auction.status = 'ended';
      listing.status = 'sold';
      listing.soldAt = new Date();
      await listing.save({ session });
      
      await session.commitTransaction();
      
      console.log(`[OrderSettlement] Auction ${listing._id} settled successfully. Seller receives $${sellerEarnings} (80%), platform receives $${sellerPlatformFee} (20%)`);
      
      // Emit WebSocket events
      if (global.webSocketService) {
        global.webSocketService.emitAuctionEnded(listing, winner, winningBid);
        global.webSocketService.emitListingSold(listing, winner);
        global.webSocketService.emitOrderCreated(order);
        
        // Notify seller about earnings
        global.webSocketService.emitToUser(listing.seller, 'notification:new', {
          id: `notif_${Date.now()}`,
          type: 'auction_won',
          title: 'Auction Ended!',
          body: `Your auction "${listing.title}" sold for $${winningBid}. You'll receive $${sellerEarnings} after the 20% platform fee.`,
          data: { orderId: order._id, auctionId: listing._id },
          read: false,
          createdAt: new Date()
        });
        
        // Notify winner
        global.webSocketService.emitToUser(winner, 'notification:new', {
          id: `notif_${Date.now()}`,
          type: 'auction_won',
          title: 'Congratulations!',
          body: `You won the auction for "${listing.title}" at $${winningBid}!`,
          data: { orderId: order._id, auctionId: listing._id },
          read: false,
          createdAt: new Date()
        });
      }
      
      // Update seller tier (auction sales count towards tier progression)
      await tierService.updateSellerTier(listing.seller);
      
      return {
        success: true,
        message: `Auction settled: ${winner} won at $${winningBid}`,
        order: order
      };
      
    } catch (error) {
      await session.abortTransaction();
      console.error(`[OrderSettlement] Error settling auction ${listing._id}:`, error);
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Check if auction should auto-complete
   */
  shouldAutoComplete(listing) {
    if (!listing.auction || !listing.auction.isAuction) {
      return false;
    }
    
    if (listing.auction.status !== 'active') {
      return false;
    }
    
    const now = new Date();
    const endTime = new Date(listing.auction.endTime);
    
    return now >= endTime;
  }
}

module.exports = new OrderSettlementService();