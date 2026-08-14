# Footer link to /blog + the hero copy that never deployed

One file: `src/utils/homepage-constants.ts`. Frontend only. Parses clean.

## 1. /blog is linked now

Added **Guides** to `FOOTER_LINKS`. Without it, `/blog` would have been
orphaned in exactly the way its two guides were -- nothing on the site
pointed at them, Google crawled both and declined to index either. A
footer link appears on every page, which is the cheapest possible fix.

Apply this together with the blog zip, or the new index page has nothing
pointing at it.

## 2. The hero batch never made it in

This file confirmed it: `titleEnd` was still `'Marketplace'`, the
description was still the old buyer-only copy, and `TRUST_BADGES` still
contained **"Encrypted"**. So that whole zip was never extracted. All
three are applied here.

**H1:** `The Ultimate Marketplace` -> **`The Ultimate Marketplace for Used
Panties`**. Same three-part structure, same orange highlight, no layout
change. It is the strongest on-page ranking signal you have, organic is
the only channel available to an adult marketplace, and the old version
contained no keyword at all -- while contradicting the page's own title
tag. The two strongest signals on the page now agree.

**Description:** now leads with the buyer promise and then states the
seller economics ("Sellers keep 90% of every sale and can list the same
day"). Sellers are the priority and their case was buried at the bottom
of the page.

**Trust badges:** four generic claims replaced with four specific,
checkable ones -- every listing reviewed, ID-verified sellers, sellers
keep 90%, complaints answered in five days. All four are verifiable in
your own code or published policies.

**"Encrypted" was dropped on purpose.** `design-system-notes.md` flags it
as an unverified claim that should be checked against how messages are
actually stored *before a processor asks*. Do not restore it without that
check.

## Ship

```powershell
npx tsc --noEmit
git add src/utils/homepage-constants.ts
git commit -m "Footer link to /blog; hero copy and trust badges"
git push origin main
```

## Still outstanding

**The `View all ->` mojibake on the homepage** is not in this file -- it
is clean. It will be in whichever component renders that link, most
likely `FeaturedRandom.tsx` or a homepage section. Send that file and it
is a one-character fix.

**`TrustSignalsSection.tsx` declares its own copy of `TRUST_SIGNALS`**
(with badge images) and is the version that actually renders. The
constant here is kept in step deliberately, but if you change one, change
the other.
