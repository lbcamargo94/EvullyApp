import {
  addDaysToLocalDate,
  isoWeekday,
  isStepsHabit,
  ConflictError,
  type LocalDate,
} from '@evully/domain';
import type { Clock } from '../src/modules/shared/ports';
import { localParts } from '../src/modules/shared/system-adapters';
import type { IpcHandlers } from '../src/shared/ipc-channels';

/**
 * Demo history for the development database: a new profile with about four
 * months of records in every module, built through the app's own use cases
 * so every rule and validation applies. Every run builds the same history.
 * Extend it whenever a module gains records worth seeing.
 */

export const DEMO_PROFILE_NAME = 'Demo';
const DAYS = 120;
const PROJECT_DAYS_AGO = 90;
const TARGET_CHANGE_DAYS_AGO = 60;
const TRAINING_WEEKDAYS = [1, 2, 4, 5];
const CARDIO_WEEKDAYS = [3, 6, 7];

/** A clock the seed moves day by day; local times use the machine's time zone. */
export interface SeedClock extends Clock {
  set(date: LocalDate, time: string): void;
}

export function seedClock(today: LocalDate): SeedClock {
  let date = today;
  let time = '07:00';
  const localToIso = (d: LocalDate, t: string) => new Date(`${d}T${t}:00`).toISOString();
  return {
    nowIso: () => localToIso(date, time),
    today: () => date,
    localTime: () => time,
    localToIso,
    isoToLocal: (iso) => localParts(new Date(iso)),
    set(d, t) {
      date = d;
      time = t;
    },
  };
}

/** Deterministic pseudo-random numbers (mulberry32). */
function random(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    between: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    chance: (p: number) => next() < p,
  };
}
type Random = ReturnType<typeof random>;

const round1 = (n: number) => Math.round(n * 10) / 10;
const pad = (n: number) => String(n).padStart(2, '0');

/** Minutes after midnight of `date` → local date and `HH:mm` (may roll over). */
function at(date: LocalDate, minutes: number): [LocalDate, string] {
  const days = Math.floor(minutes / 1440);
  const rest = minutes - days * 1440;
  return [addDaysToLocalDate(date, days), `${pad(Math.floor(rest / 60))}:${pad(rest % 60)}`];
}

type FoodUnit = 'g' | 'ml' | 'portion';
const food = (
  name: string,
  referenceUnit: FoodUnit,
  referenceAmount: number,
  caloriesKcal: number,
  proteinG: number,
  carbohydrateG: number,
  fatG: number,
) => ({
  name: `${name} (demo)`,
  brand: null,
  referenceAmount,
  referenceUnit,
  caloriesKcal,
  proteinG,
  carbohydrateG,
  fatG,
  fiberG: null,
  sodiumMg: null,
  source: null,
});

/** Shared household catalog: marked "(demo)" so they are easy to tell apart. */
const FOODS = {
  oats: food('Aveia em flocos', 'g', 100, 394, 13.9, 66.6, 8.5),
  banana: food('Banana prata', 'g', 100, 98, 1.3, 26, 0.1),
  whey: food('Whey protein', 'g', 30, 120, 24, 3, 1.5),
  egg: food('Ovo cozido', 'portion', 1, 72, 6.3, 0.4, 4.8),
  bread: food('Pão integral', 'g', 50, 123, 4.7, 24, 1.7),
  rice: food('Arroz branco cozido', 'g', 100, 128, 2.5, 28.1, 0.2),
  beans: food('Feijão carioca cozido', 'g', 100, 76, 4.8, 13.6, 0.5),
  chicken: food('Peito de frango grelhado', 'g', 100, 165, 31, 0, 3.6),
  beef: food('Patinho moído', 'g', 100, 219, 35.9, 0, 7.3),
  salad: food('Salada verde', 'g', 100, 15, 1.2, 2.5, 0.2),
  yogurt: food('Iogurte natural', 'g', 170, 104, 6.5, 8, 5),
  potato: food('Batata-doce cozida', 'g', 100, 77, 0.6, 18.4, 0.1),
};
type FoodKey = keyof typeof FOODS;
type MealType = 'breakfast' | 'lunch' | 'pre_workout' | 'dinner';

