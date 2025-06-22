// src/utils/profileUtils.ts

import { storageService } from '@/services';

export interface UserProfile {
  bio: string;
  profilePic: string | null;
  subscriptionPrice: string;
  lastUpdated?: string;
}

/**
 * Get user profile data from shared storage
 * Checks localStorage first (shared), then sessionStorage (local) as fallback
 * NOW ASYNC - Returns Promise<UserProfile | null>
 */
export async function getUserProfileData(username: string): Promise<UserProfile | null> {
  if (!username || typeof window === 'undefined') return null;

  try {
    // First check shared storage via DSAL
    const profiles = await storageService.getItem<Record<string, UserProfile>>('user_profiles', {});
    
    if (profiles[username]) {
      return profiles[username];
    }

    // Fallback to sessionStorage for backward compatibility
    // Note: sessionStorage is synchronous, but we wrap in async for consistency
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
 * NOW ASYNC - Returns Promise<boolean>
 */
export async function saveUserProfileData(username: string, profile: UserProfile): Promise<boolean> {
  if (!username || typeof window === 'undefined') return false;

  try {
    // Get existing profiles via DSAL
    const profiles = await storageService.getItem<Record<string, UserProfile>>('user_profiles', {});
    
    // Update profile
    profiles[username] = {
      ...profile,
      lastUpdated: new Date().toISOString()
    };
    
    // Save to storage via DSAL
    const success = await storageService.setItem('user_profiles', profiles);
    
    if (!success) {
      return false;
    }
    
    // Also update sessionStorage for backward compatibility
    // These remain synchronous as sessionStorage doesn't have async support
    sessionStorage.setItem(`profile_bio_${username}`, profile.bio);
    if (profile.profilePic) {
      sessionStorage.setItem(`profile_pic_${username}`, profile.profilePic);
    } else {
      sessionStorage.removeItem(`profile_pic_${username}`);
    }
    sessionStorage.setItem(`subscription_price_${username}`, profile.subscriptionPrice);
    
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}

/**
 * Get profile picture for a user
 * NOW ASYNC - Returns Promise<string | null>
 */
export async function getUserProfilePic(username: string): Promise<string | null> {
  const profile = await getUserProfileData(username);
  return profile?.profilePic || null;
}

/**
 * Get bio for a user
 * NOW ASYNC - Returns Promise<string>
 */
export async function getUserBio(username: string): Promise<string> {
  const profile = await getUserProfileData(username);
  return profile?.bio || '';
}

/**
 * Get subscription price for a user
 * NOW ASYNC - Returns Promise<string>
 */
export async function getUserSubscriptionPrice(username: string): Promise<string> {
  const profile = await getUserProfileData(username);
  return profile?.subscriptionPrice || '0';
}

/**
 * Delete user profile data
 * NEW HELPER - Useful for cleanup operations
 */
export async function deleteUserProfileData(username: string): Promise<boolean> {
  if (!username || typeof window === 'undefined') return false;

  try {
    // Get existing profiles
    const profiles = await storageService.getItem<Record<string, UserProfile>>('user_profiles', {});
    
    // Delete the user's profile
    delete profiles[username];
    
    // Save updated profiles
    const success = await storageService.setItem('user_profiles', profiles);
    
    if (success) {
      // Clean up sessionStorage too
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
 * Check if user has profile data
 * NEW HELPER - Useful for checking if profile exists
 */
export async function hasUserProfile(username: string): Promise<boolean> {
  if (!username || typeof window === 'undefined') return false;

  try {
    const profiles = await storageService.getItem<Record<string, UserProfile>>('user_profiles', {});
    return !!profiles[username];
  } catch (error) {
    console.error('Error checking user profile:', error);
    return false;
  }
}

/**
 * Get all user profiles
 * NEW HELPER - Useful for admin views
 */
export async function getAllUserProfiles(): Promise<Record<string, UserProfile>> {
  try {
    return await storageService.getItem<Record<string, UserProfile>>('user_profiles', {});
  } catch (error) {
    console.error('Error getting all user profiles:', error);
    return {};
  }
}

/**
 * Migrate profile data from sessionStorage to localStorage
 * NEW HELPER - One-time migration utility
 */
export async function migrateProfileFromSession(username: string): Promise<boolean> {
  if (!username || typeof window === 'undefined') return false;

  try {
    // Check if already migrated
    const hasProfile = await hasUserProfile(username);
    if (hasProfile) return true;

    // Check sessionStorage
    const bio = sessionStorage.getItem(`profile_bio_${username}`);
    const profilePic = sessionStorage.getItem(`profile_pic_${username}`);
    const subscriptionPrice = sessionStorage.getItem(`subscription_price_${username}`);

    // If we have any session data, migrate it
    if (bio || profilePic || subscriptionPrice) {
      const profile: UserProfile = {
        bio: bio || '',
        profilePic: profilePic || null,
        subscriptionPrice: subscriptionPrice || '0',
        lastUpdated: new Date().toISOString()
      };

      return await saveUserProfileData(username, profile);
    }

    return false;
  } catch (error) {
    console.error('Error migrating profile from session:', error);
    return false;
  }
}
