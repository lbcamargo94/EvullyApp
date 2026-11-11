import { ValidationError } from '../errors';
import { exportNameSlug } from '../exports/csv-writer';
import type { LocalDate } from '../local-date';

/** Manifest of a profile transfer zip (README §14.4). */
export const TRANSFER_FORMAT = 'evully-profile-transfer';
export const TRANSFER_FORMAT_VERSION = 1;

/** `evully-perfil-ana-2026-11-10.zip`. */
export function transferFileName(profileName: string, today: LocalDate): string {
  return `evully-perfil-${exportNameSlug(profileName)}-${today}.zip`;
}

/**
 * A transfer file can be imported when the manifest is an Evully transfer
 * this app understands, the profile data matches its checksum and was not
 * written by a newer database schema (migration names sort in order).
 */
export function assertTransferable(file: {
  format: string;
  formatVersion: number;
  manifestSha256: string;
  actualSha256: string;
  schemaVersion: string;
  appSchemaVersion: string;
}): void {
  if (file.format !== TRANSFER_FORMAT) {
    throw new ValidationError('transfer.invalid', 'Not an Evully profile transfer');
  }
  if (file.manifestSha256 !== file.actualSha256) {
    throw new ValidationError('transfer.corrupt', 'The profile data is damaged');
  }
  if (file.formatVersion > TRANSFER_FORMAT_VERSION || file.schemaVersion > file.appSchemaVersion) {
    throw new ValidationError('transfer.newer', 'The file is from a newer Evully');
  }
}
