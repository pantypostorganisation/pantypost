// src/components/signup/PasswordField.tsx
'use client';

import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { PasswordFieldProps } from '@/types/signup';
import { SecureInput } from '@/components/ui/SecureInput';

export default function PasswordField({
  password,
  confirmPassword,
  passwordError,
  confirmError,
  showPassword,
  showConfirmPassword,
  onPasswordChange,
  onConfirmChange,
  onTogglePassword,
  onToggleConfirm
}: PasswordFieldProps) {
  return (
    <>
      {/* Password Field */}
      <div className="mb-4">
        <SecureInput
          id="password"
          name="password"
          type="password"
          label="Password"
          value={password}
          onChange={onPasswordChange}
          error={passwordError}
          touched={!!passwordError}
          placeholder="Create a strong password"
          autoComplete="new-password"
          maxLength={100}
          characterCount={false}
          sanitize={false} // Don't sanitize passwords
          showPasswordToggle={true}
          validationIndicator={true}
          helpText="At least 8 characters with uppercase, lowercase, and number"
          className="w-full"
        />
      </div>

      {/* Confirm Password Field */}
      <div className="mb-4">
        <SecureInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={onConfirmChange}
          error={confirmError}
          touched={!!confirmError}
          placeholder="Confirm your password"
          autoComplete="new-password"
          maxLength={100}
          characterCount={false}
          sanitize={false} // Don't sanitize passwords
          showPasswordToggle={true}
          validationIndicator={true}
          className="w-full"
        />
      </div>

      {/* Security Indicator */}
      {password && (
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="w-3 h-3" />
          <span>Your password is encrypted and never stored in plain text</span>
        </div>
      )}
    </>
  );
}
