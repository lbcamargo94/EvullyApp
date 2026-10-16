import {
  IMPORT_PREVIEW_ROWS,
  type ImportKind,
  type ImportPreview,
  type ImportPreviewRow,
} from '@evully/contracts';
import { planMeasurementImport, planWeightImport, type ImportPlan } from '@evully/domain';
import type { MeasurementRepository } from '../../measurements/ports/measurement-repository';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { TrackingRepository } from '../../tracking/ports/tracking-repository';
import type { WeightRepository } from '../../weights/ports/weight-repository';
import type { ImportFiles } from '../ports/import-ports';
import type { PendingImports } from './pending-imports';

export interface ImportDeps {
  profiles: ProfileRepository;
  weights: WeightRepository;
  measurements: MeasurementRepository;
  tracking: TrackingRepository;
  files: ImportFiles;
  pending: PendingImports;
  clock: Clock;
  ids: IdGenerator;
}

const emptyRow = { code: null, measuredOn: null, time: null, weightKg: null, values: [] };

/**
 * Reads a CSV chosen by the user and classifies every row; nothing is written
 * until the user confirms (README §8.8). Null if the dialog is cancelled.
 */
export class PreviewImport {
  constructor(private readonly deps: ImportDeps) {}

  async execute({
    profileId,
    kind,
  }: {
    profileId: string;
    kind: ImportKind;
  }): Promise<ImportPreview | null> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const file = await this.deps.files.chooseCsv();
    if (!file) return null;
    const token = this.deps.ids.next();
    const preview =
      kind === 'weights'
        ? await this.previewWeights(token, profileId, file.text)
        : await this.previewMeasurements(token, profileId, file.text);
    return { ...preview, fileName: file.fileName };
  }

  private async previewWeights(token: string, profileId: string, text: string) {
    const existing = await this.deps.weights.listByProfile(profileId);
    const plan = planWeightImport(text, this.deps.clock.today(), existing);
    this.deps.pending.put(token, { kind: 'weights', profileId, plan });
    const toRow = (r: (typeof plan.ready)[number]) => ({
      measuredOn: r.measuredOn,
      time: r.time,
      weightKg: r.weightKg,
      values: [],
    });
    return summarize(token, 'weights', plan, toRow, []);
  }

  private async previewMeasurements(token: string, profileId: string, text: string) {
    const [catalog, tracked, existing] = await Promise.all([
      this.deps.tracking.listCatalog(),
      this.deps.tracking.listActiveMeasurementTypes(profileId),
      this.deps.measurements.listByProfile(profileId),
    ]);
    const plan = planMeasurementImport(text, this.deps.clock.today(), catalog, existing);
    this.deps.pending.put(token, { kind: 'measurements', profileId, plan });
    const nameOf = new Map(catalog.map((t) => [t.id, t.name]));
    const trackedIds = new Set(tracked.map((t) => t.id));
    const newTypes = plan.typeIds
      .filter((id) => !trackedIds.has(id))
      .map((id) => nameOf.get(id) ?? id);
    const toRow = (r: (typeof plan.ready)[number]) => ({
      measuredOn: r.measuredOn,
      time: null,
      weightKg: null,
      values: r.values.map((v) => ({
        name: nameOf.get(v.measurementTypeId) ?? '',
        valueCm: v.valueCm,
      })),
    });
    return summarize(token, 'measurements', plan, toRow, newTypes);
  }
}

function summarize<R>(
  token: string,
  kind: ImportKind,
  plan: ImportPlan<R>,
  toRow: (row: R & { line: number }) => Omit<ImportPreviewRow, 'line' | 'status' | 'code'>,
  newMeasurementTypes: string[],
): Omit<ImportPreview, 'fileName'> {
  const rows: ImportPreviewRow[] = [
    ...plan.ready.map((r) => ({ line: r.line, status: 'ready' as const, code: null, ...toRow(r) })),
    ...plan.duplicates.map((r) => ({
      line: r.line,
      status: 'duplicate' as const,
      code: null,
      ...toRow(r),
    })),
    ...plan.errors.map((e) => ({
      ...emptyRow,
      line: e.line,
      status: 'error' as const,
      code: e.code,
    })),
  ].sort((a, b) => a.line - b.line);
  return {
    token,
    kind,
    fileError: plan.fileError,
    counts: {
      ready: plan.ready.length,
      duplicates: plan.duplicates.length,
      errors: plan.errors.length,
    },
    rows: rows.slice(0, IMPORT_PREVIEW_ROWS),
    newMeasurementTypes: plan.ready.length ? newMeasurementTypes : [],
  };
}
