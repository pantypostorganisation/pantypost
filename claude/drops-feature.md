# Creator Drops — architecture and status

Started 8 Aug 2026. The creator-drop mechanic: one seller lists a run of
N numbered units ("500 pairs, each put on during my filmed drop day"),
buyers claim units one at a time, every order carries "unit #X of N".

## Why it's shaped this way

**One listing, N units — never N listings.** Every listing passes
pre-publication moderation, which is the platform's payment-processor
moat. A 500-listing drop would either bury the admin queue or invite an
auto-approve bypass. One listing = one approval, whatever the run size.

**"Worn on camera during the drop", stated on the listing.** The
bathwater precedent worked because the claim was transparently what it
was. Drop units sold under the implied meaning "worn" is a mass-refund /
chargeback pattern, and chargeback ratio is the metric that terminates
adult merchant accounts. The honest framing is also the stronger
product: numbered units + filmed provenance = collectible. The schema
carries `drop.wornOnCamera` (default true) to keep this explicit.

**Server-authoritative money.** The legacy `POST /api/orders` trusts the
request body for price/seller/title and flips listings sold without
checking they were still active. `POST /api/orders/drop` computes every
dollar from the listing and claims inventory atomically:

```js
Listing.findOneAndUpdate(
  { _id, status: 'active', approvalStatus: 'approved',
    'drop.isDrop': true, 'drop.unitsRemaining': { $gt: 0 } },
  { $inc: { 'drop.unitsRemaining': -1, 'drop.unitsSold': 1 } },
  { new: true }
)
```

Mongo serialises those updates, so N simultaneous buyers each get a
distinct `unitsSold` snapshot (their unit number) or a clean 409
sold-out. No read-then-write window, no oversell. Failures after the
claim restore the unit first, then unwind wallets (compensating-action
pattern, consistent with the rest of order.routes.js — no replica set,
so no multi-document transactions).

## What shipped (batch 1 — rails + buy side)

Backend:
- `models/Listing.js` — `drop` subdoc (isDrop, totalUnits 2–2000,
  unitsRemaining, unitsSold, scheduledFor, wornOnCamera), index, and a
  `pre('findOneAndUpdate')` guard stripping `drop`, `drop.isDrop`,
  `drop.totalUnits` from generic updates so the edit controller can
  never resize a live drop ($inc untouched — that's the claim path).
- `models/Order.js` — `dropUnitNumber`, `dropTotalUnits`.
- `routes/listing.routes.js` — create-route validation (units bounds,
  price required, auction/drop mutually exclusive, scheduledFor future ≤
  60 days, same moderation queue); legacy `/:id/purchase` refuses drops.
- `routes/order.routes.js` — `POST /orders/drop`: full money machinery
  mirrored from the legacy route (tier bonus, referral commission +
  recording, purchase/fee/tier-credit Transactions, AdminAction,
  createSaleNotification with "unit #X of N", tier update, balance/
  transaction/order emits, incrementPaymentStats), plus broadcast
  `drop:update {listingId, unitsRemaining, unitsSold, totalUnits,
  soldOut}` on every claim and `listing:sold` when the last unit goes.

Frontend:
- `services/listings.service.ts` — `DropInfo` type, backend↔frontend
  converters, `CreateListingRequest.drop`, `purchaseDropUnit()`.
- `hooks/useBrowseDetail.ts` — drop branch in handlePurchase (claim
  endpoint, "Unit #X of N is yours!", sold-out/not-open guards, local
  counter update) and a `drop:update` subscription so remaining counts
  move live on the page.
- `app/browse/[id]/page.tsx` — drop banner above the purchase section:
  DROP badge, live "X of N remaining", progress bar, opens-at /
  sold-out states. Design tokens throughout.

## Batch 2 — seller creation + surface polish (files needed)

Sellers cannot yet create drops from the UI (backend accepts them).
Needed files: `components/myListings/ListingTypeSelector.tsx`,
`ListingForm.tsx`, `hooks/useMyListings.ts`, `context/ListingContext.tsx`,
`types/myListings.ts`, `utils/myListingsUtils.ts`,
`components/browse/ListingCard.tsx` (grid badge),
`components/browse-detail/PurchaseSection.tsx` and
`StickyPurchaseBar.tsx` (button copy: "Claim unit — $X"),
`components/myListings/ListingCard.tsx` (seller progress + revenue).

## Pre-launch blockers (independent of drops, found while building)

1. `POST /api/orders` trusts client-supplied price/seller — a buyer can
   name their own price. SegPay-critical.
2. `POST /api/orders` never checks the listing is unsold/active —
   double-sell of one-off items is possible today.
3. `POST /api/listings/:id/purchase` flips sold with NO money movement.
   Frontend uses `purchaseListingAndRemove` (ListingContext) — audit
   which endpoint(s) it actually hits.
4. Signup → verify → fund → purchase funnel still never audited
   end-to-end (Phase 5). A creator's audience dies in a broken funnel.

## Launch sequencing

Build (done) → SegPay live → funnel audit → ONE mid-size creator pilot →
scale outreach. Pitch framing for managers: a filmed content day that is
also a five-figure payday, with numbered collectible provenance.
