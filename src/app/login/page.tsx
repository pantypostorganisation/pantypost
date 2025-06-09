// src/app/login/page.tsx
'use client';

import FloatingParticle from '@/components/login/FloatingParticle';
import LoginHeader from '@/components/login/LoginHeader';
import UsernameStep from '@/components/login/UsernameStep';
import RoleSelectionStep from '@/components/login/RoleSelectionStep';
import AdminCrownButton from '@/components/login/AdminCrownButton';
import LoginFooter from '@/components/login/LoginFooter';
import TrustIndicators from '@/components/login/TrustIndicators';
import { useLogin } from '@/hooks/useLogin';

export default function LoginPage() {
  const {
    // State
    username,
    role,
    error,
    isLoading,
    step,
    mounted,
    showAdminMode,
    roleOptions,
    
    // Actions
    updateState,
    handleLogin,
    handleUsernameSubmit,
    handleKeyPress,
    goBack,
    handleCrownClick,
    
    // Auth
    user,
    
    // Navigation
    router
  } = useLogin();

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#ff950e]/20 border-t-[#ff950e] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden relative">
      {/* Enhanced Floating Particles Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <FloatingParticle 
            key={i} 
            delay={0}
            index={i}
          />
        ))}
      </div>

      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black/50 pointer-events-none" />

      {/* Secret Admin Crown - Bottom Right */}
      <AdminCrownButton 
        showAdminMode={showAdminMode} 
        onToggle={handleCrownClick} 
      />

      {/* Main Content */}
      <div className={`relative z-10 flex items-center justify-center p-4 ${step === 1 ? 'min-h-[90vh] pt-4' : 'min-h-screen py-4'}`}>
        <div className="w-full max-w-md">
          {/* Header */}
          <LoginHeader 
            step={step} 
            showAdminMode={showAdminMode} 
            onLogoClick={() => router.push('/')} 
          />

          {/* Form Card */}
          <div className="bg-[#111]/80 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 shadow-xl transition-all duration-500">
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg transition-all duration-300">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Step Content */}
            <div className="transition-all duration-300">
              {step === 1 && (
                <UsernameStep
                  username={username}
                  error={error}
                  onUsernameChange={(value) => updateState({ username: value })}
                  onSubmit={handleUsernameSubmit}
                  onKeyPress={handleKeyPress}
                  isDisabled={!username.trim()}
                />
              )}

              {step === 2 && (
                <RoleSelectionStep
                  role={role}
                  error={error}
                  roleOptions={roleOptions}
                  onRoleSelect={(selectedRole) => updateState({ role: selectedRole })}
                  onBack={goBack}
                  onSubmit={handleLogin}
                  isLoading={isLoading}
                  hasUser={!!user}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <LoginFooter step={step} />

          {/* Trust Indicators */}
          <TrustIndicators />
        </div>
      </div>
    </div>
  );
}