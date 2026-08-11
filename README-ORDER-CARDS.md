# My Orders: the cards

One file: `src/components/buyers/my-orders/OrderCard.tsx`. Frontend only.
Extract into the repo root; Replace when asked. Parsed and typechecked
against the real `Order` type.

## What each card was carrying

Title, price, then a four-part meta line (`#6991fa002b` / `Placed Feb 16,
2026` / `Auction win` / `AWAITING SHIPMENT`) assembled through a
`metaItems` array and an `interleavedMeta` array that injected bullet
separators between them. Then a 64px thumbnail beside a two-line
description. Then a permanently-mounted **"Confirm delivery address"
panel** with its own heading, an explanatory paragraph, an address
preview and a button. Then a "View details" button. And the expanded
content nested inside *another* bordered box within the card.

Three of those side by side, as in your screenshot, is a wall.

## Now

- **Image, title, price** on one row.
- **One meta line**: `Placed Feb 16, 2026 · Auction win`, plus a small
  status chip beneath.
- **The order id moved into the expanded view.** It was the most visually
  prominent thing on the card and the least useful to a buyer.
- **Actions are full-width rows separated by hairlines**, not floating
  buttons: "Add delivery address" (only when one is missing) and "View
  details" with a chevron that rotates when open.
- **The expanded section lost its inner border** -- the card is already
  the container -- and now carries the order id, description and "Ships
  to" line.

## The address prompt

It is a strip now, not a panel. That is deliberate and temporary: once
checkout collects the address BEFORE payment (next batch), a card needing
an address becomes a rare exception rather than a fixture on all 48.

## Dead code removed

`metaItems`, `interleavedMeta` and `getOrderStyles` all existed only to
build the bullet-separated meta run and a per-type border tint. 264 lines
-> 257, with a much smaller render.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/buyers/my-orders/OrderCard.tsx
git commit -m "My Orders: simplify order cards"
```

## Next: checkout before payment

I have everything needed and here is what I found -- worth reading before
I build it, because there is one decision for you.

**There are THREE purchase paths, not one:**
1. `PurchaseSection`'s own button -> `WalletContext.purchaseListing`
2. `StickyPurchaseBar` -> `handlePurchaseWithAnalytics` -> the hook's
   `handlePurchase` -> `purchaseListingAndRemove`
3. Drop claims -> `listingsService.purchaseDropUnit`

`PurchaseSection` is even passed a `handlePurchase` prop that it ignores
(marked "kept for compatibility"). A checkout modal has to sit ABOVE all
three at the page level, or the sticky bar simply buys with no address --
exactly the class of gap we have been closing all session.

**Auctions have no checkout moment at all.** `auctionSettlement.js`
creates the winning order with `deliveryAddress: undefined`. The address
has to be collected either when the bid is placed or when the auction is
won. I would do it at bid time: it makes the bid a complete commitment,
and the winner does not have to be chased afterwards.

**The decision I need:** there is no saved address anywhere -- not on the
profile, not on the account. So as it stands a buyer types their full
address on every single purchase. I would add a saved address to the
buyer profile that checkout prefills. Slightly more work (a field plus an
endpoint); without it, repeat buying is painful.

Say which and I will build it as its own batch, backend and frontend
together.
