// src/app/sellers/verify/page.tsx
//
// Seller verification is now Didit, and only Didit.
//
// This page used to collect a photo of the seller holding a written
// code plus front/back images of their ID, store those files on our
// own server, and wait for an admin to approve them by eye. That meant
// PantyPost held a folder of other people's identity documents -- the
// single most sensitive thing a marketplace can hold, and a liability
// with no upside once a real provider is in place.
//
// Didit already runs a live face check against a real document and
// returns a verdict. The backend now grants the seller badge on that
// verdict (see applySellerVerification in ageVerification.routes.js),
// so this page's only job is: show status, and hand off to Didit.
// No uploads, no admin queue, no documents on our disk.

'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BadgeCheck, Clock, XCircle, Loader2, ArrowRight, Lock } from 'lucide-react';
import BanCheck from '@/components/BanCheck';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/context/AuthContext';
import { apiCall } from '@/services/api.config';

type AgeStatus = 'not_started' | 'pending' | 'approved' | 'declined' | 'expired';

export default function SellerVerifyPage() {
  const router = useRouter();
  const { user, isAuthReady, refreshSession } = useAuth();

  const [status, setStatus] = useState<AgeStatus>('not_started');
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const response = await apiCall<any>('/age-verification/status');
      if (!mountedRef.current) return;
      if (response.success && response.data) {
        setStatus((response.data.status as AgeStatus) || 'not_started');
      }
    } catch (err) {
      if (mountedRef.current) setError('Could not load your verification status.');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthReady && user) loadStatus();
  }, [isAuthReady, user, loadStatus]);

  /* The user comes back from Didit in the same tab, so re-check on
     focus: the webhook usually lands before they do, and this turns a
     stale "pending" into the badge without a manual refresh. */
  useEffect(() => {
    const onFocus = () => {
      if (status === 'pending' || status === 'not_started') loadStatus();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [status, loadStatus]);

  const startVerification = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    try {
      const response = await apiCall<any>('/age-verification/start', { method: 'POST' });
      if (response.success && response.data) {
        if (response.data.alreadyVerified) {
          await refreshSession();
          setStatus('approved');
          setIsStarting(false);
          return;
        }
        if (response.data.sessionUrl) {
          window.location.href = response.data.sessionUrl;
          return;
        }
      }
      setError('Could not start verification. Please try again in a moment.');
      setIsStarting(false);
    } catch (err) {
      setError('Could not start verification. Please try again in a moment.');
      setIsStarting(false);
    }
  }, [refreshSession]);

  if (!isAuthReady || isLoading) {
    return (
      <BanCheck>
        <RequireAuth role="seller">
          <div className="flex min-h-screen items-center justify-center bg-black">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </RequireAuth>
      </BanCheck>
    );
  }

  const isVerified = status === 'approved' || user?.isVerified;

  return (
    <BanCheck>
      <RequireAuth role="seller">
        <main className="min-h-screen bg-black px-4 py-12 text-white">
          <div className="mx-auto max-w-2xl">
            {/* The header only exists for people who still have work to
                do. Once verified, the page is a confirmation, not a
                pitch -- repeating "Get verified" to a verified seller
                reads like the site forgot. */}
            {!isVerified && (
              <header className="mb-10 text-center">
                <h1 className="text-3xl font-bold">
                  {status === 'pending' ? 'Almost there' : 'Get verified'}
                </h1>
                <p className="mt-3 text-gray-400">
                  {status === 'pending'
                    ? 'Your check is with Didit now.'
                    : 'Verification is handled by Didit, an independent identity provider. It takes about a minute on your phone.'}
                </p>
              </header>
            )}

            {isVerified ? (
              <section className="flex flex-col items-center py-8 text-center">
                {/* No container: the badge IS the content. A card here
                    just draws a box around a full stop. */}
                <div className="relative">
                  <span
                    className="absolute inset-0 rounded-full bg-green-500/20 blur-2xl"
                    aria-hidden="true"
                  />
                  <BadgeCheck
                    className="relative h-20 w-20 text-green-400"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>

                <h1 className="mt-6 text-3xl font-bold">You are verified</h1>
                <p className="mt-3 max-w-md text-gray-400">
                  Your badge is live on your profile and every listing you post.
                </p>

                <div className="mt-8 flex w-full max-w-sm flex-col gap-3 text-left">
                  <div className="flex items-center gap-3 rounded-md border border-white/10 bg-surface-raised px-4 py-3">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-green-400" aria-hidden="true" />
                    <span className="text-sm text-gray-300">Verified badge active</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-md border border-white/10 bg-surface-raised px-4 py-3">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-green-400" aria-hidden="true" />
                    <span className="text-sm text-gray-300">25 listings unlocked</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/sellers/my-listings"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-semibold text-black transition-colors hover:bg-primary-hover"
                  >
                    Create a listing <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/sellers/profile"
                    className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    View profile
                  </Link>
                </div>
              </section>
            ) : status === 'pending' ? (
              <section className="rounded-lg border border-white/10 bg-surface-raised p-8 text-center">
                <Clock className="mx-auto h-12 w-12 text-primary" />
                <h2 className="mt-4 text-2xl font-bold">Check in progress</h2>
                <p className="mt-2 text-gray-300">
                  Didit is finishing your check. This usually takes a few seconds. This page updates
                  itself when the result arrives.
                </p>
                <button
                  type="button"
                  onClick={loadStatus}
                  className="mt-6 rounded-md border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Check again
                </button>
              </section>
            ) : (
              <section className="space-y-6">
                {status === 'declined' && (
                  <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                    <p className="text-sm text-gray-300">
                      Your last check was not approved. You can try again below - make sure your
                      document is fully in frame and well lit.
                    </p>
                  </div>
                )}
                {status === 'expired' && (
                  <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-surface-raised p-4">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm text-gray-300">
                      Your last verification link expired before it was finished. Start a new one
                      below.
                    </p>
                  </div>
                )}

                <div className="rounded-lg border border-white/10 bg-surface-raised p-6">
                  <h2 className="text-lg font-semibold">What verified sellers get</h2>
                  <ul className="mt-4 space-y-3 text-sm text-gray-300">
                    <li className="flex items-start gap-3">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      A verified badge on your profile and every listing
                    </li>
                    <li className="flex items-start gap-3">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Up to 25 live listings instead of 2
                    </li>
                    <li className="flex items-start gap-3">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      More buyer trust, which is what actually drives sales
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-white/10 bg-surface-raised p-6">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Lock className="h-4 w-4 text-primary" /> Your documents stay with Didit
                  </h2>
                  <p className="mt-3 text-sm text-gray-300">
                    You will scan your ID and take a quick live photo on Didit&apos;s own secure
                    page. Panty Post never receives or stores your identity document - we are only
                    told whether the check passed. See our{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      privacy policy
                    </Link>
                    .
                  </p>
                </div>

                {error && (
                  <p className="text-center text-sm text-red-400" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={startVerification}
                  disabled={isStarting}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-6 py-4 text-lg font-semibold text-black transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Opening Didit...
                    </>
                  ) : (
                    <>
                      Start verification <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  You must be 18 or over to sell on Panty Post.
                </p>
              </section>
            )}
          </div>
        </main>
      </RequireAuth>
    </BanCheck>
  );
}
