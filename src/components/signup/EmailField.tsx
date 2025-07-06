// src/components/signup/EmailField.tsx
'use client';

import { EmailFieldProps } from '@/types/signup';
import { SecureInput } from '@/components/ui/SecureInput';
import { Mail } from 'lucide-react';

export default function EmailField({ 
  email, 
  error, 
  onChange 
}: EmailFieldProps) {
  return (
    <div className="mb-4">
      <SecureInput
        id="email"
        name="email"
        type="email"
        label="Email Address"
        value={email}
        onChange={onChange}
        error={error}
        touched={!!error} // Show error if exists
        placeholder="you@example.com"
        autoComplete="email"
        spellCheck={false}
        maxLength={100}
        characterCount={false}
        sanitize={true}
        validationIndicator={true}
        helpText="We'll never share your email with anyone"
        className="w-full"
      />
    </div>
  );
}
