import type { ReminderOpen } from '@evully/contracts';

/**
 * The screen a clicked notification asked for, kept in the main process until
 * the window reads it once (no path or data from the renderer).
 */
export class ReminderOpenBox {
  private pending: ReminderOpen = null;

  set(open: NonNullable<ReminderOpen>): void {
    this.pending = open;
  }

  take(): ReminderOpen {
    const open = this.pending;
    this.pending = null;
    return open;
  }
}
