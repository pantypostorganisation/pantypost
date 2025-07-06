// src/hooks/useValidation.ts

import { useState, useCallback, useRef, useEffect } from 'react';
import { z } from 'zod';
import { debounce } from '@/utils/security/validation';

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

/**
 * Custom hook for form validation with Zod schemas
 */
export function useValidation<T extends Record<string, any>>({
  initialValues,
  validationSchema,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
  onSubmit,
}: UseValidationOptions<T>): UseValidationReturn<T> {
  const [state, setState] = useState<ValidationState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isValidating: false,
    isSubmitting: false,
  });

  const validationTimeouts = useRef<Map<keyof T, NodeJS.Timeout>>(new Map());

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    async (field: keyof T): Promise<boolean> => {
      if (!validationSchema) return true;

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
          setState(prev => ({
            ...prev,
            errors: {
              ...prev.errors,
              [field]: fieldError?.message || 'Validation failed',
            },
            isValidating: false,
          }));
          return false;
        }
        setState(prev => ({ ...prev, isValidating: false }));
        return false;
      }
    },
    [validationSchema, state.values]
  );

  /**
   * Validate entire form
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    if (!validationSchema) return true;

    setState(prev => ({ ...prev, isValidating: true }));

    try {
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
        error.errors.forEach(err => {
          const field = err.path[0] as keyof T;
          if (field && !errors[field]) {
            errors[field] = err.message;
          }
        });
        setState(prev => ({
          ...prev,
          errors,
          isValidating: false,
        }));
        return false;
      }
      setState(prev => ({ ...prev, isValidating: false }));
      return false;
    }
  }, [validationSchema, state.values]);

  /**
   * Debounced validation
   */
  const debouncedValidateField = useCallback(
    (field: keyof T) => {
      const timeout = validationTimeouts.current.get(field);
      if (timeout) {
        clearTimeout(timeout);
      }

      const newTimeout = setTimeout(() => {
        validateField(field);
        validationTimeouts.current.delete(field);
      }, debounceMs);

      validationTimeouts.current.set(field, newTimeout);
    },
    [validateField, debounceMs]
  );

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setState(prev => ({
        ...prev,
        values: { ...prev.values, [field]: value },
      }));

      if (validateOnChange && state.touched[field]) {
        debouncedValidateField(field);
      }
    },
    [validateOnChange, state.touched, debouncedValidateField]
  );

  /**
   * Handle field blur
   */
  const handleBlur = useCallback(
    (field: keyof T) => {
      setState(prev => ({
        ...prev,
        touched: { ...prev.touched, [field]: true },
      }));

      if (validateOnBlur) {
        validateField(field);
      }
    },
    [validateOnBlur, validateField]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
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

      // Validate form
      const isValid = await validateForm();

      if (!isValid) {
        setState(prev => ({ ...prev, isSubmitting: false }));
        return;
      }

      // Call onSubmit if provided
      if (onSubmit) {
        try {
          await onSubmit(state.values);
          setState(prev => ({ ...prev, isSubmitting: false }));
        } catch (error) {
          setState(prev => ({ ...prev, isSubmitting: false }));
          throw error;
        }
      } else {
        setState(prev => ({ ...prev, isSubmitting: false }));
      }
    },
    [state.values, validateForm, onSubmit]
  );

  /**
   * Reset form to initial values
   */
  const handleReset = useCallback(() => {
    // Clear all timeouts
    validationTimeouts.current.forEach(timeout => clearTimeout(timeout));
    validationTimeouts.current.clear();

    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isValidating: false,
      isSubmitting: false,
    });
  }, [initialValues]);

  /**
   * Set field value
   */
  const setFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      handleChange(field, value);
    },
    [handleChange]
  );

  /**
   * Set field error
   */
  const setFieldError = useCallback(
    (field: keyof T, error: string | undefined) => {
      setState(prev => ({
        ...prev,
        errors: error
          ? { ...prev.errors, [field]: error }
          : { ...prev.errors, [field]: undefined },
      }));
    },
    []
  );

  /**
   * Set field touched
   */
  const setFieldTouched = useCallback(
    (field: keyof T, touched: boolean = true) => {
      setState(prev => ({
        ...prev,
        touched: { ...prev.touched, [field]: touched },
      }));
    },
    []
  );

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }));
  }, []);

  /**
   * Set multiple values
   */
  const setValues = useCallback((values: Partial<T>) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, ...values },
    }));
  }, []);

  /**
   * Set multiple errors
   */
  const setErrors = useCallback((errors: Partial<Record<keyof T, string>>) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, ...errors },
    }));
  }, []);

  /**
   * Cleanup timeouts on unmount
   */
  useEffect(() => {
    return () => {
      validationTimeouts.current.forEach(timeout => clearTimeout(timeout));
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
