import { ConflictError, ValidationError } from '../errors';

export const TAG_NAME_MAX_LENGTH = 30;

const key = (name: string) => name.toLocaleLowerCase('pt-BR');

/**
 * Validates a new tag name for a profile (README §8.2.2): 1–30 characters and
 * unique among the profile's tags, ignoring case ("Viagem" = "viagem").
 */
export function normalizeTagName(name: string, existingNames: readonly string[]): string {
  const normalized = name.trim().replace(/\s+/g, ' ');
  if (!normalized) throw new ValidationError('tag.name_required', 'Tag name is required');
  if ([...normalized].length > TAG_NAME_MAX_LENGTH) {
    throw new ValidationError('tag.name_too_long', 'Tag name is too long');
  }
  if (existingNames.some((existing) => key(existing) === key(normalized))) {
    throw new ConflictError('tag.duplicate', 'Tag already exists');
  }
  return normalized;
}
