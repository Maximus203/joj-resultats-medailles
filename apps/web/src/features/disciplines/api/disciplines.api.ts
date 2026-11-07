import {
  type CreateDisciplineInput,
  type DisciplineResponse,
  type UpdateDisciplineInput,
  disciplineListSchema,
  disciplineSchema,
} from '@joj/shared';
import { api } from '@/lib/api';

/**
 * Les appels HTTP de la fonctionnalité, sans React ni cache : un appel par route de l'API,
 * réponse validée par le schéma partagé. Le cache et les hooks sont dans `disciplines.queries.ts`.
 */
export const disciplinesApi = {
  list: (signal?: AbortSignal) =>
    api.request<DisciplineResponse[]>('/disciplines', { schema: disciplineListSchema, signal }),

  get: (id: string, signal?: AbortSignal) =>
    api.request<DisciplineResponse>(`/disciplines/${id}`, { schema: disciplineSchema, signal }),

  create: (input: CreateDisciplineInput) =>
    api.request<DisciplineResponse>('/disciplines', {
      method: 'POST',
      body: input,
      schema: disciplineSchema,
    }),

  update: (id: string, input: UpdateDisciplineInput) =>
    api.request<DisciplineResponse>(`/disciplines/${id}`, {
      method: 'PATCH',
      body: input,
      schema: disciplineSchema,
    }),

  remove: (id: string) => api.request<void>(`/disciplines/${id}`, { method: 'DELETE' }),
};
