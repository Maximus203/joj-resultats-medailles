/**
 * La fausse API tient le même contrat que apps/api : si elle s'en écarte, les tests du front
 * passent contre une API qui n'existe pas. Ces tests l'appellent avec `fetch`, sans React.
 */
import { describe, expect, it } from 'vitest';

const call = (path: string, init: RequestInit = {}) =>
  fetch(`http://localhost${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...init.headers },
  });

const json = (body: unknown) => JSON.stringify(body);

const wrestling = {
  eventName: 'Lutte filles 52 kg',
  discipline: 'Lutte',
  day: '2026-11-05',
  gold: 'SEN',
  silver: 'JPN',
  bronze: 'FRA',
};

const record = (body: object) => call('/api/podiums', { method: 'POST', body: json(body) });

describe('mock podiums API', () => {
  it('001-AS1: records a podium and answers 201 with the cleaned event name', async () => {
    const response = await record({ ...wrestling, eventName: '  Lutte   filles 52 kg ' });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      ...wrestling,
      id: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  it('001-AS2: refuses a second podium for the same event with a 409 PODIUM_ALREADY_RECORDED problem', async () => {
    await record(wrestling);

    const response = await record({
      ...wrestling,
      eventName: ' LUTTE filles 52 KG',
      gold: 'USA',
      silver: 'CHN',
      bronze: 'BRA',
    });

    expect(response.status).toBe(409);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    expect(await response.json()).toMatchObject({ code: 'PODIUM_ALREADY_RECORDED' });
  });

  it('001-AS3: refuses a repeated country with a 422 PODIUM_COUNTRIES_NOT_DISTINCT problem', async () => {
    const response = await record({ ...wrestling, gold: 'SEN', silver: 'SEN' });

    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({
      status: 422,
      title: 'Unprocessable Entity',
      code: 'PODIUM_COUNTRIES_NOT_DISTINCT',
    });
  });

  it('rejects an invalid body with a 400 VALIDATION_FAILED problem', async () => {
    const response = await record({ ...wrestling, gold: 'sen' });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [expect.objectContaining({ path: 'gold' })],
    });
  });
});
