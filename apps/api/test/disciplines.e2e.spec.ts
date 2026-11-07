import type { INestApplication } from '@nestjs/common';
import { disciplineListSchema, disciplineSchema } from '@joj/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-test-app';

describe('/api/disciplines (e2e)', () => {
  let app: INestApplication;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(() => app?.close());

  it('000-AS1: creates a valid discipline (201) and returns it', async () => {
    const response = await api()
      .post('/api/disciplines')
      .send({ name: ' Lutte ', category: 'sports-de-combat' })
      .expect(201);

    expect(disciplineSchema.parse(response.body)).toMatchObject({
      name: 'Lutte',
      category: 'sports-de-combat',
    });
  });

  it('000-AS2: rejects a discipline without a name (400, RFC 9457)', async () => {
    const response = await api()
      .post('/api/disciplines')
      .send({ name: '', category: 'athletisme' })
      .expect(400);

    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path: 'name' })]);
  });

  it('000-AS3: rejects a category outside the list (400)', async () => {
    const response = await api()
      .post('/api/disciplines')
      .send({ name: 'Échecs', category: 'jeux' })
      .expect(400);

    expect(response.body.errors).toEqual([expect.objectContaining({ path: 'category' })]);
  });

  it('000-AS4: rejects a name already taken (409)', async () => {
    const body = { name: 'Natation', category: 'sports-nautiques' };
    await api().post('/api/disciplines').send(body).expect(201);

    const response = await api().post('/api/disciplines').send(body).expect(409);
    expect(response.body).toMatchObject({
      status: 409,
      code: 'DISCIPLINE_NAME_TAKEN',
      details: { name: 'Natation' },
    });
  });

  it('000-AS5: lists disciplines sorted by name', async () => {
    await api().post('/api/disciplines').send({ name: 'Athletisme', category: 'athletisme' });

    const response = await api().get('/api/disciplines').expect(200);
    const names = disciplineListSchema.parse(response.body).map((discipline) => discipline.name);
    expect(names).toEqual(['Athletisme', 'Lutte', 'Natation']);
  });
});
