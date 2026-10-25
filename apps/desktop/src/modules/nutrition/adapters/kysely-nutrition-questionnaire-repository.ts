import { NUTRITION_QUESTIONNAIRE_VERSION, type NutritionPreferences } from '@evully/domain';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../database/schema';
import type {
  NutritionQuestionnaireRecord,
  NutritionQuestionnaireRepository,
} from '../ports/nutrition-questionnaire-repository';

const CODE = 'nutrition';

/** Stored in profile_questionnaires next to the tracking questionnaire. */
export class KyselyNutritionQuestionnaireRepository implements NutritionQuestionnaireRepository {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}

  async latest(profileId: string): Promise<NutritionQuestionnaireRecord | null> {
    const row = await this.db
      .selectFrom('profile_questionnaires')
      .select(['id', 'profile_id', 'status', 'answers', 'completed_at'])
      .where('profile_id', '=', profileId)
      .where('questionnaire_code', '=', CODE)
      .orderBy('completed_at', 'desc')
      .orderBy('id', 'desc')
      .executeTakeFirst();
    return row
      ? {
          id: row.id,
          profileId: row.profile_id,
          status: row.status,
          answers: JSON.parse(row.answers) as NutritionPreferences,
          completedAt: row.completed_at,
        }
      : null;
  }

  async insert(r: NutritionQuestionnaireRecord): Promise<void> {
    await this.db
      .insertInto('profile_questionnaires')
      .values({
        id: r.id,
        profile_id: r.profileId,
        questionnaire_code: CODE,
        questionnaire_version: NUTRITION_QUESTIONNAIRE_VERSION,
        answers: JSON.stringify(r.answers),
        status: r.status,
        completed_at: r.completedAt,
        created_at: r.completedAt,
        updated_at: r.completedAt,
      })
      .execute();
  }
}
