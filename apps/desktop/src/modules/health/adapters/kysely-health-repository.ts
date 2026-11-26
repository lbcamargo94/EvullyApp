import type { LocalDate } from '@evully/domain';
import type { Kysely, Selectable, Transaction } from 'kysely';
import type {
  DatabaseSchema,
  HealthExamResultsTable,
  HealthExamsTable,
} from '../../../database/schema';
import type {
  HealthExamRecord,
  HealthExamRepository,
  HealthResultRecord,
} from '../ports/health-repository';

const toResult = (r: Selectable<HealthExamResultsTable>): HealthResultRecord => ({
  id: r.id,
  analyteCode: r.analyte_code,
  analyteName: r.analyte_name,
  value: r.value,
  unit: r.unit,
  referenceMin: r.reference_min,
  referenceMax: r.reference_max,
  referenceText: r.reference_text,
});

const toExam = (
  e: Selectable<HealthExamsTable>,
  results: HealthResultRecord[],
): HealthExamRecord => ({
  id: e.id,
  profileId: e.profile_id,
  collectedOn: e.collected_on as LocalDate,
  laboratory: e.laboratory,
  notes: e.notes,
  results,
  createdAt: e.created_at,
  updatedAt: e.updated_at,
});

export class KyselyHealthExamRepository implements HealthExamRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  private exams(profileId: string) {
    return this.db
      .selectFrom('health_exams')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null);
  }

  private async withResults(profileId: string, exams: Selectable<HealthExamsTable>[]) {
    if (exams.length === 0) return [];
    const rows = await this.db
      .selectFrom('health_exam_results')
      .selectAll()
      .where('profile_id', '=', profileId)
      .where('deleted_at', 'is', null)
      .where(
        'exam_id',
        'in',
        exams.map((e) => e.id),
      )
      .orderBy('sort_order')
      .execute();
    return exams.map((e) => toExam(e, rows.filter((r) => r.exam_id === e.id).map(toResult)));
  }

  async list(profileId: string): Promise<HealthExamRecord[]> {
    const exams = await this.exams(profileId)
      .orderBy('collected_on', 'desc')
      .orderBy('id', 'desc')
      .execute();
    return this.withResults(profileId, exams);
  }

  async findById(profileId: string, id: string): Promise<HealthExamRecord | null> {
    const exam = await this.exams(profileId).where('id', '=', id).executeTakeFirst();
    return exam ? ((await this.withResults(profileId, [exam]))[0] ?? null) : null;
  }

  private async insertResults(trx: Transaction<DatabaseSchema>, exam: HealthExamRecord) {
    if (exam.results.length === 0) return;
    await trx
      .insertInto('health_exam_results')
      .values(
        exam.results.map((r, i) => ({
          id: r.id,
          profile_id: exam.profileId,
          exam_id: exam.id,
          sort_order: i,
          analyte_code: r.analyteCode,
          analyte_name: r.analyteName,
          value: r.value,
          unit: r.unit,
          reference_min: r.referenceMin,
          reference_max: r.referenceMax,
          reference_text: r.referenceText,
          created_at: exam.updatedAt,
          deleted_at: null,
        })),
      )
      .execute();
  }

  async insert(exam: HealthExamRecord): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .insertInto('health_exams')
        .values({
          id: exam.id,
          profile_id: exam.profileId,
          collected_on: exam.collectedOn,
          laboratory: exam.laboratory,
          notes: exam.notes,
          created_at: exam.createdAt,
          updated_at: exam.updatedAt,
          deleted_at: null,
        })
        .execute();
      await this.insertResults(trx, exam);
    });
  }

  async update(exam: HealthExamRecord): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('health_exams')
        .set({
          collected_on: exam.collectedOn,
          laboratory: exam.laboratory,
          notes: exam.notes,
          updated_at: exam.updatedAt,
        })
        .where('id', '=', exam.id)
        .where('profile_id', '=', exam.profileId)
        .where('deleted_at', 'is', null)
        .execute();
      await trx
        .updateTable('health_exam_results')
        .set({ deleted_at: exam.updatedAt })
        .where('exam_id', '=', exam.id)
        .where('profile_id', '=', exam.profileId)
        .where('deleted_at', 'is', null)
        .execute();
      await this.insertResults(trx, exam);
    });
  }

  async softDelete(profileId: string, id: string, now: string): Promise<boolean> {
    return this.db.transaction().execute(async (trx) => {
      const result = await trx
        .updateTable('health_exams')
        .set({ deleted_at: now, updated_at: now })
        .where('id', '=', id)
        .where('profile_id', '=', profileId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();
      if (result.numUpdatedRows === 0n) return false;
      await trx
        .updateTable('health_exam_results')
        .set({ deleted_at: now })
        .where('exam_id', '=', id)
        .where('profile_id', '=', profileId)
        .where('deleted_at', 'is', null)
        .execute();
      return true;
    });
  }
}
