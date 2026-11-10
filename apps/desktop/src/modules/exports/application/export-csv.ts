import {
  formatCsvDate,
  sessionStats,
  writeCsv,
  type CsvValue,
  type FoodSnapshot,
  type MealType,
} from '@evully/domain';
import type { Clock } from '../../shared/ports';
import type { ExportTables } from '../ports/export-ports';

/** Pt-BR labels written in the CSVs (the UI keeps its own copy in app-web). */
const MEALS: Record<MealType, string> = {
  breakfast: 'Café da manhã',
  morning_snack: 'Lanche da manhã',
  lunch: 'Almoço',
  pre_workout: 'Pré-treino',
  dinner: 'Jantar',
  supper: 'Ceia',
  custom: 'Outra refeição',
};
const UNITS = { g: 'g', ml: 'ml', portion: 'porção' } as const;
const ACTIVITIES = {
  walking: 'Caminhada',
  cycling: 'Bicicleta',
  running: 'Corrida',
  elliptical: 'Elíptico',
  custom: 'Outra atividade',
} as const;
const INTENSITIES = { light: 'leve', moderate: 'moderada', vigorous: 'intensa' } as const;
const HABIT_TYPES = {
  boolean: 'sim/não',
  quantity: 'quantidade',
  duration: 'duração',
  time: 'horário',
};
const FREE_WORKOUT = 'Treino livre';

const yesNo = (value: boolean) => (value ? 'sim' : 'não');
const byKey = <T>(rows: readonly T[], key: (row: T) => string) =>
  [...rows].sort((a, b) => key(a).localeCompare(key(b)));
const clockText = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/**
 * The CSVs of the zip export (README §14.3), in the Brazilian Excel format.
 * `weights.csv` and `measurements.csv` use the import columns (§8.8).
 */
export function buildCsvFiles(data: ExportTables, clock: Clock): Record<string, string> {
  const time = (iso: string | null) => (iso ? clock.isoToLocal(iso).time : null);
  return {
    'weights.csv': weightsCsv(data, time),
    'measurements.csv': measurementsCsv(data),
    ...workoutCsvs(data, clock, time),
    'nutrition.csv': nutritionCsv(data),
    'water.csv': writeCsv(
      ['data', 'hora', 'quantidade_ml'],
      byKey(data.water_logs, (w) => w.logged_at).map((w) => [
        formatCsvDate(w.log_date),
        time(w.logged_at),
        w.amount_ml,
      ]),
    ),
    'sleep.csv': writeCsv(
      ['data', 'deitou', 'dormiu', 'acordou', 'duracao_min', 'qualidade', 'observacao'],
      byKey(data.sleep_logs, (s) => s.sleep_date).map((s) => [
        formatCsvDate(s.sleep_date),
        time(s.bed_time),
        time(s.sleep_time),
        time(s.wake_time),
        s.duration_minutes,
        s.quality,
        s.notes,
      ]),
    ),
    'cardio.csv': cardioCsv(data, time),
    'habits.csv': habitsCsv(data),
  };
}

type TimeOf = (iso: string | null) => string | null;

function weightsCsv(data: ExportTables, time: TimeOf) {
  return writeCsv(
    ['data', 'hora', 'peso_kg', 'observacao'],
    byKey(data.body_weights, (w) => w.measured_at).map((w) => [
      formatCsvDate(w.measured_on),
      time(w.measured_at),
      w.weight_kg,
      w.notes,
    ]),
  );
}

/** One column per measurement the profile has values for, by catalog order. */
function measurementsCsv(data: ExportTables) {
  const used = new Set(data.body_measurement_values.map((v) => v.measurement_type_id));
  const types = [...data.measurement_types]
    .filter((t) => used.has(t.id))
    .sort((a, b) => a.sort_order - b.sort_order);
  const values = new Map(
    data.body_measurement_values.map((v) => [`${v.measurement_id}|${v.measurement_type_id}`, v]),
  );
  return writeCsv(
    ['data', ...types.map((t) => t.csv_name), 'observacao'],
    byKey(data.body_measurements, (m) => m.measured_at).map((m) => [
      formatCsvDate(m.measured_on),
      ...types.map((t) => values.get(`${m.id}|${t.id}`)?.value_cm ?? null),
      m.notes,
    ]),
  );
}

