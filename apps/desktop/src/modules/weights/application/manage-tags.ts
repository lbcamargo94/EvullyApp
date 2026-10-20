import type { RenameTagInput } from '@evully/contracts';
import { normalizeTagName, NotFoundError } from '@evully/domain';
import type { Clock } from '../../shared/ports';
import type { TagRef, TagRepository } from '../ports/weight-repository';

/** Renames a tag; the new name must be unique in the profile, ignoring case. */
export class RenameTag {
  constructor(
    private readonly tags: TagRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ profileId, id, name }: RenameTagInput): Promise<TagRef> {
    const all = await this.tags.listByProfile(profileId);
    if (!all.some((t) => t.id === id)) throw new NotFoundError('tag.not_found', 'Tag not found');
    const others = all.filter((t) => t.id !== id).map((t) => t.name);
    const tag = { id, name: normalizeTagName(name, others) };
    await this.tags.rename(profileId, tag, this.clock.nowIso());
    return tag;
  }
}

/**
 * Removes a tag (soft delete). Past weighings keep their record; the tag is no
 * longer shown or offered (README §6.4).
 */
export class RemoveTag {
  constructor(
    private readonly tags: TagRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<null> {
    const removed = await this.tags.softDelete(profileId, id, this.clock.nowIso());
    if (!removed) throw new NotFoundError('tag.not_found', 'Tag not found');
    return null;
  }
}
