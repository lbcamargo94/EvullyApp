import { daysBetween, type LocalDate } from '../local-date';

export interface WeighingRecord {
  measuredOn: LocalDate;
  /** ISO 8601 UTC instant; orders weighings within the same day. */
  measuredAt: string;
  weightKg: number;
  tagged?: boolean;
}

export interface DailyWeight {
  date: LocalDate;
  weightKg: number;
  tagged: boolean;
}

/** Window and minimum coverage of the moving average (README §7.2). */
export const TREND_WINDOW_DAYS = 7;
export const TREND_MIN_DAYS = 3;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Weight of each day: the most recent weighing of that day. A day is "tagged"
 * if any of its weighings has a tag. Oldest first.
 */
export function dailyWeights(records: readonly WeighingRecord[]): DailyWeight[] {
  const byDay = new Map<string, { latest: WeighingRecord; tagged: boolean }>();
  for (const r of records) {
    const day = byDay.get(r.measuredOn);
    if (!day) byDay.set(r.measuredOn, { latest: r, tagged: !!r.tagged });
    else {
      if (r.measuredAt > day.latest.measuredAt) day.latest = r;
      day.tagged ||= !!r.tagged;
    }
  }
  return [...byDay.values()]
    .map(({ latest, tagged }) => ({ date: latest.measuredOn, weightKg: latest.weightKg, tagged }))
    .sort((a, b) => daysBetween(b.date, a.date));
}

/**
 * Moving average for `date`: mean of the daily weights from date−6 to date.
 * Null unless at least 3 of those 7 days have a weighing (README §7.2).
 */
export function trendAt(daily: readonly DailyWeight[], date: LocalDate): number | null {
  const window = daily.filter((d) => {
    const age = daysBetween(d.date, date);
    return age >= 0 && age < TREND_WINDOW_DAYS;
  });
  if (window.length < TREND_MIN_DAYS) return null;
  return round2(window.reduce((sum, d) => sum + d.weightKg, 0) / window.length);
}

/** First daily weight on or after the project start; without a project, the first ever. */
export function startingWeight(
  daily: readonly DailyWeight[],
  projectStart: LocalDate | null,
): DailyWeight | null {
  return daily.find((d) => !projectStart || daysBetween(projectStart, d.date) >= 0) ?? null;
}

export interface WeightStats {
  current: DailyWeight | null;
  trend: number | null;
  start: DailyWeight | null;
  change: number | null;
  trendChange: number | null;
  series: (DailyWeight & { trend: number | null })[];
}

/** Everything the weight screens show, derived only from the records (README §7.2). */
export function weightStats(
  records: readonly WeighingRecord[],
  today: LocalDate,
  projectStart: LocalDate | null,
): WeightStats {
  const daily = dailyWeights(records);
  const current = daily.at(-1) ?? null;
  const trend = trendAt(daily, today);
  const start = startingWeight(daily, projectStart);
  return {
    current,
    trend,
    start,
    change: current && start ? round2(current.weightKg - start.weightKg) : null,
    trendChange: trend !== null && start ? round2(trend - start.weightKg) : null,
    series: daily.map((d) => ({ ...d, trend: trendAt(daily, d.date) })),
  };
}
