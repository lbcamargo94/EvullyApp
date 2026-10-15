import type { MeasurementInput } from '@evully/contracts';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { TrackingRepository } from '../../tracking/ports/tracking-repository';
import type {
  MeasurementRepository,
  MeasurementSessionRecord,
} from '../ports/measurement-repository';
import { GetMeasurement } from './get-measurement';
import { prepareMeasurementSession } from './save-measurement-session';

export class RegisterMeasurement {
  constructor(
    private readonly profiles: ProfileRepository,
    private readonly measurements: MeasurementRepository,
    private readonly tracking: TrackingRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(input: MeasurementInput): Promise<MeasurementSessionRecord> {
    const { profileId } = input;
    await new GetProfile(this.profiles).execute({ id: profileId });
    const { values, ...session } = await prepareMeasurementSession(
      { tracking: this.tracking, clock: this.clock, ids: this.ids },
      input,
    );
    const now = this.clock.nowIso();
    const id = this.ids.next();
    await this.measurements.insert(
      { id, profileId, ...session, createdAt: now, updatedAt: now },
      values,
    );
    return new GetMeasurement(this.measurements).execute({ profileId, id });
  }
}
