// src/app/admin/verification-requests/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useListings } from '@/context/ListingContext';
import RequireAuth from '@/components/RequireAuth';
import VerificationHeader from '@/components/admin/verification/VerificationHeader';
import VerificationSearch from '@/components/admin/verification/VerificationSearch';
import VerificationStats from '@/components/admin/verification/VerificationStats';
import VerificationList from '@/components/admin/verification/VerificationList';
import ReviewModal from '@/components/admin/verification/ReviewModal';
import { storageService } from '@/services';
import type { VerificationUser, SortOption, VerificationStats as StatsType } from '@/types/verification';

export default function AdminVerificationRequestsPage() {
  const { user } = useAuth();
  const { users, setVerificationStatus } = useListings();
  const [pending, setPending] = useState<VerificationUser[]>([]);
  const [selected, setSelected] = useState<VerificationUser | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Get pending verification requests
  useEffect(() => {
    const pendingUsers = Object.values(users).filter(
      (u) => u.verificationStatus === 'pending'
    ) as VerificationUser[];
    
    // Sort users based on selected sort method
    const sortedUsers = [...pendingUsers].sort((a: VerificationUser, b: VerificationUser) => {
      if (sortBy === 'newest') {
        return new Date(b.verificationRequestedAt || '0').getTime() - 
               new Date(a.verificationRequestedAt || '0').getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.verificationRequestedAt || '0').getTime() - 
               new Date(b.verificationRequestedAt || '0').getTime();
      } else if (sortBy === 'alphabetical') {
        return a.username.localeCompare(b.username);
      }
      return 0;
    });
    
    setPending(sortedUsers);
    setSelected(null);
  }, [users, sortBy]);

  // Filter users based on search term
  const filteredUsers = pending.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats: StatsType = {
    total: pending.length,
    today: pending.filter(u => {
      if (!u.verificationRequestedAt) return false;
      const requestDate = new Date(u.verificationRequestedAt);
      const today = new Date();
      return requestDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: pending.filter(u => {
      if (!u.verificationRequestedAt) return false;
      const requestDate = new Date(u.verificationRequestedAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return requestDate >= weekAgo;
    }).length,
    averageProcessingTime: 24 // This would be calculated from historical data
  };

  // Calculate time since request
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

  // Handle approval
  const handleApprove = async (username: string): Promise<void> => {
    setVerificationStatus(username, 'verified');
    
    // Add to resolved verifications (optional)
    const resolvedEntry = {
      id: `verification_${Date.now()}`,
      username,
      requestDate: users[username]?.verificationRequestedAt || new Date().toISOString(),
      resolvedDate: new Date().toISOString(),
      resolvedBy: user?.username || 'admin',
      status: 'approved' as const,
      verificationDocs: users[username]?.verificationDocs
    };
    
    const existingResolved = await storageService.getItem<any[]>('panty_resolved_verifications', []);
    existingResolved.push(resolvedEntry);
    await storageService.setItem('panty_resolved_verifications', existingResolved);
    
    setSelected(null);
  };

  // Handle rejection
  const handleReject = async (username: string, reason: string): Promise<void> => {
    setVerificationStatus(username, 'rejected', reason);
    
    // Add to resolved verifications (optional)
    const resolvedEntry = {
      id: `verification_${Date.now()}`,
      username,
      requestDate: users[username]?.verificationRequestedAt || new Date().toISOString(),
      resolvedDate: new Date().toISOString(),
      resolvedBy: user?.username || 'admin',
      status: 'rejected' as const,
      rejectionReason: reason,
      verificationDocs: users[username]?.verificationDocs
    };
    
    const existingResolved = await storageService.getItem<any[]>('panty_resolved_verifications', []);
    existingResolved.push(resolvedEntry);
    await storageService.setItem('panty_resolved_verifications', existingResolved);
    
    setSelected(null);
  };

  const refreshData = () => {
    // Force re-render by updating state
    setSortBy(prev => prev);
  };

  return (
    <RequireAuth role="admin">
      <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white">
        <VerificationHeader onRefresh={refreshData} />
        
        <VerificationSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortBy={sortBy}
          onSortChange={setSortBy}
          pendingCount={filteredUsers.length}
        />

        <VerificationStats stats={stats} />

        <VerificationList
          users={filteredUsers}
          searchTerm={searchTerm}
          onSelectUser={setSelected}
        />

        <ReviewModal
          user={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          getTimeAgo={getTimeAgo}
        />
      </div>
    </RequireAuth>
  );
}
