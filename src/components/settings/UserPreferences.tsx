// src/components/settings/UserPreferences.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Lock, Globe, Save, Loader2 } from 'lucide-react';
import { usersService } from '@/services';
import { UserPreferences as UserPreferencesType } from '@/types/users';
import { useAuth } from '@/context/AuthContext';
import { SecureForm } from '@/components/ui/SecureForm';
import { z } from 'zod';
import { sanitizeStrict } from '@/utils/security/sanitization';

// ----- Whitelists (keep in sync with backend) -----
const LANGUAGES = ['en', 'es', 'fr', 'de', 'ja'] as const;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD'] as const;
const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const;
const PROFILE_VISIBILITY = ['public', 'subscribers', 'private'] as const;

// ----- Zod schema for runtime validation -----
const NotificationsSchema = z
  .object({
    messages: z.boolean(),
    orders: z.boolean(),
    promotions: z.boolean(),
    newsletters: z.boolean(),
  })
  .strict();

const PrivacySchema = z
  .object({
    showOnlineStatus: z.boolean(),
    allowDirectMessages: z.boolean(),
    profileVisibility: z.enum(PROFILE_VISIBILITY),
  })
  .strict();

const UserPreferencesSchema = z
  .object({
    notifications: NotificationsSchema,
    privacy: PrivacySchema,
    language: z.enum(LANGUAGES),
    currency: z.enum(CURRENCIES),
    timezone: z.enum(TIMEZONES),
  })
  .strict();

// Default preferences (safe fallback)
const DEFAULT_PREFERENCES: UserPreferencesType = {
  notifications: {
    messages: true,
    orders: true,
    promotions: false,
    newsletters: false,
  },
  privacy: {
    showOnlineStatus: true,
    allowDirectMessages: true,
    profileVisibility: 'public',
  },
  language: 'en',
  currency: 'USD',
  timezone: 'UTC',
};

type Msg = { type: 'success' | 'error'; text: string };

