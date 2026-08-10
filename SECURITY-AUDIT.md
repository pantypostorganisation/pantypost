# PantyPost — Code & Security Audit

**Date:** 2026-08-10
**Scope:** Next.js 15 / React 19 frontend (`src/`) and Express 5 / MongoDB backend (`pantypost-backend/`)
**Nature:** Read-only audit. Nothing was modified. Findings below are prioritized; line numbers are approximate.

> Verified findings (spot-checked against source): committed production secrets, password-reset brute force, order IDOR, hardcoded JWT fallback, dependency CVEs.

> **Remediation status (2026-08-10):** Fixed — C3 (MATIC backdoor removed), C4 + H1 + M7 (attempt counting on reset/verify, code lookups scoped to account, `crypto.randomInt` codes), H2 (PII excluded from public user list, regex escaped), H3 (order query ownership check), H4 + M8 (message threads/notifications ownership checks), H5 (subscription price now server-authoritative), H7 (rate limiting on all auth endpoints), L1 (server-side hardcoded admin username lists removed; client-side list in `WalletContext.tsx`/`wallet.service.ts` still pending), L2 (all `'your-secret-key'` fallbacks removed), L4 (storage key allow-list validation), L8 (buyer wallet deposit history now authenticated via `apiCall`). C1 partially done: env files untracked from git — **secrets still need rotation and history purge**. Still open: C2, M1–M6, H6, H8, H9, L3, L5–L7.

---

## Summary

| Severity | Count | Theme |
|---|---|---|
| Critical | 4 | Committed live payment secrets, non-atomic wallet math (double-spend), crypto auto-credit backdoor, password-reset brute force / ATO |
| High | 9 | Email-verification brute force, PII leak, DM/order IDOR, buyer-set subscription price, stored XSS upload, no auth rate limiting, client-only admin gating, weak CSP, token stored in localStorage |
| Medium | 8 | Subscription double-charge, crypto underpayment credit, order cancel doesn't refund, 7-day token no revocation, user enumeration, predictable codes, more IDOR, debug/test routes |
| Low | 8 | Hardcoded admin usernames, dead JWT fallback, dep CVEs, console logging, mass-assignment, storage key injection surface |

