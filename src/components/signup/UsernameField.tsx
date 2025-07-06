// src/components/signup/UsernameField.tsx
'use client';

import { CheckCircle, Loader2, User } from 'lucide-react';
import { UsernameFieldProps } from '@/types/signup';
import { SecureInput } from '@/components/ui/SecureInput';
import { sanitizeUsername } from '@/utils/security/sanitization';

export default function UsernameField({ 
  username, 
  error, 
  isChecking, 
  onChange 
}: UsernameFieldProps) {
  // Custom sanitizer for username
  const handleUsernameChange = (value: string) => {
    // Apply username-specific sanitization
    const sanitized = sanitizeUsername(value);
    onChange(sanitized);
  };

  // Determine if username is valid (for visual feedback) - ensure boolean type
  const isValid = Boolean(!isChecking && username && username.length >= 3 && !error);

  return (
    <div className="mb-4 relative">
      <SecureInput
        id="username"
        name="username"
        type="text"
        label="Username"
        value={username}
        onChange={handleUsernameChange}
        error={error}
        touched={!!error || (username.length >= 3)}
        success={isValid}
        placeholder="Choose a username"
        autoComplete="username"
        spellCheck={false}
        maxLength={30}
        characterCount={true}
        sanitize={true}
        sanitizer={sanitizeUsername}
        validationIndicator={false} // We'll use custom indicators
        helpText="3-30 characters, letters, numbers, underscores, and hyphens only"
        className="w-full"
      />
      
      {/* Custom status indicators */}
      <div className="absolute right-3 top-[38px] pointer-events-none">
        {isChecking && (
          <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        )}
        {isValid && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
      </div>

      {/* Checking message */}
      {isChecking && (
        <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" />
          Checking availability...
        </p>
      )}

      {/* Success message */}
      {isValid && (
        <p className="mt-1 text-xs text-green-400 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Username is available!
        </p>
      )}
    </div>
  );
}
