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
        const normalized = Math.round(Number(response.data.totalPaymentsProcessed || 0) * 100) / 100;
        this.cache = {
          ...response.data,
          totalPaymentsProcessed: normalized,
        };
        this.cacheTimestamp = now;
        return { success: true, data: this.cache };
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
    const hasTotal = partial.totalPaymentsProcessed !== undefined;
    const normalizedTotal = hasTotal
      ? Math.round(Number(partial.totalPaymentsProcessed || 0) * 100) / 100
      : undefined;

    if (!this.cache) {
      this.cache = {
        totalPaymentsProcessed: normalizedTotal ?? 0,
        timestamp: partial.timestamp,
        updatedAt: partial.updatedAt,
      };
      this.cacheTimestamp = Date.now();
      return;
    }

    this.cache = {
      ...this.cache,
      ...partial,
      totalPaymentsProcessed: hasTotal && normalizedTotal !== undefined
        ? normalizedTotal
        : this.cache.totalPaymentsProcessed,
    };
    this.cacheTimestamp = Date.now();
  }

  incrementCachedCount(amount = 1) {
    if (!this.cache) {
      return;
    }

    const normalizedAmount = Math.round(Number(amount) * 100) / 100;
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return;
    }

    this.cache.totalPaymentsProcessed = Math.round(
      (this.cache.totalPaymentsProcessed + normalizedAmount) * 100
    ) / 100;
    this.cacheTimestamp = Date.now();
  }

  clearCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export const paymentStatsService = new PaymentStatsService();
