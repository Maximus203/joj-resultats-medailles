import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-test-app';

describe('oversized request bodies (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(() => app?.close());

  it.each(['/api/scraping/runs', '/api/podiums'])(
    '007-AS5: answers 413 problem+json, not 500, to a huge body on POST %s',
    async (route) => {
      for (const size of [300_000, 5_000_000]) {
        const response = await request(app.getHttpServer())
          .post(route)
          .send({ eventName: 'x'.repeat(size) })
          .expect(413);

        expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
        expect(response.body).toMatchObject({
          status: 413,
          code: 'PAYLOAD_TOO_LARGE',
          detail: 'Le corps de la requête est trop volumineux.',
        });
      }
    },
  );
});
