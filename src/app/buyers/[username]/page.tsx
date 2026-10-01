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
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Circle, Loader2, MessageCircle, ShoppingBag, Calendar } from 'lucide-react';

type Buyer = {
  username: string;
  profilePic: string | null;
  bio: string;
  isOnline: boolean;
  lastActive: string | null;
  memberSince: string | null;
  orderCount: number;
  /* Returned only to moderators. A seller never sees these. */
  messagingRestrictedUntil?: string | null;
  messagingRestrictionReason?: string;
};

function BuyerContent() {
  const params = useParams();
  const router = useRouter();
  const username = String(params?.username || '');

  const { user } = useAuth();
  const canModerate = user?.role === 'admin' || user?.role === 'moderator';

  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [restricting, setRestricting] = useState(false);
  const [reason, setReason] = useState('');

  /* Mutes or unmutes this buyer.
     Hours as a number, 'permanent' for the ones who keep going, 0 to
     lift. Reloads after so the panel reflects what actually saved
     rather than what we assumed. */
  const setRestriction = useCallback(
    async (hours: number | 'permanent') => {
      if (!buyer) return;
      setRestricting(true);
      try {
        const response = await apiCall<any>(
          `/users/buyers/${encodeURIComponent(buyer.username)}/messaging-restriction`,
          { method: 'POST', body: JSON.stringify({ hours, reason }) }
        );
        if (response.success) {
          setReason('');
          await load();
        }
      } finally {
        setRestricting(false);
      }
    },
    [buyer, reason]
  );

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

        {/* Moderation.
            Separate card, below the profile, because it is a different
            job from reading about someone -- and because a destructive
            control sitting beside a Message button invites a mis-tap. */}
        {canModerate && (
          <div className="mt-4 rounded-lg border border-line bg-surface-raised p-6">
            <h2 className="text-sm font-semibold text-white">Moderation</h2>

            {buyer.messagingRestrictedUntil &&
            new Date(buyer.messagingRestrictedUntil).getTime() > Date.now() ? (
              <>
                <p className="mt-2 rounded-md border border-yellow-600/40 bg-yellow-600/10 px-3 py-2.5 text-xs leading-relaxed text-yellow-400">
                  Messaging restricted until{' '}
                  {new Date(buyer.messagingRestrictedUntil).getFullYear() > 2100
                    ? 'further notice'
                    : new Date(buyer.messagingRestrictedUntil).toLocaleString()}
                  {buyer.messagingRestrictionReason
                    ? ` — ${buyer.messagingRestrictionReason}`
                    : ''}
                </p>
                <button
                  type="button"
                  disabled={restricting}
                  onClick={() => void setRestriction(0)}
                  className="mt-3 w-full rounded-md border border-line py-2.5 text-sm font-medium text-ink transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  {restricting ? 'Working...' : 'Lift restriction'}
                </button>
              </>
            ) : (
              <>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                  Stops this user sending messages. They are told why and when it
                  lifts, which tends to change behaviour where silence does not.
                </p>

                <input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Reason (shown to the user)"
                  className="mt-3 w-full rounded-md border border-line bg-black px-3 py-2 text-sm text-white placeholder-ink-faint focus:border-primary focus:outline-none"
                />

                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {([
                    { label: '24 hours', hours: 24 as const },
                    { label: '7 days', hours: 168 as const },
                    { label: 'Permanent', hours: 'permanent' as const },
                  ]).map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      disabled={restricting}
                      onClick={() => void setRestriction(option.hours)}
                      className="rounded-md border border-line py-2 text-xs font-medium text-ink-muted transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-50"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function BuyerProfilePage() {
  return (
    // Moderators and admins too. Opening a buyer from the reports queue
    // bounced to the homepage before this, which is exactly when the
    // page is most needed.
    <RequireAuth role="seller" roles={['seller', 'admin', 'moderator']}>
      <BuyerContent />
    </RequireAuth>
  );
}


