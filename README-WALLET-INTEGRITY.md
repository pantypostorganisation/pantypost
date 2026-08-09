# Wallet integrity fixes — audit findings #1 and #2

Four files. Backend only. Fixes the two criticals from the wallet audit:
the non-atomic balance race (double-withdraw / lost updates) and crypto
double-crediting.

**This SUPERSEDES `pantypost-wallet-fix.zip`.** `wallet.routes.js` here
already contains that batch's changes (direct-deposit flag gate +
removal of the hardcoded webhook-key fallback) PLUS the new atomic and
idempotency work. Applying this is correct whether or not you deployed
the earlier wallet-fix.

Extract into the repo root so `pantypost-backend/` merges; Replace all.

## Files

| File | Change |
|---|---|
| `models/Wallet.js` | **NEW** atomic statics `creditAtomic` / `debitIfFunds` (single-op `$inc` with a `$gte` guard). Old instance methods kept for now (order/drop still call them). |
| `routes/wallet.routes.js` | `/withdraw`, `/deposit`, `/deposit/system`, `/admin-actions`, `/admin-withdraw` converted to the atomic statics. `/deposit/system` also gets an **idempotency guard** (refuses a txId/orderId already credited). Includes the prior wallet-fix changes. |
| `services/cryptoMonitor.js` | `autoVerifyDeposit` now refuses an already-`completed` deposit (durable status guard — the in-memory `processedTxs` Set is wiped on every restart) and credits atomically. |


## What each fix does

**#1 Atomic balance.** `debitIfFunds(username, amount)` runs the balance
check and the deduction as ONE database update:
`findOneAndUpdate({ username, balance: { $gte: amount } }, { $inc: { balance: -amount } })`.
Mongo serialises it, so two concurrent withdrawals can't both pass — the
loser matches nothing and returns null (→ clean decline), instead of
creating a second payout against the same funds. Same pattern we used for
the drop unit-claim. `creditAtomic` is the deposit side.

**#2 Crypto idempotency.** Two independent guards, because the double
can arrive two ways:
- The webhook (`/deposit/system`): before crediting, it looks up a
  completed deposit transaction for this `txId`/`orderId` and, if found,
  returns 200 `{ duplicate: true }` WITHOUT crediting — so NOWPayments'
  retries (which repeat until they get a 200) stop without double-paying.
- The monitor (`autoVerifyDeposit`): re-reads the deposit and skips if it
  is already `completed`, so a block re-scan after a restart is a no-op.

## Deploy (backend only)

```
cd /var/www/pantypost/pantypost-backend
git pull origin main
pm2 restart pantypost-api
pm2 logs pantypost-api --lines 20
```
(You'll still see the direct-deposits flag line from the prior fix — make
sure `ENABLE_DIRECT_DEPOSITS=true` is in `.env` if you want to keep
funding test buyers, and OUT for production.)

## Verify

```
npx tsc --noEmit   # (frontend unaffected, but run it — nothing should change)
```

Then, with two test accounts / two browser windows:
- **Double-withdraw:** get a seller balance to exactly $X. Fire two
  withdrawals of $X at once (two tabs, submit together). Exactly one
  should succeed; the other returns "Insufficient balance". Before this
  fix, both created pending payouts.
- **Normal deposit / withdrawal / admin credit** all still work and the
  balance and transaction history agree.
- **Crypto (if wired):** a duplicate webhook for the same txId credits
  once; the response to the second is `{ duplicate: true }`.

## Stage (never git add -A)

```
git add pantypost-backend/models/Wallet.js pantypost-backend/routes/wallet.routes.js pantypost-backend/services/cryptoMonitor.js
git commit -m "Wallet: atomic balance ops (no double-spend/lost-update) + crypto deposit idempotency"
```

## Recommended next (not in this batch, on purpose)

1. **Convert the order/drop routes' wallet moves** (`order.routes.js`
   buyer/seller/platform/referrer credits and the buyer debit) to these
   same atomic statics, then delete the old instance methods. Left out
   here to keep this diff reviewable and avoid re-touching the just-
   deployed purchase flow in the same batch.
2. **Add a unique index** on the crypto dedup key once you've confirmed
   `db.cryptodeposits` and the deposit transactions have no existing
   duplicate txIds (a unique index that fails to build on dirty data
   silently won't protect you). That gives a DB-level backstop under the
   application guard.
3. **Withdrawal refund-on-cancel** (audit #3): confirm a rejected/
   cancelled pending withdrawal credits the balance back. Send the admin
   withdrawal-fulfilment code and I'll check/patch.
4. **The crypto webhook signature** (`src/app/api/crypto/webhook/route.ts`):
   confirm it validates the NOWPayments IPN signature before calling
   `/deposit/system`. If not, the shared key is the only thing guarding
   crypto credits.

## Note on precision

The atomic statics use `$inc` on 2-decimal-dollar values. Float drift
from `$inc` is far below a cent for any realistic transaction count, and
every comparison in the codebase already rounds via cents, so it is not a
practical concern. The fully drift-proof end state is to store balance as
an integer number of cents — a schema migration deliberately out of scope
here.
