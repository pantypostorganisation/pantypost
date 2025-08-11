// src/services/tierApi.ts
import { apiCall, ApiResponse, buildApiUrl } from './api.config';

export interface TierConfig {
  name: string;
  level: number;
  minSales: number;
  minRevenue: number;
  bonusPercentage: number;
  color: string;
  benefits: string[];
}

export interface TierProgress {
  currentTier: string;
  nextTier: string | null;
  salesProgress: number;
  revenueProgress: number;
  salesNeeded: number;
  revenueNeeded: number;
  stats: {
    totalSales: number;
    totalRevenue: number;
  };
}

export interface PublicTierConfig {
  tiers: Record<string, TierConfig>;
  tierOrder: string[];
}

export interface TierDistribution {
  tierName: string;
  count: number;
  percentage: number;
}

class TierApiService {
  /**
   * Get public tier configuration
   */
  async getPublicConfig(): Promise<ApiResponse<PublicTierConfig>> {
    try {
      return await apiCall<PublicTierConfig>('/tiers/config');
    } catch (error) {
      console.error('[TierAPI] Failed to get config:', error);
      return {
        success: false,
        error: {
          message: 'Failed to fetch tier configuration'
        }
      };
    }
  }
  
  /**
   * Get tier progress for a seller
   */
  async getTierProgress(username: string): Promise<ApiResponse<TierProgress>> {
    try {
      return await apiCall<TierProgress>(`/tiers/progress/${username}`);
    } catch (error) {
      console.error('[TierAPI] Failed to get progress:', error);
      return {
        success: false,
        error: {
          message: 'Failed to fetch tier progress'
        }
      };
    }
  }
  
  /**
   * Get tier preview (calculate what earnings would be at different tiers)
   */
  async getTierPreview(price: number): Promise<ApiResponse<any>> {
    try {
      return await apiCall<any>('/tiers/preview', {
        method: 'POST',
        body: JSON.stringify({ price })
      });
    } catch (error) {
      console.error('[TierAPI] Failed to get preview:', error);
      return {
        success: false,
        error: {
          message: 'Failed to get tier preview'
        }
      };
    }
  }
  
  /**
   * Admin: Get tier distribution across all sellers
   */
  async getTierDistribution(): Promise<ApiResponse<TierDistribution[]>> {
    try {
      return await apiCall<TierDistribution[]>('/tiers/distribution');
    } catch (error) {
      console.error('[TierAPI] Failed to get distribution:', error);
      return {
        success: false,
        error: {
          message: 'Failed to fetch tier distribution'
        }
      };
    }
  }
  
  /**
   * Admin: Manually update seller's tier
   */
  async updateSellerTier(username: string, tier: string): Promise<ApiResponse<any>> {
    try {
      return await apiCall<any>(`/tiers/admin/update/${username}`, {
        method: 'POST',
        body: JSON.stringify({ tier })
      });
    } catch (error) {
      console.error('[TierAPI] Failed to update tier:', error);
      return {
        success: false,
        error: {
          message: 'Failed to update seller tier'
        }
      };
    }
  }
  
  /**
   * Helper: Get tier color
   */
  getTierColor(tier: string): string {
    const colors: Record<string, string> = {
      'Tease': '#EC4899',     // Pink
      'Flirt': '#F97316',     // Orange  
      'Obsession': '#06B6D4', // Cyan
      'Desire': '#DC2626',    // Red
      'Goddess': '#FBBF24'    // Gold
    };
    return colors[tier] || '#6B7280'; // Default gray
  }
  
  /**
   * Helper: Get tier icon
   */
  getTierIcon(tier: string): string {
    const icons: Record<string, string> = {
      'Tease': '💋',
      'Flirt': '😘',
      'Obsession': '💎',
      'Desire': '❤️',
      'Goddess': '👑'
    };
    return icons[tier] || '⭐';
  }
  
  /**
   * Helper: Format tier badge text
   */
  formatTierBadge(tier: string, stats?: { totalSales: number }): string {
    if (!stats) return tier;
    return `${tier} (${stats.totalSales} sales)`;
  }
  
  /**
   * Helper: Calculate potential earnings with tier
   */
  calculateEarningsWithTier(price: number, tier: string): number {
    const bonusPercentages: Record<string, number> = {
      'Tease': 0,
      'Flirt': 0.01,
      'Obsession': 0.02,
      'Desire': 0.03,
      'Goddess': 0.05
    };
    
    const baseSellerPercentage = 0.90; // 90% base
    const bonus = bonusPercentages[tier] || 0;
    const totalPercentage = baseSellerPercentage + bonus;
    
    return Math.round(price * totalPercentage * 100) / 100;
  }
  
  /**
   * Helper: Get tier requirements
   */
  getTierRequirements(tier: string): { sales: number; revenue: number } {
    const requirements: Record<string, { sales: number; revenue: number }> = {
      'Tease': { sales: 0, revenue: 0 },
      'Flirt': { sales: 10, revenue: 100 },
      'Obsession': { sales: 50, revenue: 500 },
      'Desire': { sales: 100, revenue: 1000 },
      'Goddess': { sales: 500, revenue: 10000 }
    };
    return requirements[tier] || { sales: 0, revenue: 0 };
  }
  
  /**
   * Helper: Check if tier is highest
   */
  isHighestTier(tier: string): boolean {
    return tier === 'Goddess';
  }
  
  /**
   * Helper: Get next tier name
   */
  getNextTierName(currentTier: string): string | null {
    const tierOrder = ['Tease', 'Flirt', 'Obsession', 'Desire', 'Goddess'];
    const currentIndex = tierOrder.indexOf(currentTier);
    
    if (currentIndex === -1 || currentIndex === tierOrder.length - 1) {
      return null;
    }
    
    return tierOrder[currentIndex + 1];
  }
}

// Export singleton instance
export const tierApiService = new TierApiService();