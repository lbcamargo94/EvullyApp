import type { WeightDisplay } from '@evully/contracts';
import { effectiveAt, ValidationError } from '@evully/domain';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { MeasurementType, TrackingRepository } from '../ports/tracking-repository';

/**
 * Changes how the dashboard shows weight. Creates a new config record
 * (`source = manual`); earlier records are never edited (README §7.5, §28).
 */
export class SetWeightDisplay {
  constructor(
    private readonly tracking: TrackingRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute({
    profileId,
    weightDisplay,
  }: {
    profileId: string;
    weightDisplay: WeightDisplay;
  }): Promise<void> {
    const today = this.clock.today();
    const current = effectiveAt(await this.tracking.listConfigs(profileId), today);
    await this.tracking.insertConfig({
      id: this.ids.next(),
      profileId,
      effectiveFrom: today,
      weightDisplay,
      focusAreas: current?.focusAreas ?? ['waist'],
      source: 'manual',
      ruleVersion: null,
      questionnaireId: null,
      createdAt: this.clock.nowIso(),
    });
  }
}

/**
 * Sets which measurements the profile tracks and in which order. Turned-off
 * measurements keep their history and come back if turned on again (README §7.3).
 */
export class SetTrackedMeasurements {
  constructor(
    private readonly tracking: TrackingRepository,
    private readonly clock: Clock,
  ) {}

  async execute({
    profileId,
    measurementTypeIds,
  }: {
    profileId: string;
    measurementTypeIds: readonly string[];
  }): Promise<void> {
    const unique = [...new Set(measurementTypeIds)];
    const catalog = new Set((await this.tracking.listCatalog()).map((t) => t.id));
    if (!unique.length || unique.some((id) => !catalog.has(id))) {
      throw new ValidationError('measurement.unknown_type', 'Unknown measurement type');
    }
    await this.tracking.setTrackedMeasurements(profileId, unique, this.clock.nowIso());
  }
}

export class ListMeasurementCatalog {
  constructor(private readonly tracking: TrackingRepository) {}

  execute(): Promise<MeasurementType[]> {
    return this.tracking.listCatalog();
  }
}
