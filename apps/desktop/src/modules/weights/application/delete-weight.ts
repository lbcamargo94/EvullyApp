import { NotFoundError } from '@evully/domain';
import type { Clock } from '../../shared/ports';
import type { WeightRepository } from '../ports/weight-repository';

/** Soft delete (README §6.4); the screen asks for confirmation before calling it. */
export class DeleteWeight {
  constructor(
    private readonly weights: WeightRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<null> {
    const deleted = await this.weights.softDelete(profileId, id, this.clock.nowIso());
    if (!deleted) throw new NotFoundError('weight.not_found', 'Weighing not found');
    return null;
  }
}
