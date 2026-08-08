# Creator Drops — architecture and status

Started 8 Aug 2026, batch 2 completed same day. The creator-drop
mechanic: one seller lists a run of N numbered units ("500 pairs, each
put on during my filmed drop day"), buyers claim units one at a time,
every order carries "unit #X of N".

## Why it's shaped this way

**One listing, N units — never N listings.** Every listing passes
pre-publication moderation, which is the platform's payment-processor
moat. A 500-listing drop would either bury the admin queue or invite an
auto-approve bypass. One listing = one approval, whatever the run size.

**"Put on during the filmed drop", stated on the listing.** Drop units
sold under the implied meaning "worn" is a mass-refund / chargeback
pattern, and chargeback ratio is the metric that terminates adult
merchant accounts. The honest framing is also the stronger product:
numbered units + filmed provenance = collectible. The schema carries
`drop.wornOnCamera` (default true), and the seller creation form states
the rule in writing.

**Server-authoritative money.** `POST /api/orders/drop` computes every
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
sold-out. Failures after the claim restore the unit first, then unwind
wallets (compensating-action pattern — no replica set, so no
multi-document transactions).

## Batch 1 (rails + buy side) — shipped

- `models/Listing.js` — `drop` subdoc (isDrop, totalUnits 2–2000,
  unitsRemaining, unitsSold, scheduledFor, wornOnCamera), index, and a
  `pre('findOneAndUpdate')` guard stripping `drop`, `drop.isDrop`,
  `drop.totalUnits` from generic updates ($inc untouched — that is the
  claim path).
- `models/Order.js` — `dropUnitNumber`, `dropTotalUnits`.
- `routes/listing.routes.js` — create-route validation (units bounds,
  price required, auction/drop mutually exclusive, scheduledFor future
  ≤ 60 days, same moderation queue); legacy `/:id/purchase` refuses
  drops.
- `routes/order.routes.js` — `POST /orders/drop` with the full money
  machinery mirrored (tier, referral, transactions, notifications with
  "unit #X of N", AdminAction, stats) plus `drop:update` broadcast on
  every claim and `listing:sold` when the last unit goes.
- Frontend: `listings.service.ts` (`DropInfo`, converters,
  `purchaseDropUnit()`), `useBrowseDetail.ts` (drop purchase branch +
  live `drop:update` subscription), `browse/[id]/page.tsx` (drop banner
  with live remaining + progress bar).

## Batch 2 (seller creation + surfaces + purchase security) — shipped

**Security hardening (blockers 1–3 below: RESOLVED):**

- `POST /api/orders` is now server-authoritative when `listingId` is
  present: price, seller, title, description, image, tags and premium
  flag all derive from the listing; the client's copies are ignored
  (mismatched client price is warn-logged). The sold-flip is an atomic
  `findOneAndUpdate({status:'active'})` BEFORE money moves — a
  concurrent second buyer gets a clean 409 — and payment failure
  restores the listing before wallets unwind. Drops and auctions are
  rejected on this route (each has its own settlement path).
- `POST /api/listings/:id/purchase` (flips sold with NO money movement)
  is admin-locked. No frontend caller existed.
- `WalletContext` no longer fabricates "John Doe / 123 Main St" on
  orders — both injection points removed; the address key is sent only
  when a real one exists.

**Seller creation + surfaces:**

- `ListingForm` — third "Drop" type card (verified sellers only), units
  input (2–2000), optional `datetime-local` open time, and the
  provenance rule stated in the form. Type radios are mutually
  exclusive with auction.
- `useMyListings` — drop save branch (validates, converts open time to
  ISO, passes `drop` through `addListing`); editing an existing drop is
  refused client-side (the server strips size mutations regardless).
- `ListingContext` — `NewListingInput` carries `drop?`;
  `purchaseListingAndRemove` hard-guards against drops.
- Browse `ListingCard` — orange DROP chip top-left; live
  "X of N left" / "Sold out" pill bottom-left (auction-countdown slot).
- Seller `ListingCard` — DROP badge plus a progress row: units claimed,
  progress bar, gross revenue so far.
- `PurchaseSection` — its own drop path (it bypasses the hook's
  handler by design): claim endpoint, "Unit #X of N is yours!",
  opens-at / sold-out gating, button copy "Claim unit #N — $X".
- `StickyPurchaseBar` — drop-aware label and disabling ("Claim unit" /
  "Not open yet" / "Sold out").

Batch 2's backend `order.routes.js` and `listing.routes.js` SUPERSEDE
batch 1's copies (they contain batch 1 plus the hardening). Batch 1's
`Listing.js` / `Order.js` are still required and unchanged.

## Pre-launch blockers

1. ~~POST /api/orders trusts client-supplied price~~ **RESOLVED (batch 2)**
2. ~~POST /api/orders never checks the listing is unsold~~ **RESOLVED (batch 2)**
3. ~~Money-less /listings/:id/purchase open to all users~~ **RESOLVED (batch 2 — admin-locked)**
4. Signup → verify → fund → purchase funnel still never audited
   end-to-end (Phase 5). A creator's audience dies in a broken funnel.

Residual (accepted, documented): a body-only order with NO listingId
remains possible for legacy compatibility — it cannot touch any
listing and only moves the buyer's own funds to a named seller.

## Launch sequencing

Security fixes (done) → SegPay live → funnel audit → ONE mid-size
creator pilot → scale manager outreach. Pitch framing: a filmed content
day that is also a five-figure payday, with numbered collectible
provenance.
