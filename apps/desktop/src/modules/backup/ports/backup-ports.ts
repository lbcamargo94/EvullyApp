import type { BackupKind, StoredBackup } from '@evully/domain';

/** `manifest.json` inside every backup zip (README §8.7.1). */
export interface BackupManifest {
  appVersion: string;
  schemaVersion: string;
  createdAt: string;
  kind: BackupKind;
  /** SHA-256 of `evully.db` inside the zip. */
  sha256: string;
}

export interface BackupWriter {
  /**
   * Snapshots the open database (`VACUUM INTO`, never a copy of the live file)
   * and writes `evully.db` + `manifest.json` to a zip at `targetPath`.
   */
  write(
    targetPath: string,
    meta: Pick<BackupManifest, 'appVersion' | 'kind' | 'createdAt'>,
  ): Promise<BackupManifest>;
}

export interface BackupFolder {
  ensure(directory: string): Promise<void>;
  /** Backup zips in the folder, with the kind read from their manifest. */
  list(directory: string): Promise<StoredBackup[]>;
  remove(directory: string, fileName: string): Promise<void>;
  copy(sourcePath: string, directory: string, fileName: string): Promise<void>;
  join(directory: string, fileName: string): string;
}

/** Native dialogs; the renderer never sends file paths (SECURITY.md §2.3). */
export interface BackupDialogs {
  chooseSavePath(defaultFileName: string): Promise<string | null>;
  chooseDirectory(): Promise<string | null>;
  /** A backup zip to restore. */
  chooseBackupFile(): Promise<string | null>;
}

/** A backup zip opened for restore, its database extracted to a private scratch file. */
export interface OpenedBackup {
  manifest: BackupManifest;
  /** Extracted `evully.db`, removed by `discard` or moved by `stage`. */
  databaseFile: string;
  sha256: string;
  integrityOk: boolean;
  /** Latest migration recorded in the extracted database. */
  schemaVersion: string;
  profiles: string[];
}

export interface BackupReader {
  /**
   * Accepts only a zip holding exactly `evully.db` and `manifest.json` (no
   * other entries, so no absolute or `..` paths). Throws
   * `backup.restore_invalid` for anything else.
   */
  open(path: string): Promise<OpenedBackup>;
  discard(databaseFile: string): Promise<void>;
  /** Moves the extracted database to where the next start swaps it in. */
  stage(databaseFile: string): Promise<void>;
}

/** Quits and starts the app again, so the staged restore is applied before the database opens. */
export interface AppRestart {
  restart(): void;
}
