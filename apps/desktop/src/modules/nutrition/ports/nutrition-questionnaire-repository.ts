import type { NutritionPreferences } from '@evully/domain';
import type { QuestionnaireRecord, QuestionnaireRepository } from '../../shared/ports';

export type NutritionQuestionnaireRecord = QuestionnaireRecord<NutritionPreferences>;

/** Answers of the nutrition module questionnaire, kept as history (README §8.2, §9). */
export type NutritionQuestionnaireRepository = QuestionnaireRepository<NutritionPreferences>;
