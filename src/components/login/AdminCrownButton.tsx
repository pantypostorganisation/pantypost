// src/components/login/AdminCrownButton.tsx
'use client';

import { Crown } from 'lucide-react';
import { AdminCrownButtonProps } from '@/types/login';

export default function AdminCrownButton({ showAdminMode, onToggle }: AdminCrownButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`fixed bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 z-50 hover:scale-110 active:scale-95 ${
        showAdminMode 
          ? 'bg-[#ff950e]/20 text-[#ff950e] border border-[#ff950e]/50' 
          : 'bg-black/50 text-gray-600 hover:text-gray-400 border border-gray-800 hover:border-gray-600'
      }`}
      style={{
        opacity: showAdminMode ? 1 : 0.2,
        transform: showAdminMode ? 'scale(1)' : 'scale(0.7)'
      }}
    >
      <Crown className="w-5 h-5" />
    </button>
  );
}