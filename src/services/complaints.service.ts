// src/services/complaints.service.ts
import { apiCall } from './api.config';

export type ComplaintStatus =
  | 'received'
  | 'under_review'
  | 'action_taken'
  | 'dismissed'
  | 'escalated';

export type ComplaintPriority = 'standard' | 'urgent' | 'critical';

export type ComplaintAction =
  | 'content_removed'
  | 'content_restored'
  | 'account_suspended'
  | 'account_banned'
  | 'warning_issued'
  | 'no_action_required'
  | 'referred_to_authorities';

export interface AuditEntry {
  at: string;
  by: string;
  action: string;
  note?: string;
}

export interface Complaint {
  _id: string;
  referenceCode: string;
  complaintType: string;
  complainantName?: string;
  complainantEmail: string;
  complainantUsername?: string | null;
  contentUrl?: string;
  contentType?: string;
  contentId?: string | null;
  reportedUser?: string | null;
  description: string;
  declaresDepicted: boolean;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  contentRemovedOnReceipt: boolean;
  receivedAt: string;
  dueBy: string;
  resolvedAt?: string | null;
  resolutionSummary?: string;
  actionTaken?: ComplaintAction | null;
  handledBy?: string;
  auditLog?: AuditEntry[];
  isOverdue?: boolean;
}

export interface ComplaintStats {
  open: number;
  overdue: number;
  urgentOpen: number;
  total: number;
}

export interface MonthlyReport {
  period: string;
  totalReceived: number;
  isZeroIncidentReport: boolean;
  byType: Record<string, number>;
  byAction: Record<string, number>;
  resolved: number;
  outstanding: number;
  resolvedWithinSla: number;
  resolvedOutsideSla: number;
  averageResolutionHours: number;
  urgentReceived: number;
  contentRemovedOnReceipt: number;
  generatedAt: string;
}

/** Human-readable labels, kept in one place so the UI stays consistent. */
export const COMPLAINT_TYPE_LABELS: Record<string, string> = {
  non_consensual_content: 'Non-consensual content',
  underage_content: 'Suspected underage content',
  illegal_content: 'Illegal content',
  copyright: 'Copyright / IP',
  impersonation: 'Impersonation',
  privacy: 'Privacy',
  harassment: 'Harassment',
  other: 'Other',
};

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  received: 'Received',
  under_review: 'Under review',
  action_taken: 'Action taken',
  dismissed: 'Dismissed',
  escalated: 'Escalated',
};

export const ACTION_LABELS: Record<ComplaintAction, string> = {
  content_removed: 'Content removed',
  content_restored: 'Content restored',
  account_suspended: 'Account suspended',
  account_banned: 'Account banned',
  warning_issued: 'Warning issued',
  no_action_required: 'No action required',
  referred_to_authorities: 'Referred to authorities',
};

class ComplaintsService {
  async getComplaints(params?: {
    page?: number;
    limit?: number;
    status?: string;
    complaintType?: string;
    overdue?: boolean;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }

    return apiCall<{
      complaints: Complaint[];
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    }>(`/complaints?${query.toString()}`, { method: 'GET' });
  }

  async getStats() {
    return apiCall<ComplaintStats>('/complaints/stats', { method: 'GET' });
  }

  async getComplaint(id: string) {
    return apiCall<Complaint>(`/complaints/${id}`, { method: 'GET' });
  }

  async updateComplaint(
    id: string,
    updates: {
      status?: ComplaintStatus;
      resolutionSummary?: string;
      actionTaken?: ComplaintAction;
      note?: string;
    }
  ) {
    return apiCall<Complaint>(`/complaints/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  }

  /** Monthly figures for the compliance return sent to the processor. */
  async getMonthlyReport(year: number, month: number) {
    return apiCall<MonthlyReport>(`/complaints/report/${year}/${month}`, { method: 'GET' });
  }
}

export const complaintsService = new ComplaintsService();