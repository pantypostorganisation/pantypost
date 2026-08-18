# Seller shops: server-rendered content, not just metadata

3 files, frontend only. Extract into the repo root; Replace when asked.
All parse; the server wrapper typechecks.

## What changes

`page.tsx` already fetched the seller record to build `generateMetadata`.
That data was then thrown away, and the client component fetched the same
thing again -- so the first HTML a browser or crawler received was a
loading spinner.

Now that record is passed straight into the client as `initialSeller`, so
the seller's name, bio, avatar and verification state are **in the markup
before it leaves the server**.

**This costs no extra request.** Next dedupes identical `fetch()` calls
within a single request, so `generateMetadata` and the page share one
round trip.

## Why it matters

- **Real visitors** see the profile immediately instead of a spinner
  while the JS bundle downloads, parses and runs. On a phone on mobile
  data that gap is substantial.
- **Crawlers that do not execute JavaScript** now get real content.
  Google runs JS, but it indexes server-rendered HTML faster and more
  reliably -- and it is not the only crawler that matters.

## It is a seed, not a replacement

The client still fetches on mount. Everything live -- follower counts, the
gallery, whether the viewer has purchased, review data -- arrives exactly
as before and overwrites the seeded values.

The only thing removed is the empty first paint.

`sellerUser`, `bio` and `isVerified` are seeded because those are what
the header renders first. The loading gate (`!sellerUser && !hasLoaded`)
is now false immediately when server data exists, so the spinner is
skipped entirely -- while a direct client-side navigation, where there is
no seed, still shows it correctly.

## Ship

```powershell
npx tsc --noEmit
git add "src/app/sellers/[username]" src/hooks/useSellerProfile.ts
git commit -m "Seller shops: pass server-fetched profile into first render"
git push origin main
```

## Verify in ten seconds

```powershell
curl.exe -sL https://pantypost.com/sellers/testseller | Select-String "Loading profile"
```

**No match** is the result you want -- it means the server is sending the
profile rather than a spinner.

Then, to see the content is really there:

```powershell
$html = curl.exe -sL https://pantypost.com/sellers/testseller
[regex]::Matches($html, 'testseller') | Measure-Object | Select-Object Count
```

Several matches means the username is in the server HTML, not just the
title tag.

## Next, if you want to keep going

`/browse/[id]` has the same shape -- its wrapper fetches the listing for
metadata and then discards it. Same three-file change, same payoff, on
the page buyers actually land on from search.
