import type { INestApplication } from '@nestjs/common';
import { podiumRevisionListSchema, publishedPodiumSchema } from '@joj/shared';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestApp } from './create-test-app';

const wrestling = {
  eventName: 'Lutte filles 52 kg',
  discipline: 'Lutte',
  day: '2026-11-05',
  gold: 'SEN',
  silver: 'JPN',
  bronze: 'FRA',
};
const unknownId = '99999999-9999-4999-8999-999999999999';

describe('PUT /api/podiums/:id and GET /api/podiums/:id/revisions (e2e)', () => {
  let app: INestApplication;
  const http = () => request(app.getHttpServer());
  const correct = (id: string, body: object) => http().put(`/api/podiums/${id}`).send(body);
  const revisions = (id: string) => http().get(`/api/podiums/${id}/revisions`);

  async function publish(): Promise<string> {
    const response = await http().post('/api/podiums').send(wrestling).expect(201);
    return response.body.id as string;
  }

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(() => {
    vi.useRealTimers();
    return app?.close();
  });

  it('006-AS1: corrects a podium (200), dated, and the medal table follows', async () => {
    const id = await publish();

    const response = await correct(id, { gold: 'JPN', silver: 'SEN', bronze: 'FRA' }).expect(200);

    const podium = publishedPodiumSchema.parse(response.body);
    expect(podium).toMatchObject({
      id,
      eventName: 'Lutte filles 52 kg',
      gold: 'JPN',
      silver: 'SEN',
    });
    expect(podium.correctedAt).toEqual(expect.any(String));
    const listed = (await http().get('/api/podiums').expect(200)).body.items[0];
    expect(listed).toMatchObject({ id, gold: 'JPN', correctedAt: podium.correctedAt });
    const table = (await http().get('/api/medals').expect(200)).body.items;
    expect(table[0]).toMatchObject({ country: 'JPN', gold: 1, silver: 0 });
    expect(table[1]).toMatchObject({ country: 'SEN', gold: 0, silver: 1, bronze: 0 });
  });

  it('006-AS2: refuses a repeated country (422) and leaves the podium unchanged', async () => {
    const id = await publish();

    const response = await correct(id, { gold: 'SEN', silver: 'JPN', bronze: 'SEN' }).expect(422);

    expect(response.body).toMatchObject({ code: 'PODIUM_COUNTRIES_NOT_DISTINCT' });
    const listed = (await http().get('/api/podiums').expect(200)).body.items[0];
    expect(listed).toMatchObject({ gold: 'SEN', silver: 'JPN', bronze: 'FRA', correctedAt: null });
    expect((await revisions(id).expect(200)).body).toEqual({ items: [] });
  });

  it('006-AS3: refuses an unknown podium (404), for the correction and the revisions', async () => {
    const body = { gold: 'JPN', silver: 'SEN', bronze: 'FRA' };

    const put = await correct(unknownId, body).expect(404);
    const get = await revisions(unknownId).expect(404);

    expect(put.body).toMatchObject({ code: 'PODIUM_NOT_FOUND' });
    expect(get.body).toMatchObject({ code: 'PODIUM_NOT_FOUND' });
    await correct('not-a-uuid', body).expect(404);
    await revisions('not-a-uuid').expect(404);
  });

  it('006-AS4: serves the replaced versions, most recent first', async () => {
    const id = await publish();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-05T19:00:00.000Z'));
    await correct(id, { gold: 'JPN', silver: 'SEN', bronze: 'FRA' }).expect(200);
    vi.setSystemTime(new Date('2026-11-05T20:00:00.000Z'));
    await correct(id, { gold: 'JPN', silver: 'FRA', bronze: 'SEN' }).expect(200);

    const response = await revisions(id).expect(200);

    expect(podiumRevisionListSchema.parse(response.body).items).toEqual([
      { gold: 'JPN', silver: 'SEN', bronze: 'FRA', correctedAt: '2026-11-05T20:00:00.000Z' },
      { gold: 'SEN', silver: 'JPN', bronze: 'FRA', correctedAt: '2026-11-05T19:00:00.000Z' },
    ]);
  });

  it('006-AS5: accepts an identical correction (200) without revision', async () => {
    const id = await publish();

    const response = await correct(id, { gold: 'SEN', silver: 'JPN', bronze: 'FRA' }).expect(200);

    expect(response.body).toMatchObject({ id, gold: 'SEN', correctedAt: null });
    expect((await revisions(id).expect(200)).body).toEqual({ items: [] });
  });

  it('rejects an invalid correction body (400)', async () => {
    const id = await publish();

    const badCode = await correct(id, { gold: 'sen', silver: 'JPN', bronze: 'FRA' }).expect(400);
    const missing = await correct(id, { gold: 'SEN', silver: 'JPN' }).expect(400);

    expect(badCode.body).toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(missing.body).toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});
