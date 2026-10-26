import { ValidationError } from '../errors';
import type { PlanTemplate } from './plan-templates';

export const WORKOUT_QUESTIONNAIRE_VERSION = 'workouts@1';
export const WORKOUT_RULES_VERSION = 'workout-rules@1';

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const TRAINING_LOCATIONS = ['gym', 'home', 'both'] as const;
export const EQUIPMENT = ['barbell', 'dumbbells', 'machines', 'cables', 'bench', 'none'] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type TrainingLocation = (typeof TRAINING_LOCATIONS)[number];
export type Equipment = (typeof EQUIPMENT)[number];

/** Answers of the workouts module questionnaire (README §10, "Questionário do módulo"). */
export interface WorkoutPreferences {
  experience: ExperienceLevel | null;
  daysPerWeek: number | null;
  location: TrainingLocation | null;
  equipment: Equipment[];
}

export const EMPTY_WORKOUT_PREFERENCES: WorkoutPreferences = {
  experience: null,
  daysPerWeek: null,
  location: null,
  equipment: [],
};

/** Days 1–7; equipment in a fixed order, "none" only when nothing else is chosen. */
export function normalizeWorkoutPreferences(answers: WorkoutPreferences): WorkoutPreferences {
  const days = answers.daysPerWeek;
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 7)) {
    throw new ValidationError('workout_questionnaire.days_out_of_range', 'Days out of range');
  }
  const chosen = EQUIPMENT.filter((e) => answers.equipment.includes(e));
  const equipment = chosen.some((e) => e !== 'none') ? chosen.filter((e) => e !== 'none') : chosen;
  return {
    experience: answers.experience,
    daysPerWeek: days,
    location: answers.location,
    equipment,
  };
}

export type SuggestionReason = 'gym_five_days' | 'home_core' | 'core_complement';

export interface PlanSuggestions {
  rulesVersion: string;
  templates: { template: PlanTemplate['code']; reason: SuggestionReason }[];
  /** Gym with fewer than 5 days: the template has 5, so building an own plan fits better. */
  buildOwnPlan: boolean;
}

/**
 * Deterministic suggestions of template plans (README §10, §21.2): the user
 * decides; nothing is imported automatically. Experience and equipment are
 * recorded only, for future rules.
 */
export function suggestPlanTemplates(prefs: WorkoutPreferences): PlanSuggestions {
  const templates: PlanSuggestions['templates'] = [];
  const atGym = prefs.location === 'gym' || prefs.location === 'both';
  const fiveDays = (prefs.daysPerWeek ?? 0) >= 5;
  if (atGym && fiveDays) templates.push({ template: 'cutting_2026', reason: 'gym_five_days' });
  if (prefs.location === 'home' || prefs.location === 'both') {
    templates.push({ template: 'core_home', reason: 'home_core' });
  } else if (prefs.location === 'gym') {
    templates.push({ template: 'core_home', reason: 'core_complement' });
  }
  return {
    rulesVersion: WORKOUT_RULES_VERSION,
    templates,
    buildOwnPlan: atGym && prefs.daysPerWeek !== null && !fiveDays,
  };
}
