// src/utils/errorHandling.ts
'use client';

import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Error types
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Extended Error class
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType = ErrorType.UNKNOWN,
    public severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    public code?: string,
    public details?: any,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Error mapping utility
export function mapErrorToAppError(error: any): AppError {
  // Network errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('network')) {
    return new AppError(
      'Network connection failed',
      ErrorType.NETWORK,
      ErrorSeverity.HIGH,
      'NETWORK_ERROR',
      error
    );
  }

  // Timeout errors
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return new AppError(
      'Request timed out',
      ErrorType.TIMEOUT,
      ErrorSeverity.MEDIUM,
      'TIMEOUT_ERROR',
      error
    );
  }

  // API Response errors
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return new AppError(
          data?.message || 'Invalid request',
          ErrorType.VALIDATION,
          ErrorSeverity.LOW,
          'VALIDATION_ERROR',
          data,
          false
        );

      case 401:
        return new AppError(
          'Authentication required',
          ErrorType.AUTHENTICATION,
          ErrorSeverity.HIGH,
          'AUTH_ERROR',
          data,
          false
        );

      case 403:
        return new AppError(
          'Access denied',
          ErrorType.AUTHORIZATION,
          ErrorSeverity.HIGH,
          'FORBIDDEN',
          data,
          false
        );

      case 404:
        return new AppError(
          'Resource not found',
          ErrorType.NOT_FOUND,
          ErrorSeverity.LOW,
          'NOT_FOUND',
          data,
          false
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return new AppError(
          'Server error occurred',
          ErrorType.SERVER,
          ErrorSeverity.CRITICAL,
          `SERVER_ERROR_${status}`,
          data,
          true
        );

      default:
        return new AppError(
          data?.message || 'An error occurred',
          ErrorType.UNKNOWN,
          ErrorSeverity.MEDIUM,
          `HTTP_${status}`,
          data
        );
    }
  }

  // Default error
  return new AppError(
    error.message || 'An unexpected error occurred',
    ErrorType.UNKNOWN,
    ErrorSeverity.MEDIUM,
    'UNKNOWN_ERROR',
    error
  );
}

// Retry configuration
export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: AppError, attempt: number) => boolean;
  onRetry?: (error: AppError, attempt: number) => void;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error) => error.retryable && error.type !== ErrorType.VALIDATION,
  onRetry: () => {},
};

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: AppError | null = null;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof AppError ? error : mapErrorToAppError(error);
      
      // Check if we should retry
      if (
        attempt >= finalConfig.maxAttempts ||
        !finalConfig.shouldRetry(lastError, attempt)
      ) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelay
      );
      
      // Call onRetry callback
      finalConfig.onRetry(lastError, attempt);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new AppError('Retry failed', ErrorType.UNKNOWN);
}

// Circuit breaker implementation
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold = 5,
    private resetTimeout = 60000, // 1 minute
    private halfOpenAttempts = 1
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError(
          'Service temporarily unavailable',
          ErrorType.SERVER,
          ErrorSeverity.HIGH,
          'CIRCUIT_OPEN',
          { resetIn: this.resetTimeout - (now - this.lastFailureTime) },
          false
        );
      }
    }
    
    try {
      const result = await fn();
      
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }
  
  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
  
  reset() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = 0;
  }
}

// Hook for error handling
export function useErrorHandler() {
  const toast = useToast();
  const { isOnline, retryFailedRequest } = useNetworkStatus();
  const [errors, setErrors] = useState<Map<string, AppError>>(new Map());
  const circuitBreakers = useRef<Map<string, CircuitBreaker>>(new Map());

  // Handle error with appropriate UI feedback
  const handleError = useCallback((
    error: any,
    options: {
      showToast?: boolean;
      fallbackMessage?: string;
      context?: string;
    } = {}
  ) => {
    const appError = error instanceof AppError ? error : mapErrorToAppError(error);
    const { showToast = true, fallbackMessage, context } = options;

    // Store error for component access
    if (context) {
      setErrors(prev => new Map(prev).set(context, appError));
    }

    // Log error
    console.error(`[${appError.type}] ${appError.message}`, appError);

    // Show appropriate toast based on error type
    if (showToast) {
      const message = fallbackMessage || appError.message;

      switch (appError.type) {
        case ErrorType.NETWORK:
          if (!isOnline) {
            toast.error('No Internet Connection', 'Please check your network');
          } else {
            toast.error('Network Error', message);
          }
          break;

        case ErrorType.AUTHENTICATION:
          toast.error('Authentication Required', 'Please log in to continue', );
          break;

        case ErrorType.AUTHORIZATION:
          toast.error('Access Denied', 'You don\'t have permission to do this');
          break;

        case ErrorType.VALIDATION:
          toast.warning('Invalid Input', message);
          break;

        case ErrorType.NOT_FOUND:
          toast.info('Not Found', message);
          break;

        case ErrorType.SERVER:
          toast.error('Server Error', 'Something went wrong. Please try again later.');
          break;

        default:
          toast.error('Error', message);
      }
    }

    return appError;
  }, [toast, isOnline]);

  // Clear error for a specific context
  const clearError = useCallback((context: string) => {
    setErrors(prev => {
      const next = new Map(prev);
      next.delete(context);
      return next;
    });
  }, []);

  // Get error for a specific context
  const getError = useCallback((context: string) => {
    return errors.get(context);
  }, [errors]);

  // Execute with error handling
  const executeWithErrorHandling = useCallback(async <T,>(
    fn: () => Promise<T>,
    options: {
      context?: string;
      showToast?: boolean;
      retryConfig?: RetryConfig;
      useCircuitBreaker?: boolean;
      circuitBreakerKey?: string;
    } = {}
  ): Promise<T | null> => {
    const {
      context,
      showToast = true,
      retryConfig,
      useCircuitBreaker = false,
      circuitBreakerKey = 'default',
    } = options;

    try {
      // Clear any existing error
      if (context) {
        clearError(context);
      }

      let execute = fn;

      // Wrap with circuit breaker if requested
      if (useCircuitBreaker) {
        if (!circuitBreakers.current.has(circuitBreakerKey)) {
          circuitBreakers.current.set(circuitBreakerKey, new CircuitBreaker());
        }
        const breaker = circuitBreakers.current.get(circuitBreakerKey)!;
        execute = () => breaker.execute(fn);
      }

      // Execute with retry if configured
      if (retryConfig) {
        return await retryWithBackoff(execute, {
          ...retryConfig,
          onRetry: (error, attempt) => {
            if (retryConfig.onRetry) {
              retryConfig.onRetry(error, attempt);
            }
            // Show toast on retry
            toast.info(`Retrying... (${attempt}/${retryConfig.maxAttempts || DEFAULT_RETRY_CONFIG.maxAttempts})`);
          },
        });
      }

      return await execute();
    } catch (error) {
      handleError(error, { showToast, context });
      return null;
    }
  }, [handleError, clearError, toast]);

  return {
    handleError,
    clearError,
    getError,
    executeWithErrorHandling,
    errors,
    hasError: (context: string) => errors.has(context),
  };
}
