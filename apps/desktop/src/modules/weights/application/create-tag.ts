import type { CreateTagInput } from '@evully/contracts';
import { normalizeTagName } from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { TagRef, TagRepository } from '../ports/weight-repository';

/** Creates a weighing tag for one profile (README §8.2.2). */
export class CreateTag {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly tags: TagRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ profileId, name }: CreateTagInput): Promise<TagRef> {
    await new GetProfile(this.profiles).execute({ id: profileId });
    const existing = await this.tags.listByProfile(profileId);
    const tag = {
      id: this.ids.next(),
      name: normalizeTagName(
        name,
        existing.map((t) => t.name),
      ),
    };
    await this.tags.insert({ ...tag, profileId, createdAt: this.clock.nowIso() });
    return tag;
  }
}
