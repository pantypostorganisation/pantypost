// src/app/admin/approval/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  approvalService,
  ApprovalStatus,
  ContentType,
  ModeratedItem,
} from '@/services/approval.service';
import {
  CheckCircle2,
  CircleSlash,
  Clock3,
  FileText,
  Tag,
  UserCircle,
  Images,
  Image as ImageIcon,
} from 'lucide-react';

/* The three image kinds are one bucket here: an admin triaging a
   queue thinks "images", not "cover photos vs gallery images". */
type QueueFilter = 'all' | 'listing' | 'post' | 'images';

/** Visual treatment per content type, so reviewers can scan the queue. */
const TYPE_STYLES: Record<string, { border: string; bg: string; chip: string }> = {
  listing: {
    border: 'border-purple-500/30',
    bg: 'bg-gradient-to-br from-black via-[#0b0b0b] to-[#0f0717]',
    chip: 'border-purple-500/40 bg-purple-500/10 text-purple-100',
  },
  post: {
    border: 'border-sky-500/30',
    bg: 'bg-gradient-to-br from-black via-[#0b0b0b] to-[#07131f]',
    chip: 'border-sky-500/40 bg-sky-500/10 text-sky-100',
  },
  profile_pic: {
    border: 'border-amber-500/30',
    bg: 'bg-gradient-to-br from-black via-[#0b0b0b] to-[#1a1206]',
    chip: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
  },
  cover_photo: {
    border: 'border-rose-500/30',
    bg: 'bg-gradient-to-br from-black via-[#0b0b0b] to-[#1a0810]',
    chip: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
  },
  gallery_image: {
    border: 'border-emerald-500/30',
    bg: 'bg-gradient-to-br from-black via-[#0b0b0b] to-[#06170f]',
    chip: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
  },
};

function typeIcon(contentType: string) {
  switch (contentType) {
    case 'listing':
      return <Tag className="h-3.5 w-3.5" />;
    case 'post':
      return <FileText className="h-3.5 w-3.5" />;
    case 'profile_pic':
      return <UserCircle className="h-3.5 w-3.5" />;
    case 'cover_photo':
      return <ImageIcon className="h-3.5 w-3.5" />;
    case 'gallery_image':
      return <Images className="h-3.5 w-3.5" />;
    default:
      return <FileText className="h-3.5 w-3.5" />;
  }
}

function formatDate(value?: string | Date) {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

/** Posts have no price, so this returns null rather than a misleading $0.00. */
function formatPrice(item: ModeratedItem): string | null {
  if (item.contentType !== 'listing') return null;
  const base = item.auction?.startingPrice ?? item.price;
  if (base === undefined || base === null) return null;
  return `$${Number(base).toFixed(2)}`;
}

function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}

/* The header's approval badge polls every 60s and refreshes on window
   focus. Neither helps the admin who just approved something in this
   same window: focus never changes, so the number sits stale for up to a
   minute and looks broken.
   
   Approving or denying now announces itself, and the header refetches
   immediately. A DOM event rather than shared state because the two live
   in completely different trees, and rather than a websocket because
   this only ever needs to reach the tab the admin is already using. */
export const APPROVAL_COUNT_CHANGED = 'pantypost:approval-count-changed';

function announceApprovalChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(APPROVAL_COUNT_CHANGED));
}

