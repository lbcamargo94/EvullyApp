import type { ImportKind } from '@evully/contracts';
import { measurementImportTemplate, weightImportTemplate } from '@evully/domain';
import type { TrackingRepository } from '../../tracking/ports/tracking-repository';
import type { ImportFiles } from '../ports/import-ports';

/** "Baixar modelo": a CSV with the right columns, in the Brazilian Excel format. */
export class SaveImportTemplate {
  constructor(
    private readonly tracking: TrackingRepository,
    private readonly files: ImportFiles,
  ) {}

  async execute({ profileId, kind }: { profileId: string; kind: ImportKind }): Promise<boolean> {
    if (kind === 'weights') return this.files.saveText('pesos.csv', weightImportTemplate());
    const tracked = await this.tracking.listActiveMeasurementTypes(profileId);
    return this.files.saveText(
      'medidas.csv',
      measurementImportTemplate(tracked.map((t) => t.csvName)),
    );
  }
}
