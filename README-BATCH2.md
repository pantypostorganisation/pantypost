# Batch 2 — purchase-flow security + Drops seller UI

**Requires batch 1 applied first** (`pantypost-drops-batch1.zip`).
This zip's two backend route files SUPERSEDE batch 1's copies — they
contain everything from batch 1 plus the security hardening. Batch 1's
`models/Listing.js` and `models/Order.js` stay as-is.

Extract into the repo root so `src/` and `pantypost-backend/` merge;
Replace all when asked.

## What's inside

**Security (SegPay-critical, found while building drops):**
1. `POST /api/orders` — server-authoritative: a buyer can no longer
   name their own price; every material field derives from the listing.
   Atomic sold-claim BEFORE money (no more double-selling a one-off);
   payment failure restores the listing.
2. `POST /api/listings/:id/purchase` — the route that marked listings
   sold with NO money movement is now admin-only.
3. `WalletContext` — the hardcoded "John Doe, 123 Main St" fake
   delivery address (injected on every order, twice) is gone.

**Drops seller UI + surfaces:**
- Listing form: third "Drop" type (verified only) — units 2–2000,
  optional open time, provenance rule in writing.
- Browse grid: DROP chip + live "X of N left" / "Sold out".
- Seller cards: progress bar + units claimed + gross revenue.
- Detail page buy button: "Claim unit #N — $X", opens-at and sold-out
  states; sticky bar matches.

## Deploy order (matters)

1. **Backend first**: on the VPS —
   `cd /var/www/pantypost/pantypost-backend && git pull && pm2 restart pantypost-api`
2. Then push frontend (Vercel auto-deploys).

## Verify before committing

```powershell
npx tsc --noEmit
```

## Stage (never `git add -A`)

```powershell
git add pantypost-backend/routes/order.routes.js pantypost-backend/routes/listing.routes.js src/context/WalletContext.tsx src/context/ListingContext.tsx src/types/myListings.ts src/utils/myListingsUtils.ts src/hooks/useMyListings.ts src/components/myListings/ListingForm.tsx src/components/myListings/ListingCard.tsx src/components/browse/ListingCard.tsx src/components/browse-detail/PurchaseSection.tsx src/components/browse-detail/StickyPurchaseBar.tsx claude/drops-feature.md
git commit -m "Drops seller UI + server-authoritative purchase flow with atomic sold-claim"
```

## End-to-end drop test (after both deploys)

1. As **testseller** (verified): My Listings → create → choose **Drop**
   → 5 units, price $10, no open time → submit → "Pending approval".
2. As **admin**: `/admin/approval` → approve it.
3. Browse: card shows DROP chip + "5 of 5 left".
4. As **testbuyer**: open it → banner shows progress → "Claim unit
   #1 — $11.00" → buy → toast "Unit #1 of 5 is yours!" → lands in
   My Orders with the unit number.
5. As **segpaybuyer** in a second window: watch the counter tick live
   as testbuyer buys; buy units yourself; on the LAST unit try both
   windows at once — one wins, the other gets "Sold out — the last
   unit went moments ago."
6. Seller's My Listings card: progress bar and gross revenue update.
7. Security spot-check: buying a normal (non-drop) listing still works,
   and the order's price is the LISTING's price regardless of anything
   the client sends.
