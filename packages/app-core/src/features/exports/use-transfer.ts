import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

function requireTransfer(client: ReturnType<typeof useEvullyClient>) {
  if (!client.transfer) throw new Error('Profile transfer is not available on this platform');
  return client.transfer;
}

/** True where the profile transfer exists (desktop). */
export function useTransferAvailable(): boolean {
  return useEvullyClient().transfer !== undefined;
}

/** "Exportar perfil": saves the transfer zip; null when the dialog is cancelled. */
export function useExportTransfer(profileId: string) {
  const client = useEvullyClient();
  return useMutation({ mutationFn: () => requireTransfer(client).exportProfile(profileId) });
}

/** Opens the file dialog and returns what the file holds (null if cancelled). */
export function usePrepareProfileImport() {
  const client = useEvullyClient();
  return useMutation({ mutationFn: () => requireTransfer(client).prepareImport() });
}

/** Writes the profile; every cached screen is refreshed afterwards. */
export function useConfirmProfileImport() {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => requireTransfer(client).confirmImport(token),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useCancelProfileImport() {
  const client = useEvullyClient();
  return useMutation({
    mutationFn: (token: string) => requireTransfer(client).cancelImport(token),
  });
}
