// pantypost-backend/routes/order.routes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');
// CRITICAL FIX: Import Referral correctly from the module that exports both Referral and ReferralCommission
const { Referral, ReferralCommission } = require('../models/Referral');
const { incrementPaymentStats } = require('../utils/paymentStats');
const authMiddleware = require('../middleware/auth.middleware');
const tierService = require('../services/tierService');
const TIER_CONFIG = require('../config/tierConfig');

// ============= HELPER FUNCTIONS =============

/** Normalize strings to reduce accidental whitespace/casing noise */
function normalizeString(val) {
  if (typeof val !== 'string') return '';
  return val.trim();
}

/** Detect the frontend demo/placeholder address so we don't treat it as "provided" */
function isPlaceholderAddress(addr) {
  if (!addr) return false;
  const fullName = normalizeString(addr.fullName).toLowerCase();
  const addr1 = normalizeString(addr.addressLine1).toLowerCase();
  const city = normalizeString(addr.city).toLowerCase();
  const state = normalizeString(addr.state).toLowerCase();
  const postal = normalizeString(addr.postalCode).toLowerCase();
  const country = normalizeString(addr.country).toLowerCase();

  const looksLikeDemo =
    fullName === 'john doe' &&
    addr1 === '123 main st' &&
    city === 'new york' &&
    state === 'ny' &&
    postal === '10001' &&
    (country === 'us' || country === 'usa' || country === 'united states');

  return looksLikeDemo;
}

/** Return a sanitized address for responses, or undefined if it's a placeholder */
function formatDeliveryAddressForResponse(addr) {
  if (!addr) return undefined;
  if (isPlaceholderAddress(addr)) return undefined;

  return {
    fullName: normalizeString(addr.fullName),
    addressLine1: normalizeString(addr.addressLine1),
    addressLine2: addr.addressLine2 ? normalizeString(addr.addressLine2) : undefined,
    city: normalizeString(addr.city),
    state: normalizeString(addr.state),
    postalCode: normalizeString(addr.postalCode),
    country: normalizeString(addr.country),
    phone: addr.phone ? normalizeString(addr.phone) : undefined,
    specialInstructions: addr.specialInstructions ? normalizeString(addr.specialInstructions) : undefined,
  };
}

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
    console.error('[Order] Error checking subscription:', error);
    return false;
  }
}

