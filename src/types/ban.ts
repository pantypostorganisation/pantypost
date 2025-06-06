export type BanType = 'temporary' | 'permanent';
export type BanReason = 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'underage' | 'payment_fraud' | 'other';
export type AppealStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'escalated';

export interface BanEntry {
  id: string;
  username: string;
  banType: BanType;
  reason: BanReason;
  customReason?: string;
  startTime: string;
  endTime?: string;
  remainingHours?: number;
  bannedBy: string;
  active: boolean;
  appealable: boolean;
  appealSubmitted?: boolean;
  appealText?: string;
  appealDate?: string;
  appealStatus?: AppealStatus;
  appealEvidence?: string[];
  notes?: string;
  reportIds?: string[];
  ipAddress?: string;
}

export interface BanHistoryEntry {
  id: string;
  username: string;
  action: 'banned' | 'unbanned' | 'appeal_submitted' | 'appeal_approved' | 'appeal_rejected' | 'appeal_escalated';
  details: string;
  timestamp: string;
  adminUsername: string;
  metadata?: Record<string, any>;
}

export interface AppealReview {
  reviewId: string;
  banId: string;
  reviewerAdmin: string;
  reviewNotes: string;
  decision: 'approve' | 'reject' | 'escalate';
  reviewDate: string;
  escalationReason?: string;
}

export interface IPBan {
  ipAddress: string;
  bannedUsernames: string[];
  banDate: string;
  expiryDate?: string;
  reason: string;
}

export interface FilterOptions {
  searchTerm: string;
  filterBy: 'all' | 'temporary' | 'permanent';
  sortBy: 'date' | 'username' | 'duration';
  sortOrder: 'asc' | 'desc';
}

export interface BanStats {
  totalActiveBans: number;
  temporaryBans: number;
  permanentBans: number;
  pendingAppeals: number;
  recentBans24h: number;
  bansByReason: Record<BanReason, number>;
  appealStats: {
    totalAppeals: number;
    pendingAppeals: number;
    approvedAppeals: number;
    rejectedAppeals: number;
  };
}