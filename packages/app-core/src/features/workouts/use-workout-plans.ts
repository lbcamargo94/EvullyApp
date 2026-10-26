import type { WorkoutPlanDto } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EvullyClient } from '../../client';
import { useEvullyClient } from '../../client-context';

const key = (profileId: string) => ['workout-plans', profileId] as const;

export function useWorkoutPlans(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: key(profileId ?? ''),
    queryFn: () => client.workoutPlans.list(profileId ?? ''),
    enabled: profileId !== null,
  });
}

type Plans = EvullyClient['workoutPlans'];

/**
 * One mutation for every plan edit: `run` receives the client API and the
 * profile; the returned plan replaces the cached one.
 */
export function usePlanMutation<TInput>(
  profileId: string,
  run: (plans: Plans, profileId: string, input: TInput) => Promise<WorkoutPlanDto>,
) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => run(client.workoutPlans, profileId, input),
    onSuccess: (plan) =>
      queryClient.setQueryData<WorkoutPlanDto[]>(key(profileId), (plans = []) =>
        plans.some((p) => p.id === plan.id)
          ? plans.map((p) => (p.id === plan.id ? plan : p))
          : [...plans, plan],
      ),
  });
}