const MEALS: Record<MealType, [FoodKey, number, number][]> = {
  breakfast: [
    ['oats', 40, 60],
    ['banana', 90, 130],
    ['egg', 2, 3],
  ],
  lunch: [
    ['rice', 120, 180],
    ['beans', 80, 120],
    ['chicken', 130, 170],
    ['salad', 60, 100],
  ],
  pre_workout: [
    ['yogurt', 170, 170],
    ['whey', 30, 30],
    ['bread', 50, 50],
  ],
  dinner: [
    ['potato', 150, 200],
    ['beef', 120, 150],
    ['salad', 60, 100],
  ],
};

export interface SeedResult {
  profileId: string;
  days: number;
  weights: number;
  measurements: number;
  foodLogs: number;
  workouts: number;
  cardio: number;
  nights: number;
}

interface Context {
  handlers: IpcHandlers;
  clock: SeedClock;
  rnd: Random;
  profileId: string;
  result: SeedResult;
}

async function ensureFoods(handlers: IpcHandlers) {
  const existing = await handlers['foods:list'](undefined);
  const ids = {} as Record<FoodKey, string>;
  for (const [key, input] of Object.entries(FOODS) as [FoodKey, (typeof FOODS)[FoodKey]][]) {
    const found = existing.find((f) => f.name === input.name);
    ids[key] = found ? found.id : (await handlers['foods:create'](input)).id;
  }
  return ids;
}

async function weighIn(ctx: Context, date: LocalDate, day: number) {
  if (day < DAYS && ctx.rnd.chance(0.15)) return;
  const weekend = isoWeekday(date) >= 6 ? 0.3 : 0;
  const weightKg = round1(92.4 - 0.05 * day + weekend + ctx.rnd.between(-0.5, 0.5));
  ctx.clock.set(date, '07:10');
  await ctx.handlers['weights:register']({
    profileId: ctx.profileId,
    measuredOn: date,
    measuredAt: ctx.clock.localToIso(date, '07:10'),
    weightKg,
    tagIds: [],
    notes: null,
  });
  ctx.result.weights++;
}

async function measure(ctx: Context, date: LocalDate, day: number, types: Map<string, string>) {
  if (day % 14 !== 0) return;
  const values = { waist: 98 - 0.045 * day, abdomen: 101 - 0.05 * day, hips: 108 - 0.025 * day };
  ctx.clock.set(date, '07:15');
  await ctx.handlers['measurements:register']({
    profileId: ctx.profileId,
    measuredOn: date,
    measuredAt: ctx.clock.localToIso(date, '07:15'),
    values: Object.entries(values).flatMap(([code, cm]) => {
      const id = types.get(code);
      return id
        ? [{ measurementTypeId: id, valueCm: round1(cm + ctx.rnd.between(-0.3, 0.3)) }]
        : [];
    }),
    notes: null,
  });
  ctx.result.measurements++;
}

async function sleep(ctx: Context, date: LocalDate) {
  if (ctx.rnd.chance(0.07)) return;
  const weekend = isoWeekday(date) >= 6 ? 60 : 0;
  const [bedDate, bed] = at(addDaysToLocalDate(date, -1), 22 * 60 + 50 + ctx.rnd.int(0, 80));
  const [, wake] = at(date, 6 * 60 + 20 + weekend + ctx.rnd.int(0, 60));
  ctx.clock.set(date, '10:00');
  await ctx.handlers['sleep:register']({
    profileId: ctx.profileId,
    sleepDate: date,
    bedTime: ctx.clock.localToIso(bedDate, bed),
    sleepTime: null,
    wakeTime: ctx.clock.localToIso(date, wake),
    quality: ctx.rnd.int(2, 5),
    notes: null,
  });
  ctx.result.nights++;
}

/** Planned meals; past ones are mostly marked consumed, today only breakfast. */
async function eat(ctx: Context, date: LocalDate, foods: Record<FoodKey, string>, today: boolean) {
  if (!today && ctx.rnd.chance(0.05)) return;
  ctx.clock.set(date, '08:00');
  for (const [mealType, items] of Object.entries(MEALS) as [
    MealType,
    [FoodKey, number, number][],
  ][]) {
    for (const [key, min, max] of items) {
      await ctx.handlers['nutrition:add']({
        profileId: ctx.profileId,
        logDate: date,
        mealType,
        mealName: null,
        foodId: foods[key],
        quantity: ctx.rnd.int(min, max),
      });
      ctx.result.foodLogs++;
    }
    const consumed = today ? mealType === 'breakfast' : ctx.rnd.chance(0.92);
    if (consumed) {
      await ctx.handlers['nutrition:set-meal-consumed']({
        profileId: ctx.profileId,
        date,
        mealType,
        mealName: null,
        consumed: true,
      });
    }
  }
  for (let glass = today ? 2 : ctx.rnd.int(4, 7); glass > 0; glass--) {
    await ctx.handlers['water:add']({ profileId: ctx.profileId, date, amountMl: 500 });
  }
}

