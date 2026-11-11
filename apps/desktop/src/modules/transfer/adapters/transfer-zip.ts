import { ValidationError } from '@evully/domain';
import AdmZip from 'adm-zip';
import { createHash } from 'node:crypto';
import { stat } from 'node:fs/promises';
import { basename } from 'node:path';
import type { OpenedTransfer, TransferManifest } from '../ports/transfer-ports';

const PROFILE_ENTRY = 'profile.json';
const MANIFEST_ENTRY = 'manifest.json';
/** Larger files (or entries) are refused before being read. */
const MAX_BYTES = 200 * 1024 * 1024;

const invalid = () => new ValidationError('transfer.invalid', 'Not an Evully profile transfer');
const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/** Writes `profile.json` and its manifest (README §14.4). */
export async function writeTransferZip(
  path: string,
  profileJson: string,
  meta: Omit<TransferManifest, 'sha256'>,
): Promise<void> {
  const bytes = Buffer.from(profileJson, 'utf8');
  const manifest: TransferManifest = { ...meta, sha256: sha256(bytes) };
  const zip = new AdmZip();
  zip.addFile(PROFILE_ENTRY, bytes);
  zip.addFile(MANIFEST_ENTRY, Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));
  await zip.writeZipPromise(path, { overwrite: true });
}

/**
 * Reads a transfer zip. Only `profile.json` and `manifest.json` are accepted,
 * which also rules out absolute or `..` paths (zip slip); nothing is extracted to disk.
 */
export async function readTransferZip(path: string): Promise<OpenedTransfer> {
  if ((await stat(path)).size > MAX_BYTES) throw invalid();
  let zip: AdmZip;
  try {
    zip = new AdmZip(path);
  } catch {
    throw invalid();
  }
  const entries = zip.getEntries();
  const names = entries.map((e) => e.entryName).sort();
  if (names.join('|') !== `${MANIFEST_ENTRY}|${PROFILE_ENTRY}`) throw invalid();
  if (entries.some((e) => e.header.size > MAX_BYTES)) throw invalid();
  const read = (name: string) => zip.getEntry(name)?.getData() ?? Buffer.alloc(0);
  const profile = read(PROFILE_ENTRY);
  let manifest: unknown;
  try {
    manifest = JSON.parse(read(MANIFEST_ENTRY).toString('utf8'));
  } catch {
    throw invalid();
  }
  return {
    fileName: basename(path),
    manifest,
    profileJson: profile.toString('utf8'),
    sha256: sha256(profile),
  };
}
