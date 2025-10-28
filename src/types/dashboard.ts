// src/types/dashboard.ts

import type { ReactNode } from 'react';
import type { Listing } from '@/context/ListingContext';

export interface SubscriptionInfo {
  seller: string;
  price: string;
  bio: string;
  pic: string | null;
  newListings: number;
  lastActive: string;
  tier?: string;
  verified?: boolean;
}

export interface DashboardStats {
  totalSpent: number;
  totalOrders: number;
  activeSubscriptions: number;
  pendingRequests: number;
  unreadMessages: number;
  completedOrders: number;
  favoriteSellerCount: number;
  averageOrderValue: number;
  thisWeekSpent: number;
  thisMonthOrders: number;
  pendingShipments: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'message' | 'subscription' | 'request';
  title: string;
  subtitle: string;
  time: string;
  status?: string;
  amount?: number;
  href?: string;
  icon: ReactNode;
}

// Component Props
export interface DashboardHeaderProps {
  username: string;
  // Removed balance prop as it's no longer used in the component
}

export interface StatsGridProps {
  stats: DashboardStats;
}

export type QuickActionsProps = Record<string, never>;

export interface RecentActivityProps {
  activities: RecentActivity[];
}

export interface SubscribedSellersProps {
  subscriptions: SubscriptionInfo[];
}

export interface FeaturedListingsProps {
  listings: Listing[];
}