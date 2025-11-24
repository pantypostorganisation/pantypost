// src/services/approval.service.ts
import { apiCall } from './api.config';
import { Listing } from '@/context/ListingContext';

export type ApprovalStatus = 'pending' | 'approved' | 'denied';

export interface ApprovalHistoryResponse {
  listings: Listing[];
  page: number;
  totalPages: number;
}

const normalizeListing = (listing: any): Listing => ({
  ...(listing as Listing),
  id: (listing as any)._id || listing.id,
  date: (listing as any).createdAt || (listing as any).date,
});

class ApprovalService {
  async getPendingListings() {
    const response = await apiCall<Listing[]>('/admin/approval/pending', { method: 'GET' });
    if (response.success && response.data) {
      return { ...response, data: response.data.map(normalizeListing) };
    }
    return response;
  }

  async approveListing(listingId: string) {
    const response = await apiCall<Listing>('/admin/approval/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId })
    });
    if (response.success && response.data) {
      return { ...response, data: normalizeListing(response.data) };
    }
    return response;
  }

  async denyListing(listingId: string) {
    const response = await apiCall<Listing>('/admin/approval/deny', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId })
    });
    if (response.success && response.data) {
      return { ...response, data: normalizeListing(response.data) };
    }
    return response;
  }

  async getHistory(page: number = 1, type: 'all' | ApprovalStatus = 'all') {
    const params = new URLSearchParams({ page: String(page), type });
    const response = await apiCall<{ listings: Listing[]; page: number; totalPages: number }>(`/admin/approval/history?${params.toString()}`, {
      method: 'GET'
    });

    if (response.success && response.data) {
      const listings = (response.data.listings || []).map(normalizeListing);
      return { ...response, data: { ...response.data, listings } };
    }

    return response;
  }
}

export const approvalService = new ApprovalService();