export default function UserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferencesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Msg | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ---- Helpers: sanitization for display only ----
  const showMsg = (msg: Msg) => setMessage({ type: msg.type, text: sanitizeStrict(msg.text) });

  // ---- Load preferences (with validation) ----
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.username) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await usersService.getUserPreferences(user.username);
        if (result?.success && result.data) {
          const parsed = UserPreferencesSchema.safeParse(result.data);
          if (parsed.success) {
            if (isMounted.current) {
              setPreferences(parsed.data as UserPreferencesType);
              setHasChanges(false);
            }
          } else {
            console.warn('Invalid preferences from server, using defaults:', parsed.error?.flatten());
            if (isMounted.current) {
              setPreferences(DEFAULT_PREFERENCES);
              setHasChanges(false);
              showMsg({ type: 'error', text: 'Some settings were invalid and were reset to defaults.' });
            }
          }
        } else {
          if (isMounted.current) {
            setPreferences(DEFAULT_PREFERENCES);
            setHasChanges(false);
            if (result?.error?.message) {
              showMsg({ type: 'error', text: result.error.message });
            } else {
              showMsg({ type: 'error', text: 'Failed to load preferences' });
            }
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        if (isMounted.current) {
          setPreferences(DEFAULT_PREFERENCES);
          setHasChanges(false);
          showMsg({ type: 'error', text: 'Failed to load preferences' });
        }
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.username]);

  // ---- Updaters with runtime guards ----
  const updateNestedPreference = <T extends 'notifications' | 'privacy'>(
    category: T,
    key: keyof UserPreferencesType[T],
    value: unknown
  ) => {
    if (!preferences) return;

    if (category === 'notifications') {
      // All notification keys must be boolean
      if (typeof value !== 'boolean') return;
    } else if (category === 'privacy') {
      if (key === 'profileVisibility') {
        if (!PROFILE_VISIBILITY.includes(value as any)) return;
      } else {
        if (typeof value !== 'boolean') return;
      }
    }

    const updated: UserPreferencesType = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: value as UserPreferencesType[T][keyof UserPreferencesType[T]],
      },
    };

    // Validate after change to keep state consistent
    const parsed = UserPreferencesSchema.safeParse(updated);
    if (parsed.success) {
      setPreferences(parsed.data as UserPreferencesType);
      setHasChanges(true);
    }
  };

  const updateDirectPreference = (key: 'language' | 'currency' | 'timezone', value: string) => {
    if (!preferences) return;

    if (key === 'language' && !LANGUAGES.includes(value as any)) return;
    if (key === 'currency' && !CURRENCIES.includes(value as any)) return;
    if (key === 'timezone' && !TIMEZONES.includes(value as any)) return;

    const updated: UserPreferencesType = { ...preferences, [key]: value as any };
    const parsed = UserPreferencesSchema.safeParse(updated);
    if (parsed.success) {
      setPreferences(parsed.data as UserPreferencesType);
      setHasChanges(true);
    }
  };

  // ---- Save preferences (validate before sending) ----
  const savePreferences = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user?.username || !preferences) return;

    // Validate before submit to backend
    const parsed = UserPreferencesSchema.safeParse(preferences);
    if (!parsed.success) {
      showMsg({ type: 'error', text: 'Please correct invalid settings before saving.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await usersService.updateUserPreferences(user.username, parsed.data);
      if (result?.success) {
        showMsg({ type: 'success', text: 'Preferences saved successfully!' });
        setHasChanges(false);

        // Track preference update; keep payload minimal and non-sensitive
        await usersService.trackActivity({
          userId: user.username,
          type: 'profile_update',
          details: { action: 'preferences_updated' },
        });
      } else {
        showMsg({
          type: 'error',
          text: result?.error?.message || 'Failed to save preferences',
        });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showMsg({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      if (isMounted.current) setSaving(false);
    }
  };

  // ---- Render states ----
  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-[#ff950e] animate-spin" />
        </div>
      </div>
    );
    }

  if (!preferences) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6">
        <p className="text-gray-400 text-center">Unable to load preferences</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-800 p-6">
      <SecureForm
        onSubmit={savePreferences}
        rateLimitKey="preferences_save"
        rateLimitConfig={{ maxAttempts: 10, windowMs: 60 * 1000 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Preferences</h2>
          {hasChanges && <span className="text-sm text-yellow-500">You have unsaved changes</span>}
        </div>

        {/* Notifications Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Bell className="w-5 h-5 text-[#ff950e] mr-2" />
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Messages</span>
              <input
                type="checkbox"
                checked={preferences.notifications.messages}
                onChange={(e) => updateNestedPreference('notifications', 'messages', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e]"
                aria-label="Toggle message notifications"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Orders</span>
              <input
                type="checkbox"
                checked={preferences.notifications.orders}
                onChange={(e) => updateNestedPreference('notifications', 'orders', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e]"
                aria-label="Toggle order notifications"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Promotions</span>
              <input
                type="checkbox"
                checked={preferences.notifications.promotions}
                onChange={(e) => updateNestedPreference('notifications', 'promotions', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e]"
                aria-label="Toggle promotions notifications"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Newsletters</span>
              <input
                type="checkbox"
                checked={preferences.notifications.newsletters}
                onChange={(e) => updateNestedPreference('notifications', 'newsletters', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e]"
                aria-label="Toggle newsletters"
              />
            </label>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Lock className="w-5 h-5 text-[#ff950e] mr-2" />
            <h3 className="text-lg font-semibold text-white">Privacy</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Show online status</span>
              <input
                type="checkbox"
                checked={preferences.privacy.showOnlineStatus}
                onChange={(e) => updateNestedPreference('privacy', 'showOnlineStatus', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e]"
                aria-label="Toggle online status visibility"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-gray-300">Allow direct messages</span>
              <input
                type="checkbox"
                checked={preferences.privacy.allowDirectMessages}
                onChange={(e) => updateNestedPreference('privacy', 'allowDirectMessages', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e]"
                aria-label="Toggle direct messages"
              />
            </label>

            <div className="pt-2">
              <label className="block text-gray-300 mb-2">Profile visibility</label>
              <select
                value={preferences.privacy.profileVisibility}
                onChange={(e) =>
                  updateNestedPreference(
                    'privacy',
                    'profileVisibility',
                    e.target.value as (typeof PROFILE_VISIBILITY)[number]
                  )
                }
                className="w-full p-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                aria-label="Select profile visibility"
              >
                <option value="public">Public</option>
                <option value="subscribers">Subscribers only</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Globe className="w-5 h-5 text-[#ff950e] mr-2" />
            <h3 className="text-lg font-semibold text-white">Regional Settings</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => updateDirectPreference('language', e.target.value)}
                className="w-full p-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Currency</label>
              <select
                value={preferences.currency}
                onChange={(e) => updateDirectPreference('currency', e.target.value)}
                className="w-full p-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                aria-label="Select currency"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Timezone</label>
              <select
                value={preferences.timezone}
                onChange={(e) => updateDirectPreference('timezone', e.target.value)}
                className="w-full p-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
                aria-label="Select timezone"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-900/20 border border-green-700 text-green-400'
                : 'bg-red-900/20 border border-red-700 text-red-400'
            }`}
            role={message.type === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={!hasChanges || saving}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            hasChanges && !saving ? 'bg-[#ff950e] text-white hover:bg-[#ff7a00]' : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
          aria-disabled={!hasChanges || saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Preferences
            </>
          )}
        </button>
      </SecureForm>
    </div>
  );
}
