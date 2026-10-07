import type { AppSettings, UpdateAppSettingsInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const key = ['settings'] as const;

export function useAppSettings() {
  const client = useEvullyClient();
  return useQuery({ queryKey: key, queryFn: () => client.settings.get() });
}

function useSettingsMutation<TInput>(run: (input: TInput) => Promise<AppSettings>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (settings) => queryClient.setQueryData(key, settings),
  });
}

export function useUpdateAppSettings() {
  const client = useEvullyClient();
  return useSettingsMutation((input: UpdateAppSettingsInput) => client.settings.update(input));
}

export function useAcceptHealthNotice() {
  const client = useEvullyClient();
  return useSettingsMutation(() => client.settings.acceptHealthNotice());
}
