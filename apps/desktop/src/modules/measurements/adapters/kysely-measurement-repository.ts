import type { LocalDate } from '@evully/domain';
import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../../../database/schema';
import type {
  MeasurementRepository,
  MeasurementSessionData,
  MeasurementSessionRecord,
  MeasurementValueRecord,
  NewValue,
} from '../ports/measurement-repository';

export class KyselyMeasurementRepository implements MeasurementRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async insert(session: MeasurementSessionData, values: readonly NewValue[]): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto('body_measurements')
        .values({
          id: session.id,
          profile_id: session.profileId,
          measured_on: session.measuredOn,
          measured_at: session.measuredAt,
          notes: session.notes,
          created_at: session.createdAt,
          updated_at: session.updatedAt,
        })
        .execute();
      await insertValues(trx, session.id, values, session.updatedAt);
    });
  }

  async update(session: MeasurementSessionData, values: readonly NewValue[]): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('body_measurements')
        .set({
          measured_on: session.measuredOn,
          measured_at: session.measuredAt,
          notes: session.notes,
          updated_at: session.updatedAt,
        })
        .where('id', '=', session.id)
        .where('profile_id', '=', session.profileId)
        .where('deleted_at', 'is', null)
        .execute();
      await trx
        .deleteFrom('body_measurement_values')
        .where('measurement_id', '=', session.id)
        .execute();
      await insertValues(trx, session.id, values, session.updatedAt);
    });
  }

  async softDelete(profileId: string, id: string, deletedAt: string): Promise<boolean> {
    const result = await this.db
      .updateTable('body_measurements')
      .set({ deleted_at: deletedAt, updated_at: deletedAt })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }

  async findById(profileId: string, id: string): Promise<MeasurementSessionRecord | null> {
    const [session] = await this.select(profileId, id);
    return session ?? null;
  }

  listByProfile(profileId: string): Promise<MeasurementSessionRecord[]> {
    return this.select(profileId);
  }

  private async select(profileId: string, id?: string): Promise<MeasurementSessionRecord[]> {
    let query = this.db
      .selectFrom('body_measurements')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null);
    if (id) query = query.where('id', '=', id);
    const rows = await query.orderBy('measured_at', 'desc').orderBy('id', 'desc').execute();
    if (!rows.length) return [];

    const values = await this.db
      .selectFrom('body_measurement_values as v')
      .innerJoin('measurement_types as t', 't.id', 'v.measurement_type_id')
      .select(['v.measurement_id', 'v.measurement_type_id', 'v.value_cm', 't.code', 't.name'])
      .where(
        'v.measurement_id',
        'in',
        rows.map((r) => r.id),
      )
      .orderBy('t.sort_order')
      .execute();
    const bySession = new Map<string, MeasurementValueRecord[]>();
    for (const v of values) {
      const list = bySession.get(v.measurement_id) ?? [];
      list.push({
        measurementTypeId: v.measurement_type_id,
        code: v.code,
        name: v.name,
        valueCm: v.value_cm,
      });
      bySession.set(v.measurement_id, list);
    }

    return rows.map((r) => ({
      id: r.id,
      profileId: r.profile_id,
      measuredOn: r.measured_on as LocalDate,
      measuredAt: r.measured_at,
      notes: r.notes,
      values: bySession.get(r.id) ?? [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }
}

async function insertValues(
  trx: Transaction<DatabaseSchema>,
  measurementId: string,
  values: readonly NewValue[],
  now: string,
) {
  await trx
    .insertInto('body_measurement_values')
    .values(
      values.map((v) => ({
        id: v.id,
        measurement_id: measurementId,
        measurement_type_id: v.measurementTypeId,
        value_cm: v.valueCm,
        created_at: now,
        updated_at: now,
      })),
    )
    .execute();
}
