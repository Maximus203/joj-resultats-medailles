import { medalTableSchema } from '@joj/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { medalKeys } from '@/lib/query-keys';

/** Le tableau des médailles : une ligne par pays, déjà classé par l'API. */
export function useMedals() {
  return useQuery({
    queryKey: medalKeys.all,
    queryFn: ({ signal }) => api.request('/medals', { schema: medalTableSchema, signal }),
    select: (data) => data.items,
  });
}
