import type { ReminderSettings, SetReminderSettingsInput } from '@evully/contracts';
import {
  addDaysToLocalDate,
  DEFAULT_REMINDER_PREFERENCES,
  dueReminders,
  effectiveAt,
  isoWeekday,
  ValidationError,
  WEEKLY_REMINDER_TYPES,
  type LocalDate,
  type PendingRecord,
  type ReminderFacts,
  type ReminderPreference,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { HabitRepository } from '../../habits/ports/habit-repository';
import type { FoodLogRepository } from '../../nutrition/ports/food-log-repository';
import type {
  NutritionTargetRepository,
  WaterLogRepository,
} from '../../nutrition/ports/targets-water-repository';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { MeasurementRepository } from '../../measurements/ports/measurement-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { SleepRepository } from '../../sleep/ports/sleep-repository';
import type { TrackingRepository } from '../../tracking/ports/tracking-repository';
import type { WeightRepository } from '../../weights/ports/weight-repository';
import type { SessionRepository } from '../../workouts/ports/session-repository';
import type { WorkoutPlanRepository } from '../../workouts/ports/workout-plan-repository';
import type { Notifier, ReminderRepository } from '../ports/reminder-ports';
import { reminderText } from './reminder-messages.pt-BR';

export interface ReminderDeps {
  profiles: ProfileRepository;
  reminders: ReminderRepository;
  weights: WeightRepository;
  measurements: MeasurementRepository;
  tracking: TrackingRepository;
  plans: WorkoutPlanRepository;
  sessions: SessionRepository;
  foodLogs: FoodLogRepository;
  targets: NutritionTargetRepository;
  water: WaterLogRepository;
  habits: HabitRepository;
  sleep: SleepRepository;
  notifier: Notifier;
  clock: Clock;
  ids: IdGenerator;
}

/** Saved preferences over the defaults, in the defaults' order. */
async function currentSettings(deps: ReminderDeps, profileId: string): Promise<ReminderSettings> {
  const { preferences, quietHours } = await deps.reminders.current(profileId);
  const saved = new Map(preferences.map((p) => [p.type, p]));
  return {
    preferences: DEFAULT_REMINDER_PREFERENCES.map((d) => saved.get(d.type) ?? { ...d }),
    quietHours,
  };
}

export class GetReminderSettings {
  constructor(private readonly deps: ReminderDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<ReminderSettings> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    return currentSettings(this.deps, profileId);
  }
}

/** Weekly reminders need a weekday; the other reminders take none. */
function normalized(preferences: readonly ReminderPreference[]): ReminderPreference[] {
  const byType = new Map(preferences.map((p) => [p.type, p]));
  return DEFAULT_REMINDER_PREFERENCES.map((d) => {
    const p = byType.get(d.type) ?? d;
    const weekly = WEEKLY_REMINDER_TYPES.includes(p.type);
    if (weekly && p.weekday === null) {
      throw new ValidationError('reminder.weekday_required', 'Weekly reminders need a weekday');
    }
    return { ...p, weekday: weekly ? p.weekday : null };
  });
}

/**
 * Saves the profile's reminders. A change adds a row per type (README §28);
 * saving the same values again writes nothing.
 */
export class SetReminderSettings {
  constructor(private readonly deps: ReminderDeps) {}

  async execute({
    profileId,
    preferences,
    quietHours,
  }: SetReminderSettingsInput): Promise<ReminderSettings> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const next = { preferences: normalized(preferences), quietHours };
    const saved = await this.deps.reminders.current(profileId);
    const before = await currentSettings(this.deps, profileId);
    const changed =
      saved.preferences.length === 0 || JSON.stringify(before) !== JSON.stringify(next);
    if (changed) {
      await this.deps.reminders.save(
        profileId,
        next.preferences.map((preference) => ({ id: this.deps.ids.next(), preference })),
        quietHours,
        this.deps.clock.nowIso(),
      );
    }
    return currentSettings(this.deps, profileId);
  }
}

/** Diet, water, habits and sleep today; never guessed without a target or a log. */
async function dailyFacts(deps: ReminderDeps, profileId: string, today: LocalDate) {
  const [foods, targets, water, habits, habitLogs, night] = await Promise.all([
    deps.foodLogs.listDay(profileId, today),
    deps.targets.list(profileId),
    deps.water.listDay(profileId, today),
    deps.habits.listActive(profileId),
    deps.habits.logsBetween(profileId, today, today),
    deps.sleep.findByDate(profileId, today),
  ]);
  const target = effectiveAt(targets, today);
  const protein = foods.reduce((sum, f) => sum + f.nutrients.proteinG, 0);
  const waterMl = water.reduce((sum, w) => sum + w.amountMl, 0);
  const logged = new Set(habitLogs.map((l) => l.habitId));
  return {
    loggedFoodToday: foods.length > 0,
    proteinBelowTarget:
      target && target.proteinG > 0 && foods.length > 0 ? protein < target.proteinG : null,
    waterBelowTarget: target?.waterMl ? waterMl < target.waterMl : water.length === 0,
    pendingHabits: habits.some((h) => !logged.has(h.id)),
    sleepLoggedToday: night !== null,
  };
}

type Loaded = {
  weighings: { measuredOn: LocalDate }[];
  sessions: { measuredOn: LocalDate }[];
  plans: { status: string; createdAt: string; days: { weekday: number | null }[] }[];
  open: { startedAt: string } | null;
  finished: { startedAt: string }[];
};

