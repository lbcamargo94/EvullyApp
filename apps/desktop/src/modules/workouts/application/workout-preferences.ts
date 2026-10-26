import type { WorkoutPreferencesDto, WorkoutPreferencesInput } from '@evully/contracts';
import {
  EMPTY_WORKOUT_PREFERENCES,
  normalizeWorkoutPreferences,
  suggestPlanTemplates,
  type WorkoutPreferences,
} from '@evully/domain';
import { GetProfile } from '../../profiles/application/get-profile';
import type { ProfileRepository } from '../../profiles/ports/profile-repository';
import type { Clock, IdGenerator, QuestionnaireRepository } from '../../shared/ports';

export interface WorkoutPreferenceDeps {
  profiles: ProfileRepository;
  questionnaires: QuestionnaireRepository<WorkoutPreferences>;
  clock: Clock;
  ids: IdGenerator;
}

const toDto = (
  status: WorkoutPreferencesDto['status'],
  prefs: WorkoutPreferences,
): WorkoutPreferencesDto => ({ status, ...prefs, suggestions: suggestPlanTemplates(prefs) });

/** Latest answers with their suggestions; pending until answered or skipped. */
export class GetWorkoutPreferences {
  constructor(private readonly deps: WorkoutPreferenceDeps) {}

  async execute({ profileId }: { profileId: string }): Promise<WorkoutPreferencesDto> {
    await new GetProfile(this.deps.profiles).execute({ id: profileId });
    const latest = await this.deps.questionnaires.latest(profileId);
    if (!latest) return toDto('pending', EMPTY_WORKOUT_PREFERENCES);
    return toDto(
      latest.status,
      latest.status === 'completed' ? latest.answers : EMPTY_WORKOUT_PREFERENCES,
    );
  }
}

async function save(
  deps: WorkoutPreferenceDeps,
  profileId: string,
  status: 'completed' | 'skipped',
  answers: WorkoutPreferences,
) {
  await new GetProfile(deps.profiles).execute({ id: profileId });
  await deps.questionnaires.insert({
    id: deps.ids.next(),
    profileId,
    status,
    answers,
    completedAt: deps.clock.nowIso(),
  });
  return toDto(status, answers);
}

/** Each answer is a new record; earlier answers stay as history. */
export class AnswerWorkoutQuestionnaire {
  constructor(private readonly deps: WorkoutPreferenceDeps) {}

  async execute({ profileId, ...answers }: WorkoutPreferencesInput) {
    return save(this.deps, profileId, 'completed', normalizeWorkoutPreferences(answers));
  }
}

export class SkipWorkoutQuestionnaire {
  constructor(private readonly deps: WorkoutPreferenceDeps) {}

  async execute({ profileId }: { profileId: string }) {
    return save(this.deps, profileId, 'skipped', EMPTY_WORKOUT_PREFERENCES);
  }
}
