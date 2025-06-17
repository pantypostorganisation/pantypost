// src/components/myListings/StatsCard.tsx
'use client';

import { StatsCardProps } from '@/types/myListings';

export default function StatsCard({ title, count, icon: Icon, iconColor, borderColor }: StatsCardProps) {
  return (
    <div className={`bg-[#1a1a1a] p-6 rounded-xl shadow-lg border ${borderColor}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-300">{title}</h3>
          <span className={`text-4xl font-bold ${iconColor === 'text-gray-600' ? 'text-white' : iconColor}`}>
            {count}
          </span>
        </div>
        <Icon className={`w-10 h-10 ${iconColor}`} />
      </div>
    </div>
  );
}