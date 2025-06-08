// src/types/verification.ts

export interface VerificationDocs {
  code?: string;
  codePhoto?: string;
  idFront?: string;
  idBack?: string;
  passport?: string;
}

export interface VerificationUser {
  username: string;
  verificationStatus: 'none' | 'pending' | 'verified' | 'rejected';
  verificationRequestedAt?: string;
  verificationDocs?: VerificationDocs;
  verificationRejectionReason?: string;
}

export interface ImageViewData {
  type: string;
  url: string;
}

export interface VerificationStats {
  total: number;
  today: number;
  thisWeek: number;
  averageProcessingTime: number; // in hours
}

export type SortOption = 'newest' | 'oldest' | 'alphabetical';

// Component Props
export interface VerificationHeaderProps {
  onRefresh?: () => void;
}

export interface VerificationSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  pendingCount: number;
}

export interface VerificationStatsProps {
  stats: VerificationStats;
}

export interface VerificationListProps {
  users: VerificationUser[];
  searchTerm: string;
  onSelectUser: (user: VerificationUser) => void;
}

export interface VerificationCardProps {
  user: VerificationUser;
  onSelect: () => void;
  getTimeAgo: (timestamp?: string) => string;
}

export interface DocumentCardProps {
  title: string;
  imageSrc?: string;
  onViewFull: () => void;
}

export interface ReviewModalProps {
  user: VerificationUser | null;
  onClose: () => void;
  onApprove: (username: string) => void;
  onReject: (username: string, reason: string) => void;
  getTimeAgo: (timestamp?: string) => string;
}

export interface ImageViewerProps {
  imageData: ImageViewData | null;
  isLoading: boolean;
  onClose: () => void;
  onLoad: () => void;
}

export interface ActionButtonsProps {
  showRejectInput: boolean;
  rejectReason: string;
  onApprove: () => void;
  onReject: () => void;
  onRejectInputShow: () => void;
  onRejectInputCancel: () => void;
  onRejectReasonChange: (reason: string) => void;
}
