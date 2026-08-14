# Per-page metadata: seller shops and listings

4 files, frontend only. Extract into the repo root; Replace when asked.

**Two files are renamed rather than edited**, so read this before
extracting:

- `src/app/sellers/[username]/page.tsx` -> becomes `SellerClient.tsx`,
  and a NEW `page.tsx` replaces it
- `src/app/browse/[id]/page.tsx` -> becomes `ListingClient.tsx`, and a
  NEW `page.tsx` replaces it

The zip contains all four, so extracting handles it -- but your old
`page.tsx` files are overwritten, and their contents now live in the
`*Client.tsx` files. Nothing inside them changed except the filename and
the component name.

## Why

Every seller shop and every listing served **the generic homepage title
and description**. Google saw dozens of near-identical pages with no
distinguishing signal and indexed almost none of them -- the same failure
that kept the two blog guides out of the index.

Metadata only reaches a crawler if it is rendered on the server. A page
using hooks cannot do that. So each route is now a thin server wrapper
that exports `generateMetadata` and renders the existing client page
untouched -- the "wrap, don't rewrite" approach from your SEO plan.

## What the pages now say

**Seller shops:** `{seller} — worn underwear on Panty Post`, with a
description built from their real bio, rating and sales figures. It only
mentions figures that exist: a shop with no sales does not advertise "0
sales", because an empty claim is worse than none. OG image comes from
the cover photo, falling back to the profile picture.

**Listings:** `{title} — ${price} by {seller}`, or "bidding from" for
auctions -- the three things someone decides on when scanning results.
Description uses the real listing text. OG image is the first photo.

Both include canonicals, so `www` and non-`www` stop competing.

## The second bug this fixes

`useBrowseDetail` calls `useSearchParams()`. Any client component doing
that makes the **server** render the nearest Suspense fallback instead of
the page -- and the only boundary was the one wrapping the whole app in
`ClientLayout`. So `/browse/[id]` served a crawler an **empty body**,
which your SEO notes flagged as a known limit.

The new `page.tsx` puts a `<Suspense>` directly around the client
component, low enough that metadata and everything above it still render.

## Safety note

`GET /api/listings/:id` returns 404 for unapproved listings to anyone but
the owner and admins, so metadata cannot leak an unreviewed item. That is
why this endpoint is safe to call unauthenticated from the server.

Both fetches are deliberately tolerant: a failure falls back to generic
metadata rather than throwing. A page that renders with a plain title
beats one that 500s.

## Ship

```powershell
npx tsc --noEmit
git add src/app/sellers src/app/browse
git commit -m "Per-page metadata for seller shops and listings; Suspense boundary for listing detail"
git push origin main
```

## Verify after deploy

```powershell
curl.exe -s https://pantypost.com/sellers/testseller | Select-String "<title>"
curl.exe -s https://pantypost.com/browse/<some-id> | Select-String "<title>"
```

Each should show its own title, not the homepage one. That is the whole
point of this batch, and it is checkable in ten seconds.

Then request indexing on a seller shop and a listing in Search Console.
