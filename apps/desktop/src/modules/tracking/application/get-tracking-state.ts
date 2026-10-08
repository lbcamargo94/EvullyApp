import type { TrackingState } from '@evully/contracts';
import { effectiveAt } from '@evully/domain';
import type { Clock } from '../../shared/ports';
import type { TrackingRepository } from '../ports/tracking-repository';

/** What the profile tracks today: config in force (README §7.5) and active measurements. */
export class GetTrackingState {
  constructor(
    private readonly tracking: TrackingRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ profileId }: { profileId: string }): Promise<TrackingState> {
    const [configs, questionnaire, measurementTypes] = await Promise.all([
      this.tracking.listConfigs(profileId),
      this.tracking.latestQuestionnaireStatus(profileId),
      this.tracking.listActiveMeasurementTypes(profileId),
    ]);
    const current = effectiveAt(configs, this.clock.today());
    return {
      questionnaire,
      config: current && {
        id: current.id,
        effectiveFrom: current.effectiveFrom,
        weightDisplay: current.weightDisplay,
        focusAreas: current.focusAreas,
        source: current.source,
        ruleVersion: current.ruleVersion,
      },
      measurementTypes,
    };
  }
}
