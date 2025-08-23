// src/hooks/useProfileSave.ts

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { enhancedUsersService } from '@/services/users.service.enhanced';
import type { UserProfile } from '@/types/users';

type ProfileUpdates =
  Partial<Omit<UserProfile, 'subscriptionPrice'>> & {
    // Allow forms to pass either a number or a string; we'll normalize to string
    subscriptionPrice?: string | number;
  };

type SaveResult = { ok: boolean; message?: string; data?: UserProfile };

function toPriceString(v: string | number): string {
  if (typeof v === 'number') {
    return Number.isFinite(v) ? v.toFixed(2) : '0';
  }
  const n = parseFloat(v);
  return Number.isFinite(n) ? n.toFixed(2) : '0';
}

export function useProfileSave(username: string) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(
    async (updates: ProfileUpdates): Promise<SaveResult> => {
      setSaving(true);
      setError(null);
      try {
        const { subscriptionPrice: spRaw, ...rest } = updates;

        // Build payload as Partial<UserProfile> with subscriptionPrice coerced to string
        const normalized: Partial<UserProfile> = { ...rest };

        if (spRaw !== undefined) {
          // Always send a string to satisfy TS type (and backend accepts this)
          normalized.subscriptionPrice =
            spRaw === '' ? '0' : toPriceString(spRaw);
        }

        const res = await enhancedUsersService.updateUserProfile(
          username,
          normalized
        );

        if (!res.success) {
          const msg =
            res.error?.message ||
            res.error?.code ||
            'Profile update failed';
          setError(msg);
          // Log the whole error object to aid debugging instead of `{}`.
          console.error('[useProfileSave] Failed to save profile:', res.error || res);
          return { ok: false, message: msg };
        }

        return { ok: true, data: res.data };
      } catch (e: any) {
        const msg = e?.message || 'Unexpected error while saving profile';
        setError(msg);
        console.error('[useProfileSave] Exception:', e);
        return { ok: false, message: msg };
      } finally {
        setSaving(false);
      }
    },
    [username]
  );

  return { saving, error, save };
}
