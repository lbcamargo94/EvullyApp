import { NotFoundError } from '@evully/domain';
import type { Clock } from '../../shared/ports';
import type { MeasurementRepository } from '../ports/measurement-repository';

/** Soft delete (README §6.4); the screen asks for confirmation before calling it. */
export class DeleteMeasurement {
  constructor(
    private readonly measurements: MeasurementRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ profileId, id }: { profileId: string; id: string }): Promise<null> {
    const deleted = await this.measurements.softDelete(profileId, id, this.clock.nowIso());
    if (!deleted) throw new NotFoundError('measurement.not_found', 'Measurement not found');
    return null;
  }
}
