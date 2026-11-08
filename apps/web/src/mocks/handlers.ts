import {
  correctPodiumSchema,
  normalizeEventKey,
  listPodiumsQuerySchema,
  type PodiumResponse,
  type ProblemDetails,
  type PublishedPodium,
  recordPodiumSchema,
} from '@joj/shared';
import { delay, http, HttpResponse, type RequestHandler } from 'msw';
import type { z } from 'zod';
import { mockControl } from './control';
import { fixture } from './fixture';
import { computeMedalTable } from './medal-table';

/**
 * La fausse API des tests du front : le même contrat que apps/api (mêmes schémas zod, mêmes
 * codes d'erreur, même format RFC 9457), sur les données de `fixture.ts`. Une nouvelle route
 * de l'API s'ajoute ici (un `http.get`, `http.post`… par route), avec son test dans `handlers.test.ts`.
 */

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  500: 'Internal Server Error',
};

export function problem(
  status: number,
  code: string,
  detail: string,
  extra: Pick<ProblemDetails, 'errors' | 'details'> = {},
) {
  return HttpResponse.json(
    {
      type: `urn:problem-type:${code.toLowerCase().replaceAll('_', '-')}`,
      title: TITLES[status] ?? 'Error',
      status,
      code,
      detail,
      ...extra,
    } satisfies ProblemDetails,
    { status, headers: { 'content-type': 'application/problem+json' } },
  );
}

/** Latence, puis panne armée par `mockControl` : renvoie la réponse d'erreur, ou `null`. */
export async function gate(method: string, path: string): Promise<Response | null> {
  if (mockControl.latency > 0) await delay(mockControl.latency);
  const status = mockControl.takeFailure(`${method} ${path}`);
  return status === null ? null : problem(status, 'INTERNAL_ERROR', 'Mocked failure.');
}

export function validationFailed(error: z.ZodError) {
  return problem(400, 'VALIDATION_FAILED', 'The request is invalid.', {
    errors: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
  });
}

/** Même nettoyage que le domaine de l'API : espaces retirés aux extrémités et entre les mots. */
const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ');

function findPodium(id: string | readonly string[] | undefined): PublishedPodium | undefined {
  return fixture.podiums.find((podium) => podium.id === id);
}

function notFound() {
  return problem(404, 'PODIUM_NOT_FOUND', 'No podium has this identifier');
}

export const handlers: RequestHandler[] = [
  http.post('*/api/podiums', async ({ request }) => {
    const failure = await gate('POST', '/api/podiums');
    if (failure) return failure;
    const parsed = recordPodiumSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);
    const { gold, silver, bronze } = parsed.data;
    if (new Set([gold, silver, bronze]).size < 3) {
      return problem(
        422,
        'PODIUM_COUNTRIES_NOT_DISTINCT',
        'The gold, silver and bronze medallists must be three different countries',
      );
    }
    const eventName = cleanName(parsed.data.eventName);
    // Comme l'API : deux écritures d'une même épreuve (tiret, apostrophe, casse) n'en font qu'une.
    if (
      fixture.podiums.some((p) => normalizeEventKey(p.eventName) === normalizeEventKey(eventName))
    ) {
      return problem(
        409,
        'PODIUM_ALREADY_RECORDED',
        `A podium is already recorded for ${eventName}`,
        {
          details: { eventName },
        },
      );
    }
    const created: PodiumResponse = {
      ...parsed.data,
      eventName,
      discipline: parsed.data.discipline.trim(),
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    fixture.podiums.unshift({ ...created, correctedAt: null });
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get('*/api/medals', async () => {
    const failure = await gate('GET', '/api/medals');
    if (failure) return failure;
    return HttpResponse.json({ items: computeMedalTable(fixture.podiums) });
  }),

  http.get('*/api/podiums', async ({ request }) => {
    const failure = await gate('GET', '/api/podiums');
    if (failure) return failure;
    const query = listPodiumsQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!query.success) return validationFailed(query.error);
    const { day } = query.data;
    const items = day ? fixture.podiums.filter((p) => p.day === day) : fixture.podiums;
    return HttpResponse.json({ items });
  }),

  http.put('*/api/podiums/:id', async ({ request, params }) => {
    const failure = await gate('PUT', '/api/podiums/:id');
    if (failure) return failure;
    const current = findPodium(params['id']);
    if (!current) return notFound();
    const parsed = correctPodiumSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);
    const { gold, silver, bronze } = parsed.data;
    if (new Set([gold, silver, bronze]).size < 3) {
      return problem(
        422,
        'PODIUM_COUNTRIES_NOT_DISTINCT',
        'The gold, silver and bronze medallists must be three different countries',
      );
    }
    const identical =
      current.gold === gold && current.silver === silver && current.bronze === bronze;
    if (identical) return HttpResponse.json(current);
    const correctedAt = new Date().toISOString();
    const replaced = {
      gold: current.gold,
      silver: current.silver,
      bronze: current.bronze,
      correctedAt,
    };
    fixture.revisions.set(current.id, [replaced, ...(fixture.revisions.get(current.id) ?? [])]);
    Object.assign(current, { gold, silver, bronze, correctedAt });
    return HttpResponse.json(current);
  }),

  http.get('*/api/scraping', async () => {
    const failure = await gate('GET', '/api/scraping');
    if (failure) return failure;
    return HttpResponse.json(fixture.scraping);
  }),

  http.get('*/api/podiums/:id/revisions', async ({ params }) => {
    const failure = await gate('GET', '/api/podiums/:id/revisions');
    if (failure) return failure;
    const current = findPodium(params['id']);
    if (!current) return notFound();
    return HttpResponse.json({ items: fixture.revisions.get(current.id) ?? [] });
  }),
];
