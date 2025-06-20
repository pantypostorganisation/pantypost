// src/components/seller-verification/utils/types.ts

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
  inputRef: React.RefObject<HTMLInputElement>;
  required?: boolean;
  helpText?: string;
  iconComponent?: React.ReactNode;
}

export interface VerificationDocsDisplay {
  codePhoto?: string;
  idFront?: string;
  idBack?: string;
  passport?: string;
}
