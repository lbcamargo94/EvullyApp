import type { ReminderSettings } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const key = (profileId: string) => ['reminders', profileId] as const;

/** The profile's reminders (README §25); all off until the profile turns one on. */
export function useReminderSettings(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: key(profileId ?? ''),
    queryFn: () => client.reminders.settings(profileId ?? ''),
    enabled: profileId !== null,
  });
}

export function useSetReminderSettings(profileId: string) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: ReminderSettings) => client.reminders.setSettings(profileId, settings),
    onSuccess: (settings: ReminderSettings) => queryClient.setQueryData(key(profileId), settings),
  });
}
