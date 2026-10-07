import Database from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';
import type { DatabaseSchema } from './schema';

/** Opens the SQLite database with the integrity settings from README §6.4. */
export function openDatabase(filename: string): Kysely<DatabaseSchema> {
  const sqlite = new Database(filename);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return new Kysely<DatabaseSchema>({ dialect: new SqliteDialect({ database: sqlite }) });
}
