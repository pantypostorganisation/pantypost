# Browser tab: rounded, not square

4 files. Frontend only. Extract into the repo root; Replace when asked.

## Why the tab stayed square

Chrome was loading **`favicon.ico`** -- the one file deliberately left
square, because the ICO format cannot carry transparency reliably in
older browsers.

It was doing that because `layout.tsx` still listed `/favicon.ico` in the
icon array, and Chrome prefers `.ico` when it is offered. So every other
surface got the rounded PNG and the tab got the square one.

## The fix

**`.ico` removed from `metadata.icons`.** Every browser still in use
handles PNG favicons. The file stays in `public/` -- browsers old enough
to genuinely need it will still find it at the conventional
`/favicon.ico` path without being told about it.

**Three small sizes added** -- 16, 32 and 48px, rounded, built at those
dimensions rather than downscaled from 512 on the fly. That matters here:
browser downscaling softens an 18% corner radius into mush at 16px.

## Files

- `src/app/layout.tsx` -- icon list updated
- `public/icons/icon-16x16.png`
- `public/icons/icon-32x32.png`
- `public/icons/icon-48x48.png`

## Ship

```powershell
npx tsc --noEmit
git add src/app/layout.tsx public/icons
git commit -m "Tab icon: use rounded PNGs instead of square .ico"
git push origin main
```

Then hard-refresh **and** check an incognito window -- Chrome caches
favicons aggressively, and it is easy to think this has not worked when
it has. If it is still square in incognito after the deploy finishes,
tell me and I will look again.
