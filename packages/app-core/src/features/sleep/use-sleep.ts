import type { SleepInput, SleepLogDto, UpdateSleepInput } from '@evully/contracts';
import { parseLocalDate, sleepIndicators, type SleepIndicators } from '@evully/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const key = (profileId: string) => ['sleep', profileId] as const;

export function useSleepLogs(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: key(profileId ?? ''),
    queryFn: () => client.sleep.list(profileId ?? ''),
    enabled: profileId !== null,
  });
}

function useSleepMutation<TInput, TOutput>(
  profileId: string,
  run: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(profileId) }),
  });
}

export function useRegisterSleep(profileId: string) {
  const client = useEvullyClient();
  return useSleepMutation(profileId, (input: Omit<SleepInput, 'profileId'>) =>
    client.sleep.register({ profileId, ...input }),
  );
}

export function useUpdateSleep(profileId: string) {
  const client = useEvullyClient();
  return useSleepMutation(profileId, (input: Omit<UpdateSleepInput, 'profileId'>) =>
    client.sleep.update({ profileId, ...input }),
  );
}

export function useDeleteSleep(profileId: string) {
  const client = useEvullyClient();
  return useSleepMutation(profileId, (id: string) => client.sleep.remove(profileId, id));
}

const clockOf = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

/** Indicators from the nights, with clock times in this device's time zone (README §12.2). */
export function indicatorsOf(nights: readonly SleepLogDto[], today: string): SleepIndicators {
  return sleepIndicators(
    nights.map((n) => ({
      sleepDate: n.sleepDate,
      durationMinutes: n.durationMinutes,
      startClock: clockOf(n.sleepTime ?? n.bedTime),
      wakeClock: clockOf(n.wakeTime),
    })),
    parseLocalDate(today),
  );
}
