// src/services/customRequests.service.ts
//
// Custom requests used to live in RequestContext only, persisted under
// `panty_custom_requests` — a key that storage.service.ts lists in
// SESSION_ONLY, so it went to sessionStorage. The consequence was that a
// request existed solely in the tab of whoever created it: the seller
// received the chat message but never the request object carrying status
// and whose turn it was, so Accept/Decline had nothing to render against.
// The buyer lost every request the moment they closed the tab.
//
// This service talks to /api/custom-requests instead, so both parties
// read the same record. Turn-taking is enforced server-side — the client
// asks, the server decides.

import { apiClient } from './api.config';
import { sanitizeStrict, sanitizeUsername } from '@/utils/security/sanitization';

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'edited' | 'paid';

export interface CustomRequest {
  id: string;
  buyer: string;
  seller: string;
  title: string;
  description: string;
  price: number;
  tags: string[];
  status: RequestStatus;
  date: string;

  /**
   * Whose turn it is. Absent once the request is settled.
   *
   * The API sends `null` for these, but the rest of the codebase types the
   * same fields as `?: string` — see utils/messageUtils.ts, whose comments
   * note they were made optional "to match RequestContext". Normalising
   * null to undefined at this boundary keeps `CustomRequest` structurally
   * assignable to that type instead of pushing a `string | null` union
   * through every consumer.
   */
  pendingWith?: string;
  lastEditedBy?: string;
  lastModifiedBy?: string;

  /** Sorted-usernames key, identical to the Message model's threadId. */
  threadId?: string;
  /** Kept as an alias so existing callers reading messageThreadId still work. */
  messageThreadId?: string;

  originalMessageId?: string;
  response?: string;
  paid?: boolean;
  orderId?: string;
}

export interface CreateRequestInput {
  id: string;
  seller: string;
  title: string;
  description: string;
  price: number;
  tags?: string[];
  originalMessageId?: string;
}

export interface RespondInput {
  status: 'accepted' | 'rejected' | 'edited';
  response?: string;
  title?: string;
  description?: string;
  price?: number;
  tags?: string[];
}

/** Sorted-usernames key. Must match Message.getThreadId on the backend. */
export function getThreadId(a: string, b: string): string {
  return [a, b].sort().join('-');
}

/**
 * The API returns `id` alongside `_id` (see the model's toJSON transform),
 * but be defensive: a raw document would only have `_id`. Also mirror
 * threadId onto messageThreadId, which is the name the existing context
 * and hooks already use.
 */
function normalize(raw: any): CustomRequest {
  const id = raw?.id || raw?._id || '';
  const threadId = raw?.threadId || getThreadId(raw?.buyer || '', raw?.seller || '');

  return {
    id: String(id),
    buyer: raw?.buyer || '',
    seller: raw?.seller || '',
    title: sanitizeStrict(raw?.title || ''),
    description: sanitizeStrict(raw?.description || ''),
    price: Number(raw?.price) || 0,
    tags: Array.isArray(raw?.tags) ? raw.tags.map((t: any) => sanitizeStrict(String(t))) : [],
    status: (raw?.status || 'pending') as RequestStatus,
    date: raw?.date || raw?.createdAt || new Date().toISOString(),
    // `?? undefined` rather than `?? null`: the API sends null, but the
    // wider codebase types these as `?: string`. See the interface above.
    pendingWith: raw?.pendingWith ?? undefined,
    lastEditedBy: raw?.lastEditedBy ?? undefined,
    lastModifiedBy: raw?.lastModifiedBy ?? undefined,
    threadId,
    messageThreadId: threadId,
    originalMessageId: raw?.originalMessageId || id,
    response: raw?.response ? sanitizeStrict(raw.response) : '',
    paid: Boolean(raw?.paid),
    orderId: raw?.orderId ?? undefined,
  };
}

function errorMessage(response: any, fallback: string): string {
  return (
    response?.error?.message ||
    (typeof response?.error === 'string' ? response.error : undefined) ||
    fallback
  );
}

