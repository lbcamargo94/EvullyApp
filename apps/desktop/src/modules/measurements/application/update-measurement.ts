import type { UpdateMeasurementInput } from '@evully/contracts';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { TrackingRepository } from '../../tracking/ports/tracking-repository';
import type {
  MeasurementRepository,
  MeasurementSessionRecord,
} from '../ports/measurement-repository';
import { GetMeasurement } from './get-measurement';
import { prepareMeasurementSession } from './save-measurement-session';

export class UpdateMeasurement {
  constructor(
    private readonly measurements: MeasurementRepository,
    private readonly tracking: TrackingRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute({ id, ...input }: UpdateMeasurementInput): Promise<MeasurementSessionRecord> {
    const { profileId } = input;
    const get = new GetMeasurement(this.measurements);
    const current = await get.execute({ profileId, id });
    const { values, ...session } = await prepareMeasurementSession(
      { tracking: this.tracking, clock: this.clock, ids: this.ids },
      input,
    );
    await this.measurements.update(
      {
        id,
        profileId,
        ...session,
        createdAt: current.createdAt,
        updatedAt: this.clock.nowIso(),
      },
      values,
    );
    return get.execute({ profileId, id });
  }
}
