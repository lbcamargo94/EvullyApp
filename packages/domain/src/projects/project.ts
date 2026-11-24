import { ValidationError } from '../errors';
import { daysBetween, parseLocalDate, type LocalDate } from '../local-date';
import type { Objective } from '../tracking/types';

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface Project {
  id: string;
  profileId: string;
  name: string;
  objective: Objective;
  startDate: LocalDate;
  targetDate: LocalDate;
  status: ProjectStatus;
  notes: string | null;
  /** Optional weekly pace band in kg/week, set by the user (README §7.1, §20.2). */
  weeklyRateMinKg: number | null;
  weeklyRateMaxKg: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDraft {
  name: string;
  objective: Objective;
  startDate: string;
  targetDate: string;
}

export const PROJECT_NAME_MAX_LENGTH = 60;
/** Longest project accepted, to catch typos in the year (e.g. 2062 instead of 2026). */
export const PROJECT_MAX_DAYS = 5 * 366;

/** Validates a project before it is created (README §7.1, §8.3). */
export function normalizeProjectDraft(draft: ProjectDraft): Omit<
  ProjectDraft,
  'startDate' | 'targetDate'
> & {
  startDate: LocalDate;
  targetDate: LocalDate;
} {
  const name = draft.name.trim().replace(/\s+/g, ' ');
  if (!name) throw new ValidationError('project.name_required', 'Project name is required');
  if ([...name].length > PROJECT_NAME_MAX_LENGTH) {
    throw new ValidationError('project.name_too_long', 'Project name is too long');
  }
  const startDate = parseLocalDate(draft.startDate);
  const targetDate = parseLocalDate(draft.targetDate);
  const span = daysBetween(startDate, targetDate);
  if (span < 0) {
    throw new ValidationError('project.target_before_start', 'Target date is before start date');
  }
  if (span > PROJECT_MAX_DAYS) {
    throw new ValidationError('project.too_long', 'Project is longer than five years');
  }
  return { name, objective: draft.objective, startDate, targetDate };
}

/** Widest weekly pace accepted, in kg/week either way. */
export const MAX_WEEKLY_RATE_KG = 2;

export interface RateBand {
  weeklyRateMinKg: number | null;
  weeklyRateMaxKg: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The project's optional pace band (README §7.1): both ends or none, each
 * between −2 and +2 kg/week (negative is a loss), min not above max. Never
 * filled by the app.
 */
export function normalizeRateBand(band: RateBand): RateBand {
  const { weeklyRateMinKg: min, weeklyRateMaxKg: max } = band;
  if (min === null && max === null) return { weeklyRateMinKg: null, weeklyRateMaxKg: null };
  if (min === null || max === null) {
    throw new ValidationError('project.rate_band_incomplete', 'Both ends of the band are needed');
  }
  const inRange = (n: number) => Number.isFinite(n) && Math.abs(n) <= MAX_WEEKLY_RATE_KG;
  if (!inRange(min) || !inRange(max)) {
    throw new ValidationError('project.rate_band_out_of_range', 'Pace band is out of range');
  }
  if (min > max) {
    throw new ValidationError('project.rate_band_inverted', 'Band minimum is above its maximum');
  }
  return { weeklyRateMinKg: round2(min), weeklyRateMaxKg: round2(max) };
}
