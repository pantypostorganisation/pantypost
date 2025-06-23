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
 * Returns Promise<UserProfile | null>
 */
export async function getUserProfileData(username: string): Promise<UserProfile | null> {
  if (!username || typeof window === 'undefined') return null;

  try {
    // First check shared storage via DSAL
    const profiles = await storageService.getItem<Record<string, UserProfile>>('user_profiles', {});
    
    if (profiles[username]) {
      return profiles[username];
    }

    // Fallback: check legacy storage keys for backward compatibility
    const legacyBio = await storageService.getItem<string | null>(`profile_bio_${username}`, null);
    const legacyProfilePic = await storageService.getItem<string | null>(`profile_pic_${username}`, null);
    const legacySubscriptionPrice = await storageService.getItem<string | null>(`subscription_price_${username}`, null);

    // If we found legacy data, migrate it
    if (legacyBio !== null || legacyProfilePic !== null || legacySubscriptionPrice !== null) {
      const profile: UserProfile = {
        bio: legacyBio || '',
        profilePic: legacyProfilePic || null,
        subscriptionPrice: legacySubscriptionPrice || '0'
      };
      
      // Save to new format
      await saveUserProfileData(username, profile);
      
      // Clean up legacy keys
      await storageService.removeItem(`profile_bio_${username}`);
      await storageService.removeItem(`profile_pic_${username}`);
      await storageService.removeItem(`subscription_price_${username}`);
      
      return profile;
    }

    // No data found, return default
    return {
      bio: '',
      profilePic: null,
      subscriptionPrice: '0'
    };
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}

/**
 * Save user profile data to shared storage
 * Returns Promise<boolean>
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
    
    // For backward compatibility, also save individual keys
    // This helps during the migration period
    await storageService.setItem(`profile_bio_${username}`, profile.bio);
    if (profile.profilePic) {
      await storageService.setItem(`profile_pic_${username}`, profile.profilePic);
    } else {
      await storageService.removeItem(`profile_pic_${username}`);
    }
    await storageService.setItem(`subscription_price_${username}`, profile.subscriptionPrice);
    
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
}

/**
 * Get profile picture for a user
 * Returns Promise<string | null>
 */
export async function getUserProfilePic(username: string): Promise<string | null> {
  const profile = await getUserProfileData(username);
  return profile?.profilePic || null;
}

/**
 * Get bio for a user
 * Returns Promise<string>
 */
export async function getUserBio(username: string): Promise<string> {
  const profile = await getUserProfileData(username);
  return profile?.bio || '';
}

/**
 * Get subscription price for a user
 * Returns Promise<string>
 */
export async function getUserSubscriptionPrice(username: string): Promise<string> {
  const profile = await getUserProfileData(username);
  return profile?.subscriptionPrice || '0';
}

/**
 * Delete user profile data
 * Useful for cleanup operations
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
      // Clean up individual keys too
      await storageService.removeItem(`profile_bio_${username}`);
      await storageService.removeItem(`profile_pic_${username}`);
      await storageService.removeItem(`subscription_price_${username}`);
    }
    
    return success;
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return false;
  }
}

/**
 * Check if user has profile data
 * Useful for checking if profile exists
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
 * Useful for admin views
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
 * Migrate profile data from legacy storage format
 * One-time migration utility
 */
export async function migrateProfileFromLegacy(username: string): Promise<boolean> {
  if (!username || typeof window === 'undefined') return false;

  try {
    // Check if already migrated
    const hasProfile = await hasUserProfile(username);
    if (hasProfile) return true;

    // Check legacy storage keys
    const bio = await storageService.getItem<string | null>(`profile_bio_${username}`, null);
    const profilePic = await storageService.getItem<string | null>(`profile_pic_${username}`, null);
    const subscriptionPrice = await storageService.getItem<string | null>(`subscription_price_${username}`, null);

    // If we have any legacy data, migrate it
    if (bio !== null || profilePic !== null || subscriptionPrice !== null) {
      const profile: UserProfile = {
        bio: bio || '',
        profilePic: profilePic || null,
        subscriptionPrice: subscriptionPrice || '0',
        lastUpdated: new Date().toISOString()
      };

      const success = await saveUserProfileData(username, profile);
      
      // Clean up legacy keys after successful migration
      if (success) {
        await storageService.removeItem(`profile_bio_${username}`);
        await storageService.removeItem(`profile_pic_${username}`);
        await storageService.removeItem(`subscription_price_${username}`);
      }
      
      return success;
    }

    return false;
  } catch (error) {
    console.error('Error migrating profile from legacy:', error);
    return false;
  }
}

/**
 * Batch migrate all legacy profiles
 * Useful for one-time migration of all existing profiles
 */
export async function migrateAllLegacyProfiles(): Promise<{ migrated: number; failed: number }> {
  let migrated = 0;
  let failed = 0;

  try {
    // Get all storage keys
    const allKeys = await storageService.getKeys();
    
    // Find all unique usernames with profile data
    const usernames = new Set<string>();
    
    allKeys.forEach(key => {
      const bioMatch = key.match(/^profile_bio_(.+)$/);
      const picMatch = key.match(/^profile_pic_(.+)$/);
      const priceMatch = key.match(/^subscription_price_(.+)$/);
      
      if (bioMatch) usernames.add(bioMatch[1]);
      if (picMatch) usernames.add(picMatch[1]);
      if (priceMatch) usernames.add(priceMatch[1]);
    });

    // Migrate each user
    for (const username of usernames) {
      const success = await migrateProfileFromLegacy(username);
      if (success) {
        migrated++;
      } else {
        failed++;
      }
    }

    console.log(`Profile migration complete: ${migrated} migrated, ${failed} failed`);
    return { migrated, failed };
  } catch (error) {
    console.error('Error during batch migration:', error);
    return { migrated, failed };
  }
}
