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
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - requestDate.getTime()) / 1000);

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

    if (users.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="bg-[#0e0e0e] border border-[#222] rounded-xl p-8 text-center">
                    {searchTerm ? (
                        <>
                            <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400">
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
                            <Shield className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400">
                                No pending verification requests at the moment
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="space-y-4">
                {users.map((user) => (
                    <VerificationCard
                        key={user.username}
                        user={user}
                        onSelect={() => onSelectUser(user)}
                        getTimeAgo={getTimeAgo}
                    />
                ))}
            </div>
        </div>
    );
}
