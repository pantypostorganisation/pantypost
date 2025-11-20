// src/components/admin/verification/VerificationList.tsx
'use client';

import { AlertCircle, Shield } from 'lucide-react';
import VerificationCard from './VerificationCard';
import type { VerificationListProps } from '@/types/verification';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function VerificationList({
  users,
  searchTerm,
  onSelectUser
}: VerificationListProps) {
  const getTimeAgo = (timestamp?: string): string => {
    if (!timestamp) return 'Unknown date';
    const requestDate = new Date(timestamp);
    const t = requestDate.getTime();
    if (!Number.isFinite(t)) return 'Unknown date';

    const now = Date.now();
    const diffInSeconds = Math.floor((now - t) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return requestDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!Array.isArray(users) || users.length === 0) {
    return (
      <section className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="rounded-2xl border border-white/5 bg-black/40 px-8 py-12 text-center">
          {searchTerm ? (
            <>
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-white/30" />
              <p className="text-sm text-white/60">
                No pending verification requests found for "
                <SecureMessageDisplay
                  content={searchTerm}
                  allowBasicFormatting={false}
                  className="inline"
                />
                "
              </p>
            </>
          ) : (
            <>
              <Shield className="mx-auto mb-4 h-12 w-12 text-white/30" />
              <p className="text-sm text-white/60">
                No pending verification requests at the moment
              </p>
            </>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6">
      <div className="space-y-3">
        {users.map((user) => (
          <VerificationCard
            key={user.username}
            user={user}
            onSelect={() => onSelectUser(user)}
            getTimeAgo={getTimeAgo}
          />
        ))}
      </div>
    </section>
  );
}
