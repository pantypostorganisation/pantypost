// src/services/paymentStats.service.ts

import { apiCall, API_ENDPOINTS } from './api.config';

export interface PaymentStats {
  totalPaymentsProcessed: number;
  updatedAt?: string;
  timestamp?: string;
}

export interface PaymentStatsResponse {
  success: boolean;
  data?: PaymentStats;
  error?: {
    code?: string;
    message?: string;
  };
}

class PaymentStatsService {
  private cache: PaymentStats | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async getPaymentsProcessed(): Promise<PaymentStatsResponse> {
    const now = Date.now();

    if (this.cache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return { success: true, data: this.cache };
    }

    try {
      const response = await apiCall<PaymentStats>(API_ENDPOINTS.STATS.PAYMENTS_PROCESSED);

      if (response.success && response.data) {
        this.cache = response.data;
        this.cacheTimestamp = now;
        return { success: true, data: response.data };
      }

      return {
        success: false,
        error: response.error || { message: 'Failed to fetch payments processed stats' }
      };
    } catch (error) {
      console.error('[PaymentStatsService] Error fetching stats:', error);

      if (this.cache) {
        return { success: true, data: this.cache };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error'
        }
      };
    }
  }

  updateCachedStats(partial: Partial<PaymentStats>) {
    if (!this.cache) {
      this.cache = {
        totalPaymentsProcessed: partial.totalPaymentsProcessed || 0,
        timestamp: partial.timestamp,
        updatedAt: partial.updatedAt,
      };
      this.cacheTimestamp = Date.now();
      return;
    }

    this.cache = {
      ...this.cache,
      ...partial,
    };
    this.cacheTimestamp = Date.now();
  }

  incrementCachedCount(amount = 1) {
    if (!this.cache) {
      return;
    }

    this.cache.totalPaymentsProcessed += amount;
    this.cacheTimestamp = Date.now();
  }

  clearCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export const paymentStatsService = new PaymentStatsService();
