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

const podium = (
  eventName: string,
  gold: string,
  silver: string,
  bronze: string,
  day = '2026-11-05',
) => record({ eventName, discipline: 'Lutte', day, gold, silver, bronze });
const get = (path: string) => call(path);
const put = (path: string, body: object) => call(path, { method: 'PUT', body: json(body) });

describe('mock medals API', () => {
  it('004-AS1: counts and sorts medals by gold, then silver, then bronze', async () => {
    await podium('A', 'SEN', 'JPN', 'FRA');
    await podium('B', 'JPN', 'SEN', 'USA');
    await podium('C', 'SEN', 'FRA', 'JPN');
    const body = await (await get('/api/medals')).json();
    expect(body.items).toEqual([
      { rank: 1, country: 'SEN', gold: 2, silver: 1, bronze: 0 },
      { rank: 2, country: 'JPN', gold: 1, silver: 1, bronze: 1 },
      { rank: 3, country: 'FRA', gold: 0, silver: 1, bronze: 1 },
      { rank: 4, country: 'USA', gold: 0, silver: 0, bronze: 1 },
    ]);
  });

  it('004-AS2: gives two countries on equal medals the same rank, then skips', async () => {
    await podium('A', 'SEN', 'FRA', 'USA');
    await podium('B', 'JPN', 'GER', 'ITA');
    const { items } = await (await get('/api/medals')).json();
    expect(items.map((row: { rank: number }) => row.rank)).toEqual([1, 1, 3, 3, 5, 5]);
  });

  it('004-AS3: answers an empty table, not an error, when no podium exists', async () => {
    const response = await get('/api/medals');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [] });
  });
});

describe('mock podium listing API', () => {
  it('005-AS1: lists the podiums of one day', async () => {
    await podium('A', 'SEN', 'JPN', 'FRA', '2026-11-05');
    await podium('B', 'USA', 'CHN', 'BRA', '2026-11-06');
    const { items } = await (await get('/api/podiums?day=2026-11-06')).json();
    expect(items.map((p: { eventName: string }) => p.eventName)).toEqual(['B']);
  });

  it('005-AS2: lists every podium without a day', async () => {
    await podium('A', 'SEN', 'JPN', 'FRA', '2026-11-05');
    await podium('B', 'USA', 'CHN', 'BRA', '2026-11-06');
    const { items } = await (await get('/api/podiums')).json();
    expect(items).toHaveLength(2);
  });

  it('005-AS3: lists the most recent podium first', async () => {
    await podium('A', 'SEN', 'JPN', 'FRA');
    await podium('B', 'USA', 'CHN', 'BRA');
    const { items } = await (await get('/api/podiums')).json();
    expect(items.map((p: { eventName: string }) => p.eventName)).toEqual(['B', 'A']);
  });

  it('005-AS4: answers an empty list for a day without podium', async () => {
    const response = await get('/api/podiums?day=2026-11-09');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [] });
  });
});

describe('mock podium correction API', () => {
  const create = async () =>
    (await (await podium('Lutte filles 52 kg', 'SEN', 'FRA', 'JPN')).json()).id;

  it('006-AS1: corrects a podium and dates the correction', async () => {
    const id = await create();
    const response = await put(`/api/podiums/${id}`, { gold: 'SEN', silver: 'JPN', bronze: 'FRA' });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id,
      silver: 'JPN',
      bronze: 'FRA',
      correctedAt: expect.any(String),
    });
  });

  it('006-AS2: refuses a repeated country with a 422 problem', async () => {
    const id = await create();
    const response = await put(`/api/podiums/${id}`, { gold: 'SEN', silver: 'JPN', bronze: 'JPN' });
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ code: 'PODIUM_COUNTRIES_NOT_DISTINCT' });
  });

  it('006-AS3: refuses an unknown podium with a 404 problem, for the correction and the history', async () => {
    const id = crypto.randomUUID();
    const correction = await put(`/api/podiums/${id}`, {
      gold: 'SEN',
      silver: 'JPN',
      bronze: 'FRA',
    });
    expect(correction.status).toBe(404);
    expect(await correction.json()).toMatchObject({ code: 'PODIUM_NOT_FOUND' });
    expect((await get(`/api/podiums/${id}/revisions`)).status).toBe(404);
  });

  it('006-AS4: keeps the replaced versions, most recent first', async () => {
    const id = await create();
    await put(`/api/podiums/${id}`, { gold: 'SEN', silver: 'JPN', bronze: 'FRA' });
    await put(`/api/podiums/${id}`, { gold: 'JPN', silver: 'SEN', bronze: 'FRA' });
    const { items } = await (await get(`/api/podiums/${id}/revisions`)).json();
    expect(items).toMatchObject([
      { gold: 'SEN', silver: 'JPN', bronze: 'FRA' },
      { gold: 'SEN', silver: 'FRA', bronze: 'JPN' },
    ]);
  });

  it('006-AS5: accepts an identical correction without a new revision', async () => {
    const id = await create();
    const response = await put(`/api/podiums/${id}`, { gold: 'SEN', silver: 'FRA', bronze: 'JPN' });
    expect(response.status).toBe(200);
    const { items } = await (await get(`/api/podiums/${id}/revisions`)).json();
    expect(items).toEqual([]);
  });
});
