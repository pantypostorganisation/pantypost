// src/app/admin/approval/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { approvalService, ApprovalStatus } from '@/services/approval.service';
import { Listing } from '@/context/ListingContext';
import { CheckCircle2, CircleSlash, Clock3, ShieldCheck, Sparkles } from 'lucide-react';

function formatDate(value?: string | Date) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString();
}

function formatPrice(listing: Listing) {
  const base = listing.auction?.startingPrice ?? listing.price;
  if (!base) return '$0.00';
  return `$${Number(base).toFixed(2)}`;
}

export default function AdminApprovalPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [historyListings, setHistoryListings] = useState<Listing[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyFilter, setHistoryFilter] = useState<'all' | ApprovalStatus>('all');
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);

  const loadPending = async () => {
    setLoadingPending(true);
    const response = await approvalService.getPendingListings();
    if (response.success && response.data) {
      setPendingListings(response.data);
    }
    setLoadingPending(false);
  };

  const loadHistory = async (page = historyPage, type = historyFilter) => {
    setLoadingHistory(true);
    const response = await approvalService.getHistory(page, type);
    if (response.success && response.data) {
      setHistoryListings(response.data.listings || []);
      setHistoryPage(response.data.page || 1);
      setHistoryTotalPages(response.data.totalPages || 1);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadPending();
    loadHistory(1, historyFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadHistory(1, historyFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyFilter]);

  const handleDecision = async (listingId: string, decision: 'approve' | 'deny') => {
    setProcessingId(listingId);
    const action = decision === 'approve' ? approvalService.approveListing : approvalService.denyListing;
    const response = await action.call(approvalService, listingId);

    if (response.success) {
      setPendingListings(prev => prev.filter(listing => listing.id !== listingId && (listing as any)._id !== listingId));
      toast.success(
        decision === 'approve' ? 'Listing approved' : 'Listing denied',
        decision === 'approve'
          ? 'The listing is now live for buyers.'
          : 'The listing has been hidden until the seller updates it.'
      );
      loadHistory();
    } else {
      toast.error('Action failed', 'Please try again.');
    }

    setProcessingId(null);
  };

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Admin access required</h1>
          <p className="text-gray-400">You need admin permissions to view this page.</p>
        </div>
      </main>
    );
  }

  const renderImages = (listing: Listing) => {
    const firstImage =
      typeof listing.images?.[0] === 'string'
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/${listing.images[0]}`
        : listing.images?.[0]?.url;

    if (!firstImage) return null;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
        <div
          className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0f0f0f]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={firstImage}
            alt={listing.title}
            className="w-full h-full object-cover rounded-xl"
            onError={e => (e.currentTarget.src = '/placeholder-image.png')}
          />
        </div>
      </div>
    );
  };

  const renderPendingCard = (listing: Listing) => {
    const category = listing.tags?.[0] || 'General';
    const listingId = listing.id || (listing as any)._id;
    const createdAt = (listing as any).createdAt || listing.date;
    return (
      <div
        key={listingId}
        className="group relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-black via-[#0b0b0b] to-[#0f0717] p-5 shadow-[0_10px_40px_-15px_rgba(168,85,247,0.5)] transition-all duration-300 hover:translate-y-[-2px]"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-100">
                <Clock3 className="h-4 w-4" /> Pending since {formatDate(createdAt)}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">{listing.title}</h3>
              <p className="text-sm text-gray-400">{listing.seller}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#ff950e]">{formatPrice(listing)}</p>
              <p className="text-xs text-gray-400">Category · {category}</p>
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed">{listing.description}</p>

          <div className="flex flex-wrap gap-2 text-xs text-gray-400">
            {listing.tags?.map(tag => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80">
                {tag}
              </span>
            ))}
          </div>

          {renderImages(listing)}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <div className="flex flex-col text-xs text-gray-400">
              <span>Seller: <span className="text-white">{listing.seller}</span></span>
              <span>Uploaded: {formatDate(createdAt)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDecision(listingId, 'deny')}
                disabled={processingId === listingId}
                className="rounded-lg border border-red-500/60 bg-red-600/10 px-4 py-2 text-sm font-semibold text-red-200 shadow-[0_0_20px_rgba(248,113,113,0.35)] transition hover:-translate-y-0.5 hover:border-red-400/80 hover:bg-red-600/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processingId === listingId ? 'Processing...' : 'Deny'}
              </button>
              <button
                onClick={() => handleDecision(listingId, 'approve')}
                disabled={processingId === listingId}
                className="rounded-lg border border-emerald-500/60 bg-emerald-600/10 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.35)] transition hover:-translate-y-0.5 hover:border-emerald-400/80 hover:bg-emerald-600/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processingId === listingId ? 'Processing...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryRow = (listing: Listing) => {
    const status = listing.approvalStatus;
    const isApproved = status === 'approved';
    const isDenied = status === 'denied';
    const listingId = listing.id || (listing as any)._id;
    const createdAt = (listing as any).createdAt || listing.date;

    return (
      <div
        key={listingId}
        className="grid grid-cols-1 gap-3 rounded-xl border border-white/5 bg-[#0b0b0f] p-4 sm:grid-cols-5 sm:items-center"
      >
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">{listing.title}</p>
          <p className="text-xs text-gray-400">Seller · {listing.seller}</p>
        </div>
        <div className="text-sm text-gray-300">{formatPrice(listing)}</div>
        <div className="flex items-center gap-2 text-sm">
          {isApproved && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {isDenied && <CircleSlash className="h-4 w-4 text-red-400" />}
          <span className={isApproved ? 'text-emerald-300' : 'text-red-300'}>
            {isApproved ? 'Approved' : 'Denied'}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          <p>{isApproved ? formatDate(listing.approvedAt) : formatDate(listing.deniedAt)}</p>
          <p className="text-white/70">By {isApproved ? listing.approvedBy || 'Admin' : listing.deniedBy || 'Admin'}</p>
        </div>
        <div className="text-xs text-gray-400 sm:text-right">
          <p>Created {formatDate(createdAt)}</p>
        </div>
      </div>
    );
  };

  return (
    <RequireAuth role="admin">
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <header className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#ff950e]/40 bg-[#ff950e]/10 px-3 py-1 text-xs font-semibold text-[#ff950e]">
                <ShieldCheck className="h-4 w-4" /> Admin Control
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Listing Approvals</h1>
              <p className="text-sm text-gray-400">Review unverified seller listings, approve the good ones, and keep PantyPost clean.</p>
            </div>
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-100 shadow-[0_0_25px_rgba(168,85,247,0.3)]">
              <p className="font-semibold">Pending queue</p>
              <p className="text-2xl font-bold">{pendingListings.length}</p>
            </div>
          </header>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-white">
                <Sparkles className="h-5 w-5 text-[#ff950e]" /> Pending Listings
              </h2>
              <button
                onClick={loadPending}
                className="text-xs rounded-full border border-white/10 px-3 py-1 text-gray-300 hover:border-[#ff950e]/60 hover:text-white"
              >
                Refresh
              </button>
            </div>
            {loadingPending ? (
              <div className="rounded-xl border border-white/5 bg-[#0b0b0f] p-6 text-center text-gray-400">Loading pending listings...</div>
            ) : pendingListings.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-[#0b0b0f] p-8 text-center text-gray-400">
                No pending listings right now. Enjoy the calm!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingListings.map(renderPendingCard)}
              </div>
            )}
          </section>

          <section className="mt-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xl font-semibold text-white">
                <Clock3 className="h-5 w-5 text-[#ff950e]" /> History
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={historyFilter}
                  onChange={e => setHistoryFilter(e.target.value as 'all' | ApprovalStatus)}
                  className="rounded-lg border border-white/10 bg-[#0b0b0f] px-3 py-2 text-sm text-white focus:border-[#ff950e]/60 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => historyPage > 1 && loadHistory(historyPage - 1)}
                    disabled={historyPage <= 1}
                    className="rounded-lg border border-white/10 bg-[#0b0b0f] px-3 py-2 text-sm text-white transition hover:border-[#ff950e]/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => historyPage < historyTotalPages && loadHistory(historyPage + 1)}
                    disabled={historyPage >= historyTotalPages}
                    className="rounded-lg border border-white/10 bg-[#0b0b0f] px-3 py-2 text-sm text-white transition hover:border-[#ff950e]/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                  <span className="text-xs text-gray-400">Page {historyPage} / {historyTotalPages}</span>
                </div>
              </div>
            </div>

            {loadingHistory ? (
              <div className="rounded-xl border border-white/5 bg-[#0b0b0f] p-6 text-center text-gray-400">Loading history...</div>
            ) : historyListings.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-[#0b0b0f] p-8 text-center text-gray-400">No history yet.</div>
            ) : (
              <div className="space-y-3">
                {historyListings.map(renderHistoryRow)}
              </div>
            )}
          </section>
        </div>
      </main>
    </RequireAuth>
  );
}
