// src/types/resolved.ts

export interface Message {
  sender: string;
  receiver: string;
  content: string;
  date: string;
  read?: boolean;
}

export interface ResolvedReport {
  id?: string;
  reporter: string;
  reportee: string;
  date: string; // Resolution date
  originalReportDate?: string;
  resolvedBy?: string;
  resolvedReason?: string;
  banApplied?: boolean;
  banId?: string;
  notes?: string;
  messages?: Message[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'harassment' | 'spam' | 'inappropriate_content' | 'scam' | 'other';
  adminNotes?: string;
}

export interface ResolvedStats {
  total: number;
  withBans: number;
  withoutBans: number;
  today: number;
  thisWeek: number;
}

export interface FilterOptions {
  searchTerm: string;
  filterBy: 'all' | 'banned' | 'nobanned';
  sortBy: 'date' | 'reporter' | 'reportee';
  sortOrder: 'asc' | 'desc';
}

// Component Props
export interface ResolvedHeaderProps {
  lastRefresh: Date;
  onRefresh: () => void;
  onExport: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ResolvedStatsProps {
  stats: ResolvedStats;
}

export interface ResolvedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
}

export interface ResolvedListProps {
  reports: ResolvedReport[];
  expandedReports: Set<string>;
  selectedReports: Set<string>;
  onToggleExpanded: (reportId: string) => void;
  onToggleSelected: (reportId: string) => void;
  onRestore: (report: ResolvedReport) => void;
  onDelete: (reportId: string) => void;
  filters: FilterOptions;
}

export interface ResolvedEntryProps {
  report: ResolvedReport;
  index: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpanded: () => void;
  onToggleSelected: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkRestore: () => void;
  onBulkDelete: () => void;
}

export interface RestoreModalProps {
  isOpen: boolean;
  report: ResolvedReport | null;
  onClose: () => void;
  onConfirm: () => void;
}
