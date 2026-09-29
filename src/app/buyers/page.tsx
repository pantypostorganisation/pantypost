// src/app/buyers/page.tsx
'use client';

/* The buyer directory.
 *
 * Built because a seller said the quiet part out loud: between sales
 * there is nothing to do but wait. This does not fix that by itself,
 * but seeing who is around beats refreshing an empty orders page.
 *
 * Deliberately sparse. A buyer has no listings, no bio and usually no
 * picture -- there is no profile here, only presence and history. The
 * temptation is to pad it out; the honest version says what little
 * there is and lets the seller decide who to message.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { apiCall } from '@/services/api.config';
import { Search, Circle, Loader2, Users } from 'lucide-react';

type Buyer = {
  username: string;
  profilePic: string | null;
  isOnline: boolean;
  lastActive: string | null;
  memberSince: string | null;
  orderCount: number;
};

function timeAgo(value: string | null): string {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(value).toLocaleDateString();
}

function BuyersContent() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (pageNumber: number, term: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNumber), limit: '24' });
      if (term.trim()) params.set('search', term.trim());

      const response = await apiCall<any>(`/users/buyers?${params.toString()}`);
      if (response.success) {
        setBuyers(response.data.buyers || []);
        setTotalPages(response.data.totalPages || 1);
        setTotal(response.data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* Debounced, so typing a username does not fire a request per
     keystroke. */
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      void load(1, search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  useEffect(() => {
    if (page > 1) void load(page, search);
  }, [page, load, search]);

  return (
    <main className="min-h-screen bg-black px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-xl font-bold text-white">Buyers</h1>
          {total > 0 && (
            <span className="text-sm text-ink-muted">{total.toLocaleString()}</span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-ink-muted">
          Everyone currently buying on PantyPost. Message anyone who looks like a fit.
        </p>

        <div className="relative mt-5">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by username"
            aria-label="Search buyers"
            className="w-full rounded-md border border-line bg-black py-2.5 pl-9 pr-3 text-sm text-white placeholder-ink-faint focus:border-primary focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : buyers.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-faint">
            {search ? 'No buyers match that.' : 'No buyers to show yet.'}
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {buyers.map((buyer) => (
              <Link
                key={buyer.username}
                href={`/buyers/${buyer.username}`}
                className="flex items-center gap-3 rounded-md border border-line bg-surface-raised p-3.5 transition-colors hover:border-primary/50"
              >
                <div className="relative shrink-0">
                  {buyer.profilePic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={buyer.profilePic}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-sm font-semibold text-ink-muted">
                      {buyer.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {buyer.isOnline && (
                    <Circle
                      className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 fill-green-500 text-green-500"
                      aria-label="Online"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{buyer.username}</p>
                  {/* Presence, not purchase history. "No orders yet"
                      marked out the newest buyers as the least worth
                      messaging, which is backwards -- someone who has
                      just joined is exactly who a seller wants to
                      reach. Order count still shows on the profile,
                      where it answers a different question. */}
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {buyer.isOnline
                      ? 'Online now'
                      : buyer.lastActive
                        ? `Active ${timeAgo(buyer.lastActive)}`
                        : 'Not active recently'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-ink-faint">
              {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function BuyersPage() {
  return (
    <RequireAuth role="seller">
      <BuyersContent />
    </RequireAuth>
  );
}
