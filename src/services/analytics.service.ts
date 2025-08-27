// src/services/analytics.service.ts

import { API_ENDPOINTS, apiCall, ApiResponse } from './api.config';
import { sanitizeStrict } from '@/utils/security/sanitization';

// Analytics data types
export interface RevenueMetrics {
  total: number;
  thisMonth: number;
  lastMonth: number;
  thisWeek: number;
  lastWeek: number;
  monthlyGrowth: number;
  weeklyGrowth: number;
  averageOrderValue: number;
  subscriptionRevenue: number;
}

export interface OrderMetrics {
  total: number;
  thisMonth: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  recent: Array<{
    _id: string;
    title: string;
    buyer: string;
    price: number;
    markedUpPrice: number;
    date: string;
    shippingStatus: string;
    wasAuction: boolean;
    tierCreditAmount?: number;
  }>;
}

export interface ListingMetrics {
  total: number;
  active: number;
  sold: number;
  activeAuctions: number;
  totalViews: number;
  conversionRate: number;
  topPerforming: Array<{
    _id: string;
    title: string;
    price: number;
    views: number;
    status: string;
  }>;
}

export interface SubscriberMetrics {
  count: number;
  monthlyRevenue: number;
  monthlyRevenueEarnings?: number;
  subscriptionPrice?: number;
}

export interface RatingMetrics {
  average: number;
  totalReviews: number;
}

export interface SellerOverview {
  revenue: RevenueMetrics;
  orders: OrderMetrics;
  listings: ListingMetrics;
  subscribers: SubscriberMetrics;
  ratings: RatingMetrics;
}

export interface RevenueDataPoint {
  _id: string | number;
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
}

export interface RevenueData {
  period: string;
  startDate: string;
  revenueData: RevenueDataPoint[];
}

export interface SubscriberDetail {
  username: string;
  subscribedAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  subscriptionPrice: number;
}

export interface SubscriberAnalytics {
  totalSubscribers: number;
  monthlyRecurringRevenue: number;
  monthlyRecurringRevenueEarnings?: number;
  subscribers: SubscriberDetail[];
  churnRate: number;
  averageSubscriberValue: number;
  subscriptionPrice?: number;
}

export interface ProductMetric {
  id: string;
  title: string;
  status: string;
  type: 'auction' | 'regular';
  price: number;
  views: number;
  orderCount: number;
  revenue: number;
  conversionRate: number;
  createdAt: string;
  lastSold: string | null;
}

export interface ProductAnalytics {
  summary: {
    totalProducts: number;
    activeProducts: number;
    totalRevenue: number;
    totalViews: number;
    totalOrders: number;
    averageConversionRate: number;
  };
  products: ProductMetric[];
}

export interface PerformanceComparison {
  period: number;
  current: {
    orders: number;
    revenue: number;
    avgOrderValue: number;
  };
  previous: {
    orders: number;
    revenue: number;
    avgOrderValue: number;
  };
  changes: {
    orders: number;
    revenue: number;
    avgOrderValue: number;
  };
}

/**
 * Analytics Service
 * Handles all analytics-related API operations for sellers
 */
export class AnalyticsService {
  private static instance: AnalyticsService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Get seller overview analytics
   */
  async getSellerOverview(): Promise<ApiResponse<SellerOverview>> {
    try {
      const cacheKey = 'seller_overview';
      const cached = this.getCached<SellerOverview>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await apiCall<SellerOverview>('/analytics/seller/overview', {
        method: 'GET',
      });

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data);
      }

      return response;
    } catch (error) {
      console.error('[AnalyticsService] Error fetching seller overview:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch analytics data',
        },
      };
    }
  }

  /**
   * Get revenue data for specific period
   */
  async getRevenueData(
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily'
  ): Promise<ApiResponse<RevenueData>> {
    try {
      const cacheKey = `revenue_${period}`;
      const cached = this.getCached<RevenueData>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await apiCall<RevenueData>(`/analytics/seller/revenue/${period}`, {
        method: 'GET',
      });

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data);
      }

      return response;
    } catch (error) {
      console.error('[AnalyticsService] Error fetching revenue data:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch revenue data',
        },
      };
    }
  }

  /**
   * Get detailed subscriber analytics
   */
  async getSubscriberAnalytics(): Promise<ApiResponse<SubscriberAnalytics>> {
    try {
      const cacheKey = 'subscriber_analytics';
      const cached = this.getCached<SubscriberAnalytics>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await apiCall<SubscriberAnalytics>('/analytics/seller/subscribers', {
        method: 'GET',
      });

      if (response.success && response.data) {
        // Sanitize subscriber usernames
        if (response.data.subscribers) {
          response.data.subscribers = response.data.subscribers.map(sub => ({
            ...sub,
            username: sanitizeStrict(sub.username),
          }));
        }
        this.setCache(cacheKey, response.data);
      }

      return response;
    } catch (error) {
      console.error('[AnalyticsService] Error fetching subscriber analytics:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch subscriber analytics',
        },
      };
    }
  }

  /**
   * Get product performance analytics
   */
  async getProductAnalytics(): Promise<ApiResponse<ProductAnalytics>> {
    try {
      const cacheKey = 'product_analytics';
      const cached = this.getCached<ProductAnalytics>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await apiCall<ProductAnalytics>('/analytics/seller/products', {
        method: 'GET',
      });

      if (response.success && response.data) {
        // Sanitize product titles
        if (response.data.products) {
          response.data.products = response.data.products.map(product => ({
            ...product,
            title: sanitizeStrict(product.title),
          }));
        }
        this.setCache(cacheKey, response.data);
      }

      return response;
    } catch (error) {
      console.error('[AnalyticsService] Error fetching product analytics:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch product analytics',
        },
      };
    }
  }

  /**
   * Get performance comparison between periods
   */
  async getPerformanceComparison(days: number = 30): Promise<ApiResponse<PerformanceComparison>> {
    try {
      const cacheKey = `comparison_${days}`;
      const cached = this.getCached<PerformanceComparison>(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await apiCall<PerformanceComparison>(
        `/analytics/seller/comparison?period=${days}`,
        {
          method: 'GET',
        }
      );

      if (response.success && response.data) {
        this.setCache(cacheKey, response.data);
      }

      return response;
    } catch (error) {
      console.error('[AnalyticsService] Error fetching comparison data:', error);
      return {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch comparison data',
        },
      };
    }
  }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cached data if available and not expired
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cache data
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Calculate tier bonus from revenue
   */
  calculateTierBonus(baseRevenue: number, tier?: string): number {
    const tierBonuses: Record<string, number> = {
      Tease: 0,
      Flirt: 0.02, // 2% bonus
      Obsession: 0.05, // 5% bonus
      Desire: 0.08, // 8% bonus
      Goddess: 0.10, // 10% bonus
    };

    const bonusRate = tierBonuses[tier || 'Tease'] || 0;
    return Math.round(baseRevenue * bonusRate * 100) / 100;
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Calculate growth percentage
   */
  calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 100) / 100;
  }
}

// Export singleton instance
export const analyticsService = AnalyticsService.getInstance();