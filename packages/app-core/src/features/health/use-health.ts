import type { HealthExamInput, UpdateHealthExamInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const examsKey = (profileId: string) => ['health-exams', profileId] as const;
const settingsKey = (profileId: string) => ['health-settings', profileId] as const;

/** Whether the profile turned the Saúde area on (README §24). */
export function useHealthSettings(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: settingsKey(profileId ?? ''),
    queryFn: () => client.health.settings(profileId ?? ''),
    enabled: profileId !== null,
  });
}

/** Turning it off only hides the area; the exams stay. */
export function useSetHealthEnabled(profileId: string) {
  const client = useEvullyClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => client.health.setEnabled(profileId, enabled),
    onSuccess: (settings) => queryClient.setQueryData(settingsKey(profileId), settings),
  });
}

export function useHealthExams(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: examsKey(profileId ?? ''),
    queryFn: () => client.health.list(profileId ?? ''),
    enabled: profileId !== null,
  });
}

function useExamMutation<TInput, TOutput>(
  profileId: string,
  run: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: examsKey(profileId) }),
  });
}

export function useRegisterHealthExam(profileId: string) {
  const client = useEvullyClient();
  return useExamMutation(profileId, (input: Omit<HealthExamInput, 'profileId'>) =>
    client.health.register({ profileId, ...input }),
  );
}

export function useUpdateHealthExam(profileId: string) {
  const client = useEvullyClient();
  return useExamMutation(profileId, (input: Omit<UpdateHealthExamInput, 'profileId'>) =>
    client.health.update({ profileId, ...input }),
  );
}

export function useDeleteHealthExam(profileId: string) {
  const client = useEvullyClient();
  return useExamMutation(profileId, (id: string) => client.health.remove(profileId, id));
}

/** The laboratory PDF (README §24.2); resolves to null when the dialog is cancelled. */
export function useAttachHealthDocument(profileId: string) {
  const client = useEvullyClient();
  return useExamMutation(profileId, (examId: string) =>
    client.health.attachDocument(profileId, examId),
  );
}

export function useRemoveHealthDocument(profileId: string) {
  const client = useEvullyClient();
  return useExamMutation(profileId, (id: string) => client.health.removeDocument(profileId, id));
}

/** Opens a temporary copy in the system PDF viewer. */
export function useOpenHealthDocument(profileId: string) {
  const client = useEvullyClient();
  return useMutation({ mutationFn: (id: string) => client.health.openDocument(profileId, id) });
}

/** Resolves to false when the save dialog is cancelled. */
export function useSaveHealthDocument(profileId: string) {
  const client = useEvullyClient();
  return useMutation({ mutationFn: (id: string) => client.health.saveDocument(profileId, id) });
}
