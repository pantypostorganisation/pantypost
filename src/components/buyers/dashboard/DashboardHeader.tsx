// src/components/buyers/dashboard/DashboardHeader.tsx
'use client';

import Link from 'next/link';
import { Wallet, Plus } from 'lucide-react';
import { DashboardHeaderProps } from '@/types/dashboard';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function DashboardHeader({ username, balance }: DashboardHeaderProps) {
  return (
    <div className="mb-12">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, <SecureMessageDisplay 
              content={username}
              allowBasicFormatting={false}
              className="text-[#ff950e] inline"
            />!
          </h1>
          <p className="text-gray-400 text-lg">
            Here's an overview of your account activity
          </p>
        </div>
        
        {/* Wallet balance with integrated add funds button */}
        <div className="flex justify-end">
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg px-6 py-4 relative min-w-[200px]">
            {/* Add Funds Button - Small green circle in top-right */}
            <Link
              href="/wallet/buyer"
              className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-colors shadow-lg"
              title="Add Funds"
            >
              <Plus className="w-3 h-3 text-white" />
            </Link>
            
            {/* Wallet Balance Content */}
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-[#ff950e]" />
              <div>
                <p className="text-xs text-gray-400 leading-none">Balance</p>
                <p className="text-lg font-bold text-white leading-none">${balance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
