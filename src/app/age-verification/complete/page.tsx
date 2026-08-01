// src/app/age-verification/complete/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, Clock3 } from 'lucide-react';
import {
  ageVerificationService,
  AgeStatus,
  AGE_STATUS_COPY,
} from '@/services/ageVerification.service';

/**
 * Where the provider sends the user after they finish.
 *
 * The verdict normally arrives by webhook within a second or two, but
 * the user can land here first. So we poll briefly rather than showing
 * a result we do not yet have — and give up gracefully rather than
 * spinning forever.
 */
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 10; // ~20 seconds

export default function AgeVerificationCompletePage() {
  const router = useRouter();
  const [status, setStatus] = useState<AgeStatus | null>(null);
  const [checking, setChecking] = useState(true);
  const [timedOut, setTimedOut] = useState(false);
  const pollCount = useRef(0);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;

    const check = async () => {
      if (cancelled.current) return;

      // refresh() asks the provider directly, so a delayed webhook
      // does not leave the user staring at a spinner.
      const response = await ageVerificationService.refresh();

      if (cancelled.current) return;

      if (response.success && response.data) {
        const s = response.data.status;
        setStatus(s);

        // Terminal states — stop polling.
        if (['approved', 'declined', 'abandoned', 'expired', 'in_review'].includes(s)) {
          setChecking(false);
          if (s === 'approved') {
            // Brief pause so the confirmation is actually seen.
            setTimeout(() => {
              if (!cancelled.current) router.push('/browse');
            }, 2500);
          }
          return;
        }
      }

      pollCount.current += 1;
      if (pollCount.current >= MAX_POLLS) {
        setChecking(false);
        setTimedOut(true);
        return;
      }

      setTimeout(check, POLL_INTERVAL_MS);
    };

    check();

    return () => {
      cancelled.current = true;
    };
  }, [router]);

  const copy = status ? AGE_STATUS_COPY[status] : null;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {checking && (
          <>
            <Loader2 className="mx-auto mb-5 h-12 w-12 animate-spin text-[#ff950e]" />
            <h1 className="text-2xl font-bold">Checking your result…</h1>
            <p className="mt-2 text-gray-400">This usually takes a few seconds.</p>
          </>
        )}

        {!checking && status === 'approved' && (
          <>
            <CheckCircle2 className="mx-auto mb-5 h-14 w-14 text-emerald-400" />
            <h1 className="text-2xl font-bold">{copy?.title}</h1>
            <p className="mt-2 text-gray-400">{copy?.body}</p>
            <p className="mt-6 text-sm text-gray-500">Taking you back…</p>
          </>
        )}

        {!checking && status === 'declined' && (
          <>
            <XCircle className="mx-auto mb-5 h-14 w-14 text-red-400" />
            <h1 className="text-2xl font-bold">{copy?.title}</h1>
            <p className="mt-2 text-gray-400">{copy?.body}</p>
            <div className="mt-7 flex flex-col gap-3">
              <Link
                href="/age-verification/start"
                className="rounded-lg bg-[#ff950e] px-5 py-3 font-semibold text-black transition hover:bg-[#e88800]"
              >
                Try again
              </Link>
              <a
                href="mailto:support@pantypost.com"
                className="text-sm text-gray-400 hover:text-white"
              >
                Contact support
              </a>
            </div>
          </>
        )}

        {!checking && (status === 'in_review') && (
          <>
            <Clock3 className="mx-auto mb-5 h-14 w-14 text-amber-400" />
            <h1 className="text-2xl font-bold">{copy?.title}</h1>
            <p className="mt-2 text-gray-400">{copy?.body}</p>
            <p className="mt-4 text-sm text-gray-500">
              We will email you as soon as it is resolved.
            </p>
          </>
        )}

        {!checking && (status === 'abandoned' || status === 'expired') && (
          <>
            <XCircle className="mx-auto mb-5 h-14 w-14 text-gray-500" />
            <h1 className="text-2xl font-bold">{copy?.title}</h1>
            <p className="mt-2 text-gray-400">{copy?.body}</p>
            <Link
              href="/age-verification/start"
              className="mt-7 inline-block rounded-lg bg-[#ff950e] px-5 py-3 font-semibold text-black transition hover:bg-[#e88800]"
            >
              Start again
            </Link>
          </>
        )}

        {!checking && timedOut && (
          <>
            <Clock3 className="mx-auto mb-5 h-14 w-14 text-gray-500" />
            <h1 className="text-2xl font-bold">Still processing</h1>
            <p className="mt-2 text-gray-400">
              Your result is taking longer than usual. It will update automatically — you can
              safely carry on and check back shortly.
            </p>
            <Link
              href="/browse"
              className="mt-7 inline-block rounded-lg border border-white/15 bg-white/5 px-5 py-3 font-medium transition hover:border-[#ff950e]/60"
            >
              Continue
            </Link>
          </>
        )}
      </div>
    </main>
  );
}