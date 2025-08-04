// src/types/login.ts

export interface LoginState {
  username: string;
  password: string;  // ADDED PASSWORD
  role: 'buyer' | 'seller' | 'admin' | null;
  error: string;
  isLoading: boolean;
  step: number;
  mounted: boolean;
  showAdminMode: boolean;
}

export interface RoleOption {
  key: string;
  label: string;
  icon: any;
  description: string;
}

export interface ParticleProps {
  size: number;
  opacity: number;
  glowIntensity: number;
}

export interface ParticleColor {
  bg: string;
  hex: string;
}

// Component Props
export interface FloatingParticleProps {
  delay?: number;
  index?: number;
}

export interface LoginHeaderProps {
  step: number;
  showAdminMode: boolean;
  onLogoClick: () => void;
}

export interface UsernameStepProps {
  username: string;
  error: string | null;
  onUsernameChange: (value: string) => void;
  onSubmit: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isDisabled: boolean;
}

// NEW: Password Step Props
export interface PasswordStepProps {
  username: string;
  password: string;
  error: string | null;
  onPasswordChange: (password: string) => void;
  onBack: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
  hasUser: boolean;
  isRateLimited?: boolean;
  rateLimitWaitTime?: number;
}

export interface RoleSelectionStepProps {
  role: 'buyer' | 'seller' | 'admin' | null;
  error: string;
  roleOptions: RoleOption[];
  onRoleSelect: (role: 'buyer' | 'seller' | 'admin') => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  hasUser: boolean;
}

export interface AdminCrownButtonProps {
  showAdminMode: boolean;
  onToggle: () => void;
}

export interface LoginFooterProps {
  step: number;
}

export interface TrustIndicatorsProps {}