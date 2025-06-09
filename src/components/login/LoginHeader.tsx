// src/components/login/LoginHeader.tsx
'use client';

import { LoginHeaderProps } from '@/types/login';

export default function LoginHeader({ step, showAdminMode, onLogoClick }: LoginHeaderProps) {
  return (
    <div className={`text-center transition-all duration-500 ${step === 1 ? 'mb-4' : 'mb-8'}`}>
      <div className={`flex justify-center ${step === 1 ? 'mb-3' : 'mb-6'}`}>
        <img 
          src="/logo.png" 
          alt="PantyPost" 
          className="object-contain drop-shadow-2xl transition-all duration-500 hover:drop-shadow-[0_0_20px_rgba(255,149,14,0.4)] cursor-pointer hover:scale-105 active:scale-95"
          style={{ width: '220px', height: '220px' }}
          onClick={onLogoClick}
        />
      </div>
      <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-gray-400 text-sm">Sign in to your PantyPost account</p>
      
      {/* Step Indicators */}
      <div className={`flex justify-center gap-2 ${step === 1 ? 'mt-3' : 'mt-6'}`}>
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-[#ff950e]' : 'bg-gray-600'}`} />
        <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-[#ff950e]' : 'bg-gray-600'}`} />
      </div>

      {/* Admin Mode Indicator */}
      {showAdminMode && (
        <div className="mt-4 text-xs text-[#ff950e] font-medium animate-pulse">
          🔐 Admin Mode Enabled
        </div>
      )}
    </div>
  );
}