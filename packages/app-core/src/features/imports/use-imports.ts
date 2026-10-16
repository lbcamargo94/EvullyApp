import type { ImportKind } from '@evully/contracts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

function requireImports(client: ReturnType<typeof useEvullyClient>) {
  if (!client.imports) throw new Error('CSV import is not available on this platform');
  return client.imports;
}

/** True where CSV import exists (desktop). */
export function useImportAvailable(): boolean {
  return useEvullyClient().imports !== undefined;
}

/** Opens the file dialog and returns the preview (null if cancelled). Nothing is written. */
export function usePreviewImport(profileId: string, kind: ImportKind) {
  const client = useEvullyClient();
  return useMutation({ mutationFn: () => requireImports(client).preview(profileId, kind) });
}

/** Writes the previewed rows, then refreshes the screens that show them. */
export function useConfirmImport(profileId: string) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => requireImports(client).confirm(profileId, token),
    onSuccess: () =>
      Promise.all(
        ['weights', 'measurements', 'tracking'].map((root) =>
          queryClient.invalidateQueries({ queryKey: [root, profileId] }),
        ),
      ),
  });
}

export function useCancelImport(profileId: string) {
  const client = useEvullyClient();
  return useMutation({
    mutationFn: (token: string) => requireImports(client).cancel(profileId, token),
  });
}

export function useSaveImportTemplate(profileId: string, kind: ImportKind) {
  const client = useEvullyClient();
  return useMutation({ mutationFn: () => requireImports(client).saveTemplate(profileId, kind) });
}
