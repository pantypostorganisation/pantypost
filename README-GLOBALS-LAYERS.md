# globals.css: end the unlayered-CSS bug class

One file. Frontend only. Validated with a real CSS parser (postcss), not
by eye.

## What this fixes

Three separate bugs in this project traced to the same cause:

1. **Orange text on an orange button** -- three times, most recently the
   "View" buttons on seller shops.
2. **The messaging composer's bottom padding vanishing on desktop** --
   `sm:py-5` set the top and had its bottom silently discarded.
3. **An invisible orange link** on a coloured background, per your design
   notes.

The cause in every case: `globals.css` declared element and helper rules
**outside any cascade layer**. Unlayered CSS beats layered CSS regardless
of specificity, and Tailwind's utilities live in `@layer utilities`. So:

- `a { color: var(--color-primary) }` defeated every `text-*` on a link
- `.safe-bottom { padding-bottom: ... }` defeated every `py-*`/`pb-*`

Each was patched locally -- an inline style here, a wrapper `<span>`
there, padding moved to an inner element. This removes the cause.

## What changed

**`@layer base`** now wraps `html`, `body`, `#__next`, `h1-h4`, `p`, `a`
and `a:hover`. They remain defaults -- a bare `<a>` is still orange -- but
a utility now wins, which is the behaviour every developer already
assumes.

**`@layer utilities`** now wraps `.safe-top`, `.safe-bottom` and
`.safe-inset`. They still clear the iOS home indicator; an explicit
padding utility can now override them.

## What deliberately did NOT change

The 50-odd component classes -- `.card`, `.pill`, `.modal-content`,
`.custom-scrollbar`, `.btn-approve` and so on -- **stay unlayered on
purpose**. They are opinionated components meant to beat a stray utility,
and layering them would change behaviour across the whole site. Only the
element defaults and the safe-area helpers were the problem.

The existing workarounds (inline `style={{ color: '#000' }}`, labels in a
`<span>`) stay correct and harmless. They simply stop being necessary for
anything written from here on.

## Ship, then look at it

```powershell
npx tsc --noEmit
git add src/app/globals.css
git commit -m "globals.css: move element defaults into @layer base"
```

**This is the change most likely to reveal something unexpected**, since
some styling may currently depend on those rules winning. Worth a pass
over:

- **any page with links** -- they should still be orange by default
- **the messaging composer on a phone** -- it must still clear the home
  indicator
- **headings** -- the tighter letter-spacing should still apply
- **buttons containing links** -- these should now be correct WITHOUT
  their inline-style workarounds, which is the whole point

If a link somewhere has gone the wrong colour, that is a place where a
utility is now correctly winning and the markup wanted the old
behaviour -- a one-class fix, and a genuine improvement in that it is now
visible rather than silent.
