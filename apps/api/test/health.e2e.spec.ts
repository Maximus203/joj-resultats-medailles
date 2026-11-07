import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-test-app';

describe('GET /api/health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(() => app?.close());

  it('answers ok, with the database mode', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', database: 'pglite' });
  });

  it('answers with RFC 9457 on an unknown route', async () => {
    const response = await request(app.getHttpServer()).get('/api/inconnue').expect(404);
    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      instance: '/api/inconnue',
    });
  });
});
