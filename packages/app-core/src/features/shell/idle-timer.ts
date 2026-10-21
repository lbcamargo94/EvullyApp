/** Timer functions, injected so the logic runs (and is tested) without a browser. */
export interface TimerApi {
  setTimeout(callback: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

const MS_PER_MINUTE = 60_000;

/**
 * Calls `onIdle` after `minutes` without activity (README §8.10, criterion 18).
 * Each `activity()` restarts the countdown; 0 minutes never fires.
 */
export function createIdleTimer(minutes: number, onIdle: () => void, timers: TimerApi) {
  let handle: unknown = null;
  const start = () => {
    if (minutes <= 0) return;
    if (handle !== null) timers.clearTimeout(handle);
    handle = timers.setTimeout(onIdle, minutes * MS_PER_MINUTE);
  };
  start();
  return {
    activity: start,
    stop: () => {
      if (handle !== null) timers.clearTimeout(handle);
      handle = null;
    },
  };
}
