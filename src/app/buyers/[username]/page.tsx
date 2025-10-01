// src/app/buyers/[username]/page.tsx
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BanCheck from '@/components/BanCheck';
import { sanitizeStrict } from '@/utils/security/sanitization';
import Image from 'next/image';
import Link from 'next/link';
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
function normalizeProfileFromBackend(raw: any): NormalizedBuyerProfile | null {
  if (!raw || raw.success === false) return null;
  const d = raw.data;
  if (!d || !d.username || !d.role) return null;
  return {
    user: {
      username: String(d.username),
      role: d.role,
      joinedAt: d.joinedDate ?? d.createdAt,
      createdAt: d.createdAt,
      isBanned: d.isBanned,
      banReason: d.banReason,
    },
    profile: {
      bio: d.bio ?? '',
      profilePic: d.profilePic ?? null,
      country: d.country ?? null,
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
      const json: any = await resp.json().catch(() => null);

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
    } catch (e: any) {
      console.error('[BuyerProfilePage] loadProfile error:', e);
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

  if (!usernameForRequest) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-4xl mx-auto pt-24">
          <h1 className="text-2xl font-bold mb-4">Invalid username</h1>
          <p className="text-gray-300">Please provide a valid username in the URL.</p>
        </div>
      </div>
    );
  }

  return (
    <BanCheck>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-10">
          <div className="bg-[var(--color-card,#171717)] rounded-2xl shadow-lg p-6 md:p-8 border border-neutral-800">
            {loading ? (
              <div className="animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-neutral-800" />
                  <div className="flex-1">
                    <div className="h-5 w-40 bg-neutral-800 rounded mb-3" />
                    <div className="h-4 w-64 bg-neutral-800 rounded" />
                  </div>
                </div>
                <div className="h-4 w-56 bg-neutral-800 rounded mt-6" />
              </div>
            ) : error ? (
              <div className="text-red-400">
                <p className="font-semibold mb-2">Could not load buyer profile</p>
                <p className="text-sm text-red-300">{error}</p>
                {httpStatus === 403 && (
                  <p className="text-xs text-red-300 mt-2">Tip: Buyer profiles are private. Log in to view.</p>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="relative w-24 h-24 md:w-28 md:h-28">
                    <div className="absolute inset-0 rounded-full ring-2 ring-[#ff950e]/40" />
                    <SafeAvatar
                      src={profileData?.profile?.profilePic || null}
                      alt={`${usernameForDisplay}'s avatar`}
                      letterFallback={profileData?.user?.username?.[0]?.toUpperCase() ?? 'B'}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl md:text-3xl font-bold">{usernameForDisplay}</h1>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-800 border border-neutral-700">
                        Buyer
                      </span>
                    </div>

                    {profileData?.profile?.bio && (
                      <p className="text-gray-300 mt-2">{sanitizeStrict(profileData.profile.bio!)}</p>
                    )}

                    <div className="text-sm text-gray-400 mt-3 space-y-1">
                      <div>Joined: {formatDate(profileData?.user?.joinedAt || profileData?.user?.createdAt)}</div>

                      <div className="flex items-center gap-2">
                        <span>
                          {flagFromCountryName(profileData?.profile?.country)}{' '}
                          {profileData?.profile?.country
                            ? sanitizeStrict(profileData.profile.country!)
                            : 'Country not set'}
                        </span>

                        {isOwner && (
                          <Link
                            href={`/buyers/profile`}
                            className="ml-2 text-xs px-2 py-1 rounded-md bg-neutral-800 border border-neutral-700 hover:border-neutral-600"
                            title="Edit country and profile details"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={`/buyers/messages`}
                    className="px-4 py-2 rounded-xl bg-neutral-800 border border-neutral-700 hover:border-neutral-600 transition"
                  >
                    Message
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </BanCheck>
  );
}
