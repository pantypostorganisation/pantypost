# My Listings rebuild + checkout tweaks + approval counter

5 files, frontend only. Extract into the repo root; Replace all.
Everything parsed; the my-listings page and checkout modal both
typechecked against the real hook and component contracts.

## 1. Seller My Listings: 424 lines -> 246

**Six stat boxes for three numbers.** The hero showed Active Listings /
Available Slots / Auctions Running; directly beneath it a second row
repeated Standard / Premium / Auctions, each with its own icon tile and a
line of advice ("Drive urgency and higher bids with time-limited auction
drops").

**A hero that sold the page to someone already using it** -- gradient
border, inset shadow, a bespoke `rounded-[28px]`, a "SELLER WORKSPACE"
pill in 0.2em tracking, and two sentences about staying "premium" and
keeping the shop "irresistible".

**Five colour families** -- orange, emerald, purple, yellow and rose --
in a product whose palette is black plus one orange.

**A "Get Verified" panel the size of a landing page section**, listing
four benefits, beside a separate auction-tips panel repeating two of them.

Now: heading, listing count, New listing button, one line of four
figures, then the grid. Verification is **one line** -- it still matters,
because it gates auctions and the listing limit, but a seller does not
need four bullets and a shield icon on every visit. Verified sellers with
no auctions get one quiet line instead of a panel.

The page now matches the rhythm of the buyer pages: plain heading, one
row of figures on a hairline, then content.

**Note:** `createListingBtn.css` is no longer imported (the bespoke glow
button is gone). Nothing else references it, so it can be deleted when
convenient.

## 2. Checkout

- **Image bigger:** 96px -> 128px, 144px from `sm` up.
- **Platform fee hidden.** Only the Total shows now. It was itemised
  because the listed price and the charge differ -- the total is still
  prominent and also on the button, so what the buyer agrees to stays
  unambiguous.
- **Wallet balance moved** out of the price block and down beside
  Confirm, where it answers "can I afford this" rather than reading as
  another line of the bill.
- **The disabled state now says what is missing.** Your screenshot showed
  every field filled except Country, with a generic "Fill in your
  delivery address to continue" -- so the button looked broken. It now
  reads "Country is required", or "2 address fields still needed".

## 3. Approval counter (from the previous batch, included)

Approving or denying dispatches `pantypost:approval-count-changed`; the
header refetches immediately instead of waiting up to 60s for its poll.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/app/sellers/my-listings/page.tsx src/components/browse-detail/CheckoutModal.tsx src/components/Header.tsx src/app/admin/approval/page.tsx src/app/browse/[id]/page.tsx
git commit -m "My Listings rebuild, checkout tweaks, live approval counter"
```

Check My Listings with a mix of standard, premium and auction listings,
and with an unverified account (the verification line only shows then).
