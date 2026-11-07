import { z } from 'zod';

/** Corps d'erreur de l'API (RFC 9457, application/problem+json), enrichi d'un `code` stable. */
export const problemDetailsSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  code: z.string(),
  instance: z.string().optional(),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
