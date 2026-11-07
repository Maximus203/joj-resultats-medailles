import type { INestApplication } from '@nestjs/common';
import { podiumListSchema } from '@joj/shared';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestApp } from './create-test-app';

const event = (eventName: string, day: string) => ({
  eventName,
  discipline: 'Lutte',
  day,
  gold: 'SEN',
  silver: 'JPN',
  bronze: 'FRA',
});

describe('GET /api/podiums (e2e)', () => {
  let app: INestApplication;
  const record = (body: object) => request(app.getHttpServer()).post('/api/podiums').send(body);
  const list = (query = '') => request(app.getHttpServer()).get(`/api/podiums${query}`);
  const names = (body: unknown) => podiumListSchema.parse(body).items.map((p) => p.eventName);

  beforeEach(async () => {
    app = await createTestApp();
  });

  afterEach(() => app?.close());

  /** Enregistre les podiums avec un horloge qui avance d'une seconde à chaque fois. */
  async function seed() {
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      for (const [index, [name, day]] of [
        ['Lutte filles 52 kg', '2026-11-05'],
        ['Judo filles 48 kg', '2026-11-06'],
        ['Lutte garçons 60 kg', '2026-11-05'],
      ].entries()) {
        vi.setSystemTime(new Date('2026-11-05T18:00:00.000Z').getTime() + index * 1000);
        await record(event(name as string, day as string)).expect(201);
      }
    } finally {
      vi.useRealTimers();
    }
  }

  it('005-AS1: serves the podiums of a day (200)', async () => {
    await seed();

    const response = await list('?day=2026-11-05').expect(200);

    expect(names(response.body)).toEqual(['Lutte garçons 60 kg', 'Lutte filles 52 kg']);
    expect(podiumListSchema.parse(response.body).items[0]).toMatchObject({
      discipline: 'Lutte',
      day: '2026-11-05',
      gold: 'SEN',
      silver: 'JPN',
      bronze: 'FRA',
      correctedAt: null,
    });
  });

  it('005-AS2: serves every podium without a day', async () => {
    await seed();

    const response = await list().expect(200);

    expect(names(response.body)).toHaveLength(3);
  });

  it('005-AS3: serves the most recent first', async () => {
    await seed();

    const response = await list().expect(200);

    expect(names(response.body)).toEqual([
      'Lutte garçons 60 kg',
      'Judo filles 48 kg',
      'Lutte filles 52 kg',
    ]);
  });

  it('005-AS4: serves an empty list for a day without podium', async () => {
    await seed();

    const response = await list('?day=2026-11-12').expect(200);

    expect(response.body).toEqual({ items: [] });
  });

  it('rejects a malformed day (400)', async () => {
    const response = await list('?day=12-11-2026').expect(400);

    expect(response.body).toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});
