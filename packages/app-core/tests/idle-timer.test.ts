import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createIdleTimer, type TimerApi } from '../src/features/shell/idle-timer';

// app-core has no DOM or Node types; the runtime timers (faked by vitest) are used as-is.
const timers = globalThis as unknown as TimerApi;

describe('createIdleTimer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('fires after the chosen minutes without activity', () => {
    const onIdle = vi.fn();
    createIdleTimer(5, onIdle, timers);
    vi.advanceTimersByTime(5 * 60_000 - 1);
    expect(onIdle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it('restarts the countdown on activity', () => {
    const onIdle = vi.fn();
    const timer = createIdleTimer(15, onIdle, timers);
    vi.advanceTimersByTime(14 * 60_000);
    timer.activity();
    vi.advanceTimersByTime(14 * 60_000);
    expect(onIdle).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(onIdle).toHaveBeenCalledOnce();
  });

  it('never fires with 0 minutes or after stop', () => {
    const never = vi.fn();
    createIdleTimer(0, never, timers).activity();
    const stopped = vi.fn();
    createIdleTimer(5, stopped, timers).stop();
    vi.advanceTimersByTime(60 * 60_000);
    expect(never).not.toHaveBeenCalled();
    expect(stopped).not.toHaveBeenCalled();
  });
});
