import type { LocalDate } from '@evully/domain';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../database/schema';
import type {
  NutritionTargetRecord,
  NutritionTargetRepository,
  WaterLogRecord,
  WaterLogRepository,
} from '../ports/targets-water-repository';

export class KyselyNutritionTargetRepository implements NutritionTargetRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async list(profileId: string): Promise<NutritionTargetRecord[]> {
    const rows = await this.db
      .selectFrom('nutrition_targets')
      .selectAll()
      .where('profile_id', '=', profileId)
      // Creation order; UUID v7 ids break ties within the same instant.
      .orderBy('created_at')
      .orderBy('id')
      .execute();
    return rows.map((r) => ({
      id: r.id,
      profileId: r.profile_id,
      effectiveFrom: r.effective_from as LocalDate,
      caloriesKcal: r.calories_kcal,
      proteinG: r.protein_g,
      carbohydrateG: r.carbohydrate_g,
      fatG: r.fat_g,
      waterMl: r.water_ml,
      createdAt: r.created_at,
    }));
  }

  async insert(t: NutritionTargetRecord): Promise<void> {
    await this.db
      .insertInto('nutrition_targets')
      .values({
        id: t.id,
        profile_id: t.profileId,
        effective_from: t.effectiveFrom,
        calories_kcal: t.caloriesKcal,
        protein_g: t.proteinG,
        carbohydrate_g: t.carbohydrateG,
        fat_g: t.fatG,
        water_ml: t.waterMl,
        reason: null,
        source: 'manual',
        created_at: t.createdAt,
      })
      .execute();
  }
}

export class KyselyWaterLogRepository implements WaterLogRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private active(profileId: string) {
    return this.db
      .selectFrom('water_logs')
      .select(['id', 'profile_id', 'log_date', 'amount_ml', 'logged_at'])
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null);
  }

  private static toRecord(r: {
    id: string;
    profile_id: string;
    log_date: string;
    amount_ml: number;
    logged_at: string;
  }): WaterLogRecord {
    return {
      id: r.id,
      profileId: r.profile_id,
      logDate: r.log_date as LocalDate,
      amountMl: r.amount_ml,
      loggedAt: r.logged_at,
    };
  }

  async listDay(profileId: string, date: LocalDate): Promise<WaterLogRecord[]> {
    const rows = await this.active(profileId)
      .where('log_date', '=', date)
      .orderBy('logged_at')
      .orderBy('id')
      .execute();
    return rows.map((r) => KyselyWaterLogRepository.toRecord(r));
  }

  async findById(profileId: string, id: string): Promise<WaterLogRecord | null> {
    const row = await this.active(profileId).where('id', '=', id).executeTakeFirst();
    return row ? KyselyWaterLogRepository.toRecord(row) : null;
  }

  async insert(log: WaterLogRecord, now: string): Promise<void> {
    await this.db
      .insertInto('water_logs')
      .values({
        id: log.id,
        profile_id: log.profileId,
        log_date: log.logDate,
        amount_ml: log.amountMl,
        logged_at: log.loggedAt,
        created_at: now,
        updated_at: now,
      })
      .execute();
  }

  async softDelete(profileId: string, id: string, now: string): Promise<boolean> {
    const result = await this.db
      .updateTable('water_logs')
      .set({ deleted_at: now, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }
}
