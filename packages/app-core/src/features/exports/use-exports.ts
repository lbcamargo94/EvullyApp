import type { ExportFormat } from '@evully/contracts';
import { useMutation } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

/** True where the profile export exists (desktop). */
export function useExportAvailable(): boolean {
  return useEvullyClient().exports !== undefined;
}

/** Opens the save dialog and writes the export; resolves to null when cancelled. */
export function useExportProfile(profileId: string) {
  const client = useEvullyClient();
  return useMutation({
    mutationFn: (format: ExportFormat) => {
      if (!client.exports) throw new Error('Export is not available on this platform');
      return client.exports.create(profileId, format);
    },
  });
}