// POST /api/orders - Create new order with proper fee tracking and TIER SUPPORT
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      markedUpPrice,
      seller,
      buyer,
      tags,
      wasAuction,
      imageUrl,
      listingId,
      deliveryAddress,
      isPremium // NEW: Add premium flag from frontend
    } = req.body;

    console.log('[Order] Creating order with tier support:', {
      title,
      buyer,
      seller,
      price,
      markedUpPrice,
      listingId,
      isPremium
    });

    // Validate buyer is the authenticated user
    if (buyer !== req.user.username) {
      return res.status(403).json({
        success: false,
        error: 'You can only create orders for yourself'
      });
    }

    // Validate required fields (deliveryAddress is NOW OPTIONAL)
    if (!title || !description || !price || !seller || !buyer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // PREMIUM CHECK
    if (isPremium) {
      const isSubscribed = await isUserSubscribedToSeller(buyer, seller);
      if (!isSubscribed) {
        return res.status(403).json({
          success: false,
          error: 'You must be subscribed to this seller to purchase premium content',
          requiresSubscription: true,
          seller: seller
        });
      }
    }

    // Get seller's current tier
    const sellerUser = await User.findOne({ username: seller });
    if (!sellerUser) {
      return res.status(404).json({
        success: false,
        error: 'Seller not found'
      });
    }
    
    const sellerTier = sellerUser.tier || 'Tease';
    const tierInfo = TIER_CONFIG.getTierByName(sellerTier);

    const actualPrice = Number(price) || 0;
    const actualMarkedUpPrice = Number(markedUpPrice) || Math.round(actualPrice * 1.1 * 100) / 100;

    // CRITICAL FIX: Check for referral BEFORE calculating earnings
    const activeReferral = await Referral.findActiveReferral(seller);
    const hasReferral = activeReferral && activeReferral.isActive;
    const referralCommissionRate = hasReferral ? activeReferral.commissionRate : 0;

    // Calculate fees and commission based on BASE PRICE
    const platformFee = TIER_CONFIG.calculatePlatformFee(actualPrice, sellerTier);
    const tierBonus = Math.round((actualPrice * tierInfo.bonusPercentage) * 100) / 100;
    const buyerMarkupFee = Math.round((actualMarkedUpPrice - actualPrice) * 100) / 100;
    const totalPlatformRevenue = Math.round((platformFee + buyerMarkupFee) * 100) / 100;

    // FIXED: Calculate referral commission from BASE PRICE, not from earnings
    let referralCommission = 0;
    if (hasReferral) {
      // 5% of the BASE PRICE, not of seller's earnings
      referralCommission = Math.round(actualPrice * referralCommissionRate * 100) / 100;
      console.log(`[Order] Referral detected - Commission: $${referralCommission} (${(referralCommissionRate * 100)}% of $${actualPrice}) to ${activeReferral.referrer}`);
    }

    // Calculate seller earnings: base price - platform fee - referral commission + tier bonus
    let baseSellerEarnings = actualPrice - platformFee;
    let sellerEarnings = Math.round((baseSellerEarnings - referralCommission + tierBonus) * 100) / 100;

    console.log(`[Order] Payment breakdown:`, {
      basePrice: actualPrice,
      buyerPays: actualMarkedUpPrice,
      platformFee: platformFee,
      tierBonus: tierBonus,
      referralCommission: referralCommission,
      sellerEarnings: sellerEarnings,
      totalPlatformRevenue: totalPlatformRevenue
    });

    const buyerWallet = await Wallet.findOne({ username: buyer });
    if (!buyerWallet) {
      return res.status(404).json({
        success: false,
        error: 'Buyer wallet not found. Please deposit funds first.'
      });
    }

    const balanceInCents = Math.round(buyerWallet.balance * 100);
    const priceInCents = Math.round(actualMarkedUpPrice * 100);
    if (balanceInCents < priceInCents) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You need $${(priceInCents/100).toFixed(2)} but only have $${(balanceInCents/100).toFixed(2)}`
      });
    }

    let sellerWallet = await Wallet.findOne({ username: seller });
    if (!sellerWallet) {
      sellerWallet = new Wallet({ username: seller, role: 'seller', balance: 0 });
      await sellerWallet.save();
    }

    let platformWallet = await Wallet.findOne({ username: 'platform', role: 'admin' });
    if (!platformWallet) {
      platformWallet = new Wallet({ username: 'platform', role: 'admin', balance: 0 });
      await platformWallet.save();
    }

    // Get referrer wallet if needed
    let referrerWallet = null;
    if (hasReferral && referralCommission > 0) {
      referrerWallet = await Wallet.findOne({ username: activeReferral.referrer });
      if (!referrerWallet) {
        const referrerUser = await User.findOne({ username: activeReferral.referrer });
        if (referrerUser) {
          referrerWallet = new Wallet({ 
            username: activeReferral.referrer, 
            role: referrerUser.role, 
            balance: 0 
          });
          await referrerWallet.save();
        }
      }
    }

    const previousBuyerBalance = buyerWallet.balance;
    const previousSellerBalance = sellerWallet.balance;
    const previousPlatformBalance = platformWallet.balance;
    const previousReferrerBalance = referrerWallet ? referrerWallet.balance : 0;

    try {
      // Process the transaction
      await buyerWallet.withdraw(actualMarkedUpPrice);
      await sellerWallet.deposit(sellerEarnings);
      
      // Process referral commission if applicable
      if (hasReferral && referrerWallet && referralCommission > 0) {
        await referrerWallet.deposit(referralCommission);
        console.log(`[Order] Deposited $${referralCommission} to referrer ${activeReferral.referrer}`);
      }
      
      // FIXED: Deposit the full totalPlatformRevenue without subtracting tierBonus
      // The tier bonus was already deducted from seller earnings, so don't deduct it again
      await platformWallet.deposit(totalPlatformRevenue);

      if (listingId) {
        const listing = await Listing.findById(listingId);
        if (listing) {
          listing.status = 'sold';
          listing.soldAt = new Date();
          listing.soldTo = buyer;
          await listing.save();

          if (global.webSocketService) {
            if (global.webSocketService.emitListingSold) {
              global.webSocketService.emitListingSold({
                _id: listing._id,
                id: listing._id.toString(),
                title: listing.title,
                seller: listing.seller,
                buyer: buyer,
                status: 'sold'
              });
            }
            if (global.webSocketService.io && global.webSocketService.io.emit) {
              global.webSocketService.io.emit('listing:sold', {
                listingId: listing._id.toString(),
                seller: listing.seller,
                buyer: buyer
              });
            }
          }
        }
      }

      const order = new Order({
        title,
        description,
        price: actualPrice,
        markedUpPrice: actualMarkedUpPrice,
        imageUrl: imageUrl || '',
        date: new Date(),
        seller,
        buyer,
        tags: tags || [],
        listingId,
        wasAuction: wasAuction || false,
        deliveryAddress: formatDeliveryAddressForResponse(deliveryAddress),
        shippingStatus: 'pending',
        paymentStatus: 'completed',
        paymentCompletedAt: new Date(),
        platformFee: platformFee,
        buyerMarkupFee,
        sellerPlatformFee: platformFee,
        sellerEarnings,
        tierCreditAmount: tierBonus,
        sellerTier,
        // Add referral fields
        referralCommission: referralCommission,
        referrer: hasReferral ? activeReferral.referrer : undefined,
        adjustedSellerEarnings: sellerEarnings
      });

      await order.save();

      // Process referral commission recording
      if (hasReferral && referralCommission > 0) {
        try {
          // Record the commission in the Referral model
          await activeReferral.recordCommission(referralCommission, order._id.toString());
          
          // Create commission transaction for tracking
          const commissionTransaction = new Transaction({
            type: 'sale', // Use 'sale' type as 'referral_commission' might not be in enum
            amount: referralCommission,
            from: seller,
            to: activeReferral.referrer,
            fromRole: 'seller',
            toRole: 'seller',
            description: `Referral commission (5%) for sale: ${order.title}`,
            status: 'completed',
            completedAt: new Date(),
            metadata: {
              orderId: order._id.toString(),
              orderTitle: order.title,
              referralId: activeReferral._id.toString(),
              commissionRate: referralCommissionRate,
              originalPrice: actualPrice,
              adjustedSellerEarnings: sellerEarnings,
              buyer: buyer,
              seller: seller,
              isReferralCommission: true
            }
          });
          await commissionTransaction.save();
          
          // Update referrer's User stats
          await User.findOneAndUpdate(
            { username: activeReferral.referrer },
            {
              $inc: {
                referralEarnings: referralCommission
              }
            }
          );
          
          // Create notification for referrer
          const referrerNotification = new Notification({
            recipient: activeReferral.referrer,
            type: 'sale', // Use 'sale' type as 'referral_commission' might not be in enum
            title: '💰 Referral Commission Earned!',
            message: `You earned $${referralCommission.toFixed(2)} from ${seller}'s sale of "${order.title}"`,
            link: '/sellers/profile',
            priority: 'normal',
            metadata: {
              amount: referralCommission,
              seller: seller,
              orderId: order._id.toString(),
              orderTitle: order.title,
              isReferralCommission: true
            }
          });
          await referrerNotification.save();
          
          // WebSocket notification for referrer
          if (global.webSocketService) {
            global.webSocketService.emitToUser(activeReferral.referrer, 'notification:new', {
              id: referrerNotification._id,
              type: referrerNotification.type,
              title: referrerNotification.title,
              message: referrerNotification.message,
              link: referrerNotification.link,
              createdAt: referrerNotification.createdAt
            });
            
            // Emit balance update for referrer
            global.webSocketService.emitBalanceUpdate(
              activeReferral.referrer, 
              'seller', 
              previousReferrerBalance, 
              referrerWallet.balance, 
              'referral_commission'
            );
            
            // Emit the commission transaction
            global.webSocketService.emitTransaction(commissionTransaction.toObject());
          }
          
          console.log(`[Order] Referral commission processed successfully: ${activeReferral.referrer} earned $${referralCommission}`);
        } catch (referralError) {
          console.error('[Order] Error recording referral commission:', referralError);
          // Don't fail the order, commission was already transferred
        }
      }

      // CRITICAL: Create the sale notification ONCE using the standardized method
      await Notification.createSaleNotification(seller, buyer, { 
        _id: order._id, 
        title: order.title 
      }, actualMarkedUpPrice);

      const purchaseTransaction = new Transaction({
        type: 'purchase',
        amount: actualMarkedUpPrice,
        from: buyer,
        to: seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Purchase: ${title} (${sellerTier} tier)`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: order._id.toString(),
          listingId,
          listingTitle: title,
          originalPrice: actualPrice,
          buyerPayment: actualMarkedUpPrice,
          sellerEarnings,
          seller,
          buyer,
          sellerTier,
          tierBonus,
          isPremium,
          hasReferral,
          referralCommission
        }
      });
      await purchaseTransaction.save();

      const feeTransaction = new Transaction({
        type: 'platform_fee',
        amount: totalPlatformRevenue,
        from: buyer,
        to: 'platform',
        fromRole: 'buyer',
        toRole: 'admin',
        description: `Platform fee for: ${title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: order._id.toString(),
          listingId,
          listingTitle: title,
          buyerFee: buyerMarkupFee,
          sellerFee: platformFee,
          totalFee: totalPlatformRevenue,
          originalPrice: actualPrice,
          buyerPayment: actualMarkedUpPrice,
          seller,
          buyer,
          sellerTier,
          tierAdjustedFee: platformFee
        }
      });
      await feeTransaction.save();

      if (tierBonus > 0) {
        const tierCreditTransaction = new Transaction({
          type: 'tier_credit',
          amount: tierBonus,
          from: 'platform',
          to: seller,
          fromRole: 'admin',
          toRole: 'seller',
          description: `Tier bonus (${sellerTier}): +${(tierInfo.bonusPercentage * 100).toFixed(0)}%`,
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            orderId: order._id.toString(),
            listingTitle: title,
            tierBonus,
            sellerTier,
            bonusPercentage: tierInfo.bonusPercentage
          }
        });
        await tierCreditTransaction.save();

        const AdminAction = require('../models/AdminAction');
        const tierCreditAction = new AdminAction({
          type: 'debit',
          amount: tierBonus,
          reason: `Tier bonus paid to ${seller} (${sellerTier} tier - ${(tierInfo.bonusPercentage * 100).toFixed(0)}%)`,
          date: new Date(),
          metadata: {
            orderId: order._id.toString(),
            seller,
            sellerTier,
            bonusPercentage: tierInfo.bonusPercentage,
            orderTitle: title
          }
        });
        await tierCreditAction.save();
      }

      order.paymentTransactionId = purchaseTransaction._id;
      order.feeTransactionId = feeTransaction._id;
      await order.save();

      const tierUpdateResult = await tierService.updateSellerTier(seller);

      if (global.webSocketService) {
        global.webSocketService.emitBalanceUpdate(buyer, 'buyer', previousBuyerBalance, buyerWallet.balance, 'purchase');
        global.webSocketService.emitBalanceUpdate(seller, 'seller', previousSellerBalance, sellerWallet.balance, 'sale');
        global.webSocketService.emitBalanceUpdate('platform', 'admin', previousPlatformBalance, platformWallet.balance, 'platform_fee');

        if (global.webSocketService.emitPlatformBalanceUpdate) {
          global.webSocketService.emitPlatformBalanceUpdate(platformWallet.balance);
        }

        global.webSocketService.emitTransaction(purchaseTransaction.toObject());
        global.webSocketService.emitTransaction(feeTransaction.toObject());

        if (global.webSocketService.emitOrderCreated) {
          global.webSocketService.emitOrderCreated({
            _id: order._id,
            id: order._id.toString(),
            title: order.title,
            seller: order.seller,
            buyer: order.buyer,
            price: order.price,
            markedUpPrice: order.markedUpPrice,
            sellerTier,
            tierBonus
          });
        }

        if (tierUpdateResult && tierUpdateResult.changed) {
          global.webSocketService.emitUserUpdate(seller, {
            tier: tierUpdateResult.newTier,
            totalSales: tierUpdateResult.stats.totalSales
          });
        }
      }

      try {
        await incrementPaymentStats(actualPrice);
      } catch (statsError) {
        console.error('[Order] Failed to increment payment stats:', statsError);
      }

      res.json({
        success: true,
        data: {
          _id: order._id.toString(),
          id: order._id.toString(),
          title: order.title,
          description: order.description,
          price: order.price,
          markedUpPrice: order.markedUpPrice,
          imageUrl: order.imageUrl,
          date: order.date.toISOString(),
          seller: order.seller,
          buyer: order.buyer,
          tags: order.tags,
          listingId: order.listingId,
          wasAuction: order.wasAuction,
          deliveryAddress: formatDeliveryAddressForResponse(order.deliveryAddress),
          shippingStatus: order.shippingStatus,
          paymentStatus: order.paymentStatus,
          platformFee: order.platformFee,
          sellerEarnings: order.sellerEarnings,
          tierCreditAmount: order.tierCreditAmount,
          sellerTier,
          referralCommission: order.referralCommission,
          referrer: order.referrer
        }
      });

    } catch (error) {
      console.error('[Order] Transaction failed:', error);
      try {
        if (buyerWallet.balance < previousBuyerBalance) {
          buyerWallet.balance = previousBuyerBalance;
          await buyerWallet.save();
        }
        if (sellerWallet.balance > previousSellerBalance) {
          sellerWallet.balance = previousSellerBalance;
          await sellerWallet.save();
        }
        if (platformWallet.balance > previousPlatformBalance) {
          platformWallet.balance = previousPlatformBalance;
          await platformWallet.save();
        }
        if (referrerWallet && referrerWallet.balance > previousReferrerBalance) {
          referrerWallet.balance = previousReferrerBalance;
          await referrerWallet.save();
        }
      } catch (rollbackError) {
        console.error('[Order] Rollback failed:', rollbackError);
      }
      throw error;
    }

  } catch (error) {
    console.error('[Order] Error creating order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create order'
    });
  }
});

