// src/components/buyers/dashboard/DashboardHeader.tsx
'use client';

import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

// Updated props interface - removed balance
interface DashboardHeaderProps {
  username: string;
}

export default function DashboardHeader({ username }: DashboardHeaderProps) {
  return (
    <div className="mb-12">
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
    </div>
  );
}