'use client';

import React, { useState, useEffect, forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { sanitizeStrict, sanitizeEmail } from '@/utils/security/sanitization';

interface SecureInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  touched?: boolean;
  success?: boolean;
  helpText?: string;
  sanitize?: boolean;
  sanitizer?: (value: string) => string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  showPasswordToggle?: boolean;
  showStrengthIndicator?: boolean;
  validationIndicator?: boolean;
  maxLength?: number;
  characterCount?: boolean;
}

/**
 * Secure input component with built-in sanitization and validation indicators
 */
export const SecureInput = forwardRef<HTMLInputElement, SecureInputProps>(
  (
    {
      label,
      error,
      touched,
      success,
      helpText,
      sanitize = true,
      sanitizer,
      onChange,
      onBlur,
      type = 'text',
      showPasswordToggle = false,
      showStrengthIndicator = false,
      validationIndicator = true,
      maxLength,
      characterCount = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [value, setValue] = useState((props.value as string) || '');
    const [isFocused, setIsFocused] = useState(false);

    // Keep internal value synchronized with external value prop
    useEffect(() => {
      setValue((props.value as string) ?? '');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.value]);

    // Determine input type (preserve native types other than password)
    const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

    // Handle input change with sanitization
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;

      // Apply sanitization
      if (sanitize) {
        if (sanitizer) {
          newValue = sanitizer(newValue);
        } else if (type === 'email') {
          newValue = sanitizeEmail(newValue);
        } else if (type !== 'password') {
          newValue = sanitizeStrict(newValue);
        }
      }

      // Apply max length
      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }

      setValue(newValue);
      onChange?.(newValue);
    };

    // Handle paste event with extra sanitization
    const handlePaste = (e: React.ClipboardEvent) => {
      if (!sanitize) return;

      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      let sanitizedText = pastedText;

      if (sanitizer) {
        sanitizedText = sanitizer(pastedText);
      } else if (type === 'email') {
        sanitizedText = sanitizeEmail(pastedText);
      } else if (type !== 'password') {
        sanitizedText = sanitizeStrict(pastedText);
      }

      const newValue = value + sanitizedText;
      setValue(maxLength ? newValue.slice(0, maxLength) : newValue);
      onChange?.(newValue);
    };

    // Determine border color based on state
    const getBorderColor = () => {
      if (isFocused) {
        if (error && touched) return 'border-red-500 focus:ring-red-500';
        if (success && touched) return 'border-green-500 focus:ring-green-500';
        return 'border-[#ff950e] focus:ring-[#ff950e]';
      }

      if (error && touched) return 'border-red-500/50';
      if (success && touched) return 'border-green-500/50';
      return 'border-gray-700';
    };

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={inputType}
            value={value}
            onChange={handleChange}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            className={`
              w-full px-3.5 py-2.5 bg-black/50 border rounded-lg 
              text-white placeholder-gray-500 focus:outline-none focus:ring-1 
              transition-colors ${getBorderColor()} ${className}
              ${showPasswordToggle || validationIndicator ? 'pr-10' : ''}
            `}
            {...props}
          />

          {/* Password toggle button */}
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Validation indicator */}
          {validationIndicator && !showPasswordToggle && touched && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {error ? (
                <AlertCircle className="w-4 h-4 text-red-400" />
              ) : success ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : null}
            </div>
          )}
        </div>

        {/* Error, success, or help text */}
        {touched && error && (
          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}

        {!error && helpText && (
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            {helpText}
          </p>
        )}

        {/* Character count */}
        {characterCount && maxLength && (
          <p
            className={`mt-1 text-xs text-right ${
              value.length >= maxLength ? 'text-red-400' : 'text-gray-500'
            }`}
          >
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);

SecureInput.displayName = 'SecureInput';

/**
 * Secure textarea component with similar features
 */
interface SecureTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  error?: string;
  touched?: boolean;
  success?: boolean;
  helpText?: string;
  sanitize?: boolean;
  sanitizer?: (value: string) => string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  maxLength?: number;
  characterCount?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const SecureTextarea = forwardRef<HTMLTextAreaElement, SecureTextareaProps>(
  (
    {
      label,
      error,
      touched,
      success,
      helpText,
      sanitize = true,
      sanitizer,
      onChange,
      onBlur,
      maxLength,
      characterCount = true,
      resize = 'vertical',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState((props.value as string) || '');
    const [isFocused, setIsFocused] = useState(false);

    // Keep internal value synchronized with external value prop
    useEffect(() => {
      setValue((props.value as string) ?? '');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.value]);

    // Handle input change with sanitization
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let newValue = e.target.value;

      // Apply sanitization
      if (sanitize) {
        if (sanitizer) {
          newValue = sanitizer(newValue);
        } else {
          newValue = sanitizeStrict(newValue);
        }
      }

      // Apply max length
      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }

      setValue(newValue);
      onChange?.(newValue);
    };

    // Determine border color based on state
    const getBorderColor = () => {
      if (isFocused) {
        if (error && touched) return 'border-red-500 focus:ring-red-500';
        if (success && touched) return 'border-green-500 focus:ring-green-500';
        return 'border-[#ff950e] focus:ring-[#ff950e]';
      }

      if (error && touched) return 'border-red-500/50';
      if (success && touched) return 'border-green-500/50';
      return 'border-gray-700';
    };

    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }[resize];

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={id}
            value={value}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            className={`
              w-full px-3.5 py-2.5 bg-black/50 border rounded-lg 
              text-white placeholder-gray-500 focus:outline-none focus:ring-1 
              transition-colors ${getBorderColor()} ${resizeClass} ${className}
            `}
            {...props}
          />
        </div>

        {/* Error, success, or help text */}
        {touched && error && (
          <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}

        {!error && helpText && (
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            {helpText}
          </p>
        )}

        {/* Character count */}
        {characterCount && maxLength && (
          <p
            className={`mt-1 text-xs text-right ${
              value.length >= maxLength ? 'text-red-400' : 'text-gray-500'
            }`}
          >
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);

SecureTextarea.displayName = 'SecureTextarea';
