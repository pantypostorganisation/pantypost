# layout.tsx: one source of truth for icons

One file. Frontend only. Parses clean.

## What was wrong -- and why `src/app/icon.png` never mattered

`layout.tsx` declared icons in TWO places:

1. `metadata.icons` -- four entries, all pointing at `/favicon.ico`
2. Hand-written `<link rel="icon">` tags in `<head>` -- five more, also
   all `/favicon.ico`

Both override the `src/app/icon.png` file convention. So that file has
never been what Google reads, no matter what was in it.

**The sizes were fiction.** Every entry pointed at one 32x32 `.ico` while
claiming `256x256`, `48x48`, `32x32` and `16x16`. Google reads those size
attributes -- it went looking for a 48 or a 256, found neither, and used a
32px image. That is the washed-out result in your screenshot, and it
would have stayed that way however many PNGs got added.

Two smaller ones: `apple-touch-icon` pointed at a `.ico` (iOS does not
reliably render ICO for home-screen icons), and the JSON-LD publisher
`logo` -- which Google reads for the knowledge panel -- was also the 32px
`.ico`.

## What changed

- **The hand-written `<link>` tags are gone.** Next generates them from
  the metadata export; writing them by hand as well is what made this
  unpredictable. Icons are now changed in exactly one place.
- **`metadata.icons` points at real files at their real sizes** --
  512, 192, 96 as PNG, with `favicon.ico` kept only for older browsers,
  where it is genuinely the right format.
- **`apple` uses a PNG.**
- **JSON-LD `logo` uses the 512px PNG.**

## The images you need to make

Everything above expects these to exist. Sizes are what Google, Android
and iOS actually want:

| File | Size | Used by |
|---|---|---|
| `public/icons/icon-512x512.png` | **512x512** | **Google Search** (the one that matters), JSON-LD logo |
| `public/icons/icon-192x192.png` | 192x192 | Android home screen, apple-touch-icon |
| `public/icons/icon-96x96.png` | 96x96 | browser tabs, small surfaces |
| `public/favicon.ico` | 32x32 | older browsers only |

All four already exist at those paths -- you only need to give them black
backgrounds.

**Rules for the artwork**, since these are the bits that go wrong:

1. **Square.** Not rounded. Google crops to a circle itself; baked-in
   rounded corners leave transparent notches.
2. **Fully opaque, no alpha channel.** Export as RGB. Your current
   `icon.png` has fully transparent corners, which is why Google's own
   background showed through.
3. **Leave ~14% margin** around the wordmark. Your source art runs edge
   to edge horizontally -- without margin, Google's circular crop slices
   off the P and the Y.
4. Background `#000000`, matching your `theme-color`.

The zip I sent earlier (`pantypost-icons.zip`) already contains all of
these built from your 512px source, if you would rather not redo them in
GIMP.

## Ship

```powershell
npx tsc --noEmit
git add src/app/layout.tsx
git commit -m "Icons: single declaration, real sizes, PNG for Google and iOS"
```

Google caches favicons for days to weeks -- the browser tab updates on a
hard refresh, the search result will lag.

## Worth deleting

`src/app/icon.png` can go. With explicit metadata declarations it is
dead weight, and leaving it there invites exactly this confusion again.
