// src/services/traffic.service.ts
import { apiCall } from './api.config';

export interface TrafficSummary {
  pageviews: number;
  visitors: number;
  sessions: number;
  viewsPerSession: number;
  signedInViews: number;
  guestViews: number;
}

export interface TrafficPoint {
  date: string;
  pageviews: number;
  visitors: number;
}

export interface TopEntry {
  key: string;
  count: number;
}

export interface TrafficReport {
  range: { days: number; since: string; until: string };
  summary: TrafficSummary;
  change: { pageviews: number; visitors: number; sessions: number };
  series: TrafficPoint[];
  topPages: TopEntry[];
  topReferrers: TopEntry[];
  devices: TopEntry[];
  countries: TopEntry[];
}

export interface TrafficEvents {
  events: Array<{ action: string; category: string; count: number }>;
  searches: Array<{ term: string; count: number }>;
}

/** Per-tab session id. Not persisted, not linked to an account. */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  const KEY = 'pp_session';
  try {
    let id = sessionStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Storage can be unavailable in private modes; analytics simply
    // degrades rather than failing.
    return '';
  }
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';

class TrafficService {
  /**
   * Send a pageview or event.
   *
   * Deliberately does not use apiCall: collection is fire-and-forget,
   * must not surface errors, and should not participate in the app's
   * retry or auth-refresh logic. keepalive lets the request survive the
   * page unloading.
   */
  private send(payload: Record<string, unknown>) {
    if (typeof window === 'undefined') return;

    const token = (() => {
      try {
        return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
      } catch {
        return '';
      }
    })();

    fetch(`${API_BASE}/api/traffic/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...payload,
        sessionId: getSessionId(),
        referrer: document.referrer || '',
      }),
      keepalive: true,
    }).catch(() => {
      // Silent by design.
    });
  }

  trackPageview(path: string) {
    this.send({ type: 'pageview', path });
  }

  trackEvent(event: {
    action: string;
    category: string;
    label?: string;
    value?: number;
    path?: string;
  }) {
    this.send({
      type: 'event',
      path: event.path || window.location.pathname,
      action: event.action,
      category: event.category,
      label: event.label,
      value: event.value,
    });
  }

  /** Admin reporting. */
  async getReport(days: number = 7) {
    return apiCall<TrafficReport>(`/traffic?days=${days}`, { method: 'GET' });
  }

  async getEvents(days: number = 7) {
    return apiCall<TrafficEvents>(`/traffic/events?days=${days}`, { method: 'GET' });
  }
}

export const trafficService = new TrafficService();