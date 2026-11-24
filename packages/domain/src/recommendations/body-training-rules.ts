import { planAdherence, type PlanSchedule, type TrainingSession } from '../analytics/training';
import { inRange } from '../analytics/windows';
import { addDaysToLocalDate, type LocalDate } from '../local-date';
import type { StatPoint } from '../stats/series';
import type { Objective } from '../tracking/types';
import { trendAt } from '../weights/weight-stats';

/** Fixed limits of the body and training rules (README §20.2); changing one bumps its version. */
export const RULE_LIMITS = {
  plateauDays: 21,
  plateauKg: 0.2,
  rateDays: 14,
  volumeDays: 14,
  volumeDropPercent: 10,
  volumeMinWorkouts: 2,
  adherenceDays: 14,
  adherencePercent: 60,
  adherenceMinPlanned: 4,
} as const;

export interface PlateauEvidence {
  objective: 'fat_loss' | 'muscle_gain';
  days: number;
  trendStartKg: number;
  trendEndKg: number;
  changeKg: number;
  limitKg: number;
}

export interface RateBandEvidence {
  days: number;
  ratePerWeekKg: number;
  minKg: number;
  maxKg: number;
}

export interface VolumeDropEvidence {
  days: number;
  /** Volume (kg) of three periods in a row, oldest first. */
  volumesKg: [number, number, number];
  workouts: [number, number, number];
  limitPercent: number;
}

export interface AdherenceEvidence {
  days: number;
  done: number;
  planned: number;
  percent: number;
  limitPercent: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function trendChange(weights: readonly StatPoint[], today: LocalDate, days: number) {
  const daily = [...weights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => ({ date: p.date as LocalDate, weightKg: p.value, tagged: false }));
  const end = trendAt(daily, today);
  const start = trendAt(daily, addDaysToLocalDate(today, -days));
  return end === null || start === null ? null : { start, end, change: round2(end - start) };
}

/** The 7-day average moved less than 0.2 kg in 21 days while the project aims to lose or gain. */
export function weightPlateau(
  weights: readonly StatPoint[],
  objective: Objective | null,
  today: LocalDate,
): PlateauEvidence | null {
  if (objective !== 'fat_loss' && objective !== 'muscle_gain') return null;
  const { plateauDays: days, plateauKg: limitKg } = RULE_LIMITS;
  const trend = trendChange(weights, today, days);
  if (!trend || Math.abs(trend.change) >= limitKg) return null;
  return {
    objective,
    days,
    trendStartKg: trend.start,
    trendEndKg: trend.end,
    changeKg: trend.change,
    limitKg,
  };
}

/** The weekly pace of the last 14 days is outside the band the user set in the project. */
export function rateOutsideBand(
  weights: readonly StatPoint[],
  band: { minKg: number; maxKg: number } | null,
  today: LocalDate,
): RateBandEvidence | null {
  if (!band) return null;
  const days = RULE_LIMITS.rateDays;
  const trend = trendChange(weights, today, days);
  if (!trend) return null;
  const ratePerWeekKg = round2((trend.change * 7) / days);
  if (ratePerWeekKg >= band.minKg && ratePerWeekKg <= band.maxKg) return null;
  return { days, ratePerWeekKg, minKg: band.minKg, maxKg: band.maxKg };
}

const sessionVolume = (s: TrainingSession) => s.exercises.reduce((sum, e) => sum + e.volumeKg, 0);

/** Training volume fell more than 10% in two 14-day periods in a row, with 2 workouts in each. */
export function volumeDrop(
  sessions: readonly TrainingSession[],
  today: LocalDate,
): VolumeDropEvidence | null {
  const { volumeDays: days, volumeDropPercent: limitPercent, volumeMinWorkouts } = RULE_LIMITS;
  const periods = [2, 1, 0].map((back) => {
    const to = addDaysToLocalDate(today, -back * days);
    const inside = inRange(sessions, { from: addDaysToLocalDate(to, -(days - 1)), to });
    return {
      volume: round2(inside.reduce((sum, s) => sum + sessionVolume(s), 0)),
      count: inside.length,
    };
  }) as [
    { volume: number; count: number },
    { volume: number; count: number },
    { volume: number; count: number },
  ];
  if (periods.some((p) => p.count < volumeMinWorkouts)) return null;
  const fell = (before: number, after: number) => after < before * (1 - limitPercent / 100);
  const [a, b, c] = periods;
  if (!fell(a.volume, b.volume) || !fell(b.volume, c.volume)) return null;
  return {
    days,
    volumesKg: [a.volume, b.volume, c.volume],
    workouts: [a.count, b.count, c.count],
    limitPercent,
  };
}

/** Under 60% of the planned days done in the last 14 days, with at least 4 planned. */
export function lowAdherence(
  sessions: readonly TrainingSession[],
  plans: readonly PlanSchedule[],
  today: LocalDate,
): AdherenceEvidence | null {
  const { adherenceDays: days, adherencePercent: limitPercent, adherenceMinPlanned } = RULE_LIMITS;
  const result = planAdherence(sessions, plans, {
    from: addDaysToLocalDate(today, -(days - 1)),
    to: today,
  });
  if (!result || result.planned < adherenceMinPlanned) return null;
  const percent = Math.round((Math.min(result.done, result.planned) / result.planned) * 100);
  return percent < limitPercent ? { days, ...result, percent, limitPercent } : null;
}
