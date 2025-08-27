// src/services/subscription.service.ts
import { API_BASE_URL } from '@/services/api.config';

type HeadersMap = Record<string, string>;

export interface SubscribeRequest { seller: string; price?: number; token?: string }
export interface UnsubscribeRequest { seller: string; token?: string }
export interface CheckRequest { subscriber?: string; creator: string; token?: string }

export interface ApiStd<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [k: string]: any;
}

function withApi(base: string): string {
  const b = (base || '').replace(/\/+$/, '');
  return /\/api$/.test(b) ? b : `${b}/api`;
}
const BASE = withApi(API_BASE_URL);

function buildHeaders(token?: string): HeadersMap {
  const h: HeadersMap = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function post(path: string, body: any, token?: string) {
  const url = `${BASE}/${path.replace(/^\//, '')}`;
  const res = await fetch(url, { method: 'POST', headers: buildHeaders(token), body: JSON.stringify(body) });
  let json: any = null;
  try { json = await res.json(); } catch {}
  if (!res.ok) {
    const msg = json?.error || json?.message || `${res.status} ${res.statusText}`;
    return { ok: false, status: res.status, json, msg, url };
  }
  return { ok: true, status: res.status, json, url };
}

async function get(path: string, token?: string) {
  const url = `${BASE}/${path.replace(/^\//, '')}`;
  const res = await fetch(url, { method: 'GET', headers: buildHeaders(token) });
  let json: any = null;
  try { json = await res.json(); } catch {}
  if (!res.ok) {
    const msg = json?.error || json?.message || `${res.status} ${res.statusText}`;
    return { ok: false, status: res.status, json, msg, url };
  }
  return { ok: true, status: res.status, json, url };
}

export const subscriptionsService = {
  async subscribe(req: SubscribeRequest): Promise<ApiStd> {
    const payload: any = { seller: req.seller };
    if (typeof req.price === 'number') payload.price = req.price;
    const r = await post('/subscriptions/subscribe', payload, req.token);
    if (r.ok) return r.json ?? { success: true };
    console.error('[SubscriptionsService] subscribe failed', r.status, r.msg, 'url:', r.url);
    return { success: false, error: r.msg };
  },

  async unsubscribe(req: UnsubscribeRequest): Promise<ApiStd> {
    const r = await post('/subscriptions/unsubscribe', { seller: req.seller }, req.token);
    if (r.ok) return r.json ?? { success: true };
    console.error('[SubscriptionsService] unsubscribe failed', r.status, r.msg, 'url:', r.url);
    return { success: false, error: r.msg };
  },

  async check(req: CheckRequest): Promise<{ success: boolean; isSubscribed: boolean; data?: any; error?: string }> {
    // Try precise POST (auth) first if we have a subscriber
    if (req.subscriber) {
      const p = await post('/subscriptions/check', { subscriber: req.subscriber, creator: req.creator }, req.token);
      if (p.ok) {
        const data = p.json;
        const is = Boolean(data?.isSubscribed || data?.data?.status === 'active');
        return { success: true, isSubscribed: is, data };
      }
    }
    // Fallback to safe GET (never 401)
    const g = await get(`/subscriptions/check/${encodeURIComponent(req.creator)}`, req.token);
    if (g.ok) {
      const data = g.json;
      const is = Boolean(data?.isSubscribed || data?.data?.status === 'active');
      return { success: true, isSubscribed: is, data };
    }
    const msg = (g as any).msg || 'Request failed';
    console.error('[SubscriptionsService] check failed', msg, 'GET url:', (g as any).url);
    return { success: false, isSubscribed: false, error: msg };
  },
};
