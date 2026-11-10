import type { LocalDate } from '@evully/domain';

/** Source of "now"; nothing else may read the system clock (README §5.5). */
export interface Clock {
  /** Current instant, ISO 8601 UTC. */
  nowIso(): string;
  /** Current date in the user's local time zone. */
  today(): LocalDate;
  /** Current local time, `HH:mm`. */
  localTime(): string;
  /** Local date + `HH:mm` in the user's time zone → ISO 8601 UTC instant. */
  localToIso(date: LocalDate, time: string): string;
  /** ISO 8601 UTC instant → local date and `HH:mm` in the user's time zone. */
  isoToLocal(iso: string): { date: LocalDate; time: string };
}

export interface IdGenerator {
  /** New UUID v7 (README §6.1). */
  next(): string;
}

export interface QuestionnaireRecord<T> {
  id: string;
  profileId: string;
  status: 'completed' | 'skipped';
  answers: T;
  completedAt: string;
}

/** Answers of one module questionnaire, kept as history (README §8.2). */
export interface QuestionnaireRepository<T> {
  latest(profileId: string): Promise<QuestionnaireRecord<T> | null>;
  insert(record: QuestionnaireRecord<T>): Promise<void>;
}
