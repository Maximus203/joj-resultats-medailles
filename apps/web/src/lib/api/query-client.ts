import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-error';

const STALE_TIME_MS = 30_000;
const MAX_QUERY_RETRIES = 3;

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        retry: (failureCount, error) => {
          // Une erreur 4xx ou une réponse non conforme se reproduirait à l'identique.
          if (error instanceof ApiError) {
            if (error.status >= 400 && error.status < 500) return false;
            if (error.code === 'INVALID_RESPONSE') return false;
          }
          return failureCount < MAX_QUERY_RETRIES;
        },
      },
      mutations: { retry: 0 },
    },
  });
}
