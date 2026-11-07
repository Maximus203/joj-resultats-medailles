import { createApiClient } from './api-client';

/** Client de l'application : `/api` est transmis à l'API par Vite (vite.config.mts). */
export const api = createApiClient({ baseUrl: '/api' });
