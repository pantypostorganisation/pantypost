# Verification UI: stop announcing what is already done

3 files, frontend only. Extract into the repo root; Replace when asked.
All parse clean.

## First, a correction

I told you twice that nothing in your codebase touched Didit. That was
wrong -- I grepped for "didit" against a partial checkout assembled from
bundles, not the real tree. `services/ageAssurance/` is a complete, real
integration: session creation against `/v3/session/`, decision polling,
HMAC-SHA256 webhook verification with timing-safe comparison, status
mapping that fails closed, and deliberate data minimisation. The
conclusion I drew from that bad grep -- that `/age-verification` claims
something the code does not do -- was also wrong. The page is accurate.

## 1. The repeated prompting was a caching bug

`AgeGate` wraps `children` **per route** in `ClientLayout`, and its
effect calls `getStatus()` on every mount. So an already-approved user
was re-checked against the API on **every navigation to a gated page**,
seeing the gate's loading state each time before it concluded they were
fine.

`ageVerification.service.ts` now caches a settled **approved** result for
the session. `pending` and `in_review` are deliberately NOT cached --
those genuinely transition, and the UI has to see it happen. `refresh()`
invalidates, since it asks the provider directly.

`AuthContext.logout()` clears it, or the next account signed in on that
device would inherit the previous user's verified state.

## 2. The header badge now appears only when there is something to do

**"Get Verified" stays. "Verified!" is gone.**

The distinction is whether it is actionable. "Get Verified" unlocks
listings and auctions, so it earns a permanent slot. "Verified!" told a
seller something they already knew, on every page, forever -- in a header
that runs out of room at laptop widths, which we spent a batch fixing.

Settled status belongs on the profile, which is where someone goes to
check their own standing.

**It was also rendering a broken image.** The badge used
`/verification_badge.png`, which 404s -- so a verified seller saw a broken
image icon announcing their verification. Both the desktop and mobile
menu entries now use a lucide `ShieldCheck`. Zero references to that
asset remain in the header.

## What I did NOT do

**Age verification stays out of the UI entirely once approved.** It is a
gate, not an achievement -- the correct behaviour after approval is
silence. It only looked noisy because of the caching bug above.

**I did not add verification status to the profile pages.** Both profiles
already have their own structure and I did not want to guess where it
belongs. If you want it there, say which page and I will add a single
line rather than a panel.

## Ship

```powershell
npx tsc --noEmit
git add src/services/ageVerification.service.ts src/components/Header.tsx src/context/AuthContext.tsx
git commit -m "Verification UI: cache age status, hide header badge once verified"
```

Test: sign in as a verified seller and navigate between several gated
pages. No verification flash, and no badge in the header. Then an
unverified seller -- "Get Verified" should be present on both desktop and
the mobile menu.
