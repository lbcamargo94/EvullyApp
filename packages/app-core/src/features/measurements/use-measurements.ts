import type { MeasurementInput, UpdateMeasurementInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const keys = {
  all: (profileId: string) => ['measurements', profileId] as const,
  list: (profileId: string) => ['measurements', profileId, 'list'] as const,
  summary: (profileId: string) => ['measurements', profileId, 'summary'] as const,
};

export function useMeasurements(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: keys.list(profileId ?? ''),
    queryFn: () => client.measurements.list(profileId ?? ''),
    enabled: profileId !== null,
  });
}

export function useMeasurementSummary(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: keys.summary(profileId ?? ''),
    queryFn: () => client.measurements.summary(profileId ?? ''),
    enabled: profileId !== null,
  });
}

function useMeasurementMutation<TInput>(
  profileId: string,
  run: (input: TInput) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all(profileId) }),
  });
}

export function useRegisterMeasurement(profileId: string) {
  const client = useEvullyClient();
  return useMeasurementMutation(profileId, (input: MeasurementInput) =>
    client.measurements.register(input),
  );
}

export function useUpdateMeasurement(profileId: string) {
  const client = useEvullyClient();
  return useMeasurementMutation(profileId, (input: UpdateMeasurementInput) =>
    client.measurements.update(input),
  );
}

export function useDeleteMeasurement(profileId: string) {
  const client = useEvullyClient();
  return useMeasurementMutation(profileId, (id: string) =>
    client.measurements.remove(profileId, id),
  );
}
