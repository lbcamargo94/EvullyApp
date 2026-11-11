import { sql, type Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../database/schema';
import {
  CHILD_PARENT,
  PROFILE_EXPORT_TABLES,
  type ExportRepository,
  type ProfileTables,
  type SharedIds,
} from '../ports/export-ports';

export class KyselyExportRepository implements ExportRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  profile(profileId: string) {
    return this.db
      .selectFrom('profiles')
      .selectAll()
      .where('id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()
      .then((row) => row ?? null);
  }

  async profileRows(profileId: string): Promise<ProfileTables> {
    const tables: Partial<Record<keyof ProfileTables, unknown[]>> = {};
    // Table names are constants of this module, never user input.
    for (const table of PROFILE_EXPORT_TABLES) {
      const { rows } = await sql<Record<string, unknown>>`
        SELECT * FROM ${sql.table(table)} WHERE profile_id = ${profileId} ORDER BY id
      `.execute(this.db);
      tables[table] = rows;
    }
    for (const [table, { parent, column }] of Object.entries(CHILD_PARENT)) {
      const { rows } = await sql<Record<string, unknown>>`
        SELECT c.* FROM ${sql.table(table)} c
        JOIN ${sql.table(parent)} p ON p.id = c.${sql.ref(column)}
        WHERE p.profile_id = ${profileId}
        ORDER BY c.${sql.ref(column)}
      `.execute(this.db);
      tables[table as keyof ProfileTables] = rows;
    }
    return tables as ProfileTables;
  }

  async sharedRows({ foodIds, measurementTypeIds, exerciseIds }: SharedIds) {
    const [foods, measurementTypes, exercises] = await Promise.all([
      foodIds.length
        ? this.db.selectFrom('foods').selectAll().where('id', 'in', foodIds).orderBy('id').execute()
        : [],
      measurementTypeIds.length
        ? this.db
            .selectFrom('measurement_types')
            .selectAll()
            .where('id', 'in', measurementTypeIds)
            .orderBy('sort_order')
            .execute()
        : [],
      exerciseIds.length
        ? this.db
            .selectFrom('exercises')
            .selectAll()
            .where('profile_id', 'is', null)
            .where('id', 'in', exerciseIds)
            .orderBy('id')
            .execute()
        : [],
    ]);
    return { foods, measurement_types: measurementTypes, exercises };
  }
}