async function habits(
  ctx: Context,
  date: LocalDate,
  ids: { steps: string; creatine: string },
  cardioDay: boolean,
  today: boolean,
) {
  ctx.clock.set(date, today ? '08:00' : '22:00');
  const log = (habitId: string, value: number) =>
    ctx.handlers['habits:log']({ profileId: ctx.profileId, habitId, date, value });
  if (today) await log(ids.steps, ctx.rnd.int(1500, 3500));
  else if (!ctx.rnd.chance(0.05)) {
    await log(ids.steps, ctx.rnd.int(4500, 11000) + (cardioDay ? 3000 : 0));
  }
  if (ctx.rnd.chance(0.85)) await log(ids.creatine, 1);
}

async function cardio(ctx: Context, date: LocalDate) {
  if (!ctx.rnd.chance(0.8)) return;
  const weekend = isoWeekday(date) >= 6;
  const cycling = weekend && ctx.rnd.chance(0.3);
  const durationMinutes = cycling ? ctx.rnd.int(50, 70) : ctx.rnd.int(35, 60);
  const time = weekend ? '09:00' : '18:00';
  ctx.clock.set(date, weekend ? '10:30' : '19:30');
  await ctx.handlers['cardio:register']({
    profileId: ctx.profileId,
    sessionDate: date,
    startedAt: ctx.clock.localToIso(date, time),
    activityType: cycling ? 'cycling' : 'walking',
    activityName: null,
    durationMinutes,
    distanceKm: round1(durationMinutes * (cycling ? 0.3 : 0.09)),
    steps: null,
    intensity: cycling ? 'moderate' : 'light',
    heartRateAverage: null,
    notes: null,
  });
  ctx.result.cardio++;
}

