import type { ExerciseInput, UpdateExerciseInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const key = (profileId: string) => ['exercises', profileId] as const;

export function useExercises(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: key(profileId ?? ''),
    queryFn: () => client.exercises.list(profileId ?? ''),
    enabled: profileId !== null,
  });
}

function useExerciseMutation<TInput, TOutput>(
  profileId: string,
  run: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(profileId) }),
  });
}

export function useCreateExercise(profileId: string) {
  const client = useEvullyClient();
  return useExerciseMutation(profileId, (input: Omit<ExerciseInput, 'profileId'>) =>
    client.exercises.create({ profileId, ...input }),
  );
}

export function useUpdateExercise(profileId: string) {
  const client = useEvullyClient();
  return useExerciseMutation(profileId, (input: Omit<UpdateExerciseInput, 'profileId'>) =>
    client.exercises.update({ profileId, ...input }),
  );
}

export function useDeactivateExercise(profileId: string) {
  const client = useEvullyClient();
  return useExerciseMutation(profileId, (id: string) => client.exercises.deactivate(profileId, id));
}

const historyKey = (profileId: string, exerciseId: string) =>
  ['exercise-history', profileId, exerciseId] as const;

export function useExerciseHistory(profileId: string, exerciseId: string) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: historyKey(profileId, exerciseId),
    queryFn: () => client.exercises.history(profileId, exerciseId),
  });
}

/** The increment also changes the suggestions shown in the open session. */
export function useSetExerciseIncrement(profileId: string, exerciseId: string) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (loadIncrementKg: number | null) =>
      client.exercises.setIncrement(profileId, exerciseId, loadIncrementKg),
    onSuccess: async (history) => {
      queryClient.setQueryData(historyKey(profileId, exerciseId), history);
      await queryClient.invalidateQueries({ queryKey: ['workout-session', profileId] });
    },
  });
}
