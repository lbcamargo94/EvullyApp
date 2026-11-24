import { addDaysToLocalDate, daysBetween, parseLocalDate, type LocalDate } from '../local-date';
import type { RecommendationRuleId, Signal } from './rules';

export type RecommendationStatus = 'open' | 'snoozed' | 'dismissed' | 'accepted' | 'resolved';
export type RecommendationDecision = 'dismissed' | 'snoozed' | 'accepted';

/** Days a dismissed or accepted signal stays quiet before the rule may raise it again. */
export const DISMISS_COOLDOWN_DAYS = 14;
/** "Lembrar depois" brings a signal back after this many days. */
export const SNOOZE_DAYS = 7;

/** A signal already saved, as the engine needs it. */
export interface StoredSignal {
  id: string;
  ruleId: RecommendationRuleId;
  subjectKey: string;
  status: RecommendationStatus;
  /** Local date the status last changed (detection for open signals). */
  statusOn: string;
  snoozedUntil: string | null;
}

export interface Reconciliation {
  /** New signals to save as open. */
  create: Signal[];
  /** Open or snoozed signals whose condition no longer holds. */
  resolve: string[];
  /** Snoozed signals whose date came and whose condition still holds. */
  reopen: string[];
}

const keyOf = (s: { ruleId: string; subjectKey: string }) => `${s.ruleId}\u0000${s.subjectKey}`;

/** The latest stored signal of each rule and subject (`stored` comes oldest first). */
function latestByKey(stored: readonly StoredSignal[]) {
  const latest = new Map<string, StoredSignal>();
  for (const s of stored) latest.set(keyOf(s), s);
  return latest;
}

const reached = (date: string, today: LocalDate) => daysBetween(parseLocalDate(date), today) >= 0;

/** What a signal that holds today does, given the latest saved one of its rule and subject. */
function actionFor(previous: StoredSignal | undefined, today: LocalDate) {
  if (!previous || previous.status === 'resolved') return 'create';
  if (previous.status === 'snoozed') {
    return reached(previous.snoozedUntil ?? today, today) ? 'reopen' : null;
  }
  if (previous.status === 'open') return null;
  // Dismissed or accepted: quiet for the cooldown.
  const quietUntil = addDaysToLocalDate(parseLocalDate(previous.statusOn), DISMISS_COOLDOWN_DAYS);
  return reached(quietUntil, today) ? 'create' : null;
}

/**
 * What changes today (README §20.2): an open signal is never repeated, a
 * snoozed one comes back on its date, a dismissed or accepted one stays quiet
 * for 14 days, and open or snoozed signals that no longer hold are resolved.
 * The evidence of a saved signal is never rewritten.
 */
export function reconcileSignals(
  stored: readonly StoredSignal[],
  signals: readonly Signal[],
  today: LocalDate,
): Reconciliation {
  const latest = latestByKey(stored);
  const current = new Set(signals.map(keyOf));
  const result: Reconciliation = { create: [], resolve: [], reopen: [] };

  for (const signal of signals) {
    const previous = latest.get(keyOf(signal));
    const action = actionFor(previous, today);
    if (action === 'create') result.create.push(signal);
    if (action === 'reopen' && previous) result.reopen.push(previous.id);
  }
  for (const previous of latest.values()) {
    const live = previous.status === 'open' || previous.status === 'snoozed';
    if (live && !current.has(keyOf(previous))) result.resolve.push(previous.id);
  }
  return result;
}

/** Status and snooze date after the user's decision. */
export function applyDecision(
  decision: RecommendationDecision,
  today: LocalDate,
): { status: RecommendationStatus; snoozedUntil: LocalDate | null } {
  return decision === 'snoozed'
    ? { status: 'snoozed', snoozedUntil: addDaysToLocalDate(today, SNOOZE_DAYS) }
    : { status: decision, snoozedUntil: null };
}
