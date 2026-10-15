import type { WeightInput } from '@evully/contracts';
import { normalizeWeightDraft } from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type {
  TagRepository,
  WeightEntryRecord,
  WeightRepository,
} from '../ports/weight-repository';
import { assertOwnedTags } from './assert-owned-tags';
import { GetWeight } from './get-weight';

export class RegisterWeight {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly weights: WeightRepository,
    private readonly tags: TagRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ profileId, tagIds, ...draft }: WeightInput): Promise<WeightEntryRecord> {
    await new GetProfile(this.profiles).execute({ id: profileId });
    const values = normalizeWeightDraft(draft, this.clock.today());
    const tagsToLink = await assertOwnedTags(this.tags, profileId, tagIds);
    const now = this.clock.nowIso();
    const id = this.ids.next();
    await this.weights.insert(
      { id, profileId, ...values, createdAt: now, updatedAt: now },
      tagsToLink,
    );
    return new GetWeight(this.weights).execute({ profileId, id });
  }
}
