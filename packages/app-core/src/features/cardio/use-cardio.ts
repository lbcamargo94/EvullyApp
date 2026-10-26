import type { CardioInput, CardioTargetInput, UpdateCardioInput } from '@evully/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEvullyClient } from '../../client-context';

const key = (profileId: string) => ['cardio', profileId] as const;

export function useCardioOverview(profileId: string | null) {
  const client = useEvullyClient();
  return useQuery({
    queryKey: key(profileId ?? ''),
    queryFn: () => client.cardio.overview(profileId ?? ''),
    enabled: profileId !== null,
  });
}

function useCardioMutation<TInput, TOutput>(
  profileId: string,
  run: (input: TInput) => Promise<TOutput>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(profileId) }),
  });
}

export function useRegisterCardio(profileId: string) {
  const client = useEvullyClient();
  return useCardioMutation(profileId, (input: Omit<CardioInput, 'profileId'>) =>
    client.cardio.register({ profileId, ...input }),
  );
}

export function useUpdateCardio(profileId: string) {
  const client = useEvullyClient();
  return useCardioMutation(profileId, (input: Omit<UpdateCardioInput, 'profileId'>) =>
    client.cardio.update({ profileId, ...input }),
  );
}

export function useDeleteCardio(profileId: string) {
  const client = useEvullyClient();
  return useCardioMutation(profileId, (id: string) => client.cardio.remove(profileId, id));
}

export function useSetCardioTarget(profileId: string) {
  const client = useEvullyClient();
  return useCardioMutation(profileId, (input: Omit<CardioTargetInput, 'profileId'>) =>
    client.cardio.setTarget({ profileId, ...input }),
  );
}
