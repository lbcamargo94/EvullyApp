import type { WorkoutSessionDto } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EvullyClient } from '../../client';
import { useEvullyClient } from '../../client-context';

const key = (profileId: string) => ['workout-session', profileId] as const;

/** The profile's open session, or null (README §10.4). */
export function useOpenSession(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: key(profileId ?? ''),
    queryFn: () => client.workoutSessions.open(profileId ?? ''),
    enabled: profileId !== null,
  });
}

export function useWorkoutStats(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: ['workout-stats', profileId ?? ''] as const,
    queryFn: () => client.workoutSessions.stats(profileId ?? ''),
    enabled: profileId !== null,
  });
}

type Sessions = EvullyClient['workoutSessions'];

/**
 * Every session change returns the session (or null once it is finished or
 * discarded), which replaces the cached one.
 */
export function useSessionMutation<TInput>(
  profileId: string,
  run: (sessions: Sessions, profileId: string, input: TInput) => Promise<WorkoutSessionDto | null>,
) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => run(client.workoutSessions, profileId, input),
    onSuccess: (session) => queryClient.setQueryData(key(profileId), session),
  });
}
