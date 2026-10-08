import type { BodyRegion, Objective } from './types';

export type Indicator = 'weight' | BodyRegion;
export type FavorableDirection = 'down' | 'up' | 'none';
export type ChangeTone = 'positive' | 'caution' | 'neutral';

const NEUTRAL: Record<Indicator, FavorableDirection> = {
  weight: 'none',
  waist: 'none',
  hips: 'none',
  arms: 'none',
  legs: 'none',
  chest: 'none',
  other: 'none',
};

/** README §7.6: which change is favorable for each indicator, per objective. */
const FAVORABLE: Record<Objective, Record<Indicator, FavorableDirection>> = {
  fat_loss: { ...NEUTRAL, weight: 'down', waist: 'down' },
  muscle_gain: { ...NEUTRAL, weight: 'up', hips: 'up', arms: 'up', legs: 'up', chest: 'up' },
  recomposition: { ...NEUTRAL, waist: 'down', arms: 'up', legs: 'up', chest: 'up' },
  maintenance: NEUTRAL,
};

/** Changes smaller than this (kg or cm) are shown as "stable". */
export const STABLE_THRESHOLD = 0.1;

export function favorableDirection(
  indicator: Indicator,
  objective: Objective | null,
): FavorableDirection {
  return objective ? FAVORABLE[objective][indicator] : 'none';
}

/** Color tone of a change: never red, and neutral without an active project. */
export function changeTone(
  change: number,
  indicator: Indicator,
  objective: Objective | null,
): ChangeTone {
  if (Math.abs(change) < STABLE_THRESHOLD) return 'neutral';
  const favorable = favorableDirection(indicator, objective);
  if (favorable === 'none') return 'neutral';
  return change < 0 === (favorable === 'down') ? 'positive' : 'caution';
}
