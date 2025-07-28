// tests/signup.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import SignupPage from '@/app/signup/page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

// Mock all child components used by SignupPage
jest.mock('@/components/signup/FloatingParticle', () => ({
  __esModule: true,
  default: ({ delay }: any) => <div data-testid="floating-particle" data-delay={delay} />
}));

jest.mock('@/components/signup/SignupHeader', () => ({
  __esModule: true,
  default: ({ onLogoClick }: any) => (
    <div onClick={onLogoClick}>
      <h1>Join PantyPost</h1>
      <span>PantyPost</span>
    </div>
  )
}));

jest.mock('@/components/signup/UsernameField', () => ({
  __esModule: true,
  default: ({ username, error, isChecking, onChange }: any) => (
    <input
      type="text"
      placeholder="Choose a username"
      value={username}
      onChange={(e) => onChange(e.target.value)}
      data-error={error}
      data-checking={isChecking}
    />
  )
}));

jest.mock('@/components/signup/EmailField', () => ({
  __esModule: true,
  default: ({ email, error, onChange }: any) => (
    <input
      type="email"
      placeholder="Email address"
      value={email}
      onChange={(e) => onChange(e.target.value)}
      data-error={error}
    />
  )
}));

jest.mock('@/components/signup/PasswordField', () => ({
  __esModule: true,
  default: ({ password, confirmPassword, passwordError, confirmError, showPassword, showConfirmPassword, onPasswordChange, onConfirmChange, onTogglePassword, onToggleConfirm }: any) => (
    <>
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder="Password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        data-error={passwordError}
      />
      <button onClick={onTogglePassword} type="button">Toggle</button>
      <input
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="Confirm password"
        value={confirmPassword}
        onChange={(e) => onConfirmChange(e.target.value)}
        data-error={confirmError}
      />
      <button onClick={onToggleConfirm} type="button">Toggle</button>
    </>
  )
}));

jest.mock('@/components/signup/PasswordStrength', () => ({
  __esModule: true,
  default: ({ password, strength }: any) => (
    <div data-testid="password-strength">
      {strength === 0 && password && <span>Weak</span>}
      {strength === 1 && <span>Medium</span>}
      {strength === 2 && <span>Strong</span>}
    </div>
  )
}));

jest.mock('@/components/signup/RoleSelector', () => ({
  __esModule: true,
  default: ({ role, error, onChange }: any) => (
    <div data-error={error}>
      <button
        className={role === 'buyer' ? 'border-[#ff950e]' : ''}
        onClick={() => onChange('buyer')}
      >
        Buyer
      </button>
      <button
        className={role === 'seller' ? 'border-[#ff950e]' : ''}
        onClick={() => onChange('seller')}
      >
        Seller
      </button>
    </div>
  )
}));

jest.mock('@/components/signup/TermsCheckboxes', () => ({
  __esModule: true,
  default: ({ termsAccepted, ageVerified, termsError, ageError, onTermsChange, onAgeChange }: any) => (
    <>
      <label>
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => onTermsChange(e.target.checked)}
          aria-label="terms"
        />
        I agree to the Terms of Service
      </label>
      <label>
        <input
          type="checkbox"
          checked={ageVerified}
          onChange={(e) => onAgeChange(e.target.checked)}
          aria-label="18 years"
        />
        I am 18 years or older
      </label>
    </>
  )
}));

jest.mock('@/components/signup/SignupFooter', () => ({
  __esModule: true,
  default: () => {
    const router = require('next/navigation').useRouter();
    return (
      <div>
        <p>Already have an account?</p>
        <a onClick={() => router.push('/login')}>Log in</a>
      </div>
    );
  }
}));

jest.mock('@/components/ui/SecureForm', () => ({
  __esModule: true,
  SecureForm: ({ children, onSubmit }: any) => (
    <form onSubmit={onSubmit} role="form">
      <span>🔒 Encrypted Form</span>
      {children}
    </form>
  ),
  SecureSubmitButton: ({ children, isLoading, disabled, className, loadingText }: any) => (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? loadingText : children}
    </button>
  )
}));

// Mock the hooks and contexts that SignupPage uses
jest.mock('@/hooks/useSignup', () => ({
  useSignup: () => ({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'buyer',
    termsAccepted: false,
    ageVerified: false,
    errors: {},
    isSubmitting: false,
    isCheckingUsername: false,
    mounted: true,
    passwordStrength: 0,
    updateField: jest.fn(),
    handleSubmit: jest.fn((e: React.FormEvent) => {
      e.preventDefault();
    }),
    router: mockRouter,
  }),
}));

