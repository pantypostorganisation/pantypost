// src/utils/profileUtils.ts

import { safeStorage } from '@/utils/safeStorage';

export interface UserProfile {
  bio: string;
  profilePic: string | null;
  subscriptionPrice: string;
  lastUpdated?: string;
}

/**
 * Get user profile data from shared storage
 * Checks localStorage first (shared), then sessionStorage (local) as fallback
 */
export function getUserProfileData(username: string): UserProfile | null {
  if (!username || typeof window === 'undefined') return null;

  try {
    // First check shared localStorage
    const profiles = safeStorage.getItem<Record<string, UserProfile>>('user_profiles', {});
    if (profiles && profiles[username]) {
      return profiles[username];
    }

    // Fallback to sessionStorage for backward compatibility
    const bio = sessionStorage.getItem(`profile_bio_${username}`) || '';
    const profilePic = sessionStorage.getItem(`profile_pic_${username}`) || null;
    const subscriptionPrice = sessionStorage.getItem(`subscription_price_${username}`) || '0';

    return {
      bio,
      profilePic,
      subscriptionPrice
    };
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}

/**
 * Save user profile data to shared storage
 */
export function saveUserProfileData(username: string, profile: UserProfile): boolean {
  if (!username || typeof window === 'undefined') return false;

  try {
    // Get existing profiles
    const profiles = safeStorage.getItem<Record<string, UserProfile>>('user_profiles', {}) || {};
    
    // Update profile
    profiles[username] = {
      ...profile,
      lastUpdated: new Date().toISOString()
    };
    
    // Save to localStorage
    const success = safeStorage.setItem('user_profiles', profiles);
    
    if (success) {
      // Also update sessionStorage for backward compatibility
      sessionStorage.setItem(`profile_bio_${username}`, profile.bio);
      if (profile.profilePic) {
        sessionStorage.setItem(`profile_pic_${username}`, profile.profilePic);
      } else {
        sessionStorage.removeItem(`profile_pic_${username}`);
      }
      sessionStorage.setItem(`subscription_price_${username}`, profile.subscriptionPrice);
    }
    
    return success;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}

/**
 * Get profile picture for a user
 */
export function getUserProfilePic(username: string): string | null {
  const profile = getUserProfileData(username);
  return profile?.profilePic || null;
}

/**
 * Get bio for a user
 */
export function getUserBio(username: string): string {
  const profile = getUserProfileData(username);
  return profile?.bio || '';
}

/**
 * Get subscription price for a user
 */
export function getUserSubscriptionPrice(username: string): string {
  const profile = getUserProfileData(username);
  return profile?.subscriptionPrice || '0';
}

/**
 * Delete user profile data
 */
export function deleteUserProfile(username: string): boolean {
  if (!username || typeof window === 'undefined') return false;
  
  try {
    const profiles = safeStorage.getItem<Record<string, UserProfile>>('user_profiles', {}) || {};
    delete profiles[username];
    
    const success = safeStorage.setItem('user_profiles', profiles);
    
    if (success) {
      // Also clear from sessionStorage
      sessionStorage.removeItem(`profile_bio_${username}`);
      sessionStorage.removeItem(`profile_pic_${username}`);
      sessionStorage.removeItem(`subscription_price_${username}`);
    }
    
    return success;
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return false;
  }
}

/**
 * Get all user profiles
 */
export function getAllUserProfiles(): Record<string, UserProfile> {
  return safeStorage.getItem<Record<string, UserProfile>>('user_profiles', {}) || {};
}

/**
 * Clear all user profiles (admin function)
 */
export function clearAllUserProfiles(): boolean {
  try {
    return safeStorage.setItem('user_profiles', {});
  } catch (error) {
    console.error('Error clearing all profiles:', error);
    return false;
  }
}