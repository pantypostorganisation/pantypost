// src/hooks/useValidation.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';
import { debounce } from '@/utils/security/validation';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';

interface ValidationState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValidating: boolean;
  isSubmitting: boolean;
}

interface UseValidationOptions<T> {
  initialValues: T;
  validationSchema?: z.ZodSchema<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  onSubmit?: (values: T) => void | Promise<void>;
  sanitizeErrors?: boolean;
  maxValidationAttempts?: number;
  enableSecurityChecks?: boolean;
}

interface UseValidationReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isValidating: boolean;
  isSubmitting: boolean;
  isValid: boolean;
  
  // Handlers
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  
  // Field-specific methods
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: (field: keyof T, error: string | undefined) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  
  // Utilities
  clearErrors: () => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
}

// Constants for security
const MAX_FIELD_NAME_LENGTH = 100;
const MAX_ERROR_MESSAGE_LENGTH = 500;
const MAX_VALIDATION_DEPTH = 5;
const DEFAULT_MAX_VALIDATION_ATTEMPTS = 100;

/**
 * Custom hook for form validation with Zod schemas and enhanced security
 */
export function useValidation<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  onSubmit,
  sanitizeErrors = true,
  maxValidationAttempts = DEFAULT_MAX_VALIDATION_ATTEMPTS,
  enableSecurityChecks = true,
}: UseValidationOptions<T>): UseValidationReturn<T> {
  const [state, setState] = useState<ValidationState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isValidating: false,
    isSubmitting: false,
  });

  const validationTimeouts = useRef<Map<keyof T, NodeJS.Timeout>>(new Map());
  const validationAttempts = useRef<number>(0);
  const lastValidationTime = useRef<number>(Date.now());

  // Validate debounce ms is within reasonable bounds
  const safeDebounceMs = Math.min(Math.max(debounceMs, 0), 5000);

  /**
   * Sanitize field name to prevent injection
   */
  const sanitizeFieldName = useCallback((field: keyof T): string => {
    const fieldStr = String(field);
    
    // Validate field name length
    if (fieldStr.length > MAX_FIELD_NAME_LENGTH) {
      console.warn(`Field name too long: ${fieldStr.substring(0, 50)}...`);
      return '';
    }
    
    // Sanitize field name
    return sanitizeStrict(fieldStr);
  }, []);

  /**
   * Sanitize error message
   */
  const sanitizeErrorMessage = useCallback((message: string): string => {
    if (!sanitizeErrors) return message;
    
    // Limit length
    const truncated = message.length > MAX_ERROR_MESSAGE_LENGTH 
      ? message.substring(0, MAX_ERROR_MESSAGE_LENGTH) + '...'
      : message;
    
    // Sanitize content
    return sanitizeStrict(truncated);
  }, [sanitizeErrors]);

  /**
   * Check for validation abuse
   */
  const checkValidationRate = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastValidation = now - lastValidationTime.current;
    
    // Reset counter if more than 1 minute has passed
    if (timeSinceLastValidation > 60000) {
      validationAttempts.current = 0;
    }
    
    validationAttempts.current++;
    lastValidationTime.current = now;
    
    // Check if exceeding rate limit
    if (validationAttempts.current > maxValidationAttempts) {
      console.warn('Validation rate limit exceeded');
      return false;
    }
    
    return true;
  }, [maxValidationAttempts]);

  /**
   * Validate a single field with security checks
   */
  const validateField = useCallback(
    async (field: keyof T): Promise<boolean> => {
      if (!validationSchema) return true;
      
      // Rate limiting check
      if (!checkValidationRate()) {
        console.warn('Validation rate limit hit');
        return false;
      }

      // Sanitize field name
      const safeFieldName = sanitizeFieldName(field);
      if (!safeFieldName) {
        console.error('Invalid field name');
        return false;
      }

      setState(prev => ({ ...prev, isValidating: true }));

      try {
        // Get the field schema if it exists
        const fieldSchema = (validationSchema as any).shape?.[field];
        
        if (fieldSchema) {
          await fieldSchema.parseAsync(state.values[field]);
          setState(prev => ({
            ...prev,
            errors: { ...prev.errors, [field]: undefined },
            isValidating: false,
          }));
          return true;
        }

        // Validate entire object if no field schema
        await validationSchema.parseAsync(state.values);
        setState(prev => ({
          ...prev,
          errors: {},
          isValidating: false,
        }));
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find(err => err.path[0] === field);
          const errorMessage = fieldError?.message || 'Validation failed';
          
          setState(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              [field]: sanitizeErrorMessage(errorMessage),
            },
            isValidating: false,
          }));
          return false;
        }
        
        // Log non-Zod errors for debugging
        console.error('Validation error:', error);
        setState(prev => ({ ...prev, isValidating: false }));
        return false;
      }
    },
    [validationSchema, state.values, checkValidationRate, sanitizeFieldName, sanitizeErrorMessage]
  );

  /**
   * Validate entire form with security checks
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!validationSchema) return true;
    
    // Rate limiting check
    if (!checkValidationRate()) {
      console.warn('Validation rate limit hit');
      return false;
    }

    setState(prev => ({ ...prev, isValidating: true }));

    try {
      // Perform security checks if enabled
      if (enableSecurityChecks) {
        const valuesStr = JSON.stringify(state.values);
        const securityCheck = securityService.checkContentSecurity(valuesStr);
        
        if (!securityCheck.safe) {
          console.warn('Security check failed:', securityCheck.issues);
          setState(prev => ({
            ...prev,
            errors: { form: 'Invalid input detected' } as any,
            isValidating: false,
          }));
          return false;
        }
      }

      await validationSchema.parseAsync(state.values);
      setState(prev => ({
        ...prev,
        errors: {},
        isValidating: false,
      }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Partial<Record<keyof T, string>> = {};
        
        // Process errors with depth limit to prevent deeply nested attacks
        let errorCount = 0;
        error.errors.forEach(err => {
          if (errorCount >= MAX_VALIDATION_DEPTH) return;
          
          const field = err.path[0] as keyof T;
          if (field && !errors[field]) {
            errors[field] = sanitizeErrorMessage(err.message);
            errorCount++;
          }
        });
        
        setState(prev => ({
          ...prev,
          errors,
          isValidating: false,
        }));
        return false;
      }
      
      console.error('Form validation error:', error);
      setState(prev => ({ ...prev, isValidating: false }));
      return false;
    }
  }, [validationSchema, state.values, checkValidationRate, sanitizeErrorMessage, enableSecurityChecks]);

  /**
   * Debounced validation with cleanup
   */
  const debouncedValidateField = useCallback(
    (field: keyof T) => {
      const timeout = validationTimeouts.current.get(field);
      if (timeout) {
        clearTimeout(timeout);
      }

      const newTimeout = setTimeout(() => {
        validateField(field).catch(error => {
          console.error('Field validation error:', error);
        });
        validationTimeouts.current.delete(field);
      }, safeDebounceMs);

      validationTimeouts.current.set(field, newTimeout);
    },
    [validateField, safeDebounceMs]
  );

  /**
   * Handle field change with validation
   */
  const handleChange = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      // Validate field key
      const safeField = sanitizeFieldName(field);
      if (!safeField) {
        console.error('Invalid field name in handleChange');
        return;
      }

      setState(prev => ({
        ...prev,
        values: { ...prev.values, [field]: value },
      }));

      if (validateOnChange && state.touched[field]) {
        debouncedValidateField(field);
      }
    },
    [validateOnChange, state.touched, debouncedValidateField, sanitizeFieldName]
  );

  /**
   * Handle field blur with validation
   */
  const handleBlur = useCallback(
    (field: keyof T) => {
      // Validate field key
      const safeField = sanitizeFieldName(field);
      if (!safeField) {
        console.error('Invalid field name in handleBlur');
        return;
      }

      setState(prev => ({
        ...prev,
        touched: { ...prev.touched, [field]: true },
      }));

      if (validateOnBlur) {
        validateField(field).catch(error => {
          console.error('Blur validation error:', error);
        });
      }
    },
    [validateOnBlur, validateField, sanitizeFieldName]
  );

  /**
   * Handle form submission with security
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Prevent rapid submissions
      if (state.isSubmitting) {
        console.warn('Form is already submitting');
        return;
      }

      // Mark all fields as touched
      const allTouched = Object.keys(state.values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>
      );

      setState(prev => ({
        ...prev,
        touched: allTouched,
        isSubmitting: true,
      }));

      try {
        // Validate form
        const isValid = await validateForm();

        if (!isValid) {
          setState(prev => ({ ...prev, isSubmitting: false }));
          return;
        }

        // Call onSubmit if provided
        if (onSubmit) {
          await onSubmit(state.values);
        }
        
        setState(prev => ({ ...prev, isSubmitting: false }));
      } catch (error) {
        console.error('Form submission error:', error);
        setState(prev => ({ 
          ...prev, 
          isSubmitting: false,
          errors: { 
            ...prev.errors, 
            form: sanitizeErrorMessage('Submission failed. Please try again.') 
          } as any
        }));
        throw error;
      }
    },
    [state.values, state.isSubmitting, validateForm, onSubmit, sanitizeErrorMessage]
  );

  /**
   * Reset form to initial values
   */
  const handleReset = useCallback(() => {
    // Clear all timeouts
    validationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    validationTimeouts.current.clear();

    // Reset validation attempts
    validationAttempts.current = 0;

    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isValidating: false,
      isSubmitting: false,
    });
  }, [initialValues]);

  /**
   * Set field value with validation
   */
  const setFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      handleChange(field, value);
    },
    [handleChange]
  );

  /**
   * Set field error with sanitization
   */
  const setFieldError = useCallback(
    (field: keyof T, error: string | undefined) => {
      const safeField = sanitizeFieldName(field);
      if (!safeField) {
        console.error('Invalid field name in setFieldError');
        return;
      }

      setState(prev => ({
        ...prev,
        errors: error
          ? { ...prev.errors, [field]: sanitizeErrorMessage(error) }
          : { ...prev.errors, [field]: undefined },
      }));
    },
    [sanitizeFieldName, sanitizeErrorMessage]
  );

  /**
   * Set field touched status
   */
  const setFieldTouched = useCallback(
    (field: keyof T, touched: boolean = true) => {
      const safeField = sanitizeFieldName(field);
      if (!safeField) {
        console.error('Invalid field name in setFieldTouched');
        return;
      }

      setState(prev => ({
        ...prev,
        touched: { ...prev.touched, [field]: touched },
      }));
    },
    [sanitizeFieldName]
  );

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }));
  }, []);

  /**
   * Set multiple values with validation
   */
  const setValues = useCallback((values: Partial<T>) => {
    // Validate object depth to prevent deeply nested attacks
    try {
      const depth = getObjectDepth(values);
      if (depth > MAX_VALIDATION_DEPTH) {
        console.error('Values object too deeply nested');
        return;
      }
    } catch (error) {
      console.error('Error checking object depth:', error);
      return;
    }

    setState(prev => ({
      ...prev,
      values: { ...prev.values, ...values },
    }));
  }, []);

  /**
   * Set multiple errors with sanitization
   */
  const setErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    const sanitizedErrors: Partial<Record<keyof T, string>> = {};
    
    Object.entries(errors).forEach(([key, value]) => {
      const safeKey = sanitizeFieldName(key as keyof T);
      if (safeKey && value) {
        sanitizedErrors[key as keyof T] = sanitizeErrorMessage(value);
      }
    });

    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...sanitizedErrors },
    }));
  }, [sanitizeFieldName, sanitizeErrorMessage]);

  /**
   * Cleanup timeouts on unmount
   */
  useEffect(() => {
    return () => {
      validationTimeouts.current.forEach(timeout => clearTimeout(timeout));
      validationTimeouts.current.clear();
    };
  }, []);

  // Calculate if form is valid
  const isValid = Object.keys(state.errors).length === 0 && !state.isValidating;

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isValidating: state.isValidating,
    isSubmitting: state.isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    handleReset,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField,
    validateForm,
    clearErrors,
    setValues,
    setErrors,
  };
}

/**
 * Helper hook for field-level validation
 */
export function useFieldValidation<T>(
  name: keyof T,
  validation: UseValidationReturn<T>
) {
  const { values, errors, touched, handleChange, handleBlur } = validation;

  return {
    value: values[name],
    error: touched[name] ? errors[name] : undefined,
    touched: touched[name],
    onChange: (value: T[typeof name]) => handleChange(name, value),
    onBlur: () => handleBlur(name),
  };
}

/**
 * Create a validation schema builder with common patterns
 */
export function createValidationSchema<T extends Record<string, any>>(
  fields: Record<keyof T, z.ZodTypeAny>
): z.ZodObject<Record<keyof T, z.ZodTypeAny>> {
  return z.object(fields);
}

/**
 * Helper function to check object depth
 */
function getObjectDepth(obj: any, currentDepth = 0): number {
  if (currentDepth > MAX_VALIDATION_DEPTH) {
    return currentDepth;
  }

  if (obj === null || typeof obj !== 'object') {
    return currentDepth;
  }

  let maxDepth = currentDepth;
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const depth = getObjectDepth(obj[key], currentDepth + 1);
      maxDepth = Math.max(maxDepth, depth);
    }
  }

  return maxDepth;
}
