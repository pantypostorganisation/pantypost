# Explore: working Follow + bigger avatar

Four files. **Requires the previous `pantypost-explore.zip` applied first**
(this contains the cleaned page plus these changes, so extracting this
over it is correct either way).

Extract into the repo root so `src/` and `pantypost-backend/` merge.

## Deploy order matters — backend FIRST

New endpoints. Frontend calling them before they exist = 404s.

```
# VPS
cd /var/www/pantypost/pantypost-backend
git pull origin main
pm2 restart pantypost-api
```
then push the frontend.

## What was broken

**1. "Follow" was charging money.** The button called
`/subscriptions/subscribe/{username}` — the PAID monthly subscription
endpoint. A button labelled "Follow" with a person-plus icon was
attempting to charge the buyer's wallet. Unexpected charges are the
fastest route to chargebacks, which is what terminates adult merchant
accounts.

**2. It reported success when it failed.** `await apiCall(...)` then
`setIsFollowing(true)` with no check on `response.success` — and your
`apiCall` resolves `{ success: false }` rather than throwing. A failed
call still rendered "Following".

**3. The API never said whether you already follow someone.**
`enrichPostsWithAuthorInfo` returned username / pic / verified / tier /
bio and nothing about follow state, so every card rendered "Follow" even
for sellers you already follow.

## What's here

**`models/Follow.js` (NEW)** — a free, one-way follow, deliberately
separate from `Subscription` (paid, monthly, unlocks premium content).
Unique compound index on `{follower, following}` so two rapid taps can't
create duplicates. Helpers for the following list, follower counts, and
a one-query `getFollowedSet` for a whole feed page.

**`routes/post.routes.js`**
- `POST /api/posts/follow/:username` — follow. Idempotent (a duplicate
  returns success, not a 500). Rejects self-follow and unknown users.
- `DELETE /api/posts/follow/:username` — unfollow. Idempotent.
- `GET /api/posts/follow/:username/status` — follow state + follower count.
- `enrichPostsWithAuthorInfo` now takes the viewer and returns
  `isFollowing` per post, resolved in ONE query per page.
- `/feed` now optionally identifies the viewer (still public — anonymous
  just gets `isFollowing: false`) so cards render the right state.
- **`/following/feed` = free follows UNION active paid subscriptions.**
  Paying for someone implies wanting their posts, so existing subscribers
  keep the feed they had and nobody's Following tab empties on deploy.

These live on the posts router because Explore is the only consumer and
a new router would mean editing `server.js` (not in this batch). If
follows spread to profiles or drop notifications, move them to
`follow.routes.js`.

**`services/explore.service.ts`** — `followUser` / `unfollowUser` /
`getFollowStatus`, and `isFollowing?` on the `Post` type. These throw on
failure so the UI can't silently lie.

**`app/explore/page.tsx`**
- FollowButton uses the free endpoints, only changes state on real
  success, and shows "Could not follow" for 3s on failure.
- Seeds from `post.isFollowing`, and re-syncs if it changes.
- **Author avatar 48px → 56px**, intrinsic image size and fallback
  initial scaled to match (a 48px image in a 56px box would be blurry).
- Avatar alt text is now "{author}'s profile picture" rather than the
  bare username.

## Test

1. Log in as a buyer, open Explore. Cards for sellers you don't follow
   say **Follow**.
2. Click one → becomes **Following** immediately. Reload → still
   **Following** (this is the bit that never worked).
3. Switch to the **Following** tab → that seller's posts appear.
4. Click **Following** → unfollows; the tab empties again.
5. Confirm your wallet balance is UNCHANGED throughout — following is
   free now. (Paid subscriptions still live on seller profiles.)
6. Logged out: the button routes to /login instead of acting.

## Found while in here (NOT fixed — needs a file I don't have)

`sendNotification` in `post.routes.js` creates notifications with
`{ userId: user._id, ... }`, but the `Notification` model keys on
**`recipient`**, and its `type` enum is validated. So like/comment
notifications are almost certainly failing validation silently today
(the helper catches and logs). Follow notifications will do the same
until it's fixed — the follow itself still succeeds, by design.

Send `pantypost-backend/models/Notification.js` and I'll fix the helper
and add `follow` to the enum properly.
