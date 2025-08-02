// src/app/reset-password/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import FloatingParticle from '@/components/login/FloatingParticle';
import { authService } from '@/services/auth.service';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  // State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenData, setTokenData] = useState<{ username: string; email: string } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Password strength calculator
  const calculatePasswordStrength = useCallback((password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
    return Math.min(strength, 100);
  }, []);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('No reset token provided');
        setTokenValid(false);
        return;
      }

      try {
        const response = await authService.verifyResetToken(token);
        if (response.success && response.data) {
          setTokenValid(true);
          setTokenData(response.data);
        } else {
          setError('Invalid or expired reset token');
          setTokenValid(false);
        }
      } catch (err) {
        setError('Invalid or expired reset token');
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword));
  }, [newPassword, calculatePasswordStrength]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Reset token is missing');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.resetPassword(token, newPassword);
      
      if (response.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(response.error?.message || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator color
  const getStrengthColor = () => {
    if (passwordStrength < 30) return 'bg-red-500';
    if (passwordStrength < 60) return 'bg-orange-500';
    if (passwordStrength < 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // If already reset successfully
  if (success) {
    return (
      <div className="min-h-screen bg-black overflow-hidden relative flex items-center justify-center">
        {/* Floating Particles Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 35 }).map((_, i) => (
            <FloatingParticle key={i} delay={0} index={i} />
          ))}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/50 pointer-events-none" />

        {/* Success Message */}
        <div className="relative z-10 bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8 shadow-xl max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Password Reset Successful!</h2>
          <p className="text-gray-400 mb-4">
            Your password has been reset successfully. You will be redirected to login shortly.
          </p>
          <Link href="/login" className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors">
            Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  // Main reset form
  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Floating Particles Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <FloatingParticle key={i} delay={0} index={i} />
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/50 pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/logo.png" 
                alt="PantyPost" 
                className="object-contain drop-shadow-2xl transition-all duration-500 hover:drop-shadow-[0_0_20px_rgba(255,149,14,0.4)] cursor-pointer hover:scale-105 active:scale-95"
                style={{ width: '180px', height: '180px' }}
                onClick={() => router.push('/')}
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Reset Your Password</h1>
            {tokenValid && tokenData && (
              <p className="text-gray-400 text-sm">
                Enter a new password for <span className="text-[#ff950e]">{tokenData.username}</span>
              </p>
            )}
          </div>

          {/* Form Card */}
          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 shadow-xl">
            {tokenValid === false ? (
              // Invalid token message
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Invalid or Expired Link</h3>
                <p className="text-gray-400 mb-6">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
                <Link 
                  href="/login" 
                  className="text-[#ff950e] hover:text-[#ff6b00] font-medium transition-colors"
                >
                  Back to Login
                </Link>
              </div>
            ) : tokenValid === null ? (
              // Loading state
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-[#ff950e]/20 border-t-[#ff950e] rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Verifying reset link...</p>
              </div>
            ) : (
              // Reset form
              <form onSubmit={handleSubmit}>
                {/* Error display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-sm text-red-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                {/* New Password Field */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                          style={{ width: `${passwordStrength}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Password strength: {passwordStrength < 30 ? 'Weak' : passwordStrength < 60 ? 'Fair' : passwordStrength < 80 ? 'Good' : 'Strong'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-3 bg-black/50 backdrop-blur-sm border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ff950e] focus:ring-1 focus:ring-[#ff950e] transition-colors"
                    disabled={isLoading}
                  />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="w-full bg-gradient-to-r from-[#ff950e] to-[#ff6b00] hover:from-[#ff6b00] hover:to-[#ff950e] disabled:from-gray-700 disabled:to-gray-600 text-black disabled:text-gray-400 font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={{ color: isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword ? undefined : '#000' }}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Reset Password
                    </>
                  )}
                </button>

                {/* Back to Login Link */}
                <div className="text-center mt-6">
                  <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-600 transition-all duration-500">
            <span>🔒 Secure</span>
            <span>🛡️ Encrypted</span>
            <span>✓ Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}