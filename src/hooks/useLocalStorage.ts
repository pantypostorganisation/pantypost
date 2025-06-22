// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as storage from '@/utils/storage';

/**
 * Custom hook to integrate with localStorage while keeping React state in sync
 * Now handles async operations from DSAL
 * 
 * @param key Storage key to use
 * @param initialValue Default value if nothing exists in storage
 * @returns Tuple of [storedValue, setValue, removeValue, isLoading]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void, boolean] {
  // State to hold the current value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track if we're mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Initialize value from storage
  useEffect(() => {
    isMounted.current = true;
    
    const loadInitialValue = async () => {
      try {
        setIsLoading(true);
        const value = await storage.getItem<T>(key, initialValue);
        if (isMounted.current) {
          setStoredValue(value);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Error loading localStorage key "${key}":`, error);
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    loadInitialValue();

    return () => {
      isMounted.current = false;
    };
  }, [key]); // Only re-run if key changes

  // Return a wrapped version of useState's setter function that 
  // persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function to mirror useState behavior
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save to React state immediately for responsive UI
      setStoredValue(valueToStore);
      
      // Save to localStorage asynchronously
      storage.setItem(key, valueToStore).then(success => {
        if (!success) {
          console.error(`Failed to save "${key}" to storage`);
        }
      });
      
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
      // Reset state to initial value immediately
      setStoredValue(initialValue);
      
      // Remove from localStorage asynchronously
      storage.removeItem(key).then(success => {
        if (!success) {
          console.error(`Failed to remove "${key}" from storage`);
        }
      });
      
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

  return [storedValue, setValue, removeValue, isLoading];
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
): [T, (value: T | ((val: T) => T)) => void, () => void, boolean] {
  // State to hold the current value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  // Initialize value from storage
  useEffect(() => {
    isMounted.current = true;
    
    const loadInitialValue = async () => {
      try {
        setIsLoading(true);
        const value = await storage.getItemWithExpiry<T>(`expiry_${key}`, initialValue);
        if (isMounted.current) {
          setStoredValue(value);
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Error loading localStorage key "expiry_${key}":`, error);
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    loadInitialValue();

    return () => {
      isMounted.current = false;
    };
  }, [key]);

  // Function to update value with expiration
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save to React state immediately
      setStoredValue(valueToStore);
      
      // Save to localStorage with expiry asynchronously
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
      setStoredValue(initialValue);
      storage.removeItem(`expiry_${key}`);
      
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

  return [storedValue, setValue, removeValue, isLoading];
}

/**
 * Hook for object-based localStorage items allowing partial updates
 * @param key Storage key
 * @param initialValue Default value
 */
export function useLocalStorageObject<T extends object>(
  key: string,
  initialValue: T
): [T, (updates: Partial<T>) => void, () => void, boolean] {
  // Use the regular useLocalStorage hook for the base functionality
  const [storedValue, setStoredValue, removeValue, isLoading] = useLocalStorage<T>(key, initialValue);

  // Function to perform partial updates
  const updateValue = useCallback((updates: Partial<T>) => {
    setStoredValue(current => ({
      ...current,
      ...updates
    }));
  }, [setStoredValue]);

  return [storedValue, updateValue, removeValue, isLoading];
}

/**
 * Hook for tracking localStorage usage
 * @returns Object with storage usage information
 */
export function useStorageUsage() {
  const [usage, setUsage] = useState(() => storage.getStorageUsage());
  const [isLoading, setIsLoading] = useState(false);

  // Update usage with async storage info
  useEffect(() => {
    const updateUsage = async () => {
      setIsLoading(true);
      try {
        // Get basic usage synchronously
        const basicUsage = storage.getStorageUsage();
        setUsage(basicUsage);
        
        // Get detailed info asynchronously
        const sizeKB = await storage.getStorageSizeKB();
        setUsage(prev => ({
          ...prev,
          sizeKB
        }));
      } catch (error) {
        console.error('Error updating storage usage:', error);
      } finally {
        setIsLoading(false);
      }
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
    usageMB: (usageKB / 1024).toFixed(2),
    isLoading
  };
}

/**
 * Hook to preload multiple localStorage values
 * Useful for components that need multiple values ready at mount
 */
export function usePreloadedStorage<T extends Record<string, any>>(
  keys: { [K in keyof T]: { key: string; defaultValue: T[K] } }
): { values: T; isLoading: boolean; refresh: () => Promise<void> } {
  const [values, setValues] = useState<T>(() => {
    // Initialize with default values
    const defaults = {} as T;
    Object.entries(keys).forEach(([prop, config]) => {
      defaults[prop as keyof T] = config.defaultValue;
    });
    return defaults;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  const loadValues = useCallback(async () => {
    setIsLoading(true);
    try {
      const loadedValues = {} as T;
      
      // Load all values in parallel
      await Promise.all(
        Object.entries(keys).map(async ([prop, config]) => {
          const value = await storage.getItem(config.key, config.defaultValue);
          loadedValues[prop as keyof T] = value;
        })
      );
      
      if (isMounted.current) {
        setValues(loadedValues);
      }
    } catch (error) {
      console.error('Error preloading storage values:', error);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [keys]);

  useEffect(() => {
    isMounted.current = true;
    loadValues();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadValues]);

  return {
    values,
    isLoading,
    refresh: loadValues
  };
}
