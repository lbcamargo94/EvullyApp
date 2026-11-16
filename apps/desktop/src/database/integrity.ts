import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';

/** `missing`: first start; `damaged`: the file cannot be read as an Evully database. */
export type DatabaseHealth = 'ok' | 'missing' | 'damaged';

/**
 * Quick check before the app opens the database (README §14.2.1): opens it
 * like the app does (so a pending WAL is recovered, not reported), runs
 * `PRAGMA quick_check` and closes it. It writes no data.
 */
export function checkDatabase(filename: string): DatabaseHealth {
  if (!existsSync(filename)) return 'missing';
  let sqlite: Database.Database | undefined;
  try {
    sqlite = new Database(filename, { fileMustExist: true });
    return sqlite.pragma('quick_check', { simple: true }) === 'ok' ? 'ok' : 'damaged';
  } catch {
    return 'damaged';
  } finally {
    sqlite?.close();
  }
}
