import type { Sex } from '../profiles/profile';
import type { FocusArea, Objective, WeightDisplay } from './types';

/** Version of the questionnaire rules, stored with every config they produce (README §8.2.2). */
export const TRACKING_RULES_VERSION = 'tracking-rules@1';
export const TRACKING_QUESTIONNAIRE_VERSION = 'tracking@1';

const MEASUREMENTS_BY_AREA: Record<FocusArea, readonly string[]> = {
  waist: ['waist', 'abdomen'],
  hips: ['hips'],
  arms: ['right_arm', 'left_arm'],
  legs: ['right_thigh', 'left_thigh', 'right_calf', 'left_calf'],
  chest: ['chest'],
};
const CONTRACTED_BICEPS = ['right_biceps', 'left_biceps'] as const;
const DEFAULT_TAGS = ['Retenção', 'Refeição salgada', 'Pós-treino', 'Viagem', 'Doente'] as const;
const CYCLE_TAG = 'Ciclo menstrual';

export interface TrackingChoices {
  objective: Objective | null;
  focusAreas: readonly FocusArea[];
  weightDisplay: WeightDisplay;
}

export interface TrackingProposal {
  focusAreas: FocusArea[];
  weightDisplay: WeightDisplay;
  /** Measurement type codes, in display order. */
  measurementCodes: string[];
  tags: string[];
}

/** Turns questionnaire answers into a proposed configuration. Never applied without acceptance. */
export function buildTrackingProposal(choices: TrackingChoices, sex: Sex | null): TrackingProposal {
  const focusAreas = choices.focusAreas.length
    ? [...new Set(choices.focusAreas)]
    : (['waist'] as FocusArea[]);
  const tracksMuscle = choices.objective === 'muscle_gain' || choices.objective === 'recomposition';
  const measurementCodes = focusAreas.flatMap((area) =>
    area === 'arms' && tracksMuscle
      ? [...MEASUREMENTS_BY_AREA.arms, ...CONTRACTED_BICEPS]
      : MEASUREMENTS_BY_AREA[area],
  );
  return {
    focusAreas,
    weightDisplay: choices.weightDisplay,
    measurementCodes,
    tags: sex === 'female' ? [...DEFAULT_TAGS, CYCLE_TAG] : [...DEFAULT_TAGS],
  };
}

/** Configuration used when the questionnaire is skipped (README §8.2.3). */
export function defaultTrackingProposal(sex: Sex | null): TrackingProposal {
  return buildTrackingProposal(
    { objective: null, focusAreas: ['waist'], weightDisplay: 'trend' },
    sex,
  );
}

/** The menstrual-cycle interest question is shown unless the profile is male (README §8.2.4). */
export function asksAboutMenstrualCycle(sex: Sex | null): boolean {
  return sex !== 'male';
}
