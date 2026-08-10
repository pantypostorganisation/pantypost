# Counter audit — one real bug found and fixed

Two files, frontend only. Extract into the repo root; Replace when asked.

## Verdict

The counters were NOT safe. They replay from zero **every 60 seconds**,
and it is still happening on production right now — it is just easy to
miss unless you happen to be looking at the homepage when the interval
fires.

## The bug: a stale closure in the refresh interval

```js
const fetchStats = useCallback(async () => {
  ...
  if (!hasInitialLoad) {        // <-- reads a captured value
    setDisplayValue(0);
    animateValue(0, total, 2000);   // count up from zero
    setHasInitialLoad(true);
  } else {
    updateValue(total, true);       // tick from current to new
  }
}, [animateValue, hasInitialLoad, updateValue]);

useEffect(() => {
  fetchStats();
  const refreshInterval = setInterval(() => fetchStats(), 60000);
  ...
}, []);                          // <-- empty deps
```

The effect's dep array is empty, so the interval permanently holds the
**first** `fetchStats` — the one created on the very first render, whose
closure captured `hasInitialLoad === false`. `setHasInitialLoad(true)`
updates the state and creates a *new* `fetchStats`, but the interval
never sees it.

So every 60 seconds the refresh takes the "initial load" branch: display
resets to 0 and animates back up over 2 seconds. Exactly the behaviour
you noticed.

Both counters have it. `AnimatedUserCounter` is less obvious because its
initial branch uses `springValue.set()` (no animation), so it snaps
rather than counts — but it still hard-resets the value every minute.

**Fix:** branch on `hasInitialLoadRef.current` (a ref, always current)
instead of the captured state, and have the interval call
`fetchStatsRef.current()` so it always runs the latest callback. The
state variable is kept for rendering.

## Second issue: subscription churn

The websocket effect depended on `[user, authenticatedWebSocket,
publicWebSocket, updateValue]`. The context objects are not
identity-stable across provider re-renders, and `updateValue`'s identity
changed whenever `hasInitialLoad` flipped — so the effect tore down and
rebuilt the subscription repeatedly, each time waiting **1 second**
before re-subscribing. Any `stats:*` event landing in those gaps was
silently dropped.

Same disease as the messaging typing indicator. Fixed the same way: the
updater is reached through a ref, and the effect is keyed on `[user]` —
which is what actually decides *which* socket to use.

## Behaviour after this change

- **On open:** counts up from 0 once. Unchanged, and intended.
- **After that:** only moves when the number actually changes, animating
  from the previous value to the new one (68 -> 69 ticks by one; it does
  not restart).
- **A refresh returning the same number does nothing** — the
  `Math.abs(increment) > 0.01` guard was already correct and is untouched.
- **A remount still counts from 0** (e.g. navigating away and back).
  That is deliberate: it is a fresh page view.

## Verify

```powershell
npx tsc --noEmit
```

Then open the homepage and leave it for **three minutes** without
touching it. Before this fix, both counters visibly reset and re-counted
at 60s, 120s and 180s. After it, they should sit perfectly still.

The console makes it explicit: you should see `Fetching stats...` every
60 seconds, but `Animating: {from: 0, ...}` only ONCE, at page load.
Any later `from: 0` means a replay slipped through — tell me.

```powershell
git add src/components/homepage/PaymentsProcessedCounter.tsx src/components/homepage/AnimatedUserCounter.tsx
git commit -m "Counters: fix 60s replay from stale closure; stabilise websocket subscription"
```

## Worth knowing

Both files log heavily on every fetch and every event. Harmless, but it
is noise in a production console and it tells a visitor exactly how your
stats pipeline works. Worth stripping when convenient.
