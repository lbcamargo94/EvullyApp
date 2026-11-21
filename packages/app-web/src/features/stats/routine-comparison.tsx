import {
  cardioComparison,
  habitComparison,
  formatChange,
  nutritionComparison,
  sleepComparison,
  weightComparison,
  stepsComparison,
  type AgainstTarget,
  type AnalyticsWindow,
  type LocalDate,
} from '@evully/app-core';
import type { HabitType, NutritionHistory } from '@evully/contracts';
import { Card, Table, TableHeader } from '@evully/ui';
import type { ReactNode } from 'react';
import { formatDuration } from '../sleep/messages.pt-BR';
import { Missing, Row, SectionRow } from './comparison-table';
import { comparisonMessages as m, formatWhole } from './messages.pt-BR';

interface Point {
  date: string;
  value: number;
}

/** Records of nutrition, sleep, cardio, steps and habits, as the domain reads them. */
export interface RoutineData {
  /** One weight per day, for "Peso × calorias". */
  weights: Point[];
  nutrition: NutritionHistory;
  nights: Point[];
  sleepTargetMinutes: number | null;
  cardio: { date: string; minutes: number; distanceKm: number | null }[];
  cardioTargetMinutes: number | null;
  steps: Point[];
  stepsTarget: number | null;
  habits: {
    id: string;
    name: string;
    type: HabitType;
    targetValue: number | null;
    history: Point[];
  }[];
}

const oneDecimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/** "1.800 kcal · 88% da meta", or a dash without records. */
function withTarget(value: AgainstTarget, unit: string): ReactNode {
  if (value.average === null) return <Missing />;
  const amount = `${oneDecimal.format(value.average)} ${unit}`;
  return value.targetPercent === null ? amount : m.ofTarget(amount, value.targetPercent);
}

function NutritionRows({ data, days, today }: Props) {
  if (data.nutrition.length === 0) return null;
  const { current, previous } = nutritionComparison(data.nutrition, days, today);
  return (
    <>
      <Row
        label={m.nutritionDays}
        current={m.daysOf(current.days, days)}
        previous={m.daysOf(previous.days, days)}
      />
      <Row
        label={m.caloriesAverage}
        current={withTarget(current.calories, 'kcal')}
        previous={withTarget(previous.calories, 'kcal')}
      />
      <Row
        label={m.proteinAverage}
        current={withTarget(current.protein, 'g')}
        previous={withTarget(previous.protein, 'g')}
      />
      <Row
        label={m.carbohydrateAverage}
        current={withTarget(current.carbohydrate, 'g')}
        previous={withTarget(previous.carbohydrate, 'g')}
      />
      <Row
        label={m.fatAverage}
        current={withTarget(current.fat, 'g')}
        previous={withTarget(previous.fat, 'g')}
      />
    </>
  );
}

/** The moving-average change next to the mean calories of the same period; no relation computed. */
function WeightIntakeRow({ data, days, today }: Props) {
  if (data.weights.length === 0 || data.nutrition.length === 0) return null;
  const weight = weightComparison(data.weights, days, today);
  const food = nutritionComparison(data.nutrition, days, today);
  const cell = (change: number | null, kcal: number | null) =>
    change === null || kcal === null ? (
      <Missing />
    ) : (
      m.weightIntakeValue(formatChange(change, 'kg'), formatWhole(kcal))
    );
  return (
    <Row
      label={m.weightIntake}
      current={cell(weight.current.changeKg, food.current.calories.average)}
      previous={cell(weight.previous.changeKg, food.previous.calories.average)}
    />
  );
}

function SleepRows({ data, days, today }: Props) {
  if (data.nights.length === 0) return null;
  const { current, previous } = sleepComparison(data.nights, data.sleepTargetMinutes, days, today);
  const cell = (w: typeof current) => {
    if (w.averageMinutes === null) return <Missing />;
    const amount = m.nightsAverage(formatDuration(w.averageMinutes), w.nights);
    return w.targetPercent === null ? amount : m.ofTarget(amount, w.targetPercent);
  };
  return <Row label={m.sleepAverage} current={cell(current)} previous={cell(previous)} />;
}

function CardioRows({ data, days, today }: Props) {
  if (data.cardio.length === 0) return null;
  const { current, previous } = cardioComparison(
    data.cardio,
    data.cardioTargetMinutes,
    days,
    today,
  );
  const total = (w: typeof current) =>
    m.cardioTotal(w.sessions, w.minutes, w.distanceKm > 0 ? oneDecimal.format(w.distanceKm) : null);
  const weekly = (w: typeof current) => {
    const amount = `${formatWhole(w.minutesPerWeek)} min`;
    return w.targetPercent === null ? amount : m.ofTarget(amount, w.targetPercent);
  };
  return (
    <>
      <Row label={m.cardioLabel} current={total(current)} previous={total(previous)} />
      <Row label={m.cardioPerWeek} current={weekly(current)} previous={weekly(previous)} />
    </>
  );
}

function StepsRows({ data, days, today }: Props) {
  if (data.steps.length === 0) return null;
  const { current, previous } = stepsComparison(data.steps, data.stepsTarget, days, today);
  const cell = (w: typeof current) => {
    if (w.average === null) return <Missing />;
    const amount = `${formatWhole(w.average)} ${m.stepsUnit}`;
    return w.daysAtTarget === null ? amount : m.stepsAtTarget(amount, w.daysAtTarget, w.days);
  };
  return <Row label={m.stepsAverage} current={cell(current)} previous={cell(previous)} />;
}

interface Props {
  data: RoutineData;
  days: AnalyticsWindow;
  today: LocalDate;
}

/** Nutrition, sleep, cardio and steps rows of "Comparar períodos". */
export function RoutineRows(props: Props) {
  const { data } = props;
  return (
    <>
      {data.nutrition.length > 0 && <SectionRow>{m.sections.food}</SectionRow>}
      <NutritionRows {...props} />
      <WeightIntakeRow {...props} />
      {[data.nights, data.cardio, data.steps].some((r) => r.length > 0) && (
        <SectionRow>{m.sections.routine}</SectionRow>
      )}
      <SleepRows {...props} />
      <CardioRows {...props} />
      <StepsRows {...props} />
    </>
  );
}

/** Each habit: days done over the days of the period, by the habits rule. */
export function HabitsDetail({ data, days, today }: Props) {
  if (data.habits.length === 0) return null;
  return (
    <Card aria-labelledby="habits-period-title">
      <h2 id="habits-period-title" className="text-heading font-semibold">
        {m.habitsTitle(days)}
      </h2>
      <Table>
        <thead>
          <tr>
            <TableHeader>{m.habit}</TableHeader>
            <TableHeader>{m.current(days)}</TableHeader>
            <TableHeader>{m.previous(days)}</TableHeader>
          </tr>
        </thead>
        <tbody>
          {data.habits.map((habit) => {
            const { current, previous } = habitComparison(habit, habit.history, days, today);
            return (
              <Row
                key={habit.id}
                label={habit.name}
                current={m.daysDone(current.done, current.days)}
                previous={m.daysDone(previous.done, previous.days)}
              />
            );
          })}
        </tbody>
      </Table>
      <p className="text-caption text-text-muted">{m.habitsMethod}</p>
    </Card>
  );
}
