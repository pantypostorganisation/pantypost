// src/services/tip.service.ts
import { sanitizeStrict, sanitizeCurrency } from '@/utils/security/sanitization';
import { z } from 'zod';
import { apiClient } from './api.config';

// Validation schemas
const tipAmountSchema = z.number().min(1).max(500);
const tipMessageSchema = z.string().max(500).optional();

export interface TipTransaction {
  id: string;
  from?: string;
  to?: string;
  amount: number;
  message?: string;
  date: string;
}

export interface TipStats {
  totalTips: number;
  totalAmount: number;
  averageTip: number;
  largestTip: number;
  uniqueTippers: number;
  recentTips: Array<{
    from: string;
    amount: number;
    date: string;
  }>;
}

class TipService {
  /**
   * Send a tip to a seller
   */
  async sendTip(
    recipientUsername: string, 
    amount: number, 
    message?: string
  ): Promise<{ success: boolean; message: string; transactionId?: string }> {
    try {
      // Validate inputs
      const validatedAmount = tipAmountSchema.parse(amount);
      const sanitizedRecipient = sanitizeStrict(recipientUsername);
      const sanitizedMessage = message ? sanitizeStrict(message) : undefined;
      
      if (sanitizedMessage) {
        tipMessageSchema.parse(sanitizedMessage);
      }

      // Use the API client to make the request to the backend
      const response = await apiClient.call<any>(
        '/tips/send',
        {
          method: 'POST',
          body: JSON.stringify({
            amount: validatedAmount,
            recipientUsername: sanitizedRecipient,
            message: sanitizedMessage
          })
        }
      );

      if (response.success) {
        return {
          success: true,
          message: response.data?.message || `Successfully sent $${validatedAmount.toFixed(2)} tip`,
          transactionId: response.data?.transaction?.id
        };
      } else {
        return {
          success: false,
          message: response.error?.message || 
                   (typeof response.error === 'string' ? response.error : 'Failed to send tip')
        };
      }

    } catch (error) {
      console.error('[TipService] Error sending tip:', error);
      
      if (error instanceof z.ZodError) {
        return {
          success: false,
          message: 'Invalid tip amount or message'
        };
      }
      
      return {
        success: false,
        message: 'Failed to send tip. Please try again.'
      };
    }
  }

  /**
   * Get tips received by a seller
   */
  async getReceivedTips(
    username?: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<{ tips: TipTransaction[]; total: number; count: number }> {
    try {
      const params = new URLSearchParams();
      
      if (username) {
        params.append('username', sanitizeStrict(username));
      }
      
      if (options?.startDate) {
        params.append('startDate', options.startDate.toISOString());
      }
      
      if (options?.endDate) {
        params.append('endDate', options.endDate.toISOString());
      }
      
      if (options?.limit) {
        params.append('limit', Math.min(options.limit, 100).toString());
      }

      const response = await apiClient.call<any>(
        `/tips/received?${params}`,
        { method: 'GET' }
      );

      if (response.success && response.data) {
        return response.data.data || { tips: [], total: 0, count: 0 };
      }

      return { tips: [], total: 0, count: 0 };

    } catch (error) {
      console.error('[TipService] Error fetching received tips:', error);
      return { tips: [], total: 0, count: 0 };
    }
  }

  /**
   * Get tips sent by a buyer
   */
  async getSentTips(
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<{ tips: TipTransaction[]; total: number; count: number }> {
    try {
      const params = new URLSearchParams();
      
      if (options?.startDate) {
        params.append('startDate', options.startDate.toISOString());
      }
      
      if (options?.endDate) {
        params.append('endDate', options.endDate.toISOString());
      }
      
      if (options?.limit) {
        params.append('limit', Math.min(options.limit, 100).toString());
      }

      const response = await apiClient.call<any>(
        `/tips/sent?${params}`,
        { method: 'GET' }
      );

      if (response.success && response.data) {
        return response.data.data || { tips: [], total: 0, count: 0 };
      }

      return { tips: [], total: 0, count: 0 };

    } catch (error) {
      console.error('[TipService] Error fetching sent tips:', error);
      return { tips: [], total: 0, count: 0 };
    }
  }

  /**
   * Get tip statistics for a seller
   */
  async getTipStats(username: string): Promise<TipStats | null> {
    try {
      const sanitizedUsername = sanitizeStrict(username);
      
      const response = await apiClient.call<any>(
        `/tips/stats/${sanitizedUsername}`,
        { method: 'GET' }
      );

      if (response.success && response.data) {
        return response.data.data;
      }

      return null;

    } catch (error) {
      console.error('[TipService] Error fetching tip stats:', error);
      return null;
    }
  }
}

export const tipService = new TipService();