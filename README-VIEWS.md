# View count audit: it was counting every request

2 files. **Backend deploys FIRST** (the fix lives there).

```
cd /var/www/pantypost/pantypost-backend
git pull origin main
pm2 restart pantypost-api
```

## What was wrong

`POST /api/listings/:id/views` incremented on **every request, with no
deduplication whatsoever**:

```js
const listing = await Listing.findByIdAndUpdate(
  listingId,
  { $inc: { views: 1 } },   // no check on who, or how recently
  { new: true }
);
```

Three consequences, in order of seriousness:

**1. Anyone could inflate any listing.** A loop against that endpoint
would push a view count to whatever number you liked. On a marketplace
where views are the seller's main signal of interest -- and a number you
show them -- that has to mean something.

**2. Development counted double.** `reactStrictMode` is not set in
`next.config.ts`, so Next defaults it to **true**: React deliberately
mounts effects twice in dev. That is the +2 you saw on a forced reload.
It is a dev-only behaviour, but the endpoint made it permanent by
counting both.

**3. The client force-counted on bfcache restore and popstate.** Tabbing
away and back, or pressing back into a listing you had already seen,
counted a fresh view every time -- `trackView({ force: true })`
deliberately cleared the guard.

## The fix

**Server-side deduplication** (`listing.routes.js`) -- a view counts at
most once per viewer per listing per **30 minutes**. The viewer is the
logged-in username where there is one, otherwise a **SHA-256 hash of IP +
user agent**, so no raw IP is stored.

Repeat requests inside the window return the current count with
`counted: false`, so the UI still shows the right number without
incrementing.

Fixed on the server on purpose: the client can always be bypassed, and a
future caller would otherwise reintroduce the bug for free.

**Client no longer force-tracks** (`useBrowseDetail.ts`) -- returning to
the same listing via back/forward is the same person looking at the same
thing. The tracking effect still fires normally when the listing actually
changes.

## Trade-offs, stated plainly

The window is held **in memory**, not in Mongo. A `pm2 restart` clears
it, and a second backend instance would keep its own. For a soft metric
like views that is a reasonable trade against a schema change and an
extra collection -- but if you ever run more than one API process, or
want views to be properly auditable, this wants to move to Redis or a
collection with a TTL index.

Guests behind the same NAT (an office, a household) share a fingerprint
and will collapse into one view. Imperfect, but far better than counting
every request.

## Test

- Reload a listing 5 times in 30 seconds -> the count goes up **once**.
- Tab away and back -> no change.
- Back/forward to the same listing -> no change.
- Open in an incognito window -> +1 (different fingerprint), which is
  correct.
- 30 minutes later, reload -> +1 again.

## Note on existing numbers

Counts already in the database include the inflated ones. If any listing
matters commercially, worth resetting before you point a creator's
audience at it:

```js
// mongosh, pantypost
db.listings.updateMany({}, { $set: { views: 0 } })
```
