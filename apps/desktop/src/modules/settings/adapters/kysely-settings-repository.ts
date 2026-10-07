import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../database/schema';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { SettingsRepository } from '../ports/settings-repository';

export class KyselySettingsRepository implements SettingsRepository {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async get(profileId: string | null, key: string): Promise<unknown> {
    const row = await this.db
      .selectFrom('settings')
      .select('value')
      .where('key', '=', key)
      .where('profile_id', profileId === null ? 'is' : '=', profileId)
      .executeTakeFirst();
    return row ? JSON.parse(row.value) : undefined;
  }

  async set(profileId: string | null, key: string, value: unknown): Promise<void> {
    const now = this.clock.nowIso();
    const json = JSON.stringify(value);
    await this.db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable('settings')
        .set({ value: json, updated_at: now })
        .where('key', '=', key)
        .where('profile_id', profileId === null ? 'is' : '=', profileId)
        .executeTakeFirst();
      if (updated.numUpdatedRows === 0n) {
        await trx
          .insertInto('settings')
          .values({
            id: this.ids.next(),
            profile_id: profileId,
            key,
            value: json,
            created_at: now,
            updated_at: now,
          })
          .execute();
      }
    });
  }
}
