import { ConflictError, ValidationError } from '../errors';

export const MEAL_TEMPLATE_NAME_MAX_LENGTH = 40;

const key = (name: string) => name.toLocaleLowerCase('pt-BR');

/** Favorite meal name (README §9.5): 1–40 characters, unique in the profile ignoring case. */
export function normalizeMealTemplateName(name: string, existingNames: readonly string[]): string {
  const normalized = name.trim().replace(/\s+/g, ' ');
  if (!normalized) throw new ValidationError('meal_template.name_required', 'Name is required');
  if ([...normalized].length > MEAL_TEMPLATE_NAME_MAX_LENGTH) {
    throw new ValidationError('meal_template.name_too_long', 'Name is too long');
  }
  if (existingNames.some((existing) => key(existing) === key(normalized))) {
    throw new ConflictError('meal_template.duplicate', 'Favorite meal already exists');
  }
  return normalized;
}
