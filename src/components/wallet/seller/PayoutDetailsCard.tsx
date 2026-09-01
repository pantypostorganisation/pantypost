// src/components/wallet/seller/PayoutDetailsCard.tsx
//
// Where a seller tells us to send their money.
//
// This exists because the withdrawal flow previously took an amount
// and nothing else -- the backend masked an account number that was
// never collected, so an approved withdrawal left an admin with a
// debited wallet and no idea where to transfer to.
//
// Only the last four digits come back from the server once saved. The
// full record is readable by an admin at the moment of paying and
// nowhere else.

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Landmark, Check, Loader2, AlertCircle } from 'lucide-react';
import { apiCall } from '@/services/api.config';

type Method = 'bank_au' | 'bank_intl' | 'paxum';

interface Masked {
  method: Method;
  accountName: string;
  summary: string;
  updatedAt: string;
}

export default function PayoutDetailsCard() {
  const [saved, setSaved] = useState<Masked | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const [method, setMethod] = useState<Method>('bank_au');
  const [form, setForm] = useState({
    accountName: '', bsb: '', accountNumber: '', iban: '', swift: '',
    bankName: '', bankAddress: '', country: '', walletEmail: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiCall<Masked | null>('/wallet/payout-details');
      if (res.success) {
        setSaved(res.data ?? null);
        if (res.data) setMethod(res.data.method);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await apiCall<Masked>('/wallet/payout-details', {
        method: 'PUT',
        body: JSON.stringify({ method, ...form }),
      });
      if (res.success && res.data) {
        setSaved(res.data);
        setEditing(false);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 3000);
        setForm({
          accountName: '', bsb: '', accountNumber: '', iban: '', swift: '',
          bankName: '', bankAddress: '', country: '', walletEmail: '',
        });
      } else {
        const message =
          typeof res.error === 'string' ? res.error : res.error?.message || 'Could not save details.';
        setError(message);
      }
    } catch {
      setError('Could not save details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form, label: string, placeholder = '') => (
    <div>
      <label className="mb-1 block text-xs text-ink-muted">{label}</label>
      <input
        value={form[key]}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-primary focus:outline-none"
      />
    </div>
  );

  return (
    <div className="rounded-lg border border-white/10 bg-surface-raised p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2">
            <Landmark className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Payout details</h3>
            <p className="text-xs text-ink-muted">Where we send your earnings.</p>
          </div>
        </div>
        {!editing && !loading && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-primary hover:text-primary"
          >
            {saved ? 'Update' : 'Add details'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      ) : editing ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs text-ink-muted">Payout method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as Method)}
              className="w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
            >
              <option value="bank_au">Australian bank account</option>
              <option value="bank_intl">International bank account</option>
              <option value="paxum">Paxum</option>
            </select>
          </div>

          {field('accountName', 'Name on the account')}

          {method === 'bank_au' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {field('bsb', 'BSB', '000-000')}
              {field('accountNumber', 'Account number')}
            </div>
          )}

          {method === 'bank_intl' && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {field('iban', 'IBAN or account number')}
                {field('swift', 'SWIFT / BIC')}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {field('bankName', 'Bank name')}
                {field('country', 'Bank country')}
              </div>
              {field('bankAddress', 'Bank address')}
            </>
          )}

          {method === 'paxum' && field('walletEmail', 'Paxum account email')}

          {error && (
            <p className="flex items-center gap-2 text-xs text-red-400" role="alert">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}

          <p className="text-xs text-ink-faint">
            Only the last four digits are shown back to you once saved. Payments are
            currently made by manual transfer while our payout provider is being set up.
          </p>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save details'}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setError(null); }}
              className="rounded-md border border-white/15 px-5 py-2 text-sm text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : saved ? (
        <div className="mt-4 rounded-md border border-white/10 bg-black/30 px-4 py-3">
          <p className="text-sm font-medium text-white">{saved.accountName}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{saved.summary}</p>
          {justSaved && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-green-400">
              <Check className="h-3.5 w-3.5" /> Saved
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 flex items-start gap-2 rounded-md border border-primary/25 bg-primary/5 px-4 py-3 text-xs text-ink-muted">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          Add your payout details so we can pay you. You will need these before you can
          request a withdrawal.
        </p>
      )}
    </div>
  );
}
