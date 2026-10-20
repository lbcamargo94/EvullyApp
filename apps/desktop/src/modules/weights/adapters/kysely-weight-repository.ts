import type { LocalDate } from '@evully/domain';
import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../../../database/schema';
import type {
  TagRef,
  TagRepository,
  WeightEntryData,
  WeightEntryRecord,
  WeightRepository,
} from '../ports/weight-repository';

type Db = Kysely<DatabaseSchema> | Transaction<DatabaseSchema>;

export class KyselyWeightRepository implements WeightRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async insert(entry: WeightEntryData, tagIds: readonly string[]): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto('body_weights')
        .values({
          id: entry.id,
          profile_id: entry.profileId,
          measured_on: entry.measuredOn,
          measured_at: entry.measuredAt,
          weight_kg: entry.weightKg,
          notes: entry.notes,
          created_at: entry.createdAt,
          updated_at: entry.updatedAt,
        })
        .execute();
      await linkTags(trx, entry.id, tagIds, entry.updatedAt);
    });
  }

  async insertMany(entries: readonly WeightEntryData[]): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      for (const entry of entries) {
        await trx
          .insertInto('body_weights')
          .values({
            id: entry.id,
            profile_id: entry.profileId,
            measured_on: entry.measuredOn,
            measured_at: entry.measuredAt,
            weight_kg: entry.weightKg,
            notes: entry.notes,
            created_at: entry.createdAt,
            updated_at: entry.updatedAt,
          })
          .execute();
      }
    });
  }

  async update(entry: WeightEntryData, tagIds: readonly string[]): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('body_weights')
        .set({
          measured_on: entry.measuredOn,
          measured_at: entry.measuredAt,
          weight_kg: entry.weightKg,
          notes: entry.notes,
          updated_at: entry.updatedAt,
        })
        .where('id', '=', entry.id)
        .where('profile_id', '=', entry.profileId)
        .where('deleted_at', 'is', null)
        .execute();
      await trx.deleteFrom('body_weight_tags').where('body_weight_id', '=', entry.id).execute();
      await linkTags(trx, entry.id, tagIds, entry.updatedAt);
    });
  }

  async softDelete(profileId: string, id: string, deletedAt: string): Promise<boolean> {
    const result = await this.db
      .updateTable('body_weights')
      .set({ deleted_at: deletedAt, updated_at: deletedAt })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }

  async findById(profileId: string, id: string): Promise<WeightEntryRecord | null> {
    const [entry] = await this.select(profileId, id);
    return entry ?? null;
  }

  listByProfile(profileId: string): Promise<WeightEntryRecord[]> {
    return this.select(profileId);
  }

  private async select(profileId: string, id?: string): Promise<WeightEntryRecord[]> {
    let query = this.db
      .selectFrom('body_weights')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null);
    if (id) query = query.where('id', '=', id);
    const rows = await query.orderBy('measured_at', 'desc').orderBy('id', 'desc').execute();
    if (!rows.length) return [];

    const links = await this.db
      .selectFrom('body_weight_tags as bwt')
      .innerJoin('tags as t', 't.id', 'bwt.tag_id')
      .select(['bwt.body_weight_id', 't.id', 't.name'])
      .where(
        'bwt.body_weight_id',
        'in',
        rows.map((r) => r.id),
      )
      .where('t.deleted_at', 'is', null)
      .orderBy('t.sort_order')
      .execute();
    const tagsByWeight = new Map<string, TagRef[]>();
    for (const link of links) {
      const list = tagsByWeight.get(link.body_weight_id) ?? [];
      list.push({ id: link.id, name: link.name });
      tagsByWeight.set(link.body_weight_id, list);
    }

    return rows.map((r) => ({
      id: r.id,
      profileId: r.profile_id,
      measuredOn: r.measured_on as LocalDate,
      measuredAt: r.measured_at,
      weightKg: r.weight_kg,
      notes: r.notes,
      tags: tagsByWeight.get(r.id) ?? [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }
}

async function linkTags(db: Db, weightId: string, tagIds: readonly string[], now: string) {
  if (!tagIds.length) return;
  await db
    .insertInto('body_weight_tags')
    .values(tagIds.map((tagId) => ({ body_weight_id: weightId, tag_id: tagId, created_at: now })))
    .execute();
}

export class KyselyTagRepository implements TagRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  listByProfile(profileId: string): Promise<TagRef[]> {
    return this.db
      .selectFrom('tags')
      .select(['id', 'name'])
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .orderBy('sort_order')
      .execute();
  }

  async insert(tag: TagRef & { profileId: string; createdAt: string }): Promise<void> {
    const last = await this.db
      .selectFrom('tags')
      .select((eb) => eb.fn.max('sort_order').as('max'))
      .where('profile_id', '=', tag.profileId)
      .executeTakeFirst();
    await this.db
      .insertInto('tags')
      .values({
        id: tag.id,
        profile_id: tag.profileId,
        name: tag.name,
        sort_order: (last?.max ?? 0) + 1,
        created_at: tag.createdAt,
        updated_at: tag.createdAt,
      })
      .execute();
  }

  async rename(profileId: string, tag: TagRef, now: string): Promise<void> {
    await this.db
      .updateTable('tags')
      .set({ name: tag.name, updated_at: now })
      .where('id', '=', tag.id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .execute();
  }

  async softDelete(profileId: string, id: string, now: string): Promise<boolean> {
    const result = await this.db
      .updateTable('tags')
      .set({ deleted_at: now, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }

  async filterOwned(profileId: string, ids: readonly string[]): Promise<string[]> {
    if (!ids.length) return [];
    const rows = await this.db
      .selectFrom('tags')
      .select('id')
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .where('id', 'in', [...ids])
      .execute();
    return rows.map((r) => r.id);
  }
}
