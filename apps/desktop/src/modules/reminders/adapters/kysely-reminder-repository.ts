import {
  REMINDER_TYPES,
  type LocalDate,
  type QuietHours,
  type ReminderPreference,
  type ReminderType,
} from '@evully/domain';
import type { Kysely, Selectable } from 'kysely';
import type { DatabaseSchema, NotificationPreferencesTable } from '../../../database/schema';
import {
  DESKTOP_CHANNEL,
  type ReminderEvent,
  type ReminderRepository,
} from '../ports/reminder-ports';

const isType = (value: string): value is ReminderType =>
  (REMINDER_TYPES as readonly string[]).includes(value);

/** Latest row of each known type, newest change first. */
function latestByType(rows: readonly Selectable<NotificationPreferencesTable>[]) {
  const latest = new Map<ReminderType, Selectable<NotificationPreferencesTable>>();
  for (const row of rows) {
    if (isType(row.event_type) && !latest.has(row.event_type)) latest.set(row.event_type, row);
  }
  return latest;
}

export class KyselyReminderRepository implements ReminderRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private rows(profileId: string | null) {
    let query = this.db
      .selectFrom('notification_preferences')
      .selectAll()
      .where('channel', '=', DESKTOP_CHANNEL);
    if (profileId !== null) query = query.where('profile_id', '=', profileId);
    // Newest first; UUID v7 ids break ties within the same instant.
    return query.orderBy('created_at', 'desc').orderBy('id', 'desc').execute();
  }

  async current(profileId: string) {
    const rows = await this.rows(profileId);
    const latest = latestByType(rows);
    const preferences: ReminderPreference[] = [...latest.values()].map((r) => ({
      type: r.event_type as ReminderType,
      enabled: r.enabled === 1,
      time: r.preferred_time,
      weekday: r.weekday,
    }));
    const newest = rows[0];
    const quietHours: QuietHours | null =
      newest?.quiet_hours_start && newest.quiet_hours_end
        ? { start: newest.quiet_hours_start, end: newest.quiet_hours_end }
        : null;
    return { preferences, quietHours };
  }

  async save(
    profileId: string,
    rows: { id: string; preference: ReminderPreference }[],
    quietHours: QuietHours | null,
    now: string,
  ): Promise<void> {
    if (rows.length === 0) return;
    await this.db
      .insertInto('notification_preferences')
      .values(
        rows.map(({ id, preference: p }) => ({
          id,
          profile_id: profileId,
          channel: DESKTOP_CHANNEL,
          event_type: p.type,
          enabled: p.enabled ? 1 : 0,
          preferred_time: p.time,
          weekday: p.weekday,
          quiet_hours_start: quietHours?.start ?? null,
          quiet_hours_end: quietHours?.end ?? null,
          timezone: null,
          created_at: now,
        })),
      )
      .execute();
  }

  async shownOn(profileId: string, date: LocalDate): Promise<ReminderType[]> {
    const rows = await this.db
      .selectFrom('notification_events')
      .select('event_type')
      .where('profile_id', '=', profileId)
      .where('channel', '=', DESKTOP_CHANNEL)
      .where('local_date', '=', date)
      .execute();
    return rows.map((r) => r.event_type).filter(isType);
  }

  async recordShown(event: ReminderEvent, now: string): Promise<boolean> {
    const result = await this.db
      .insertInto('notification_events')
      .values({
        id: event.id,
        profile_id: event.profileId,
        channel: DESKTOP_CHANNEL,
        event_type: event.type,
        local_date: event.localDate,
        shown_at: event.shownAt,
        created_at: now,
      })
      .onConflict((oc) => oc.doNothing())
      .executeTakeFirst();
    return Number(result.numInsertedOrUpdatedRows ?? 0) > 0;
  }

  async profilesWithReminders(): Promise<string[]> {
    const byProfile = new Map<string, Selectable<NotificationPreferencesTable>[]>();
    for (const row of await this.rows(null)) {
      byProfile.set(row.profile_id, [...(byProfile.get(row.profile_id) ?? []), row]);
    }
    return [...byProfile].flatMap(([profileId, rows]) =>
      [...latestByType(rows).values()].some((r) => r.enabled === 1) ? [profileId] : [],
    );
  }
}
