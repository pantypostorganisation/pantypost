// src/services/reports.service.ts
import { apiCall, buildApiUrl, API_BASE_URL, FEATURES } from './api.config';
import { storageService } from './storage.service';

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
    
    // Check if API reports are enabled
    if (!FEATURES.USE_API_REPORTS) {
      console.log('[ReportsService] API reports disabled, saving to localStorage only');
      
      // Save to localStorage as fallback
      const reports = await storageService.getItem<Report[]>('panty_report_logs', []);
      const newReport: Report = {
        id: `report_${Date.now()}`,
        reporter: 'current_user', // You'll need to pass this from the context
        reportee: data.reportedUser,
        date: new Date().toISOString(),
        category: data.reportType,
        severity: data.severity || 'medium',
        adminNotes: data.description,
        processed: false
      };
      reports.push(newReport);
      await storageService.setItem('panty_report_logs', reports);
      
      return { success: true, data: newReport };
    }
    
    try {
      const response = await apiCall<any>(`${API_BASE_URL}/api/reports/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.success) {
        console.log('[ReportsService] Report submitted successfully');
        
        // Also save to localStorage for immediate UI updates
        const reports = await storageService.getItem<Report[]>('panty_report_logs', []);
        const newReport: Report = {
          id: response.data?.reportId || response.data?.id || `report_${Date.now()}`,
          reporter: 'current_user',
          reportee: data.reportedUser,
          date: new Date().toISOString(),
          category: data.reportType,
          severity: data.severity || 'medium',
          adminNotes: data.description,
          processed: false
        };
        reports.push(newReport);
        await storageService.setItem('panty_report_logs', reports);
      }

      return response;
    } catch (error) {
      console.error('[ReportsService] Error submitting report:', error);
      
      // Fallback to localStorage on error
      const reports = await storageService.getItem<Report[]>('panty_report_logs', []);
      const newReport: Report = {
        id: `report_${Date.now()}`,
        reporter: 'current_user',
        reportee: data.reportedUser,
        date: new Date().toISOString(),
        category: data.reportType,
        severity: data.severity || 'medium',
        adminNotes: data.description,
        processed: false
      };
      reports.push(newReport);
      await storageService.setItem('panty_report_logs', reports);
      
      return { success: true, data: newReport };
    }
  }

  async getReports(params?: {
    page?: number;
    limit?: number;
    status?: string;
    severity?: string;
    reportType?: string;
  }): Promise<ReportResponse> {
    if (!FEATURES.USE_API_REPORTS) {
      const reports = await storageService.getItem<Report[]>('panty_report_logs', []);
      return { success: true, data: { reports } };
    }

    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
    }
    
    try {
      return await apiCall(`${API_BASE_URL}/api/reports?${queryParams.toString()}`, {
        method: 'GET'
      });
    } catch (error) {
      console.error('[ReportsService] Error fetching reports:', error);
      const reports = await storageService.getItem<Report[]>('panty_report_logs', []);
      return { success: true, data: { reports } };
    }
  }

  async getReportById(id: string): Promise<ReportResponse> {
    if (!FEATURES.USE_API_REPORTS) {
      const reports = await storageService.getItem<Report[]>('panty_report_logs', []);
      const report = reports.find((r) => r.id === id);
      return { success: !!report, data: report };
    }

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
    if (!FEATURES.USE_API_REPORTS) {
      const reports = await storageService.getItem<Report[]>('panty_report_logs', []);
      const index = reports.findIndex((r) => r.id === id);
      if (index !== -1) {
        reports[index] = { ...reports[index], ...updates } as Report;
        await storageService.setItem('panty_report_logs', reports);
        return { success: true, data: reports[index] };
      }
      return { success: false, error: 'Report not found' };
    }

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
    if (!FEATURES.USE_API_REPORTS) {
      const reports = await storageService.getItem<Report[]>('panty_report_logs', []);
      const index = reports.findIndex((r) => r.id === id);
      if (index !== -1) {
        reports[index] = { 
          ...reports[index], 
          processed: true,
          processedAt: new Date().toISOString(),
          banApplied: data.action === 'ban'
        };
        await storageService.setItem('panty_report_logs', reports);
        return { success: true, data: reports[index] };
      }
      return { success: false, error: 'Report not found' };
    }

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
    if (!FEATURES.USE_API_REPORTS) {
      const reports = await storageService.getItem<Report[]>('panty_report_logs', []);
      const stats = {
        total: reports.length,
        pending: reports.filter((r) => !r.processed).length,
        resolved: reports.filter((r) => r.processed).length,
        withBans: reports.filter((r) => r.banApplied).length
      };
      return { success: true, data: stats };
    }

    try {
      return await apiCall(`${API_BASE_URL}/api/reports/stats`, {
        method: 'GET'
      });
    } catch (error) {
      console.error('[ReportsService] Error fetching stats:', error);
      return { success: false, error };
    }
  }

  async getUserReports(username: string, includeResolved = false): Promise<ReportResponse> {
    if (!FEATURES.USE_API_REPORTS) {
      const reports = await storageService.getItem<Report[]>('panty_report_logs', []);
      const userReports = reports.filter((r) => 
        r.reportee === username && (includeResolved || !r.processed)
      );
      return { success: true, data: { reports: userReports } };
    }

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