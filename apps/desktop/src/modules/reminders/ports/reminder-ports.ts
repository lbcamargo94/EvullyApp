import type { LocalDate, QuietHours, ReminderPreference, ReminderType } from '@evully/domain';

/** The channel of this version; others come in Phase 2 (README §25). */
export const DESKTOP_CHANNEL = 'desktop';

export interface ReminderEvent {
  id: string;
  profileId: string;
  type: ReminderType;
  localDate: LocalDate;
  shownAt: string;
}

/** Every query is scoped by profile (README §6.1). */
export interface ReminderRepository {
  /** Latest preference of each type; quiet hours from the latest change. Empty when never saved. */
  current(
    profileId: string,
  ): Promise<{ preferences: ReminderPreference[]; quietHours: QuietHours | null }>;
  /** Adds one row per type (history, README §28); earlier rows never change. */
  save(
    profileId: string,
    rows: { id: string; preference: ReminderPreference }[],
    quietHours: QuietHours | null,
    now: string,
  ): Promise<void>;
  /** Types shown on `date`. */
  shownOn(profileId: string, date: LocalDate): Promise<ReminderType[]>;
  /** Records a reminder shown; false when that type was already shown that day. */
  recordShown(event: ReminderEvent, now: string): Promise<boolean>;
  /** Profiles whose current preferences have at least one reminder on. */
  profilesWithReminders(): Promise<string[]>;
}

/** What the operating system shows; the text never carries numbers (README §25). */
export interface ReminderNotice {
  profileId: string;
  title: string;
  body: string;
  /** Screen opened when the notice is clicked. */
  route: string;
}

export interface Notifier {
  show(notice: ReminderNotice): void;
}
