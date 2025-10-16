// src/components/admin/verification/VerificationCard.tsx
'use client';

import { ChevronRight, Clock, Shield, Upload } from 'lucide-react';
import type { VerificationCardProps } from '@/types/verification';
import { SecureMessageDisplay } from '@/components/ui/SecureMessageDisplay';

export default function VerificationCard({
  user,
  onSelect,
  getTimeAgo
}: VerificationCardProps) {
  const hasAllDocs =
    !!user.verificationDocs &&
    !!user.verificationDocs.codePhoto &&
    (!!user.verificationDocs.idFront || !!user.verificationDocs.passport);

  return (
    <article
      onClick={onSelect}
      className="group relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff950e]/60 hover:shadow-[0_30px_60px_-45px_rgba(255,149,14,0.55)] focus:outline-none focus:ring-2 focus:ring-[#ff950e]/40"
      role="button"
      aria-label={`Open verification for ${user.username}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <Shield className="h-6 w-6 text-[#ff950e]" />
            <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border border-[#ff950e]/40 bg-[#ff950e]/20" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-[#ff950e]">
              <SecureMessageDisplay content={user.username} allowBasicFormatting={false} />
            </h3>
            <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
              <Clock className="h-4 w-4 text-white/35" />
              <span>Requested {getTimeAgo(user.verificationRequestedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] transition ${
              hasAllDocs
                ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                : 'border-amber-400/40 bg-amber-400/10 text-amber-200'
            }`}
          >
            <Upload className="h-4 w-4" />
            {hasAllDocs ? 'Docs Complete' : 'Docs Pending'}
          </span>
          <ChevronRight className="h-5 w-5 text-white/40 transition-colors group-hover:text-[#ff950e]" />
        </div>
      </div>
    </article>
  );
}
