import type { LocalDate } from '@evully/domain';
import type { Kysely, Selectable } from 'kysely';
import type { DatabaseSchema, SleepLogsTable } from '../../../database/schema';
import type {
  SleepRecord,
  SleepRepository,
  SleepTargetRecord,
  SleepTargetRepository,
} from '../ports/sleep-repository';

const toRecord = (r: Selectable<SleepLogsTable>): SleepRecord => ({
  id: r.id,
  profileId: r.profile_id,
  sleepDate: r.sleep_date as LocalDate,
  bedTime: r.bed_time,
  sleepTime: r.sleep_time,
  wakeTime: r.wake_time,
  durationMinutes: r.duration_minutes,
  quality: r.quality,
  notes: r.notes,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toRow = (s: SleepRecord) => ({
  sleep_date: s.sleepDate,
  bed_time: s.bedTime,
  sleep_time: s.sleepTime,
  wake_time: s.wakeTime,
  duration_minutes: s.durationMinutes,
  quality: s.quality,
  notes: s.notes,
  updated_at: s.updatedAt,
});

export class KyselySleepRepository implements SleepRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private active(profileId: string) {
    return this.db
      .selectFrom('sleep_logs')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null);
  }

  async list(profileId: string): Promise<SleepRecord[]> {
    const rows = await this.active(profileId)
      .orderBy('sleep_date', 'desc')
      .orderBy('id', 'desc')
      .execute();
    return rows.map(toRecord);
  }

  async findById(profileId: string, id: string): Promise<SleepRecord | null> {
    const row = await this.active(profileId).where('id', '=', id).executeTakeFirst();
    return row ? toRecord(row) : null;
  }

  async findByDate(profileId: string, sleepDate: string): Promise<SleepRecord | null> {
    const row = await this.active(profileId).where('sleep_date', '=', sleepDate).executeTakeFirst();
    return row ? toRecord(row) : null;
  }

  async insert(s: SleepRecord): Promise<void> {
    await this.db
      .insertInto('sleep_logs')
      .values({ id: s.id, profile_id: s.profileId, created_at: s.createdAt, ...toRow(s) })
      .execute();
  }

  async update(s: SleepRecord): Promise<void> {
    await this.db
      .updateTable('sleep_logs')
      .set(toRow(s))
      .where('id', '=', s.id)
      .where('profile_id', '=', s.profileId)
      .where('deleted_at', 'is', null)
      .execute();
  }

  async softDelete(profileId: string, id: string, now: string): Promise<boolean> {
    const result = await this.db
      .updateTable('sleep_logs')
      .set({ deleted_at: now, updated_at: now })
      .where('id', '=', id)
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return Number(result.numUpdatedRows) > 0;
  }
}

export class KyselySleepTargetRepository implements SleepTargetRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async list(profileId: string): Promise<SleepTargetRecord[]> {
    const rows = await this.db
      .selectFrom('sleep_targets')
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
      minutesPerNight: r.minutes_per_night,
      createdAt: r.created_at,
    }));
  }

  async insert(t: SleepTargetRecord): Promise<void> {
    await this.db
      .insertInto('sleep_targets')
      .values({
        id: t.id,
        profile_id: t.profileId,
        effective_from: t.effectiveFrom,
        minutes_per_night: t.minutesPerNight,
        created_at: t.createdAt,
      })
      .execute();
  }
}
