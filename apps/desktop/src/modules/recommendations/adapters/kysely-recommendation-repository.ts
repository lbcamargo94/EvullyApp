import type { Kysely, Selectable, Transaction } from 'kysely';
import type { DatabaseSchema, RecommendationEventsTable } from '../../../database/schema';
import type { IdGenerator } from '../../shared/ports';
import {
  configRow,
  replaceTrackedMeasurements,
} from '../../tracking/adapters/kysely-tracking-repository';
import type {
  DecisionRecord,
  RecommendationRecord,
  RecommendationRepository,
  StatusChange,
  TrackingChange,
} from '../ports/recommendation-repository';

const toRecord = (row: Selectable<RecommendationEventsTable>): RecommendationRecord => ({
  id: row.id,
  profileId: row.profile_id,
  ruleId: row.rule_id,
  ruleVersion: row.rule_version,
  subjectKey: row.subject_key,
  level: row.level,
  evidence: JSON.parse(row.evidence) as unknown,
  detectedOn: row.detected_on,
  status: row.status,
  statusOn: row.status_on,
  snoozedUntil: row.snoozed_until,
  createdAt: row.created_at,
});

export class KyselyRecommendationRepository implements RecommendationRepository {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly ids: IdGenerator,
  ) {}

  async list(profileId: string): Promise<RecommendationRecord[]> {
    const rows = await this.db
      .selectFrom('recommendation_events')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .orderBy('created_at')
      .orderBy('id')
      .execute();
    return rows.map(toRecord);
  }

  async findById(profileId: string, id: string): Promise<RecommendationRecord | null> {
    const row = await this.db
      .selectFrom('recommendation_events')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();
    return row ? toRecord(row) : null;
  }

  async apply(
    profileId: string,
    created: readonly RecommendationRecord[],
    changes: readonly StatusChange[],
    now: string,
  ): Promise<void> {
    if (created.length === 0 && changes.length === 0) return;
    await this.db.transaction().execute(async (trx) => {
      if (created.length > 0) {
        await trx
          .insertInto('recommendation_events')
          .values(
            created.map((r) => ({
              id: r.id,
              profile_id: profileId,
              rule_id: r.ruleId,
              rule_version: r.ruleVersion,
              subject_key: r.subjectKey,
              level: r.level,
              evidence: JSON.stringify(r.evidence),
              detected_on: r.detectedOn,
              status: r.status,
              status_on: r.statusOn,
              snoozed_until: r.snoozedUntil,
              created_at: r.createdAt,
              updated_at: r.createdAt,
              deleted_at: null,
            })),
          )
          .execute();
      }
      for (const change of changes) {
        await trx
          .updateTable('recommendation_events')
          .set({
            status: change.status,
            status_on: change.statusOn,
            snoozed_until: change.snoozedUntil,
            updated_at: now,
          })
          .where('profile_id', '=', profileId)
          .where('id', '=', change.id)
          .execute();
      }
    });
  }

  async decide(decision: DecisionRecord, change: StatusChange, now: string): Promise<void> {
    await this.db.transaction().execute((trx) => writeDecision(trx, decision, change, now));
  }

  async accept(
    decision: DecisionRecord,
    change: StatusChange,
    tracking: TrackingChange,
    now: string,
  ): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await replaceTrackedMeasurements(
        trx,
        this.ids,
        decision.profileId,
        tracking.measurementCodes,
        now,
      );
      await trx.insertInto('tracking_configs').values(configRow(tracking.config)).execute();
      await writeDecision(trx, decision, change, now);
    });
  }
}

async function writeDecision(
  trx: Transaction<DatabaseSchema>,
  decision: DecisionRecord,
  change: StatusChange,
  now: string,
): Promise<void> {
  await trx
    .insertInto('recommendation_decisions')
    .values({
      id: decision.id,
      profile_id: decision.profileId,
      event_id: decision.eventId,
      decision: decision.decision,
      decided_at: decision.decidedAt,
      created_at: now,
    })
    .execute();
  await trx
    .updateTable('recommendation_events')
    .set({
      status: change.status,
      status_on: change.statusOn,
      snoozed_until: change.snoozedUntil,
      updated_at: now,
    })
    .where('profile_id', '=', decision.profileId)
    .where('id', '=', change.id)
    .execute();
}
