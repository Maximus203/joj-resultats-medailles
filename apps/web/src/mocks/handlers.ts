import {
  createDisciplineSchema,
  type DisciplineResponse,
  type ProblemDetails,
  updateDisciplineSchema,
} from '@joj/shared';
import { delay, http, HttpResponse } from 'msw';
import type { z } from 'zod';
import { mockControl } from './control';
import { fixture } from './fixture';

/**
 * La fausse API des tests du front : le même contrat que apps/api (mêmes schémas zod, mêmes
 * codes d'erreur, même format RFC 9457), sur les données de `fixture.ts`. Une nouvelle route
 * de l'API s'ajoute ici, avec son test dans `handlers.test.ts`.
 */

const TITLES: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
};

function problem(
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
async function gate(method: string, path: string): Promise<Response | null> {
  if (mockControl.latency > 0) await delay(mockControl.latency);
  const status = mockControl.takeFailure(`${method} ${path}`);
  return status === null ? null : problem(status, 'INTERNAL_ERROR', 'Mocked failure.');
}

function validationFailed(error: z.ZodError) {
  return problem(400, 'VALIDATION_FAILED', 'The request is invalid.', {
    errors: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
  });
}

const notFound = (id: string) =>
  problem(404, 'DISCIPLINE_NOT_FOUND', `No discipline with id ${id}`, { details: { id } });

const nameTaken = (name: string) =>
  problem(409, 'DISCIPLINE_NAME_TAKEN', `A discipline named ${name} already exists`, {
    details: { name },
  });

const byName = (a: DisciplineResponse, b: DisciplineResponse) =>
  a.name < b.name ? -1 : a.name > b.name ? 1 : 0;

const findDiscipline = (id: string) => fixture.disciplines.find((d) => d.id === id);

export const handlers = [
  http.get('*/api/disciplines', async () => {
    const failure = await gate('GET', '/api/disciplines');
    if (failure) return failure;
    return HttpResponse.json([...fixture.disciplines].sort(byName));
  }),

  http.post('*/api/disciplines', async ({ request }) => {
    const failure = await gate('POST', '/api/disciplines');
    if (failure) return failure;
    const parsed = createDisciplineSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);
    if (fixture.disciplines.some((d) => d.name === parsed.data.name)) {
      return nameTaken(parsed.data.name);
    }
    const created: DisciplineResponse = {
      ...parsed.data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    fixture.disciplines.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get('*/api/disciplines/:id', async ({ params }) => {
    const failure = await gate('GET', '/api/disciplines/:id');
    if (failure) return failure;
    const id = String(params['id']);
    const found = findDiscipline(id);
    return found ? HttpResponse.json(found) : notFound(id);
  }),

  http.patch('*/api/disciplines/:id', async ({ params, request }) => {
    const failure = await gate('PATCH', '/api/disciplines/:id');
    if (failure) return failure;
    const id = String(params['id']);
    const found = findDiscipline(id);
    if (!found) return notFound(id);
    const parsed = updateDisciplineSchema.safeParse(await request.json());
    if (!parsed.success) return validationFailed(parsed.error);
    const updated = { ...found, ...parsed.data };
    if (fixture.disciplines.some((d) => d.name === updated.name && d.id !== id)) {
      return nameTaken(updated.name);
    }
    fixture.disciplines = fixture.disciplines.map((d) => (d.id === id ? updated : d));
    return HttpResponse.json(updated);
  }),

  http.delete('*/api/disciplines/:id', async ({ params }) => {
    const failure = await gate('DELETE', '/api/disciplines/:id');
    if (failure) return failure;
    const id = String(params['id']);
    if (!findDiscipline(id)) return notFound(id);
    fixture.disciplines = fixture.disciplines.filter((d) => d.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),
];
