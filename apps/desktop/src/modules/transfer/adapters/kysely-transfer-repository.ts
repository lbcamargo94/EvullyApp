import { checkHealthPdf, ValidationError } from '@evully/domain';
import { sql, type Kysely, type Transaction } from 'kysely';
import { createHash } from 'node:crypto';
import type { DatabaseSchema } from '../../../database/schema';
import type {
  CellValue,
  TableRows,
  TransferPlan,
  TransferRepository,
} from '../ports/transfer-ports';

type Db = Kysely<DatabaseSchema> | Transaction<DatabaseSchema>;
type Value = CellValue | Buffer;

const invalid = (why: string) =>
  new ValidationError('transfer.invalid', `Invalid profile transfer: ${why}`);

/**
 * An exam PDF arrives as base64 (README §14.4): it must decode to a PDF of the
 * stated size and SHA-256 before it is written back as a BLOB.
 */
function decodedDocument(row: Record<string, CellValue>): Record<string, Value> {
  if (typeof row.content !== 'string') throw invalid('health document without content');
  const bytes = Buffer.from(row.content, 'base64');
  try {
    checkHealthPdf(bytes);
  } catch {
    throw invalid('health document is not a PDF');
  }
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== row.size_bytes || sha256 !== row.sha256)
    throw invalid('health document does not match its checksum');
  return { ...row, content: bytes };
}

/**
 * Raw inserts because tables vary; table and column names come from the
 * plan, which only holds names this database reported (`pragma_table_info`),
 * and every value is a bound parameter.
 */
async function insert(db: Db, table: string, row: Record<string, Value>, ignoreExisting: boolean) {
  const columns = Object.keys(row);
  await sql`
    INSERT INTO ${sql.table(table)} (${sql.join(columns.map((c) => sql.ref(c)))})
    VALUES (${sql.join(columns.map((c) => row[c]))})
    ${ignoreExisting ? sql`ON CONFLICT DO NOTHING` : sql``}
  `.execute(db);
}

async function insertAll(db: Db, groups: TableRows[], ignoreExisting: boolean) {
  for (const { table, rows } of groups) {
    for (const row of rows)
      await insert(
        db,
        table,
        table === 'health_documents' ? decodedDocument(row) : row,
        ignoreExisting,
      );
  }
}

export class KyselyTransferRepository implements TransferRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async columns(table: string): Promise<Set<string>> {
    const { rows } = await sql<{ name: string }>`
      SELECT name FROM pragma_table_info(${table})
    `.execute(this.db);
    return new Set(rows.map((r) => r.name));
  }

  checkDocuments(plan: TransferPlan): void {
    for (const { table, rows } of plan.tables)
      if (table === 'health_documents') rows.forEach(decodedDocument);
  }

  async existing(profileId: string) {
    const row = await this.db
      .selectFrom('profiles')
      .select(['name', 'deleted_at'])
      .where('id', '=', profileId)
      .executeTakeFirst();
    return row ? { name: row.name, archived: row.deleted_at !== null } : null;
  }

  async write(plan: TransferPlan, replace: boolean): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      if (replace) {
        // Profile tables reference profiles.id with ON DELETE CASCADE (foreign_keys is on).
        await trx.deleteFrom('settings').where('profile_id', '=', plan.profileId).execute();
        await trx.deleteFrom('profiles').where('id', '=', plan.profileId).execute();
      }
      await insertAll(trx, plan.shared, true);
      await insert(trx, 'profiles', plan.profile, false);
      await insertAll(trx, plan.tables, false);
    });
  }
}
