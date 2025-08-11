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
import { sanitizeStrict } from '@/utils/security/sanitization';
import { securityService } from '@/services/security.service';
import type { VerificationUser, SortOption, VerificationStats as StatsType } from '@/types/verification';

// Conservative mock/dev detector — avoids nuking legit data
const isMockString = (val?: string) => {
  if (!val) return false;
  const v = String(val).trim().toLowerCase();
  const patterns = [
    'spammer', 'scammer', 'troublemaker', 'oldbanner',
    'mock', 'sample', 'demo', 'test',
    'lorem', 'ipsum', 'john_doe', 'jane_doe'
  ];
  return patterns.some(p => v.includes(p));
};

export default function AdminVerificationRequestsPage() {
  const { user } = useAuth();
  const { users, setVerificationStatus } = useListings();
  const [pending, setPending] = useState<VerificationUser[]>([]);
  const [selected, setSelected] = useState<VerificationUser | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [avgProcessingHours, setAvgProcessingHours] = useState<number>(0);

  // Load average processing time from resolved verifications (hours)
  useEffect(() => {
    const loadAvg = async () => {
      try {
        const resolved = await storageService.getItem<any[]>('panty_resolved_verifications', []);
        const cleaned = (resolved || [])
          .filter((r) => !isMockString(r?.username))
          .filter((r) => r?.requestDate && r?.resolvedDate);

        if (!cleaned.length) {
          setAvgProcessingHours(0);
          return;
        }

        const diffs = cleaned
          .map((r) => {
            const start = new Date(r.requestDate).getTime();
            const end = new Date(r.resolvedDate).getTime();
            if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
              return (end - start) / (1000 * 60 * 60); // hours
            }
            return null;
          })
          .filter((h): h is number => h !== null);

        const avg = diffs.length ? (diffs.reduce((a, b) => a + b, 0) / diffs.length) : 0;
        // round to 1 decimal for UI friendliness
        setAvgProcessingHours(Math.round(avg * 10) / 10);
      } catch {
        setAvgProcessingHours(0);
      }
    };
    loadAvg();
  }, []);

  // Get pending verification requests (excluding obvious mock/dev users)
  useEffect(() => {
    const pendingUsers = (Object.values(users) as VerificationUser[])
      .filter((u) => u.verificationStatus === 'pending')
      .filter((u) => !isMockString(u.username));

    // Sort users based on selected sort method
    const sortedUsers = [...pendingUsers].sort((a: VerificationUser, b: VerificationUser) => {
      if (sortBy === 'newest') {
        return (
          new Date(b.verificationRequestedAt || '0').getTime() -
          new Date(a.verificationRequestedAt || '0').getTime()
        );
      } else if (sortBy === 'oldest') {
        return (
          new Date(a.verificationRequestedAt || '0').getTime() -
          new Date(b.verificationRequestedAt || '0').getTime()
        );
      } else if (sortBy === 'alphabetical') {
        return a.username.localeCompare(b.username);
      }
      return 0;
    });

    setPending(sortedUsers);
    setSelected(null);
  }, [users, sortBy]);

  // Handle search term change – use query sanitizer (keeps intent)
  const handleSearchTermChange = (term: string) => {
    const sanitizedTerm = securityService.sanitizeSearchQuery(term);
    setSearchTerm(sanitizedTerm);
  };

  // Filter users based on search term
  const filteredUsers = pending.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const stats: StatsType = {
    total: filteredUsers.length,
    today: filteredUsers.filter((u) => {
      const requestDate = new Date(u.verificationRequestedAt || '');
      const today = new Date();
      return requestDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: filteredUsers.filter((u) => {
      const requestDate = new Date(u.verificationRequestedAt || '');
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return requestDate >= weekAgo;
    }).length,
    averageProcessingTime: avgProcessingHours
  };

  // Time ago helper function
  const getTimeAgo = (timestamp?: string): string => {
    if (!timestamp) return 'Unknown';

    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 604800)}w ago`;
  };

  // Handle approval with sanitization + mock guard
  const handleApprove = async (username: string): Promise<void> => {
    const sanitizedUsername = sanitizeStrict(username);
    if (isMockString(sanitizedUsername)) {
      alert('Cannot approve a mock/demo user.');
      return;
    }

    setVerificationStatus(sanitizedUsername, 'verified');

    // Best-effort pull of the requesting record
    const srcUser =
      (users as Record<string, any>)[sanitizedUsername] ??
      (users as Record<string, any>)[username] ?? {};

    // Add to resolved verifications with sanitized data
    const resolvedEntry = {
      id: `verification_${Date.now()}`,
      username: sanitizedUsername,
      requestDate: srcUser?.verificationRequestedAt || new Date().toISOString(),
      resolvedDate: new Date().toISOString(),
      resolvedBy: sanitizeStrict(user?.username || 'admin'),
      status: 'approved' as const,
      verificationDocs: srcUser?.verificationDocs
    };

    const existingResolved = await storageService.getItem<any[]>('panty_resolved_verifications', []);
    const cleanedExisting = (existingResolved || []).filter((r) => !isMockString(r?.username));
    cleanedExisting.push(resolvedEntry);
    await storageService.setItem('panty_resolved_verifications', cleanedExisting);

    setSelected(null);
  };

  // Handle rejection with sanitization + mock guard
  const handleReject = async (username: string, reason: string): Promise<void> => {
    const sanitizedUsername = sanitizeStrict(username);
    const sanitizedReason = sanitizeStrict(reason);
    if (isMockString(sanitizedUsername)) {
      alert('Cannot reject a mock/demo user.');
      return;
    }

    setVerificationStatus(sanitizedUsername, 'rejected', sanitizedReason);

    const srcUser =
      (users as Record<string, any>)[sanitizedUsername] ??
      (users as Record<string, any>)[username] ?? {};

    // Add to resolved verifications with sanitized data
    const resolvedEntry = {
      id: `verification_${Date.now()}`,
      username: sanitizedUsername,
      requestDate: srcUser?.verificationRequestedAt || new Date().toISOString(),
      resolvedDate: new Date().toISOString(),
      resolvedBy: sanitizeStrict(user?.username || 'admin'),
      status: 'rejected' as const,
      rejectionReason: sanitizedReason,
      verificationDocs: srcUser?.verificationDocs
    };

    const existingResolved = await storageService.getItem<any[]>('panty_resolved_verifications', []);
    const cleanedExisting = (existingResolved || []).filter((r) => !isMockString(r?.username));
    cleanedExisting.push(resolvedEntry);
    await storageService.setItem('panty_resolved_verifications', cleanedExisting);

    setSelected(null);
  };

  const refreshData = () => {
    // Force re-run sorting without changing criteria
    setSortBy((prev) => prev);
  };

  return (
    <RequireAuth role="admin">
      <div className="min-h-screen bg-gradient-to-b from-black to-[#0a0a0a] text-white">
        <VerificationHeader onRefresh={refreshData} />

        <VerificationSearch
          searchTerm={searchTerm}
          onSearchChange={handleSearchTermChange}
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
