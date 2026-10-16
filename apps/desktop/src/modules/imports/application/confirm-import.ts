import type { ImportResult } from '@evully/contracts';
import { IMPORT_DEFAULT_TIME, ValidationError } from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ImportDeps } from './preview-import';

/**
 * Writes the rows the user approved in the preview, all in one transaction:
 * everything ready goes in, or nothing does (README §8.8).
 */
export class ConfirmImport {
  constructor(private readonly deps: ImportDeps) {}

  async execute({ profileId, token }: { profileId: string; token: string }): Promise<ImportResult> {
    const pending = this.deps.pending.take(token, profileId);
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    if (pending.plan.fileError || pending.plan.ready.length === 0) {
      throw new ValidationError('import.nothing_to_import', 'Nothing to import');
    }
    const { clock, ids } = this.deps;
    const now = clock.nowIso();

    if (pending.kind === 'weights') {
      await this.deps.weights.insertMany(
        pending.plan.ready.map((r) => ({
          id: ids.next(),
          profileId,
          measuredOn: r.measuredOn,
          measuredAt: clock.localToIso(r.measuredOn, r.time),
          weightKg: r.weightKg,
          notes: r.notes,
          createdAt: now,
          updatedAt: now,
        })),
      );
      return { imported: pending.plan.ready.length };
    }

    const tracked = new Set(
      (await this.deps.tracking.listActiveMeasurementTypes(profileId)).map((t) => t.id),
    );
    await this.deps.measurements.importSessions(
      profileId,
      pending.plan.ready.map((r) => ({
        session: {
          id: ids.next(),
          profileId,
          measuredOn: r.measuredOn,
          measuredAt: clock.localToIso(r.measuredOn, IMPORT_DEFAULT_TIME),
          notes: r.notes,
          createdAt: now,
          updatedAt: now,
        },
        values: r.values.map((v) => ({ id: ids.next(), ...v })),
      })),
      pending.plan.typeIds
        .filter((id) => !tracked.has(id))
        .map((measurementTypeId) => ({ id: ids.next(), measurementTypeId })),
      now,
    );
    return { imported: pending.plan.ready.length };
  }
}
