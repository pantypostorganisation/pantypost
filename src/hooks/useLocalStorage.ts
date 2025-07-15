// src/hooks/useLocalStorage.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { storageService } from '@/services';
import { securityService } from '@/services';
import { sanitizeStrict } from '@/utils/security/sanitization';

// Constants for storage limits
const MAX_KEY_LENGTH = 100;
const MAX_VALUE_SIZE = 1024 * 1024; // 1MB per value
const VALID_KEY_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Validates storage key to prevent injection attacks
 */
function validateStorageKey(key: string): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }
  if (key.length > MAX_KEY_LENGTH) {
    return false;
  }
  return VALID_KEY_PATTERN.test(key);
}

/**
 * Validates value size to prevent quota exhaustion
 */
function validateValueSize(value: any): boolean {
  try {
    const serialized = JSON.stringify(value);
    return serialized.length <= MAX_VALUE_SIZE;
  } catch {
    return false;
  }
}

/**
 * Custom hook to integrate with localStorage while keeping React state in sync
 * Now handles async operations from DSAL with security enhancements
 * 
 * @param key Storage key to use
 * @param initialValue Default value if nothing exists in storage
 * @returns Tuple of [storedValue, setValue, removeValue, isLoading]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void, boolean] {
  // Validate key on initialization
  if (!validateStorageKey(key)) {
    console.error(`Invalid storage key: "${key}". Keys must be alphanumeric with underscores/hyphens only.`);
    return [initialValue, () => {}, () => {}, false];
  }

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
        const value = await storageService.getItem<T>(key, initialValue);
        
        // Validate loaded value
        if (value !== null && value !== undefined) {
          // For string values, sanitize them
          if (typeof value === 'string') {
            const sanitized = sanitizeStrict(value as string) as T;
            if (isMounted.current) {
              setStoredValue(sanitized);
            }
          } else {
            if (isMounted.current) {
              setStoredValue(value);
            }
          }
        } else {
          if (isMounted.current) {
            setStoredValue(initialValue);
          }
        }
        
        if (isMounted.current) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Error loading localStorage key "${key}":`, error);
        if (isMounted.current) {
          setStoredValue(initialValue);
          setIsLoading(false);
        }
      }
    };

    loadInitialValue();

    return () => {
      isMounted.current = false;
    };
  }, [key, initialValue]);

  // Return a wrapped version of useState's setter function that 
  // persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function to mirror useState behavior
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Validate value size
      if (!validateValueSize(valueToStore)) {
        console.error(`Value too large for key "${key}". Maximum size is 1MB.`);
        return;
      }
      
      // Sanitize string values
      let sanitizedValue = valueToStore;
      if (typeof valueToStore === 'string') {
        sanitizedValue = sanitizeStrict(valueToStore as string) as T;
      }
      
      // Save to React state immediately for responsive UI
      setStoredValue(sanitizedValue);
      
      // Save to localStorage asynchronously
      storageService.setItem(key, sanitizedValue).then(success => {
        if (!success) {
          console.error(`Failed to save "${key}" to storage`);
          // Revert state on failure
          if (isMounted.current) {
            setStoredValue(storedValue);
          }
        }
      }).catch(error => {
        console.error(`Storage quota exceeded or error for key "${key}":`, error);
        // Revert state on error
        if (isMounted.current) {
          setStoredValue(storedValue);
        }
      });
      
      // Dispatch custom event to sync across tabs
      try {
        window.dispatchEvent(new StorageEvent('storage', {
          key: key,
          newValue: JSON.stringify(sanitizedValue),
          url: window.location.href
        }));
      } catch (error) {
        console.error('Error dispatching storage event:', error);
      }
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
      storageService.removeItem(key).then(success => {
        if (!success) {
          console.error(`Failed to remove "${key}" from storage`);
        }
      });
      
      // Dispatch custom event to sync across tabs
      try {
        window.dispatchEvent(new StorageEvent('storage', {
          key: key,
          newValue: null,
          url: window.location.href
        }));
      } catch (error) {
        console.error('Error dispatching storage event:', error);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in localStorage to sync across tabs
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const parsedValue = JSON.parse(event.newValue);
          
          // Sanitize string values from other tabs
          let sanitizedValue = parsedValue;
          if (typeof parsedValue === 'string') {
            sanitizedValue = sanitizeStrict(parsedValue);
          }
          
          setStoredValue(sanitizedValue);
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error);
          // Don't update state with malformed data
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
  // Validate key
  if (!validateStorageKey(key)) {
    console.error(`Invalid storage key: "${key}". Keys must be alphanumeric with underscores/hyphens only.`);
    return [initialValue, () => {}, () => {}, false];
  }

  // Validate TTL
  const validatedTtl = Math.max(0, Math.min(ttlMs, 7 * 24 * 60 * 60 * 1000)); // Max 7 days

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
        // Get item with expiry check
        const item = await storageService.getItem<{ value: T; expiry: number } | null>(
          `expiry_${key}`,
          null
        );
        
        if (isMounted.current) {
          if (item === null || !item.expiry || Date.now() > item.expiry) {
            // Item doesn't exist or is expired
            if (item !== null) {
              // Clean up expired item
              await storageService.removeItem(`expiry_${key}`);
            }
            setStoredValue(initialValue);
          } else {
            // Sanitize string values
            let value = item.value;
            if (typeof value === 'string') {
              value = sanitizeStrict(value as string) as T;
            }
            setStoredValue(value);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error(`Error loading localStorage key "expiry_${key}":`, error);
        if (isMounted.current) {
          setStoredValue(initialValue);
          setIsLoading(false);
        }
      }
    };

    loadInitialValue();

    return () => {
      isMounted.current = false;
    };
  }, [key, initialValue]);

  // Function to update value with expiration
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Validate value size
      if (!validateValueSize(valueToStore)) {
        console.error(`Value too large for key "${key}". Maximum size is 1MB.`);
        return;
      }
      
      // Sanitize string values
      let sanitizedValue = valueToStore;
      if (typeof valueToStore === 'string') {
        sanitizedValue = sanitizeStrict(valueToStore as string) as T;
      }
      
      // Save to React state immediately
      setStoredValue(sanitizedValue);
      
      // Save to localStorage with expiry asynchronously
      const itemWithExpiry = {
        value: sanitizedValue,
        expiry: Date.now() + validatedTtl
      };
      
      storageService.setItem(`expiry_${key}`, itemWithExpiry).catch(error => {
        console.error(`Failed to save expiry item "${key}":`, error);
        if (isMounted.current) {
          setStoredValue(storedValue);
        }
      });
      
      // Dispatch custom event
      try {
        window.dispatchEvent(new StorageEvent('storage', {
          key: `expiry_${key}`,
          newValue: JSON.stringify(itemWithExpiry),
          url: window.location.href
        }));
      } catch (error) {
        console.error('Error dispatching storage event:', error);
      }
    } catch (error) {
      console.error(`Error setting localStorage key "expiry_${key}":`, error);
    }
  }, [key, storedValue, validatedTtl]);

  // Function to remove the item
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      storageService.removeItem(`expiry_${key}`);
      
      // Dispatch event
      try {
        window.dispatchEvent(new StorageEvent('storage', {
          key: `expiry_${key}`,
          newValue: null,
          url: window.location.href
        }));
      } catch (error) {
        console.error('Error dispatching storage event:', error);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "expiry_${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === `expiry_${key}` && event.newValue !== null) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed && parsed.value !== undefined) {
            // Sanitize string values
            let value = parsed.value;
            if (typeof value === 'string') {
              value = sanitizeStrict(value);
            }
            setStoredValue(value);
          }
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

  // Function to perform partial updates with sanitization
  const updateValue = useCallback((updates: Partial<T>) => {
    // Sanitize string properties in updates
    const sanitizedUpdates = { ...updates };
    Object.keys(sanitizedUpdates).forEach(key => {
      const value = sanitizedUpdates[key as keyof T];
      if (typeof value === 'string') {
        (sanitizedUpdates as any)[key] = sanitizeStrict(value);
      }
    });

    setStoredValue(current => ({
      ...current,
      ...sanitizedUpdates
    }));
  }, [setStoredValue]);

  return [storedValue, updateValue, removeValue, isLoading];
}

/**
 * Hook for tracking localStorage usage
 * @returns Object with storage usage information
 */
