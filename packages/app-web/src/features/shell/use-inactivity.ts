import { useEffect } from 'react';

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const;
const MS_PER_MINUTE = 60_000;

/** Calls `onIdle` after `minutes` without user activity; 0 disables it. */
export function useInactivity(minutes: number, onIdle: () => void): void {
  useEffect(() => {
    if (minutes <= 0) return;
    let timer = window.setTimeout(onIdle, minutes * MS_PER_MINUTE);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onIdle, minutes * MS_PER_MINUTE);
    };
    for (const event of ACTIVITY_EVENTS) window.addEventListener(event, reset, { passive: true });
    return () => {
      window.clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, reset);
    };
  }, [minutes, onIdle]);
}