/** First load of an exercise, from its id: the same on every run. */
function firstLoad(exerciseId: string) {
  let hash = 0;
  for (const char of exerciseId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return 10 + (hash % 9) * 5;
}

type Session = Awaited<ReturnType<IpcHandlers['workout-sessions:start']>>;
type Performance = Session['performances'][number];

function repRange(rx: Performance['prescription']) {
  const minReps = rx?.minReps ?? 8;
  return { minReps, maxReps: rx?.maxReps ?? Math.max(minReps, 12), minRir: rx?.minRir ?? 2 };
}

function setValues(rnd: Random, p: Performance, prefilled: number | null, topReps: boolean) {
  if (p.targetType === 'seconds') {
    const seconds = p.prescription?.maxSeconds ?? p.prescription?.minSeconds ?? 45;
    return { weightKg: null, repetitions: null, durationSeconds: seconds, rir: null };
  }
  const increment = p.suggestion ? (p.suggestion.incrementKg ?? 2.5) : 0;
  const { minReps, maxReps, minRir } = repRange(p.prescription);
  // A heavier load restarts at the bottom of the range (double progression).
  const reps = increment ? minReps : topReps ? maxReps : rnd.int(minReps, maxReps);
  return {
    weightKg: (prefilled ?? firstLoad(p.exerciseId)) + increment,
    repetitions: reps,
    durationSeconds: null,
    rir: minRir,
  };
}

/** Today's workout is always done, in the morning, to show it finished on Hoje. */
async function train(ctx: Context, date: LocalDate, workoutDayId: string, today: boolean) {
  if (!today && ctx.rnd.chance(0.12)) return;
  const { handlers, profileId, rnd } = ctx;
  ctx.clock.set(date, today ? '06:30' : '18:30');
  const session = await handlers['workout-sessions:start']({ profileId, workoutDayId });
  for (const p of session.performances) {
    const topReps = rnd.chance(0.35);
    for (const set of p.sets) {
      await handlers['workout-sets:update']({
        profileId,
        id: set.id,
        ...setValues(rnd, p, set.weightKg, topReps),
        completed: true,
        notes: null,
      });
    }
  }
  ctx.clock.set(date, today ? '07:40' : '19:40');
  await handlers['workout-sessions:finish']({ profileId, id: session.id, notes: null });
  ctx.result.workouts++;
}

/** Profile, questionnaire, plan, habits and first targets on the first day. */
async function start(handlers: IpcHandlers, clock: SeedClock, first: LocalDate) {
  clock.set(first, '07:00');
  const profile = await handlers['profiles:create']({
    name: DEMO_PROFILE_NAME,
    birthDate: '1994-05-12',
    sex: 'male',
    heightCm: 178,
  });
  const profileId = profile.id;
  const state = await handlers['tracking:accept']({
    profileId,
    answers: {
      project: null,
      focusAreas: ['waist', 'hips'],
      weightDisplay: 'trend',
      interests: { menstrualCycle: null, progressPhotos: null, pin: null, weighingDevice: null },
      suggestion: null,
    },
  });
  const plan = await handlers['workout-plans:import-template']({
    profileId,
    template: 'cutting_2026',
  });
  const habitList = await handlers['habits:add-examples']({ profileId });
  const steps = habitList.find(isStepsHabit);
  const creatine = habitList.find((h) => h.type === 'boolean');
  if (!steps || !creatine) throw new Error('Habit examples changed: update the seed');
  return {
    profileId,
    types: new Map(state.measurementTypes.map((t) => [t.code, t.id])),
    trainingDays: new Map(
      plan.days.flatMap((d) =>
        d.weekday !== null && TRAINING_WEEKDAYS.includes(d.weekday)
          ? [[d.weekday, d.id] as const]
          : [],
      ),
    ),
    habitIds: { steps: steps.id, creatine: creatine.id },
  };
}

async function setTargets(ctx: Context, date: LocalDate, phase: 'first' | 'second') {
  const { handlers, profileId } = ctx;
  ctx.clock.set(date, '07:05');
  await handlers['nutrition-targets:set']({
    profileId,
    caloriesKcal: phase === 'first' ? 2300 : 2150,
    proteinG: phase === 'first' ? 180 : 185,
    carbohydrateG: null,
    fatG: null,
    waterMl: 3000,
  });
  if (phase === 'second') {
    await handlers['cardio-target:set']({ profileId, sessionsPerWeek: 3, minutesPerWeek: 150 });
    await handlers['sleep-target:set']({ profileId, minutesPerNight: 450 });
  }
}

/** Builds the demo profile ending on `today`. Refuses when one already exists. */
export async function seedDemo(
  handlers: IpcHandlers,
  clock: SeedClock,
  today: LocalDate,
): Promise<SeedResult> {
  const profiles = [
    ...(await handlers['profiles:list'](undefined)),
    ...(await handlers['profiles:list-archived'](undefined)),
  ];
  if (profiles.some((p) => p.name === DEMO_PROFILE_NAME)) {
    throw new ConflictError(
      'seed.demo_exists',
      `A "${DEMO_PROFILE_NAME}" profile already exists: delete it in the app to seed again`,
    );
  }
  const first = addDaysToLocalDate(today, -DAYS);
  const foods = await ensureFoods(handlers);
  const setup = await start(handlers, clock, first);
  const ctx: Context = {
    handlers,
    clock,
    rnd: random(20261103),
    profileId: setup.profileId,
    result: {
      profileId: setup.profileId,
      days: DAYS + 1,
      weights: 0,
      measurements: 0,
      foodLogs: 0,
      workouts: 0,
      cardio: 0,
      nights: 0,
    },
  };
  await setTargets(ctx, first, 'first');

  for (let day = 0; day <= DAYS; day++) {
    const date = addDaysToLocalDate(first, day);
    const isToday = day === DAYS;
    const weekday = isoWeekday(date);
    const cardioDay = CARDIO_WEEKDAYS.includes(weekday);
    if (day === DAYS - PROJECT_DAYS_AGO) {
      clock.set(date, '07:00');
      await handlers['projects:create']({
        profileId: ctx.profileId,
        name: 'Projeto Verão',
        objective: 'fat_loss',
        startDate: date,
        targetDate: addDaysToLocalDate(date, 150),
      });
    }
    if (day === DAYS - TARGET_CHANGE_DAYS_AGO) await setTargets(ctx, date, 'second');
    await sleep(ctx, date);
    await weighIn(ctx, date, day);
    await measure(ctx, date, day, setup.types);
    const workoutDayId = setup.trainingDays.get(weekday);
    if (workoutDayId) await train(ctx, date, workoutDayId, isToday);
    await eat(ctx, date, foods, isToday);
    if (isToday) {
      await habits(ctx, date, setup.habitIds, false, true);
      continue;
    }
    if (cardioDay) await cardio(ctx, date);
    await habits(ctx, date, setup.habitIds, cardioDay, false);
  }
  return ctx.result;
}
