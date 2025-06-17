// src/types/myListings.ts

import { Listing } from '@/context/ListingContext';

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

export interface StatsCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<any>;
  iconColor: string;
  borderColor: string;
}

export interface ListingFormProps {
  formState: ListingFormState;
  isEditing: boolean;
  isVerified: boolean;
  selectedFiles: File[];
  isUploading: boolean;
  onFormChange: (updates: Partial<ListingFormState>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (index: number) => void;
  onUploadFiles: () => void;
  onRemoveImage: (url: string) => void;
  onImageReorder: (dragIndex: number, dropIndex: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export interface ListingCardProps {
  listing: Listing;
  analytics: ListingAnalytics;
  onEdit: (listing: Listing) => void;
  onDelete: (id: string) => void;
  onCancelAuction: (id: string) => void;
}

export interface VerificationBannerProps {
  onVerifyClick: () => void;
}

export interface TipsCardProps {
  title: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  borderColor: string;
  tips: string[];
  isVerified?: boolean;
  showVerifyLink?: boolean;
}

export interface RecentSalesProps {
  orders: any[];
}