export default function AdminApprovalPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [pendingItems, setPendingItems] = useState<ModeratedItem[]>([]);
  const [historyItems, setHistoryItems] = useState<ModeratedItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyFilter, setHistoryFilter] = useState<'all' | ApprovalStatus>('all');
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('all');
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Denial reasons are recorded per item and shown to the content owner.
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState('');

  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);

  /* Always fetches the FULL queue and filters in the browser. It used
     to ask the server for one content type, which meant the counts in
     the header were computed from an already-filtered list -- click
     "Listings" and the posts and images counts both dropped to zero.
     Fetching everything keeps every count honest and makes switching
     filters instant. */
  const loadPending = async () => {
    setLoadingPending(true);
    const response = await approvalService.getPendingItems();
    if (response.success && response.data) {
      setPendingItems(response.data);
    }
    setLoadingPending(false);
  };

  const loadHistory = async (page = historyPage, type = historyFilter) => {
    setLoadingHistory(true);
    const response = await approvalService.getHistory(page, type);
    if (response.success && response.data) {
      setHistoryItems(response.data.items || []);
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

  useEffect(() => {
    if (!isAdmin) return;
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueFilter]);

  const handleApprove = async (item: ModeratedItem) => {
    const id = item.id;
    setProcessingId(id);

    const response = await approvalService.approve(id, item.contentType);

    if (response.success) {
      setPendingItems(prev => prev.filter(i => i.id !== id));
      toast.success(
        `${item.contentLabel} approved`,
        `The ${item.contentLabel.toLowerCase()} is now publicly visible.`
      );
      announceApprovalChange();
      loadHistory();
    } else {
      toast.error('Action failed', 'Please try again.');
    }

    setProcessingId(null);
  };

  const handleDeny = async (item: ModeratedItem) => {
    const id = item.id;
    setProcessingId(id);

    const response = await approvalService.deny(
      id,
      item.contentType,
      denyReason.trim() || undefined
    );

    if (response.success) {
      setPendingItems(prev => prev.filter(i => i.id !== id));
      toast.success(
        `${item.contentLabel} denied`,
        'The author has been notified and it remains hidden.'
      );
      setDenyingId(null);
      setDenyReason('');
      announceApprovalChange();
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

  const renderImages = (item: ModeratedItem) => {
    const urls = (item.imageUrls || []).slice(0, 6).map(resolveImageUrl).filter(Boolean) as string[];
    if (urls.length === 0) return null;

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
        {urls.map((url, index) => (
          <div
            key={`${item.id}-img-${index}`}
            className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0f0f0f] aspect-square"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${item.displayTitle} — media ${index + 1}`}
              className="w-full h-full object-cover"
              onError={e => (e.currentTarget.src = '/placeholder-image.png')}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderPendingCard = (item: ModeratedItem) => {
    const isListing = item.contentType === 'listing';
    const isMedia =
      item.contentType === 'profile_pic' ||
      item.contentType === 'cover_photo' ||
      item.contentType === 'gallery_image';
    const price = formatPrice(item);
    const createdAt = item.createdAt || item.date;
    const isProcessing = processingId === item.id;
    const isDenying = denyingId === item.id;
    const bodyText = isListing ? item.description : item.content;
    const style = TYPE_STYLES[item.contentType] || TYPE_STYLES.listing;

    // Profile pictures and cover photos replace something already live,
    // so the reviewer is shown the current image beside the proposed one.
    // Gallery images are additive and have nothing to compare against.
    const isCover = item.contentType === 'cover_photo';
    const isReplaceableMedia = item.contentType === 'profile_pic' || isCover;
    const mediaNoun = isCover ? 'cover photo' : 'profile picture';
    const comparisonAspect = isCover ? 'aspect-[3/1]' : 'aspect-square';
    const comparisonColumns = isCover ? 'grid-cols-1' : 'grid-cols-2';

    return (
      <div
        key={`${item.contentType}-${item.id}`}
        className={`group relative overflow-hidden rounded-2xl border p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.6)] transition-all duration-300 hover:translate-y-[-2px] ${style.border} ${style.bg}`}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.chip}`}
                >
                  {typeIcon(item.contentType)}
                  {item.contentLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  <Clock3 className="h-3.5 w-3.5" /> {formatDate(createdAt)}
                </span>
              </div>

              <h3 className="mt-2 text-xl font-semibold text-white break-words">
                {item.displayTitle}
              </h3>
              <p className="text-sm text-gray-400">{item.owner}</p>
            </div>

            {price && (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-[#ff950e]">{price}</p>
                <p className="text-xs text-gray-400">Category · {item.tags?.[0] || 'General'}</p>
              </div>
            )}
          </div>

          {bodyText && (
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
              {bodyText}
            </p>
          )}

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              {item.tags.map(tag => (
                <span
                  key={`${item.id}-tag-${tag}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {isReplaceableMedia && item.previousImage ? (
            // A banner is wide and an avatar is square, so covers stack
            // vertically at 3:1 — squeezing one into a square frame would
            // crop away most of what the reviewer needs to see.
            <div className={`mt-3 grid gap-3 ${comparisonColumns}`}>
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-wider text-gray-500">
                  Current
                </p>
                <div
                  className={`relative overflow-hidden rounded-lg border border-white/10 bg-[#0f0f0f] ${comparisonAspect}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveImageUrl(item.previousImage)}
                    alt={`Current ${mediaNoun}`}
                    className="h-full w-full object-cover opacity-60"
                    onError={e => (e.currentTarget.src = '/placeholder-image.png')}
                  />
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs uppercase tracking-wider text-amber-300/80">
                  Proposed
                </p>
                <div
                  className={`relative overflow-hidden rounded-lg border border-amber-500/40 bg-[#0f0f0f] ${comparisonAspect}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveImageUrl(item.imageUrls?.[0])}
                    alt={`Proposed ${mediaNoun}`}
                    className="h-full w-full object-cover"
                    onError={e => (e.currentTarget.src = '/placeholder-image.png')}
                  />
                </div>
              </div>
            </div>
          ) : (
            renderImages(item)
          )}

          {/* Shows why something is back in the queue, e.g. after an edit */}
          {item.moderationNote && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
              {item.moderationNote}
            </p>
          )}

          {isDenying ? (
            <div className="space-y-2 pt-2">
              <label
                htmlFor={`deny-reason-${item.id}`}
                className="block text-xs font-medium uppercase tracking-wider text-gray-400"
              >
                Reason for denial (shown to the author)
              </label>
              <textarea
                id={`deny-reason-${item.id}`}
                value={denyReason}
                onChange={e => setDenyReason(e.target.value.slice(0, 500))}
                rows={2}
                maxLength={500}
                placeholder="e.g. Image does not meet content guidelines"
                className="w-full rounded-lg border border-white/10 bg-[#0b0b0f] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-red-400/60 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleDeny(item)}
                  disabled={isProcessing}
                  className="rounded-lg border border-red-500/60 bg-red-600/15 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? 'Processing...' : 'Confirm denial'}
                </button>
                <button
                  onClick={() => {
                    setDenyingId(null);
                    setDenyReason('');
                  }}
                  disabled={isProcessing}
                  className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:border-white/25 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="flex flex-col text-xs text-gray-400">
                <span>
                  {isListing ? 'Seller' : isMedia ? 'User' : 'Author'}:{' '}
                  <span className="text-white">{item.owner}</span>
                </span>
                <span>Submitted: {formatDate(createdAt)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setDenyingId(item.id);
                    setDenyReason('');
                  }}
                  disabled={isProcessing}
                  className="rounded-lg border border-red-500/60 bg-red-600/10 px-4 py-2 text-sm font-semibold text-red-200 shadow-[0_0_20px_rgba(248,113,113,0.35)] transition hover:-translate-y-0.5 hover:border-red-400/80 hover:bg-red-600/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Deny
                </button>
                <button
                  onClick={() => handleApprove(item)}
                  disabled={isProcessing}
                  className="rounded-lg border border-emerald-500/60 bg-emerald-600/10 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-[0_0_20px_rgba(52,211,153,0.35)] transition hover:-translate-y-0.5 hover:border-emerald-400/80 hover:bg-emerald-600/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isProcessing ? 'Processing...' : 'Approve'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryRow = (item: ModeratedItem) => {
    const isApproved = item.approvalStatus === 'approved';
    const isDenied = item.approvalStatus === 'denied';
    const createdAt = item.createdAt || item.date;

    return (
      <div
        key={`${item.contentType}-${item.id}`}
        className="grid grid-cols-1 gap-3 rounded-xl border border-white/5 bg-[#0b0b0f] p-4 sm:grid-cols-5 sm:items-center"
      >
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wider text-white/60">
              {item.contentLabel}
            </span>
          </div>
          <p className="text-sm font-semibold text-white break-words">{item.displayTitle}</p>
          <p className="text-xs text-gray-400">{item.owner}</p>
        </div>
        <div className="text-sm text-gray-300">{formatPrice(item) || '—'}</div>
        <div className="flex items-center gap-2 text-sm">
          {isApproved && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {isDenied && <CircleSlash className="h-4 w-4 text-red-400" />}
          <span className={isApproved ? 'text-emerald-300' : 'text-red-300'}>
            {isApproved ? 'Approved' : 'Denied'}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          <p>{isApproved ? formatDate(item.approvedAt) : formatDate(item.deniedAt)}</p>
          <p className="text-white/70">
            By {isApproved ? item.approvedBy || 'Admin' : item.deniedBy || 'Admin'}
          </p>
          {isDenied && item.denialReason && (
            <p className="mt-1 text-red-300/80 break-words">{item.denialReason}</p>
          )}
        </div>
        <div className="text-xs text-gray-400 sm:text-right">
          <p>Created {formatDate(createdAt)}</p>
        </div>
      </div>
    );
  };

  const isImage = (type: ContentType) =>
    type === 'profile_pic' || type === 'cover_photo' || type === 'gallery_image';

  const listingCount = pendingItems.filter(i => i.contentType === 'listing').length;
  const postCount = pendingItems.filter(i => i.contentType === 'post').length;
  const mediaCount = pendingItems.filter(i => isImage(i.contentType)).length;

  const visibleItems =
    queueFilter === 'all'
      ? pendingItems
      : pendingItems.filter(i =>
          queueFilter === 'images' ? isImage(i.contentType) : i.contentType === queueFilter
        );

  const queueTabs: { key: QueueFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: pendingItems.length },
    { key: 'listing', label: listingCount === 1 ? 'Listing' : 'Listings', count: listingCount },
    { key: 'post', label: postCount === 1 ? 'Post' : 'Posts', count: postCount },
    { key: 'images', label: mediaCount === 1 ? 'Image' : 'Images', count: mediaCount },
  ];

  return (
    <RequireAuth role="admin">
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <header className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Content Approvals</h1>
              <p className="text-sm text-gray-400">
                All listings and posts are reviewed here before they become publicly visible.
              </p>
            </div>

            {/* The queue is the filter. The breakdown used to be static
                text under a big number; making each count the control
                that filters to it removes a separate dropdown and one
                whole step from triage. */}
            <div className="rounded-lg border border-white/10 bg-[#0b0b0f] p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{pendingItems.length}</span>
                <span className="text-sm text-gray-400">
                  awaiting review
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {queueTabs.map(tab => {
                  const isActive = queueFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setQueueFilter(tab.key)}
                      aria-pressed={isActive}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive
                          ? 'border-[#ff950e] bg-[#ff950e] text-black'
                          : 'border-white/10 text-gray-300 hover:border-[#ff950e]/60 hover:text-white'
                      }`}
                    >
                      {tab.count} {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">Awaiting Review</h2>
              <button
                onClick={() => loadPending()}
                className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-gray-300 hover:border-[#ff950e]/60 hover:text-white"
              >
                Refresh
              </button>
            </div>

            {loadingPending ? (
              <div className="rounded-xl border border-white/5 bg-[#0b0b0f] p-6 text-center text-gray-400">
                Loading pending content...
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-[#0b0b0f] p-8 text-center text-gray-400">
                Nothing awaiting review. Enjoy the calm!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">{visibleItems.map(renderPendingCard)}</div>
            )}
          </section>

          <section className="mt-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xl font-semibold text-white">Decision History</div>
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
                  <span className="text-xs text-gray-400">
                    Page {historyPage} / {historyTotalPages}
                  </span>
                </div>
              </div>
            </div>

            {loadingHistory ? (
              <div className="rounded-xl border border-white/5 bg-[#0b0b0f] p-6 text-center text-gray-400">
                Loading history...
              </div>
            ) : historyItems.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-[#0b0b0f] p-8 text-center text-gray-400">
                No decisions recorded yet.
              </div>
            ) : (
              <div className="space-y-3">{historyItems.map(renderHistoryRow)}</div>
            )}
          </section>
        </div>
      </main>
    </RequireAuth>
  );
}
