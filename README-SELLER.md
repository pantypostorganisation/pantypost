# Seller: listing cards + wallet

2 files, frontend only. Extract into the repo root; Replace when asked.
Parsed clean. Follows the My Listings page rebuild in the previous zip.

## ListingCard -- the thing that fills the page

The page around these got cleaned last batch; the cards themselves were
still carrying **eleven pill shapes and five colour families**:

- The outer border changed colour by type -- purple for auctions, orange
  for premium, grey otherwise -- so a grid of mixed listings had three
  different frames.
- **Five separately-written corner badges** (Auction / Pending / Denied /
  Drop / Premium), each an absolutely-positioned block, all mutually
  exclusive. Now one `badge` object decided once.
- A **full-width status banner repeating what the badge just said** --
  "Pending approval -- Our admins will review this listing soon" directly
  under a "Pending approval" pill.
- A purple auction panel, a grey stats bar, a tag row of pills, and three
  circular icon buttons whose meaning depended on hovering for a tooltip.

Now: square image with ONE badge, title and price on a row, one meta line
(views, age, bid count), and **labelled actions in a footer row** --
Edit / Cancel auction / Delete, matching the buyer order cards so both
sides of the marketplace read as one product.

Kept deliberately: the **drop progress bar** (live information a seller
checks), and a one-line auction deadline (the thing they actually want to
know). The tag pills went -- a seller wrote those tags and does not need
them repeated back on their own dashboard.

**Also fixed: mojibake.** Two status messages contained `â€"` where an
em-dash should be -- damage from one of my earlier zips, before the
bundle script was corrected. Now plain ASCII.

Six icon imports dropped (Eye, Gavel, Crown, Clock, Calendar, Layers).

## Seller wallet

Straight token sweep: hex to tokens, `rounded-xl`/`2xl` down the scale,
pills to rounded rectangles (genuine circles left alone). No structural
change -- at 164 lines it did not need one.

## Not done yet

**`orders-to-fulfil` is 709 lines** with 17 banned radii, 3 gradients and
9 pills. It is the page a seller uses to actually ship things, so it
deserves a proper structural pass rather than being rushed in at the end
of a batch. Say the word and it is next.

`sellers/profile` came back clean -- no hex, no banned radii, no
gradients. Left alone.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/myListings/ListingCard.tsx src/app/wallet/seller/page.tsx
git commit -m "Seller: simplify listing cards, sweep seller wallet"
```

Check My Listings with a mix of standard, premium, auction and drop
listings -- the badge logic is the part worth eyeballing.