// POST /api/orders/custom-request - Convert custom request to order (NEW ENDPOINT)
router.post('/custom-request', authMiddleware, async (req, res) => {
  try {
    const {
      requestId,
      title,
      description,
      price,
      seller,
      buyer,
      tags,
      deliveryAddress,
      isPremium
    } = req.body;

    console.log('[Order] Converting custom request to order:', {
      requestId,
      title,
      buyer,
      seller,
      price,
      isPremium
    });

    if (buyer !== req.user.username) {
      return res.status(403).json({
        success: false,
        error: 'You can only create orders for yourself'
      });
    }

    if (!requestId || !title || !description || !price || !seller || !buyer) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields for custom request order'
      });
    }

    if (isPremium) {
      const isSubscribed = await isUserSubscribedToSeller(buyer, seller);
      if (!isSubscribed) {
        return res.status(403).json({
          success: false,
          error: 'You must be subscribed to this seller to pay for premium custom requests',
          requiresSubscription: true,
          seller: seller
        });
      }
    }

    const sellerUser = await User.findOne({ username: seller });
    if (!sellerUser) {
      return res.status(404).json({ success: false, error: 'Seller not found' });
    }
    
    const sellerTier = sellerUser.tier || 'Tease';
    const tierInfo = TIER_CONFIG.getTierByName(sellerTier);

    const actualPrice = Number(price) || 0;
    const actualMarkedUpPrice = Math.round(actualPrice * 1.1 * 100) / 100;
    
    // CRITICAL FIX: Check for referral for custom requests too
    const activeReferral = await Referral.findActiveReferral(seller);
    const hasReferral = activeReferral && activeReferral.isActive;
    const referralCommissionRate = hasReferral ? activeReferral.commissionRate : 0;

    // Calculate fees and commission based on BASE PRICE
    const platformFee = TIER_CONFIG.calculatePlatformFee(actualPrice, sellerTier);
    const tierBonus = Math.round((actualPrice * tierInfo.bonusPercentage) * 100) / 100;
    const buyerMarkupFee = Math.round((actualMarkedUpPrice - actualPrice) * 100) / 100;
    const totalPlatformRevenue = Math.round((platformFee + buyerMarkupFee) * 100) / 100;

    // FIXED: Calculate referral commission from BASE PRICE
    let referralCommission = 0;
    if (hasReferral) {
      // 5% of the BASE PRICE
      referralCommission = Math.round(actualPrice * referralCommissionRate * 100) / 100;
      console.log(`[Order] Custom request referral detected - Commission: $${referralCommission} (${(referralCommissionRate * 100)}% of $${actualPrice}) to ${activeReferral.referrer}`);
    }

    // Calculate seller earnings: base price - platform fee - referral commission + tier bonus
    let baseSellerEarnings = actualPrice - platformFee;
    let sellerEarnings = Math.round((baseSellerEarnings - referralCommission + tierBonus) * 100) / 100;

    console.log(`[Order] Custom request payment breakdown:`, {
      basePrice: actualPrice,
      buyerPays: actualMarkedUpPrice,
      platformFee: platformFee,
      tierBonus: tierBonus,
      referralCommission: referralCommission,
      sellerEarnings: sellerEarnings,
      totalPlatformRevenue: totalPlatformRevenue
    });

    const buyerWallet = await Wallet.findOne({ username: buyer });
    if (!buyerWallet) {
      return res.status(404).json({ success: false, error: 'Buyer wallet not found. Please deposit funds first.' });
    }

    const balanceInCents = Math.round(buyerWallet.balance * 100);
    const priceInCents = Math.round(actualMarkedUpPrice * 100);
    if (balanceInCents < priceInCents) {
      return res.status(400).json({
        success: false,
        error: `Insufficient balance. You need $${(priceInCents/100).toFixed(2)} but only have $${(balanceInCents/100).toFixed(2)}`
      });
    }

    let sellerWallet = await Wallet.findOne({ username: seller });
    if (!sellerWallet) {
      sellerWallet = new Wallet({ username: seller, role: 'seller', balance: 0 });
      await sellerWallet.save();
    }

    let platformWallet = await Wallet.findOne({ username: 'platform', role: 'admin' });
    if (!platformWallet) {
      platformWallet = new Wallet({ username: 'platform', role: 'admin', balance: 0 });
      await platformWallet.save();
    }

    // Get referrer wallet if needed
    let referrerWallet = null;
    if (hasReferral && referralCommission > 0) {
      referrerWallet = await Wallet.findOne({ username: activeReferral.referrer });
      if (!referrerWallet) {
        const referrerUser = await User.findOne({ username: activeReferral.referrer });
        if (referrerUser) {
          referrerWallet = new Wallet({ 
            username: activeReferral.referrer, 
            role: referrerUser.role, 
            balance: 0 
          });
          await referrerWallet.save();
        }
      }
    }

    const previousBuyerBalance = buyerWallet.balance;
    const previousSellerBalance = sellerWallet.balance;
    const previousPlatformBalance = platformWallet.balance;
    const previousReferrerBalance = referrerWallet ? referrerWallet.balance : 0;

    try {
      await buyerWallet.withdraw(actualMarkedUpPrice);
      await sellerWallet.deposit(sellerEarnings);
      
      // Process referral commission if applicable
      if (hasReferral && referrerWallet && referralCommission > 0) {
        await referrerWallet.deposit(referralCommission);
        console.log(`[Order] Custom request: Deposited $${referralCommission} to referrer ${activeReferral.referrer}`);
      }
      
      // FIXED: Deposit the full totalPlatformRevenue without subtracting tierBonus
      await platformWallet.deposit(totalPlatformRevenue);

      const order = new Order({
        title,
        description,
        price: actualPrice,
        markedUpPrice: actualMarkedUpPrice,
        imageUrl: '/api/placeholder/400/300',
        date: new Date(),
        seller,
        buyer,
        tags: tags || [],
        isCustomRequest: true,
        originalRequestId: requestId,
        deliveryAddress: formatDeliveryAddressForResponse(deliveryAddress),
        shippingStatus: 'pending',
        paymentStatus: 'completed',
        paymentCompletedAt: new Date(),
        platformFee: platformFee,
        buyerMarkupFee,
        sellerPlatformFee: platformFee,
        sellerEarnings,
        tierCreditAmount: tierBonus,
        sellerTier,
        // Add referral fields
        referralCommission: referralCommission,
        referrer: hasReferral ? activeReferral.referrer : undefined,
        adjustedSellerEarnings: sellerEarnings
      });

      await order.save();

      // Process referral commission recording for custom request
      if (hasReferral && referralCommission > 0) {
        try {
          await activeReferral.recordCommission(referralCommission, order._id.toString());
          
          const commissionTransaction = new Transaction({
            type: 'sale',
            amount: referralCommission,
            from: seller,
            to: activeReferral.referrer,
            fromRole: 'seller',
            toRole: 'seller',
            description: `Referral commission (5%) for custom request: ${order.title}`,
            status: 'completed',
            completedAt: new Date(),
            metadata: {
              orderId: order._id.toString(),
              orderTitle: order.title,
              referralId: activeReferral._id.toString(),
              commissionRate: referralCommissionRate,
              originalPrice: actualPrice,
              adjustedSellerEarnings: sellerEarnings,
              buyer: buyer,
              seller: seller,
              isCustomRequest: true,
              isReferralCommission: true
            }
          });
          await commissionTransaction.save();
          
          await User.findOneAndUpdate(
            { username: activeReferral.referrer },
            {
              $inc: {
                referralEarnings: referralCommission
              }
            }
          );
          
          const referrerNotification = new Notification({
            recipient: activeReferral.referrer,
            type: 'sale',
            title: '💰 Referral Commission Earned!',
            message: `You earned $${referralCommission.toFixed(2)} from ${seller}'s custom request sale: "${order.title}"`,
            link: '/sellers/profile',
            priority: 'normal',
            metadata: {
              amount: referralCommission,
              seller: seller,
              orderId: order._id.toString(),
              orderTitle: order.title,
              isCustomRequest: true,
              isReferralCommission: true
            }
          });
          await referrerNotification.save();
          
          if (global.webSocketService) {
            global.webSocketService.emitToUser(activeReferral.referrer, 'notification:new', {
              id: referrerNotification._id,
              type: referrerNotification.type,
              title: referrerNotification.title,
              message: referrerNotification.message,
              link: referrerNotification.link,
              createdAt: referrerNotification.createdAt
            });
            
            global.webSocketService.emitBalanceUpdate(
              activeReferral.referrer, 
              'seller', 
              previousReferrerBalance, 
              referrerWallet.balance, 
              'referral_commission'
            );
            
            global.webSocketService.emitTransaction(commissionTransaction.toObject());
          }
          
          console.log(`[Order] Custom request referral commission processed: ${activeReferral.referrer} earned $${referralCommission}`);
        } catch (referralError) {
          console.error('[Order] Error recording custom request referral commission:', referralError);
        }
      }

      // Use the new helper for custom request paid notification
      await Notification.createCustomRequestPaidNotification(seller, buyer, {
        id: requestId,
        orderId: order._id.toString(),
        title,
        amount: actualMarkedUpPrice
      });

      const Message = require('../models/Message');
      const { v4: uuidv4 } = require('uuid');
      
      const paymentMessage = new Message({
        _id: uuidv4(),
        sender: buyer,
        receiver: seller,
        content: `✅ Custom request "${title}" has been paid! ($${actualPrice.toFixed(2)})`,
        type: 'normal',
        meta: {
          orderId: order._id.toString(),
          requestId,
          isPaidNotification: true,
          isPremium
        },
        threadId: Message.getThreadId(buyer, seller),
        isRead: false
      });
      await paymentMessage.save();

      const purchaseTransaction = new Transaction({
        type: 'custom_request',
        amount: actualMarkedUpPrice,
        from: buyer,
        to: seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Custom Request: ${title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: order._id.toString(),
          requestId,
          customRequest: true,
          listingTitle: title,
          originalPrice: actualPrice,
          buyerPayment: actualMarkedUpPrice,
          sellerEarnings,
          seller,
          buyer,
          sellerTier,
          tierBonus,
          isPremium,
          hasReferral,
          referralCommission
        }
      });
      await purchaseTransaction.save();

      const feeTransaction = new Transaction({
        type: 'platform_fee',
        amount: totalPlatformRevenue,
        from: buyer,
        to: 'platform',
        fromRole: 'buyer',
        toRole: 'admin',
        description: `Platform fee for custom request: ${title}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: order._id.toString(),
          requestId,
          customRequest: true,
          buyerFee: buyerMarkupFee,
          sellerFee: platformFee,
          totalFee: totalPlatformRevenue,
          originalPrice: actualPrice,
          buyerPayment: actualMarkedUpPrice,
          seller,
          buyer,
          sellerTier
        }
      });
      await feeTransaction.save();

      if (tierBonus > 0) {
        const tierCreditTransaction = new Transaction({
          type: 'tier_credit',
          amount: tierBonus,
          from: 'platform',
          to: seller,
          fromRole: 'admin',
          toRole: 'seller',
          description: `Tier bonus (${sellerTier}) for custom request`,
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            orderId: order._id.toString(),
            requestId,
            customRequest: true,
            tierBonus,
            sellerTier,
            bonusPercentage: tierInfo.bonusPercentage
          }
        });
        await tierCreditTransaction.save();
      }

      order.paymentTransactionId = purchaseTransaction._id;
      order.feeTransactionId = feeTransaction._id;
      await order.save();

      const tierUpdateResult = await tierService.updateSellerTier(seller);

      if (global.webSocketService) {
        global.webSocketService.emitBalanceUpdate(buyer, 'buyer', previousBuyerBalance, buyerWallet.balance, 'custom_request');
        global.webSocketService.emitBalanceUpdate(seller, 'seller', previousSellerBalance, sellerWallet.balance, 'custom_request_sale');
        global.webSocketService.emitBalanceUpdate('platform', 'admin', previousPlatformBalance, platformWallet.balance, 'platform_fee');

        global.webSocketService.emitTransaction(purchaseTransaction.toObject());
        global.webSocketService.emitTransaction(feeTransaction.toObject());

        global.webSocketService.emitToUser(seller, 'custom_request:paid', {
          requestId,
          orderId: order._id.toString(),
          buyer,
          title,
          amount: actualPrice,
          isPremium
        });

        global.webSocketService.emitNewMessage({
          id: paymentMessage._id.toString(),
          sender: paymentMessage.sender,
          receiver: paymentMessage.receiver,
          content: paymentMessage.content,
          type: paymentMessage.type,
          date: paymentMessage.createdAt,
          createdAt: paymentMessage.createdAt,
          threadId: paymentMessage.threadId,
          meta: paymentMessage.meta,
          isRead: false,
          read: false
        });

        if (tierUpdateResult && tierUpdateResult.changed) {
          global.webSocketService.emitUserUpdate(seller, {
            tier: tierUpdateResult.newTier,
            totalSales: tierUpdateResult.stats.totalSales
          });
        }
      }

      try {
        await incrementPaymentStats(actualPrice);
      } catch (statsError) {
        console.error('[Order] Failed to increment payment stats:', statsError);
      }

      res.json({
        success: true,
        data: {
          _id: order._id.toString(),
          id: order._id.toString(),
          title: order.title,
          description: order.description,
          price: order.price,
          markedUpPrice: order.markedUpPrice,
          imageUrl: order.imageUrl,
          date: order.date.toISOString(),
          seller: order.seller,
          buyer: order.buyer,
          tags: order.tags,
          isCustomRequest: true,
          originalRequestId: requestId,
          deliveryAddress: formatDeliveryAddressForResponse(order.deliveryAddress),
          shippingStatus: order.shippingStatus,
          paymentStatus: order.paymentStatus,
          platformFee: order.platformFee,
          sellerEarnings: order.sellerEarnings,
          tierCreditAmount: order.tierCreditAmount,
          sellerTier,
          referralCommission: order.referralCommission,
          referrer: order.referrer
        }
      });

    } catch (error) {
      console.error('[Order] Custom request transaction failed:', error);
      try {
        if (buyerWallet.balance < previousBuyerBalance) {
          buyerWallet.balance = previousBuyerBalance;
          await buyerWallet.save();
        }
        if (sellerWallet.balance > previousSellerBalance) {
          sellerWallet.balance = previousSellerBalance;
          await sellerWallet.save();
        }
        if (platformWallet.balance > previousPlatformBalance) {
          platformWallet.balance = previousPlatformBalance;
          await platformWallet.save();
        }
        if (referrerWallet && referrerWallet.balance > previousReferrerBalance) {
          referrerWallet.balance = previousReferrerBalance;
          await referrerWallet.save();
        }
      } catch (rollbackError) {
        console.error('[Order] Rollback failed:', rollbackError);
      }
      throw error;
    }

  } catch (error) {
    console.error('[Order] Error converting custom request to order:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert custom request to order'
    });
  }
});

// GET /api/orders - Get orders for a user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { role, limit = 50, page = 1, status, buyer, seller } = req.query;
    const username = req.user.username;
    
    const query = {};
    if (buyer) {
      query.buyer = buyer;
    } else if (seller) {
      query.seller = seller;
    } else if (role === 'buyer' || req.user.role === 'buyer') {
      query.buyer = username;
    } else if (role === 'seller' || req.user.role === 'seller') {
      query.seller = username;
    } else if (req.user.role !== 'admin') {
      query.$or = [{ buyer: username }, { seller: username }];
    }

    if (status) {
      query.shippingStatus = status;
    }

    const skip = (page - 1) * limit;
    const orders = await Order.find(query).sort({ date: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Order.countDocuments(query);

    const formattedOrders = orders.map(order => ({
      _id: order._id.toString(),
      id: order._id.toString(),
      title: order.title,
      description: order.description,
      price: order.price,
      markedUpPrice: order.markedUpPrice,
      imageUrl: order.imageUrl,
      date: order.date.toISOString(),
      seller: order.seller,
      buyer: order.buyer,
      tags: order.tags,
      listingId: order.listingId,
      wasAuction: order.wasAuction,
      finalBid: order.finalBid,
      deliveryAddress: formatDeliveryAddressForResponse(order.deliveryAddress),
      shippingStatus: order.shippingStatus,
      trackingNumber: order.trackingNumber,
      shippedDate: order.shippedDate,
      deliveredDate: order.deliveredDate,
      paymentStatus: order.paymentStatus,
      platformFee: order.platformFee,
      sellerEarnings: order.sellerEarnings,
      tierCreditAmount: order.tierCreditAmount,
      sellerTier: order.sellerTier,
      isCustomRequest: order.isCustomRequest,
      originalRequestId: order.originalRequestId,
      referralCommission: order.referralCommission,
      referrer: order.referrer
    }));

    res.json({
      success: true,
      data: formattedOrders,
      meta: {
        page: parseInt(page),
        pageSize: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('[Order] Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/orders/:id - Get specific order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    if (req.user.username !== order.buyer && req.user.username !== order.seller && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'You can only view your own orders' });
    }

    res.json({
      success: true,
      data: {
        _id: order._id.toString(),
        id: order._id.toString(),
        title: order.title,
        description: order.description,
        price: order.price,
        markedUpPrice: order.markedUpPrice,
        imageUrl: order.imageUrl,
        date: order.date.toISOString(),
        seller: order.seller,
        buyer: order.buyer,
        tags: order.tags,
        listingId: order.listingId,
        wasAuction: order.wasAuction,
        finalBid: order.finalBid,
        deliveryAddress: formatDeliveryAddressForResponse(order.deliveryAddress),
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        shippedDate: order.shippedDate,
        deliveredDate: order.deliveredDate,
        paymentStatus: order.paymentStatus,
        platformFee: order.platformFee,
        sellerEarnings: order.sellerEarnings,
        tierCreditAmount: order.tierCreditAmount,
        sellerTier: order.sellerTier,
        isCustomRequest: order.isCustomRequest,
        originalRequestId: order.originalRequestId,
        referralCommission: order.referralCommission,
        referrer: order.referrer
      }
    });

  } catch (error) {
    console.error('[Order] Error fetching order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/orders/:id/shipping - Update shipping status
router.put('/:id/shipping', authMiddleware, async (req, res) => {
  try {
    const { shippingStatus, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (req.user.username !== order.seller && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the seller can update shipping status' });
    }

    if (shippingStatus) {
      order.shippingStatus = shippingStatus;
      if (shippingStatus === 'shipped' && !order.shippedDate) order.shippedDate = new Date();
      else if (shippingStatus === 'delivered' && !order.deliveredDate) order.deliveredDate = new Date();
    }
    if (trackingNumber) order.trackingNumber = trackingNumber;

    await order.save();

    // Use the new helper method for shipping notifications
    if (shippingStatus === 'shipped' || shippingStatus === 'processing' || shippingStatus === 'delivered') {
      await Notification.createShippingNotification(order.buyer, order, shippingStatus);
    }

    if (global.webSocketService) {
      global.webSocketService.emitOrderUpdated({
        _id: order._id,
        id: order._id.toString(),
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        buyer: order.buyer,
        seller: order.seller
      });
    }

    res.json({
      success: true,
      data: {
        id: order._id.toString(),
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        shippedDate: order.shippedDate,
        deliveredDate: order.deliveredDate
      }
    });

  } catch (error) {
    console.error('[Order] Error updating shipping:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/orders/:id/shipping - Update shipping status (alternative to PUT)
router.post('/:id/shipping', authMiddleware, async (req, res) => {
  try {
    const { shippingStatus, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (req.user.username !== order.seller && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the seller can update shipping status' });
    }

    if (shippingStatus) {
      order.shippingStatus = shippingStatus;
      if (shippingStatus === 'shipped' && !order.shippedDate) order.shippedDate = new Date();
      else if (shippingStatus === 'delivered' && !order.deliveredDate) order.deliveredDate = new Date();
    }
    if (trackingNumber) order.trackingNumber = trackingNumber;

    await order.save();

    // Use the new helper method for shipping notifications
    if (shippingStatus === 'shipped' || shippingStatus === 'processing' || shippingStatus === 'delivered') {
      await Notification.createShippingNotification(order.buyer, order, shippingStatus);
    }

    if (global.webSocketService) {
      global.webSocketService.emitOrderUpdated({
        _id: order._id,
        id: order._id.toString(),
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        buyer: order.buyer,
        seller: order.seller
      });
    }

    res.json({
      success: true,
      data: {
        id: order._id.toString(),
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        shippedDate: order.shippedDate,
        deliveredDate: order.deliveredDate
      }
    });

  } catch (error) {
    console.error('[Order] Error updating shipping:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/orders/:id/address - Update delivery address
router.put('/:id/address', authMiddleware, async (req, res) => {
  try {
    const { deliveryAddress } = req.body;
    if (
      !deliveryAddress ||
      !deliveryAddress.fullName ||
      !deliveryAddress.addressLine1 ||
      !deliveryAddress.city ||
      !deliveryAddress.state ||
      !deliveryAddress.postalCode ||
      !deliveryAddress.country
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delivery address. All required fields must be provided.'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (req.user.username !== order.buyer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the buyer can update the delivery address' });
    }

    if (order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered') {
      return res.status(400).json({ success: false, error: 'Cannot update address for shipped or delivered orders' });
    }

    order.deliveryAddress = {
      fullName: normalizeString(deliveryAddress.fullName),
      addressLine1: normalizeString(deliveryAddress.addressLine1),
      addressLine2: deliveryAddress.addressLine2 ? normalizeString(deliveryAddress.addressLine2) : undefined,
      city: normalizeString(deliveryAddress.city),
      state: normalizeString(deliveryAddress.state),
      postalCode: normalizeString(deliveryAddress.postalCode),
      country: normalizeString(deliveryAddress.country),
      phone: deliveryAddress.phone ? normalizeString(deliveryAddress.phone) : undefined,
      specialInstructions: deliveryAddress.specialInstructions ? normalizeString(deliveryAddress.specialInstructions) : undefined
    };

    await order.save();

    console.log('[Order] Address updated for order:', order._id);

    // Use the new helper method for address update notifications
    await Notification.createAddressUpdateNotification(order.seller, order, order.buyer);

    if (global.webSocketService) {
      global.webSocketService.emitOrderUpdated({
        _id: order._id,
        id: order._id.toString(),
        buyer: order.buyer,
        seller: order.seller,
        hasAddress: true,
        addressUpdated: true
      });
      global.webSocketService.emitToUser(order.seller, 'order:address-updated', {
        orderId: order._id.toString(),
        orderTitle: order.title,
        buyer: order.buyer,
        hasAddress: true
      });
    }

    res.json({
      success: true,
      data: {
        id: order._id.toString(),
        deliveryAddress: formatDeliveryAddressForResponse(order.deliveryAddress),
        message: 'Delivery address updated successfully'
      }
    });

  } catch (error) {
    console.error('[Order] Error updating address:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update delivery address'
    });
  }
});

// POST /api/orders/:id/address - Update delivery address (alternative to PUT)
router.post('/:id/address', authMiddleware, async (req, res) => {
  try {
    const { deliveryAddress } = req.body;
    if (
      !deliveryAddress ||
      !deliveryAddress.fullName ||
      !deliveryAddress.addressLine1 ||
      !deliveryAddress.city ||
      !deliveryAddress.state ||
      !deliveryAddress.postalCode ||
      !deliveryAddress.country
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delivery address. All required fields must be provided.'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (req.user.username !== order.buyer && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only the buyer can update the delivery address' });
    }

    if (order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered') {
      return res.status(400).json({ success: false, error: 'Cannot update address for shipped or delivered orders' });
    }

    order.deliveryAddress = {
      fullName: normalizeString(deliveryAddress.fullName),
      addressLine1: normalizeString(deliveryAddress.addressLine1),
      addressLine2: deliveryAddress.addressLine2 ? normalizeString(deliveryAddress.addressLine2) : undefined,
      city: normalizeString(deliveryAddress.city),
      state: normalizeString(deliveryAddress.state),
      postalCode: normalizeString(deliveryAddress.postalCode),
      country: normalizeString(deliveryAddress.country),
      phone: deliveryAddress.phone ? normalizeString(deliveryAddress.phone) : undefined,
      specialInstructions: deliveryAddress.specialInstructions ? normalizeString(deliveryAddress.specialInstructions) : undefined
    };

    await order.save();

    console.log('[Order] Address updated for order:', order._id);

    // Use the new helper method for address update notifications
    await Notification.createAddressUpdateNotification(order.seller, order, order.buyer);

    if (global.webSocketService) {
      global.webSocketService.emitOrderUpdated({
        _id: order._id,
        id: order._id.toString(),
        buyer: order.buyer,
        seller: order.seller,
        hasAddress: true,
        addressUpdated: true
      });
      global.webSocketService.emitToUser(order.seller, 'order:address-updated', {
        orderId: order._id.toString(),
        orderTitle: order.title,
        buyer: order.buyer,
        hasAddress: true
      });
    }

    res.json({
      success: true,
      data: {
        id: order._id.toString(),
        deliveryAddress: formatDeliveryAddressForResponse(order.deliveryAddress),
        message: 'Delivery address updated successfully'
      }
    });

  } catch (error) {
    console.error('[Order] Error updating address:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update delivery address'
    });
  }
});

// PATCH /api/orders/:id - Update order (general update endpoint)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const canUpdate =
      req.user.username === order.buyer ||
      req.user.username === order.seller ||
      req.user.role === 'admin';
    if (!canUpdate) {
      return res.status(403).json({ success: false, error: 'You do not have permission to update this order' });
    }

    const updates = {};
    if (req.user.username === order.buyer && req.body.deliveryAddress) {
      if (order.shippingStatus === 'shipped' || order.shippingStatus === 'delivered') {
        return res.status(400).json({ success: false, error: 'Cannot update address for shipped orders' });
      }
      const da = req.body.deliveryAddress;
      updates.deliveryAddress = {
        fullName: normalizeString(da.fullName),
        addressLine1: normalizeString(da.addressLine1),
        addressLine2: da.addressLine2 ? normalizeString(da.addressLine2) : undefined,
        city: normalizeString(da.city),
        state: normalizeString(da.state),
        postalCode: normalizeString(da.postalCode),
        country: normalizeString(da.country),
        phone: da.phone ? normalizeString(da.phone) : undefined,
        specialInstructions: da.specialInstructions ? normalizeString(da.specialInstructions) : undefined
      };
    }
    if (req.user.username === order.seller) {
      if (req.body.shippingStatus) {
        updates.shippingStatus = req.body.shippingStatus;
        if (req.body.shippingStatus === 'shipped' && !order.shippedDate) updates.shippedDate = new Date();
        else if (req.body.shippingStatus === 'delivered' && !order.deliveredDate) updates.deliveredDate = new Date();
      }
      if (req.body.trackingNumber) updates.trackingNumber = req.body.trackingNumber;
    }
    if (req.user.role === 'admin') {
      Object.assign(updates, req.body);
    }

    Object.assign(order, updates);
    await order.save();

    if (Object.keys(updates).length > 0 && global.webSocketService) {
      global.webSocketService.emitOrderUpdated({
        _id: order._id,
        id: order._id.toString(),
        ...updates,
        buyer: order.buyer,
        seller: order.seller
      });
    }

    res.json({
      success: true,
      data: {
        _id: order._id.toString(),
        id: order._id.toString(),
        title: order.title,
        description: order.description,
        price: order.price,
        markedUpPrice: order.markedUpPrice,
        imageUrl: order.imageUrl,
        date: order.date.toISOString(),
        seller: order.seller,
        buyer: order.buyer,
        tags: order.tags,
        listingId: order.listingId,
        wasAuction: order.wasAuction,
        finalBid: order.finalBid,
        deliveryAddress: formatDeliveryAddressForResponse(order.deliveryAddress),
        shippingStatus: order.shippingStatus,
        trackingNumber: order.trackingNumber,
        shippedDate: order.shippedDate,
        deliveredDate: order.deliveredDate,
        paymentStatus: order.paymentStatus,
        sellerTier: order.sellerTier,
        isCustomRequest: order.isCustomRequest,
        originalRequestId: order.originalRequestId,
        referralCommission: order.referralCommission,
        referrer: order.referrer
      }
    });

  } catch (error) {
    console.error('[Order] Error updating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/orders/:id - Cancel order (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only admins can cancel orders' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    if (order.shippingStatus !== 'pending') {
      return res.status(400).json({ success: false, error: 'Can only cancel pending orders' });
    }

    order.shippingStatus = 'cancelled';
    await order.save();

    res.json({ success: true, data: { id: order._id.toString(), message: 'Order cancelled successfully' } });

  } catch (error) {
    console.error('[Order] Error cancelling order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export the router
module.exports = router;
