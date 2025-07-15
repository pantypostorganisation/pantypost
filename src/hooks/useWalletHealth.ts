// src/hooks/useWalletHealth.ts
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppInitialization } from '@/components/AppInitializationProvider';
import { useWallet } from '@/context/WalletContext';
import { useAuth } from '@/context/AuthContext';
import { sanitizeUsername } from '@/utils/security/sanitization';
import { z } from 'zod';

// Constants for security
const MIN_CHECK_INTERVAL = 60 * 1000; // 1 minute minimum
const MAX_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour maximum
const DEFAULT_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_CONSECUTIVE_FAILURES = 5;
const FAILURE_BACKOFF_MULTIPLIER = 2;

// Schema for health check response
const HealthCheckSchema = z.object({
  isReconciled: z.boolean(),
  timestamp: z.string().datetime().optional(),
  details: z.record(z.unknown()).optional()
});

// User role validation
const ValidUserRoles = z.enum(['buyer', 'seller', 'admin']);

interface WalletHealthState {
  isHealthy: boolean;
  lastCheck: Date | null;
  consecutiveFailures: number;
  nextCheckTime: Date | null;
  error: string | null;
}

/**
 * Hook to monitor wallet health and initialization status with security enhancements
 */
export function useWalletHealth() {
  const { isInitialized, healthStatus } = useAppInitialization();
  const { reconcileBalance } = useWallet();
  const { user } = useAuth();
  
  const [state, setState] = useState<WalletHealthState>({
    isHealthy: true,
    lastCheck: null,
    consecutiveFailures: 0,
    nextCheckTime: null,
    error: null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkInProgressRef = useRef<boolean>(false);
  const mountedRef = useRef<boolean>(true);

  // Calculate dynamic check interval based on failures
  const calculateCheckInterval = useCallback((failures: number): number => {
    if (failures === 0) {
      return DEFAULT_CHECK_INTERVAL;
    }
    
    // Exponential backoff with max limit
    const backoffInterval = DEFAULT_CHECK_INTERVAL * Math.pow(FAILURE_BACKOFF_MULTIPLIER, Math.min(failures, 5));
    return Math.min(backoffInterval, MAX_CHECK_INTERVAL);
  }, []);

  // Validate user role
  const validateUserRole = useCallback((role: string | undefined): role is 'buyer' | 'seller' => {
    if (!role) return false;
    
    try {
      ValidUserRoles.parse(role);
      return role === 'buyer' || role === 'seller';
    } catch {
      return false;
    }
  }, []);

  // Sanitize and validate username
  const validateUsername = useCallback((username: string | undefined): string | null => {
    if (!username) return null;
    
    try {
      const sanitized = sanitizeUsername(username);
      
      // Additional validation
      if (sanitized.length < 3 || sanitized.length > 30) {
        console.error('Invalid username length');
        return null;
      }
      
      return sanitized;
    } catch (error) {
      console.error('Username validation failed:', error);
      return null;
    }
  }, []);

  // Main health check function
  const performHealthCheck = useCallback(async () => {
    // Prevent concurrent checks
    if (checkInProgressRef.current) {
      console.warn('Health check already in progress');
      return;
    }

    // Check if component is still mounted
    if (!mountedRef.current) {
      return;
    }

    checkInProgressRef.current = true;

    try {
      // Validate prerequisites
      if (!isInitialized || !user) {
        throw new Error('System not initialized');
      }

      // Validate and sanitize user data
      const validUsername = validateUsername(user.username);
      if (!validUsername) {
        throw new Error('Invalid username');
      }

      const isValidRole = validateUserRole(user.role);
      
      // Check wallet service health with timeout
      const walletHealthy = healthStatus?.wallet_service ?? false;
      
      if (!walletHealthy) {
        throw new Error('Wallet service unhealthy');
      }

      let isReconciled = true;
      
      // Perform reconciliation check for valid roles
      if (isValidRole) {
        try {
          // Add timeout to prevent hanging
          const reconciliationPromise = reconcileBalance(validUsername, user.role);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Reconciliation timeout')), 30000)
          );
          
          const reconciliation = await Promise.race([
            reconciliationPromise,
            timeoutPromise
          ]) as any;
          
          // Validate reconciliation response
          const validatedReconciliation = HealthCheckSchema.parse(reconciliation);
          isReconciled = validatedReconciliation.isReconciled;
          
        } catch (error) {
          console.error('Reconciliation failed:', error);
          isReconciled = false;
        }
      }

      // Update state on success
      if (mountedRef.current) {
        setState(prev => ({
          isHealthy: walletHealthy && isReconciled,
          lastCheck: new Date(),
          consecutiveFailures: 0,
          nextCheckTime: new Date(Date.now() + DEFAULT_CHECK_INTERVAL),
          error: null
        }));
      }
      
    } catch (error) {
      console.error('Wallet health check failed:', error);
      
      // Update failure state
      if (mountedRef.current) {
        setState(prev => {
          const newFailures = Math.min(prev.consecutiveFailures + 1, MAX_CONSECUTIVE_FAILURES);
          const nextInterval = calculateCheckInterval(newFailures);
          
          return {
            isHealthy: false,
            lastCheck: new Date(),
            consecutiveFailures: newFailures,
            nextCheckTime: new Date(Date.now() + nextInterval),
            error: error instanceof Error ? error.message : 'Health check failed'
          };
        });
      }
    } finally {
      checkInProgressRef.current = false;
    }
  }, [isInitialized, user, healthStatus, reconcileBalance, validateUsername, validateUserRole, calculateCheckInterval]);

  // Setup health check interval
  useEffect(() => {
    if (!isInitialized || !user) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Perform initial check
    performHealthCheck();

    // Setup recurring checks with dynamic interval
    const setupInterval = () => {
      // Clear existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Calculate interval based on current failure count
      const interval = calculateCheckInterval(state.consecutiveFailures);
      
      // Validate interval is within bounds
      const safeInterval = Math.max(MIN_CHECK_INTERVAL, Math.min(interval, MAX_CHECK_INTERVAL));

      intervalRef.current = setInterval(() => {
        performHealthCheck();
      }, safeInterval);
    };

    setupInterval();

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isInitialized, user, performHealthCheck, calculateCheckInterval, state.consecutiveFailures]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Manual refresh function with rate limiting
  const refreshHealth = useCallback(async () => {
    // Check if enough time has passed since last check
    if (state.lastCheck) {
      const timeSinceLastCheck = Date.now() - state.lastCheck.getTime();
      if (timeSinceLastCheck < MIN_CHECK_INTERVAL) {
        console.warn('Health check rate limited');
        return;
      }
    }

    await performHealthCheck();
  }, [state.lastCheck, performHealthCheck]);

  return {
    isHealthy: state.isHealthy,
    lastCheck: state.lastCheck,
    healthStatus: healthStatus?.wallet_service ?? false,
    consecutiveFailures: state.consecutiveFailures,
    nextCheckTime: state.nextCheckTime,
    error: state.error,
    refreshHealth,
    isChecking: checkInProgressRef.current
  };
}
