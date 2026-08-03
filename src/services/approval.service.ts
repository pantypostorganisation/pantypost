// src/services/approval.service.ts
import { apiCall } from './api.config';

export type ApprovalStatus = 'pending' | 'approved' | 'denied';

/** Content types that pass through pre-publication review. */
export type ContentType =
  | 'listing'
  | 'post'
  | 'profile_pic'
  | 'cover_photo'
  | 'gallery_image';

/**
 * A single item in the moderation queue.
 *
 * The backend decorates every record with `contentType`, `contentLabel`,
 * `displayTitle` and `owner`, so the admin UI can render listings and
 * posts through one code path instead of branching on shape everywhere.
 */
export interface ModeratedItem {
  id: string;
  _id?: string;
  contentType: ContentType;
  contentLabel: string;
  displayTitle: string;
  owner: string;

  // Listing-specific (absent on posts)
  title?: string;
  description?: string;
  price?: number;
  seller?: string;
  auction?: { startingPrice?: number; isAuction?: boolean };

  // Post-specific (absent on listings)
  content?: string;
  author?: string;

  // Profile media
  previousImage?: string;

  // Shared
  imageUrls?: string[];
  tags?: string[];
  createdAt?: string;
  date?: string;

  // Moderation state
  approvalStatus?: ApprovalStatus;
  approvedAt?: string;
  approvedBy?: string;
  deniedAt?: string;
  deniedBy?: string;
  denialReason?: string;
  moderationNote?: string;
}

export interface ApprovalHistoryResponse {
  listings: ModeratedItem[];
  items: ModeratedItem[];
  page: number;
  totalPages: number;
  total?: number;
}

export interface PendingCounts {
  listing: number;
  post: number;
  profile_pic: number;
  cover_photo: number;
  gallery_image: number;
  total: number;
}

const normalizeItem = (item: any): ModeratedItem => ({
  ...(item as ModeratedItem),
  id: item._id || item.id,
  date: item.createdAt || item.date,
  // Defend against older records created before the queue handled
  // multiple content types.
  contentType: item.contentType || 'listing',
  contentLabel: item.contentLabel || 'Listing',
  displayTitle: item.displayTitle || item.title || '(untitled)',
  owner: item.owner || item.seller || item.author || 'Unknown',
});

class ApprovalService {
  /** Everything awaiting review, oldest first. */
  async getPendingItems(contentType?: ContentType) {
    const query = contentType ? `?contentType=${contentType}` : '';
    const response = await apiCall<any[]>(`/admin/approval/pending${query}`, { method: 'GET' });

    if (response.success && response.data) {
      return { ...response, data: response.data.map(normalizeItem) };
    }
    return response;
  }

  /** Retained so any existing callers keep working. */
  async getPendingListings() {
    return this.getPendingItems();
  }

  /** Badge counts for the admin dashboard. */
  async getPendingCounts() {
    return apiCall<PendingCounts>('/admin/approval/counts', { method: 'GET' });
  }

  async approve(contentId: string, contentType: ContentType = 'listing') {
    const response = await apiCall<any>('/admin/approval/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // listingId is sent alongside contentId for backward compatibility
      // with the previous listings-only API.
      body: JSON.stringify({ contentId, listingId: contentId, contentType }),
    });

    if (response.success && response.data) {
      return { ...response, data: normalizeItem(response.data) };
    }
    return response;
  }

  async deny(contentId: string, contentType: ContentType = 'listing', reason?: string) {
    const response = await apiCall<any>('/admin/approval/deny', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, listingId: contentId, contentType, reason }),
    });

    if (response.success && response.data) {
      return { ...response, data: normalizeItem(response.data) };
    }
    return response;
  }

  /** Older method names, kept so nothing else breaks. */
  async approveListing(listingId: string) {
    return this.approve(listingId, 'listing');
  }

  async denyListing(listingId: string) {
    return this.deny(listingId, 'listing');
  }

  async getHistory(
    page: number = 1,
    type: 'all' | ApprovalStatus = 'all',
    contentType?: ContentType
  ) {
    const params = new URLSearchParams({ page: String(page), type });
    if (contentType) params.set('contentType', contentType);

    const response = await apiCall<ApprovalHistoryResponse>(
      `/admin/approval/history?${params.toString()}`,
      { method: 'GET' }
    );

    if (response.success && response.data) {
      const raw = response.data.items || response.data.listings || [];
      const items = raw.map(normalizeItem);
      return { ...response, data: { ...response.data, items, listings: items } };
    }

    return response;
  }
}

export const approvalService = new ApprovalService();
