import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { server } from '@/mocks/node';
import { createApiClient } from './api-client';
import { ApiError } from './api-error';

const api = createApiClient({ baseUrl: '/api' });

describe('createApiClient', () => {
  it('returns the response validated by its schema', async () => {
    server.use(http.get('*/api/ping', () => HttpResponse.json({ pong: true })));
    await expect(
      api.request('/ping', { schema: z.object({ pong: z.boolean() }) }),
    ).resolves.toEqual({ pong: true });
  });

  it('throws INVALID_RESPONSE when the response does not match the schema', async () => {
    server.use(http.get('*/api/ping', () => HttpResponse.json({ pong: 'oui' })));
    await expect(
      api.request('/ping', { schema: z.object({ pong: z.boolean() }) }),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('turns a problem+json into an ApiError, with its code and details', async () => {
    server.use(
      http.post('*/api/things', () =>
        HttpResponse.json(
          {
            type: 'urn:problem-type:thing-taken',
            title: 'Conflict',
            status: 409,
            code: 'THING_TAKEN',
            detail: 'Already exists',
            details: { name: 'x' },
          },
          { status: 409, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const error = await api.request('/things', { method: 'POST', body: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'THING_TAKEN', details: { name: 'x' } });
  });

  it('falls back to HTTP_ERROR when the body is not a problem+json', async () => {
    server.use(http.get('*/api/ping', () => new HttpResponse('Bad gateway', { status: 502 })));
    await expect(api.request('/ping')).rejects.toMatchObject({ status: 502, code: 'HTTP_ERROR' });
  });

  it('throws NETWORK_ERROR when the server is unreachable', async () => {
    server.use(http.get('*/api/ping', () => HttpResponse.error()));
    await expect(api.request('/ping')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });
});
