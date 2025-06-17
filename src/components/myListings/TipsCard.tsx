// src/components/myListings/TipsCard.tsx
'use client';

import Link from 'next/link';
import { LockIcon } from 'lucide-react';
import { TipsCardProps } from '@/types/myListings';

export default function TipsCard({ 
  title, 
  icon: Icon, 
  iconColor, 
  borderColor, 
  tips, 
  isVerified, 
  showVerifyLink 
}: TipsCardProps) {
  return (
    <div className={`bg-[#1a1a1a] p-6 sm:p-8 rounded-xl shadow-lg border ${borderColor}`}>
      <h2 className="text-2xl font-bold mb-5 text-white flex items-center gap-3">
        <Icon className={`${iconColor} w-6 h-6`} />
        {title}
      </h2>
      <ul className="space-y-4 text-gray-300 text-sm">
        {tips.map((tip, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className={`${iconColor} font-bold text-lg leading-none`}>•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
      {showVerifyLink && !isVerified && (
        <div className="mt-5 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <LockIcon className="text-yellow-500 w-5 h-5" />
            <p className="text-yellow-400 text-sm">
              <Link href="/sellers/verify" className="underline hover:text-yellow-300">Get verified</Link> to unlock auction listings!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}