import type { WorkoutPreferencesDto, WorkoutPreferencesInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const key = (profileId: string) => ['workout-preferences', profileId] as const;

export function useWorkoutPreferences(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: key(profileId ?? ''),
    queryFn: () => client.workoutPreferences.get(profileId ?? ''),
    enabled: profileId !== null,
  });
}

function usePreferencesMutation<TInput>(
  profileId: string,
  run: (input: TInput) => Promise<WorkoutPreferencesDto>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (prefs) => queryClient.setQueryData(key(profileId), prefs),
  });
}

export function useAnswerWorkoutQuestionnaire(profileId: string) {
  const client = useEvullyClient();
  return usePreferencesMutation(profileId, (input: Omit<WorkoutPreferencesInput, 'profileId'>) =>
    client.workoutPreferences.answer({ profileId, ...input }),
  );
}

export function useSkipWorkoutQuestionnaire(profileId: string) {
  const client = useEvullyClient();
  return usePreferencesMutation(profileId, () => client.workoutPreferences.skip(profileId));
}
