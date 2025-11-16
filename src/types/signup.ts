// src/types/signup.ts

export type UserRole = 'buyer' | 'seller';

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  role: UserRole | null;
  termsAccepted: boolean;
  ageVerified: boolean;
}

export interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  country?: string;
  role?: string;
  termsAccepted?: string;
  ageVerified?: string;
  form?: string;
}

export interface SignupState extends SignupFormData {
  errors: FormErrors;
  isSubmitting: boolean;
  isCheckingUsername: boolean;
  mounted: boolean;
  passwordStrength: number;
}

// Component Props
export interface SignupHeaderProps {
  onLogoClick: () => void;
}

export interface UsernameFieldProps {
  username: string;
  error?: string;
  isChecking: boolean;
  onChange: (value: string) => void;
}

export interface EmailFieldProps {
  email: string;
  error?: string;
  onChange: (value: string) => void;
}

export interface PasswordFieldProps {
  password: string;
  confirmPassword: string;
  passwordError?: string;
  confirmError?: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  onTogglePassword: () => void;
  onToggleConfirm: () => void;
}

export interface CountryFieldProps {
  country: string;
  error?: string;
  onChange: (value: string) => void;
}

export interface RoleSelectorProps {
  role: UserRole | null;
  error?: string;
  onChange: (role: UserRole) => void;
}

export interface TermsCheckboxesProps {
  termsAccepted: boolean;
  ageVerified: boolean;
  termsError?: string;
  ageError?: string;
  onTermsChange: (checked: boolean) => void;
  onAgeChange: (checked: boolean) => void;
}

export interface SignupFooterProps {}

export interface PasswordStrengthProps {
  password: string;
  strength: number;
}