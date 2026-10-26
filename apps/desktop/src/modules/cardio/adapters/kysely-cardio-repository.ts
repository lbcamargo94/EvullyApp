import type { LocalDate } from '@evully/domain';
import type { Kysely, Selectable } from 'kysely';
import type { CardioSessionsTable, DatabaseSchema } from '../../../database/schema';
import type { CardioRecord, CardioRepository } from '../ports/cardio-repository';

const toRecord = (r: Selectable<CardioSessionsTable>): CardioRecord => ({
  id: r.id,
  profileId: r.profile_id,
  sessionDate: r.session_date as LocalDate,
  startedAt: r.started_at,
  activityType: r.activity_type,
  activityName: r.activity_name,
  durationMinutes: r.duration_minutes,
  distanceKm: r.distance_km,
  steps: r.steps,
  intensity: r.intensity,
  heartRateAverage: r.heart_rate_average,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toRow = (s: CardioRecord) => ({
  session_date: s.sessionDate,
  started_at: s.startedAt,
  activity_type: s.activityType,
  activity_name: s.activityName,
  duration_minutes: s.durationMinutes,
  distance_km: s.distanceKm,
  steps: s.steps,
  intensity: s.intensity,
  heart_rate_average: s.heartRateAverage,
  notes: s.notes,
  updated_at: s.updatedAt,
});

export class KyselyCardioRepository implements CardioRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private active(profileId: string) {
    return this.db
      .selectFrom('cardio_sessions')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null);
  }

  async list(profileId: string): Promise<CardioRecord[]> {
    const rows = await this.active(profileId)
      .orderBy('session_date', 'desc')
      .orderBy('started_at', 'desc')
      .orderBy('id', 'desc')
      .execute();
    return rows.map(toRecord);
  }

  async findById(profileId: string, id: string): Promise<CardioRecord | null> {
    const row = await this.active(profileId).where('id', '=', id).executeTakeFirst();
    return row ? toRecord(row) : null;
  }

  async insert(s: CardioRecord): Promise<void> {
    await this.db
      .insertInto('cardio_sessions')
      .values({ id: s.id, profile_id: s.profileId, created_at: s.createdAt, ...toRow(s) })
      .execute();
  }

  async update(s: CardioRecord): Promise<void> {
    await this.db
      .updateTable('cardio_sessions')
      .set(toRow(s))
      .where('id', '=', s.id)
      .where('profile_id', '=', s.profileId)
      .where('deleted_at', 'is', null)
      .execute();
  }

  async softDelete(profileId: string, id: string, now: string): Promise<boolean> {
    const result = await this.db
      .updateTable('cardio_sessions')
      .set({ deleted_at: now, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return result.numUpdatedRows > 0n;
  }
}
