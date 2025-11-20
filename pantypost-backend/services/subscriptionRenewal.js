// pantypost-backend/services/subscriptionRenewal.js
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const webSocketService = require('../config/websocket');
const { incrementPaymentStats } = require('../utils/paymentStats');

class SubscriptionRenewalService {
  /**
   * Process all subscription renewals that are due
   * Called by the daily cron job
   */
  async processAllRenewals() {
    try {
      console.log('[Subscription Renewal] Starting daily renewal check...');
      
      // Find all subscriptions that are due for renewal
      const dueSubscriptions = await Subscription.find({
        status: 'active',
        autoRenew: true,
        nextBillingDate: { $lte: new Date() }
      });

      console.log(`[Subscription Renewal] Found ${dueSubscriptions.length} subscriptions due for renewal`);

      const results = {
        total: dueSubscriptions.length,
        successful: 0,
        cancelled_insufficient_balance: 0,
        cancelled_price_increased: 0,
        failed: 0,
        errors: []
      };

      for (const subscription of dueSubscriptions) {
        try {
          const result = await this.processSubscriptionRenewal(subscription);
          
          if (result.success) {
            results.successful++;
          } else if (result.reason === 'insufficient_balance') {
            results.cancelled_insufficient_balance++;
          } else if (result.reason === 'price_increased') {
            results.cancelled_price_increased++;
          } else {
            results.failed++;
            results.errors.push({
              subscriptionId: subscription._id,
              error: result.error
            });
          }
        } catch (error) {
          console.error(`[Subscription Renewal] Error processing subscription ${subscription._id}:`, error);
          results.failed++;
          results.errors.push({
            subscriptionId: subscription._id,
            error: error.message
          });
        }
      }

      console.log('[Subscription Renewal] Renewal check completed:', results);

      // Notify admins of results if there were any renewals
      if (results.total > 0) {
        this.notifyAdminsOfResults(results);
      }

      return results;
    } catch (error) {
      console.error('[Subscription Renewal] Critical error in processAllRenewals:', error);
      throw error;
    }
  }

