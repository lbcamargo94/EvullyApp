import type { MeasurementSession } from '@evully/contracts';
import type { IpcHandlers } from '../../../shared/ipc-channels';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { ProjectRepository } from '../../tracking/ports/project-repository';
import type { TrackingRepository } from '../../tracking/ports/tracking-repository';
import { DeleteMeasurement } from '../application/delete-measurement';
import { GetMeasurementSummary } from '../application/get-measurement-summary';
import { ListMeasurements } from '../application/list-measurements';
import { RegisterMeasurement } from '../application/register-measurement';
import { UpdateMeasurement } from '../application/update-measurement';
import type {
  MeasurementRepository,
  MeasurementSessionRecord,
} from '../ports/measurement-repository';

type MeasurementChannels =
  | 'measurements:list'
  | 'measurements:summary'
  | 'measurements:register'
  | 'measurements:update'
  | 'measurements:delete';

/** What the screens receive: no profile id or audit timestamps. */
const toDto = (record: MeasurementSessionRecord): MeasurementSession => ({
  id: record.id,
  measuredOn: record.measuredOn,
  measuredAt: record.measuredAt,
  notes: record.notes,
  values: record.values,
});

export function measurementIpcHandlers(deps: {
  profiles: ProfileRepository;
  projects: ProjectRepository;
  tracking: TrackingRepository;
  measurements: MeasurementRepository;
  clock: Clock;
  ids: IdGenerator;
}): Pick<IpcHandlers, MeasurementChannels> {
  const { profiles, projects, tracking, measurements, clock, ids } = deps;
  const list = new ListMeasurements(measurements);
  const summary = new GetMeasurementSummary(measurements, tracking, projects);
  const register = new RegisterMeasurement(profiles, measurements, tracking, clock, ids);
  const update = new UpdateMeasurement(measurements, tracking, clock, ids);
  const remove = new DeleteMeasurement(measurements, clock);
  return {
    'measurements:list': async (input) => (await list.execute(input)).map(toDto),
    'measurements:summary': (input) => summary.execute(input),
    'measurements:register': async (input) => toDto(await register.execute(input)),
    'measurements:update': async (input) => toDto(await update.execute(input)),
    'measurements:delete': (input) => remove.execute(input),
  };
}
