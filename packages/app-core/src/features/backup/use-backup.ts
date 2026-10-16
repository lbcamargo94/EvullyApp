import type { BackupStatus } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const key = ['backup'] as const;

/** Backup is a desktop capability (FRONTEND.md §3.4); `available` is false elsewhere. */
export function useBackupStatus() {
  const client = useEvullyClient();
  const backup = client.backup;
  const query = useQuery({
    queryKey: key,
    queryFn: () => (backup ? backup.status() : Promise.resolve(null)),
  });
  return { ...query, available: backup !== undefined };
}

function useBackupMutation<TInput>(run: (input: TInput) => Promise<BackupStatus>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (status) => queryClient.setQueryData(key, status),
  });
}

function requireBackup(client: ReturnType<typeof useEvullyClient>) {
  if (!client.backup) throw new Error('Backup is not available on this platform');
  return client.backup;
}

export function useCreateManualBackup() {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => requireBackup(client).createManual(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useSetAutomaticBackup() {
  const client = useEvullyClient();
  return useBackupMutation((enabled: boolean) => requireBackup(client).setAutomatic(enabled));
}

export function useChooseExtraBackupDirectory() {
  const client = useEvullyClient();
  return useBackupMutation((clear: boolean) => requireBackup(client).chooseExtraDirectory(clear));
}

export function useDismissBackupError() {
  const client = useEvullyClient();
  return useBackupMutation(() => requireBackup(client).dismissError());
}
