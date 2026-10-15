import type { UpdateWeightInput } from '@evully/contracts';
import { normalizeWeightDraft } from '@evully/domain';
import type { Clock } from '../../shared/ports';
import type {
  TagRepository,
  WeightEntryRecord,
  WeightRepository,
} from '../ports/weight-repository';
import { assertOwnedTags } from './assert-owned-tags';
import { GetWeight } from './get-weight';

export class UpdateWeight {
  constructor(
    private readonly weights: WeightRepository,
    private readonly tags: TagRepository,
    private readonly clock: Clock,
  ) {}

  async execute({
    id,
    profileId,
    tagIds,
    ...draft
  }: UpdateWeightInput): Promise<WeightEntryRecord> {
    const get = new GetWeight(this.weights);
    const current = await get.execute({ profileId, id });
    const values = normalizeWeightDraft(draft, this.clock.today());
    const tagsToLink = await assertOwnedTags(this.tags, profileId, tagIds);
    await this.weights.update(
      {
        id,
        profileId,
        ...values,
        createdAt: current.createdAt,
        updatedAt: this.clock.nowIso(),
      },
      tagsToLink,
    );
    return get.execute({ profileId, id });
  }
}
