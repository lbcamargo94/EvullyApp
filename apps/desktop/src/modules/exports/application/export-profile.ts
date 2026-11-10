import type { ExportFormat, ExportResult } from '@evully/contracts';
import { NotFoundError, exportFileName } from '@evully/domain';
import type { ProfilesTable } from '../../../database/schema';
import type { Clock } from '../../shared/ports';
import type { ExportFiles, ExportRepository, ExportTables } from '../ports/export-ports';
import { buildCsvFiles } from './export-csv';
import { selectExportRows, sharedIdsOf } from './select-export-rows';

/** Identifies the JSON file; the profile transfer (README §14.4) reads it back. */
export const PROFILE_EXPORT_FORMAT = 'evully-profile-export';
export const PROFILE_EXPORT_FORMAT_VERSION = 1;

export interface ProfileExportDocument {
  format: typeof PROFILE_EXPORT_FORMAT;
  formatVersion: number;
  appVersion: string;
  /** Latest migration of the database that produced the file. */
  schemaVersion: string;
  exportedAt: string;
  profile: ProfilesTable;
  data: ExportTables;
}

export interface ExportDeps {
  repository: ExportRepository;
  files: ExportFiles;
  clock: Clock;
  appVersion: string;
  schemaVersion: string;
}

/** "Exportar dados" (README §14.3): the current profile as a full JSON or a zip of CSVs. */
export class ExportProfile {
  constructor(private readonly deps: ExportDeps) {}

  async execute({
    profileId,
    format,
  }: {
    profileId: string;
    format: ExportFormat;
  }): Promise<ExportResult> {
    const document = await this.document(profileId);
    const name = exportFileName(document.profile.name, this.deps.clock.today(), format);
    const saved =
      format === 'json'
        ? await this.deps.files.saveJson(name, JSON.stringify(document, null, 2))
        : await this.deps.files.saveZip(name, buildCsvFiles(document.data, this.deps.clock));
    return saved === null ? null : { fileName: saved };
  }

  /** Every exported row of one profile, plus the shared rows it points to. */
  async document(profileId: string): Promise<ProfileExportDocument> {
    const { repository, clock } = this.deps;
    const profile = await repository.profile(profileId);
    if (!profile) throw new NotFoundError('profile.not_found', 'Profile not found');
    const rows = selectExportRows(await repository.profileRows(profileId));
    const shared = await repository.sharedRows(sharedIdsOf(rows));
    return {
      format: PROFILE_EXPORT_FORMAT,
      formatVersion: PROFILE_EXPORT_FORMAT_VERSION,
      appVersion: this.deps.appVersion,
      schemaVersion: this.deps.schemaVersion,
      exportedAt: clock.nowIso(),
      profile,
      data: {
        ...rows,
        exercises: [...shared.exercises, ...rows.exercises],
        foods: shared.foods,
        measurement_types: shared.measurement_types,
      },
    };
  }
}
