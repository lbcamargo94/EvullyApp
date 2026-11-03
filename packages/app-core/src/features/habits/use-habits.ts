import type { HabitDay, HabitInput, UpdateHabitInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { EvullyClient } from '../../client';
import { useEvullyClient } from '../../client-context';

const listKey = (profileId: string) => ['habits', profileId, 'list'] as const;
const dayKey = (profileId: string, date: string) => ['habits', profileId, 'day', date] as const;

export function useHabits(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: listKey(profileId ?? ''),
    queryFn: () => client.habits.list(profileId ?? ''),
    enabled: profileId !== null,
  });
}

export function useHabitDay(profileId: string | null, date: string) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: dayKey(profileId ?? '', date),
    queryFn: () => client.habits.day(profileId ?? '', date),
    enabled: profileId !== null,
  });
}

export function useHabitHistory(profileId: string | null, habitId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: ['habits', profileId ?? '', 'history', habitId ?? ''] as const,
    queryFn: () => client.habits.history(profileId ?? '', habitId ?? ''),
    enabled: profileId !== null && habitId !== null,
  });
}

/** Logging a value returns the day, which replaces the cached one. */
export function useLogHabit(profileId: string) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { habitId: string; date: string; value: number | null }) =>
      client.habits.log(profileId, input.habitId, input.date, input.value),
    onSuccess: (day: HabitDay) => queryClient.setQueryData(dayKey(profileId, day.date), day),
  });
}

/** Any change to the habits refreshes the list and every cached day. */
export function useHabitMutation<TInput, TOutput>(
  profileId: string,
  run: (habits: EvullyClient['habits'], profileId: string, input: TInput) => Promise<TOutput>,
) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput) => run(client.habits, profileId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits', profileId] }),
  });
}

export type HabitFormInput = Omit<HabitInput, 'profileId'> | Omit<UpdateHabitInput, 'profileId'>;
