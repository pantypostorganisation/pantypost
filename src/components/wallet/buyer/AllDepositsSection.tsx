// src/components/wallet/buyer/AllDepositsSection.tsx
'use client';

/* =====================================================================
 * Deposit history: amount and date, nothing else.
 *
 * This used to be a full page section in its own right -- a 48px icon
 * tile, an "All Deposits" headline, a subtitle, a Refresh button, FOUR
 * stat cards (total / card / crypto / status), type filters, sort
 * controls, and then rows carrying status pills, payment method,
 * network, tx hash and an explorer link.
 *
 * It now lives inside a "Show recent transactions" disclosure that is
 * collapsed by default, so it does not need to introduce itself, and it
 * certainly does not need to summarise itself above itself. Crypto stats
 * were doubly redundant -- crypto deposits are gone from this page.
 *
 * Failed and pending deposits still show a small state label, because
 * "why is my money not there" is the one question this list has to be
 * able to answer.
 * ===================================================================== */

interface Deposit {
  id: string;
  type: 'card' | 'crypto';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'confirming';
  createdAt: string;
}

interface AllDepositsSectionProps {
  deposits: Deposit[];
  onRefresh: () => void;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  });
}

export default function AllDepositsSection({ deposits }: AllDepositsSectionProps) {
  const rows = [...(deposits || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (rows.length === 0) {
    return <p className="py-2 text-sm text-ink-faint">No deposits yet.</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {rows.map((deposit) => {
        const settled = deposit.status === 'completed';
        return (
          <li key={deposit.id} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-ink-muted">{formatDate(deposit.createdAt)}</span>

            <span className="flex items-center gap-3">
              {!settled ? (
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    deposit.status === 'failed' ? 'text-danger' : 'text-warning'
                  }`}
                >
                  {deposit.status === 'failed' ? 'Failed' : 'Pending'}
                </span>
              ) : null}
              <span
                className={`text-sm font-semibold tabular-nums ${
                  settled ? 'text-white' : 'text-ink-muted'
                }`}
              >
                ${deposit.amount.toFixed(2)}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