export function useStorageUsage() {
  const [usage, setUsage] = useState({ bytes: 0, percent: 0, sizeKB: 0 });
  const [isLoading, setIsLoading] = useState(false);

  // Update usage with async storage info
  useEffect(() => {
    const updateUsage = async () => {
      setIsLoading(true);
      try {
        const info = await storageService.getStorageInfo();
        
        // Validate storage info
        const validatedInfo = {
          used: Math.max(0, Math.min(info.used, 10 * 1024 * 1024)), // Cap at 10MB
          percentage: Math.max(0, Math.min(info.percentage, 100))
        };
        
        setUsage({
          bytes: validatedInfo.used,
          percent: validatedInfo.percentage / 100,
          sizeKB: Math.round(validatedInfo.used / 1024)
        });
      } catch (error) {
        console.error('Error updating storage usage:', error);
        setUsage({ bytes: 0, percent: 0, sizeKB: 0 });
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
  const usageKB = usage.sizeKB;
  
  return {
    bytes: usage.bytes,
    percent: usage.percent,
    isNearCapacity,
    usageKB,
    usageMB: (usageKB / 1024).toFixed(2),
    isLoading,
    warning: isNearCapacity ? 'Storage is almost full. Consider clearing old data.' : null
  };
}

/**
 * Hook to preload multiple localStorage values
 * Useful for components that need multiple values ready at mount
 */
export function usePreloadedStorage<T extends Record<string, any>>(
  keys: { [K in keyof T]: { key: string; defaultValue: T[K] } }
): { values: T; isLoading: boolean; refresh: () => Promise<void>; errors: string[] } {
  const [values, setValues] = useState<T>(() => {
    // Initialize with default values
    const defaults = {} as T;
    Object.entries(keys).forEach(([prop, config]) => {
      defaults[prop as keyof T] = (config as any).defaultValue;
    });
    return defaults;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const isMounted = useRef(true);

  const loadValues = useCallback(async () => {
    setIsLoading(true);
    setErrors([]);
    
    try {
      const loadedValues = {} as T;
      const loadErrors: string[] = [];
      
      // Validate all keys first
      Object.entries(keys).forEach(([prop, config]) => {
        if (!validateStorageKey((config as any).key)) {
          loadErrors.push(`Invalid key for ${prop}: ${(config as any).key}`);
        }
      });
      
      if (loadErrors.length > 0) {
        setErrors(loadErrors);
        return;
      }
      
      // Load all values in parallel
      await Promise.all(
        Object.entries(keys).map(async ([prop, config]) => {
          try {
            const value = await storageService.getItem(
              (config as any).key,
              (config as any).defaultValue
            );
            
            // Sanitize string values
            let sanitizedValue = value;
            if (typeof value === 'string') {
              sanitizedValue = sanitizeStrict(value);
            }
            
            loadedValues[prop as keyof T] = sanitizedValue;
          } catch (error) {
            loadErrors.push(`Failed to load ${prop}`);
            loadedValues[prop as keyof T] = (config as any).defaultValue;
          }
        })
      );
      
      if (isMounted.current) {
        setValues(loadedValues);
        if (loadErrors.length > 0) {
          setErrors(loadErrors);
        }
      }
    } catch (error) {
      console.error('Error preloading storage values:', error);
      setErrors(['Failed to preload storage values']);
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
    refresh: loadValues,
    errors
  };
}
