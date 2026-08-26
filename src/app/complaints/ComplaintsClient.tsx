// src/app/complaints/ComplaintsClient.tsx
'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Shield, Search, Loader2 } from 'lucide-react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:5000';

const RESOLUTION_BUSINESS_DAYS = 5;

/**
 * Complaint categories shown to the public.
 *
 * The first two trigger immediate withdrawal of the content while we
 * investigate, which is stated plainly here so complainants know what
 * to expect.
 */
const COMPLAINT_TYPES = [
  {
    value: 'non_consensual_content',
    label: 'Content of me published without my consent',
    urgent: true,
  },
  {
    value: 'underage_content',
    label: 'Content that appears to involve a minor',
    urgent: true,
  },
  { value: 'illegal_content', label: 'Illegal content', urgent: false },
  { value: 'copyright', label: 'Copyright or intellectual property', urgent: false },
  { value: 'impersonation', label: 'Someone is impersonating me', urgent: false },
  { value: 'privacy', label: 'Privacy concern or personal data', urgent: false },
  { value: 'harassment', label: 'Harassment or abusive behaviour', urgent: false },
  { value: 'other', label: 'Something else', urgent: false },
];

const CONTENT_TYPES = [
  { value: 'listing', label: 'A listing' },
  { value: 'post', label: 'A post' },
  { value: 'profile', label: 'A profile' },
  { value: 'gallery_image', label: 'A gallery image' },
  { value: 'message', label: 'A message' },
  { value: 'other', label: 'Other / not sure' },
];

type Submitted = {
  referenceCode: string;
  dueBy: string;
  contentRemoved: boolean;
  message: string;
};

