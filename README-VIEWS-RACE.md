# View count: the actual fix

1 file. **Backend only.** Replaces the previous views zip.

```
cd /var/www/pantypost/pantypost-backend
git pull origin main
pm2 restart pantypost-api
```

## Why the first fix did not work

My dedupe was right in shape and wrong in order. It did check-then-set
with an `await` in the middle:

```js
const lastSeen = recentViews.get(key);   // both requests: nothing there
if (lastSeen && ...) return;             // neither bails
await Listing.findByIdAndUpdate(...)     // BOTH increment
recentViews.set(key, now);               // both write it, too late
```

React StrictMode fires its two effects in the **same tick**, so the two
requests arrive milliseconds apart. Both read an empty map before either
wrote to it. A time window blocks a *later* request; it does nothing
about a *simultaneous* one -- which is exactly the case StrictMode
creates.

**The fix is one line moved.** The key is now reserved **before** any
`await`. Node is single-threaded, so everything from reading the map to
claiming it runs without interruption -- the second request sees the
claim and bails, however close behind it is.

The reservation is released if the listing turns out not to exist, so a
404 cannot suppress a later genuine view.

## The counter was innocent

`AnimatedViewCounter` only renders the value it is handed -- no local
increment, no optimistic bump. Worth confirming, since a display-side
`+1` would have looked identical from the outside.

## If it STILL doubles after this

One possibility left: **PM2 running in cluster mode.** Each process would
keep its own in-memory map, so two workers could each count the same
view. Check with:

```bash
pm2 list
```

If the `pantypost-api` row shows more than one instance (or mode
`cluster`), tell me -- the dedupe then has to move to Redis or a Mongo
TTL collection, since in-memory state cannot be shared between processes.

Single instance in `fork` mode, which is the default, and this is solid.

## Test

- Hard reload a listing 5 times inside 30 minutes -> **+1 total**.
- DevTools Network, filter `views`: on the second request the response
  should read `counted: false`.
- Incognito window -> +1, correctly (different viewer).

## Existing counts

Numbers already in the database include everything counted while this was
broken. Worth zeroing before pointing a creator's audience at a listing:

```js
// mongosh, pantypost
db.listings.updateMany({}, { $set: { views: 0 } })
```
