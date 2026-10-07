import type { LocalDate } from '@evully/domain';

/** Source of "now"; nothing else may read the system clock (README §5.5). */
export interface Clock {
  /** Current instant, ISO 8601 UTC. */
  nowIso(): string;
  /** Current date in the user's local time zone. */
  today(): LocalDate;
}

export interface IdGenerator {
  /** New UUID v7 (README §6.1). */
  next(): string;
}
