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
