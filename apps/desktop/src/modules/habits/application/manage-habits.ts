import type {
  HabitDay,
  HabitDto,
  HabitHistory,
  HabitInput,
  UpdateHabitInput,
} from '@evully/contracts';
import {
  daysEndingOn,
  HABIT_EXAMPLES,
  isHabitDone,
  moveInOrder,
  normalizeHabitDraft,
  normalizeHabitValue,
  NotFoundError,
  parseLocalDate,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { HabitRecord, HabitRepository } from '../ports/habit-repository';

export interface HabitDeps {
  profiles: ProfileRepository;
  habits: HabitRepository;
  clock: Clock;
  ids: IdGenerator;
}

const HISTORY_DAYS = 7;

const toDto = (h: HabitRecord): HabitDto => ({
  id: h.id,
  name: h.name,
  type: h.type,
  unit: h.unit,
  targetValue: h.targetValue,
});

const notFound = () => new NotFoundError('habit.not_found', 'Habit not found');

async function activeHabit(deps: HabitDeps, profileId: string, id: string) {
  const habit = (await deps.habits.listActive(profileId)).find((h) => h.id === id);
  if (!habit) throw notFound();
  return habit;
}

export class ListHabits {
  constructor(private readonly deps: HabitDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<HabitDto[]> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    return (await this.deps.habits.listActive(profileId)).map(toDto);
  }
}

async function createHabit(
  deps: HabitDeps,
  profileId: string,
  draft: HabitInput | (typeof HABIT_EXAMPLES)[number],
) {
  const existing = await deps.habits.listActive(profileId);
  const habit: HabitRecord = {
    ...normalizeHabitDraft(
      draft,
      existing.map((h) => h.name),
    ),
    id: deps.ids.next(),
    profileId,
    sortOrder: Math.max(0, ...existing.map((h) => h.sortOrder)) + 1,
  };
  await deps.habits.insert(habit, deps.clock.nowIso());
  return habit;
}

export class CreateHabit {
  constructor(private readonly deps: HabitDeps) {}

  async execute({ profileId, ...draft }: HabitInput): Promise<HabitDto> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    return toDto(await createHabit(this.deps, profileId, { profileId, ...draft }));
  }
}

/** Adds the README examples the profile does not have yet (by name). */
export class AddHabitExamples {
  constructor(private readonly deps: HabitDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<HabitDto[]> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const names = new Set(
      (await this.deps.habits.listActive(profileId)).map((h) => h.name.toLocaleLowerCase('pt-BR')),
    );
    for (const example of HABIT_EXAMPLES) {
      if (!names.has(example.name.toLocaleLowerCase('pt-BR')))
        await createHabit(this.deps, profileId, example);
    }
    return (await this.deps.habits.listActive(profileId)).map(toDto);
  }
}

export class UpdateHabit {
  constructor(private readonly deps: HabitDeps) {}

  async execute({ profileId, id, ...draft }: UpdateHabitInput): Promise<HabitDto> {
    const current = await activeHabit(this.deps, profileId, id);
    const others = (await this.deps.habits.listActive(profileId))
      .filter((h) => h.id !== id)
      .map((h) => h.name);
    const habit = { ...current, ...normalizeHabitDraft(draft, others) };
    await this.deps.habits.update(habit, this.deps.clock.nowIso());
    return toDto(habit);
  }
}

export class DeactivateHabit {
  constructor(private readonly deps: HabitDeps) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<null> {
    if (!(await this.deps.habits.deactivate(profileId, id, this.deps.clock.nowIso())))
      throw notFound();
    return null;
  }
}

export class MoveHabit {
  constructor(private readonly deps: HabitDeps) {}

  async execute({
    profileId,
    id,
    direction,
  }: {
    profileId: string;
    id: string;
    direction: 'up' | 'down';
  }) {
    await activeHabit(this.deps, profileId, id);
    const order = moveInOrder(
      (await this.deps.habits.listActive(profileId)).map((h) => h.id),
      id,
      direction,
    );
    await this.deps.habits.reorder(profileId, order, this.deps.clock.nowIso());
    return (await this.deps.habits.listActive(profileId)).map(toDto);
  }
}

/** The day's habits with values and the last 7 days (README §11.2). */
export async function habitDay(
  deps: HabitDeps,
  profileId: string,
  date: string,
): Promise<HabitDay> {
  await new GetProfile(deps.profiles).execute({ id: profileId });
  const day = parseLocalDate(date);
  const days = daysEndingOn(day, HISTORY_DAYS);
  const logs = await deps.habits.logsBetween(profileId, days[0] ?? day, day);
  const valueOf = (habitId: string, d: string) =>
    logs.find((l) => l.habitId === habitId && l.logDate === d)?.value ?? null;
  return {
    date: day,
    habits: (await deps.habits.listActive(profileId)).map((h) => {
      const value = valueOf(h.id, day);
      return {
        ...toDto(h),
        value,
        done: isHabitDone(h, value),
        last7: days.map((d) => isHabitDone(h, valueOf(h.id, d))),
      };
    }),
  };
}

export class GetHabitDay {
  constructor(private readonly deps: HabitDeps) {}

  execute({ profileId, date }: { profileId: string; date: string }) {
    return habitDay(this.deps, profileId, date);
  }
}

/** Every logged value of one active habit (README §13.2). */
export class GetHabitHistory {
  constructor(private readonly deps: HabitDeps) {}

  async execute({
    profileId,
    habitId,
  }: {
    profileId: string;
    habitId: string;
  }): Promise<HabitHistory> {
    await activeHabit(this.deps, profileId, habitId);
    const logs = await this.deps.habits.logsOf(profileId, habitId);
    return logs.map((l) => ({ date: l.logDate, value: l.value }));
  }
}

/** Sets (or clears, with null) the day's value; one log per habit per day. */
export class SetHabitLog {
  constructor(private readonly deps: HabitDeps) {}

  async execute(input: { profileId: string; habitId: string; date: string; value: number | null }) {
    const { profileId, habitId } = input;
    const { habits, clock, ids } = this.deps;
    const habit = await activeHabit(this.deps, profileId, habitId);
    const logDate = parseLocalDate(input.date);
    const now = clock.nowIso();
    if (input.value === null) {
      await habits.clearLog(profileId, habitId, logDate, now);
    } else {
      const value = normalizeHabitValue(habit.type, input.value, logDate, clock.today());
      await habits.saveLog(profileId, { habitId, logDate, value }, ids.next(), now);
    }
    return habitDay(this.deps, profileId, logDate);
  }
}
