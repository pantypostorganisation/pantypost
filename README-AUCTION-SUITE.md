# Auction surface: clean, minimalist, on the design system

Four files, frontend only. Extract into the repo root; Replace when asked.
**Supersedes `pantypost-auction.zip`** (that batch's AuctionSection is
included here).

Everything typechecked against the real prop types in
`types/browseDetail.ts` and parsed as TS+JSX. **No logic, props or
handlers changed anywhere** -- this is layout, hierarchy and colour.

## The problem, across the whole surface

Three components, three different visual languages, and none of them
matched the site:

- **Five colour families** in play -- purple, red, green, yellow, grey --
  in a product whose palette is black + one orange with a single
  `auction` accent.
- **Twelve gradients** between the three files. Your rules say no
  gradients on surfaces.
- **Ambient animation everywhere**: an infinitely pulsing LIVE chip
  containing a separately pulsing dot, an infinitely pulsing progress bar,
  scale-in pills, per-row entrance staggers. Your rules say no ambient
  animation.
- **Emoji as icons** (warning sign, tick, person, crown) where the rules
  say lucide only.
- Banned radii (`rounded-xl`) and pill buttons throughout.

## 1. AuctionSection -- restructured

Was **ten stacked boxes**, including **two progress bars that looked
identical but meant different things** (money toward reserve vs time
elapsed, three rows apart), and the reserve status stated in **five**
places.

Now ordered by what a bidder decides on:

1. Header: Auction + one status chip (Live / Ending soon / Ended) + bid
   count, which is now the link into history
2. The two numbers that matter, large and side by side: current bid and
   time left. Starting price drops to a small line beneath
3. One progress bar, and it is time
4. Reserve status, stated once
5. "You pay if you win" -- kept deliberately, see note below
6. Seller earnings (seller's own listing only)
7. Your position
8. Bid form, 40px controls
9. Recent bids

## 2. AuctionEndedModal -- four shells became one

The file contained **four complete modal shells** (buyer reserve-not-met,
seller reserve-not-met, seller/non-bidder, outbid bidder), each repeating
its own overlay, panel, icon block, heading, body and button -- and they
had already drifted apart from one another.

There is one shell now. The branching produces a small descriptor (tone,
icon, title, body, action) and the shell renders it. Every original
condition and every piece of copy is preserved; a fifth outcome later
means a new case, not another 90 lines of chrome.

Escape and backdrop-click now dismiss it, matching every other overlay.

## 3. BidHistoryModal -- decoration removed

Was a grey gradient panel with a purple border, a 40px avatar circle per
row (green gradient ring for the leader, purple for you, grey otherwise),
a "Highest" pill that scale-animated in, a per-row stagger, and its own
inline scrollbar CSS duplicating the `.custom-scrollbar` class already in
`globals.css`.

A bid row needs three things: who, how much, when. It now says exactly
that on one flat surface, with the leader marked by a small trophy and
the success colour, amounts in `tabular-nums` so the column lines up, and
the shared scrollbar class instead of a private copy.

## 4. page.tsx -- encoding repaired

One leftover mojibake character from an earlier round of my zips, plus
all prose punctuation converted to ASCII so it cannot recur through the
bundle pipeline.

## Kept on purpose

**"You pay if you win"** and the per-row total in the history. The bid
and the amount charged are different numbers, and a buyer discovering
that at checkout is how chargebacks start -- which is the one thing this
platform cannot afford.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/components/browse-detail/AuctionSection.tsx src/components/browse-detail/AuctionEndedModal.tsx src/components/browse-detail/BidHistoryModal.tsx "src/app/browse/[id]/page.tsx"
git commit -m "Auction surface: restructure, tokens, remove gradients and ambient animation"
```

Check every state, since that is where the mess concentrated: live with
no bids, live with bids, reserve met, reserve NOT met, under 5 minutes,
ended as winner, ended as outbid bidder, ended as seller with and without
bids, cancelled, and the bid history modal with 0 / 1 / many bids.

## Not included

The auction treatment on the **browse grid card**
(`src/components/browse/ListingCard.tsx`) -- the purple AUCTION badge,
countdown pill and "Current bid / Reserve not met" block. You said you
were happy with browse, so I left it. It is now the last piece of the
auction surface still on the old styling; send that file and it is a
short follow-up.
