# Buyer pages: bug fix, black depth, glows gone, flags fixed

33 files, frontend only. Extract into the repo root; Replace all.
Supersedes the previous buyer zip. Everything parsed as TS+JSX; the
dashboard was typechecked against the real hook contracts.

## 1. The $0 balance was a real bug -- and it is not only my page

`useDashboardData` calculates the balance from:

```js
storageService.getItem('wallet_transactions')
```

That is **legacy localStorage** from before wallets moved to the backend.
The key is empty now, so the hook returns 0 for everyone, always. The
wallet page looked right only because it uses a different source:
`useWallet().getBuyerBalance(username)`.

The dashboard now reads that same source, so the two pages cannot
disagree.

**Left for you to decide:** `useDashboardData` still exposes its broken
`balance`, and anything else importing that hook inherits the bug. I did
not rewire a 500-line hook inside a styling batch. Worth fixing properly
-- say the word and I will.

## 2. Black with depth, not grey

You were right, and the cause was mine: my earlier sweep mapped a lot of
different near-blacks onto `surface-raised`, so every panel landed on the
same mid-grey and the page flattened into a field of it.

Fixed at the token level in `globals.css`, so every page inherits it:

| Token | Was | Now |
|---|---|---|
| `surface` (page) | `#0a0a0a` | **`#050505`** |
| `surface-raised` (cards) | `#141414` | **`#0e0e0e`** |
| `surface-overlay` (inputs) | `#1c1c1c` | **`#161616`** |
| `surface-hover` | `#222222` | **`#1e1e1e`** |

Smaller steps against a near-black page: layers read as depth rather than
as grey boxes. Not pure `#000` for the page, because it makes the steps
above it look muddy and causes halation against white text.

**This changes every page on the site, not just these.** It should be an
improvement everywhere, but it is the one change here with site-wide
blast radius -- worth a quick look at browse and messages after deploying.

## 3. The glows are gone

Removed across all 30 components:
- Blurred orange blobs (`bg-primary/10 blur-3xl`) behind the dashboard
  header, the wallet card and the profile panels -- several of them
  `animate-pulse`, so they breathed.
- `shadow-[#ff950e]/30` halos on buttons.
- `shadow-2xl` / `shadow-lg` on flat panels: depth now comes from the
  surface step, not from a drop shadow that is nearly invisible on dark
  anyway.

Your design notes already ruled out ambient decoration; these were
left over from the old styling and I should have caught them in the
first pass.

## 4. "AUAustralia" -- a Windows problem, not a data one

`flagFromIso2` built a flag emoji from Regional Indicator Symbols ('AU'
-> U+1F1E6 U+1F1FA). Rendering that as a flag needs the OS to ship flag
glyphs, and **Windows does not**. Chrome on Windows draws the two
indicator letters instead, so the "flag" rendered as `AU` directly
against `Australia`.

It looks fine on iPhone and broken on the desktop you work from, which is
why it seemed intermittent.

Now the helper returns the **ISO code**, rendered as a small bordered
chip beside the country name: `[AU] Australia`. Consistent on every OS,
no font dependency, no network request.

If you want real flag artwork later, `CountrySelect.tsx` already uses
flagcdn.com PNGs -- but that adds an external image dependency and needs
the CSP `img-src` to allow it.

## Verify + ship

```powershell
npx tsc --noEmit
```

Check the dashboard balance now matches the wallet, and look at browse
and messages too, since the token change touches every page.

## Still not structurally rebuilt

`/buyers/[username]` and `/buyers/profile` have the styling, the glow
removal and the flag fix -- but not the structural cut I did on the
dashboard and my-orders.
