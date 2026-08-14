# Favicon: black background

20 image files. Frontend only. Extract into the repo root and **Replace
all** -- every one of these overwrites an existing file at the same path.
No code changes.

## What was actually wrong

`favicon.ico` and `favicon.png` in `public/` were already dark. They were
not the problem, because **they were not being used.**

In the Next.js App Router, `src/app/icon.png` takes priority over
anything in `public/` -- and that file was **transparent**. So was every
icon in `public/icons/`. Google composites a transparent favicon onto its
own background, which on dark mode is near-black, so a near-white
wordmark on transparent came out as the washed-out blob in your
screenshot.

Rebuilt from `icon-512x512.png` (the largest source) so nothing is
upscaled.

## Two things worth knowing about how they were built

**Fully flattened, no alpha channel.** The source artwork is antialiased,
so simply pasting it onto a black canvas leaves edge pixels at partial
transparency -- my first attempt came out at alpha 191, still slightly
see-through. These are saved as RGB with no alpha at all, so nothing can
composite them against anything.

**Padding, because Google crops to a circle.** The source art runs edge
to edge horizontally with zero side margin. Dropped straight onto a
square, a circular crop would have sliced the P and the Y clean off. The
standard set uses 14% padding; the maskable set uses 22%, since Android's
safe zone is only the middle 80%.

## Files

| Path | Why |
|---|---|
| `src/app/icon.png` | **the one that matters** -- what Google reads |
| `public/favicon.ico` | multi-res (16/32/48/64/128/256) for older browsers |
| `public/favicon.png` | 144px |
| `public/icon.png` | 512px |
| `public/icons/icon-*.png` | 8 sizes, PWA manifest |
| `public/icons/icon-maskable-*.png` | 8 sizes, Android home screen |

## Ship

```powershell
git add src/app/icon.png public/favicon.ico public/favicon.png public/icon.png public/icons
git commit -m "Icons: black background, opaque, circle-safe padding"
```

## Do not expect an instant change in Google

Google caches favicons hard -- days to weeks, and there is no way to
force it beyond having the file live and waiting for a recrawl. Your
browser tab will update immediately after a hard refresh
(Ctrl+Shift+R); the search result will lag.

## Two other things I noticed on the live site

**The homepage hero never deployed.** pantypost.com is still serving "The
Ultimate Marketplace" without "for Used Panties", "Trusted by Loading
users", and the old Secure & Private / Verified Sellers / Safe Payments /
**Encrypted** badges. That batch is sitting unapplied.

**There is mojibake in production:** the homepage renders `View all â†’`
-- a corrupted arrow, from the encoding damage we traced earlier. It is
in whichever component renders that link, most likely
`homepage-constants.ts` or the featured section.
