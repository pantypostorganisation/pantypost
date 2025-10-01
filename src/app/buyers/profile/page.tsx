// src/app/buyers/profile/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import BanCheck from '@/components/BanCheck';
import { getGlobalAuthToken } from '@/context/AuthContext';
import { buildApiUrl, API_BASE_URL, API_ENDPOINTS } from '@/services/api.config';

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
  return buildApiUrl(API_ENDPOINTS.UPLOAD.PROFILE);
}

const API_ORIGIN = (() => {
  try {
    const parsed = new URL(API_BASE_URL);
    return parsed.origin;
  } catch {
    return API_BASE_URL;
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
const COUNTRY_TO_CODE: Record<string, string> = {
  Australia: 'AU',
  Canada: 'CA',
  'United States': 'US',
  'United Kingdom': 'GB',
  Ireland: 'IE',
  Germany: 'DE',
  France: 'FR',
  Spain: 'ES',
  Italy: 'IT',
  Netherlands: 'NL',
  Belgium: 'BE',
  Switzerland: 'CH',
  Austria: 'AT',
  Sweden: 'SE',
  Norway: 'NO',
  Denmark: 'DK',
  Finland: 'FI',
  Poland: 'PL',
  Portugal: 'PT',
  Greece: 'GR',
  Brazil: 'BR',
  Mexico: 'MX',
  Argentina: 'AR',
  Chile: 'CL',
  Colombia: 'CO',
  Peru: 'PE',
  Japan: 'JP',
  'South Korea': 'KR',
  China: 'CN',
  India: 'IN',
  Indonesia: 'ID',
  Philippines: 'PH',
  Thailand: 'TH',
  Vietnam: 'VN',
  Singapore: 'SG',
  Malaysia: 'MY',
  'New Zealand': 'NZ',
  'South Africa': 'ZA',
  Nigeria: 'NG',
  Egypt: 'EG',
  Turkey: 'TR',
  Israel: 'IL',
  'United Arab Emirates': 'AE',
  'Saudi Arabia': 'SA',
  Ukraine: 'UA',
  Russia: 'RU',
};
function flagFromIso2(code?: string | null): string {
  if (!code || code.length !== 2) return '🌐';
  const base = 0x1f1e6;
  const A = 'A'.charCodeAt(0);
  const cps = code.toUpperCase().split('').map((c) => base + (c.charCodeAt(0) - A));
  return String.fromCodePoint(...cps);
}
function flagFromCountryName(name?: string | null): string {
  if (!name) return '🌐';
  const code = COUNTRY_TO_CODE[name] || null;
  return flagFromIso2(code);
}

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
        const d = (json.data || json) as MeProfile;
        setForm({
          username: d.username,
          role: d.role,
          bio: d.bio || '',
          profilePic: sanitizeProfilePicValue(d.profilePic),
          country: d.country || '',
        });
        setSuccess('Profile saved.');
        broadcastProfileUpdate({
          username: d.username,
          bio: d.bio || '',
          country: d.country || '',
          profilePic: sanitizeProfilePicValue(d.profilePic),
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
      fd.append('profilePic', file);
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

  return (
    <BanCheck>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-10">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Edit Profile</h1>

          {loading ? (
            <div className="space-y-4">
              <div className="h-10 bg-neutral-800 rounded" />
              <div className="h-24 bg-neutral-800 rounded" />
              <div className="h-10 bg-neutral-800 rounded" />
              <div className="h-12 bg-neutral-800 rounded" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-700 bg-red-900/10 p-4">
              <div className="text-red-400 font-semibold mb-1">Could not load buyer profile</div>
              <div className="text-red-200 text-sm">{error}</div>
              {error.includes('logged in') && (
                <div className="mt-3">
                  <a
                    href="/login"
                    className="inline-block px-3 py-2 rounded-md bg-[#ff950e] hover:bg-[#e0850d] text-black font-medium"
                  >
                    Go to Login
                  </a>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={onSave} className="space-y-6">
              {/* Username (read-only) */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input
                  disabled
                  value={form.username}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-gray-300 disabled:opacity-70"
                />
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm text-gray-400 mb-1">
                  Country
                </label>
                <input
                  id="country"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.slice(0, 56) }))}
                  placeholder="Your country"
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-gray-200 placeholder:text-gray-500"
                  disabled={disabled}
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm text-gray-400 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value.slice(0, 500) }))}
                  placeholder="Tell people a little about you (max 500 chars)"
                  rows={4}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-gray-200 placeholder:text-gray-500"
                  disabled={disabled}
                />
                <div className="text-xs text-gray-500 mt-1">{form.bio.length}/500</div>
              </div>

              {/* Profile picture */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Profile picture</label>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-16 h-16 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center text-xl">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="opacity-70">No photo</span>
                    )}
                  </div>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, profilePic: '' }))}
                      className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onUpload(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-300 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-neutral-800 file:text-gray-200 hover:file:bg-neutral-700"
                  disabled={uploading || disabled}
                />
                {uploading && <div className="text-xs text-gray-400">Uploading…</div>}
                {uploadErr && (
                  <div className="text-sm text-red-400 border border-red-700 bg-red-900/10 rounded-lg p-2">
                    {uploadErr}
                  </div>
                )}
                <p className="text-xs text-gray-500">After the upload finishes, click <b>Save</b> to apply.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={disabled}
                  className="px-4 py-2 rounded-xl bg-[#ff950e] hover:bg-[#e0850d] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                {success && <span className="text-green-400 text-sm">{success}</span>}
              </div>
            </form>
          )}
        </div>
      </div>
    </BanCheck>
  );
}
