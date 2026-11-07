import type { UpdateDisciplineInput } from '@joj/shared';
import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { disciplinesApi } from './disciplines.api';

/** Clés du cache TanStack Query pour cette fonctionnalité. */
export const disciplineKeys = {
  all: ['disciplines'] as const,
  list: () => [...disciplineKeys.all, 'list'] as const,
  detail: (id: string) => [...disciplineKeys.all, 'detail', id] as const,
};

export const disciplinesQueryOptions = () =>
  queryOptions({
    queryKey: disciplineKeys.list(),
    queryFn: ({ signal }) => disciplinesApi.list(signal),
  });

export const disciplineQueryOptions = (id: string) =>
  queryOptions({
    queryKey: disciplineKeys.detail(id),
    queryFn: ({ signal }) => disciplinesApi.get(id, signal),
  });

export const useDisciplines = () => useQuery(disciplinesQueryOptions());

export const useDiscipline = (id: string) => useQuery(disciplineQueryOptions(id));

export function useCreateDiscipline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disciplinesApi.create,
    // La liste est relue depuis l'API : elle reste triée par le serveur.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: disciplineKeys.list() }),
  });
}

export function useUpdateDiscipline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDisciplineInput }) =>
      disciplinesApi.update(id, input),
    // La liste et le détail : le nom ou la catégorie ont pu changer dans les deux.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: disciplineKeys.all }),
  });
}

export function useDeleteDiscipline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disciplinesApi.remove,
    // Même en échec (déjà supprimée par quelqu'un d'autre), la liste est relue. Le détail ne
    // l'est pas : sa page le quitte après la suppression.
    onSettled: () => queryClient.invalidateQueries({ queryKey: disciplineKeys.list() }),
  });
}
