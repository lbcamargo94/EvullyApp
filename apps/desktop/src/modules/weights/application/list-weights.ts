import type {
  TagRef,
  TagRepository,
  WeightEntryRecord,
  WeightRepository,
} from '../ports/weight-repository';

export class ListWeights {
  constructor(private readonly weights: WeightRepository) {}

  execute({ profileId }: { profileId: string }): Promise<WeightEntryRecord[]> {
    return this.weights.listByProfile(profileId);
  }
}

export class ListTags {
  constructor(private readonly tags: TagRepository) {}

  execute({ profileId }: { profileId: string }): Promise<TagRef[]> {
    return this.tags.listByProfile(profileId);
  }
}
