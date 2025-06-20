// src/components/seller-verification/utils/types.ts
import React from 'react';

export interface ImageViewData {
  type: string;
  url: string;
}

export interface VerificationStateProps {
  user: any;
  code: string;
  onBack?: () => void;
  getTimeAgo?: (timestamp?: string) => string;
}

export interface DocumentUploadFieldProps {
  label: string;
  value: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  required?: boolean;
  helpText?: string;
  iconComponent?: React.ComponentType<{ className?: string }>;
}

export interface VerificationDocsDisplay {
  codePhoto?: string;
  idFront?: string;
  idBack?: string;
  passport?: string;
}
