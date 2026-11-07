/**
 * Les hooks TanStack Query, sans composant : ce qu'ils envoient, et ce qu'ils invalident dans
 * le cache après une écriture. Un écran pourrait sembler juste avec une invalidation de trop
 * ou de moins ; c'est ici que la différence se voit.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { lutte, natation, UNKNOWN_ID } from '@/mocks/fixture';
import { createTestQueryClient, trackRequests } from '@/test/utils';
import {
  disciplineQueryOptions,
  disciplinesQueryOptions,
  useCreateDiscipline,
  useDeleteDiscipline,
  useUpdateDiscipline,
} from './disciplines.queries';

function makeWrapper() {
  const client = createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, Wrapper };
}

const isInvalidated = (client: ReturnType<typeof createTestQueryClient>, key: readonly unknown[]) =>
  client.getQueryState(key)?.isInvalidated;

describe('disciplines queries', () => {
  it('000-AS5: loads the list validated by the shared schema', async () => {
    const { client } = makeWrapper();
    await expect(client.fetchQuery(disciplinesQueryOptions())).resolves.toEqual([lutte, natation]);
  });

  it('000-AS1: useCreateDiscipline posts the input and invalidates the list', async () => {
    const { client, Wrapper } = makeWrapper();
    await client.ensureQueryData(disciplinesQueryOptions());
    const seen = trackRequests();

    const { result } = renderHook(() => useCreateDiscipline(), { wrapper: Wrapper });
    result.current.mutate({ name: 'Escrime', category: 'sports-de-combat' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(seen[0]).toEqual({
      method: 'POST',
      path: '/api/disciplines',
      body: { name: 'Escrime', category: 'sports-de-combat' },
    });
    expect(isInvalidated(client, disciplinesQueryOptions().queryKey)).toBe(true);
  });

  it('000-AS7: useUpdateDiscipline invalidates the list and the detail', async () => {
    const { client, Wrapper } = makeWrapper();
    await client.ensureQueryData(disciplinesQueryOptions());
    await client.ensureQueryData(disciplineQueryOptions(lutte.id));

    const { result } = renderHook(() => useUpdateDiscipline(), { wrapper: Wrapper });
    result.current.mutate({ id: lutte.id, input: { name: 'Lutte sénégalaise' } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(isInvalidated(client, disciplinesQueryOptions().queryKey)).toBe(true);
    expect(isInvalidated(client, disciplineQueryOptions(lutte.id).queryKey)).toBe(true);
  });

  /**
   * La page de détail quitte la discipline supprimée : relire son détail ferait un 404 pour
   * rien. Seule la liste est invalidée.
   */
  it('000-AS10: useDeleteDiscipline invalidates the list and leaves the detail alone', async () => {
    const { client, Wrapper } = makeWrapper();
    await client.ensureQueryData(disciplinesQueryOptions());
    await client.ensureQueryData(disciplineQueryOptions(lutte.id));

    const { result } = renderHook(() => useDeleteDiscipline(), { wrapper: Wrapper });
    result.current.mutate(lutte.id);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(isInvalidated(client, disciplinesQueryOptions().queryKey)).toBe(true);
    expect(isInvalidated(client, disciplineQueryOptions(lutte.id).queryKey)).toBe(false);
  });

  it('000-AS11: useDeleteDiscipline invalidates the list even when the deletion fails', async () => {
    const { client, Wrapper } = makeWrapper();
    await client.ensureQueryData(disciplinesQueryOptions());

    const { result } = renderHook(() => useDeleteDiscipline(), { wrapper: Wrapper });
    result.current.mutate(UNKNOWN_ID);
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toMatchObject({ status: 404, code: 'DISCIPLINE_NOT_FOUND' });
    expect(isInvalidated(client, disciplinesQueryOptions().queryKey)).toBe(true);
  });
});
