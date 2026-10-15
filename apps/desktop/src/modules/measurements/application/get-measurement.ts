import { NotFoundError } from '@evully/domain';
import type {
  MeasurementRepository,
  MeasurementSessionRecord,
} from '../ports/measurement-repository';

export class GetMeasurement {
  constructor(private readonly measurements: MeasurementRepository) {}

  async execute({
    profileId,
    id,
  }: {
    profileId: string;
    id: string;
  }): Promise<MeasurementSessionRecord> {
    const session = await this.measurements.findById(profileId, id);
    if (!session) throw new NotFoundError('measurement.not_found', 'Measurement not found');
    return session;
  }
}