function workoutCsvs(data: ExportTables, clock: Clock, time: TimeOf) {
  const dayNames = new Map(data.workout_days.map((d) => [d.id, d]));
  const planNames = new Map(data.workout_plans.map((p) => [p.id, p.name]));
  const exerciseNames = new Map(data.exercises.map((e) => [e.id, e.name]));
  const finished = byKey(
    data.workout_sessions.filter((s) => s.finished_at !== null),
    (s) => s.started_at,
  );
  const performancesOf = (sessionId: string) =>
    data.exercise_performances
      .filter((p) => p.session_id === sessionId)
      .sort((a, b) => a.sort_order - b.sort_order);
  const setsOf = (performanceId: string) =>
    data.exercise_sets
      .filter((s) => s.performance_id === performanceId)
      .sort((a, b) => a.set_number - b.set_number);

  const workouts: CsvValue[][] = [];
  const sets: CsvValue[][] = [];
  for (const session of finished) {
    const day = session.workout_day_id ? dayNames.get(session.workout_day_id) : undefined;
    const date = formatCsvDate(clock.isoToLocal(session.started_at).date);
    const dayName = day?.name ?? FREE_WORKOUT;
    const sessionSets = performancesOf(session.id).flatMap((p) =>
      setsOf(p.id).map((s) => ({ ...s, exercise: exerciseNames.get(p.exercise_id) ?? '' })),
    );
    const { volumeKg } = sessionStats({
      sessionId: session.id,
      startedAt: session.started_at,
      sets: sessionSets.map((s) => ({
        setNumber: s.set_number,
        weightKg: s.weight_kg,
        repetitions: s.repetitions,
        durationSeconds: s.duration_seconds,
        rir: s.rir,
        completed: s.completed === 1,
      })),
    });
    workouts.push([
      date,
      time(session.started_at),
      time(session.finished_at),
      day ? (planNames.get(day.plan_id) ?? null) : null,
      dayName,
      volumeKg,
      session.notes,
    ]);
    for (const s of sessionSets) {
      sets.push([
        date,
        dayName,
        s.exercise,
        s.set_number,
        s.weight_kg,
        s.repetitions,
        s.duration_seconds,
        s.rir,
        yesNo(s.completed === 1),
      ]);
    }
  }
  return {
    'workouts.csv': writeCsv(
      ['data', 'inicio', 'fim', 'plano', 'treino', 'volume_kg', 'observacao'],
      workouts,
    ),
    'exercise_sets.csv': writeCsv(
      [
        'data',
        'treino',
        'exercicio',
        'serie',
        'carga_kg',
        'repeticoes',
        'duracao_s',
        'rir',
        'concluida',
      ],
      sets,
    ),
  };
}

function nutritionCsv(data: ExportTables) {
  const mealOrder = (m: MealType) => Object.keys(MEALS).indexOf(m);
  const logs = [...data.food_logs].sort(
    (a, b) =>
      a.log_date.localeCompare(b.log_date) ||
      mealOrder(a.meal_type) - mealOrder(b.meal_type) ||
      a.sort_order - b.sort_order,
  );
  return writeCsv(
    [
      'data',
      'refeicao',
      'alimento',
      'marca',
      'quantidade',
      'unidade',
      'kcal',
      'proteina_g',
      'carboidrato_g',
      'gordura_g',
      'consumido',
    ],
    logs.map((l) => {
      const food = JSON.parse(l.food_snapshot) as FoodSnapshot;
      return [
        formatCsvDate(l.log_date),
        l.meal_type === 'custom' && l.meal_name ? l.meal_name : MEALS[l.meal_type],
        food.name,
        food.brand,
        l.quantity,
        UNITS[food.referenceUnit],
        l.calories_kcal,
        l.protein_g,
        l.carbohydrate_g,
        l.fat_g,
        yesNo(l.consumed_at !== null),
      ];
    }),
  );
}

function cardioCsv(data: ExportTables, time: TimeOf) {
  return writeCsv(
    [
      'data',
      'inicio',
      'atividade',
      'duracao_min',
      'distancia_km',
      'passos',
      'intensidade',
      'fc_media',
      'observacao',
    ],
    byKey(data.cardio_sessions, (c) => c.started_at).map((c) => [
      formatCsvDate(c.session_date),
      time(c.started_at),
      c.activity_type === 'custom' && c.activity_name
        ? c.activity_name
        : ACTIVITIES[c.activity_type],
      c.duration_minutes,
      c.distance_km,
      c.steps,
      c.intensity ? INTENSITIES[c.intensity] : null,
      c.heart_rate_average,
      c.notes,
    ]),
  );
}

function habitsCsv(data: ExportTables) {
  const habits = new Map(data.habit_definitions.map((h) => [h.id, h]));
  const rows = byKey(data.habit_logs, (l) => l.log_date).flatMap((l) => {
    const habit = habits.get(l.habit_definition_id);
    if (!habit) return [];
    const value =
      habit.type === 'boolean'
        ? yesNo(l.value === 1)
        : habit.type === 'time'
          ? clockText(l.value)
          : l.value;
    const unit = habit.type === 'duration' ? 'min' : habit.unit;
    return [[formatCsvDate(l.log_date), habit.name, HABIT_TYPES[habit.type], value, unit, l.notes]];
  });
  return writeCsv(['data', 'habito', 'tipo', 'valor', 'unidade', 'observacao'], rows);
}
