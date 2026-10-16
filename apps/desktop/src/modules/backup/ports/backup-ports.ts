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
}
