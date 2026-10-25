import type { NutritionPreferencesDto, NutritionPreferencesInput } from '@evully/contracts';
import {
  DEFAULT_NUTRITION_PREFERENCES,
  normalizeNutritionPreferences,
  type NutritionPreferences,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator } from '../../shared/ports';
import type { NutritionQuestionnaireRepository } from '../ports/nutrition-questionnaire-repository';

export interface NutritionPreferenceDeps {
  profiles: ProfileRepository;
  questionnaires: NutritionQuestionnaireRepository;
  clock: Clock;
  ids: IdGenerator;
}

/** Latest answers; defaults while pending or after a skip. */
export class GetNutritionPreferences {
  constructor(private readonly deps: NutritionPreferenceDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<NutritionPreferencesDto> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const latest = await this.deps.questionnaires.latest(profileId);
    if (!latest) return { status: 'pending', ...DEFAULT_NUTRITION_PREFERENCES };
    return {
      status: latest.status,
      ...(latest.status === 'completed' ? latest.answers : DEFAULT_NUTRITION_PREFERENCES),
    };
  }
}

async function save(
  deps: NutritionPreferenceDeps,
  profileId: string,
  status: 'completed' | 'skipped',
  answers: NutritionPreferences,
): Promise<NutritionPreferencesDto> {
  await new GetProfile(deps.profiles).execute({ id: profileId });
  await deps.questionnaires.insert({
    id: deps.ids.next(),
    profileId,
    status,
    answers,
    completedAt: deps.clock.nowIso(),
  });
  return { status, ...answers };
}

/** Each answer is a new record; earlier answers stay as history. */
export class AnswerNutritionQuestionnaire {
  constructor(private readonly deps: NutritionPreferenceDeps) {}

  async execute({ profileId, ...answers }: NutritionPreferencesInput) {
    return save(this.deps, profileId, 'completed', normalizeNutritionPreferences(answers));
  }
}

export class SkipNutritionQuestionnaire {
  constructor(private readonly deps: NutritionPreferenceDeps) {}

  async execute({ profileId }: { profileId: string }) {
    return save(this.deps, profileId, 'skipped', DEFAULT_NUTRITION_PREFERENCES);
  }
}
