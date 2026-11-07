import type { INestApplication } from '@nestjs/common';
import { medalTableSchema } from '@joj/shared';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from './create-test-app';

const event = (eventName: string, gold: string, silver: string, bronze: string) => ({
  eventName,
  discipline: 'Lutte',
  day: '2026-11-05',
  gold,
  silver,
  bronze,
});

describe('GET /api/medals (e2e)', () => {
  let app: INestApplication;
  const record = (body: object) => request(app.getHttpServer()).post('/api/podiums').send(body);
  const medals = () => request(app.getHttpServer()).get('/api/medals');

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(() => app?.close());

  it('004-AS1: serves the sorted table (200)', async () => {
    await record(event('Lutte filles 52 kg', 'SEN', 'JPN', 'FRA')).expect(201);
    await record(event('Lutte filles 57 kg', 'JPN', 'SEN', 'USA')).expect(201);
    await record(event('Lutte garçons 60 kg', 'SEN', 'FRA', 'JPN')).expect(201);

    const response = await medals().expect(200);

    expect(medalTableSchema.parse(response.body).items).toEqual([
      { rank: 1, country: 'SEN', gold: 2, silver: 1, bronze: 0 },
      { rank: 2, country: 'JPN', gold: 1, silver: 1, bronze: 1 },
      { rank: 3, country: 'FRA', gold: 0, silver: 1, bronze: 1 },
      { rank: 4, country: 'USA', gold: 0, silver: 0, bronze: 1 },
    ]);
  });

  it('004-AS3: serves an empty table (200) without podiums', async () => {
    const response = await medals().expect(200);

    expect(response.body).toEqual({ items: [] });
  });

  it('004-AS4: follows newly recorded podiums', async () => {
    await record(event('Lutte filles 52 kg', 'SEN', 'JPN', 'FRA')).expect(201);
    expect((await medals().expect(200)).body.items[0]).toMatchObject({ country: 'SEN', gold: 1 });

    await record(event('Lutte filles 57 kg', 'SEN', 'FRA', 'USA')).expect(201);

    const { items } = (await medals().expect(200)).body;
    expect(items[0]).toMatchObject({ rank: 1, country: 'SEN', gold: 2 });
  });
});
