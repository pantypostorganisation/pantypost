// pantypost-backend/services/tierService.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const TIER_CONFIG = require('../config/tierConfig');

class TierService {
  /**
   * Calculate seller's lifetime stats
   */
  async calculateSellerStats(username) {
    try {
      // Get all completed orders for this seller
      const orders = await Order.find({
        seller: username,
        paymentStatus: 'completed'
      });
      
      const totalSales = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.price || 0), 0);
      
      return {
        totalSales,
        totalRevenue: Math.round(totalRevenue * 100) / 100
      };
    } catch (error) {
      console.error('[TierService] Error calculating seller stats:', error);
      throw error;
    }
  }
  
  /**
   * Update seller's tier based on their stats - USES OR LOGIC (matches frontend)
   */
  async updateSellerTier(username) {
    try {
      // Get seller stats
      const stats = await this.calculateSellerStats(username);
      
      // Determine new tier using OR logic (matches frontend)
      const newTier = TIER_CONFIG.getTierByStats(stats.totalSales, stats.totalRevenue);
      
      // Get current user
      const user = await User.findOne({ username });
      if (!user) {
        throw new Error('User not found');
      }
      
      // Fix old tier name if needed
      const oldTier = TIER_CONFIG.fixTierName(user.tier || 'Tease');
      
      // Update if tier changed
      if (oldTier !== newTier) {
        user.tier = newTier;
        user.totalSales = stats.totalSales;
        await user.save();
        
        // Log tier change
        console.log(`[TierService] Tier updated for ${username}: ${oldTier} -> ${newTier} (${stats.totalSales} sales OR $${stats.totalRevenue} revenue)`);
        
        // Create audit log
        await this.logTierChange(username, oldTier, newTier, 'Automatic progression');
        
        // Emit WebSocket event if available
        if (global.webSocketService) {
          global.webSocketService.emitUserUpdate(username, {
            tier: newTier,
            totalSales: stats.totalSales
          });
        }
        
        return {
          changed: true,
          oldTier,
          newTier,
          stats
        };
      }
      
      // Update stats even if tier didn't change
      user.totalSales = stats.totalSales;
      await user.save();
      
      return {
        changed: false,
        tier: oldTier,
        stats
      };
    } catch (error) {
      console.error('[TierService] Error updating seller tier:', error);
      throw error;
    }
  }
  
  /**
   * Apply tier-based revenue share to an order
   */
  async applyTierRevenue(order, sellerTier) {
    try {
      // Fix old tier name if needed
      const fixedTier = TIER_CONFIG.fixTierName(sellerTier);
      const tier = TIER_CONFIG.getTierByName(fixedTier);
      const price = order.price;
      
      // Calculate with tier bonus
      const sellerEarnings = TIER_CONFIG.calculateSellerEarnings(price, fixedTier);
      const platformFee = TIER_CONFIG.calculatePlatformFee(price, fixedTier);
      const tierBonus = Math.round((price * tier.bonusPercentage) * 100) / 100;
      
      // Update order with tier information
      order.sellerEarnings = sellerEarnings;
      order.sellerPlatformFee = platformFee;
      order.tierCreditAmount = tierBonus;
      
      return {
        sellerEarnings,
        platformFee,
        tierBonus,
        totalPlatformRevenue: platformFee // Platform gets the reduced fee
      };
    } catch (error) {
      console.error('[TierService] Error applying tier revenue:', error);
      throw error;
    }
  }
  
  /**
   * Create tier credit transaction if applicable
   */
  async createTierCreditTransaction(order, tierBonus, seller) {
    if (tierBonus <= 0) return null;
    
    try {
      const transaction = new Transaction({
        type: 'tier_credit',
        amount: tierBonus,
        from: 'platform',
        to: seller,
        fromRole: 'admin',
        toRole: 'seller',
        description: `Tier bonus credit for order ${order._id}`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: order._id.toString(),
          listingTitle: order.title,
          tierBonus: tierBonus
        }
      });
      
      await transaction.save();
      return transaction;
    } catch (error) {
      console.error('[TierService] Error creating tier credit transaction:', error);
      throw error;
    }
  }
  
  /**
   * Get tier progress for a seller
   */
  async getTierProgress(username) {
    try {
      const user = await User.findOne({ username });
      if (!user) throw new Error('User not found');
      
      const stats = await this.calculateSellerStats(username);
      const currentTier = TIER_CONFIG.fixTierName(user.tier || 'Tease');
      const nextTier = TIER_CONFIG.getNextTier(currentTier);
      
      if (!nextTier) {
        return {
          currentTier,
          nextTier: null,
          salesProgress: 100,
          revenueProgress: 100,
          stats
        };
      }
      
      const nextTierConfig = TIER_CONFIG.getTierByName(nextTier);
      
      // Calculate progress percentages
      const salesProgress = Math.min(100, (stats.totalSales / nextTierConfig.minSales) * 100);
      const revenueProgress = Math.min(100, (stats.totalRevenue / nextTierConfig.minRevenue) * 100);
      
      return {
        currentTier,
        nextTier,
        salesProgress: Math.round(salesProgress),
        revenueProgress: Math.round(revenueProgress),
        salesNeeded: Math.max(0, nextTierConfig.minSales - stats.totalSales),
        revenueNeeded: Math.max(0, nextTierConfig.minRevenue - stats.totalRevenue),
        stats
      };
    } catch (error) {
      console.error('[TierService] Error getting tier progress:', error);
      throw error;
    }
  }
  
  /**
   * Process order with tier-based settlement
   */
  async processOrderWithTier(order, buyer, seller) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get seller user and tier
      const sellerUser = await User.findOne({ username: seller });
      if (!sellerUser) throw new Error('Seller not found');
      
      const sellerTier = TIER_CONFIG.fixTierName(sellerUser.tier || 'Tease');
      
      // Calculate tier-based revenue
      const tier = TIER_CONFIG.getTierByName(sellerTier);
      const sellerEarnings = TIER_CONFIG.calculateSellerEarnings(order.price, sellerTier);
      const platformFee = TIER_CONFIG.calculatePlatformFee(order.price, sellerTier);
      const tierBonus = Math.round((order.price * tier.bonusPercentage) * 100) / 100;
      
      // Update order with tier calculations
      order.sellerEarnings = sellerEarnings;
      order.sellerPlatformFee = platformFee;
      order.tierCreditAmount = tierBonus;
      
      // Get or create wallets
      let sellerWallet = await Wallet.findOne({ username: seller }).session(session);
      if (!sellerWallet) {
        sellerWallet = new Wallet({
          username: seller,
          role: 'seller',
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
      
      // Update wallet balances
      sellerWallet.balance += sellerEarnings;
      await sellerWallet.save({ session });
      
      platformWallet.balance += platformFee;
      await platformWallet.save({ session });
      
      // Create transactions
      const saleTransaction = new Transaction({
        type: 'sale',
        amount: sellerEarnings,
        from: buyer,
        to: seller,
        fromRole: 'buyer',
        toRole: 'seller',
        description: `Sale: ${order.title} (${sellerTier} tier - ${(tier.bonusPercentage * 100).toFixed(0)}% bonus)`,
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          orderId: order._id.toString(),
          listingTitle: order.title,
          sellerEarnings: sellerEarnings,
          tier: sellerTier,
          tierBonus: tierBonus
        }
      });
      await saleTransaction.save({ session });
      
      // Create tier credit transaction if there's a bonus
      if (tierBonus > 0) {
        const tierCreditTransaction = new Transaction({
          type: 'tier_credit',
          amount: tierBonus,
          from: 'platform',
          to: seller,
          fromRole: 'admin',
          toRole: 'seller',
          description: `Tier bonus (${sellerTier}): +${(tier.bonusPercentage * 100).toFixed(0)}%`,
          status: 'completed',
          completedAt: new Date(),
          metadata: {
            orderId: order._id.toString(),
            tier: sellerTier,
            bonusPercentage: tier.bonusPercentage
          }
        });
        await tierCreditTransaction.save({ session });
      }
      
      await session.commitTransaction();
      
      // Update seller tier after successful sale
      await this.updateSellerTier(seller);
      
      return {
        sellerEarnings,
        platformFee,
        tierBonus,
        tier: sellerTier
      };
      
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Audit log for tier changes
   */
  async logTierChange(username, oldTier, newTier, reason) {
    try {
      // You can create a TierAudit model if you want persistent logs
      const logEntry = {
        username,
        oldTier,
        newTier,
        reason,
        timestamp: new Date(),
        metadata: await this.calculateSellerStats(username)
      };
      
      // In production, save to audit log collection
      console.log('[TierAudit] Tier change:', JSON.stringify(logEntry, null, 2));
      
      return logEntry;
    } catch (error) {
      console.error('[TierAudit] Error logging tier change:', error);
    }
  }
  
  /**
   * Fix all sellers with old tier names
   */
  async fixAllSellerTiers() {
    try {
      console.log('[TierService] Fixing all seller tiers...');
      
      const sellers = await User.find({ role: 'seller' });
      let updated = 0;
      
      for (const seller of sellers) {
        // Calculate correct tier based on stats
        const stats = await this.calculateSellerStats(seller.username);
        const correctTier = TIER_CONFIG.getTierByStats(stats.totalSales, stats.totalRevenue);
        
        // Fix old tier name if needed
        const currentTier = TIER_CONFIG.fixTierName(seller.tier || 'Tease');
        
        if (currentTier !== correctTier || seller.tier !== correctTier) {
          seller.tier = correctTier;
          seller.totalSales = stats.totalSales;
          await seller.save();
          updated++;
          console.log(`[TierService] Fixed tier for ${seller.username}: ${currentTier} -> ${correctTier}`);
        }
      }
      
      console.log(`[TierService] Fixed ${updated} seller tiers`);
      return updated;
    } catch (error) {
      console.error('[TierService] Error fixing seller tiers:', error);
      throw error;
    }
  }
}

module.exports = new TierService();