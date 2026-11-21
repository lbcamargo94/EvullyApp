import { describe, expect, it } from 'vitest';
import {
  addDaysToLocalDate,
  parseLocalDate,
  trainingComparison,
  type LoadedSet,
  type MuscleGroup,
  type TrainingSession,
} from '../src';

// A Thursday.
const today = parseLocalDate('2026-11-19');
const ago = (days: number) => addDaysToLocalDate(today, -days);

const exercise = (
  exerciseId: string,
  muscleGroup: MuscleGroup,
  sets: LoadedSet[],
  completedSets = sets.length,
) => ({
  exerciseId,
  name: exerciseId,
  muscleGroup,
  completedSets,
  loadedSets: sets,
  volumeKg: sets.reduce((sum, s) => sum + s.weightKg * (s.repetitions ?? 0), 0),
});
const session = (daysAgo: number, ...exercises: TrainingSession['exercises']): TrainingSession => ({
  date: ago(daysAgo),
  exercises,
});
const set = (weightKg: number, repetitions: number | null): LoadedSet => ({
  weightKg,
  repetitions,
});

describe('trainingComparison (README §20.1)', () => {
  it('labels the result with its method and version', () => {
    expect(trainingComparison([], [], 7, today).method).toEqual({
      id: 'training.window',
      version: 1,
    });
  });

  it('sums workouts, sets and volume per primary muscle group', () => {
    const sessions = [
      session(
        1,
        exercise('supino', 'chest', [set(60, 10), set(60, 8)]),
        exercise('rosca', 'biceps', [set(12, 12)]),
      ),
      session(3, exercise('crucifixo', 'chest', [set(14, 12)]), exercise('prancha', 'core', [], 3)),
      session(9, exercise('supino', 'chest', [set(55, 10)])),
    ];
    const { current, previous } = trainingComparison(sessions, [], 7, today);
    expect(current.workouts).toBe(2);
    expect(current.sets).toBe(7);
    expect(current.volumeKg).toBe(1080 + 144 + 168);
    expect(current.groups).toEqual([
      { muscleGroup: 'chest', sets: 3, volumeKg: 1248, workouts: 2 },
      { muscleGroup: 'biceps', sets: 1, volumeKg: 144, workouts: 1 },
      { muscleGroup: 'core', sets: 3, volumeKg: 0, workouts: 1 },
    ]);
    expect(previous.workouts).toBe(1);
  });

  it('finds load and repetition records against every earlier workout', () => {
    const sessions = [
      session(20, exercise('agachamento', 'quadriceps', [set(80, 8), set(70, 10)])),
      session(5, exercise('agachamento', 'quadriceps', [set(85, 5)])),
      session(2, exercise('agachamento', 'quadriceps', [set(70, 12), set(60, 15)])),
      session(1, exercise('remada', 'back', [set(50, 10)])),
    ];
    const { current, previous } = trainingComparison(sessions, [], 7, today);
    expect(current.records).toEqual([
      {
        date: ago(5),
        exerciseId: 'agachamento',
        name: 'agachamento',
        kind: 'load',
        weightKg: 85,
        repetitions: 5,
        previous: 80,
      },
      {
        date: ago(2),
        exerciseId: 'agachamento',
        name: 'agachamento',
        kind: 'reps',
        weightKg: 70,
        repetitions: 12,
        previous: 10,
      },
    ]);
    // The first workout with an exercise sets no record.
    expect(previous.records).toEqual([]);
  });

  it('counts planned days only from the day the plan was created', () => {
    // Monday, Wednesday and Friday; created last Monday (3 days ago).
    const plans = [{ weekdays: [1, 3, 5], since: ago(3) }];
    const sessions = [session(3), session(1), session(5)];
    const { current, previous } = trainingComparison(sessions, plans, 7, today);
    expect(current.adherence).toEqual({ done: 2, planned: 2 });
    expect(previous.adherence).toBeNull();
  });

  it('has no adherence without an active plan', () => {
    expect(trainingComparison([session(1)], [], 7, today).current.adherence).toBeNull();
  });
});