class CustomRequestsService {
  /** Every request the signed-in user is party to. */
  async list(options?: { withUser?: string; status?: RequestStatus }): Promise<CustomRequest[]> {
    try {
      const params = new URLSearchParams();
      if (options?.withUser) params.set('withUser', sanitizeUsername(options.withUser) || options.withUser);
      if (options?.status) params.set('status', options.status);

      const query = params.toString();
      const response = await apiClient.call<any[]>(`/custom-requests${query ? `?${query}` : ''}`, {
        method: 'GET',
      });

      if (!response.success || !Array.isArray(response.data)) return [];
      return response.data.map(normalize);
    } catch (error) {
      console.error('[CustomRequests] List failed:', error);
      return [];
    }
  }

  /** Buyer creates a request. The server rejects this for non-buyers. */
  async create(
    input: CreateRequestInput
  ): Promise<{ success: boolean; data?: CustomRequest; message?: string }> {
    try {
      const response = await apiClient.call<any>('/custom-requests', {
        method: 'POST',
        body: JSON.stringify({
          id: input.id,
          seller: sanitizeUsername(input.seller) || input.seller,
          title: sanitizeStrict(input.title),
          description: sanitizeStrict(input.description || ''),
          price: Number(input.price),
          tags: (input.tags || []).map((t) => sanitizeStrict(t).slice(0, 30)).slice(0, 10),
          originalMessageId: input.originalMessageId || input.id,
        }),
      });

      if (response.success && response.data) {
        return { success: true, data: normalize(response.data) };
      }
      return { success: false, message: errorMessage(response, 'Failed to create request') };
    } catch (error) {
      console.error('[CustomRequests] Create failed:', error);
      return { success: false, message: 'Failed to create request. Please try again.' };
    }
  }

  /**
   * Accept, decline or counter-offer.
   *
   * The server checks the caller against `pendingWith` and answers 409 if
   * it is not their turn or the request is already settled. That check is
   * the whole point — do not try to pre-empt it in the UI beyond hiding
   * buttons, because only the server sees both parties.
   */
  async respond(
    id: string,
    input: RespondInput
  ): Promise<{ success: boolean; data?: CustomRequest; message?: string }> {
    try {
      const body: Record<string, unknown> = { status: input.status };

      if (typeof input.response !== 'undefined') body.response = sanitizeStrict(input.response);
      if (typeof input.title !== 'undefined') body.title = sanitizeStrict(input.title);
      if (typeof input.description !== 'undefined') body.description = sanitizeStrict(input.description);
      if (typeof input.price !== 'undefined') body.price = Number(input.price);
      if (typeof input.tags !== 'undefined') {
        body.tags = input.tags.map((t) => sanitizeStrict(t).slice(0, 30)).slice(0, 10);
      }

      const response = await apiClient.call<any>(`/custom-requests/${encodeURIComponent(id)}/respond`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (response.success && response.data) {
        return { success: true, data: normalize(response.data) };
      }
      return { success: false, message: errorMessage(response, 'Failed to update request') };
    } catch (error) {
      console.error('[CustomRequests] Respond failed:', error);
      return { success: false, message: 'Failed to update request. Please try again.' };
    }
  }

  /** Buyer only, and only after acceptance. Idempotent server-side. */
  async markPaid(
    id: string,
    orderId?: string
  ): Promise<{ success: boolean; data?: CustomRequest; message?: string }> {
    try {
      const response = await apiClient.call<any>(`/custom-requests/${encodeURIComponent(id)}/paid`, {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      });

      if (response.success && response.data) {
        return { success: true, data: normalize(response.data) };
      }
      return { success: false, message: errorMessage(response, 'Failed to mark request as paid') };
    } catch (error) {
      console.error('[CustomRequests] Mark paid failed:', error);
      return { success: false, message: 'Failed to mark request as paid.' };
    }
  }

  async getById(id: string): Promise<CustomRequest | null> {
    try {
      const response = await apiClient.call<any>(`/custom-requests/${encodeURIComponent(id)}`, {
        method: 'GET',
      });
      if (response.success && response.data) return normalize(response.data);
      return null;
    } catch (error) {
      console.error('[CustomRequests] Get failed:', error);
      return null;
    }
  }
}

export const customRequestsService = new CustomRequestsService();
export default customRequestsService;
