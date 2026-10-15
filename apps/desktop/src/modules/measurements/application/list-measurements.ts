import type {
  MeasurementRepository,
  MeasurementSessionRecord,
} from '../ports/measurement-repository';

export class ListMeasurements {
  constructor(private readonly measurements: MeasurementRepository) {}

  execute({ profileId }: { profileId: string }): Promise<MeasurementSessionRecord[]> {
    return this.measurements.listByProfile(profileId);
  }
}
