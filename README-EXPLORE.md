# Explore page cleanup

One file: `src/app/explore/page.tsx`. Frontend only. Extract into the repo
root so `src/` merges; Replace when asked.

Typechecked clean against stubs modelling the real hook/service contracts.
Run `npx tsc --noEmit` in the repo before committing anyway.

## What was wrong

The page had drifted badly off the design system:

- **81 raw hex values** (`#1a1a1a`, `#333`, `#444`, `#222`, `#111`, `#0a0a0a`)
- **An off-brand orange** — `#ff6b00` in 8 places. There is only one orange
  family (`#ff950e` / `#ffa733` / `#e0850d`); anything else is a bug.
- **26 pill shapes** (`rounded-full`) on buttons, tabs, chips and inputs
- **10 banned radii** (`rounded-xl` / `rounded-2xl`)
- **5 gradients on flat surfaces**, including the page background and every
  post card

## What changed

**Tokens.** Every hex is gone — zero remain. Surfaces use
`bg-surface` / `bg-surface-raised` / `bg-surface-overlay`, borders use
`border-line` / `border-line-strong`, text uses `text-ink-muted` /
`text-ink-faint`, brand uses `bg-primary` / `hover:bg-primary-hover` /
`active:bg-primary-press` / `bg-primary-soft` / `border-primary-line`.

**Pills → rounded rectangles.** Buttons, feed tabs, badges, the comment
input and the tag chip are now `rounded-md` / `rounded-sm`. The 12
remaining `rounded-full` are legitimate circles only — avatars, carousel
dots, and circular icon buttons — which your design rules allow.
`rounded-xl` / `2xl` collapsed to `rounded-lg`.

**Gradients removed** from the page background, post cards, the create
modal, the avatar fallback and the guest banner. Flat surfaces, per the
design rules.

**Sticky filter bar.** The Latest / Trending / Following tabs now stick
below the site header with a blurred backdrop, so filters stay reachable
in a long feed.

**Skeletons instead of a spinner.** Three placeholder cards matching the
real card footprint, so nothing jumps when posts land and a sparse feed
still looks deliberate while loading. Hidden from screen readers.

**A real empty state.** Every branch now explains why it is empty *and*
exits somewhere: "See latest posts" when a tag or Following filter is
empty, "Create your first post" for sellers, "Browse listings" for
buyers. The old one ended on a dead sentence, which on a pre-launch feed
reads as broken rather than new.

**Load more button.** The infinite-scroll observer still works, but there
is now an explicit control (and an "You're all caught up" end state).
Pure infinite scroll loses scroll position on back-navigation and makes
the footer unreachable — measurably worse for goal-directed browsing.

**Feed semantics.** `role="feed"` with `role="article"` children and
`aria-busy` while appending — the ARIA pattern for a dynamically
extended stream.

## Deliberately NOT changed

- **Single-column layout.** The research favours a uniform grid for
  *shop-driving image discovery*, but this feed carries comments, video
  players and multi-image carousels — content that belongs in a single
  column (the Threads/Bluesky model). Converting to a grid would break
  those interactions and is a rewrite, not a cleanup. Worth revisiting
  only if Explore is re-scoped to pure discovery.
- **The video player, carousel, follow and comment logic** — untouched.
  This was a visual and structural pass, not a behaviour change.

## Worth doing next

- `linkedListing` exists on the Post model but is never surfaced in the
  UI. Rendering it as a "Shop this post" card is the single biggest
  shop-driving win available here, and the data is already there.
- The page is one 1,200-line file with four components in it
  (`VideoPlayer`, `FollowButton`, `PostCard`, `CreatePostModal`). Splitting
  into `src/components/explore/*` would match the rest of the codebase.
- Post images have no alt text. Seller captions could supply it.

## Verify + ship

```powershell
npx tsc --noEmit
git add src/app/explore/page.tsx
git commit -m "Explore: design tokens, rounded rectangles, sticky filters, skeletons, real empty state"
```

Frontend only — Vercel deploys on push, no VPS step.