export default function ComplaintsPage() {
  const [complaintType, setComplaintType] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [contentType, setContentType] = useState('other');
  const [contentUrl, setContentUrl] = useState('');
  const [reportedUser, setReportedUser] = useState('');
  const [description, setDescription] = useState('');
  const [declaresDepicted, setDeclaresDepicted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Submitted | null>(null);

  // Reference lookup for people with no account
  const [lookupCode, setLookupCode] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const selectedType = COMPLAINT_TYPES.find(t => t.value === complaintType);
  const isUrgent = selectedType?.urgent === true;

  const handleSubmit = async () => {
    setError(null);

    if (!complaintType) return setError('Please choose what your complaint is about.');
    if (!email.trim()) return setError('Please provide an email address so we can respond.');
    if (description.trim().length < 20) {
      return setError('Please describe the issue in a little more detail (at least 20 characters).');
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/complaints/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintType,
          complainantEmail: email.trim(),
          complainantName: name.trim(),
          contentType,
          contentUrl: contentUrl.trim(),
          reportedUser: reportedUser.trim(),
          description: description.trim(),
          declaresDepicted,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'We could not record your complaint. Please email support@pantypost.com.');
        return;
      }

      setSubmitted({
        referenceCode: data.data.referenceCode,
        dueBy: data.data.dueBy,
        contentRemoved: data.data.contentRemoved,
        message: data.message,
      });
    } catch {
      setError(
        'We could not reach our servers. Please email support@pantypost.com so your complaint is not lost.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookup = async () => {
    setLookupError(null);
    setLookupResult(null);
    if (!lookupCode.trim()) return;

    setLookingUp(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/complaints/status/${encodeURIComponent(lookupCode.trim())}`
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        setLookupError(data.error || 'No complaint found with that reference.');
        return;
      }
      setLookupResult(data.data);
    } catch {
      setLookupError('Could not check that reference right now. Please try again shortly.');
    } finally {
      setLookingUp(false);
    }
  };

  // ---- Confirmation view ----
  if (submitted) {
    return (
      <main className="min-h-screen bg-black text-white px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-8">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-4" />
            <h1 className="text-2xl font-bold mb-3">Complaint received</h1>
            <p className="text-gray-300 mb-6">{submitted.message}</p>

            <div className="rounded-lg border border-white/10 bg-black/40 p-4 mb-6">
              <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">
                Your reference
              </p>
              <p className="text-2xl font-mono font-bold text-[#ff950e]">
                {submitted.referenceCode}
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Keep this. You can use it to check progress below without needing an account.
              </p>
            </div>

            {submitted.contentRemoved && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-6">
                <p className="text-sm text-amber-200">
                  The content you reported has already been withdrawn from public view while we
                  investigate.
                </p>
              </div>
            )}

            <p className="text-sm text-gray-400">
              We will investigate and respond to the email you provided within{' '}
              {RESOLUTION_BUSINESS_DAYS} business days
              {submitted.dueBy && ` (by ${new Date(submitted.dueBy).toLocaleDateString()})`}.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ---- Form ----
  return (
    <main className="min-h-screen bg-black text-white px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-sm border border-[#ff950e]/40 bg-[#ff950e]/10 px-3 py-1 text-xs font-semibold text-[#ff950e]">
            <Shield className="h-4 w-4" /> Complaints &amp; Content Removal
          </div>
          <h1 className="mt-3 text-3xl font-bold">Report content or make a complaint</h1>
          <p className="mt-3 text-gray-400 leading-relaxed">
            Anyone can use this form. You do not need an account, and you do not need to be a
            member of PantyPost. Every complaint is investigated and resolved within{' '}
            <strong className="text-white">{RESOLUTION_BUSINESS_DAYS} business days</strong>.
          </p>
          <p className="mt-3 text-gray-400 leading-relaxed">
            If you believe content showing you has been published without your consent, tell us
            below. We will remove it from public view immediately while we investigate.
          </p>
        </header>

        <div className="space-y-5 rounded-lg border border-white/10 bg-[#0b0b0f] p-6">
          {/* Category */}
          <div>
            <label htmlFor="complaintType" className="block text-sm font-medium mb-2">
              What is your complaint about? <span className="text-red-400">*</span>
            </label>
            <select
              id="complaintType"
              value={complaintType}
              onChange={e => {
                setComplaintType(e.target.value);
                const t = COMPLAINT_TYPES.find(x => x.value === e.target.value);
                if (t?.value === 'non_consensual_content') setDeclaresDepicted(true);
              }}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2.5 text-sm focus:border-[#ff950e] focus:outline-none"
            >
              <option value="">Please choose…</option>
              {COMPLAINT_TYPES.map(t => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {isUrgent && (
            <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              <p className="text-sm text-amber-100/90">
                This is treated as urgent. If you give us a link, the content will be withdrawn
                from public view as soon as you submit this form, before any review takes place.
              </p>
            </div>
          )}

          {/* Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Your email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2.5 text-sm placeholder:text-white/25 focus:border-[#ff950e] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Your name <span className="text-gray-500">(optional)</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2.5 text-sm focus:border-[#ff950e] focus:outline-none"
              />
            </div>
          </div>

          {/* Subject */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contentType" className="block text-sm font-medium mb-2">
                What are you reporting?
              </label>
              <select
                id="contentType"
                value={contentType}
                onChange={e => setContentType(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2.5 text-sm focus:border-[#ff950e] focus:outline-none"
              >
                {CONTENT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="reportedUser" className="block text-sm font-medium mb-2">
                Username involved <span className="text-gray-500">(if known)</span>
              </label>
              <input
                id="reportedUser"
                type="text"
                value={reportedUser}
                onChange={e => setReportedUser(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2.5 text-sm focus:border-[#ff950e] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contentUrl" className="block text-sm font-medium mb-2">
              Link to the content <span className="text-gray-500">(if you have one)</span>
            </label>
            <input
              id="contentUrl"
              type="url"
              value={contentUrl}
              onChange={e => setContentUrl(e.target.value)}
              placeholder="https://pantypost.com/..."
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2.5 text-sm placeholder:text-white/25 focus:border-[#ff950e] focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              A direct link helps us act faster, but is not required.
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Tell us what happened <span className="text-red-400">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 5000))}
              rows={5}
              className="w-full rounded-lg border border-white/10 bg-black/60 px-3 py-2.5 text-sm placeholder:text-white/25 focus:border-[#ff950e] focus:outline-none"
              placeholder="Please describe the issue as clearly as you can."
            />
            <p className="mt-1.5 text-xs text-gray-500">{description.length}/5000</p>
          </div>

          {/* Depiction declaration */}
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-black/40 p-4">
            <input
              type="checkbox"
              checked={declaresDepicted}
              onChange={e => setDeclaresDepicted(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#ff950e]"
            />
            <span className="text-sm text-gray-300">
              I am the person shown in this content, and it was published without my consent.
            </span>
          </label>

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ff950e] px-4 py-3 font-semibold text-black transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              'Submit complaint'
            )}
          </button>

          <p className="text-center text-xs text-gray-500">
            If this is an emergency or involves immediate danger, please contact your local
            authorities first.
          </p>
        </div>

        {/* Status lookup */}
        <section className="mt-10 rounded-lg border border-white/10 bg-[#0b0b0f] p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Search className="h-5 w-5 text-[#ff950e]" /> Check an existing complaint
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Enter the reference we gave you when you submitted.
          </p>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={lookupCode}
              onChange={e => setLookupCode(e.target.value.toUpperCase())}
              placeholder="PP-2026-XXXXXX"
              className="flex-1 rounded-lg border border-white/10 bg-black/60 px-3 py-2.5 font-mono text-sm placeholder:text-white/25 focus:border-[#ff950e] focus:outline-none"
            />
            <button
              onClick={handleLookup}
              disabled={lookingUp}
              className="rounded-lg border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:border-[#ff950e]/60 disabled:opacity-60"
            >
              {lookingUp ? 'Checking…' : 'Check'}
            </button>
          </div>

          {lookupError && <p className="mt-3 text-sm text-red-300">{lookupError}</p>}

          {lookupResult && (
            <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-4 text-sm">
              <p className="font-mono text-[#ff950e]">{lookupResult.referenceCode}</p>
              <p className="mt-2 text-gray-300">
                Status: <span className="text-white">{String(lookupResult.status).replace(/_/g, ' ')}</span>
              </p>
              <p className="mt-1 text-gray-400">
                Received: {new Date(lookupResult.receivedAt).toLocaleDateString()}
              </p>
              {lookupResult.resolvedAt ? (
                <p className="mt-1 text-emerald-300">
                  Resolved: {new Date(lookupResult.resolvedAt).toLocaleDateString()}
                </p>
              ) : (
                <p className="mt-1 text-gray-400">
                  Due by: {new Date(lookupResult.dueBy).toLocaleDateString()}
                </p>
              )}
              {lookupResult.resolutionSummary && (
                <p className="mt-3 border-t border-white/10 pt-3 text-gray-300">
                  {lookupResult.resolutionSummary}
                </p>
              )}
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-sm text-gray-500">
          You can also email us directly at{' '}
          <a href="mailto:support@pantypost.com" className="text-[#ff950e] hover:underline">
            support@pantypost.com
          </a>
        </p>
      </div>
    </main>
  );
}

