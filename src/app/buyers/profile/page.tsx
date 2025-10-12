// src/app/buyers/profile/page.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import BanCheck from '@/components/BanCheck';
import { getGlobalAuthToken } from '@/context/AuthContext';
import { buildApiUrl, API_BASE_URL } from '@/services/api.config';
import { COUNTRY_TO_CODE, flagFromCountryName } from '@/constants/countries';
import { AlertTriangle, Loader2, MapPin, ShieldCheck, Upload } from 'lucide-react';

type MeProfile = {
  username: string;
  role: 'buyer' | 'seller' | 'admin';
  bio: string;
  profilePic: string | null;
  country: string;
};

// Upload endpoint (kept as-is, only used for file POST)
function getUploadEndpoint() {
  const envOverride = process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT?.trim();
  if (envOverride) {
    return envOverride.replace(/\/+$/, '');
  }
  return buildApiUrl('/upload');
}

const API_ORIGIN = (() => {
  try {
    const parsed = new URL(API_BASE_URL);
    return parsed.origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
})();

const UPLOAD_PREFIX = API_ORIGIN ? `${API_ORIGIN}/uploads/` : '';

function sanitizeProfilePicValue(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (UPLOAD_PREFIX && trimmed.startsWith(UPLOAD_PREFIX)) {
    return trimmed.slice(API_ORIGIN.length) || trimmed;
  }
  if (trimmed.startsWith('uploads/')) {
    return `/${trimmed}`;
  }
  return trimmed;
}

function resolveProfilePicUrl(raw?: string | null): string {
  const sanitized = sanitizeProfilePicValue(raw);
  if (!sanitized) return '';
  if (/^https?:\/\//i.test(sanitized)) {
    return sanitized;
  }
  if (sanitized.startsWith('/uploads/')) {
    if (API_ORIGIN) {
      return `${API_ORIGIN}${sanitized}`;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${sanitized}`;
    }
  }
  if (sanitized.startsWith('uploads/')) {
    const withSlash = `/${sanitized}`;
    if (API_ORIGIN) {
      return `${API_ORIGIN}${withSlash}`;
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${withSlash}`;
    }
    return withSlash;
  }
  return sanitized;
}

// Always read the latest token right before calls
function getToken(): string {
  try {
    return getGlobalAuthToken?.() || '';
  } catch {
    return '';
  }
}

/* Country helpers */
const COUNTRY_OPTIONS = Object.keys(COUNTRY_TO_CODE).sort((a, b) => a.localeCompare(b));

export default function BuyerSelfProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<MeProfile>({
    username: '',
    role: 'buyer',
    bio: '',
    profilePic: '',
    country: '',
  });

  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const countryOptions = useMemo(() => {
    if (form.country && !COUNTRY_OPTIONS.includes(form.country)) {
      return [...COUNTRY_OPTIONS, form.country].sort((a, b) => a.localeCompare(b));
    }
    return COUNTRY_OPTIONS;
  }, [form.country]);

  // GET current buyer profile
  const fetchMe = useCallback(async () => {
    const token = getToken();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const url = buildApiUrl('/profilebuyer'); // << unified builder
      const resp = await fetch(url, {
        method: 'GET',
        credentials: 'include', // allow cookie-based auth too
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.success === false) {
        if (resp.status === 401) {
          setError('You need to be logged in to view this page.');
        } else {
          setError(json?.error?.message || 'Failed to load your profile.');
        }
        setLoading(false);
        return;
      }

      const data = (json.data || json) as MeProfile;
      setForm({
        username: data.username,
        role: data.role,
        bio: data.bio || '',
        profilePic: sanitizeProfilePicValue(data.profilePic),
        country: data.country || '',
      });
    } catch {
      setError('Failed to load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Wait briefly for token on first mount to avoid race-caused 401/404
  useEffect(() => {
    let cancelled = false;
    let tries = 0;

    (async () => {
      while (!cancelled && !getToken() && tries < 10) {
        await new Promise((r) => setTimeout(r, 150));
        tries++;
      }
      if (!cancelled) fetchMe();
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchMe]);

  const broadcastProfileUpdate = (payload: Partial<MeProfile> & { username: string }) => {
    try {
      const { profilePic, ...rest } = payload;
      const normalized = {
        ...rest,
        ...(typeof profilePic !== 'undefined'
          ? { profilePic: sanitizeProfilePicValue(profilePic) }
          : {}),
      } as Partial<MeProfile> & { username: string };
      localStorage.setItem('pp:profile-updated', JSON.stringify({ ts: Date.now(), ...normalized }));
    } catch {
      /* ignore */
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const url = buildApiUrl('/profilebuyer'); // << unified builder
      const resp = await fetch(url, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bio: form.bio,
          profilePic: sanitizeProfilePicValue(form.profilePic) || null,
          country: form.country,
        }),
      });

      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.success === false) {
        setError(json?.error?.message || 'Failed to update your profile.');
      } else {
        const candidateData = (() => {
          const rawData = json?.data;
          if (rawData && typeof rawData === 'object') {
            return rawData as Partial<MeProfile>;
          }
          if (json && typeof json === 'object') {
            const possible = json as Partial<MeProfile>;
            const relevantKeys: (keyof MeProfile)[] = ['username', 'role', 'bio', 'profilePic', 'country'];
            if (relevantKeys.some((key) => typeof possible[key] !== 'undefined')) {
              return possible;
            }
          }
          return null;
        })();

        if (candidateData) {
          setForm((prev) => ({
            username: typeof candidateData.username === 'string' && candidateData.username
              ? candidateData.username
              : prev.username,
            role:
              candidateData.role === 'buyer' || candidateData.role === 'seller' || candidateData.role === 'admin'
                ? candidateData.role
                : prev.role,
            bio: typeof candidateData.bio === 'string' ? candidateData.bio : prev.bio,
            profilePic:
              'profilePic' in candidateData
                ? sanitizeProfilePicValue(candidateData.profilePic)
                : prev.profilePic,
            country: typeof candidateData.country === 'string' ? candidateData.country : prev.country,
          }));
        }

        setSuccess('Profile saved.');
        const broadcastSource = candidateData || form;
        broadcastProfileUpdate({
          username: broadcastSource.username || form.username,
          bio: broadcastSource.bio || form.bio || '',
          country: broadcastSource.country || form.country || '',
          profilePic: sanitizeProfilePicValue(broadcastSource.profilePic ?? form.profilePic),
        });
      }
    } catch {
      setError('Failed to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  // Upload handler (unchanged; uses separate upload endpoint)
  const onUpload = async (file: File | null) => {
    if (!file) return;
    const token = getToken();
    setUploading(true);
    setUploadErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(getUploadEndpoint(), {
        method: 'POST',
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: fd,
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.success === false) {
        setUploadErr(json?.error?.message || 'Upload failed.');
      } else {
        const url: string | undefined =
          json?.url || json?.data?.url || json?.data?.secure_url || json?.secure_url;
        if (!url) {
          setUploadErr('Upload response missing URL.');
        } else {
          setForm((f) => ({ ...f, profilePic: sanitizeProfilePicValue(url) }));
          setSuccess('Photo uploaded — click Save to apply.');
        }
      }
    } catch {
      setUploadErr('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const disabled = saving || loading;
  const previewUrl = resolveProfilePicUrl(form.profilePic);
  const countryFlag = useMemo(() => (form.country ? flagFromCountryName(form.country) : '🌐'), [form.country]);
  const usernameInitial = useMemo(() => form.username?.[0]?.toUpperCase() || 'B', [form.username]);

  return (
    <BanCheck>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-black via-neutral-950 to-black text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-10%] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#ff950e]/12 blur-[120px] opacity-40" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[420px] w-[420px] rounded-full bg-[#ff5f1f]/12 blur-[150px]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/70 shadow-[0_0_50px_rgba(255,149,14,0.08)]">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ff950e]/12 via-transparent to-transparent opacity-60" />
            <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[280px_1fr]">
              {loading ? (
                <>
                  <div className="space-y-6">
                    <div className="mx-auto h-32 w-32 animate-pulse rounded-full bg-neutral-800/80 lg:mx-0" />
                    <div className="mx-auto h-4 w-40 animate-pulse rounded-full bg-neutral-800/80 lg:mx-0" />
                    <div className="space-y-3">
                      <div className="h-16 animate-pulse rounded-2xl border border-neutral-800/70 bg-neutral-900/70" />
                      <div className="h-16 animate-pulse rounded-2xl border border-neutral-800/70 bg-neutral-900/70" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="h-6 w-48 animate-pulse rounded-full bg-neutral-800/80" />
                    <div className="space-y-4">
                      <div className="h-12 animate-pulse rounded-xl border border-neutral-800/70 bg-neutral-900/70" />
                      <div className="h-24 animate-pulse rounded-xl border border-neutral-800/70 bg-neutral-900/70" />
                      <div className="h-20 animate-pulse rounded-xl border border-neutral-800/70 bg-neutral-900/70" />
                    </div>
                    <div className="h-11 w-40 animate-pulse rounded-full bg-neutral-800/80" />
                  </div>
                </>
              ) : error ? (
                <div className="lg:col-span-2">
                  <div className="flex flex-col gap-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20 text-red-200">
                        <AlertTriangle size={18} />
                      </span>
                      <div>
                        <p className="text-lg font-semibold">Could not load buyer profile</p>
                        <p className="mt-1 text-sm text-red-100/80">{error}</p>
                      </div>
                    </div>
                    {error.toLowerCase().includes('logged in') && (
                      <div>
                        <a
                          href="/login"
                          className="inline-flex items-center justify-center rounded-full bg-[#ff950e] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#ff7b1f]"
                        >
                          Go to login
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <aside className="space-y-6">
                    <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#ff950e]/35 to-transparent blur-2xl opacity-70" />
                        <div className="relative h-32 w-32 overflow-hidden rounded-full border border-[#ff950e]/30 bg-neutral-950/90 p-[3px] sm:h-36 sm:w-36">
                          <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-neutral-950">
                            {previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-3xl font-semibold text-neutral-500">{usernameInitial}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <span className="inline-flex items-center justify-center rounded-full border border-[#ff950e]/30 bg-[#ff950e]/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ffb347]">
                          Buyer profile
                        </span>
                        <h1 className="text-3xl font-bold sm:text-4xl">{form.username || 'Your profile'}</h1>
                        <p className="max-w-xs text-sm leading-relaxed text-neutral-300">
                          {form.bio ? form.bio : 'Add a short bio so sellers can get to know you.'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
                        <div className="pointer-events-none absolute right-0 top-0 h-20 w-20 -translate-y-1/3 translate-x-1/3 rounded-full bg-[#ff950e]/12 blur-2xl" />
                        <div className="relative flex items-start gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff950e]/10 text-[#ffb347]">
                            <MapPin size={18} />
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Location</p>
                            <p className="mt-2 text-base font-semibold text-white">
                              {form.country ? (
                                <span>
                                  {countryFlag} {form.country}
                                </span>
                              ) : (
                                'Not shared yet'
                              )}
                            </p>
                            {!form.country && (
                              <p className="mt-1 text-xs text-neutral-400">Let sellers know where you are shopping from.</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
                        <div className="pointer-events-none absolute bottom-0 right-0 h-20 w-20 translate-y-1/3 translate-x-1/4 rounded-full bg-[#ff5f1f]/10 blur-2xl" />
                        <div className="relative flex items-start gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff950e]/10 text-[#ffb347]">
                            <ShieldCheck size={18} />
                          </span>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Profile health</p>
                            <p className="mt-2 text-base font-semibold text-white">
                              {form.bio || previewUrl ? 'Looking good' : 'Needs attention'}
                            </p>
                            <p className="mt-1 text-xs text-neutral-400">
                              {form.bio || previewUrl
                                ? 'Keep your profile up to date to build trust with sellers.'
                                : 'Add a bio and profile photo to help sellers recognise you.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>
                  <form onSubmit={onSave} className="space-y-8">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold">Edit your profile</h2>
                      <p className="text-sm text-neutral-400">
                        Update the details sellers will see when you reach out or place orders.
                      </p>
                    </div>
                    {success && (
                      <div className="flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                        <ShieldCheck size={16} />
                        {success}
                      </div>
                    )}
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Username</label>
                        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-neutral-400">
                          {form.username || '—'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="country" className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                          Country
                        </label>
                        <div className="relative">
                          <select
                            id="country"
                            value={form.country}
                            onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                            className="w-full appearance-none rounded-2xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 pr-12 text-sm text-neutral-100 focus:border-[#ff950e]/60 focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40"
                            disabled={disabled}
                          >
                            <option value="">🌐 Select country</option>
                            {countryOptions.map((country) => (
                              <option key={country} value={country}>
                                {`${flagFromCountryName(country)} ${country}`}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center text-neutral-500">▼</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="bio" className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                          Bio
                        </label>
                        <textarea
                          id="bio"
                          value={form.bio}
                          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value.slice(0, 500) }))}
                          placeholder="Tell people a little about you (max 500 characters)"
                          rows={5}
                          className="min-h-[140px] w-full rounded-2xl border border-neutral-800 bg-neutral-900/80 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-[#ff950e]/60 focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40"
                          disabled={disabled}
                        />
                        <div className="text-right text-xs text-neutral-500">{form.bio.length}/500</div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Profile picture</label>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                          <div className="relative h-20 w-20 overflow-hidden rounded-full border border-neutral-800 bg-neutral-900">
                            {previewUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">No photo</div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col gap-3">
                            <label
                              className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-neutral-700/70 bg-neutral-900/80 px-4 py-2 text-sm font-medium transition ${
                                uploading || disabled
                                  ? 'cursor-not-allowed opacity-60'
                                  : 'hover:border-[#ff950e]/60 hover:text-white'
                              }`}
                            >
                              <Upload size={16} className="text-[#ffb347]" />
                              <span>Upload new photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => onUpload(e.target.files?.[0] || null)}
                                className="hidden"
                                disabled={uploading || disabled}
                              />
                            </label>
                            {previewUrl && (
                              <button
                                type="button"
                                onClick={() => setForm((f) => ({ ...f, profilePic: '' }))}
                                className="inline-flex w-fit items-center justify-center rounded-full border border-neutral-700/70 bg-transparent px-4 py-2 text-sm text-neutral-300 transition hover:border-red-400/60 hover:text-red-300"
                              >
                                Remove photo
                              </button>
                            )}
                          </div>
                        </div>
                        {uploading && <div className="text-xs text-neutral-400">Uploading…</div>}
                        {uploadErr && (
                          <div className="flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                            <AlertTriangle size={16} />
                            {uploadErr}
                          </div>
                        )}
                        <p className="text-xs text-neutral-500">
                          After the upload finishes, click <strong>Save changes</strong> to apply.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        type="submit"
                        disabled={disabled}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ffb347] via-[#ff950e] to-[#ff7b1f] px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-[#ff950e]/25 transition hover:shadow-[#ff950e]/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {saving ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </BanCheck>
  );
}
