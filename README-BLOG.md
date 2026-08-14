# /blog index + the real reason the guides were not indexed

4 files, frontend only. Extract into the repo root; Replace when asked.
All parse clean.

## The actual finding

Search Console lists both guides as **"Crawled -- currently not
indexed"**. I expected the cause to be the old render gates. It was not.

Both guides set their title and description **inside a `useEffect`**:

```jsx
'use client';
useEffect(() => {
  document.title = 'How to Sell Used Panties Online - Complete 2025 Seller Guide';
  metaDescription.setAttribute('content', '...');
}, []);
```

**Effects do not run for a crawler.** Googlebot fetched both pages and
saw the generic homepage title and description on each -- two pages,
identical metadata, no distinguishing signal. That is a textbook reason
to crawl something and decline to index it.

The `useEffect` was also the *only* thing making them client components.

## What changed

**Both guides are now server components** with real `export const
metadata` -- distinct titles, distinct descriptions, canonicals and
OpenGraph, all present in the HTML before it is sent. The `useEffect`
and `'use client'` are gone; nothing else in either page was touched.

**`/blog` now exists.** It was a hard 404, which left the guides orphaned
-- nothing on the site linked to them, and a page with no internal links
reads as unimportant. The index lists both posts with real titles, dates
and reading times, carries `Blog` + `BlogPosting` JSON-LD, and ends in a
seller-signup CTA.

**`/blog` added to the sitemap.** It was missing because the page did not
exist.

The posts are a plain array in `blog/page.tsx`. Adding a third is one
object plus a folder -- less work than machinery to avoid it. Worth
revisiting at about a dozen.

## One thing still needed: link to it

**Nothing on the site links to `/blog` yet**, so it would be orphaned in
the same way the guides were. It needs a footer link at minimum.

That lives in `src/utils/homepage-constants.ts` (the footer link lists)
which I did not have in this bundle. Send it and I will add "Guides"
alongside Terms / Privacy / Help.

## Ship

```powershell
npx tsc --noEmit
git add src/app/blog src/app/sitemap.ts
git commit -m "Add /blog index; convert guides to server components with real metadata"
git push origin main
```

Then in Search Console, once deployed, request indexing for:
- `https://pantypost.com/blog`
- both guide URLs

They will now present distinct titles and descriptions, which is the
thing that was missing.

## Worth knowing

Both guides still use `rounded-xl`, gradient headings and emoji as icons
(a calendar and a stopwatch in the byline) -- all against your design
rules. I left the bodies completely alone here: this batch is about
indexing, and mixing a styling pass into it would make the diff
unreviewable. Say the word and they are a quick follow-up.
