import { problemDetailsSchema } from '@joj/shared';
import type { z } from 'zod';
import { ApiError } from './api-error';

export interface ApiClientOptions {
  /** `/api` en développement : Vite transmet à l'API. */
  baseUrl: string;
  /** Délai maximal d'une requête, 10 000 ms par défaut. */
  timeoutMs?: number;
}

export interface ApiRequest<T> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Schéma de la réponse (packages/shared) : une réponse non conforme lève INVALID_RESPONSE. */
  schema?: z.ZodType<T>;
  signal?: AbortSignal;
}

export interface ApiClient {
  request<T>(path: string, init?: ApiRequest<T>): Promise<T>;
}

const DEFAULT_TIMEOUT_MS = 10_000;

export function createApiClient(options: ApiClientOptions): ApiClient {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function request<T>(path: string, init: ApiRequest<T> = {}): Promise<T> {
    const headers = new Headers({ accept: 'application/json, application/problem+json' });
    if (init.body !== undefined) headers.set('content-type', 'application/json');
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;

    let response: Response;
    try {
      response = await fetch(buildUrl(options.baseUrl, path), {
        method: init.method ?? 'GET',
        headers,
        signal,
        ...(init.body !== undefined && { body: JSON.stringify(init.body) }),
      });
    } catch (error) {
      // Annulation demandée par l'appelant (TanStack Query) : ce n'est pas une erreur à afficher.
      if (init.signal?.aborted) throw error;
      throw transportError(error, timeoutMs);
    }

    if (!response.ok) throw await toApiError(response);
    if (response.status === 204) return undefined as T;

    const payload: unknown = await response.json().catch(() => undefined);
    if (!init.schema) return payload as T;
    const parsed = init.schema.safeParse(payload);
    if (!parsed.success) {
      throw new ApiError({
        status: response.status,
        code: 'INVALID_RESPONSE',
        title: 'Invalid response',
        detail: 'The response does not match the expected schema.',
        cause: parsed.error,
      });
    }
    return parsed.data;
  }

  return { request };
}

function buildUrl(baseUrl: string, path: string): string {
  const url = `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  // Une base relative (`/api`) se résout sur l'origine de la page.
  return new URL(url, globalThis.location?.origin).toString();
}

/** Corps problem+json de l'API, ou repli sur HTTP_ERROR (502 d'un proxy, corps vide…). */
async function toApiError(response: Response): Promise<ApiError> {
  const body: unknown = await response.json().catch(() => undefined);
  const problem = problemDetailsSchema.safeParse(body);
  if (problem.success) {
    const { code, title, detail, errors, details } = problem.data;
    return new ApiError({ status: response.status, code, title, detail, errors, details });
  }
  return new ApiError({
    status: response.status,
    code: 'HTTP_ERROR',
    title: response.statusText || 'HTTP error',
    detail: `The server answered with status ${response.status}.`,
  });
}

function transportError(error: unknown, timeoutMs: number): ApiError {
  if (error instanceof Error && error.name === 'TimeoutError') {
    return new ApiError({
      status: 0,
      code: 'TIMEOUT',
      title: 'Timeout',
      detail: `No response within ${timeoutMs} ms.`,
      cause: error,
    });
  }
  return new ApiError({
    status: 0,
    code: 'NETWORK_ERROR',
    title: 'Network error',
    detail: 'The server could not be reached.',
    cause: error,
  });
}
