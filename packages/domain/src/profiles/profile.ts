import { ValidationError } from '../errors';
import { daysBetween, parseLocalDate, type LocalDate } from '../local-date';

export type Sex = 'male' | 'female';

export interface Profile {
  id: string;
  name: string;
  birthDate: LocalDate | null;
  sex: Sex | null;
  heightCm: number | null;
  unitSystem: 'metric';
  createdAt: string;
  updatedAt: string;
}

export interface ProfileDraft {
  name: string;
  birthDate: string | null;
  sex: Sex | null;
  heightCm: number | null;
}

export const PROFILE_NAME_MAX_LENGTH = 60;
export const MIN_HEIGHT_CM = 50;
export const MAX_HEIGHT_CM = 272;
const EARLIEST_BIRTH_DATE = parseLocalDate('1900-01-01');

/** Validates and normalizes profile fields (README §8.3). `today` comes from the Clock port. */
export function normalizeProfileDraft(
  draft: ProfileDraft,
  today: LocalDate,
): Omit<ProfileDraft, 'birthDate'> & { birthDate: LocalDate | null } {
  return {
    name: normalizeName(draft.name),
    birthDate: draft.birthDate === null ? null : validateBirthDate(draft.birthDate, today),
    sex: draft.sex,
    heightCm: draft.heightCm === null ? null : validateHeight(draft.heightCm),
  };
}

function normalizeName(name: string): string {
  const normalized = name.trim().replace(/\s+/g, ' ');
  if (!normalized) throw new ValidationError('profile.name_required', 'Name is required');
  if ([...normalized].length > PROFILE_NAME_MAX_LENGTH) {
    throw new ValidationError('profile.name_too_long', 'Name is too long');
  }
  return normalized;
}

function validateBirthDate(value: string, today: LocalDate): LocalDate {
  const birthDate = parseLocalDate(value);
  if (daysBetween(birthDate, today) < 0) {
    throw new ValidationError('profile.birth_date_in_future', 'Birth date is in the future');
  }
  if (daysBetween(EARLIEST_BIRTH_DATE, birthDate) < 0) {
    throw new ValidationError('profile.birth_date_too_old', 'Birth date is too old');
  }
  return birthDate;
}

function validateHeight(heightCm: number): number {
  if (!Number.isFinite(heightCm) || heightCm < MIN_HEIGHT_CM || heightCm > MAX_HEIGHT_CM) {
    throw new ValidationError('profile.height_out_of_range', 'Height is out of range');
  }
  return Math.round(heightCm * 10) / 10;
}

/** Letter shown in the avatar; handles accented names ("Érica" → "É"). */
export function profileInitial(name: string): string {
  const first = [...name.trim()][0];
  return first ? first.toLocaleUpperCase('pt-BR') : '?';
}
