# Crypto deposits: closed properly

3 files. **Backend deploys FIRST**, then frontend.

```
cd /var/www/pantypost/pantypost-backend
git pull origin main
pm2 restart pantypost-api
```

## First, the audit answer you asked for weeks ago

**The webhook signature check was already sound.** It verified an
HMAC-SHA512 against `NOWPAYMENTS_IPN_SECRET`, rejected requests with no
signature, guarded against length-mismatch timing issues, and failed
CLOSED when the secret was unset (unless an explicit dev flag was on).

So this is not a fix for a hole. It is the removal of an attack surface
that no longer earns its place.

## Why it still mattered

Removing the crypto UI from the wallet was cosmetic. **The endpoints
stayed live**, and one of them credits wallets:

- `POST /api/crypto/webhook` -> on a confirmed payment, calls
  `/wallet/deposit/system` on the backend.
- `POST /api/crypto/create-payment` -> creates a NOWPayments invoice.

The second is arguably worse than the first: it is the end a **buyer**
can reach, and with the webhook gone an invoice created there could take
real money into a payment that can never be credited.

An endpoint that moves money is not made safe by hiding its button.

## What changed

**`server.js`**
- `/api/crypto` is no longer mounted -- the whole route file is
  unreachable, so every crypto endpoint 404s.
- The crypto monitor no longer starts. It polled chains and credited
  wallets automatically; it was also throwing `Cannot find module 'web3'`
  on **every boot**, since web3 is not installed. That error is now gone
  from your logs too.
- `initializeCryptoDepositSystem()` is not called.
- The health payload reports `cryptoDeposits: false` rather than `true`.
- `/api/crypto/*` dropped from the startup endpoint list.

**The two Next.js API routes** return **410 Gone**. 410 rather than 404
because it tells NOWPayments (or anything else still calling) that the
endpoint existed and has been withdrawn, rather than implying a routing
mistake worth retrying.

## Nothing is deleted

`crypto.routes.js`, `cryptoMonitor.js`, `CryptoDeposit.js` and the two
wallet UI components are all still on disk. Restoring crypto means
re-mounting one line in `server.js`, reverting two route files, and
re-importing the wallet components.

Existing `cryptodeposits` records are untouched and still readable.

## Test

```bash
curl -i https://api.pantypost.com/api/crypto/system-status
```
Expect **404** (route not mounted). Then:

```bash
curl -i -X POST https://www.pantypost.com/api/crypto/create-payment
```
Expect **410**.

Also check the boot log: the `web3` module error should be gone, and
there should be no "Crypto deposit system initialized" block.

## One thing to tidy when convenient

`NOWPAYMENTS_IPN_SECRET`, `NOWPAYMENTS_API_KEY` and the
`CRYPTO_WALLET_*` variables in your `.env` are now unused. Harmless, but
worth removing so nobody assumes the feature is live.
