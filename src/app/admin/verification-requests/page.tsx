// src/app/admin/verification-requests/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import VerificationHeader from '@/components/admin/verification/VerificationHeader';
import VerificationSearch from '@/components/admin/verification/VerificationSearch';
import VerificationStats from '@/components/admin/verification/VerificationStats';
import VerificationList from '@/components/admin/verification/VerificationList';
import ReviewModal from '@/components/admin/verification/ReviewModal';
import ImageViewer from '@/components/admin/verification/ImageViewer';
import { verificationService } from '@/services/verification.service';
import type { PendingVerification, VerificationStats as StatsType } from '@/services/verification.service';
import type { VerificationUser, SortOption, ImageViewData } from '@/types/verification';
import { sanitizeStrict } from '@/utils/security/sanitization';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';

// Get backend URL from environment
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper to convert relative URL to absolute backend URL
const toAbsoluteUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  
  // If it's already an absolute URL or data URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  // If it starts with /, remove it to avoid double slashes
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${BACKEND_URL}${path}`;
};

// Convert PendingVerification to VerificationUser format for components
const convertToVerificationUser = (pv: PendingVerification): VerificationUser => {
  return {
    username: pv.userId?.username || 'Unknown',
    verificationStatus: 'pending', // Always pending from this endpoint
    verificationRequestedAt: pv.submittedAt,
    verificationDocs: {
      code: pv.verificationCode,
      codePhoto: toAbsoluteUrl(pv.documents?.codePhoto?.url),
      idFront: toAbsoluteUrl(pv.documents?.idFront?.url),
      idBack: toAbsoluteUrl(pv.documents?.idBack?.url),
      passport: toAbsoluteUrl(pv.documents?.passport?.url)
    }
  };
};

export default function AdminVerificationRequestsPage() {
  const { user, isAuthReady } = useAuth();
  const router = useRouter();
  
  // State
  const [pending, setPending] = useState<VerificationUser[]>([]);
  const [pendingMap, setPendingMap] = useState<Map<string, string>>(new Map()); // username -> verification ID
  const [selected, setSelected] = useState<VerificationUser | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('oldest');
  const [stats, setStats] = useState<StatsType>({
    total: 0,
    today: 0,
    thisWeek: 0,
    averageProcessingTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageViewer, setImageViewer] = useState<ImageViewData | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load verifications and stats
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load pending verifications
      const verResult = await verificationService.getPendingVerifications({
        sort: sortBy === 'alphabetical' ? 'oldest' : sortBy,
        limit: 100 // Get more for client-side filtering
      });

      console.log('[Admin] Verification result:', verResult);

      if (verResult.success && verResult.data) {
        const idMap = new Map<string, string>();
        
        // Handle different response structures
        let verifications: PendingVerification[] = [];
        
        // Check if data.data exists (paginated response)
        if (Array.isArray(verResult.data.data)) {
          verifications = verResult.data.data;
        } 
        // Check if data itself is an array (direct response)
        else if (Array.isArray(verResult.data)) {
          verifications = verResult.data as any;
        }
        // Handle unexpected structure
        else {
          console.warn('[Admin] Unexpected verification data structure:', verResult.data);
          verifications = [];
        }

        const converted = verifications.map(pv => {
          const user = convertToVerificationUser(pv);
          // Store the verification ID mapping
          idMap.set(user.username, pv._id);
          return user;
        });
        
        // Apply alphabetical sort if needed
        if (sortBy === 'alphabetical') {
          converted.sort((a, b) => a.username.localeCompare(b.username));
        }
        
        setPending(converted);
        setPendingMap(idMap);
      } else {
        console.error('[Admin] Failed to load verifications:', verResult.error);
        // Don't set error for empty results
        if (verResult.error?.message && verResult.error.message !== 'No pending verifications') {
          setError(verResult.error.message);
        }
      }

      // Load stats
      const statsResult = await verificationService.getVerificationStats();
      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (err) {
      console.error('Error loading verification data:', err);
      setError('Failed to load verification data');
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  // Initial load and auth check
  useEffect(() => {
    if (!isAuthReady) return;
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      router.push('/');
      return;
    }

    loadData();
  }, [isAuthReady, user, router, loadData]);

  // Handle search
  const handleSearchTermChange = (term: string) => {
    const sanitized = sanitizeStrict(term);
    setSearchTerm(sanitized);
  };

  // Filter users based on search
  const filteredUsers = pending.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate filtered stats
  const filteredStats: StatsType = {
    ...stats,
    total: filteredUsers.length
  };

  // Time ago helper
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

  // Handle approval
  const handleApprove = async (username: string): Promise<void> => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      console.log('[Admin] Approving verification for:', username);
      
      // Find the verification ID from our map
      const verificationId = pendingMap.get(username);
      if (!verificationId) {
        throw new Error('Verification ID not found');
      }

      // Call backend API
      const result = await verificationService.reviewVerification(
        verificationId,
        'approve'
      );

      if (result.success) {
        console.log('[Admin] Verification approved successfully');
        
        // Remove from pending list
        setPending(prev => prev.filter(p => p.username !== username));
        setSelected(null);
        
        // Reload data to refresh stats
        loadData();
      } else {
        throw new Error(result.error?.message || 'Failed to approve verification');
      }
    } catch (err) {
      console.error('[Admin] Error approving verification:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to approve verification'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle rejection
  const handleReject = async (username: string, reason: string): Promise<void> => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      console.log('[Admin] Rejecting verification for:', username);
      
      // Find the verification ID from our map
      const verificationId = pendingMap.get(username);
      if (!verificationId) {
        throw new Error('Verification ID not found');
      }

      // Call backend API
      const result = await verificationService.reviewVerification(
        verificationId,
        'reject',
        reason
      );

      if (result.success) {
        console.log('[Admin] Verification rejected successfully');
        
        // Remove from pending list
        setPending(prev => prev.filter(p => p.username !== username));
        setSelected(null);
        
        // Reload data to refresh stats
        loadData();
      } else {
        throw new Error(result.error?.message || 'Failed to reject verification');
      }
    } catch (err) {
      console.error('[Admin] Error rejecting verification:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to reject verification'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Refresh data
  const refreshData = () => {
    loadData();
  };

  // Handle image viewer
  const handleImageView = (imageData: ImageViewData) => {
    setImageViewer(imageData);
    setImageLoading(true);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageClose = () => {
    setImageViewer(null);
    setImageLoading(false);
  };

  // Loading state
  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#ff950e]" />
          <p className="text-gray-400">Loading verification requests...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] text-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error Loading Verifications</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 rounded-xl bg-[#ff950e] text-black font-semibold hover:bg-[#e88800] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <RequireAuth role="admin">
      <div className="relative min-h-screen bg-[#050505] text-gray-100">
        <VerificationHeader onRefresh={refreshData} />

        <main className="relative z-0 pb-16">
          <section className="pt-10 space-y-10">
            <VerificationSearch
              searchTerm={searchTerm}
              onSearchChange={handleSearchTermChange}
              sortBy={sortBy}
              onSortChange={setSortBy}
              pendingCount={filteredUsers.length}
            />

            <VerificationStats stats={filteredStats} />

            {filteredUsers.length === 0 ? (
              <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="rounded-2xl border border-white/5 bg-black/40 px-8 py-14 text-center">
                  <Shield className="w-14 h-14 text-white/20 mx-auto mb-4" />
                  <h3 className="text-2xl font-semibold text-white">No Pending Verifications</h3>
                  <p className="mt-3 text-sm text-gray-400">
                    {searchTerm
                      ? `No verification requests found matching "${searchTerm}"`
                      : 'Everything looks good — there are no verification requests awaiting review.'}
                  </p>
                </div>
              </div>
            ) : (
              <VerificationList
                users={filteredUsers}
                searchTerm={searchTerm}
                onSelectUser={setSelected}
              />
            )}
          </section>
        </main>

        {selected && (
          <ReviewModal
            user={selected}
            onClose={() => setSelected(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            getTimeAgo={getTimeAgo}
          />
        )}

        {imageViewer && (
          <ImageViewer
            imageData={imageViewer}
            isLoading={imageLoading}
            onClose={handleImageClose}
            onLoad={handleImageLoad}
          />
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] px-6 py-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#ff950e]" />
              <p className="text-sm text-gray-400">Processing verification...</p>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
