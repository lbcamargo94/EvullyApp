import type { MeasurementSummary } from '@evully/contracts';
import { measurementTypeStats } from '@evully/domain';
import type { ProjectRepository } from '../../tracking/ports/project-repository';
import type { TrackingRepository } from '../../tracking/ports/tracking-repository';
import type { MeasurementRepository } from '../ports/measurement-repository';

/** Latest, starting value and change of each tracked measurement (README §7.3). */
export class GetMeasurementSummary {
  constructor(
    private readonly measurements: MeasurementRepository,
    private readonly tracking: TrackingRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute({ profileId }: { profileId: string }): Promise<MeasurementSummary> {
    const [sessions, types, project] = await Promise.all([
      this.measurements.listByProfile(profileId),
      this.tracking.listActiveMeasurementTypes(profileId),
      this.projects.findActive(profileId),
    ]);
    return {
      objective: project?.objective ?? null,
      items: types.map((type) => {
        const values = sessions.flatMap((s) =>
          s.values
            .filter((v) => v.measurementTypeId === type.id)
            .map((v) => ({
              measuredOn: s.measuredOn,
              measuredAt: s.measuredAt,
              valueCm: v.valueCm,
            })),
        );
        return { ...type, ...measurementTypeStats(values, project?.startDate ?? null) };
      }),
    };
  }
}
