import type { TransferDocument, TransferPreview } from '@evully/contracts';
import { ValidationError } from '@evully/domain';
import {
  CHILD_EXPORT_TABLES,
  CHILD_PARENT,
  PROFILE_EXPORT_TABLES,
  SHARED_EXPORT_TABLES,
} from '../../exports/ports/export-ports';
import type { CellValue, TableRows, TransferPlan } from '../ports/transfer-ports';

type Row = Record<string, CellValue>;

const invalid = (why: string) =>
  new ValidationError('transfer.invalid', `Invalid profile transfer: ${why}`);

const KNOWN = new Set<string>([
  ...PROFILE_EXPORT_TABLES,
  ...CHILD_EXPORT_TABLES,
  ...SHARED_EXPORT_TABLES,
]);

/**
 * Rows to write for a transfer file, in foreign-key order: shared catalogs,
 * the profile, profile tables, child tables. Refuses unknown tables or
 * columns, rows of another profile and child rows whose parent is not in the file.
 */
export async function buildTransferPlan(
  doc: TransferDocument,
  columnsOf: (table: string) => Promise<Set<string>>,
): Promise<TransferPlan> {
  const unknown = Object.keys(doc.data).find((table) => !KNOWN.has(table));
  if (unknown) throw invalid(`unknown table ${unknown}`);
  const rowsOf = (table: string) => doc.data[table] ?? [];
  const profileId = doc.profile.id;
  const exercises = rowsOf('exercises');
  const system = exercises.filter((e) => e.profile_id === null);

  const checked = async (table: string, rows: Row[]): Promise<TableRows> => {
    const columns = await columnsOf(table);
    const extra = rows.flatMap(Object.keys).find((c) => !columns.has(c));
    if (extra) throw invalid(`unknown column ${table}.${extra}`);
    return { table, rows };
  };

  const tables: TableRows[] = [];
  for (const table of PROFILE_EXPORT_TABLES) {
    const rows =
      table === 'exercises' ? exercises.filter((e) => e.profile_id !== null) : rowsOf(table);
    if (rows.some((r) => r.profile_id !== profileId))
      throw invalid(`row of another profile in ${table}`);
    tables.push(await checked(table, rows));
  }
  for (const [table, { parent, column }] of Object.entries(CHILD_PARENT)) {
    const parents = new Set(rowsOf(parent).map((r) => r.id));
    const rows = rowsOf(table);
    if (rows.some((r) => !parents.has(r[column] ?? null))) throw invalid(`orphan row in ${table}`);
    tables.push(await checked(table, rows));
  }

  return {
    profileId,
    shared: [
      await checked('foods', rowsOf('foods')),
      await checked('measurement_types', rowsOf('measurement_types')),
      await checked('exercises', system),
    ],
    profile: (await checked('profiles', [{ ...doc.profile, deleted_at: null }])).rows[0] ?? {},
    tables,
  };
}

/** Records per module, shown before the import. */
export function transferCounts(doc: TransferDocument): TransferPreview['counts'] {
  const count = (table: string) => doc.data[table]?.length ?? 0;
  return {
    weights: count('body_weights'),
    measurements: count('body_measurements'),
    foodLogs: count('food_logs'),
    workouts: (doc.data.workout_sessions ?? []).filter((s) => s.finished_at !== null).length,
    cardio: count('cardio_sessions'),
    sleep: count('sleep_logs'),
    habitLogs: count('habit_logs'),
  };
}
