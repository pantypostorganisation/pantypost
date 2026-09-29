// src/app/buyers/[username]/page.tsx
'use client';

/* One buyer.
 *
 * There is not much here, and that is honest rather than unfinished.
 * A buyer has no listings, no reviews and rarely a picture -- what a
 * seller actually wants to know before messaging is whether this is a
 * real account that buys things, and that is presence plus order
 * count. Padding the page with invented sections would suggest we know
 * more about these people than we do.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import { apiCall } from '@/services/api.config';
import { ArrowLeft, Circle, Loader2, MessageCircle, ShoppingBag, Calendar } from 'lucide-react';

type Buyer = {
  username: string;
  profilePic: string | null;
  bio: string;
  isOnline: boolean;
  lastActive: string | null;
  memberSince: string | null;
  orderCount: number;
};

function BuyerContent() {
  const params = useParams();
  const router = useRouter();
  const username = String(params?.username || '');

  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiCall<any>(`/users/buyers/${encodeURIComponent(username)}`);
      if (response.success) {
        setBuyer(response.data);
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) void load();
  }, [username, load]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </main>
    );
  }

  if (notFound || !buyer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="text-center">
          <p className="text-white">No buyer with that username.</p>
          <button
            type="button"
            onClick={() => router.push('/buyers')}
            className="mt-4 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-primary-hover"
          >
            Back to buyers
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.push('/buyers')}
          className="-ml-1 flex items-center gap-1 rounded-sm p-1 text-sm text-ink-muted transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Buyers
        </button>

        <div className="mt-5 rounded-lg border border-line bg-surface-raised p-6">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              {buyer.profilePic ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={buyer.profilePic}
                  alt=""
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-xl font-semibold text-ink-muted">
                  {buyer.username.charAt(0).toUpperCase()}
                </div>
              )}
              {buyer.isOnline && (
                <Circle
                  className="absolute -bottom-0.5 -right-0.5 h-4 w-4 fill-green-500 text-green-500"
                  aria-label="Online"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-xl font-bold text-white">{buyer.username}</h1>
              <p className="mt-0.5 text-sm text-ink-muted">
                {buyer.isOnline ? 'Online now' : 'Buyer'}
              </p>
              {buyer.bio && (
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{buyer.bio}</p>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5">
            <div className="flex items-start gap-2.5">
              <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs text-ink-faint">Orders</p>
                <p className="mt-0.5 text-sm font-medium text-white">{buyer.orderCount}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs text-ink-faint">Member since</p>
                <p className="mt-0.5 text-sm font-medium text-white">
                  {buyer.memberSince
                    ? new Date(buyer.memberSince).toLocaleDateString(undefined, {
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/sellers/messages?thread=${buyer.username}`)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-semibold text-black transition-colors hover:bg-primary-hover"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Message {buyer.username}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function BuyerProfilePage() {
  return (
    <RequireAuth role="seller">
      <BuyerContent />
    </RequireAuth>
  );
}
