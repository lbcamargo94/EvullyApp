import type { LocalDate } from '@evully/domain';
import type { Kysely, Selectable } from 'kysely';
import type { DatabaseSchema, HabitDefinitionsTable } from '../../../database/schema';
import type { HabitLogRecord, HabitRecord, HabitRepository } from '../ports/habit-repository';

const toRecord = (r: Selectable<HabitDefinitionsTable>): HabitRecord => ({
  id: r.id,
  profileId: r.profile_id,
  name: r.name,
  type: r.type,
  unit: r.unit,
  targetValue: r.target_value,
  sortOrder: r.sort_order,
});

export class KyselyHabitRepository implements HabitRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async listActive(profileId: string): Promise<HabitRecord[]> {
    const rows = await this.db
      .selectFrom('habit_definitions')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('is_active', '=', 1)
      .orderBy('sort_order')
      .orderBy('id')
      .execute();
    return rows.map(toRecord);
  }

  async insert(h: HabitRecord, now: string): Promise<void> {
    await this.db
      .insertInto('habit_definitions')
      .values({
        id: h.id,
        profile_id: h.profileId,
        name: h.name,
        type: h.type,
        unit: h.unit,
        target_value: h.targetValue,
        sort_order: h.sortOrder,
        is_active: 1,
        created_at: now,
        updated_at: now,
      })
      .execute();
  }

  async update(h: HabitRecord, now: string): Promise<void> {
    await this.db
      .updateTable('habit_definitions')
      .set({
        name: h.name,
        type: h.type,
        unit: h.unit,
        target_value: h.targetValue,
        updated_at: now,
      })
      .where('id', '=', h.id)
      .where('profile_id', '=', h.profileId)
      .execute();
  }

  async deactivate(profileId: string, id: string, now: string): Promise<boolean> {
    const result = await this.db
      .updateTable('habit_definitions')
      .set({ is_active: 0, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('is_active', '=', 1)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }

  async reorder(profileId: string, ids: readonly string[], now: string): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      for (const [index, id] of ids.entries()) {
        await trx
          .updateTable('habit_definitions')
          .set({ sort_order: index + 1, updated_at: now })
          .where('id', '=', id)
          .where('profile_id', '=', profileId)
          .execute();
      }
    });
  }

  async logsOf(profileId: string, habitId: string): Promise<HabitLogRecord[]> {
    const rows = await this.db
      .selectFrom('habit_logs')
      .select(['habit_definition_id', 'log_date', 'value'])
      .where('profile_id', '=', profileId)
      .where('habit_definition_id', '=', habitId)
      .where('deleted_at', 'is', null)
      .orderBy('log_date')
      .execute();
    return rows.map((r) => ({
      habitId: r.habit_definition_id,
      logDate: r.log_date as LocalDate,
      value: r.value,
    }));
  }

  async logsBetween(profileId: string, from: LocalDate, to: LocalDate): Promise<HabitLogRecord[]> {
    const rows = await this.db
      .selectFrom('habit_logs')
      .select(['habit_definition_id', 'log_date', 'value'])
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .where('log_date', '>=', from)
      .where('log_date', '<=', to)
      .execute();
    return rows.map((r) => ({
      habitId: r.habit_definition_id,
      logDate: r.log_date as LocalDate,
      value: r.value,
    }));
  }

  async saveLog(profileId: string, log: HabitLogRecord, newId: string, now: string): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      const existing = await trx
        .selectFrom('habit_logs')
        .select('id')
        .where('profile_id', '=', profileId)
        .where('habit_definition_id', '=', log.habitId)
        .where('log_date', '=', log.logDate)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();
      if (existing) {
        await trx
          .updateTable('habit_logs')
          .set({ value: log.value, updated_at: now })
          .where('id', '=', existing.id)
          .execute();
        return;
      }
      await trx
        .insertInto('habit_logs')
        .values({
          id: newId,
          profile_id: profileId,
          habit_definition_id: log.habitId,
          log_date: log.logDate,
          value: log.value,
          created_at: now,
          updated_at: now,
        })
        .execute();
    });
  }

  async clearLog(
    profileId: string,
    habitId: string,
    logDate: LocalDate,
    now: string,
  ): Promise<void> {
    await this.db
      .updateTable('habit_logs')
      .set({ deleted_at: now, updated_at: now })
      .where('profile_id', '=', profileId)
      .where('habit_definition_id', '=', habitId)
      .where('log_date', '=', logDate)
      .where('deleted_at', 'is', null)
      .execute();
  }
}
