# Seller shop page: UI fixes

11 files, frontend only. Extract into the repo root; Replace when asked.
All parse clean.

## The two things you spotted

**The "View" buttons were orange text on an orange fill.** Third time
this exact bug has appeared in this codebase, so worth stating the cause
plainly:

`globals.css` declares `a { color: var(--color-primary) }` **outside any
cascade layer**. Tailwind utilities live inside `@layer utilities`, and
unlayered rules beat layered ones regardless of specificity. So
`text-black` on an `<a>` loses, every time.

The fix is the same as elsewhere: the label goes in a `<span>` (nothing
unlayered targets span) plus an inline style on the link as a belt-and-
braces guard.

**The permanent fix is still outstanding** -- wrapping the element
selectors in `globals.css` in `@layer base {}` would end this whole class
of bug. Your design notes already flag it. It is a small change with a
site-wide blast radius, so it deserves its own batch.

**The tier badge looked squished** because it sat at `-bottom-2 -right-2`,
overlapping the avatar's own 4px border. Moved to `-bottom-3 -right-3` so
it clears the border and sits on the corner rather than inside it.

## Everything else on the page

Swept all 11 components: pills to rounded rectangles (genuine circles
left alone), `rounded-xl`/`2xl`/`3xl` down the scale, raw hex to tokens.
Zero banned radii remain.

## Three near-misses worth knowing about

The gradient sweep tried to flatten things that were **not** surfaces:

- **The cover photo scrim** in `ProfileHeader` -- flattening it to a solid
  fill would have blacked out the cover image entirely. Restored as a
  gradient, because that is what a scrim is.
- **The gallery caption scrim** in `ProfileGallery` -- same problem, an
  opaque bar across the bottom of every gallery image. Restored.
- **The Subscribe and Tip CTAs** -- flattened to grey while keeping black
  text, i.e. invisible buttons. Restored as solid `bg-primary`.

The rule that came out of it: a gradient over a *surface* is decoration
and should go; a gradient over a *photo* is a scrim and is doing real
work.

## Ship

```powershell
npx tsc --noEmit
git add src/components/seller-profile
git commit -m "Seller shop: fix View button contrast, badge position, tokens and radii"
```

Check the shop signed out and signed in -- the gallery only renders for
signed-in viewers, so both paths matter.

## Also on this page, not done

The stats row ("No reviews yet, 41 sales, 3 items, 10 months on Panty
Post") runs as one bullet-separated line. It reads fine at desktop width
but wraps awkwardly narrow. Same pattern I cut on the order cards. Say
the word.
