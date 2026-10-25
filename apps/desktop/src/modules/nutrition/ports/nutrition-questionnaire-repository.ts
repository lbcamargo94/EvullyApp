import type { NutritionPreferences } from '@evully/domain';

export interface NutritionQuestionnaireRecord {
  id: string;
  profileId: string;
  status: 'completed' | 'skipped';
  answers: NutritionPreferences;
  completedAt: string;
}

/** Answers of the nutrition module questionnaire, kept as history (README §8.2, §9). */
export interface NutritionQuestionnaireRepository {
  latest(profileId: string): Promise<NutritionQuestionnaireRecord | null>;
  insert(record: NutritionQuestionnaireRecord): Promise<void>;
}
