// src/services/reports.service.ts
import { apiCall, buildApiUrl, FEATURES } from './api.config';

export interface SubmitReportData {
  reportedUser: string;
  reportType: 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other';
  description: string;
  evidence?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
  relatedMessageId?: string;
}

export interface ProcessReportData {
  action: 'ban' | 'dismiss' | 'resolve';
  banDuration?: number | 'permanent';
  reason?: string;
  notes?: string;
}

export interface Report {
  id: string;
  reporter: string;
  reportee: string;
  date: string;
  category: 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  adminNotes: string;
  processed: boolean;
  processedAt?: string;
  banApplied?: boolean;
}

export interface ReportResponse {
  success: boolean;
  data?: any;
  error?: any;
}

class ReportsService {
  async submitReport(data: SubmitReportData): Promise<ReportResponse> {
    console.log('[ReportsService] Submitting report:', data);
    
    try {
      const response = await apiCall<any>('/reports/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.success) {
        console.log('[ReportsService] Report submitted successfully');
      } else {
        // Check if it's a rate limit error
        if (response.error?.code === 'INVALID_CONTENT_TYPE' && 
            response.error?.message?.includes('Invalid response format')) {
          console.warn('[ReportsService] Rate limited (429) - too many reports submitted');
          
          return { 
            success: false, 
            error: {
              code: 'RATE_LIMITED',
              message: 'You have submitted too many reports (limit: 20 per hour). Please try again later.'
            }
          };
        }
      }

      return response;
      
    } catch (error: any) {
      console.error('[ReportsService] Error submitting report:', error);
      
      // Check if it looks like a rate limit error
      if (error?.message?.includes('429') || error?.message?.includes('Too many')) {
        return { 
          success: false, 
          error: {
            code: 'RATE_LIMITED',
            message: 'You have submitted too many reports (limit: 20 per hour). Please try again later.'
          }
        };
      }
      
      // For other errors, return the error
      return { 
        success: false, 
        error: {
          code: 'NETWORK_ERROR',
          message: 'Could not submit report. Please check your connection and try again.'
        }
      };
    }
  }

  async getReports(params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    reportType?: string;
  }): Promise<ReportResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    try {
      return await apiCall(`/reports?${queryParams.toString()}`, {
        method: 'GET'
      });
    } catch (error) {
      console.error('[ReportsService] Error fetching reports:', error);
      return { 
        success: false, 
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to fetch reports'
        }
      };
    }
  }

  async getReportById(id: string): Promise<ReportResponse> {
    try {
      return await apiCall(buildApiUrl('/reports/:id', { id }), {
        method: 'GET'
      });
    } catch (error) {
      console.error('[ReportsService] Error fetching report:', error);
      return { success: false, error };
    }
  }

  async updateReport(id: string, updates: {
    status?: string;
    adminNotes?: string;
    category?: string;
    severity?: string;
  }): Promise<ReportResponse> {
    try {
      return await apiCall(buildApiUrl('/reports/:id', { id }), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('[ReportsService] Error updating report:', error);
      return { success: false, error };
    }
  }

  async processReport(id: string, data: ProcessReportData): Promise<ReportResponse> {
    try {
      return await apiCall(buildApiUrl('/reports/:id/process', { id }), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('[ReportsService] Error processing report:', error);
      return { success: false, error };
    }
  }

  async getReportStats(): Promise<ReportResponse> {
    try {
      return await apiCall('/reports/stats', {
        method: 'GET'
      });
    } catch (error) {
      console.error('[ReportsService] Error fetching stats:', error);
      return { success: false, error };
    }
  }

  async getUserReports(username: string, includeResolved = false): Promise<ReportResponse> {
    try {
      return await apiCall(
        buildApiUrl('/reports/user/:username', { username }) + 
        `?includeResolved=${includeResolved}`, 
        {
          method: 'GET'
        }
      );
    } catch (error) {
      console.error('[ReportsService] Error fetching user reports:', error);
      return { success: false, error };
    }
  }
}

export const reportsService = new ReportsService();