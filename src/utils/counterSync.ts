// src/utils/counterSync.ts

/* Starts the homepage counters together.
 *
 * AnimatedUserCounter and PaymentsProcessedCounter sit side by side and
 * each fetches its own figure. Matching their durations was never
 * enough: whichever request came back first started animating first,
 * so they finished a beat apart, and the gap moved around with network
 * timing. Adding matched delays only papered over it.
 *
 * So neither starts on its own any more. Each says "I have my number"
 * and hands over a start function; once every expected counter has
 * checked in, they are all fired on the same animation frame.
 *
 * The timeout is the important part. If one counter is absent from a
 * page, or its fetch fails, the other must still run rather than
 * waiting forever for a partner that is never coming.
 */

type StartFn = () => void;

const EXPECTED_COUNTERS = 2;
const SOLO_FALLBACK_MS = 1200;

const waiting = new Map<string, StartFn>();
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

function fireAll() {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }

  const starts = Array.from(waiting.values());
  waiting.clear();

  if (starts.length === 0) return;

  /* One frame's delay so both are scheduled in the same paint. Calling
     them synchronously can still split across frames if the first one
     does enough work. */
  requestAnimationFrame(() => {
    starts.forEach((start) => {
      try {
        start();
      } catch (error) {
        console.error('[counterSync] start failed:', error);
      }
    });
  });
}

/**
 * Register a counter as ready. Fires every registered counter once the
 * full set has checked in, or after the fallback if it never does.
 *
 * Re-registering under the same key replaces the previous function --
 * a counter that refetches before the set completes should animate to
 * its newest figure, not a stale one.
 */
export function registerCounterStart(key: string, start: StartFn): void {
  waiting.set(key, start);

  if (waiting.size >= EXPECTED_COUNTERS) {
    fireAll();
    return;
  }

  if (!fallbackTimer) {
    fallbackTimer = setTimeout(() => {
      fallbackTimer = null;
      fireAll();
    }, SOLO_FALLBACK_MS);
  }
}

/** Drop a pending registration, for a counter unmounting mid-wait. */
export function unregisterCounterStart(key: string): void {
  waiting.delete(key);
  if (waiting.size === 0 && fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
}

/** Shared timing. Both counters must use these or they drift again. */
export const COUNTER_DURATION_MS = 1500;