  /**
   * Process a single subscription renewal
   * Handles all the business logic for checking balance and price changes
   */
  async processSubscriptionRenewal(subscription) {
    try {
      const buyer = subscription.subscriber;
      const seller = subscription.creator;
      const originalPrice = subscription.price;

      console.log(`[Subscription Renewal] Processing subscription: ${buyer} -> ${seller} ($${originalPrice})`);

      // Get the current subscription price from the seller's profile
      const sellerUser = await User.findOne({ username: seller });
      if (!sellerUser) {
        console.error(`[Subscription Renewal] Seller ${seller} not found`);
        return { 
          success: false, 
          reason: 'seller_not_found',
          error: 'Seller not found' 
        };
      }

      const currentPrice = sellerUser.subscriptionPrice || 9.99;

      // Check if price increased - if so, cancel the subscription
      if (currentPrice > originalPrice) {
        console.log(`[Subscription Renewal] Price increased from $${originalPrice} to $${currentPrice} - cancelling subscription`);
        
        await subscription.cancel('Subscription price increased');
        
        // Notify buyer that subscription was cancelled due to price increase
        await this.notifyBuyerPriceIncrease(buyer, seller, originalPrice, currentPrice);
        
        // Notify seller that a subscription was cancelled due to price increase
        await this.notifySellerPriceIncreaseCancellation(seller, buyer, originalPrice, currentPrice);
        
        // Emit WebSocket event
        if (global.webSocketService) {
          global.webSocketService.emitSubscriptionCancelled(
            { 
              id: subscription._id, 
              subscriber: buyer, 
              creator: seller 
            },
            'price_increased'
          );
        }

        return { 
          success: false, 
          reason: 'price_increased',
          cancelled: true 
        };
      }

      // Update subscription price if it decreased
      if (currentPrice < originalPrice) {
        console.log(`[Subscription Renewal] Price decreased from $${originalPrice} to $${currentPrice} - updating subscription`);
        subscription.price = currentPrice;
        subscription.platformFee = Math.round(currentPrice * 0.25 * 100) / 100;
        subscription.creatorEarnings = Math.round((currentPrice - subscription.platformFee) * 100) / 100;
      }

      const renewalPrice = currentPrice;

      // Check buyer's wallet balance
      const buyerWallet = await Wallet.findOne({ username: buyer });
      if (!buyerWallet) {
        console.error(`[Subscription Renewal] Buyer wallet not found for ${buyer}`);
        await subscription.handleFailedPayment();
        return { 
          success: false, 
          reason: 'wallet_not_found',
          error: 'Buyer wallet not found' 
        };
      }

      // Check if buyer has sufficient balance
      if (!buyerWallet.hasBalance(renewalPrice)) {
        console.log(`[Subscription Renewal] Insufficient balance for ${buyer} - has $${buyerWallet.balance}, needs $${renewalPrice}`);
        
        await subscription.cancel('Insufficient balance for renewal');
        
        // Notify buyer that subscription was cancelled due to insufficient balance
        await this.notifyBuyerInsufficientBalance(buyer, seller, renewalPrice, buyerWallet.balance);
        
        // Emit WebSocket event
        if (global.webSocketService) {
          global.webSocketService.emitSubscriptionCancelled(
            { 
              id: subscription._id, 
              subscriber: buyer, 
              creator: seller 
            },
            'insufficient_balance'
          );
        }

        return { 
          success: false, 
          reason: 'insufficient_balance',
          cancelled: true 
        };
      }

      // Process the renewal payment
      const sellerWallet = await Wallet.findOne({ username: seller });
      if (!sellerWallet) {
        console.error(`[Subscription Renewal] Seller wallet not found for ${seller}`);
        await subscription.handleFailedPayment();
        return { 
          success: false, 
          reason: 'seller_wallet_not_found',
          error: 'Seller wallet not found' 
        };
      }

      let adminWallet = await Wallet.findOne({ username: 'platform', role: 'admin' });
      if (!adminWallet) {
        adminWallet = new Wallet({ username: 'platform', role: 'admin', balance: 0 });
        await adminWallet.save();
      }

      // Calculate fees
      const platformFee = Math.round(renewalPrice * 0.25 * 100) / 100; // 25%
      const creatorEarnings = Math.round((renewalPrice - platformFee) * 100) / 100; // 75%

      // Store balances before transaction
      const buyerPrevBalance = buyerWallet.balance;
      const sellerPrevBalance = sellerWallet.balance;
      const adminPrevBalance = adminWallet.balance;

      // Process the payment
      await buyerWallet.withdraw(renewalPrice);
      await sellerWallet.deposit(creatorEarnings);
      await adminWallet.deposit(platformFee);

      // Create transaction records
      const paymentTransaction = new Transaction({
        type: 'subscription',
        amount: renewalPrice,
        from: buyer,
        to: seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Monthly subscription renewal to ${seller}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          subscriptionId: subscription._id.toString(),
          renewal: true,
          platformFee: platformFee,
          creatorEarnings: creatorEarnings,
          originalPrice: originalPrice,
          renewalPrice: renewalPrice
        }
      });
      await paymentTransaction.save();

      const feeTransaction = new Transaction({
        type: 'platform_fee',
        amount: platformFee,
        from: buyer,
        to: 'platform',
        fromRole: 'buyer',
        toRole: 'admin',
        description: `Platform fee (25%) for renewal to ${seller}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          subscriptionId: subscription._id.toString(),
          percentage: 25,
          renewal: true,
          originalAmount: renewalPrice
        }
      });
      await feeTransaction.save();

      // Update subscription with new billing date
      await subscription.processRenewal();

      // Update subscription price and fees if price changed
      if (renewalPrice !== originalPrice) {
        subscription.price = renewalPrice;
        subscription.platformFee = platformFee;
        subscription.creatorEarnings = creatorEarnings;
        await subscription.save();
      }

      // Notify buyer and seller
      await this.notifyRenewalSuccess(buyer, seller, renewalPrice);

      // Emit WebSocket events
      if (global.webSocketService) {
        global.webSocketService.emitBalanceUpdate(
          buyer, 
          'buyer', 
          buyerPrevBalance, 
          buyerWallet.balance, 
          'subscription_renewal'
        );
        global.webSocketService.emitBalanceUpdate(
          seller, 
          'seller', 
          sellerPrevBalance, 
          sellerWallet.balance, 
          'subscription_renewal'
        );
        global.webSocketService.emitBalanceUpdate(
          'platform', 
          'admin', 
          adminPrevBalance, 
          adminWallet.balance, 
          'platform_fee'
        );
        global.webSocketService.emitTransaction(paymentTransaction);
        global.webSocketService.emitTransaction(feeTransaction);
      }

      // Update payment stats
      try {
        await incrementPaymentStats(renewalPrice);
      } catch (statsError) {
        console.error('[Subscription Renewal] Failed to increment payment stats:', statsError);
      }

      console.log(`[Subscription Renewal] Successfully renewed subscription: ${buyer} -> ${seller} ($${renewalPrice})`);

      return { 
        success: true, 
        renewed: true,
        amount: renewalPrice 
      };

    } catch (error) {
      console.error(`[Subscription Renewal] Error processing subscription ${subscription._id}:`, error);
      await subscription.handleFailedPayment();
      
      // Cancel if too many failures
      if (subscription.status === 'cancelled') {
        if (global.webSocketService) {
          global.webSocketService.emitSubscriptionCancelled(
            { 
              id: subscription._id, 
              subscriber: subscription.subscriber, 
              creator: subscription.creator 
            },
            'failed_payment'
          );
        }
      }
      
      return { 
        success: false, 
        reason: 'payment_error',
        error: error.message 
      };
    }
  }

  /**
   * Notify buyer that subscription was cancelled due to insufficient balance
   */
  async notifyBuyerInsufficientBalance(buyer, seller, requiredAmount, currentBalance) {
    try {
      const notification = new Notification({
        recipient: buyer,
        type: 'subscription_cancelled',
        title: 'Subscription Cancelled',
        message: `Your subscription to ${seller} was cancelled due to insufficient balance. Required: $${requiredAmount.toFixed(2)}, Available: $${currentBalance.toFixed(2)}. Please add funds to resubscribe.`,
        link: `/sellers/${seller}`,
        priority: 'high'
      });
      await notification.save();

      if (global.webSocketService) {
        global.webSocketService.sendToUser(buyer, {
          type: 'notification',
          data: notification
        });
      }
    } catch (error) {
      console.error('[Subscription Renewal] Error notifying buyer of insufficient balance:', error);
    }
  }

  /**
   * Notify buyer that subscription was cancelled due to price increase
   */
  async notifyBuyerPriceIncrease(buyer, seller, oldPrice, newPrice) {
    try {
      const notification = new Notification({
        recipient: buyer,
        type: 'subscription_cancelled',
        title: 'Subscription Cancelled - Price Increased',
        message: `Your subscription to ${seller} was cancelled because the price increased from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}. Visit their profile to resubscribe at the new price.`,
        link: `/sellers/${seller}`,
        priority: 'medium'
      });
      await notification.save();

      if (global.webSocketService) {
        global.webSocketService.sendToUser(buyer, {
          type: 'notification',
          data: notification
        });
      }
    } catch (error) {
      console.error('[Subscription Renewal] Error notifying buyer of price increase:', error);
    }
  }

  /**
   * Notify seller that a subscription was cancelled due to price increase
   */
  async notifySellerPriceIncreaseCancellation(seller, buyer, oldPrice, newPrice) {
    try {
      const notification = new Notification({
        recipient: seller,
        type: 'subscription_info',
        title: 'Subscription Cancelled',
        message: `${buyer}'s subscription was cancelled because you increased your subscription price from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}. They can resubscribe at the new price.`,
        link: `/sellers/subscribers`,
        priority: 'low'
      });
      await notification.save();