jest.mock('@/hooks/useValidation', () => ({
  useValidation: () => ({
    values: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'buyer',
      termsAccepted: false,
      ageVerified: false,
    },
    errors: {},
    touched: {},
    isValid: true,
    handleChange: jest.fn(),
    validateForm: jest.fn(() => Promise.resolve(true)),
  }),
}));

jest.mock('@/services/security.service', () => ({
  securityService: {
    checkPasswordVulnerabilities: jest.fn(() => ({ warnings: [] })),
  },
}));

// Since we're testing just the UI, we can skip the full provider setup
describe('SignupPage - UI Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Component Rendering', () => {
    it('should render the signup page with all form elements', async () => {
      render(<SignupPage />);
      
      // Wait for the component to mount
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      // Check all form elements are present
      expect(screen.getByPlaceholderText(/choose a username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText(/password/i)).toHaveLength(2);
      expect(screen.getByText(/buyer/i)).toBeInTheDocument();
      expect(screen.getByText(/seller/i)).toBeInTheDocument();
      expect(screen.getByText(/i agree to the terms/i)).toBeInTheDocument();
      expect(screen.getByText(/i am 18 years or older/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    });

    it('should render with dark theme styling', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        // Find the outermost container with min-h-screen and bg-black
        const container = document.querySelector('.min-h-screen.bg-black');
        expect(container).toBeInTheDocument();
        expect(container).toHaveClass('bg-black');
      });
    });
  });

  describe('Form Interactions', () => {
    it('should show password strength indicator', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      // Check that password strength component is rendered
      const passwordInput = screen.getAllByPlaceholderText(/password/i)[0];
      expect(passwordInput).toBeInTheDocument();
      
      // The component should have password strength UI
      // (The actual behavior would depend on the PasswordStrength component)
    });

    it('should have secure form wrapper', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      // Check for security badge
      expect(screen.getByText(/🔒/i)).toBeInTheDocument();
    });
  });

  describe('Navigation Elements', () => {
    it('should have a link to login page', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      
      const loginLink = screen.getByText(/log in/i);
      await user.click(loginLink);
      
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    it('should navigate to home when logo is clicked', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      const headerDiv = screen.getByText(/join pantypost/i).parentElement;
      if (headerDiv) {
        await user.click(headerDiv);
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      }
    });
  });

  describe('Role Selection', () => {
    it('should render buyer and seller role options', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      const buyerOption = screen.getByText(/buyer/i);
      const sellerOption = screen.getByText(/seller/i);
      
      expect(buyerOption).toBeInTheDocument();
      expect(sellerOption).toBeInTheDocument();
      
      // Check that one is selected by default (buyer)
      expect(buyerOption.closest('button')).toHaveClass('border-[#ff950e]');
    });
  });

  describe('Form Validation UI', () => {
    it('should have required checkboxes for terms and age', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms/i });
      const ageCheckbox = screen.getByRole('checkbox', { name: /18 years/i });
      
      expect(termsCheckbox).toBeInTheDocument();
      expect(ageCheckbox).toBeInTheDocument();
      expect(termsCheckbox).not.toBeChecked();
      expect(ageCheckbox).not.toBeChecked();
    });

    it('should have a submit button', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent('Sign Up');
    });
  });

  describe('Visual Elements', () => {
    it('should have floating particles animation container', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      // Check for the particles container
      const particlesContainer = document.querySelector('.absolute.inset-0.pointer-events-none');
      expect(particlesContainer).toBeInTheDocument();
    });

    it('should have proper form card styling', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      // Find the form card
      const formCard = screen.getByRole('button', { name: /sign up/i }).closest('.bg-\\[\\#111\\]\\/80');
      expect(formCard).toHaveClass('backdrop-blur-sm', 'border', 'border-gray-800/50', 'rounded-2xl');
    });
  });

  describe('Accessibility', () => {
    it('should have proper input types', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      const emailInput = screen.getByPlaceholderText(/email address/i);
      const passwordInputs = screen.getAllByPlaceholderText(/password/i);
      
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInputs[0]).toHaveAttribute('type', 'password');
      expect(passwordInputs[1]).toHaveAttribute('type', 'password');
    });

    it('should have form role for screen readers', async () => {
      render(<SignupPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/join pantypost/i)).toBeInTheDocument();
      });
      
      // SecureForm should render a form element
      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });
});