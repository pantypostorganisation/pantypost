// src/components/admin/reports/types.ts

export type Message = {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
};

export type ReportLog = {
  id?: string;
  reporter: string;
  reportee: string;
  messages: Message[];
  date: string;
  processed?: boolean;
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  banApplied?: boolean;
  banId?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other';
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
  evidence?: string[];
  relatedMessageId?: string;
};

export type ReportStats = {
  total: number;
  unprocessed: number;
  processed: number;
  critical: number;
  today: number;
  withBans: number;
};

export type UserReportStats = {
  totalReports: number;
  activeReports: number;
  processedReports: number;
  isBanned: boolean;
  banInfo?: any;
  reportHistory?: ReportLog[];
};

export type BanFormData = {
  username: string;
  banType: 'temporary' | 'permanent';
  hours: string;
  reason: 'harassment' | 'scam' | 'spam' | 'inappropriate_content' | 'underage' | 'other';
  customReason: string;
  notes: string;
};

export type SeverityInfo = {
  color: string;
  icon: any;
  label: string;
};

export interface ReportsHeaderProps {
  banContextError: string | null;
  lastRefresh: Date;
  onRefresh: () => void;
}

export interface ReportsStatsProps {
  reportStats: ReportStats;
}

export interface ReportsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterBy: 'all' | 'unprocessed' | 'processed';
  setFilterBy: (filter: 'all' | 'unprocessed' | 'processed') => void;
  severityFilter: 'all' | 'low' | 'medium' | 'high' | 'critical';
  setSeverityFilter: (severity: 'all' | 'low' | 'medium' | 'high' | 'critical') => void;
  categoryFilter: 'all' | 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other';
  setCategoryFilter: (category: 'all' | 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other') => void;
  sortBy: 'date' | 'severity' | 'reporter';
  setSortBy: (sort: 'date' | 'severity' | 'reporter') => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
}

export interface ReportsListProps {
  reports: ReportLog[];
  searchTerm: string;
  expandedReports: Set<string>;
  toggleExpanded: (reportId: string) => void;
  onBan: (report: ReportLog) => void;
  onResolve: (report: ReportLog) => void;
  onDelete: (reportId: string) => void;
  onUpdateSeverity: (reportId: string, severity: ReportLog['severity']) => void;
  onUpdateCategory: (reportId: string, category: ReportLog['category']) => void;
  onUpdateAdminNotes: (reportId: string, notes: string) => void;
  getUserReportStats: (username: string) => UserReportStats;
  banContext: any;
  reportBanInfo: {[key: string]: any};
}

export interface ReportCardProps {
  report: ReportLog;
  isExpanded: boolean;
  onToggle: () => void;
  onBan: () => void;
  onResolve: () => void;
  onDelete: () => void;
  onUpdateSeverity: (severity: ReportLog['severity']) => void;
  onUpdateCategory: (category: ReportLog['category']) => void;
  onUpdateAdminNotes: (notes: string) => void;
  userStats: UserReportStats;
  userBanInfo: any;
  banContext: any;
}

export interface ReportDetailsProps {
  report: ReportLog;
  userStats: UserReportStats;
  onUpdateSeverity: (severity: ReportLog['severity']) => void;
  onUpdateCategory: (category: ReportLog['category']) => void;
  onUpdateAdminNotes: (notes: string) => void;
}

export interface BanModalProps {
  isOpen: boolean;
  banForm: BanFormData;
  setBanForm: (form: BanFormData | ((prev: BanFormData) => BanFormData)) => void;
  isProcessing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export interface ResolveModalProps {
  isOpen: boolean;
  report: ReportLog | null;
  onClose: () => void;
  onConfirm: () => void;
}
