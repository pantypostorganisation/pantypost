# Listings: server-rendered content

3 files, frontend only. Extract into the repo root; Replace when asked.
All parse; the server wrapper typechecks.

Same change as the seller shops, on the page buyers actually land on from
search and from shared links.

## What changes

`page.tsx` already fetched the listing to build `generateMetadata`, then
discarded it -- and the client fetched it again. So the first HTML was a
spinner reading "Loading listing details...".

That record now passes into the client as `initialListing`, so the title,
price, photos and seller are in the markup **before it leaves the
server**. No extra request: Next dedupes identical `fetch()` calls within
a request, so metadata and the page share one round trip.

## The loading gate

`if (isLoading)` became `if (isLoading && !listing)`. With a
server-supplied listing the page renders immediately and the live data --
current bid, bid history, drop counts, affordability -- fills in
underneath. A client-side navigation, where there is no seed, still shows
the spinner exactly as before.

## The Suspense boundary stays

`useBrowseDetail` calls `useSearchParams()`, which makes the server
render the nearest Suspense fallback. Without a boundary in this file
that would be the one wrapping the entire app, and this route would go
back to serving an empty body -- the original bug on this page. It is
still there, wrapping the client component.

## Ship

```powershell
npx tsc --noEmit
git add "src/app/browse/[id]" src/hooks/useBrowseDetail.ts
git commit -m "Listings: pass server-fetched listing into first render"
git push origin main
```

## Verify

Grab a real listing id from your browse page, then:

```powershell
curl.exe -sL https://pantypost.com/browse/<id> | Select-String "Loading listing"
```

**No match** is the result you want.

Then confirm the content is genuinely there:

```powershell
$html = curl.exe -sL https://pantypost.com/browse/<id>
([regex]::Matches($html, 'Test listing')).Count
```

Use whatever the listing's real title is. Several matches means it is in
the body, not just the title tag.

## Where this leaves the SEO work

Both high-intent page types now serve real HTML:

- **seller shops** -- name, bio, avatar, listings
- **listings** -- title, price, photos, seller

Plus, from earlier: the sitemap is being read (48 URLs), per-page metadata
exists, `/blog` is linked and its guides have real titles, and the
Domain property covers www and non-www.

The remaining gap is content depth rather than plumbing -- there is only
so far three test listings can rank. That is an inventory problem now,
not an engineering one.
