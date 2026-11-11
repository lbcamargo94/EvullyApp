/** `manifest.json` of a profile transfer zip (README §14.4). */
export interface TransferManifest {
  format: string;
  formatVersion: number;
  appVersion: string;
  /** Latest migration of the database that wrote the file. */
  schemaVersion: string;
  createdAt: string;
  profileId: string;
  profileName: string;
  /** SHA-256 of `profile.json`. */
  sha256: string;
}

/** A transfer zip read in the main process; its entries were already checked. */
export interface OpenedTransfer {
  fileName: string;
  /** Parsed `manifest.json`, not validated yet. */
  manifest: unknown;
  profileJson: string;
  /** SHA-256 of the `profile.json` bytes read. */
  sha256: string;
}

/** Native dialogs and zip files; the renderer never sends paths. */
export interface TransferFiles {
  /** Asks where to save and writes the zip. Returns the chosen file name, or null if cancelled. */
  save(
    defaultFileName: string,
    profileJson: string,
    manifest: Omit<TransferManifest, 'sha256'>,
  ): Promise<string | null>;
  /** Lets the user pick a transfer zip and reads it. Null if cancelled. */
  open(): Promise<OpenedTransfer | null>;
}

export type CellValue = string | number | null;

export interface TableRows {
  table: string;
  rows: Record<string, CellValue>[];
}

/** Rows to write, in foreign-key order; tables and columns already checked against the database. */
export interface TransferPlan {
  profileId: string;
  /** Shared catalog rows, inserted only when missing. */
  shared: TableRows[];
  profile: Record<string, CellValue>;
  tables: TableRows[];
}

export interface TransferRepository {
  /** Column names of a table of this database. */
  columns(table: string): Promise<Set<string>>;
  /** The profile with this id on this computer (in use or archived), or null. */
  existing(profileId: string): Promise<{ name: string; archived: boolean } | null>;
  /** One transaction: removes the profile when `replace`, then writes the plan. */
  write(plan: TransferPlan, replace: boolean): Promise<void>;
}
