// src/types/forms.ts

/**
 * Form validation and handling types
 */

// Form field state
export interface FieldState<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}

// Form state
export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  isDirty: boolean;
  submitCount: number;
}

// Validation rule
export type ValidationRule<T = unknown> = {
  validate: (value: T, formValues?: Record<string, unknown>) => boolean | Promise<boolean>;
  message: string | ((value: T) => string);
};

// Field config
export interface FieldConfig<T = unknown> {
  name: string;
  defaultValue?: T;
  rules?: ValidationRule<T>[];
  transform?: (value: unknown) => T;
  format?: (value: T) => string;
}

// Form config
export interface FormConfig<T extends Record<string, unknown>> {
  fields: {
    [K in keyof T]: FieldConfig<T[K]>;
  };
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  resetOnSubmit?: boolean;
}

// Form handlers
export interface FormHandlers<T extends Record<string, unknown>> {
  handleChange: <K extends keyof T>(field: K, value: T[K]) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  validateField: (field: keyof T) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
}

// Common validation rules
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule<unknown> => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value != null;
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message: message || `Must be at most ${max} characters`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value) => regex.test(value),
    message,
  }),

  email: (message = 'Invalid email address'): ValidationRule<string> => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value <= max,
    message: message || `Must be at most ${max}`,
  }),

  custom: <T>(
    validate: (value: T, formValues?: Record<string, unknown>) => boolean | Promise<boolean>,
    message: string
  ): ValidationRule<T> => ({
    validate,
    message,
  }),
};

// Form field props
export interface FormFieldProps<T = string> {
  name: string;
  label?: string;
  placeholder?: string;
  type?: string;
  value: T;
  error?: string;
  touched?: boolean;
  onChange: (value: T) => void;
  onBlur: () => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

// Form submission result
export interface FormSubmitResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
  message?: string;
}