/**
 * What the last 8 days say (README §25): a week with records for the summary,
 * and what earlier days left open. Food and habits count as pending only for a
 * profile that logged them in the 7 days before yesterday.
 */
async function weekFacts(deps: ReminderDeps, profileId: string, today: LocalDate, l: Loaded) {
  const local = (iso: string) => deps.clock.isoToLocal(iso).date;
  const yesterday = addDaysToLocalDate(today, -1);
  const weekAgo = addDaysToLocalDate(today, -6);
  const before = addDaysToLocalDate(yesterday, -7);
  const inWeek = (d: string) => d >= weekAgo && d <= today;
  const [foodDays, habitLogs, nights] = await Promise.all([
    deps.foodLogs.dailyConsumed(profileId),
    deps.habits.logsBetween(profileId, before, today),
    deps.sleep.list(profileId),
  ]);
  const foodDates = foodDays.map((d) => d.date);
  const habitDates = habitLogs.map((h) => h.logDate);
  const trainedDates = [...l.finished, ...(l.open ? [l.open] : [])].map((s) => local(s.startedAt));
  const usedBefore = (dates: string[]) => dates.some((d) => d >= before && d < yesterday);
  const plannedYesterday = l.plans.some(
    (p) =>
      p.status === 'active' &&
      local(p.createdAt) <= yesterday &&
      p.days.some((d) => d.weekday === isoWeekday(yesterday)),
  );
  const pending: PendingRecord[] = [];
  if (l.open && local(l.open.startedAt) < today) pending.push('open_workout');
  if (plannedYesterday && !trainedDates.includes(yesterday)) pending.push('workout_yesterday');
  if (usedBefore(habitDates) && !habitDates.includes(yesterday)) pending.push('habits_yesterday');
  if (usedBefore(foodDates) && !foodDates.includes(yesterday)) pending.push('food_yesterday');
  const recordedLastWeek = [
    ...l.weighings.map((w) => w.measuredOn),
    ...l.sessions.map((s) => s.measuredOn),
    ...trainedDates,
    ...foodDates,
    ...habitDates,
    ...nights.map((n) => n.sleepDate),
  ].some(inWeek);
  return { recordedLastWeek, pending };
}

/** What the records say today, for the redundancy rules. */
async function factsOf(deps: ReminderDeps, profileId: string, today: LocalDate) {
  const local = (iso: string) => deps.clock.isoToLocal(iso).date;
  const [weighings, sessions, tracked, plans, open, finished, daily] = await Promise.all([
    deps.weights.listByProfile(profileId),
    deps.measurements.listByProfile(profileId),
    deps.tracking.listActiveMeasurementTypes(profileId),
    deps.plans.list(profileId),
    deps.sessions.findOpen(profileId),
    deps.sessions.finishedSessions(profileId),
    dailyFacts(deps, profileId, today),
  ]);
  const weekday = isoWeekday(today);
  const facts: ReminderFacts = {
    weighedToday: weighings.some((w) => w.measuredOn === today),
    lastMeasurement: sessions.reduce<LocalDate | null>(
      (latest, s) => (latest === null || s.measuredOn > latest ? s.measuredOn : latest),
      null,
    ),
    tracksMeasurements: tracked.length > 0,
    plannedToday: plans
      .filter((p) => p.status === 'active')
      .flatMap((p) => p.days.filter((d) => d.weekday === weekday).map((d) => d.name)),
    trainedToday:
      (open !== null && local(open.startedAt) === today) ||
      finished.some((s) => local(s.startedAt) === today),
    ...daily,
    ...(await weekFacts(deps, profileId, today, { weighings, sessions, plans, open, finished })),
  };
  return facts;
}

/**
 * Shows the reminders due now for every active profile that turned one on
 * (README §25). Each type shows at most once a day per profile.
 */
export class EvaluateReminders {
  constructor(private readonly deps: ReminderDeps) {}

  async execute(): Promise<number> {
    const { reminders, clock, ids, notifier } = this.deps;
    const active = new Map((await this.deps.profiles.listActive()).map((p) => [p.id, p]));
    const today = clock.today();
    let shown = 0;
    for (const profileId of await reminders.profilesWithReminders()) {
      const profile = active.get(profileId);
      if (!profile) continue;
      const { preferences, quietHours } = await reminders.current(profileId);
      const due = dueReminders({
        preferences,
        quietHours,
        facts: await factsOf(this.deps, profileId, today),
        today,
        now: clock.localTime(),
        shownToday: await reminders.shownOn(profileId, today),
      });
      for (const reminder of due) {
        const now = clock.nowIso();
        const event = {
          id: ids.next(),
          profileId,
          type: reminder.type,
          localDate: today,
          shownAt: now,
        };
        if (!(await reminders.recordShown(event, now))) continue;
        notifier.show({ profileId, ...reminderText(profile.name, reminder) });
        shown++;
      }
    }
    return shown;
  }
}

/** True when some active profile has a reminder on: the app then stays in the tray. */
export async function anyRemindersOn(deps: Pick<ReminderDeps, 'profiles' | 'reminders'>) {
  const active = new Set((await deps.profiles.listActive()).map((p) => p.id));
  return (await deps.reminders.profilesWithReminders()).some((id) => active.has(id));
}
