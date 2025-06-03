// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback } from 'react';
import * as storage from '@/utils/storage';

/**
 * Custom hook to integrate with localStorage while keeping React state in sync
 * @param key Storage key to use
 * @param initialValue Default value if nothing exists in storage
 * @returns Tuple of [storedValue, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to hold the current value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage
      return storage.getItem<T>(key, initialValue);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that 
  // persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function to mirror useState behavior
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save to React state
      setStoredValue(valueToStore);
      
      // Save to localStorage using utility
      storage.setItem(key, valueToStore);
      
      // Dispatch custom event to sync across tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: key,
        newValue: JSON.stringify(valueToStore),
        url: window.location.href
      }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Function to remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      // Remove from localStorage
      storage.removeItem(key);
      
      // Reset state to initial value
      setStoredValue(initialValue);
      
      // Dispatch custom event to sync across tabs
      window.dispatchEvent(new StorageEvent('storage', {
        key: key,
        newValue: null,
        url: window.location.href
      }));
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in localStorage to sync across tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const newValue = JSON.parse(event.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error);
        }
      } else if (event.key === key && event.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for localStorage items with expiration
 * @param key Storage key
 * @param initialValue Default value
 * @param ttlMs Time to live in milliseconds (default: 24 hours)
 */
export function useLocalStorageWithExpiry<T>(
  key: string,
  initialValue: T,
  ttlMs: number = 24 * 60 * 60 * 1000
): [T, (value: T | ((val: T) => T)) => void, () => void] {
  // State to hold the current value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage with expiry check
      return storage.getItemWithExpiry<T>(`expiry_${key}`, initialValue);
    } catch (error) {
      console.error(`Error reading localStorage key "expiry_${key}":`, error);
      return initialValue;
    }
  });

  // Function to update value with expiration
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save to React state
      setStoredValue(valueToStore);
      
      // Save to localStorage with expiry
      storage.setItemWithExpiry(`expiry_${key}`, valueToStore, ttlMs);
      
      // Dispatch custom event
      window.dispatchEvent(new StorageEvent('storage', {
        key: `expiry_${key}`,
        newValue: JSON.stringify({ value: valueToStore, expiry: Date.now() + ttlMs }),
        url: window.location.href
      }));
    } catch (error) {
      console.error(`Error setting localStorage key "expiry_${key}":`, error);
    }
  }, [key, storedValue, ttlMs]);

  // Function to remove the item
  const removeValue = useCallback(() => {
    try {
      storage.removeItem(`expiry_${key}`);
      setStoredValue(initialValue);
      
      // Dispatch event
      window.dispatchEvent(new StorageEvent('storage', {
        key: `expiry_${key}`,
        newValue: null,
        url: window.location.href
      }));
    } catch (error) {
      console.error(`Error removing localStorage key "expiry_${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `expiry_${key}` && event.newValue !== null) {
        try {
          const { value } = JSON.parse(event.newValue);
          setStoredValue(value);
        } catch (error) {
          console.error(`Error parsing localStorage value for key "expiry_${key}":`, error);
        }
      } else if (event.key === `expiry_${key}` && event.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for object-based localStorage items allowing partial updates
 * @param key Storage key
 * @param initialValue Default value
 */
export function useLocalStorageObject<T extends object>(
  key: string,
  initialValue: T
): [T, (updates: Partial<T>) => void, () => void] {
  // Use the regular useLocalStorage hook for the base functionality
  const [storedValue, setStoredValue, removeValue] = useLocalStorage<T>(key, initialValue);

  // Function to perform partial updates
  const updateValue = useCallback((updates: Partial<T>) => {
    setStoredValue(current => ({
      ...current,
      ...updates
    }));
  }, [setStoredValue]);

  return [storedValue, updateValue, removeValue];
}

/**
 * Hook for tracking localStorage usage
 * @returns Object with storage usage information
 */
export function useStorageUsage() {
  const [usage, setUsage] = useState(() => storage.getStorageUsage());

  // Update usage every 5 seconds
  useEffect(() => {
    const updateUsage = () => {
      setUsage(storage.getStorageUsage());
    };

    // Initial update
    updateUsage();

    // Set interval for periodic updates
    const interval = setInterval(updateUsage, 5000);

    // Also update after storage events
    const handleStorageChange = () => {
      updateUsage();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isNearCapacity = usage.percent > 0.8;
  const usageKB = Math.round(usage.bytes / 1024);
  
  return {
    bytes: usage.bytes,
    percent: usage.percent,
    isNearCapacity,
    usageKB,
    usageMB: (usageKB / 1024).toFixed(2)
  };
}