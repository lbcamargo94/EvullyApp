import { ValidationError } from '@evully/domain';
import type { TagRepository } from '../ports/weight-repository';

/** Tags must belong to the same profile as the weighing (README §2.2). */
export async function assertOwnedTags(
  tags: TagRepository,
  profileId: string,
  tagIds: readonly string[],
): Promise<string[]> {
  const unique = [...new Set(tagIds)];
  const owned = await tags.filterOwned(profileId, unique);
  if (owned.length !== unique.length) {
    throw new ValidationError('weight.invalid_tags', 'Tag does not belong to this profile');
  }
  return unique;
}
