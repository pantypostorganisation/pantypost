// src/services/ageVerification.service.ts
import { apiCall } from './api.config';

export type AgeStatus =
  | 'not_started'
  | 'pending'
  | 'approved'
  | 'declined'
  | 'in_review'
  | 'abandoned'
  | 'expired';

export interface AgeStatusResponse {
  status: AgeStatus;
  verifiedAt: string | null;
  method: string | null;
  isVerified: boolean;
  /** False when the provider is not configured — lets the UI explain rather than break. */
  providerAvailable: boolean;
}

export interface StartSessionResponse {
  sessionUrl?: string;
  sessionId?: string;
  alreadyVerified?: boolean;
}

/** Copy shown per status. Kept here so wording stays consistent. */
export const AGE_STATUS_COPY: Record<AgeStatus, { title: string; body: string }> = {
  not_started: {
    title: 'Verify your age',
    body: 'We need to confirm you are 18 or over before you can continue. It takes about 30 seconds.',
  },
  pending: {
    title: 'Verification in progress',
    body: 'We are waiting for your result. This usually takes a few seconds.',
  },
  approved: {
    title: 'You are verified',
    body: 'Thanks — your age has been confirmed.',
  },
  declined: {
    title: 'We could not verify your age',
    body: 'We were unable to confirm you are 18 or over. If you believe this is wrong, you can try again or contact support.',
  },
  in_review: {
    title: 'Being reviewed',
    body: 'Your verification needs a closer look. This is usually resolved quickly.',
  },
  abandoned: {
    title: 'Verification not completed',
    body: 'It looks like the check was not finished. You can start again whenever you are ready.',
  },
  expired: {
    title: 'Verification expired',
    body: 'That verification link has expired. Please start a new one.',
  },
};


/* =====================================================================
 * STATUS CACHE
 *
 * AgeGate wraps `children` PER ROUTE in ClientLayout, and its effect
 * calls getStatus() whenever it mounts. So an already-approved user was
 * re-checked against the API on EVERY navigation to a gated page, and
 * saw the gate's loading state each time before it decided they were
 * fine. That is the repeated prompting.
 *
 * An approved result does not change, so it is cached for the session.
 * Non-final states (pending, in_review) are NOT cached, because those
 * genuinely do change and the UI has to see the transition.
 *
 * Cleared on logout so the next account cannot inherit it.
 * ===================================================================== */
let cachedStatus: AgeStatusResponse | null = null;

export function clearAgeStatusCache(): void {
  cachedStatus = null;
}

class AgeVerificationService {
  /** Current status for the signed-in user. */
  async getStatus() {
    // A settled 'approved' cannot change; serve it without a round trip.
    if (cachedStatus && cachedStatus.status === 'approved') {
      return { success: true as const, data: cachedStatus };
    }

    const response = await apiCall<AgeStatusResponse>('/age-verification/status', {
      method: 'GET',
    });

    /* Only a settled 'approved' is cached. pending and in_review are
       deliberately left uncached -- those transition, and the UI has to
       see it happen. */
    if (response.success && response.data?.status === 'approved') {
      cachedStatus = response.data;
    }

    return response;
  }

  /**
   * Open a session. Returns a hosted URL to send the user to — the
   * selfie and any document are handled entirely by the provider, so
   * no identity data passes through our site.
   */
  async start() {
    return apiCall<StartSessionResponse>('/age-verification/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Ask the provider directly for the verdict.
   * Used on the return page in case the webhook has not landed yet.
   */
  async refresh() {
    // Asks the provider directly, so any cached verdict is now stale.
    cachedStatus = null;

    return apiCall<{ status: AgeStatus; isVerified: boolean }>('/age-verification/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const ageVerificationService = new AgeVerificationService();