      if (global.webSocketService) {
        global.webSocketService.sendToUser(seller, {
          type: 'notification',
          data: notification
        });
      }
    } catch (error) {
      console.error('[Subscription Renewal] Error notifying seller of price increase cancellation:', error);
    }
  }

  /**
   * Notify buyer and seller of successful renewal
   */
  async notifyRenewalSuccess(buyer, seller, amount) {
    try {
      // Notify buyer
      const buyerNotification = new Notification({
        recipient: buyer,
        type: 'subscription_renewed',
        title: 'Subscription Renewed',
        message: `Your subscription to ${seller} has been renewed for $${amount.toFixed(2)}.`,
        link: `/sellers/${seller}`,
        priority: 'low'
      });
      await buyerNotification.save();

      // Notify seller
      const sellerNotification = new Notification({
        recipient: seller,
        type: 'subscription_renewed',
        title: 'Subscription Renewed',
        message: `${buyer}'s subscription has been renewed for $${amount.toFixed(2)}.`,
        link: `/sellers/subscribers`,
        priority: 'low'
      });
      await sellerNotification.save();

      if (global.webSocketService) {
        global.webSocketService.sendToUser(buyer, {
          type: 'notification',
          data: buyerNotification
        });
        global.webSocketService.sendToUser(seller, {
          type: 'notification',
          data: sellerNotification
        });
      }
    } catch (error) {
      console.error('[Subscription Renewal] Error notifying renewal success:', error);
    }
  }

  /**
   * Notify admins of renewal results
   */
  async notifyAdminsOfResults(results) {
    try {
      if (results.total === 0) return;

      const admins = await User.find({ role: 'admin' }).select('username');
      
      const message = `Subscription renewals processed: ${results.successful} successful, ${results.cancelled_insufficient_balance} cancelled (insufficient balance), ${results.cancelled_price_increased} cancelled (price increased), ${results.failed} failed.`;

      for (const admin of admins) {
        const notification = new Notification({
          recipient: admin.username,
          type: 'admin_alert',
          title: 'Daily Subscription Renewals',
          message: message,
          priority: results.failed > 0 ? 'medium' : 'low'
        });
        await notification.save();

        if (global.webSocketService) {
          global.webSocketService.sendToUser(admin.username, {
            type: 'notification',
            data: notification
          });
        }
      }
    } catch (error) {
      console.error('[Subscription Renewal] Error notifying admins:', error);
    }
  }
}

module.exports = new SubscriptionRenewalService();