// src/components/AgeGate.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, Loader2, AlertTriangle, Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  ageVerificationService,
  AgeStatus,
  AGE_STATUS_COPY,
} from '@/services/ageVerification.service';

interface AgeGateProps {
  /** Content shown once the user is verified. */
  children: React.ReactNode;
  /**
   * When true, unverified users see the prompt instead of the content.
   * When false, they see the content with a dismissible banner — useful
   * while rolling out, so existing users are not locked out abruptly.
   */
  block?: boolean;
}

/**
 * Gates content behind age assurance.
 *
 * Regulators do not accept a self-declared checkbox, so this checks a
 * verdict issued by an independent provider. The selfie and any
 * document are handled entirely on the provider's hosted page — no
 * identity data passes through Panty Post.
 */
export default function AgeGate({ children, block = true }: AgeGateProps) {
  const { user, isAuthReady } = useAuth();

  const [status, setStatus] = useState<AgeStatus | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [providerAvailable, setProviderAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const response = await ageVerificationService.getStatus();

    if (response.success && response.data) {
      setStatus(response.data.status);
      setIsVerified(response.data.isVerified);
      setProviderAvailable(response.data.providerAvailable);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!isAuthReady) return;
    load();
  }, [isAuthReady, load]);

  const handleStart = async () => {
    setStarting(true);
    setError(null);

    const response = await ageVerificationService.start();

    if (response.success && response.data) {
      if (response.data.alreadyVerified) {
        setIsVerified(true);
        setStarting(false);
        return;
      }
      if (response.data.sessionUrl) {
        // Full redirect rather than a new tab: mobile browsers often
        // block popups, and the camera flow needs a real page.
        window.location.href = response.data.sessionUrl;
        return;
      }
    }

    setError(
      (response as any)?.error?.message ||
        'We could not start verification just now. Please try again shortly.'
    );
    setStarting(false);
  };

  // Not signed in, or auth still resolving — this component has nothing
  // to say. Route protection is handled elsewhere.
  if (!isAuthReady || !user) return <>{children}</>;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff950e]" />
      </div>
    );
  }

  if (isVerified) return <>{children}</>;

  // Provider unavailable: fail open with a notice rather than locking
  // everyone out of the site because of a configuration problem.
  if (!providerAvailable) {
    return (
      <>
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-center text-sm text-amber-200">
          Age verification is temporarily unavailable.
        </div>
        {children}
      </>
    );
  }

  const copy = status ? AGE_STATUS_COPY[status] : AGE_STATUS_COPY.not_started;

  // Soft mode: banner above the content.
  if (!block) {
    if (dismissed) return <>{children}</>;
    return (
      <>
        <div className="flex flex-wrap items-center justify-center gap-3 border-b border-[#ff950e]/30 bg-[#ff950e]/10 px-4 py-3 text-sm">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#ff950e]" />
          <span className="text-[#ffd9a0]">
            Please verify your age to continue using Panty Post.
          </span>
          <button
            onClick={handleStart}
            disabled={starting}
            className="rounded-md bg-[#ff950e] px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-primary-hover disabled:opacity-60"
          >
            {starting ? 'Starting…' : 'Verify now'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-gray-400 hover:text-white"
          >
            Later
          </button>
        </div>
        {children}
      </>
    );
  }

  // Blocking mode.
  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-white/10 bg-[#0b0b0f] p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-[#ff950e]/40 bg-[#ff950e]/10">
            <ShieldCheck className="h-7 w-7 text-[#ff950e]" />
          </div>

          <h1 className="text-2xl font-bold">{copy.title}</h1>
          <p className="mt-3 text-gray-400 leading-relaxed">{copy.body}</p>

          {status !== 'declined' && (
            <div className="mt-6 space-y-2.5 rounded-lg border border-white/5 bg-black/40 p-4 text-left text-sm text-gray-400">
              <p className="flex items-start gap-2.5">
                <Camera className="mt-0.5 h-4 w-4 shrink-0 text-[#ff950e]" />
                <span>A quick selfie is usually all that is needed — no document upload.</span>
              </p>
              <p className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#ff950e]" />
                <span>
                  The check is handled by an independent provider. Panty Post never sees or stores
                  your photo or documents.
                </span>
              </p>
            </div>
          )}

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-left text-sm text-red-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {status !== 'in_review' && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff950e] px-5 py-3 font-semibold text-black transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {starting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                </>
              ) : status === 'declined' || status === 'abandoned' || status === 'expired' ? (
                'Try again'
              ) : (
                'Verify my age'
              )}
            </button>
          )}

          <p className="mt-5 text-xs text-gray-600">
            Read our{' '}
            <a href="/age-verification" className="text-[#ff950e] hover:underline">
              Age Verification Policy
            </a>
            {' · '}
            <a href="/privacy" className="text-[#ff950e] hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