Most exploitable-by-an-ordinary-user issues: the wallet double-spend (#2), password-reset takeover (#4), the PII dump (#8), and the order/DM IDOR (#9, #10).

---

## CRITICAL

### C1 — Live production payment secrets committed to git
`.env.production`, `.env.staging`, `.env.development.backup` are tracked in git even though `.gitignore` lists `.env.*`. `.env.production` contains real-looking values:

```
NOWPAYMENTS_API_KEY=DPF6TH7-...
NOWPAYMENTS_IPN_SECRET=fkP7bxoUz...
INTERNAL_API_KEY=pantypost-system-webhook-key   # guessable
ALLOW_UNVERIFIED_IPN=true
```

`NOWPAYMENTS_IPN_SECRET` is the HMAC key used to verify crypto payment webhooks (`src/app/api/crypto/webhook/route.ts`). Anyone with it can forge a valid IPN and credit arbitrary wallets. `INTERNAL_API_KEY` authenticates the internal fund-moving webhook and is a guessable literal.
**Action:** rotate all three secrets, `git rm --cached` the files, and purge from history (git-filter-repo/BFG). These are server-only vars, so not in the client bundle — exposure is the git commit itself.

### C2 — Non-atomic wallet debit in every purchase path → double-spend / overdraft
`routes/order.routes.js` (POST `/` ~288-351, `/drop` ~857-937, custom-request ~1446), `routes/tip.routes.js:60-91`, `routes/subscription.routes.js:125-204`, `services/subscriptionRenewal.js:467-524`, `services/auctionSettlement.js:439`.
Balance is read into memory, checked, then mutated via `wallet.withdraw()`/`wallet.deposit()` + `save()` — a classic read-modify-write. Two concurrent requests both read the same balance, both pass the funds check, both save (last-write-wins). A buyer with \$100 firing two simultaneous \$100 purchases gets both.
The model **already ships atomic statics** `Wallet.debitIfFunds()` / `creditAtomic()` (`models/Wallet.js:144-164`) — the deposit/withdraw/admin paths use them, but the purchase/tip/subscription/auction paths were never migrated. **Highest-leverage fix.**

### C3 — Test-only MATIC auto-credit backdoor active in production
`services/cryptoMonitor.js:509-558` (`checkMaticDeposits`, called unconditionally at ~575). For any native MATIC transfer to the platform wallet it grabs the first pending `CryptoDeposit` with no `txHash` and credits the full requested USD (`deposit.amountUSD`) regardless of MATIC actually sent — and matches *any* pending deposit. No env flag guards it (unlike the wallet path). Create a \$10,000 pending deposit, send \$0.01 of MATIC, get \$10,000. Comment literally says "you can remove this in production."

### C4 — Password-reset code brute-forceable → account takeover
`routes/auth.routes.js:1232-1300` (POST `/reset-password`). Reset code is a 6-digit `Math.random` value (`models/PasswordReset.js`). The endpoint looks up `findOne({ email, verificationCode })` and checks `isValid()` but **never calls `incrementAttempts()`** — only the separate `verify-reset-code` endpoint increments, and an attacker skips it. Combined with **no rate limiting**, all 10^6 codes can be tried without lockout. *Verified in source.*

---

## HIGH

### H1 — Email-verification code brute force → session for another account
`routes/auth.routes.js:423-431, 508-523`. `verify-email` looks up the code **not scoped to a user**: `EmailVerification.findOne({ verificationCode, verified:false }).sort({createdAt:-1})`, no attempt increment, no rate limit, and on success it **issues a JWT** for whichever account owns the matched 6-digit code. Guess any pending code → valid session for that user.

### H2 — Unauthenticated user list leaks every email + phone (PII + enumeration)
`routes/user.routes.js:127-151` — `GET /api/users` has no `authMiddleware`; `.select('-password ...')` does **not** exclude `email`/`phoneNumber`. Anonymous request dumps all users' contact info. `query` builds a case-insensitive `$regex` over email → targeted lookup + ReDoS/unindexed-scan DoS.

### H3 — IDOR: read any user's orders
`routes/order.routes.js:~1800` — `?buyer=` / `?seller=` copied straight into the Mongo filter with no check they equal `req.user.username`; the ownership branch is skipped once a param is present. `GET /api/orders?seller=victim` returns victim's orders incl. buyer delivery addresses, earnings, fees. *Verified in source.*

### H4 — IDOR: read any user's private message threads
`routes/message.routes.js:45` — `const username = req.query.username || req.user.username;` with no equality check. `GET /api/messages/threads?username=victim` returns victim's threads and message contents. (The `/threads/:threadId` route *does* enforce membership — this list endpoint is the leak.)

### H5 — Buyer controls their own subscription price
`routes/subscription.routes.js:98,111` — `finalPrice = Number(price ?? seller.subscriptionPrice ?? 0)` prefers client-supplied `price`, clamped only to `[0.01, 999.99]`. Buyer posts `price: 0.01` and gets premium access for a penny.

### H6 — Stored XSS via mime-only upload filter
`config/upload.config.js:23-28, 60-75` — filter trusts only the client `Content-Type` header and `generateFilename` keeps the original extension. Upload `evil.html`/`evil.svg` with header `image/png`; it's written as `.html`/`.svg` and `express.static` (`server.js`) serves it as `text/html`/`image/svg+xml` on the `api.pantypost.com` origin → script execution.

### H7 — No rate limiting on any auth endpoint
`routes/auth.routes.js` — login/signup/forgot/reset/verify have no `express-rate-limit` (it's only on report/complaint/traffic routes). No `helmet`, no mongo-sanitize. Enables C4/H1 and credential stuffing.

### H8 — Admin/role route protection is client-side only
`src/middleware.ts` only normalizes `/buyers` typos; it does **not** gate `/admin/*`. There's no `src/app/admin/layout.tsx` server gate — admin pages rely solely on the client `RequireAuth` component. Security depends entirely on the backend enforcing admin auth on every API call. (Backend admin checks do correctly read `req.user.role` from the signed JWT — good — but the frontend gate is cosmetic.)

### H9 — JWT in localStorage/sessionStorage + weak CSP
`src/context/AuthContext.tsx` `TokenStorage` stores `auth_tokens` in sessionStorage (and localStorage with "remember me") — JS-readable, so any XSS steals the bearer + refresh token. `next.config.ts:8` CSP allows `script-src 'unsafe-inline' 'unsafe-eval'`, which largely defeats XSS mitigation. Together these raise any XSS to full account takeover.

---

## MEDIUM

- **M1 — Subscription renewal double-charge.** `routes/subscription.routes.js:359-456` (admin `process-renewals`) and `services/subscriptionRenewal.js:325-386` (cron) query the same due set and charge non-atomically before advancing the billing date; overlap → double charge. No `findOneAndUpdate` claim.
- **M2 — Crypto underpayment credited in full.** `services/cryptoMonitor.js:441-495` credits `deposit.amountUSD` when on-chain amount is within 2.5% tolerance; deliberate 2.5% underpayment on \$10k nets ~\$250 free. Admin `verify-deposit` (`routes/crypto.routes.js:439-459`) is a non-atomic read-then-credit → double-click double-credit.
- **M3 — Auction race / recovery double-payout.** `services/auctionSettlement.js` — `cancelAuction` (~703) lacks the atomic status claim that `settleAuction` uses (~58); stuck-auction recovery (~816) flips `processing`/`error` back to `active`, so a crashed settlement re-runs and pays the seller twice.
- **M4 — Order cancel doesn't refund buyer.** `routes/order.routes.js:2292-2314` — admin DELETE sets `shippingStatus='cancelled'` only; no wallet reversal, no refund transaction, no `paymentStatus` change. Buyer's money is stranded.
- **M5 — 7-day token, no revocation.** `routes/auth.routes.js` `signToken` `expiresIn:'7d'`; `/refresh` re-signs from the old token's `decoded.role` without reloading the user. A banned/demoted admin keeps privileges up to 7 days; refresh renews indefinitely.
- **M6 — User enumeration + email disclosure.** Login returns distinct messages for unknown-user vs wrong-password and leaks the account email in the pending-reset 403; `forgot-password` returns the real email when a username is submitted.
- **M7 — Predictable 6-digit codes.** `EmailVerification`/`PasswordReset` use `Math.random` over 10^6 space (amplifies C4/H1). The 32-byte token path is fine, but the code paths bypass it.
- **M8 — Debug/test routes ship.** `src/app/test-auth/page.tsx` reads and writes auth tokens to the DOM/storage. Confirm it's stripped from prod. Also `IDOR: GET /api/messages/notifications?username=victim` (`message.routes.js:649`).

---

## LOW

- **L1 — Hardcoded admin usernames.** `routes/wallet.routes.js:59-74`, `routes/crypto.routes.js:82-86`, and client `src/context/WalletContext.tsx:136-141` grant admin to `oakley`/`gerome`/`platform`/`admin` by string match — brittle vs the DB `role` field and discloses admin identities in the client bundle.
- **L2 — Dead JWT fallback.** `middleware/auth.middleware.js:7` and `routes/auth.routes.js:15` still have `process.env.JWT_SECRET || 'your-secret-key'`. Mitigated by the `server.js` fail-fast on boot, but remove for defense-in-depth.
- **L3 — Dependency CVEs.** Backend `npm audit`: 18 vulns (13 high), incl. `ws` uninitialized-memory disclosure + DoS via socket.io. Run `npm audit fix`. Check frontend separately.
- **L4 — Storage key path injection surface.** `server.js` `/api/storage/set` uses untrusted `key` directly in the update path `storage.${key}` with no `$`/dot validation; scoped under `storage` so low impact but should be validated.
- **L5 — Non-constant-time webhook key compare + replay.** `routes/wallet.routes.js:216-290` — `systemKey !== expectedKey` not timing-safe; idempotency dedup only runs when `txId||orderId` present, else every retry re-credits.
- **L6 — Rollback overwrites balances (lost update).** `routes/order.routes.js:336-352`, `tip.routes.js:154-159` restore via `wallet.balance = previousBalance`, clobbering concurrent legitimate changes.
- **L7 — Sensitive console logging in prod** (`AuthContext.tsx`, `verify-email/page.tsx`, `WebSocketContext.tsx`) leaks usernames/session state.
- **L8 — Broken feature:** `src/app/wallet/buyer/page.tsx:58` reads `localStorage.getItem('token')` but tokens live under `auth_tokens` (JSON, sessionStorage) — deposit-history fetch always sent unauthenticated. Not a hole, but broken.

---

## Things done right
- `server.js` fail-fasts if `JWT_SECRET` is missing/`<32` chars.
- Backend admin authorization reads role from the server-signed JWT, not `req.body`.
- Identity docs (`/uploads/verification`) blocked from static serving; signed short-lived access tokens + `path.basename` traversal guard.
- `ageAssurance.js` uses HMAC-SHA256 + `timingSafeEqual`.
- Profile update is allow-listed — `role`/`isAdmin`/`balance`/`isVerified` not mass-assignable.
- `Wallet.debitIfFunds`/`creditAtomic` atomics exist (just not used everywhere).
- `orderSettlement.js` uses real Mongo transactions/sessions.
- Frontend `SecureMessageDisplay` + sanitization use DOMPurify with a tight allowlist; `dangerouslySetInnerHTML` elsewhere only injects static JSON-LD.
- Crypto `create-payment` validates amounts server-side (min/max, exchange-rate sanity).

---

## Suggested fix order
1. **C1** rotate + purge committed secrets (do first — clock is running).
2. **C4 / H7** add rate limiting + fix reset/verify attempt counting.
3. **C2 / M1 / M3** migrate all money paths to `debitIfFunds`/`creditAtomic` + atomic status claims.
4. **C3** remove the MATIC auto-credit backdoor.
5. **H2 / H3 / H4** add auth + ownership checks on user list / orders / messages.
6. **H5 / M2 / M4** server-authoritative pricing, exact-amount crediting, refund-on-cancel.
7. **H6 / H8 / H9** upload validation, server-side admin gating, CSP + token storage.
