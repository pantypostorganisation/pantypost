// pantypost-backend/config/tierConfig.js
const TIER_CONFIG = {
  tiers: {
    Tease: {
      name: 'Tease',
      level: 1,
      minSales: 0,
      minRevenue: 0,
      sellerPercentage: 0.90, // Seller gets 90% (platform gets 10%)
      bonusPercentage: 0.00,  // No bonus at this tier
      color: '#EC4899',       // Pink
      icon: '💋',
      benefits: [
        'Base 90% commission on all sales',
        'Access to basic seller tools',
        'Standard listing features'
      ]
    },
    Flirt: {
      name: 'Flirt',
      level: 2,
      minSales: 10,
      minRevenue: 5000,
      sellerPercentage: 0.91, // Seller gets 91% (platform gets 9%)
      bonusPercentage: 0.01,  // 1% bonus
      color: '#F97316',       // Orange
      icon: '😘',
      benefits: [
        '91% commission on all sales (+1% bonus)',
        'Priority in search results',
        'Featured seller badge'
      ]
    },
    Obsession: {
      name: 'Obsession',
      level: 3,
      minSales: 101,
      minRevenue: 12500,
      sellerPercentage: 0.92, // Seller gets 92% (platform gets 8%)
      bonusPercentage: 0.02,  // 2% bonus
      color: '#06B6D4',       // Cyan
      icon: '💎',
      benefits: [
        '92% commission on all sales (+2% bonus)',
        'Premium seller badge',
        'Access to exclusive features',
        'Priority customer support'
      ]
    },
    Desire: {
      name: 'Desire',
      level: 4,
      minSales: 251,
      minRevenue: 75000,
      sellerPercentage: 0.93, // Seller gets 93% (platform gets 7%)
      bonusPercentage: 0.03,  // 3% bonus
      color: '#DC2626',       // Red
      icon: '❤️',
      benefits: [
        '93% commission on all sales (+3% bonus)',
        'Top tier visibility',
        'Advanced analytics',
        'Custom profile features'
      ]
    },
    Goddess: {
      name: 'Goddess',
      level: 5,
      minSales: 1001,
      minRevenue: 150000,
      sellerPercentage: 0.95, // Seller gets 95% (platform gets 5%)
      bonusPercentage: 0.05,  // 5% bonus
      color: '#FBBF24',       // Gold
      icon: '👑',
      benefits: [
        '95% commission on all sales (+5% bonus)',
        'Highest tier status',
        'VIP support',
        'All premium features unlocked',
        'Special recognition badge'
      ]
    }
  },
  
  // Tier order for progression
  tierOrder: ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'],
  
  /**
   * Get tier by name
   */
  getTierByName(tierName) {
    // Handle old tier names for backwards compatibility
    const tierMapping = {
      'Tempt': 'Flirt',
      'Indulge': 'Obsession',
      'Crave': 'Desire'
    };
    
    const mappedTier = tierMapping[tierName] || tierName;
    return this.tiers[mappedTier] || this.tiers.Tease;
  },
  
  /**
   * Get tier by seller stats - USES OR LOGIC (matches frontend)
   */
  getTierByStats(totalSales, totalRevenue) {
    // Check tiers in reverse order (highest first)
    const reversedTiers = [...this.tierOrder].reverse();
    
    for (const tierName of reversedTiers) {
      const tier = this.tiers[tierName];
      // IMPORTANT: OR logic - meet EITHER sales OR revenue requirement
      if (totalSales >= tier.minSales || totalRevenue >= tier.minRevenue) {
        return tierName;
      }
    }
    
    return 'Tease'; // Default tier
  },
  
  /**
   * Get next tier
   */
  getNextTier(currentTier) {
    // Handle old tier names
    const tierMapping = {
      'Tempt': 'Flirt',
      'Indulge': 'Obsession',
      'Crave': 'Desire'
    };
    
    const mappedTier = tierMapping[currentTier] || currentTier;
    const currentIndex = this.tierOrder.indexOf(mappedTier);
    
    if (currentIndex === -1 || currentIndex === this.tierOrder.length - 1) {
      return null; // No next tier
    }
    return this.tierOrder[currentIndex + 1];
  },
  
  /**
   * Get previous tier
   */
  getPreviousTier(currentTier) {
    // Handle old tier names
    const tierMapping = {
      'Tempt': 'Flirt',
      'Indulge': 'Obsession',
      'Crave': 'Desire'
    };
    
    const mappedTier = tierMapping[currentTier] || currentTier;
    const currentIndex = this.tierOrder.indexOf(mappedTier);
    
    if (currentIndex <= 0) {
      return null; // No previous tier
    }
    return this.tierOrder[currentIndex - 1];
  },
  
  /**
   * Calculate seller earnings based on tier
   */
  calculateSellerEarnings(price, tierName) {
    const tier = this.getTierByName(tierName);
    const earnings = price * tier.sellerPercentage;
    return Math.round(earnings * 100) / 100;
  },
  
  /**
   * Calculate platform fee based on tier
   */
  calculatePlatformFee(price, tierName) {
    const tier = this.getTierByName(tierName);
    const platformPercentage = 1 - tier.sellerPercentage;
    const fee = price * platformPercentage;
    return Math.round(fee * 100) / 100;
  },
  
  /**
   * Get public configuration (safe to send to frontend)
   */
  getPublicConfig() {
    const publicConfig = {
      tiers: {},
      tierOrder: this.tierOrder
    };
    
    for (const [key, tier] of Object.entries(this.tiers)) {
      publicConfig.tiers[key] = {
        name: tier.name,
        level: tier.level,
        minSales: tier.minSales,
        minRevenue: tier.minRevenue,
        bonusPercentage: tier.bonusPercentage,
        color: tier.color,
        icon: tier.icon,
        benefits: tier.benefits
      };
    }
    
    return publicConfig;
  },
  
  /**
   * Fix old tier name to new tier name
   */
  fixTierName(tierName) {
    const tierMapping = {
      'Tempt': 'Flirt',
      'Indulge': 'Obsession',
      'Crave': 'Desire'
    };
    
    return tierMapping[tierName] || tierName;
  }
};

module.exports = TIER_CONFIG;