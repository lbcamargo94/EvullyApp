import { useOptimistic, useRef, useTransition } from 'react';

/**
 * An on/off control that saves on change (DESIGN.md §6): shows the new state
 * at once, keeps focus (never disabled while saving) and ignores clicks until
 * the save returns. When the save fails, it falls back to the saved state;
 * `save` reports its own errors and must not throw.
 */
export function useSavedToggle(
  saved: boolean,
  save: (next: boolean) => Promise<unknown>,
): [shown: boolean, toggle: (next: boolean) => void] {
  const [shown, setShown] = useOptimistic(saved);
  const [, startTransition] = useTransition();
  const saving = useRef(false);

  const toggle = (next: boolean) => {
    if (saving.current) return;
    saving.current = true;
    startTransition(async () => {
      setShown(next);
      try {
        await save(next);
      } catch {
        // `save` shows the message; the control returns to the saved state.
      } finally {
        saving.current = false;
      }
    });
  };
  return [shown, toggle];
}
