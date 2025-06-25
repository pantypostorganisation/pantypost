// src/components/settings/UserPreferences.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Lock, Globe, Save, Loader2 } from 'lucide-react';
import { usersService } from '@/services';
import { UserPreferences as UserPreferencesType } from '@/types/users';
import { useAuth } from '@/context/AuthContext';

export default function UserPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferencesType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.username) return;
      
      setLoading(true);
      try {
        const result = await usersService.getUserPreferences(user.username);
        if (result.success && result.data) {
          setPreferences(result.data);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setMessage({ type: 'error', text: 'Failed to load preferences' });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.username]);

  // Update nested preference (notifications, privacy)
  const updateNestedPreference = <T extends 'notifications' | 'privacy'>(
    category: T,
    key: keyof UserPreferencesType[T],
    value: any
  ) => {
    if (!preferences) return;

    const updated: UserPreferencesType = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [key]: value,
      },
    };

    setPreferences(updated);
    setHasChanges(true);
  };

  // Update direct preference (language, currency, timezone)
  const updateDirectPreference = (
    key: 'language' | 'currency' | 'timezone',
    value: string
  ) => {
    if (!preferences) return;

    const updated: UserPreferencesType = {
      ...preferences,
      [key]: value,
    };

    setPreferences(updated);
    setHasChanges(true);
  };

  // Save preferences
  const savePreferences = async () => {
    if (!user?.username || !preferences) return;

    setSaving(true);
    setMessage(null);
    
    try {
      const result = await usersService.updateUserPreferences(user.username, preferences);
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
        setHasChanges(false);
        
        // Track preference update
        await usersService.trackActivity({
          userId: user.username,
          type: 'profile_update',
          details: { action: 'preferences_updated' },
        });
      } else {
        setMessage({ type: 'error', text: result.error?.message || 'Failed to save preferences' });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Preferences</h2>
        {hasChanges && (
          <span className="text-sm text-yellow-500">You have unsaved changes</span>
        )}
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
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Orders</span>
            <input
              type="checkbox"
              checked={preferences.notifications.orders}
              onChange={(e) => updateNestedPreference('notifications', 'orders', e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e]"
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Promotions</span>
            <input
              type="checkbox"
              checked={preferences.notifications.promotions}
              onChange={(e) => updateNestedPreference('notifications', 'promotions', e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e]"
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Newsletters</span>
            <input
              type="checkbox"
              checked={preferences.notifications.newsletters}
              onChange={(e) => updateNestedPreference('notifications', 'newsletters', e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e]"
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
            />
          </label>
          
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-300">Allow direct messages</span>
            <input
              type="checkbox"
              checked={preferences.privacy.allowDirectMessages}
              onChange={(e) => updateNestedPreference('privacy', 'allowDirectMessages', e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 text-[#ff950e] focus:ring-[#ff950e]"
            />
          </label>
          
          <div className="pt-2">
            <label className="block text-gray-300 mb-2">Profile visibility</label>
            <select
              value={preferences.privacy.profileVisibility}
              onChange={(e) => updateNestedPreference('privacy', 'profileVisibility', e.target.value as 'public' | 'subscribers' | 'private')}
              className="w-full p-2 bg-black border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ff950e]"
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
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-900/20 border border-green-700 text-green-400'
            : 'bg-red-900/20 border border-red-700 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={savePreferences}
        disabled={!hasChanges || saving}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
          hasChanges && !saving
            ? 'bg-[#ff950e] text-white hover:bg-[#ff7a00]'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
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
    </div>
  );
}