// src/services/paymentStats.service.ts

import { apiCall, API_ENDPOINTS } from './api.config';

export interface PaymentStats {
  // Genuine processed payment volume.
  totalPaymentsProcessed: number;
  actualPaymentsProcessed?: number;

  // Public hero counter fields.
  displayedCounterTotal?: number;
  heroDisplayAdjustmentEnabled?: boolean;
  counterLabel?: string;

  updatedAt?: string;
  timestamp?: string;
}

export interface HeroCounterAdminState extends PaymentStats {
  heroDisplayAdjustment: number;
  heroDisplayAdjustmentUpdatedAt?: string | null;
  heroDisplayAdjustmentUpdatedBy?: string | null;
}

export interface PaymentStatsResponse {
  success: boolean;
  data?: PaymentStats;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface HeroCounterAdminResponse {
  success: boolean;
  data?: HeroCounterAdminState;
  error?: {
    code?: string;
    message?: string;
  };
}

function normalizeMoney(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, Math.round(numeric * 100) / 100);
}

function normalizePaymentStats(data: PaymentStats): PaymentStats {
  const totalPaymentsProcessed = normalizeMoney(data.totalPaymentsProcessed);
  const actualPaymentsProcessed = normalizeMoney(
    data.actualPaymentsProcessed ?? totalPaymentsProcessed
  );
  const displayedCounterTotal = normalizeMoney(
    data.displayedCounterTotal ?? actualPaymentsProcessed
  );

  return {
    ...data,
    totalPaymentsProcessed,
    actualPaymentsProcessed,
    displayedCounterTotal,
    heroDisplayAdjustmentEnabled: Boolean(data.heroDisplayAdjustmentEnabled),
    counterLabel:
      data.counterLabel ||
      (data.heroDisplayAdjustmentEnabled
        ? 'Promotional counter'
        : 'Payments processed'),
  };
}

function normalizeHeroCounterAdminState(
  data: HeroCounterAdminState
): HeroCounterAdminState {
  return {
    ...normalizePaymentStats(data),
    heroDisplayAdjustment: normalizeMoney(data.heroDisplayAdjustment),
    heroDisplayAdjustmentUpdatedAt:
      data.heroDisplayAdjustmentUpdatedAt ?? null,
    heroDisplayAdjustmentUpdatedBy:
      data.heroDisplayAdjustmentUpdatedBy ?? null,
  };
}

class PaymentStatsService {
  private cache: PaymentStats | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async getPaymentsProcessed(): Promise<PaymentStatsResponse> {
    const now = Date.now();

    if (this.cache && now - this.cacheTimestamp < this.CACHE_DURATION) {
      return { success: true, data: this.cache };
    }

    try {
      const response = await apiCall<PaymentStats>(
        API_ENDPOINTS.STATS.PAYMENTS_PROCESSED
      );

      if (response.success && response.data) {
        this.cache = normalizePaymentStats(response.data);
        this.cacheTimestamp = now;
        return { success: true, data: this.cache };
      }

      return {
        success: false,
        error:
          response.error || {
            message: 'Failed to fetch payments processed stats',
          },
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
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  async getHeroCounterSettings(): Promise<HeroCounterAdminResponse> {
    try {
      const response = await apiCall<HeroCounterAdminState>(
        API_ENDPOINTS.STATS.HERO_COUNTER_ADMIN
      );

      if (response.success && response.data) {
        return {
          success: true,
          data: normalizeHeroCounterAdminState(response.data),
        };
      }

      return {
        success: false,
        error:
          response.error || {
            message: 'Failed to fetch hero counter settings',
          },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch hero counter settings',
        },
      };
    }
  }

  async setHeroCounterAdjustment(
    amount: number
  ): Promise<HeroCounterAdminResponse> {
    try {
      const response = await apiCall<HeroCounterAdminState>(
        API_ENDPOINTS.STATS.HERO_COUNTER_ADMIN,
        {
          method: 'PATCH',
          body: JSON.stringify({ amount }),
        }
      );

      if (response.success && response.data) {
        const normalized = normalizeHeroCounterAdminState(response.data);
        this.clearCache();
        return { success: true, data: normalized };
      }

      return {
        success: false,
        error:
          response.error || {
            message: 'Failed to update hero counter adjustment',
          },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to update hero counter adjustment',
        },
      };
    }
  }

  async removeHeroCounterAdjustment(): Promise<HeroCounterAdminResponse> {
    try {
      const response = await apiCall<HeroCounterAdminState>(
        API_ENDPOINTS.STATS.HERO_COUNTER_ADMIN,
        {
          method: 'DELETE',
        }
      );

      if (response.success && response.data) {
        const normalized = normalizeHeroCounterAdminState(response.data);
        this.clearCache();
        return { success: true, data: normalized };
      }

      return {
        success: false,
        error:
          response.error || {
            message: 'Failed to remove hero counter adjustment',
          },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to remove hero counter adjustment',
        },
      };
    }
  }

  updateCachedStats(partial: Partial<PaymentStats>) {
    const merged = normalizePaymentStats({
      ...(this.cache || { totalPaymentsProcessed: 0 }),
      ...partial,
      totalPaymentsProcessed:
        partial.totalPaymentsProcessed ??
        this.cache?.totalPaymentsProcessed ??
        0,
    });

    this.cache = merged;
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

    const actual = normalizeMoney(
      this.cache.actualPaymentsProcessed ??
        this.cache.totalPaymentsProcessed
    );
    const displayed = normalizeMoney(
      this.cache.displayedCounterTotal ?? actual
    );

    this.cache = {
      ...this.cache,
      totalPaymentsProcessed: normalizeMoney(
        this.cache.totalPaymentsProcessed + normalizedAmount
      ),
      actualPaymentsProcessed: normalizeMoney(actual + normalizedAmount),
      displayedCounterTotal: normalizeMoney(displayed + normalizedAmount),
    };
    this.cacheTimestamp = Date.now();
  }

  clearCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export const paymentStatsService = new PaymentStatsService();
