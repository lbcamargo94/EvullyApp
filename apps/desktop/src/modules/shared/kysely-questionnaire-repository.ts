import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../database/schema';
import type { QuestionnaireRecord, QuestionnaireRepository } from './ports';

/**
 * Module questionnaires (nutrition, workouts…) stored in profile_questionnaires
 * next to the tracking questionnaire, one code per module.
 */
export class KyselyQuestionnaireRepository<T> implements QuestionnaireRepository<T> {
  constructor(
    private readonly db: Kysely<DatabaseSchema>,
    private readonly code: string,
    private readonly version: string,
  ) {}

  async latest(profileId: string): Promise<QuestionnaireRecord<T> | null> {
    const row = await this.db
      .selectFrom('profile_questionnaires')
      .select(['id', 'profile_id', 'status', 'answers', 'completed_at'])
      .where('profile_id', '=', profileId)
      .where('questionnaire_code', '=', this.code)
      .orderBy('completed_at', 'desc')
      .orderBy('id', 'desc')
      .executeTakeFirst();
    return row
      ? {
          id: row.id,
          profileId: row.profile_id,
          status: row.status,
          answers: JSON.parse(row.answers) as T,
          completedAt: row.completed_at,
        }
      : null;
  }

  async insert(r: QuestionnaireRecord<T>): Promise<void> {
    await this.db
      .insertInto('profile_questionnaires')
      .values({
        id: r.id,
        profile_id: r.profileId,
        questionnaire_code: this.code,
        questionnaire_version: this.version,
        answers: JSON.stringify(r.answers),
        status: r.status,
        completed_at: r.completedAt,
        created_at: r.completedAt,
        updated_at: r.completedAt,
      })
      .execute();
  }
}
