import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, RouterContextProvider, RouterProvider } from '@tanstack/react-router';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createQueryClient } from '@/lib/api';
import { server } from '@/mocks/node';
import { createAppRouter } from '@/router';

/** QueryClient neuf pour chaque rendu, sans retry : une erreur s'affiche tout de suite. */
export function createTestQueryClient() {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  return queryClient;
}

/**
 * Rend un composant seul, avec ce que `main.tsx` lui donne : TanStack Query et un vrai router.
 * `RouterContextProvider` place le router dans le contexte sans faire correspondre de route :
 * `Link` et `useNavigate` fonctionnent (leurs adresses sont vérifiées sur les vraies routes),
 * mais la page affichée reste `ui`. Pour une page entière, `renderRoute`.
 */
export function renderWithProviders(ui: ReactNode) {
  const queryClient = createTestQueryClient();
  const router = createAppRouter(createMemoryHistory({ initialEntries: ['/'] }));
  return {
    queryClient,
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterContextProvider router={router}>{ui}</RouterContextProvider>
      </QueryClientProvider>,
    ),
  };
}

/**
 * Rend l'application comme `main.tsx`, à l'adresse donnée : routes, liens et navigation réels,
 * sur la fausse API (`mocks/handlers.ts`). `router.state.location` dit où l'on est arrivé.
 */
export async function renderRoute({ initialEntries }: { initialEntries: string[] }) {
  const queryClient = createTestQueryClient();
  const router = createAppRouter(createMemoryHistory({ initialEntries }));
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await router.load();
  return { queryClient, router, ...result };
}

export interface TrackedRequest {
  method: string;
  /** Le chemin, sans l'origine : `/api/disciplines/…`. */
  path: string;
  /** Le corps JSON envoyé, ou `undefined`. */
  body: unknown;
}

/**
 * Enregistre chaque requête qui part vers la fausse API, pour vérifier ce qui a vraiment
 * quitté le navigateur, pas seulement ce que l'écran affiche. Le corps est lu sur un clone :
 * le handler lit toujours l'original. Les écouteurs sont retirés après chaque test
 * (`test/setup.ts`).
 */
export function trackRequests(): TrackedRequest[] {
  const seen: TrackedRequest[] = [];
  server.events.on('request:start', async ({ request }) => {
    const entry: TrackedRequest = {
      method: request.method,
      path: new URL(request.url).pathname,
      body: undefined,
    };
    seen.push(entry);
    const text = await request.clone().text();
    if (text) entry.body = JSON.parse(text);
  });
  return seen;
}

/** Les requêtes qui modifient des données : ce qu'un test d'écran vérifie le plus souvent. */
export const writes = (seen: TrackedRequest[]) => seen.filter((r) => r.method !== 'GET');
