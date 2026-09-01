// src/components/admin/OutreachPipeline.tsx
//
// The outreach pipeline: creators, managers and agencies we are
// pitching drops to, and a drafter that writes the email for each one.
//
// Prospects are added by hand, from contact addresses the person has
// published for business enquiries. That is deliberate and worth not
// "improving" later: a scraped list is unlawful to mail under the Spam
// Act, wrecks the sending reputation that our own verification emails
// depend on, and converts at a fraction of a researched approach. The
// personal note field is the whole trick -- one specific true thing
// about them is the difference between a reply and a delete.

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Users, Plus, Mail, Copy, Trash2, ExternalLink, Check, X, Loader2, AlertCircle,
} from 'lucide-react';
import { apiCall } from '@/services/api.config';

type Stage = 'to_contact' | 'contacted' | 'replied' | 'call_booked' | 'onboarding' | 'live' | 'passed';
type ProspectType = 'creator' | 'manager' | 'agency';

interface Prospect {
  _id: string;
  name: string;
  type: ProspectType;
  email?: string;
  handle?: string;
  profileUrl?: string;
  sourceUrl?: string;
  manages?: string;
  audienceSize?: string;
  personalNote?: string;
  stage: Stage;
  followUpCount?: number;
  notes?: string;
  createdAt: string;
}

const STAGES: { key: Stage; label: string }[] = [
  { key: 'to_contact', label: 'To contact' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'replied', label: 'Replied' },
  { key: 'call_booked', label: 'Call booked' },
  { key: 'onboarding', label: 'Onboarding' },
  { key: 'live', label: 'Live' },
  { key: 'passed', label: 'Passed' },
];

const EMPTY = {
  name: '', type: 'creator' as ProspectType, email: '', handle: '',
  profileUrl: '', sourceUrl: '', manages: '', audienceSize: '', personalNote: '',
};

