import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Database } from '../src/core/database/database';
import { DATABASE } from '../src/core/database/database.module';
import { podiums } from '../src/modules/podiums/infra/podiums.schema';
import { createTestApp } from './create-test-app';

const wrestling = {
  eventName: 'Lutte filles 52 kg',
  discipline: 'Lutte',
  day: '2026-11-05',
  gold: 'SEN',
  silver: 'JPN',
  bronze: 'FRA',
};

describe('POST /api/podiums (e2e)', () => {
  let app: INestApplication;
  const record = (body: object) => request(app.getHttpServer()).post('/api/podiums').send(body);
  const storedPodiums = () => app.get<Database>(DATABASE).select().from(podiums);

  // Une base neuve par test : les podiums d'un test ne se mêlent pas à ceux d'un autre.
  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(() => app?.close());

  it('001-AS1: records a podium (201), event name cleaned', async () => {
    const response = await record({ ...wrestling, eventName: '  Lutte   filles 52 kg ' }).expect(
      201,
    );

    expect(response.body).toMatchObject(wrestling);
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.createdAt).toEqual(expect.any(String));
    const stored = await storedPodiums();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ ...wrestling, id: response.body.id });
  });

  it('001-AS2: refuses a second podium for the same event (409)', async () => {
    await record(wrestling).expect(201);

    const response = await record({
      ...wrestling,
      eventName: ' LUTTE filles 52 KG',
      gold: 'USA',
      silver: 'CHN',
      bronze: 'BRA',
    }).expect(409);

    expect(response.body).toMatchObject({ code: 'PODIUM_ALREADY_RECORDED' });
    const stored = await storedPodiums();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ gold: 'SEN', silver: 'JPN', bronze: 'FRA' });
  });

  it('001-AS3: refuses a repeated country (422)', async () => {
    const response = await record({ ...wrestling, gold: 'SEN', silver: 'SEN' }).expect(422);

    expect(response.body).toMatchObject({ code: 'PODIUM_COUNTRIES_NOT_DISTINCT' });
    expect(await storedPodiums()).toHaveLength(0);
  });

  it('rejects invalid input (400): empty name, bad country code, bad day, missing field', async () => {
    await record({ ...wrestling, eventName: '   ' }).expect(400);
    await record({ ...wrestling, discipline: '' }).expect(400);
    await record({ ...wrestling, gold: 'sen' }).expect(400);
    await record({ ...wrestling, bronze: 'FRAN' }).expect(400);
    await record({ ...wrestling, day: '05/11/2026' }).expect(400);
    await record({ eventName: 'Lutte', discipline: 'Lutte' }).expect(400);
    expect(await storedPodiums()).toHaveLength(0);
  });
});
