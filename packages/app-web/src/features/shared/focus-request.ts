import { useLocation } from 'react-router';

/**
 * Router state for a link that opens a screen ready to type in (README §33.2:
 * a weighing in a few seconds). The screen puts the cursor in its first field
 * and the shell does not move focus to the content.
 */
export const FOCUS_FORM = { focusForm: true } as const;

export function isFocusRequest(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'focusForm' in state;
}

/** True when the current screen was opened by a link with `FOCUS_FORM`. */
export function useFocusRequested(): boolean {
  return isFocusRequest(useLocation().state);
}
