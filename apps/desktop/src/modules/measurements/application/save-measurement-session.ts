import type { MeasurementInput } from '@evully/contracts';
import { normalizeMeasurementDraft, ValidationError } from '@evully/domain';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { TrackingRepository } from '../../tracking/ports/tracking-repository';
import type { NewValue } from '../ports/measurement-repository';

/**
 * Validates a session for a profile: domain rules plus "only measurements the
 * profile tracks" (README §8.3, profile_measurement_types). Shared by register and update.
 */
export async function prepareMeasurementSession(
  deps: { tracking: TrackingRepository; clock: Clock; ids: IdGenerator },
  { profileId, ...draft }: MeasurementInput,
) {
  const values = normalizeMeasurementDraft(draft, deps.clock.today());
  const tracked = new Set(
    (await deps.tracking.listActiveMeasurementTypes(profileId)).map((t) => t.id),
  );
  if (values.values.some((v) => !tracked.has(v.measurementTypeId))) {
    throw new ValidationError(
      'measurement.type_not_tracked',
      'Measurement type is not tracked by this profile',
    );
  }
  const newValues: NewValue[] = values.values.map((v) => ({ id: deps.ids.next(), ...v }));
  return {
    measuredOn: values.measuredOn,
    measuredAt: values.measuredAt,
    notes: values.notes,
    values: newValues,
  };
}