export default function OutreachPipeline() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<Stage | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<{ id: string; subject: string; body: string; to: string; warning: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const query = stageFilter === 'all' ? '' : `?stage=${stageFilter}`;
      const res = await apiCall<any>(`/outreach${query}`);
      if (res.success && res.data) setProspects(res.data.prospects || []);
    } catch {
      /* leave the list as-is; a failed refresh should not blank the board */
    } finally {
      setLoading(false);
    }
  }, [stageFilter]);

  useEffect(() => { void load(); }, [load]);

  const addProspect = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await apiCall<any>('/outreach', { method: 'POST', body: JSON.stringify(form) });
      if (res.success) {
        setForm(EMPTY);
        setShowForm(false);
        void load();
      }
    } finally {
      setSaving(false);
    }
  };

  const setStage = async (id: string, stage: Stage) => {
    await apiCall<any>(`/outreach/${id}`, { method: 'PATCH', body: JSON.stringify({ stage }) });
    void load();
  };

  const remove = async (id: string) => {
    await apiCall<any>(`/outreach/${id}`, { method: 'DELETE' });
    void load();
  };

  const openDraft = async (p: Prospect) => {
    const res = await apiCall<any>(`/outreach/${p._id}/draft`);
    if (res.success && res.data) {
      setDraft({ id: p._id, ...res.data });
      setCopied(false);
    }
  };

  const copyDraft = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-8 rounded-lg border border-gray-800 bg-[#111] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-[#ff950e]/10 p-2">
            <Users className="h-4 w-4 text-[#ff950e]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Outreach pipeline</h2>
            <p className="text-xs text-gray-500">
              Creators, managers and agencies. Added by hand from published business contacts.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 rounded-md bg-[#ff950e] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add prospect
        </button>
      </div>

      {showForm && (
        <div className="mt-4 grid gap-3 rounded-md border border-gray-800 bg-black/40 p-4 sm:grid-cols-2">
          {[
            ['name', 'Name *'],
            ['email', 'Business email'],
            ['handle', 'Handle (@name)'],
            ['profileUrl', 'Profile URL'],
            ['manages', 'Manages / roster'],
            ['audienceSize', 'Audience size'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-gray-400">{label}</label>
              <input
                value={(form as any)[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-[#ff950e] focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs text-gray-400">Type</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value as ProspectType })}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm text-white focus:border-[#ff950e] focus:outline-none"
            >
              <option value="creator">Creator</option>
              <option value="manager">Manager</option>
              <option value="agency">Agency</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-gray-400">
              Personal note - one specific true thing about them
            </label>
            <input
              value={form.personalNote}
              onChange={e => setForm({ ...form, personalNote: e.target.value })}
              placeholder="e.g. already sells socks, or posts packing videos every Friday"
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#ff950e] focus:outline-none"
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={addProspect}
              disabled={saving || !form.name.trim()}
              className="rounded-md bg-[#ff950e] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(EMPTY); }}
              className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStageFilter('all')}
          className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
            stageFilter === 'all' ? 'border-[#ff950e] bg-[#ff950e] text-black' : 'border-gray-700 text-gray-300'
          }`}
        >
          All
        </button>
        {STAGES.map(s => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStageFilter(s.key)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
              stageFilter === s.key ? 'border-[#ff950e] bg-[#ff950e] text-black' : 'border-gray-700 text-gray-300'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#ff950e]" />
          </div>
        ) : prospects.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Nobody here yet. Add a creator or agency from their public contact page.
          </p>
        ) : (
          prospects.map(p => (
            <div key={p._id} className="rounded-md border border-gray-800 bg-black/40 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{p.name}</span>
                    <span className="rounded-sm border border-gray-700 px-1.5 py-0.5 text-[10px] uppercase text-gray-400">
                      {p.type}
                    </span>
                    {p.profileUrl && (
                      <a href={p.profileUrl} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-[#ff950e]">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  {p.email && <p className="mt-0.5 text-xs text-gray-400">{p.email}</p>}
                  {p.personalNote ? (
                    <p className="mt-1 text-xs text-gray-500">{p.personalNote}</p>
                  ) : (
                    <p className="mt-1 flex items-center gap-1 text-xs text-yellow-500/80">
                      <AlertCircle className="h-3 w-3" /> No personal note
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={p.stage}
                    onChange={e => setStage(p._id, e.target.value as Stage)}
                    className="rounded-md border border-gray-700 bg-black px-2 py-1.5 text-xs text-white"
                  >
                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => openDraft(p)}
                    title="Draft email"
                    className="rounded-md border border-gray-700 p-2 text-gray-300 hover:border-[#ff950e] hover:text-[#ff950e]"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p._id)}
                    title="Delete"
                    className="rounded-md border border-gray-700 p-2 text-gray-500 hover:border-red-500 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {draft && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setDraft(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-800 bg-[#111] p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Draft email</h3>
              <button type="button" onClick={() => setDraft(null)} className="text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {draft.warning && (
              <p className="mt-3 flex items-center gap-2 rounded-md border border-yellow-600/40 bg-yellow-600/10 px-3 py-2 text-xs text-yellow-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {draft.warning}
              </p>
            )}

            <div className="mt-3 space-y-2 text-sm">
              {draft.to && <p className="text-gray-400">To: <span className="text-white">{draft.to}</span></p>}
              <p className="text-gray-400">Subject: <span className="text-white">{draft.subject}</span></p>
            </div>

            <pre className="mt-3 whitespace-pre-wrap rounded-md border border-gray-800 bg-black/50 p-4 text-sm leading-relaxed text-gray-200">
{draft.body}
            </pre>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={copyDraft}
                className="flex items-center gap-2 rounded-md bg-[#ff950e] px-4 py-2 text-sm font-semibold text-black"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy email'}
              </button>
              <button
                type="button"
                onClick={() => { setStage(draft.id, 'contacted'); setDraft(null); }}
                className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-[#ff950e] hover:text-[#ff950e]"
              >
                Mark as contacted
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
