// src/components/signup/RoleSelector.tsx
'use client';

import { User, ShoppingBag } from 'lucide-react';
import { RoleSelectorProps, UserRole } from '@/types/signup';

export default function RoleSelector({ role, error, onChange }: RoleSelectorProps) {
  const roles = [
    {
      value: 'buyer' as UserRole,
      label: 'Buyer',
      icon: ShoppingBag,
      description: 'Browse and purchase items'
    },
    {
      value: 'seller' as UserRole,
      label: 'Seller',
      icon: User,
      description: 'List and sell your items'
    }
  ];

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Select your role
      </label>
      <div className="grid grid-cols-2 gap-3">
        {roles.map((option) => {
          const Icon = option.icon;
          const isSelected = role === option.value;
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`p-3 rounded-lg border transition-all duration-200 text-left relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98] ${
                isSelected 
                  ? 'bg-[#ff950e]/10 border-[#ff950e] text-white'
                  : 'bg-black/50 border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-black/70'
              }`}
            >
              {/* Sheen Effect */}
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
              
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div className={`p-2 rounded-lg transition-colors ${
                  isSelected 
                    ? 'bg-[#ff950e] text-black' 
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}