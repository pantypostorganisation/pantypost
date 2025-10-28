// src/types/myListings.ts

import { Listing } from '@/context/ListingContext';
import type { ComponentType, SVGProps } from 'react';
import type { Order } from './order';

export interface ListingFormState {
  title: string;
  description: string;
  price: string;
  imageUrls: string[];
  isPremium: boolean;
  tags: string;
  hoursWorn: number | '';
  isAuction: boolean;
  startingPrice: string;
  reservePrice: string;
  auctionDuration: string;
}

export interface EditingState {
  listingId: string | null;
  isEditing: boolean;
}

export interface ListingAnalytics {
  views: number;
}

export interface ListingDraft {
  id: string;
  seller: string;
  formState: ListingFormState;
  createdAt: string;
  lastModified: string;
  name?: string; // Optional name for the draft
}

export interface StatsCardProps {
  title: string;
  count: number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconColor: string;
  borderColor: string;
}

export interface ListingFormProps {
  formState: ListingFormState;
  isEditing: boolean;
  isVerified: boolean;
  selectedFiles: File[];
  isUploading: boolean;
  uploadProgress?: number;
  onFormChange: (updates: Partial<ListingFormState>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onUploadFiles: () => void;
  onRemoveImage: (url: string) => void;
  onImageReorder: (dragIndex: number, dropIndex: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onSaveDraft?: () => void;
  onLoadDraft?: (draft: ListingDraft) => void;
}

export interface ListingCardProps {
  listing: Listing;
  analytics: ListingAnalytics;
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
  onCancelAuction: (id: string) => void;
}

export interface ListingLimitMessageProps {
  currentListings: number;
  maxListings: number;
  isVerified: boolean;
}

export interface VerificationBannerProps {
  onVerifyClick: () => void;
}

export interface TipsCardProps {
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  iconColor: string;
  borderColor: string;
  tips: string[];
  isVerified?: boolean;
  showVerifyLink?: boolean;
}

export interface RecentSalesProps {
  orders: Order[];
}

export interface DraftListProps {
  drafts: ListingDraft[];
  onLoadDraft: (draft: ListingDraft) => void;
  onDeleteDraft: (draftId: string) => void;
}

export interface BulkActionsProps {
  selectedListings: string[];
  onBulkDelete: () => void;
  onBulkUpdatePremium: (isPremium: boolean) => void;
  onBulkUpdatePrice: (priceChange: number) => void;
}
