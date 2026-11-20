import { addDaysToLocalDate, parseLocalDate, type LocalDate } from '../local-date';
import type { StatPoint } from '../stats/series';
import { TREND_MIN_DAYS, trendAt, type DailyWeight } from '../weights/weight-stats';
import {
  beforeRange,
  inRange,
  meanOf,
  windowRanges,
  type AnalyticsMethod,
  type AnalyticsWindow,
  type DateRange,
  type PeriodComparison,
} from './windows';

/**
 * Weight in a window: mean of the days with a weighing (needs 3 of them, as
 * the moving average), the 7-day moving average on its last day, and how
 * much that average moved since the day before the window.
 */
export const WEIGHT_WINDOW_METHOD: AnalyticsMethod = { id: 'weight.window', version: 1 };
/** Measurement in a window: latest value, and its change from the last one before it. */
export const MEASUREMENT_WINDOW_METHOD: AnalyticsMethod = { id: 'measurement.window', version: 1 };

export interface WeightWindow {
  /** Days with a weighing. */
  days: number;
  averageKg: number | null;
  /** Moving average on the last day of the window. */
  trendKg: number | null;
  /** Moving average at the end minus the one on the day before the window. */
  changeKg: number | null;
  /** The change spread over the window, per 7 days. */
  ratePerWeekKg: number | null;
}

export interface MeasurementWindow {
  /** Days with this measurement. */
  days: number;
  /** Latest value in the window. */
  latestCm: number | null;
  /** Latest minus the last value before the window (or the first one in it). */
  changeCm: number | null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

function weightWindow(daily: readonly DailyWeight[], range: DateRange, days: number): WeightWindow {
  const inside = inRange(
    daily.map((d) => ({ date: d.date, value: d.weightKg })),
    range,
  );
  const average = inside.length >= TREND_MIN_DAYS ? meanOf(inside) : null;
  const trendEnd = trendAt(daily, range.to);
  const trendBefore = trendAt(daily, addDaysToLocalDate(range.from, -1));
  const change = trendEnd !== null && trendBefore !== null ? round2(trendEnd - trendBefore) : null;
  return {
    days: inside.length,
    averageKg: average === null ? null : round2(average),
    trendKg: trendEnd,
    changeKg: change,
    ratePerWeekKg: change === null ? null : round2((change * 7) / days),
  };
}

/**
 * Weight of the last `days` days against the `days` before them, from one
 * weight per day (README §20.1). Nothing is estimated: a figure without
 * enough weighings is null.
 */
export function weightComparison(
  weights: readonly StatPoint[],
  days: AnalyticsWindow,
  today: LocalDate,
): PeriodComparison<WeightWindow> {
  const daily = weights
    .map((p) => ({ date: parseLocalDate(p.date), weightKg: p.value, tagged: false }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const ranges = windowRanges(days, today);
  return {
    method: WEIGHT_WINDOW_METHOD,
    current: weightWindow(daily, ranges.current, days),
    previous: weightWindow(daily, ranges.previous, days),
  };
}

function measurementWindow(points: readonly StatPoint[], range: DateRange): MeasurementWindow {
  const inside = inRange(points, range);
  const latest = inside.at(-1);
  const baseline = beforeRange(points, range).at(-1) ?? inside[0];
  return {
    days: inside.length,
    latestCm: latest?.value ?? null,
    changeCm:
      latest && baseline && latest !== baseline ? round1(latest.value - baseline.value) : null,
  };
}

/** One measurement type in the last `days` days against the `days` before them. */
export function measurementComparison(
  points: readonly StatPoint[],
  days: AnalyticsWindow,
  today: LocalDate,
): PeriodComparison<MeasurementWindow> {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const ranges = windowRanges(days, today);
  return {
    method: MEASUREMENT_WINDOW_METHOD,
    current: measurementWindow(sorted, ranges.current),
    previous: measurementWindow(sorted, ranges.previous),
  };
}
