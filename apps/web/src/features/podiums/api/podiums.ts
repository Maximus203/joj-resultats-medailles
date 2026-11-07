import {
  type CorrectPodiumInput,
  podiumListSchema,
  podiumRevisionListSchema,
  podiumSchema,
  publishedPodiumSchema,
  type RecordPodiumInput,
} from '@joj/shared';
import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { medalKeys, podiumKeys } from '@/lib/query-keys';

/** Les podiums d'un jour, ou de tous les jours sans `day`. Plus récents d'abord (contrat de l'API). */
export function usePodiums(day?: string) {
  return useQuery({
    queryKey: podiumKeys.list(day),
    queryFn: ({ signal }) =>
      api.request(day ? `/podiums?day=${encodeURIComponent(day)}` : '/podiums', {
        schema: podiumListSchema,
        signal,
      }),
    select: (data) => data.items,
  });
}

/** Les versions remplacées d'un podium, la plus récente d'abord. Lues à l'ouverture de l'historique. */
export function usePodiumRevisions(id: string) {
  return useQuery({
    queryKey: podiumKeys.revisions(id),
    queryFn: ({ signal }) =>
      api.request(`/podiums/${encodeURIComponent(id)}/revisions`, {
        schema: podiumRevisionListSchema,
        signal,
      }),
    select: (data) => data.items,
  });
}

/** Un podium enregistré ou corrigé change le tableau des médailles, les résultats et l'historique. */
function refreshAfterWrite(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: podiumKeys.all }),
    queryClient.invalidateQueries({ queryKey: medalKeys.all }),
  ]);
}

export function useRecordPodium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPodiumInput) =>
      api.request('/podiums', { method: 'POST', body: input, schema: podiumSchema }),
    onSuccess: () => refreshAfterWrite(queryClient),
  });
}

export function useCorrectPodium(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CorrectPodiumInput) =>
      api.request(`/podiums/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: input,
        schema: publishedPodiumSchema,
      }),
    onSuccess: () => refreshAfterWrite(queryClient),
  });
}
