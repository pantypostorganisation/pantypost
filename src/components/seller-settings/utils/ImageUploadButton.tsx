// src/components/seller-settings/utils/ImageUploadButton.tsx
'use client';

import React from 'react';
import { Upload } from 'lucide-react';
import { z } from 'zod';
import { sanitizeStrict } from '@/utils/security/sanitization';

// Zod for runtime checks on non-ReactNode fields only
const BasePropsSchema = z.object({
  onClick: z.function().args().returns(z.void()),
  text: z.string().default('Upload'),
  className: z.string().optional(),
  disabled: z.boolean().optional(),
});

// Final TS props (icon is a ReactNode, not validated by Zod)
interface ImageUploadButtonProps extends z.infer<typeof BasePropsSchema> {
  icon?: React.ReactNode;
}

export default function ImageUploadButton(rawProps: ImageUploadButtonProps) {
  // Validate only safe primitives with Zod; leave ReactNode out of it
  const parsed = BasePropsSchema.safeParse(rawProps);
  const {
    onClick,
    text = 'Upload',
    className = '',
    disabled = false,
  } = parsed.success
    ? parsed.data
    : { onClick: () => {}, text: 'Upload', className: '', disabled: false };

  const icon = rawProps.icon;

  const sanitizedClass = sanitizeStrict(className);
  const label = sanitizeStrict(text);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 bg-[#ff950e] text-black font-bold rounded-lg hover:bg-[#e88800] transition disabled:bg-gray-600 disabled:cursor-not-allowed ${sanitizedClass}`}
      aria-disabled={disabled || undefined}
    >
      {icon ?? <Upload className="w-4 h-4" />}
      <span>{label}</span>
    </button>
  );
}
