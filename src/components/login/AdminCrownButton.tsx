// src/components/login/AdminCrownButton.tsx
'use client';

import { Crown } from 'lucide-react';
import { AdminCrownButtonProps } from '@/types/login';

export default function AdminCrownButton({ showAdminMode, onToggle }: AdminCrownButtonProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={showAdminMode ? 'Disable admin mode' : 'Enable admin mode'}
      className={[
        'fixed bottom-4 right-4 w-10 h-10 rounded-full flex items-center justify-center',
        'transition-all duration-300 z-50',
        // Hover/active effects
        'hover:scale-110 active:scale-95',
        // Visual state
        showAdminMode
          ? 'bg-[#ff950e]/20 text-[#ff950e] border border-[#ff950e]/50 opacity-100 scale-100'
          : 'bg-black/50 text-gray-600 hover:text-gray-400 border border-gray-800 hover:border-gray-600 opacity-20 scale-75',
      ].join(' ')}
    >
      <Crown className="w-5 h-5" />
    </button>
  );
}
