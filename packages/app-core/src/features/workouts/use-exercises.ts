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
