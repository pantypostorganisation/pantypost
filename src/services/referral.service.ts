// src/services/referral.service.ts

import { apiCall, buildApiUrl, ApiResponse } from './api.config';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';
import { z } from 'zod';

// ==================== TYPES ====================

export interface ReferralCode {
  code: string | null; // Code can be null if not created yet
  referralUrl: string | null;
  usageCount: number;
  clickCount: number;
  conversionRate: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface ReferralStats {
  stats: {
    totalReferrals: number;
    totalEarnings: number;
    totalSales: number;
    activeReferrals: Array<{
      username: string;
      earnings: number;
      sales: number;
      joinedDate: string;
    }>;
  };
  code: ReferralCode | null;
  recentCommissions: Array<{
    id: string;
    amount: number;
    orderId: string;
    seller: string;
    date: string;
    status: string;
  }>;
}

export interface ReferredSeller {
  id: string;
  username: string;
  profilePic?: string;
  isVerified: boolean;
  totalSales: number;
  joinedDate: string;
  totalEarnings: number;
  totalCommissions: number;
  lastEarningDate?: string;
  status: string;
}

export interface Commission {
  id: string;
  amount: number;
  orderId: string;
  seller: string;
  date: string;
  status: 'earned' | 'paid' | 'pending' | 'cancelled';
  rate: number;
}

export interface CommissionTotals {
  earned: { amount: number; count: number };
  paid: { amount: number; count: number };
  pending: { amount: number; count: number };
  total: { amount: number; count: number };
}

// ==================== VALIDATION SCHEMAS ====================

const referralCodeSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be at most 20 characters')
    .regex(/^[A-Z0-9_-]+$/i, 'Code can only contain letters, numbers, underscore, and hyphen')
    .transform(val => val.toUpperCase()),
});

// ==================== REFERRAL SERVICE ====================

class ReferralService {
  private static instance: ReferralService;

  static getInstance(): ReferralService {
    if (!ReferralService.instance) {
      ReferralService.instance = new ReferralService();
    }
    return ReferralService.instance;
  }

  /**
   * Get user's referral code
   */
  async getMyReferralCode(): Promise<ApiResponse<ReferralCode>> {
    try {
      return await apiCall<ReferralCode>('/referral/code');
    } catch (error) {
      console.error('[ReferralService] Get code error:', error);
      return {
        success: false,
        error: { message: 'Failed to get referral code' }
      };
    }
  }

  /**
   * Create or update custom referral code
   */
  async updateReferralCode(code: string): Promise<ApiResponse<{ code: string; referralUrl: string; message: string }>> {
    try {
      // Validate code format
      const validation = referralCodeSchema.safeParse({ code });
      if (!validation.success) {
        return {
          success: false,
          error: { message: validation.error.errors[0].message }
        };
      }

      return await apiCall('/referral/code', {
        method: 'POST',
        body: JSON.stringify({ code: validation.data.code })
      });
    } catch (error) {
      console.error('[ReferralService] Update code error:', error);
      return {
        success: false,
        error: { message: 'Failed to update referral code' }
      };
    }
  }

  /**
   * Delete referral code
   */
  async deleteReferralCode(): Promise<ApiResponse<{ message: string }>> {
    try {
      return await apiCall('/referral/code', {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('[ReferralService] Delete code error:', error);
      return {
        success: false,
        error: { message: 'Failed to delete referral code' }
      };
    }
  }

  /**
   * Validate a referral code (for signup flow)
   */
  async validateReferralCode(code: string): Promise<ApiResponse<{
    valid: boolean;
    code: string;
    referrer: {
      username: string;
      profilePic?: string;
    };
  }>> {
    try {
      const sanitizedCode = sanitizeStrict(code).toUpperCase();
      return await apiCall(`/referral/validate/${encodeURIComponent(sanitizedCode)}`);
    } catch (error) {
      console.error('[ReferralService] Validate code error:', error);
      return {
        success: false,
        error: { message: 'Invalid referral code' }
      };
    }
  }

  /**
   * Get referral statistics
   */
  async getReferralStats(): Promise<ApiResponse<ReferralStats>> {
    try {
      return await apiCall<ReferralStats>('/referral/stats');
    } catch (error) {
      console.error('[ReferralService] Get stats error:', error);
      return {
        success: false,
        error: { message: 'Failed to get referral statistics' }
      };
    }
  }

  /**
   * Get list of referred sellers
   */
  async getReferredSellers(page = 1, limit = 20): Promise<ApiResponse<{
    referrals: ReferredSeller[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    try {
      return await apiCall(`/referral/referrals?page=${page}&limit=${limit}`);
    } catch (error) {
      console.error('[ReferralService] Get referrals error:', error);
      return {
        success: false,
        error: { message: 'Failed to get referred sellers' }
      };
    }
  }

  /**
   * Get commission history
   */
  async getCommissions(
    page = 1,
    limit = 50,
    status?: 'earned' | 'paid' | 'pending' | 'cancelled'
  ): Promise<ApiResponse<{
    commissions: Commission[];
    totals: CommissionTotals;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (status) {
        params.append('status', status);
      }
      return await apiCall(`/referral/commissions?${params.toString()}`);
    } catch (error) {
      console.error('[ReferralService] Get commissions error:', error);
      return {
        success: false,
        error: { message: 'Failed to get commission history' }
      };
    }
  }

  /**
   * Format referral URL for display
   */
  formatReferralUrl(code: string | null): string {
    if (!code) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}/signup/${code}`;
  }

  /**
   * Copy referral link to clipboard
   */
  async copyReferralLink(code: string | null): Promise<boolean> {
    if (!code) return false;
    try {
      const url = this.formatReferralUrl(code);
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error('[ReferralService] Copy to clipboard error:', error);
      return false;
    }
  }

  /**
   * Generate share text for social media
   */
  generateShareText(code: string | null): {
    twitter: string;
    facebook: string;
    whatsapp: string;
    email: { subject: string; body: string };
  } {
    if (!code) {
      return {
        twitter: '',
        facebook: '',
        whatsapp: '',
        email: { subject: '', body: '' }
      };
    }

    const url = this.formatReferralUrl(code);
    const text = `Join PantyPost using my referral code ${code} and start earning today!`;
    
    return {
      twitter: `${text} ${url}`,
      facebook: url,
      whatsapp: `${text} ${url}`,
      email: {
        subject: 'Join PantyPost - Exclusive Referral',
        body: `Hi!\n\n${text}\n\nSign up here: ${url}\n\nSee you there!`
      }
    };
  }

  /**
   * Track referral click (for analytics)
   */
  async trackReferralClick(code: string, source?: string): Promise<void> {
    try {
      // This would be called when someone clicks on a referral link
      // Could send analytics to backend
      console.log('[ReferralService] Tracking click:', { code, source });
    } catch (error) {
      console.error('[ReferralService] Track click error:', error);
    }
  }
}

// Export singleton instance
export const referralService = ReferralService.getInstance();

// Also export as default
export default referralService;