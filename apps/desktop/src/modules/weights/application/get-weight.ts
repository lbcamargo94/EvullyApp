import { NotFoundError } from '@evully/domain';
import type { WeightEntryRecord, WeightRepository } from '../ports/weight-repository';

export class GetWeight {
  constructor(private readonly weights: WeightRepository) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<WeightEntryRecord> {
    const entry = await this.weights.findById(profileId, id);
    if (!entry) throw new NotFoundError('weight.not_found', 'Weighing not found');
    return entry;
  }
}
