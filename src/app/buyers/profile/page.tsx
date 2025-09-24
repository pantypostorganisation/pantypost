// src/app/buyers/profile/page.tsx
'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import BanCheck from '@/components/BanCheck';
import { getGlobalAuthToken } from '@/context/AuthContext';

type MeProfile = {
  username: string;
  role: 'buyer' | 'seller' | 'admin';
  bio: string;
  profilePic: string | null;
  country: string;
};

function getApiBase() {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/+$/, '');
  return base;
}

// Upload route: should accept multipart/form-data "file" and return JSON containing a URL
function getUploadEndpoint() {
  const ep = (process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT || '/api/upload').replace(/\/+$/, '');
  return ep;
}

/* Country helpers (name -> ISO2 -> flag) */
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
  const chars = code.toUpperCase().split('');
  const cps = chars.map((c) => base + (c.charCodeAt(0) - A));
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

  // Upload UI state
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const token = useMemo(() => getGlobalAuthToken?.() || '', []);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const resp = await fetch(`${getApiBase()}/users/me/profile`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.success === false) {
        setError(json?.error?.message || 'Failed to load your profile.');
        setLoading(false);
        return;
      }
      const data = json.data as MeProfile;
      setForm({
        username: data.username,
        role: data.role,
        bio: data.bio || '',
        profilePic: data.profilePic || '',
        country: data.country || '',
      });
    } catch {
      setError('Failed to load your profile.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const broadcastProfileUpdate = (payload: Partial<MeProfile> & { username: string }) => {
    try {
      localStorage.setItem('pp:profile-updated', JSON.stringify({ ts: Date.now(), ...payload }));
    } catch {
      /* ignore */
    }
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const resp = await fetch(`${getApiBase()}/users/me/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          bio: form.bio,
          profilePic: form.profilePic || null,
          country: form.country,
        }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok || json?.success === false) {
        setError(json?.error?.message || 'Failed to update your profile.');
      } else {
        const d = json.data as MeProfile;
        setForm({
          username: d.username,
          role: d.role,
          bio: d.bio || '',
          profilePic: d.profilePic || '',
          country: d.country || '',
        });
        setSuccess('Profile saved.');
        // Notify public page to hot-update avatar/country/bio
        broadcastProfileUpdate({
          username: d.username,
          bio: d.bio || '',
          country: d.country || '',
          profilePic: d.profilePic || '',
        });
      }
    } catch {
      setError('Failed to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  // Upload handler (multipart/form-data)
  const onUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setUploadErr(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const resp = await fetch(getUploadEndpoint(), {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          // let the browser set Content-Type for multipart
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
          // Set the new URL in the form; user still needs to Save to persist
          setForm((f) => ({ ...f, profilePic: url }));
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
            <div className="rounded-xl border border-red-700 bg-red-900/10 p-4 text-red-300">
              {error}
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

              {/* Country with quick picks + datalist */}
              <div>
                <label htmlFor="country" className="block text-sm text-gray-400 mb-1">
                  Country
                </label>

                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    'Australia',
                    'United States',
                    'United Kingdom',
                    'Canada',
                    'New Zealand',
                    'Germany',
                    'France',
                    'Japan',
                    'India',
                  ].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, country: c }))}
                      className={`px-2 py-1 rounded-lg border ${
                        form.country === c
                          ? 'border-[#ff950e] bg-[#ff950e]/10'
                          : 'border-neutral-700 bg-neutral-900'
                      } text-sm`}
                      title={c}
                    >
                      <span className="mr-1">{flagFromCountryName(c)}</span>
                      {c}
                    </button>
                  ))}
                </div>

                <input
                  id="country"
                  list="countries-list"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.slice(0, 56) }))}
                  placeholder="Start typing your country…"
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-gray-200 placeholder:text-gray-500"
                  disabled={disabled}
                />
                <datalist id="countries-list">
                  {Object.keys(COUNTRY_TO_CODE)
                    .sort()
                    .map((name) => (
                      <option key={name} value={name} />
                    ))}
                </datalist>

                <div className="text-xs text-gray-500 mt-1">
                  Selected: <span className="mr-1">{flagFromCountryName(form.country)}</span>
                  {form.country || '—'}
                </div>
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

              {/* Profile picture: upload only (no URL field) */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Profile picture</label>

                {/* Preview */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-16 h-16 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center text-xl">
                    {form.profilePic ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.profilePic} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="opacity-70">No photo</span>
                    )}
                  </div>
                  {form.profilePic && (
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, profilePic: '' }))}
                      className="px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 hover:border-neutral-600 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Upload file */}
                <div className="flex flex-col gap-2">
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
                  <p className="text-xs text-gray-500">
                    After the upload finishes, click <b>Save</b> to apply it to your profile.
                  </p>
                </div>
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

              <div className="text-xs text-gray-500">
                Safety: don’t paste secrets in your bio. We sanitize text on display.
              </div>
            </form>
          )}
        </div>
      </div>
    </BanCheck>
  );
}
