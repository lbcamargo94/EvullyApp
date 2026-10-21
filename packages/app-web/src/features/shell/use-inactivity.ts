import { createIdleTimer } from '@evully/app-core';
import { useEffect } from 'react';

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const;

/** Calls `onIdle` after `minutes` without user activity; 0 disables it. */
export function useInactivity(minutes: number, onIdle: () => void): void {
  useEffect(() => {
    const timer = createIdleTimer(minutes, onIdle, {
      setTimeout: (callback, ms) => window.setTimeout(callback, ms),
      clearTimeout: (handle) => window.clearTimeout(handle as number),
    });
    if (minutes <= 0) return;
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, timer.activity, { passive: true });
    }
    return () => {
      timer.stop();
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, timer.activity);
    };
  }, [minutes, onIdle]);
}
