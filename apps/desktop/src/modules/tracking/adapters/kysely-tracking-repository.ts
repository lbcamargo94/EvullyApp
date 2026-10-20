import type { FocusArea, LocalDate } from '@evully/domain';
import type { Kysely, Transaction } from 'kysely';
import type { DatabaseSchema } from '../../../database/schema';
import type { IdGenerator } from '../../shared/ports';
import type {
  MeasurementType,
  TrackingConfigRecord,
  TrackingRepository,
  TrackingSetup,
} from '../ports/tracking-repository';

type Trx = Transaction<DatabaseSchema>;

export class KyselyTrackingRepository implements TrackingRepository {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly ids: IdGenerator,
  ) {}

  async saveSetup(setup: TrackingSetup): Promise<void> {
    const now = setup.questionnaire.completedAt;
    await this.db.transaction().execute(async (trx) => {
      const q = setup.questionnaire;
      await trx
        .insertInto('profile_questionnaires')
        .values({
          id: q.id,
          profile_id: q.profileId,
          questionnaire_code: 'tracking',
          questionnaire_version: q.version,
          answers: JSON.stringify(q.answers),
          status: q.status,
          completed_at: q.completedAt,
          created_at: now,
          updated_at: now,
        })
        .execute();

      if (setup.project) {
        const p = setup.project;
        await trx
          .insertInto('projects')
          .values({
            id: p.id,
            profile_id: p.profileId,
            name: p.name,
            objective: p.objective,
            start_date: p.startDate,
            target_date: p.targetDate,
            status: p.status,
            notes: p.notes,
            created_at: p.createdAt,
            updated_at: p.updatedAt,
          })
          .execute();
      }

      const c = setup.config;
      await trx.insertInto('tracking_configs').values(configRow(c)).execute();

      await this.replaceMeasurements(trx, c.profileId, setup.measurementCodes, now);
      await this.addMissingTags(trx, c.profileId, setup.tags, now);
    });
  }

  /** Activates the chosen measurements in order; others become inactive but keep history. */
  private async replaceMeasurements(trx: Trx, profileId: string, codes: string[], now: string) {
    const types = await trx
      .selectFrom('measurement_types')
      .select(['id', 'code'])
      .where('code', 'in', codes.length ? codes : [''])
      .where('is_active', '=', 1)
      .execute();
    const idByCode = new Map(types.map((t) => [t.code, t.id]));

    await trx
      .updateTable('profile_measurement_types')
      .set({ is_active: 0, updated_at: now })
      .where('profile_id', '=', profileId)
      .execute();

    for (const [index, code] of codes.entries()) {
      const typeId = idByCode.get(code);
      if (!typeId) throw new Error(`Unknown measurement type: ${code}`);
      await trx
        .insertInto('profile_measurement_types')
        .values({
          id: this.ids.next(),
          profile_id: profileId,
          measurement_type_id: typeId,
          sort_order: index + 1,
          is_active: 1,
          created_at: now,
          updated_at: now,
        })
        .onConflict((oc) =>
          oc
            .columns(['profile_id', 'measurement_type_id'])
            .doUpdateSet({ sort_order: index + 1, is_active: 1, updated_at: now }),
        )
        .execute();
    }
  }

  private async addMissingTags(trx: Trx, profileId: string, names: string[], now: string) {
    const existing = await trx
      .selectFrom('tags')
      .select(['name', 'sort_order'])
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .execute();
    const have = new Set(existing.map((t) => t.name));
    let order = Math.max(0, ...existing.map((t) => t.sort_order));
    for (const name of names.filter((n) => !have.has(n))) {
      await trx
        .insertInto('tags')
        .values({
          id: this.ids.next(),
          profile_id: profileId,
          name,
          sort_order: ++order,
          created_at: now,
          updated_at: now,
        })
        .execute();
    }
  }

  async listConfigs(profileId: string): Promise<TrackingConfigRecord[]> {
    const rows = await this.db
      .selectFrom('tracking_configs')
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
      weightDisplay: r.weight_display,
      focusAreas: JSON.parse(r.focus_areas) as FocusArea[],
      source: r.source,
      ruleVersion: r.rule_version,
      questionnaireId: r.questionnaire_id,
      createdAt: r.created_at,
    }));
  }

  async latestQuestionnaireStatus(profileId: string): Promise<'completed' | 'skipped' | null> {
    const row = await this.db
      .selectFrom('profile_questionnaires')
      .select('status')
      .where('profile_id', '=', profileId)
      .where('questionnaire_code', '=', 'tracking')
      .orderBy('completed_at', 'desc')
      .orderBy('id', 'desc')
      .executeTakeFirst();
    return row?.status ?? null;
  }

  async insertConfig(c: TrackingConfigRecord): Promise<void> {
    await this.db.insertInto('tracking_configs').values(configRow(c)).execute();
  }

  async setTrackedMeasurements(profileId: string, typeIds: readonly string[], now: string) {
    await this.db.transaction().execute(async (trx) => {
      const rows = await trx
        .selectFrom('measurement_types')
        .select(['id', 'code'])
        .where('id', 'in', typeIds.length ? [...typeIds] : [''])
        .execute();
      const codeById = new Map(rows.map((r) => [r.id, r.code]));
      // replaceMeasurements works with codes and keeps the given order.
      await this.replaceMeasurements(
        trx,
        profileId,
        typeIds.map((id) => codeById.get(id) ?? ''),
        now,
      );
    });
  }

  async listCatalog(): Promise<MeasurementType[]> {
    const rows = await this.db
      .selectFrom('measurement_types')
      .select(['id', 'code', 'name', 'body_region', 'instructions', 'csv_name'])
      .where('is_active', '=', 1)
      .orderBy('sort_order')
      .execute();
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      bodyRegion: r.body_region,
      instructions: r.instructions,
      csvName: r.csv_name,
    }));
  }

  async listActiveMeasurementTypes(profileId: string): Promise<MeasurementType[]> {
    const rows = await this.db
      .selectFrom('profile_measurement_types as pmt')
      .innerJoin('measurement_types as mt', 'mt.id', 'pmt.measurement_type_id')
      .select(['mt.id', 'mt.code', 'mt.name', 'mt.body_region', 'mt.instructions', 'mt.csv_name'])
      .where('pmt.profile_id', '=', profileId)
      .where('pmt.is_active', '=', 1)
      .orderBy('pmt.sort_order')
      .execute();
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      bodyRegion: r.body_region,
      instructions: r.instructions,
      csvName: r.csv_name,
    }));
  }
}

const configRow = (c: TrackingConfigRecord) => ({
  id: c.id,
  profile_id: c.profileId,
  effective_from: c.effectiveFrom,
  weight_display: c.weightDisplay,
  focus_areas: JSON.stringify(c.focusAreas),
  enabled_modules: '[]',
  source: c.source,
  rule_version: c.ruleVersion,
  questionnaire_id: c.questionnaireId,
  created_at: c.createdAt,
  updated_at: c.createdAt,
});
