// src/app/buyers/[username]/page.tsx
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BanCheck from '@/components/BanCheck';
import { sanitizeStrict } from '@/utils/security/sanitization';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, MapPin, MessageCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { getGlobalAuthToken } from '@/context/AuthContext';
import { API_BASE_URL } from '@/services/api.config';

/* ==== Types ==== */
type NormalizedBuyerProfile = {
  user: {
    username: string;
    role: 'buyer' | 'seller' | 'admin';
    joinedAt?: string;
    createdAt?: string;
    isBanned?: boolean;
    banReason?: string;
  };
  profile: {
    bio?: string;
    profilePic?: string | null;
    country?: string | null;
  };
};
type MeProfile = {
  username: string;
  role: 'buyer' | 'seller' | 'admin';
  bio: string;
  profilePic: string | null;
  country: string;
};

/* ==== Helpers ==== */
function formatDate(dateLike?: string) {
  if (!dateLike) return '—';
  try {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}
type BackendProfileData = {
  username?: unknown;
  role?: unknown;
  joinedDate?: unknown;
  createdAt?: unknown;
  isBanned?: unknown;
  banReason?: unknown;
  bio?: unknown;
  profilePic?: unknown;
  country?: unknown;
};

type BackendProfileResponse = {
  success?: boolean;
  data?: BackendProfileData | null;
  error?: { message?: string } | null;
};

function normalizeProfileFromBackend(raw: unknown): NormalizedBuyerProfile | null {
  if (!raw || typeof raw !== 'object') return null;

  const response = raw as BackendProfileResponse;
  if (response.success === false) return null;

  const data = response.data;
  if (!data || typeof data !== 'object') return null;

  const username = 'username' in data ? data.username : undefined;
  const role = 'role' in data ? data.role : undefined;

  if (typeof username !== 'string') return null;

  const allowedRoles = new Set(['buyer', 'seller', 'admin']);
  if (typeof role !== 'string' || !allowedRoles.has(role)) return null;

  const joinedAt =
    typeof data.joinedDate === 'string'
      ? data.joinedDate
      : typeof data.createdAt === 'string'
      ? data.createdAt
      : undefined;

  const createdAt = typeof data.createdAt === 'string' ? data.createdAt : undefined;
  const isBanned = typeof data.isBanned === 'boolean' ? data.isBanned : undefined;
  const banReason = typeof data.banReason === 'string' ? data.banReason : undefined;
  const bio = typeof data.bio === 'string' ? data.bio : '';
  const profilePic =
    typeof data.profilePic === 'string'
      ? data.profilePic
      : data.profilePic === null
      ? null
      : undefined;
  const country =
    typeof data.country === 'string'
      ? data.country
      : data.country === null
      ? null
      : undefined;

  return {
    user: {
      username,
      role,
      joinedAt,
      createdAt,
      isBanned,
      banReason,
    },
    profile: {
      bio,
      profilePic: profilePic ?? null,
      country: country ?? null,
    },
  };
}
const API_ORIGIN = (() => {
  try {
    const parsed = new URL(API_BASE_URL);
    return parsed.origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
})();

function resolveAvatarUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const src = String(raw).trim();
  if (!src) return null;
  if (src.toLowerCase().includes('placeholder') || src === '-' || src === 'none') return null;
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  if (src.startsWith('/uploads/')) {
    if (API_ORIGIN) return `${API_ORIGIN}${src}`;
    if (typeof window !== 'undefined') return `${window.location.origin}${src}`;
    return src;
  }
  if (src.startsWith('uploads/')) {
    const withSlash = `/${src}`;
    if (API_ORIGIN) return `${API_ORIGIN}${withSlash}`;
    if (typeof window !== 'undefined') return `${window.location.origin}${withSlash}`;
    return withSlash;
  }
  if (src.startsWith('/')) {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${src}`;
    }
    if (API_ORIGIN) {
      return `${API_ORIGIN}${src}`;
    }
  }
  return null;
}

/** Minimal map for flag emoji */
const COUNTRY_TO_CODE: Record<string, string> = {
  Australia: 'AU',
  Canada: 'CA',
  'United States': 'US',
  'United Kingdom': 'GB',
  Germany: 'DE',
  France: 'FR',
  Japan: 'JP',
  India: 'IN',
  'New Zealand': 'NZ',
};
function flagFromIso2(code?: string | null): string {
  if (!code || code.length !== 2) return '🌐';
  const base = 0x1f1e6;
  const A = 'A'.charCodeAt(0);
  const chars = code.toUpperCase().split('');
  const cps = chars.map((c) => base + (c.charCodeAt(0) - A));
  return String.fromCodePoint(...cps);
}
function flagFromCountryName(name?: string | null): string {
  if (!name) return '🌐';
  const code = COUNTRY_TO_CODE[name] || null;
  return flagFromIso2(code);
}

/* ==== Safe avatar ==== */
function SafeAvatar({
  src,
  alt,
  letterFallback,
}: {
  src?: string | null;
  alt: string;
  letterFallback: string;
}) {
  const url = resolveAvatarUrl(src);
  const isCloudinary =
    typeof url === 'string' &&
    (url.startsWith('https://res.cloudinary.com') || url.startsWith('http://res.cloudinary.com'));
  if (url && isCloudinary) {
    return <Image src={url} alt={alt} fill sizes="112px" className="rounded-full object-cover" priority={false} />;
  }
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} className="w-full h-full rounded-full object-cover" />;
  }
  return (
    <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-2xl">
      {letterFallback}
    </div>
  );
}

/* ==== Page ==== */
export default function BuyerProfilePage() {
  const params = useParams<{ username?: string }>();
  const router = useRouter();

  const rawParamUsername = (params?.username ?? '').toString().trim();
  const usernameForRequest = rawParamUsername;
  const usernameForDisplay = useMemo(() => (rawParamUsername || '').replace(/[<>]/g, ''), [rawParamUsername]);

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<NormalizedBuyerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  // Owner detection
  const [me, setMe] = useState<MeProfile | null>(null);
  const token = useMemo(() => getGlobalAuthToken?.() || '', []);

  // --- storage sync: listen for profile updates from /buyers/profile
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'pp:profile-updated' || !e.newValue) return;
      try {
        const payload = JSON.parse(e.newValue) as Partial<MeProfile> & { username?: string };
        if (!payload?.username || payload.username !== usernameForRequest) return;
        setProfileData((prev) => {
          if (!prev) return prev;
          return {
            user: { ...prev.user },
            profile: {
              ...prev.profile,
              bio: typeof payload.bio === 'string' ? payload.bio : prev.profile.bio,
              country:
                typeof payload.country === 'string' ? payload.country : prev.profile.country,
              profilePic:
                typeof payload.profilePic === 'string' ? payload.profilePic : prev.profile.profilePic,
            },
          };
        });
      } catch {
        /* ignore parse errors */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [usernameForRequest]);

  const fetchMe = useCallback(async () => {
    if (!token) return;
    try {
      const resp = await fetch(`/users/me/profile`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const json = await resp.json().catch(() => null);
      if (resp.ok && json?.success !== false) setMe(json.data as MeProfile);
    } catch {}
  }, [token]);

  const loadProfile = useCallback(async () => {
    if (!usernameForRequest) {
      setError('No username provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setHttpStatus(null);

    try {
      // IMPORTANT: call our same-origin proxy to avoid CORS
      const url = `/users/${encodeURIComponent(usernameForRequest)}/profile`;

      const tk = getGlobalAuthToken?.();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tk) headers.Authorization = `Bearer ${tk}`;

      const resp = await fetch(url, { method: 'GET', headers });
      setHttpStatus(resp.status);
      const json = (await resp.json().catch(() => null)) as BackendProfileResponse | null;

      if (!resp.ok) {
        const msg =
          json?.error?.message ||
          (resp.status === 404
            ? 'Profile not found.'
            : resp.status === 403
            ? 'Authentication required or insufficient permissions to view this buyer profile.'
            : 'Failed to load profile.');
        setError(msg);
        setLoading(false);
        return;
      }

      const normalized = normalizeProfileFromBackend(json);
      if (!normalized) {
        setError('Profile not found.');
        setLoading(false);
        return;
      }
      if (normalized.user.role === 'seller') {
        router.replace(`/sellers/${usernameForRequest}`);
        return;
      }
      setProfileData(normalized);
    } catch (error) {
      console.error('[BuyerProfilePage] loadProfile error:', error);
      setError('Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, [usernameForRequest, router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const isOwner = !!me && me.username === usernameForRequest;

  const sanitizedBio = useMemo(() => {
    const rawBio = profileData?.profile?.bio;
    if (!rawBio) return '';
    return sanitizeStrict(rawBio);
  }, [profileData?.profile?.bio]);

  const sanitizedCountry = useMemo(() => {
    const rawCountry = profileData?.profile?.country;
    if (!rawCountry) return '';
    return sanitizeStrict(rawCountry);
  }, [profileData?.profile?.country]);

  const sanitizedBanReason = useMemo(() => {
    const rawReason = profileData?.user?.banReason;
    if (!rawReason) return '';
    return sanitizeStrict(rawReason);
  }, [profileData?.user?.banReason]);

  if (!usernameForRequest) {
    return (
      <BanCheck>
        <div className="min-h-screen bg-gradient-to-b from-black via-neutral-950 to-black text-white px-6">
          <div className="mx-auto max-w-3xl pt-24 text-center">
            <h1 className="text-3xl font-semibold">Invalid username</h1>
            <p className="mt-3 text-neutral-400">Please provide a valid username in the URL.</p>
          </div>
        </div>
      </BanCheck>
    );
  }

  return (
    <BanCheck>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-neutral-950 to-black text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-10%] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[#ff950e]/12 blur-[110px] opacity-40" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[420px] w-[420px] rounded-full bg-[#ff5f1f]/8 blur-[150px]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950/70 shadow-[0_0_50px_rgba(255,149,14,0.08)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ff950e]/10 via-transparent to-transparent opacity-60" />
            <div className="relative p-6 sm:p-10">
              {loading ? (
                <div className="space-y-10 animate-pulse">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                    <div className="h-28 w-28 rounded-full bg-neutral-800/80" />
                    <div className="flex-1 space-y-4">
                      <div className="h-6 w-48 rounded bg-neutral-800/80" />
                      <div className="h-4 w-72 rounded bg-neutral-800/80" />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="h-20 rounded-2xl bg-neutral-800/80" />
                        <div className="h-20 rounded-2xl bg-neutral-800/80" />
                      </div>
                    </div>
                  </div>
                  <div className="h-11 w-40 rounded-full bg-neutral-800/80" />
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
                  <p className="text-lg font-semibold">Could not load buyer profile</p>
                  <p className="mt-2 text-sm text-red-100/80">{error}</p>
                  {httpStatus === 403 && (
                    <p className="mt-4 text-xs text-red-100/70">
                      Tip: Buyer profiles are private. Log in to view.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
                    <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff950e]/30 to-transparent blur-2xl opacity-50" />
                        <div className="relative h-32 w-32 overflow-hidden rounded-full border border-[#ff950e]/30 bg-neutral-900/80 p-[3px] sm:h-36 sm:w-36">
                          <div className="relative h-full w-full overflow-hidden rounded-full bg-neutral-950">
                            <SafeAvatar
                              src={profileData?.profile?.profilePic || null}
                              alt={`${usernameForDisplay}'s avatar`}
                              letterFallback={profileData?.user?.username?.[0]?.toUpperCase() ?? 'B'}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                        <span className="rounded-full border border-[#ff950e]/30 bg-[#ff950e]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#ffb347]">
                          Buyer Profile
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-6">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <h1 className="text-3xl font-bold sm:text-4xl">{usernameForDisplay}</h1>
                          <span className="rounded-full border border-neutral-700/60 bg-neutral-900/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-300">
                            Buyer
                          </span>
                        </div>

                        {sanitizedBio && (
                          <p className="max-w-2xl text-base leading-relaxed text-neutral-300 sm:text-lg">
                            {sanitizedBio}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/buyers/messages`}
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ffb347] via-[#ff950e] to-[#ff7b1f] px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#ff950e]/20 transition hover:shadow-[#ff950e]/35 focus:outline-none focus:ring-2 focus:ring-[#ff950e]/60 focus:ring-offset-2 focus:ring-offset-black"
                        >
                          <MessageCircle size={18} />
                          Message
                        </Link>

                        {isOwner && (
                          <Link
                            href={`/buyers/profile`}
                            className="inline-flex items-center gap-2 rounded-full border border-neutral-700/70 bg-neutral-900/70 px-5 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]/50 focus:ring-offset-2 focus:ring-offset-black"
                            title="Edit your buyer profile"
                          >
                            Edit profile
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 grid gap-5 sm:grid-cols-2">
                    <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
                      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/3 rounded-full bg-[#ff950e]/12 blur-2xl" />
                      <div className="relative flex items-start gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff950e]/10 text-[#ffb347]">
                          <CalendarDays size={18} />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Member since</p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {formatDate(profileData?.user?.joinedAt || profileData?.user?.createdAt)}
                          </p>
                          <p className="mt-1 text-sm text-neutral-400">
                            Welcome aboard! Thanks for being part of the community.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
                      <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 translate-y-1/2 translate-x-1/4 rounded-full bg-[#ff5f1f]/12 blur-2xl" />
                      <div className="relative flex items-start gap-4">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff950e]/10 text-[#ffb347]">
                          <MapPin size={18} />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Location</p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {profileData?.profile?.country ? (
                              <span>
                                {flagFromCountryName(profileData?.profile?.country)}{' '}
                                {sanitizedCountry}
                              </span>
                            ) : (
                              'Not shared yet'
                            )}
                          </p>
                          {isOwner && !profileData?.profile?.country && (
                            <p className="mt-1 text-sm text-neutral-400">
                              Add your country so sellers know where you are shopping from.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:col-span-2">
                      <div className="pointer-events-none absolute left-0 top-0 h-24 w-24 -translate-x-1/3 -translate-y-1/3 rounded-full bg-[#ff950e]/12 blur-2xl" />
                      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                          <span
                            className={`flex h-10 w-10 items-center justify-center rounded-full ${
                              profileData?.user?.isBanned
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-[#ff950e]/10 text-[#ffb347]'
                            }`}
                          >
                            {profileData?.user?.isBanned ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Account status</p>
                            <p
                              className={`mt-2 text-lg font-semibold ${
                                profileData?.user?.isBanned ? 'text-red-200' : 'text-white'
                              }`}
                            >
                              {profileData?.user?.isBanned ? 'Account suspended' : 'Active buyer'}
                            </p>
                            <p className="mt-1 text-sm text-neutral-400">
                              {profileData?.user?.isBanned
                                ? 'This account has been suspended.'
                                : 'Everything looks good. Enjoy browsing and connecting with sellers.'}
                            </p>
                          </div>
                        </div>

                        {profileData?.user?.isBanned && sanitizedBanReason && (
                          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                            {sanitizedBanReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </BanCheck>
  );
}
